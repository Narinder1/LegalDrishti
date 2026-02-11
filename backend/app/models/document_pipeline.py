"""
Document Processing Pipeline Models
Supports 7-step workflow: Upload -> TextExtraction -> Chunking -> Metadata -> Summarization -> QA -> Publish
Designed for multi-user collaboration with task assignment
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey, JSON, Float
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentStatus(str, enum.Enum):
    """Overall document status in the pipeline"""
    UPLOADED = "uploaded"
    TEXT_EXTRACTED = "text_extracted"
    CHUNKED = "chunked"
    METADATA_ADDED = "metadata_added"
    SUMMARIZED = "summarized"
    QA_APPROVED = "qa_approved"
    PUBLISHED = "published"
    REJECTED = "rejected"


class TaskStatus(str, enum.Enum):
    """Status of individual pipeline task"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REVISION_REQUIRED = "revision_required"


class PipelineStep(str, enum.Enum):
    """The 7 steps in document processing"""
    UPLOAD = "upload"
    TEXT_EXTRACTION = "text_extraction"
    CHUNKING = "chunking"
    METADATA = "metadata"
    SUMMARIZATION = "summarization"
    QUALITY_ASSURANCE = "quality_assurance"
    PUBLISH = "publish"


class Document(Base):
    """
    Main document entity - represents an uploaded file through the pipeline
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # File information
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt, etc.
    file_size = Column(Integer, nullable=False)  # in bytes
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash for duplicate detection
    
    # Processing status
    current_step = Column(Enum(PipelineStep), default=PipelineStep.UPLOAD)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED)
    
    # Metadata
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # judgment, law, regulation, etc.
    subcategory = Column(String(100), nullable=True)
    jurisdiction = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    language = Column(String(50), default="english")
    
    # Processing metadata
    page_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=True)
    
    # Priority for processing queue
    priority = Column(Integer, default=5)  # 1-10, 10 being highest
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Relationships
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    
    # Related entities
    extracted_text = relationship("ExtractedText", back_populates="document", uselist=False, cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    pipeline_tasks = relationship("PipelineTask", back_populates="document", cascade="all, delete-orphan")
    qa_reviews = relationship("QAReview", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document {self.id}: {self.original_filename} ({self.status.value})>"


class ExtractedText(Base):
    """
    Stores the extracted text from documents
    """
    __tablename__ = "extracted_texts"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Extracted content
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)  # After preprocessing
    
    # Extraction metadata
    extraction_method = Column(String(50), nullable=True)  # ocr, direct, hybrid
    confidence_score = Column(Float, nullable=True)  # 0-1 confidence
    
    # Processing info
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="extracted_text")
    processed_by = relationship("User", foreign_keys=[processed_by_id])
    
    def __repr__(self):
        return f"<ExtractedText for Document {self.document_id}>"


class DocumentChunk(Base):
    """
    Individual chunks from a document after chunking process
    """
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Chunk content
    chunk_index = Column(Integer, nullable=False)  # Order in document
    content = Column(Text, nullable=False)
    
    # Chunk metadata
    start_page = Column(Integer, nullable=True)
    end_page = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=True)
    
    # Semantic information
    heading = Column(String(500), nullable=True)
    section_type = Column(String(100), nullable=True)  # introduction, facts, judgment, etc.
    
    # Individual chunk metadata (JSON for flexibility)
    chunk_metadata = Column(JSON, nullable=True)
    
    # Summary for this chunk
    summary = Column(Text, nullable=True)
    
    # Processing info
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Vector embedding status
    is_embedded = Column(Boolean, default=False)
    embedding_model = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    processed_by = relationship("User", foreign_keys=[processed_by_id])
    
    def __repr__(self):
        return f"<DocumentChunk {self.chunk_index} of Document {self.document_id}>"


class PipelineTask(Base):
    """
    Task assignment for each pipeline step
    Enables multi-user workflow with different people handling different steps
    """
    __tablename__ = "pipeline_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Task details
    step = Column(Enum(PipelineStep), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    
    # Assignment
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Progress
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Task output/notes
    notes = Column(Text, nullable=True)
    output_data = Column(JSON, nullable=True)  # Step-specific output
    
    # For tracking revisions
    revision_count = Column(Integer, default=0)
    last_revision_reason = Column(Text, nullable=True)
    
    # Time tracking
    estimated_time_minutes = Column(Integer, nullable=True)
    actual_time_minutes = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="pipeline_tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    
    def __repr__(self):
        return f"<PipelineTask {self.step.value} for Document {self.document_id}>"


class QAReview(Base):
    """
    Quality Assurance reviews for documents
    """
    __tablename__ = "qa_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    
    # Review details
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_type = Column(String(50), nullable=False)  # initial, revision, final
    
    # Scores (1-5 scale)
    accuracy_score = Column(Integer, nullable=True)
    completeness_score = Column(Integer, nullable=True)
    formatting_score = Column(Integer, nullable=True)
    overall_score = Column(Integer, nullable=True)
    
    # Review decision
    is_approved = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    
    # Specific feedback for each step
    step_feedback = Column(JSON, nullable=True)  # {"extraction": "...", "chunking": "...", etc.}
    
    # Checklist (JSON for flexibility)
    checklist = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="qa_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    
    def __repr__(self):
        return f"<QAReview {self.id} for Document {self.document_id}>"


class DocumentMetadata(Base):
    """
    Additional metadata for published documents
    This is separate to allow detailed legal-specific metadata
    """
    __tablename__ = "document_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Legal metadata
    case_number = Column(String(200), nullable=True)
    court_name = Column(String(500), nullable=True)
    bench = Column(String(500), nullable=True)  # Judge names
    parties = Column(Text, nullable=True)  # JSON or formatted string
    
    # Citation
    citation = Column(String(500), nullable=True)
    parallel_citations = Column(Text, nullable=True)
    
    # Classification
    legal_topics = Column(JSON, nullable=True)  # List of topics
    acts_referred = Column(JSON, nullable=True)  # List of acts
    sections_referred = Column(JSON, nullable=True)  # Specific sections
    
    # Key information
    headnotes = Column(Text, nullable=True)
    ratio_decidendi = Column(Text, nullable=True)
    obiter_dicta = Column(Text, nullable=True)
    
    # Document summary (final approved version)
    summary = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True)  # List of key points
    
    # Processed by
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document")
    processed_by = relationship("User", foreign_keys=[processed_by_id])
    
    def __repr__(self):
        return f"<DocumentMetadata for Document {self.document_id}>"


class PublishedDocument(Base):
    """
    Final published documents ready for the legal database
    """
    __tablename__ = "published_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Published version tracking
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    
    # Publication details
    published_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)
    
    # Search optimization
    search_keywords = Column(JSON, nullable=True)
    search_weight = Column(Float, default=1.0)  # For ranking
    
    # Access tracking
    view_count = Column(Integer, default=0)
    download_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document")
    published_by = relationship("User", foreign_keys=[published_by_id])
    
    def __repr__(self):
        return f"<PublishedDocument {self.id} (v{self.version})>"
