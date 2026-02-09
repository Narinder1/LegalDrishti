'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Play, Save, CheckCircle, AlertCircle, Eye, ArrowRight, X } from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'
import { DocumentViewer } from './DocumentViewer'

export function TextExtractionStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [rawText, setRawText] = useState('')
  const [cleanedText, setCleanedText] = useState('')
  const [extractionMethod, setExtractionMethod] = useState('direct')
  const [confidenceScore, setConfidenceScore] = useState(0.95)
  const [showOriginal, setShowOriginal] = useState(false)

  const {
    documents,
    fetchDocuments,
    fetchExtractedText,
    saveExtractedText,
    extractedText,
    myTasks,
    fetchMyTasks,
    startTask,
    isLoading,
    isSaving,
    error,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      // Fetch documents that are uploaded but not yet extracted (status = 'uploaded')
      fetchDocuments(tokens.access_token, { status: 'uploaded' })
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
      setConfidenceScore(extractedText.confidence_score || 0.95)
    } else {
      setRawText('')
      setCleanedText('')
    }
  }, [extractedText])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setShowOriginal(false)
  }

  const handleSaveExtraction = async () => {
    if (!selectedDoc || !tokens?.access_token || !rawText) return

    await saveExtractedText(
      selectedDoc.id,
      {
        raw_text: rawText,
        cleaned_text: cleanedText || undefined,
        extraction_method: extractionMethod,
        confidence_score: confidenceScore,
      },
      tokens.access_token
    )

    // Refresh documents list
    await fetchDocuments(tokens.access_token, { status: 'uploaded' })
  }

  const handleAutoClean = () => {
    // Simple text cleaning - remove extra whitespace, normalize line breaks
    let cleaned = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
    setCleanedText(cleaned)
  }

  // Get documents needing extraction
  const pendingDocs = documents.filter(d => d.status === 'uploaded')
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
            <h3 className="font-semibold text-gray-900">Documents Queue</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} pending extraction</p>
          </div>
          <div className="p-2 max-h-[500px] overflow-y-auto">
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
              {/* Document Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOriginal(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <Eye size={16} />
                      View Original
                    </button>
                  </div>
                </div>
              </div>

              {/* Extraction Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extraction Method
                    </label>
                    <select
                      value={extractionMethod}
                      onChange={(e) => setExtractionMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="direct">Direct Text</option>
                      <option value="ocr">OCR (Scanned)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={confidenceScore}
                      onChange={(e) => setConfidenceScore(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAutoClean}
                      disabled={!rawText}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      Auto-Clean Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Editor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raw Extracted Text
                  </label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none"
                    placeholder="Paste or type the extracted text here..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {rawText.length} characters • {rawText.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cleaned Text (Optional)
                  </label>
                  <textarea
                    value={cleanedText}
                    onChange={(e) => setCleanedText(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none"
                    placeholder="Cleaned/preprocessed text (after removing headers, footers, etc.)"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {cleanedText.length} characters • {cleanedText.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSaveExtraction}
                  disabled={isSaving || !rawText}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium ${
                    isSaving || !rawText
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-secondary-600 text-white hover:bg-secondary-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

    {/* View Original Modal */}
    {showOriginal && selectedDoc && (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Original Document</p>
              <h3 className="text-lg font-semibold text-gray-900">{selectedDoc.title || selectedDoc.original_filename}</h3>
            </div>
            <button
              onClick={() => setShowOriginal(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 bg-gray-50 min-h-[70vh]">
            {originalUrl && selectedDoc ? (
              <DocumentViewer
                url={originalUrl}
                fileType={selectedDoc.file_type || 'pdf'}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Unable to load original document
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
