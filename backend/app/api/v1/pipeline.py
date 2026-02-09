"""
Pipeline API Routes - Document processing pipeline endpoints
"""
import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_internal_team
from app.models.user import User
from app.models.document_pipeline import PipelineStep, DocumentStatus, TaskStatus
from app.services.pipeline_service import PipelineService
from app.schemas.pipeline import (
    DocumentCreate, DocumentUpdate, DocumentResponse, DocumentListResponse,
    ExtractedTextCreate, ExtractedTextUpdate, ExtractedTextResponse,
    ChunksCreate, ChunkUpdate, ChunkResponse,
    DocumentMetadataCreate, DocumentMetadataUpdate, DocumentMetadataResponse,
    SummarizationCreate, SummarizationResponse,
    TaskAssign, TaskUpdate, TaskComplete, TaskRevision, PipelineTaskResponse, MyTasksResponse,
    QAReviewCreate, QAReviewResponse,
    PublishRequest, PublishedDocumentResponse,
    PipelineStats, PipelineStepEnum, DocumentStatusEnum, TaskStatusEnum
)
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/pipeline", tags=["Document Pipeline"])

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt"}
UPLOAD_DIR = "uploads/documents"


# ========== Document Upload & Management ==========

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    priority: int = Form(5),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Upload a new document to start the processing pipeline"""
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Create upload directory if not exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create document record
    service = PipelineService(db)
    document = await service.create_document(
        filename=file.filename,
        file_path=file_path,
        file_type=file_ext[1:],  # Remove dot
        file_size=file_size,
        uploaded_by_id=current_user.id,
        title=title,
        description=description,
        category=category,
        priority=priority
    )
    
    return document


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    status: Optional[DocumentStatusEnum] = None,
    step: Optional[PipelineStepEnum] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """List all documents with optional filters"""
    service = PipelineService(db)
    
    # Convert enum strings to actual enums if provided
    db_status = DocumentStatus(status.value) if status else None
    db_step = PipelineStep(step.value) if step else None
    
    documents, total = await service.get_documents(
        status=db_status,
        step=db_step,
        category=category,
        page=page,
        page_size=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return DocumentListResponse(
        documents=documents,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get document details"""
    service = PipelineService(db)
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/documents/{document_id}/file")
async def get_document_file(
    document_id: int,
    token: Optional[str] = Query(None, description="Auth token for inline viewing"),
    db: AsyncSession = Depends(get_db),
):
    """Serve the original document file inline for viewing.
    Accepts token as query param since iframes/fetch may not send auth headers."""
    # Verify auth via query param token
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    from jose import jwt, JWTError
    from app.core.config import settings
    from sqlalchemy import select
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    service = PipelineService(db)
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    # Map file types to MIME types
    mime_types = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'odt': 'application/vnd.oasis.opendocument.text',
    }
    media_type = mime_types.get(document.file_type, 'application/octet-stream')

    return FileResponse(
        path=document.file_path,
        media_type=media_type,
        filename=document.original_filename,
        content_disposition_type="inline"  # Display in browser, don't download
    )


@router.patch("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    update_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Update document details"""
    service = PipelineService(db)
    document = await service.update_document(
        document_id,
        **update_data.model_dump(exclude_unset=True)
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Delete a document and all its related data"""
    service = PipelineService(db)
    success = await service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


# ========== Text Extraction ==========

@router.post("/documents/{document_id}/extract", response_model=ExtractedTextResponse)
async def save_extracted_text(
    document_id: int,
    data: ExtractedTextCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Save extracted text for a document"""
    service = PipelineService(db)
    
    # Verify document exists
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    extracted = await service.save_extracted_text(
        document_id=document_id,
        raw_text=data.raw_text,
        cleaned_text=data.cleaned_text,
        extraction_method=data.extraction_method,
        confidence_score=data.confidence_score,
        processed_by_id=current_user.id
    )
    
    # Complete the task
    tasks = await service.get_user_tasks(current_user.id)
    for task in tasks.get("in_progress", []):
        if task.document_id == document_id and task.step == PipelineStep.TEXT_EXTRACTION:
            await service.complete_task(task.id, current_user.id)
            break
    
    return extracted


@router.get("/documents/{document_id}/extract", response_model=ExtractedTextResponse)
async def get_extracted_text(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get extracted text for a document"""
    service = PipelineService(db)
    extracted = await service.get_extracted_text(document_id)
    if not extracted:
        raise HTTPException(status_code=404, detail="Extracted text not found")
    return extracted


# ========== Chunking ==========

@router.post("/documents/{document_id}/chunks", response_model=List[ChunkResponse])
async def save_chunks(
    document_id: int,
    data: ChunksCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Save chunks for a document"""
    service = PipelineService(db)
    
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    chunks = await service.save_chunks(
        document_id=document_id,
        chunks=[c.model_dump() for c in data.chunks],
        processed_by_id=current_user.id
    )
    
    return chunks


@router.get("/documents/{document_id}/chunks", response_model=List[ChunkResponse])
async def get_chunks(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get all chunks for a document"""
    service = PipelineService(db)
    chunks = await service.get_chunks(document_id)
    return chunks


@router.patch("/chunks/{chunk_id}", response_model=ChunkResponse)
async def update_chunk(
    chunk_id: int,
    data: ChunkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Update a specific chunk"""
    service = PipelineService(db)
    chunk = await service.update_chunk(chunk_id, **data.model_dump(exclude_unset=True))
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk


# ========== Metadata ==========

@router.post("/documents/{document_id}/metadata", response_model=DocumentMetadataResponse)
async def save_metadata(
    document_id: int,
    data: DocumentMetadataCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Save metadata for a document"""
    service = PipelineService(db)
    
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    metadata = await service.save_metadata(
        document_id=document_id,
        metadata=data.model_dump(exclude_unset=True),
        processed_by_id=current_user.id
    )
    
    return metadata


@router.get("/documents/{document_id}/metadata", response_model=DocumentMetadataResponse)
async def get_metadata(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get metadata for a document"""
    service = PipelineService(db)
    metadata = await service.get_metadata(document_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata


# ========== Summarization ==========

@router.post("/documents/{document_id}/summarize", response_model=SummarizationResponse)
async def save_summary(
    document_id: int,
    data: SummarizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Save summary for a document"""
    service = PipelineService(db)
    
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    metadata = await service.save_summary(
        document_id=document_id,
        summary=data.summary,
        key_points=data.key_points,
        chunk_summaries=data.chunk_summaries,
        processed_by_id=current_user.id
    )
    
    return SummarizationResponse(
        document_id=document_id,
        summary=metadata.summary,
        key_points=metadata.key_points
    )


# ========== QA Review ==========

@router.post("/documents/{document_id}/qa-review", response_model=QAReviewResponse)
async def create_qa_review(
    document_id: int,
    data: QAReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Create a QA review for a document"""
    service = PipelineService(db)
    
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    review = await service.create_qa_review(
        document_id=document_id,
        reviewer_id=current_user.id,
        review_data=data.model_dump()
    )
    
    return review


@router.get("/documents/{document_id}/qa-reviews", response_model=List[QAReviewResponse])
async def get_qa_reviews(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get all QA reviews for a document"""
    service = PipelineService(db)
    reviews = await service.get_qa_reviews(document_id)
    return reviews


# ========== Publish ==========

@router.post("/documents/{document_id}/publish", response_model=PublishedDocumentResponse)
async def publish_document(
    document_id: int,
    data: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Publish a document to the legal database"""
    service = PipelineService(db)
    
    document = await service.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify document is QA approved
    if document.status != DocumentStatus.QA_APPROVED:
        raise HTTPException(
            status_code=400,
            detail="Document must be QA approved before publishing"
        )
    
    published = await service.publish_document(
        document_id=document_id,
        published_by_id=current_user.id,
        search_keywords=data.search_keywords,
        search_weight=data.search_weight
    )
    
    return published


# ========== Task Management ==========

@router.get("/tasks/my", response_model=MyTasksResponse)
async def get_my_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get all tasks assigned to current user"""
    service = PipelineService(db)
    tasks = await service.get_user_tasks(current_user.id)
    return MyTasksResponse(**tasks)


@router.get("/tasks/available", response_model=List[PipelineTaskResponse])
async def get_available_tasks(
    step: Optional[PipelineStepEnum] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get unassigned tasks available for pickup"""
    service = PipelineService(db)
    db_step = PipelineStep(step.value) if step else None
    tasks = await service.get_available_tasks(step=db_step)
    return tasks


@router.post("/tasks/{task_id}/assign", response_model=PipelineTaskResponse)
async def assign_task(
    task_id: int,
    data: TaskAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Assign a task to a user"""
    service = PipelineService(db)
    
    # Get task to find document_id and step
    from sqlalchemy import select
    from app.models.document_pipeline import PipelineTask
    result = await db.execute(select(PipelineTask).where(PipelineTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = await service.assign_task(
        document_id=task.document_id,
        step=task.step,
        assigned_to_id=data.assigned_to_id,
        assigned_by_id=current_user.id,
        notes=data.notes,
        estimated_time=data.estimated_time_minutes
    )
    
    return updated_task


@router.post("/tasks/{task_id}/pickup", response_model=PipelineTaskResponse)
async def pickup_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Pick up an unassigned task"""
    service = PipelineService(db)
    
    from sqlalchemy import select
    from app.models.document_pipeline import PipelineTask
    result = await db.execute(select(PipelineTask).where(PipelineTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.assigned_to_id:
        raise HTTPException(status_code=400, detail="Task is already assigned")
    
    updated_task = await service.assign_task(
        document_id=task.document_id,
        step=task.step,
        assigned_to_id=current_user.id,
        assigned_by_id=current_user.id
    )
    
    return updated_task


@router.post("/tasks/{task_id}/start", response_model=PipelineTaskResponse)
async def start_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Start working on a task"""
    service = PipelineService(db)
    try:
        task = await service.start_task(task_id, current_user.id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/tasks/{task_id}/complete", response_model=PipelineTaskResponse)
async def complete_task(
    task_id: int,
    data: TaskComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Mark a task as complete"""
    service = PipelineService(db)
    task = await service.complete_task(
        task_id=task_id,
        user_id=current_user.id,
        output_data=data.output_data,
        notes=data.notes,
        actual_time=data.actual_time_minutes
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/{task_id}/revision", response_model=PipelineTaskResponse)
async def request_task_revision(
    task_id: int,
    data: TaskRevision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Request revision for a task"""
    service = PipelineService(db)
    task = await service.request_revision(
        task_id=task_id,
        reason=data.reason,
        notes=data.notes
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ========== Statistics ==========

@router.get("/stats", response_model=PipelineStats)
async def get_pipeline_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_internal_team)
):
    """Get pipeline statistics for dashboard"""
    service = PipelineService(db)
    stats = await service.get_pipeline_stats()
    return PipelineStats(**stats)
