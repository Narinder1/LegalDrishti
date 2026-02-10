import { create } from 'zustand'

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types
export type DocumentStatus = 
  | 'uploaded' 
  | 'text_extracted' 
  | 'chunked' 
  | 'metadata_added' 
  | 'summarized' 
  | 'qa_approved' 
  | 'published' 
  | 'rejected'

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'revision_required'

export type PipelineStep = 
  | 'upload' 
  | 'text_extraction' 
  | 'chunking' 
  | 'metadata' 
  | 'summarization' 
  | 'quality_assurance' 
  | 'publish'

export interface Document {
  id: number
  original_filename: string
  file_path: string
  file_type: string
  file_size: number
  current_step: PipelineStep
  status: DocumentStatus
  title: string | null
  description: string | null
  category: string | null
  subcategory: string | null
  jurisdiction: string | null
  year: number | null
  language: string
  priority: number
  page_count: number | null
  word_count: number | null
  chunk_count: number | null
  created_at: string
  updated_at: string
  published_at: string | null
  uploaded_by_id: number
}

export interface ExtractedText {
  id: number
  document_id: number
  raw_text: string
  cleaned_text: string | null
  extraction_method: string | null
  confidence_score: number | null
  processed_by_id: number | null
  processed_at: string | null
  created_at: string
}

export interface DocumentChunk {
  id: number
  document_id: number
  chunk_index: number
  content: string
  start_page: number | null
  end_page: number | null
  token_count: number | null
  heading: string | null
  section_type: string | null
  chunk_metadata: Record<string, unknown> | null
  summary: string | null
  is_embedded: boolean
  created_at: string
}

export interface DocumentMetadata {
  id: number
  document_id: number
  case_number: string | null
  court_name: string | null
  bench: string | null
  parties: string | null
  citation: string | null
  parallel_citations: string | null
  legal_topics: string[] | null
  acts_referred: string[] | null
  sections_referred: string[] | null
  headnotes: string | null
  ratio_decidendi: string | null
  obiter_dicta: string | null
  summary: string | null
  key_points: string[] | null
  created_at: string
  updated_at: string
}

export interface PipelineTask {
  id: number
  document_id: number
  step: PipelineStep
  status: TaskStatus
  assigned_to_id: number | null
  assigned_at: string | null
  assigned_by_id: number | null
  started_at: string | null
  completed_at: string | null
  notes: string | null
  output_data: Record<string, unknown> | null
  revision_count: number
  last_revision_reason: string | null
  estimated_time_minutes: number | null
  actual_time_minutes: number | null
  created_at: string
  updated_at: string
}

export interface QAReview {
  id: number
  document_id: number
  reviewer_id: number
  review_type: string
  accuracy_score: number | null
  completeness_score: number | null
  formatting_score: number | null
  overall_score: number | null
  is_approved: boolean
  rejection_reason: string | null
  comments: string | null
  step_feedback: Record<string, string> | null
  checklist: Record<string, boolean> | null
  created_at: string
}

export interface PipelineStats {
  total_documents: number
  by_status: Record<string, number>
  by_step: Record<string, number>
  pending_tasks: number
  in_progress_tasks: number
  completed_today: number
  published_this_week: number
}

export interface MyTasks {
  pending: PipelineTask[]
  in_progress: PipelineTask[]
  completed_today: PipelineTask[]
  revision_required: PipelineTask[]
}

// Pipeline Step Configuration
export const PIPELINE_STEPS: { key: PipelineStep; label: string; description: string; icon: string }[] = [
  { key: 'upload', label: 'Upload', description: 'Upload legal documents', icon: 'Upload' },
  { key: 'text_extraction', label: 'Text Extraction', description: 'Extract text from documents', icon: 'FileText' },
  { key: 'chunking', label: 'Chunking', description: 'Break text into manageable chunks', icon: 'Scissors' },
  { key: 'metadata', label: 'Metadata', description: 'Add legal metadata', icon: 'Tag' },
  { key: 'summarization', label: 'Summarization', description: 'Generate summaries', icon: 'FileEdit' },
  { key: 'quality_assurance', label: 'Quality Assurance', description: 'Review and validate', icon: 'CheckCircle' },
  { key: 'publish', label: 'Publish', description: 'Publish to database', icon: 'Globe' },
]

interface PipelineState {
  // Current view
  activeStep: PipelineStep
  
  // Data
  documents: Document[]
  currentDocument: Document | null
  extractedText: ExtractedText | null
  chunks: DocumentChunk[]
  metadata: DocumentMetadata | null
  myTasks: MyTasks
  availableTasks: PipelineTask[]
  stats: PipelineStats | null
  
  // Loading states
  isLoading: boolean
  isUploading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  setActiveStep: (step: PipelineStep) => void
  
  // Document actions
  uploadDocument: (file: File, data: { title?: string; description?: string; category?: string; priority?: number }, token: string) => Promise<Document | null>
  fetchDocuments: (token: string, filters?: { status?: DocumentStatus; step?: PipelineStep; category?: string }) => Promise<void>
  fetchDocument: (id: number, token: string) => Promise<void>
  updateDocument: (id: number, data: Partial<Document>, token: string) => Promise<void>
  
  // Text extraction
  fetchExtractedText: (documentId: number, token: string) => Promise<void>
  saveExtractedText: (documentId: number, data: { raw_text: string; cleaned_text?: string; extraction_method?: string; confidence_score?: number }, token: string) => Promise<void>
  extractRawText: (documentId: number, extractionMethod: string, token: string) => Promise<{ raw_text: string; page_count?: number; word_count?: number } | null>
  cleanRawText: (documentId: number, rawText: string, token: string) => Promise<{ cleaned_text: string } | null>
  
  // Chunking
  fetchChunks: (documentId: number, token: string) => Promise<void>
  saveChunks: (documentId: number, chunks: Partial<DocumentChunk>[], token: string) => Promise<void>
  updateChunk: (chunkId: number, data: Partial<DocumentChunk>, token: string) => Promise<void>
  
  // Metadata
  fetchMetadata: (documentId: number, token: string) => Promise<void>
  saveMetadata: (documentId: number, data: Partial<DocumentMetadata>, token: string) => Promise<void>
  
  // Summarization
  saveSummary: (documentId: number, data: { summary: string; key_points?: string[]; chunk_summaries?: Record<number, string> }, token: string) => Promise<void>
  
  // QA
  createQAReview: (documentId: number, data: Partial<QAReview>, token: string) => Promise<void>
  
  // Publish
  publishDocument: (documentId: number, data: { search_keywords?: string[]; search_weight?: number }, token: string) => Promise<void>
  
  // Tasks
  fetchMyTasks: (token: string) => Promise<void>
  fetchAvailableTasks: (token: string, step?: PipelineStep) => Promise<void>
  pickupTask: (taskId: number, token: string) => Promise<void>
  startTask: (taskId: number, token: string) => Promise<void>
  completeTask: (taskId: number, data: { notes?: string; output_data?: Record<string, unknown>; actual_time_minutes?: number }, token: string) => Promise<void>
  
  // Stats
  fetchStats: (token: string) => Promise<void>
  
  // Clear
  clearError: () => void
  reset: () => void
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  // Initial state
  activeStep: 'upload',
  documents: [],
  currentDocument: null,
  extractedText: null,
  chunks: [],
  metadata: null,
  myTasks: { pending: [], in_progress: [], completed_today: [], revision_required: [] },
  availableTasks: [],
  stats: null,
  isLoading: false,
  isUploading: false,
  isSaving: false,
  error: null,
  
  setActiveStep: (step) => set({ activeStep: step }),
  
  // Upload document
  uploadDocument: async (file, data, token) => {
    set({ isUploading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (data.title) formData.append('title', data.title)
      if (data.description) formData.append('description', data.description)
      if (data.category) formData.append('category', data.category)
      if (data.priority) formData.append('priority', data.priority.toString())
      
      const response = await fetch(`${API_URL}/api/v1/pipeline/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }
      
      const document: Document = await response.json()
      set((state) => ({
        documents: [document, ...state.documents],
        isUploading: false
      }))
      return document
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Upload failed', isUploading: false })
      return null
    }
  },
  
  // Fetch documents
  fetchDocuments: async (token, filters) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.step) params.append('step', filters.step)
      if (filters?.category) params.append('category', filters.category)
      
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to fetch documents')
      
      const data = await response.json()
      set({ documents: data.documents, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch', isLoading: false })
    }
  },
  
  // Fetch single document
  fetchDocument: async (id, token) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Document not found')
      
      const document = await response.json()
      set({ currentDocument: document, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch', isLoading: false })
    }
  },
  
  // Update document
  updateDocument: async (id, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update document')
      
      const document = await response.json()
      set((state) => ({
        currentDocument: document,
        documents: state.documents.map(d => d.id === id ? document : d),
        isSaving: false
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update', isSaving: false })
    }
  },
  
  // Text extraction
  fetchExtractedText: async (documentId, token) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/extract`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.status === 404) {
        set({ extractedText: null, isLoading: false })
        return
      }
      
      if (!response.ok) throw new Error('Failed to fetch extracted text')
      
      const data = await response.json()
      set({ extractedText: data, isLoading: false })
    } catch (error) {
      set({ extractedText: null, isLoading: false })
    }
  },
  
  saveExtractedText: async (documentId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to save extracted text')
      
      const extracted = await response.json()
      set({ extractedText: extracted, isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save', isSaving: false })
    }
  },

  // Extract raw text using Docling on backend
  extractRawText: async (documentId, extractionMethod, token) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams({ extraction_method: extractionMethod })
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/extract-text?${params}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Extraction failed')
      }

      const data = await response.json()
      set({ isLoading: false })
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Extraction failed', isLoading: false })
      return null
    }
  },

  // Clean raw text via backend
  cleanRawText: async (documentId, rawText, token) => {
    set({ isLoading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('raw_text', rawText)

      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/clean-text`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Cleaning failed')
      }

      const data = await response.json()
      set({ isLoading: false })
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Cleaning failed', isLoading: false })
      return null
    }
  },
  
  // Chunking
  fetchChunks: async (documentId, token) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/chunks`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to fetch chunks')
      
      const chunks = await response.json()
      set({ chunks, isLoading: false })
    } catch (error) {
      set({ chunks: [], isLoading: false })
    }
  },
  
  saveChunks: async (documentId, chunks, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/chunks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chunks }),
      })
      
      if (!response.ok) throw new Error('Failed to save chunks')
      
      const savedChunks = await response.json()
      set({ chunks: savedChunks, isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save', isSaving: false })
    }
  },
  
  updateChunk: async (chunkId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/chunks/${chunkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update chunk')
      
      const chunk = await response.json()
      set((state) => ({
        chunks: state.chunks.map(c => c.id === chunkId ? chunk : c),
        isSaving: false
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update', isSaving: false })
    }
  },
  
  // Metadata
  fetchMetadata: async (documentId, token) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/metadata`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (response.status === 404) {
        set({ metadata: null, isLoading: false })
        return
      }
      
      if (!response.ok) throw new Error('Failed to fetch metadata')
      
      const metadata = await response.json()
      set({ metadata, isLoading: false })
    } catch (error) {
      set({ metadata: null, isLoading: false })
    }
  },
  
  saveMetadata: async (documentId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to save metadata')
      
      const metadata = await response.json()
      set({ metadata, isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save', isSaving: false })
    }
  },
  
  // Summarization
  saveSummary: async (documentId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/summarize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to save summary')
      
      // Refresh metadata after saving summary
      await get().fetchMetadata(documentId, token)
      set({ isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save', isSaving: false })
    }
  },
  
  // QA
  createQAReview: async (documentId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/qa-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to create QA review')
      
      // Refresh document after QA
      await get().fetchDocument(documentId, token)
      set({ isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save', isSaving: false })
    }
  },
  
  // Publish
  publishDocument: async (documentId, data, token) => {
    set({ isSaving: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/documents/${documentId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to publish')
      }
      
      // Refresh document after publishing
      await get().fetchDocument(documentId, token)
      set({ isSaving: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to publish', isSaving: false })
    }
  },
  
  // Tasks
  fetchMyTasks: async (token) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/tasks/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to fetch tasks')
      
      const myTasks = await response.json()
      set({ myTasks, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },
  
  fetchAvailableTasks: async (token, step) => {
    try {
      const params = step ? `?step=${step}` : ''
      const response = await fetch(`${API_URL}/api/v1/pipeline/tasks/available${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to fetch available tasks')
      
      const availableTasks = await response.json()
      set({ availableTasks })
    } catch (error) {
      set({ availableTasks: [] })
    }
  },
  
  pickupTask: async (taskId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/tasks/${taskId}/pickup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to pickup task')
      
      // Refresh tasks
      await get().fetchMyTasks(token)
      await get().fetchAvailableTasks(token)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to pickup task' })
    }
  },
  
  startTask: async (taskId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/tasks/${taskId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to start task')
      
      await get().fetchMyTasks(token)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start task' })
    }
  },
  
  completeTask: async (taskId, data, token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to complete task')
      
      await get().fetchMyTasks(token)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to complete task' })
    }
  },
  
  // Stats
  fetchStats: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/pipeline/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const stats = await response.json()
      set({ stats })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  },
  
  clearError: () => set({ error: null }),
  
  reset: () => set({
    activeStep: 'upload',
    documents: [],
    currentDocument: null,
    extractedText: null,
    chunks: [],
    metadata: null,
    myTasks: { pending: [], in_progress: [], completed_today: [], revision_required: [] },
    availableTasks: [],
    stats: null,
    isLoading: false,
    isUploading: false,
    isSaving: false,
    error: null,
  }),
}))
