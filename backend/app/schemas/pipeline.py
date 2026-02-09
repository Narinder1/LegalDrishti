"""
Pipeline Schemas - Request/Response models for document processing pipeline
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums matching the database models
class DocumentStatusEnum(str, Enum):
    UPLOADED = "uploaded"
    TEXT_EXTRACTED = "text_extracted"
    CHUNKED = "chunked"
    METADATA_ADDED = "metadata_added"
    SUMMARIZED = "summarized"
    QA_APPROVED = "qa_approved"
    PUBLISHED = "published"
    REJECTED = "rejected"


class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REVISION_REQUIRED = "revision_required"


class PipelineStepEnum(str, Enum):
    UPLOAD = "upload"
    TEXT_EXTRACTION = "text_extraction"
    CHUNKING = "chunking"
    METADATA = "metadata"
    SUMMARIZATION = "summarization"
    QUALITY_ASSURANCE = "quality_assurance"
    PUBLISH = "publish"


# ========== Document Schemas ==========

class DocumentBase(BaseModel):
    """Base document schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    jurisdiction: Optional[str] = None
    year: Optional[int] = None
    language: str = "english"
    priority: int = Field(default=5, ge=1, le=10)


class DocumentCreate(DocumentBase):
    """Schema for creating a new document (used with file upload)"""
    pass


class DocumentUpdate(BaseModel):
    """Schema for updating document details"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    jurisdiction: Optional[str] = None
    year: Optional[int] = None
    language: Optional[str] = None
    priority: Optional[int] = Field(default=None, ge=1, le=10)


class DocumentResponse(DocumentBase):
    """Full document response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    original_filename: str
    file_path: str
    file_type: str
    file_size: int
    current_step: PipelineStepEnum
    status: DocumentStatusEnum
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    chunk_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    uploaded_by_id: int


class DocumentListResponse(BaseModel):
    """Paginated document list response"""
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ========== Extracted Text Schemas ==========

class ExtractedTextCreate(BaseModel):
    """Schema for saving extracted text"""
    raw_text: str
    cleaned_text: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)


class ExtractedTextUpdate(BaseModel):
    """Schema for updating extracted text"""
    raw_text: Optional[str] = None
    cleaned_text: Optional[str] = None


class ExtractedTextResponse(BaseModel):
    """Extracted text response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    raw_text: str
    cleaned_text: Optional[str] = None
    extraction_method: Optional[str] = None
    confidence_score: Optional[float] = None
    processed_by_id: Optional[int] = None
    processed_at: Optional[datetime] = None
    created_at: datetime


# ========== Chunk Schemas ==========

class ChunkCreate(BaseModel):
    """Schema for creating a single chunk"""
    chunk_index: int
    content: str
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    token_count: Optional[int] = None
    heading: Optional[str] = None
    section_type: Optional[str] = None
    chunk_metadata: Optional[Dict[str, Any]] = None


class ChunksCreate(BaseModel):
    """Schema for creating multiple chunks at once"""
    chunks: List[ChunkCreate]


class ChunkUpdate(BaseModel):
    """Schema for updating a chunk"""
    content: Optional[str] = None
    heading: Optional[str] = None
    section_type: Optional[str] = None
    chunk_metadata: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None


class ChunkResponse(BaseModel):
    """Chunk response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    chunk_index: int
    content: str
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    token_count: Optional[int] = None
    heading: Optional[str] = None
    section_type: Optional[str] = None
    chunk_metadata: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    is_embedded: bool = False
    created_at: datetime


# ========== Metadata Schemas ==========

class DocumentMetadataCreate(BaseModel):
    """Schema for creating document metadata"""
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    bench: Optional[str] = None
    parties: Optional[str] = None
    citation: Optional[str] = None
    parallel_citations: Optional[str] = None
    legal_topics: Optional[List[str]] = None
    acts_referred: Optional[List[str]] = None
    sections_referred: Optional[List[str]] = None
    headnotes: Optional[str] = None
    ratio_decidendi: Optional[str] = None
    obiter_dicta: Optional[str] = None


class DocumentMetadataUpdate(DocumentMetadataCreate):
    """Schema for updating document metadata (same fields, all optional)"""
    pass


class DocumentMetadataResponse(BaseModel):
    """Document metadata response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    bench: Optional[str] = None
    parties: Optional[str] = None
    citation: Optional[str] = None
    parallel_citations: Optional[str] = None
    legal_topics: Optional[List[str]] = None
    acts_referred: Optional[List[str]] = None
    sections_referred: Optional[List[str]] = None
    headnotes: Optional[str] = None
    ratio_decidendi: Optional[str] = None
    obiter_dicta: Optional[str] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime


# ========== Summarization Schemas ==========

class SummarizationCreate(BaseModel):
    """Schema for creating/updating summary"""
    summary: str
    key_points: Optional[List[str]] = None
    chunk_summaries: Optional[Dict[int, str]] = None  # chunk_id -> summary


class SummarizationResponse(BaseModel):
    """Summarization response"""
    document_id: int
    summary: str
    key_points: Optional[List[str]] = None
    chunk_summaries: Optional[List[Dict[str, Any]]] = None


# ========== Pipeline Task Schemas ==========

class TaskAssign(BaseModel):
    """Schema for assigning a task"""
    assigned_to_id: int
    notes: Optional[str] = None
    estimated_time_minutes: Optional[int] = None


class TaskUpdate(BaseModel):
    """Schema for updating task progress"""
    status: Optional[TaskStatusEnum] = None
    notes: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    actual_time_minutes: Optional[int] = None


class TaskComplete(BaseModel):
    """Schema for completing a task"""
    notes: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    actual_time_minutes: Optional[int] = None


class TaskRevision(BaseModel):
    """Schema for requesting revision"""
    reason: str
    notes: Optional[str] = None


class PipelineTaskResponse(BaseModel):
    """Pipeline task response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    step: PipelineStepEnum
    status: TaskStatusEnum
    assigned_to_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    assigned_by_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    output_data: Optional[Dict[str, Any]] = None
    revision_count: int = 0
    last_revision_reason: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    actual_time_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class MyTasksResponse(BaseModel):
    """Response for user's assigned tasks"""
    pending: List[PipelineTaskResponse]
    in_progress: List[PipelineTaskResponse]
    completed_today: List[PipelineTaskResponse]
    revision_required: List[PipelineTaskResponse]


# ========== QA Review Schemas ==========

class QAReviewCreate(BaseModel):
    """Schema for creating QA review"""
    review_type: str = "initial"  # initial, revision, final
    accuracy_score: Optional[int] = Field(default=None, ge=1, le=5)
    completeness_score: Optional[int] = Field(default=None, ge=1, le=5)
    formatting_score: Optional[int] = Field(default=None, ge=1, le=5)
    overall_score: Optional[int] = Field(default=None, ge=1, le=5)
    is_approved: bool = False
    rejection_reason: Optional[str] = None
    comments: Optional[str] = None
    step_feedback: Optional[Dict[str, str]] = None
    checklist: Optional[Dict[str, bool]] = None


class QAReviewResponse(BaseModel):
    """QA review response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    reviewer_id: int
    review_type: str
    accuracy_score: Optional[int] = None
    completeness_score: Optional[int] = None
    formatting_score: Optional[int] = None
    overall_score: Optional[int] = None
    is_approved: bool
    rejection_reason: Optional[str] = None
    comments: Optional[str] = None
    step_feedback: Optional[Dict[str, str]] = None
    checklist: Optional[Dict[str, bool]] = None
    created_at: datetime


# ========== Publish Schemas ==========

class PublishRequest(BaseModel):
    """Schema for publishing a document"""
    search_keywords: Optional[List[str]] = None
    search_weight: float = Field(default=1.0, ge=0, le=10)


class PublishedDocumentResponse(BaseModel):
    """Published document response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    version: int
    is_active: bool
    published_by_id: int
    published_at: datetime
    search_keywords: Optional[List[str]] = None
    search_weight: float
    view_count: int
    download_count: int


# ========== Dashboard/Stats Schemas ==========

class PipelineStats(BaseModel):
    """Pipeline statistics for dashboard"""
    total_documents: int
    by_status: Dict[str, int]
    by_step: Dict[str, int]
    pending_tasks: int
    in_progress_tasks: int
    completed_today: int
    published_this_week: int


class UserWorkload(BaseModel):
    """User workload statistics"""
    user_id: int
    user_name: str
    pending_count: int
    in_progress_count: int
    completed_today: int
    avg_completion_time: Optional[float] = None
