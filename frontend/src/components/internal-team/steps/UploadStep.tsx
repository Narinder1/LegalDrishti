'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Eye, Trash2, ArrowRight } from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']

interface UploadFormData {
  title: string
  description: string
  category: string
  priority: number
}

export function UploadStep() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    category: '',
    priority: 5,
  })
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [recentUploads, setRecentUploads] = useState<Document[]>([])
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  const { uploadDocument, fetchDocuments, documents, isUploading, error, clearError, setActiveStep } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { step: 'upload' })
    }
  }, [tokens, fetchDocuments])

  useEffect(() => {
    // Show last 5 uploaded documents
    setRecentUploads(documents.slice(0, 5))
  }, [documents])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }, [])

  const validateAndSetFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }
    setSelectedFile(file)
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
    }
    clearError()
    setUploadSuccess(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !tokens?.access_token) return

    const result = await uploadDocument(selectedFile, formData, tokens.access_token)
    
    if (result) {
      setUploadSuccess(true)
      setSelectedFile(null)
      setFormData({ title: '', description: '', category: '', priority: 5 })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      // Refresh documents list
      await fetchDocuments(tokens.access_token)
    }
  }

  const handleDelete = async (docId: number) => {
    if (!tokens?.access_token) return
    
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setDeletingDocId(docId)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/pipeline/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      })

      if (response.ok) {
        // Refresh documents list
        await fetchDocuments(tokens.access_token)
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      alert('Error deleting document')
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleViewDocument = (doc: Document) => {
    setViewingDoc(doc)
  }

  const handleProceedToNextStep = () => {
    // Navigate to Text Extraction step
    setActiveStep('text_extraction')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const categories = [
    'Judgment',
    'Law/Act',
    'Regulation',
    'Circular',
    'Notification',
    'Guidelines',
    'Other',
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-600">Upload legal documents to start the processing pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : selectedFile
                ? 'border-secondary-500 bg-secondary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-secondary-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-secondary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your file here, or <span className="text-primary-600">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports: PDF, DOCX, DOC, TXT, RTF, ODT
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Details Form */}
          {selectedFile && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Document Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of the document"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Success */}
              {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle size={18} />
                  <span className="text-sm">Document uploaded successfully!</span>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Uploads</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentUploads.length > 0 ? (
              recentUploads.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title || doc.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingDocId === doc.id}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingDocId === doc.id ? (
                        <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Document Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Document Details</h3>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-gray-900 font-medium mt-1">{viewingDoc.title || 'Untitled'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Original Filename</label>
                <p className="text-gray-900 mt-1">{viewingDoc.original_filename}</p>
              </div>

              {viewingDoc.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{viewingDoc.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p className="text-gray-900 mt-1">{viewingDoc.file_type.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p className="text-gray-900 mt-1">{formatFileSize(viewingDoc.file_size)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 mt-1">{viewingDoc.category || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="text-gray-900 mt-1">{viewingDoc.priority}/10</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900 mt-1 capitalize">{viewingDoc.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Step</label>
                  <p className="text-gray-900 mt-1 capitalize">{viewingDoc.current_step.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Uploaded At</label>
                <p className="text-gray-900 mt-1">
                  {new Date(viewingDoc.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">File Path</label>
                <p className="text-gray-600 text-sm mt-1 font-mono bg-gray-50 p-2 rounded">
                  {viewingDoc.file_path}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDelete(viewingDoc.id)
                  setViewingDoc(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
