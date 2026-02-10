'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Play, Save, CheckCircle, AlertCircle, Eye, ArrowRight, X, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'
import { DocumentViewer } from './DocumentViewer'

export function TextExtractionStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [extractionMethod, setExtractionMethod] = useState('direct')
  const [showOriginal, setShowOriginal] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const {
    documents,
    fetchDocuments,
    fetchExtractedText,
    saveExtractedText,
    saveDraftExtractedText,
    extractRawText,
    cleanRawText,
    extractedText,
    myTasks,
    fetchMyTasks,
    startTask,
    isLoading,
    isSaving,
    error,
    clearError,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { step: 'text_extraction' })
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchDocuments, fetchMyTasks])

  useEffect(() => {
    if (selectedDoc && tokens?.access_token) {
      fetchExtractedText(selectedDoc.id, tokens.access_token)
    }
  }, [selectedDoc, tokens, fetchExtractedText])

  useEffect(() => {
    if (extractedText) {
      setRawText(extractedText.raw_text)
      setCleanedText(extractedText.cleaned_text || '')
      setExtractionMethod(extractedText.extraction_method || 'direct')
    } else {
      setRawText('')
      setCleanedText('')
    }
  }, [extractedText])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setShowOriginal(true)
    clearError()
  }

  const handleExtractRawText = async () => {
    if (!selectedDoc || !tokens?.access_token) return
    setIsExtracting(true)
    setExtractionProgress(0)
    clearError()
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 300)
    
    try {
      const result = await extractRawText(selectedDoc.id, extractionMethod, tokens.access_token)
      if (result) {
        setExtractionProgress(100)
        setTimeout(() => {
          setRawText(result.raw_text)
        }, 200)
      }
    } finally {
      clearInterval(progressInterval)
      setTimeout(() => {
        setIsExtracting(false)
        setExtractionProgress(0)
      }, 500)
    }
  }

  const handleCleanText = async () => {
    if (!selectedDoc || !tokens?.access_token || !rawText) return
    setIsCleaning(true)
    clearError()
    try {
      const result = await cleanRawText(selectedDoc.id, rawText, tokens.access_token)
      if (result) {
        setCleanedText(result.cleaned_text)
      }
    } finally {
      setIsCleaning(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedDoc || !tokens?.access_token || !rawText) return
    setIsSavingDraft(true)
    try {
      await saveDraftExtractedText(
        selectedDoc.id,
        {
          raw_text: rawText,
          cleaned_text: cleanedText || undefined,
          extraction_method: extractionMethod,
        },
        tokens.access_token
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSaveExtraction = async () => {
    if (!selectedDoc || !tokens?.access_token || !rawText) return

    await saveExtractedText(
      selectedDoc.id,
      {
        raw_text: rawText,
        cleaned_text: cleanedText || undefined,
        extraction_method: extractionMethod,
      },
      tokens.access_token
    )

    // Refresh documents list
    await fetchDocuments(tokens.access_token, { step: 'text_extraction' })
  }

  // Get documents needing extraction - filter by current_step
  let pendingDocs = documents.filter(d => d.current_step === 'text_extraction')
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    pendingDocs = pendingDocs.filter(doc =>
      doc.title?.toLowerCase().includes(query) ||
      doc.original_filename.toLowerCase().includes(query) ||
      doc.category?.toLowerCase().includes(query)
    )
  }
  
  const myPendingTasks = myTasks.pending.filter(t => t.step === 'text_extraction')

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const originalUrl = selectedDoc && tokens?.access_token
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/pipeline/documents/${selectedDoc.id}/file?token=${tokens.access_token}`
    : ''

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Text Extraction</h1>
          <p className="text-gray-600">Extract and clean text from uploaded documents</p>
        </div>
        {myPendingTasks.length > 0 && (
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm">
            {myPendingTasks.length} task(s) assigned to you
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Documents Queue</h3>
                <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} pending extraction</p>
              </div>
              <button
                onClick={() => {
                  setShowSearch(!showSearch)
                  if (showSearch) setSearchQuery('')
                }}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Search documents"
              >
                {showSearch ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>
            {showSearch && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mt-2"
                autoFocus
              />
            )}
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {pendingDocs.length > 0 ? (
              pendingDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    selectedDoc?.id === doc.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className={`w-5 h-5 mt-0.5 ${
                      selectedDoc?.id === doc.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title || doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents pending extraction
              </div>
            )}
          </div>
        </div>

        {/* Extraction Editor */}
        <div className="lg:col-span-3">
          {selectedDoc ? (
            <div className="space-y-4">
              {/* Document Info & Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedDoc.title || selectedDoc.original_filename}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedDoc.file_type.toUpperCase()} • {formatFileSize(selectedDoc.file_size)}
                        {selectedDoc.page_count && ` • ${selectedDoc.page_count} pages`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showOriginal 
                        ? 'bg-primary-600 text-white hover:bg-primary-700' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Eye size={16} />
                    {showOriginal ? 'Hide Original' : 'View Original'}
                  </button>
                </div>

                {/* Extraction Controls */}
                <div className="flex items-end gap-4 pt-4 border-t border-gray-100">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extraction Method
                    </label>
                    <select
                      value={extractionMethod}
                      onChange={(e) => setExtractionMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="direct">Direct Text</option>
                      <option value="ocr">OCR (Scanned)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <button
                    onClick={handleExtractRawText}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Extracting... {Math.round(extractionProgress)}%
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Extract Raw Text
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCleanText}
                    disabled={!rawText || isCleaning}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Clean Text
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Text Editor - Multiple columns with Original Document Viewer */}
              <div className={`grid gap-4 ${showOriginal ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {/* Original Document Viewer */}
                {showOriginal && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Original Document
                      </label>
                      <button
                        onClick={() => setShowOriginal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
                      {originalUrl ? (
                        <DocumentViewer
                          url={originalUrl}
                          fileType={selectedDoc.file_type || 'pdf'}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                          Unable to load document
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Extracted Text */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Raw Extracted Text
                    </label>
                  </div>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={26}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Click 'Extract Raw Text' to extract content from the document..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {rawText.length} characters • {rawText.split(/\s+/).filter(Boolean).length} words
                    </p>
                    <button
                      onClick={handleSaveDraft}
                      disabled={!rawText || isSavingDraft}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingDraft ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cleaned Text */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cleaned Text (Optional)
                    </label>
                    {isCleaning && (
                      <span className="flex items-center gap-1 text-xs text-violet-600">
                        <Loader2 size={12} className="animate-spin" />
                        Cleaning text...
                      </span>
                    )}
                  </div>
                  <textarea
                    value={cleanedText}
                    onChange={(e) => setCleanedText(e.target.value)}
                    rows={26}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Click 'Clean Text' to auto-clean the extracted text, or type manually..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {cleanedText.length} characters • {cleanedText.split(/\s+/).filter(Boolean).length} words
                    </p>
                    <button
                      onClick={handleSaveDraft}
                      disabled={!rawText || isSavingDraft}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingDraft ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                  <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Save Action */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSaveExtraction}
                  disabled={isSaving || !rawText}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isSaving || !rawText
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-secondary-600 text-white hover:bg-secondary-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save & Complete
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a document from the queue to extract and process text
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
