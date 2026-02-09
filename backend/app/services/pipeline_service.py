"""
Pipeline Service - Business logic for document processing pipeline
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document_pipeline import (
    Document, DocumentStatus, TaskStatus, PipelineStep,
    ExtractedText, DocumentChunk, PipelineTask, QAReview,
    DocumentMetadata, PublishedDocument
)
from app.models.user import User, UserRole
from app.core.config import settings


class PipelineService:
    """Service for managing document processing pipeline"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ========== Document Operations ==========
    
    async def create_document(
        self,
        filename: str,
        file_path: str,
        file_type: str,
        file_size: int,
        uploaded_by_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        priority: int = 5
    ) -> Document:
        """Create a new document and initialize pipeline tasks"""
        document = Document(
            original_filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            uploaded_by_id=uploaded_by_id,
            title=title or filename,
            description=description,
            category=category,
            priority=priority,
            current_step=PipelineStep.UPLOAD,
            status=DocumentStatus.UPLOADED
        )
        self.db.add(document)
        await self.db.flush()
        
        # Create initial upload task as completed
        upload_task = PipelineTask(
            document_id=document.id,
            step=PipelineStep.UPLOAD,
            status=TaskStatus.COMPLETED,
            assigned_to_id=uploaded_by_id,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        self.db.add(upload_task)
        
        # Create pending task for next step
        extraction_task = PipelineTask(
            document_id=document.id,
            step=PipelineStep.TEXT_EXTRACTION,
            status=TaskStatus.PENDING
        )
        self.db.add(extraction_task)
        
        await self.db.commit()
        await self.db.refresh(document)
        return document
    
    async def get_document(self, document_id: int) -> Optional[Document]:
        """Get document by ID with all related data"""
        result = await self.db.execute(
            select(Document)
            .options(
                selectinload(Document.extracted_text),
                selectinload(Document.chunks),
                selectinload(Document.pipeline_tasks),
                selectinload(Document.qa_reviews)
            )
            .where(Document.id == document_id)
        )
        return result.scalar_one_or_none()
    
    async def get_documents(
        self,
        status: Optional[DocumentStatus] = None,
        step: Optional[PipelineStep] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Document], int]:
        """Get paginated list of documents with filters"""
        query = select(Document)
        count_query = select(func.count(Document.id))
        
        if status:
            query = query.where(Document.status == status)
            count_query = count_query.where(Document.status == status)
        if step:
            query = query.where(Document.current_step == step)
            count_query = count_query.where(Document.current_step == step)
        if category:
            query = query.where(Document.category == category)
            count_query = count_query.where(Document.category == category)
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.order_by(Document.priority.desc(), Document.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        documents = result.scalars().all()
        
        return list(documents), total
    
    async def update_document(
        self,
        document_id: int,
        **kwargs
    ) -> Optional[Document]:
        """Update document fields"""
        document = await self.get_document(document_id)
        if not document:
            return None
        
        for key, value in kwargs.items():
            if hasattr(document, key) and value is not None:
                setattr(document, key, value)
        
        document.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(document)
        return document
    
    async def delete_document(self, document_id: int) -> bool:
        """Delete document and all related data (cascading)"""
        document = await self.get_document(document_id)
        if not document:
            return False
        
        # Delete the physical file if it exists
        import os
        if os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except Exception:
                pass  # Continue even if file deletion fails
        
        # SQLAlchemy cascade will handle related records
        await self.db.delete(document)
        await self.db.commit()
        return True
    
    # ========== Text Extraction Operations ==========
    
    async def save_extracted_text(
        self,
        document_id: int,
        raw_text: str,
        cleaned_text: Optional[str] = None,
        extraction_method: Optional[str] = None,
        confidence_score: Optional[float] = None,
        processed_by_id: Optional[int] = None
    ) -> ExtractedText:
        """Save extracted text for a document"""
        # Check if extraction already exists
        result = await self.db.execute(
            select(ExtractedText).where(ExtractedText.document_id == document_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.raw_text = raw_text
            existing.cleaned_text = cleaned_text
            existing.extraction_method = extraction_method
            existing.confidence_score = confidence_score
            existing.processed_by_id = processed_by_id
            existing.processed_at = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            extracted_text = existing
        else:
            extracted_text = ExtractedText(
                document_id=document_id,
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                extraction_method=extraction_method,
                confidence_score=confidence_score,
                processed_by_id=processed_by_id,
                processed_at=datetime.utcnow()
            )
            self.db.add(extracted_text)
        
        # Update document status
        await self._update_document_step(document_id, PipelineStep.TEXT_EXTRACTION, DocumentStatus.TEXT_EXTRACTED)
        
        await self.db.commit()
        await self.db.refresh(extracted_text)
        return extracted_text
    
    async def get_extracted_text(self, document_id: int) -> Optional[ExtractedText]:
        """Get extracted text for a document"""
        result = await self.db.execute(
            select(ExtractedText).where(ExtractedText.document_id == document_id)
        )
        return result.scalar_one_or_none()
    
    # ========== Chunking Operations ==========
    
    async def save_chunks(
        self,
        document_id: int,
        chunks: List[Dict[str, Any]],
        processed_by_id: Optional[int] = None
    ) -> List[DocumentChunk]:
        """Save chunks for a document"""
        # Delete existing chunks
        await self.db.execute(
            DocumentChunk.__table__.delete().where(DocumentChunk.document_id == document_id)
        )
        
        created_chunks = []
        for chunk_data in chunks:
            chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk_data.get("chunk_index", 0),
                content=chunk_data["content"],
                start_page=chunk_data.get("start_page"),
                end_page=chunk_data.get("end_page"),
                token_count=chunk_data.get("token_count"),
                heading=chunk_data.get("heading"),
                section_type=chunk_data.get("section_type"),
                metadata=chunk_data.get("metadata"),
                processed_by_id=processed_by_id
            )
            self.db.add(chunk)
            created_chunks.append(chunk)
        
        # Update document
        document = await self.get_document(document_id)
        if document:
            document.chunk_count = len(chunks)
        
        # Update document status
        await self._update_document_step(document_id, PipelineStep.CHUNKING, DocumentStatus.CHUNKED)
        
        await self.db.commit()
        for chunk in created_chunks:
            await self.db.refresh(chunk)
        return created_chunks
    
    async def get_chunks(self, document_id: int) -> List[DocumentChunk]:
        """Get all chunks for a document"""
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        return list(result.scalars().all())
    
    async def update_chunk(self, chunk_id: int, **kwargs) -> Optional[DocumentChunk]:
        """Update a specific chunk"""
        result = await self.db.execute(
            select(DocumentChunk).where(DocumentChunk.id == chunk_id)
        )
        chunk = result.scalar_one_or_none()
        if not chunk:
            return None
        
        for key, value in kwargs.items():
            if hasattr(chunk, key) and value is not None:
                setattr(chunk, key, value)
        
        chunk.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(chunk)
        return chunk
    
    # ========== Metadata Operations ==========
    
    async def save_metadata(
        self,
        document_id: int,
        metadata: Dict[str, Any],
        processed_by_id: Optional[int] = None
    ) -> DocumentMetadata:
        """Save metadata for a document"""
        result = await self.db.execute(
            select(DocumentMetadata).where(DocumentMetadata.document_id == document_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            for key, value in metadata.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.processed_by_id = processed_by_id
            existing.updated_at = datetime.utcnow()
            doc_metadata = existing
        else:
            doc_metadata = DocumentMetadata(
                document_id=document_id,
                processed_by_id=processed_by_id,
                **metadata
            )
            self.db.add(doc_metadata)
        
        # Update document status
        await self._update_document_step(document_id, PipelineStep.METADATA, DocumentStatus.METADATA_ADDED)
        
        await self.db.commit()
        await self.db.refresh(doc_metadata)
        return doc_metadata
    
    async def get_metadata(self, document_id: int) -> Optional[DocumentMetadata]:
        """Get metadata for a document"""
        result = await self.db.execute(
            select(DocumentMetadata).where(DocumentMetadata.document_id == document_id)
        )
        return result.scalar_one_or_none()
    
    # ========== Summarization Operations ==========
    
    async def save_summary(
        self,
        document_id: int,
        summary: str,
        key_points: Optional[List[str]] = None,
        chunk_summaries: Optional[Dict[int, str]] = None,
        processed_by_id: Optional[int] = None
    ) -> DocumentMetadata:
        """Save summary for a document"""
        # Update or create metadata with summary
        result = await self.db.execute(
            select(DocumentMetadata).where(DocumentMetadata.document_id == document_id)
        )
        metadata = result.scalar_one_or_none()
        
        if metadata:
            metadata.summary = summary
            metadata.key_points = key_points
            metadata.processed_by_id = processed_by_id
            metadata.updated_at = datetime.utcnow()
        else:
            metadata = DocumentMetadata(
                document_id=document_id,
                summary=summary,
                key_points=key_points,
                processed_by_id=processed_by_id
            )
            self.db.add(metadata)
        
        # Update chunk summaries if provided
        if chunk_summaries:
            for chunk_id, chunk_summary in chunk_summaries.items():
                await self.update_chunk(int(chunk_id), summary=chunk_summary)
        
        # Update document status
        await self._update_document_step(document_id, PipelineStep.SUMMARIZATION, DocumentStatus.SUMMARIZED)
        
        await self.db.commit()
        await self.db.refresh(metadata)
        return metadata
    
    # ========== QA Operations ==========
    
    async def create_qa_review(
        self,
        document_id: int,
        reviewer_id: int,
        review_data: Dict[str, Any]
    ) -> QAReview:
        """Create a QA review for a document"""
        review = QAReview(
            document_id=document_id,
            reviewer_id=reviewer_id,
            **review_data
        )
        self.db.add(review)
        
        # If approved, update document status
        if review_data.get("is_approved"):
            await self._update_document_step(document_id, PipelineStep.QUALITY_ASSURANCE, DocumentStatus.QA_APPROVED)
        else:
            # Rejected - may need revision
            document = await self.get_document(document_id)
            if document:
                document.status = DocumentStatus.REJECTED
        
        await self.db.commit()
        await self.db.refresh(review)
        return review
    
    async def get_qa_reviews(self, document_id: int) -> List[QAReview]:
        """Get all QA reviews for a document"""
        result = await self.db.execute(
            select(QAReview)
            .where(QAReview.document_id == document_id)
            .order_by(QAReview.created_at.desc())
        )
        return list(result.scalars().all())
    
    # ========== Publish Operations ==========
    
    async def publish_document(
        self,
        document_id: int,
        published_by_id: int,
        search_keywords: Optional[List[str]] = None,
        search_weight: float = 1.0
    ) -> PublishedDocument:
        """Publish a document to the legal database"""
        # Check if already published
        result = await self.db.execute(
            select(PublishedDocument).where(PublishedDocument.document_id == document_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.version += 1
            existing.is_active = True
            existing.published_by_id = published_by_id
            existing.published_at = datetime.utcnow()
            existing.search_keywords = search_keywords
            existing.search_weight = search_weight
            published = existing
        else:
            published = PublishedDocument(
                document_id=document_id,
                published_by_id=published_by_id,
                search_keywords=search_keywords,
                search_weight=search_weight
            )
            self.db.add(published)
        
        # Update document
        document = await self.get_document(document_id)
        if document:
            document.current_step = PipelineStep.PUBLISH
            document.status = DocumentStatus.PUBLISHED
            document.published_at = datetime.utcnow()
        
        # Complete publish task
        await self._complete_step_task(document_id, PipelineStep.PUBLISH, published_by_id)
        
        await self.db.commit()
        await self.db.refresh(published)
        return published
    
    # ========== Task Management ==========
    
    async def assign_task(
        self,
        document_id: int,
        step: PipelineStep,
        assigned_to_id: int,
        assigned_by_id: int,
        notes: Optional[str] = None,
        estimated_time: Optional[int] = None
    ) -> PipelineTask:
        """Assign a task to a user"""
        # Find the task for this step
        result = await self.db.execute(
            select(PipelineTask).where(
                and_(
                    PipelineTask.document_id == document_id,
                    PipelineTask.step == step
                )
            )
        )
        task = result.scalar_one_or_none()
        
        if not task:
            task = PipelineTask(
                document_id=document_id,
                step=step,
                status=TaskStatus.PENDING
            )
            self.db.add(task)
            await self.db.flush()
        
        task.assigned_to_id = assigned_to_id
        task.assigned_by_id = assigned_by_id
        task.assigned_at = datetime.utcnow()
        task.notes = notes
        task.estimated_time_minutes = estimated_time
        
        await self.db.commit()
        await self.db.refresh(task)
        return task
    
    async def start_task(self, task_id: int, user_id: int) -> Optional[PipelineTask]:
        """Start working on a task"""
        result = await self.db.execute(
            select(PipelineTask).where(PipelineTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        
        # Verify assignment
        if task.assigned_to_id != user_id:
            raise ValueError("Task is not assigned to this user")
        
        task.status = TaskStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(task)
        return task
    
    async def complete_task(
        self,
        task_id: int,
        user_id: int,
        output_data: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        actual_time: Optional[int] = None
    ) -> Optional[PipelineTask]:
        """Complete a task"""
        result = await self.db.execute(
            select(PipelineTask).where(PipelineTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        task.output_data = output_data
        if notes:
            task.notes = notes
        if actual_time:
            task.actual_time_minutes = actual_time
        
        # Create task for next step
        await self._create_next_step_task(task.document_id, task.step)
        
        await self.db.commit()
        await self.db.refresh(task)
        return task
    
    async def request_revision(
        self,
        task_id: int,
        reason: str,
        notes: Optional[str] = None
    ) -> Optional[PipelineTask]:
        """Request revision for a task"""
        result = await self.db.execute(
            select(PipelineTask).where(PipelineTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        
        task.status = TaskStatus.REVISION_REQUIRED
        task.revision_count += 1
        task.last_revision_reason = reason
        if notes:
            task.notes = notes
        
        await self.db.commit()
        await self.db.refresh(task)
        return task
    
    async def get_user_tasks(self, user_id: int) -> Dict[str, List[PipelineTask]]:
        """Get all tasks assigned to a user"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Pending tasks
        pending_result = await self.db.execute(
            select(PipelineTask)
            .where(and_(
                PipelineTask.assigned_to_id == user_id,
                PipelineTask.status == TaskStatus.PENDING
            ))
            .order_by(PipelineTask.created_at)
        )
        pending = list(pending_result.scalars().all())
        
        # In progress tasks
        in_progress_result = await self.db.execute(
            select(PipelineTask)
            .where(and_(
                PipelineTask.assigned_to_id == user_id,
                PipelineTask.status == TaskStatus.IN_PROGRESS
            ))
        )
        in_progress = list(in_progress_result.scalars().all())
        
        # Completed today
        completed_result = await self.db.execute(
            select(PipelineTask)
            .where(and_(
                PipelineTask.assigned_to_id == user_id,
                PipelineTask.status == TaskStatus.COMPLETED,
                PipelineTask.completed_at >= today_start
            ))
            .order_by(PipelineTask.completed_at.desc())
        )
        completed_today = list(completed_result.scalars().all())
        
        # Revision required
        revision_result = await self.db.execute(
            select(PipelineTask)
            .where(and_(
                PipelineTask.assigned_to_id == user_id,
                PipelineTask.status == TaskStatus.REVISION_REQUIRED
            ))
        )
        revision_required = list(revision_result.scalars().all())
        
        return {
            "pending": pending,
            "in_progress": in_progress,
            "completed_today": completed_today,
            "revision_required": revision_required
        }
    
    async def get_available_tasks(self, step: Optional[PipelineStep] = None) -> List[PipelineTask]:
        """Get unassigned tasks available for pickup"""
        query = select(PipelineTask).where(
            and_(
                PipelineTask.status == TaskStatus.PENDING,
                PipelineTask.assigned_to_id == None
            )
        )
        if step:
            query = query.where(PipelineTask.step == step)
        
        result = await self.db.execute(query.order_by(PipelineTask.created_at))
        return list(result.scalars().all())
    
    # ========== Statistics ==========
    
    async def get_pipeline_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics for dashboard"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Total documents
        total_result = await self.db.execute(select(func.count(Document.id)))
        total_documents = total_result.scalar()
        
        # By status
        status_result = await self.db.execute(
            select(Document.status, func.count(Document.id))
            .group_by(Document.status)
        )
        by_status = {row[0].value: row[1] for row in status_result}
        
        # By step
        step_result = await self.db.execute(
            select(Document.current_step, func.count(Document.id))
            .group_by(Document.current_step)
        )
        by_step = {row[0].value: row[1] for row in step_result}
        
        # Task counts
        pending_result = await self.db.execute(
            select(func.count(PipelineTask.id))
            .where(PipelineTask.status == TaskStatus.PENDING)
        )
        pending_tasks = pending_result.scalar()
        
        in_progress_result = await self.db.execute(
            select(func.count(PipelineTask.id))
            .where(PipelineTask.status == TaskStatus.IN_PROGRESS)
        )
        in_progress_tasks = in_progress_result.scalar()
        
        completed_result = await self.db.execute(
            select(func.count(PipelineTask.id))
            .where(and_(
                PipelineTask.status == TaskStatus.COMPLETED,
                PipelineTask.completed_at >= today_start
            ))
        )
        completed_today = completed_result.scalar()
        
        published_result = await self.db.execute(
            select(func.count(PublishedDocument.id))
            .where(PublishedDocument.published_at >= week_start)
        )
        published_this_week = published_result.scalar()
        
        return {
            "total_documents": total_documents,
            "by_status": by_status,
            "by_step": by_step,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_today": completed_today,
            "published_this_week": published_this_week
        }
    
    # ========== Helper Methods ==========
    
    async def _update_document_step(
        self,
        document_id: int,
        step: PipelineStep,
        status: DocumentStatus
    ):
        """Update document step and status"""
        document = await self.get_document(document_id)
        if document:
            document.current_step = step
            document.status = status
            document.updated_at = datetime.utcnow()
    
    async def _complete_step_task(
        self,
        document_id: int,
        step: PipelineStep,
        user_id: int
    ):
        """Mark a step's task as completed"""
        result = await self.db.execute(
            select(PipelineTask).where(
                and_(
                    PipelineTask.document_id == document_id,
                    PipelineTask.step == step
                )
            )
        )
        task = result.scalar_one_or_none()
        if task:
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.utcnow()
        
        # Create next step task if not publish
        if step != PipelineStep.PUBLISH:
            await self._create_next_step_task(document_id, step)
    
    async def _create_next_step_task(self, document_id: int, current_step: PipelineStep):
        """Create task for the next pipeline step"""
        step_order = [
            PipelineStep.UPLOAD,
            PipelineStep.TEXT_EXTRACTION,
            PipelineStep.CHUNKING,
            PipelineStep.METADATA,
            PipelineStep.SUMMARIZATION,
            PipelineStep.QUALITY_ASSURANCE,
            PipelineStep.PUBLISH
        ]
        
        try:
            current_index = step_order.index(current_step)
            if current_index < len(step_order) - 1:
                next_step = step_order[current_index + 1]
                
                # Check if task already exists
                result = await self.db.execute(
                    select(PipelineTask).where(
                        and_(
                            PipelineTask.document_id == document_id,
                            PipelineTask.step == next_step
                        )
                    )
                )
                existing = result.scalar_one_or_none()
                
                if not existing:
                    next_task = PipelineTask(
                        document_id=document_id,
                        step=next_step,
                        status=TaskStatus.PENDING
                    )
                    self.db.add(next_task)
        except ValueError:
            pass
