'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  FileText,
  Save,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  ArrowRight,
  Eye,
  MessageSquare,
} from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

interface QAChecklistItem {
  key: string
  label: string
  checked: boolean
}

const DEFAULT_CHECKLIST: QAChecklistItem[] = [
  { key: 'text_quality', label: 'Text extraction is accurate and complete', checked: false },
  { key: 'chunk_quality', label: 'Chunks are properly segmented with correct headings', checked: false },
  { key: 'metadata_complete', label: 'All required metadata fields are filled', checked: false },
  { key: 'citation_correct', label: 'Citations and case numbers are verified', checked: false },
  { key: 'summary_accurate', label: 'Summary accurately reflects the document content', checked: false },
  { key: 'key_points_valid', label: 'Key points are relevant and properly identified', checked: false },
  { key: 'formatting_ok', label: 'Formatting and structure are consistent', checked: false },
  { key: 'no_errors', label: 'No spelling or grammatical errors found', checked: false },
]

export function QAStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [checklist, setChecklist] = useState<QAChecklistItem[]>(DEFAULT_CHECKLIST)
  const [accuracyScore, setAccuracyScore] = useState(0)
  const [completenessScore, setCompletenessScore] = useState(0)
  const [formattingScore, setFormattingScore] = useState(0)
  const [overallScore, setOverallScore] = useState(0)
  const [comments, setComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [stepFeedback, setStepFeedback] = useState<Record<string, string>>({
    extraction: '',
    chunking: '',
    metadata: '',
    summarization: '',
  })
  const [showDetails, setShowDetails] = useState(false)

  const {
    documents,
    fetchDocuments,
    fetchMetadata,
    fetchChunks,
    fetchExtractedText,
    createQAReview,
    metadata,
    chunks,
    extractedText,
    myTasks,
    fetchMyTasks,
    isLoading,
    isSaving,
    error,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { status: 'summarized' })
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchDocuments, fetchMyTasks])

  useEffect(() => {
    if (selectedDoc && tokens?.access_token) {
      fetchMetadata(selectedDoc.id, tokens.access_token)
      fetchChunks(selectedDoc.id, tokens.access_token)
      fetchExtractedText(selectedDoc.id, tokens.access_token)
    }
  }, [selectedDoc, tokens, fetchMetadata, fetchChunks, fetchExtractedText])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setChecklist(DEFAULT_CHECKLIST.map(item => ({ ...item, checked: false })))
    setAccuracyScore(0)
    setCompletenessScore(0)
    setFormattingScore(0)
    setOverallScore(0)
    setComments('')
    setRejectionReason('')
    setIsApproved(null)
    setStepFeedback({ extraction: '', chunking: '', metadata: '', summarization: '' })
  }

  const toggleChecklistItem = (key: string) => {
    setChecklist(checklist.map(item =>
      item.key === key ? { ...item, checked: !item.checked } : item
    ))
  }

  const checkedCount = checklist.filter(c => c.checked).length
  const checklistProgress = (checkedCount / checklist.length) * 100

  const handleSubmitReview = async () => {
    if (!selectedDoc || !tokens?.access_token || isApproved === null) return

    const checklistObj: Record<string, boolean> = {}
    checklist.forEach(item => {
      checklistObj[item.key] = item.checked
    })

    await createQAReview(
      selectedDoc.id,
      {
        review_type: 'initial',
        accuracy_score: accuracyScore || undefined,
        completeness_score: completenessScore || undefined,
        formatting_score: formattingScore || undefined,
        overall_score: overallScore || undefined,
        is_approved: isApproved,
        rejection_reason: !isApproved ? rejectionReason : undefined,
        comments,
        step_feedback: stepFeedback,
        checklist: checklistObj,
      },
      tokens.access_token
    )

    // Refresh documents
    await fetchDocuments(tokens.access_token, { status: 'summarized' })
    setSelectedDoc(null)
  }

  // Star rating component
  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (v: number) => void
    label: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star
              size={22}
              className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    </div>
  )

  const pendingDocs = documents.filter(d => d.status === 'summarized')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality Assurance</h1>
        <p className="text-gray-600">Review and validate processed documents before publishing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Review Queue</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} awaiting review</p>
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
                    <CheckCircle className={`w-5 h-5 mt-0.5 ${
                      selectedDoc?.id === doc.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title || doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.chunk_count} chunks • {doc.category || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents awaiting review
              </div>
            )}
          </div>
        </div>

        {/* QA Review */}
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
                      <h3 className="font-semibold text-gray-900">
                        {selectedDoc.title || selectedDoc.original_filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedDoc.chunk_count} chunks • {metadata?.court_name || selectedDoc.category || 'General'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Eye size={16} />
                    {showDetails ? 'Hide' : 'View'} Details
                  </button>
                </div>
              </div>

              {/* Document Review Details */}
              {showDetails && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h4 className="font-medium text-gray-900">Document Details for Review</h4>

                  {/* Metadata review */}
                  {metadata && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Metadata</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {metadata.case_number && (
                          <div><span className="text-gray-500">Case:</span> <span className="text-gray-900">{metadata.case_number}</span></div>
                        )}
                        {metadata.court_name && (
                          <div><span className="text-gray-500">Court:</span> <span className="text-gray-900">{metadata.court_name}</span></div>
                        )}
                        {metadata.citation && (
                          <div><span className="text-gray-500">Citation:</span> <span className="text-gray-900">{metadata.citation}</span></div>
                        )}
                        {metadata.bench && (
                          <div><span className="text-gray-500">Bench:</span> <span className="text-gray-900">{metadata.bench}</span></div>
                        )}
                      </div>
                      {metadata.legal_topics && metadata.legal_topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {metadata.legal_topics.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary review */}
                  {metadata?.summary && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Summary</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{metadata.summary}</p>
                      {metadata.key_points && metadata.key_points.length > 0 && (
                        <div className="mt-3">
                          <h6 className="text-xs font-medium text-gray-500 mb-1">Key Points:</h6>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {metadata.key_points.map((kp, i) => (
                              <li key={i}>{kp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chunk samples */}
                  {chunks.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Chunks ({chunks.length} total)
                      </h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {chunks.slice(0, 3).map((chunk, idx) => (
                          <div key={chunk.id} className="text-sm bg-white rounded p-2 border border-gray-200">
                            <span className="font-medium text-primary-600">[{idx + 1}] {chunk.heading || `Chunk ${idx + 1}`}</span>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{chunk.content.substring(0, 150)}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Review Checklist</h4>
                  <span className="text-sm text-gray-500">
                    {checkedCount}/{checklist.length} completed
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-secondary-500 rounded-full transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        item.checked ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.key)}
                        className="w-4 h-4 text-secondary-600 rounded border-gray-300 focus:ring-secondary-500"
                      />
                      <span className={`text-sm ${item.checked ? 'text-green-700' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scoring */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-medium text-gray-900 mb-4">Quality Scores</h4>
                <div className="grid grid-cols-4 gap-6">
                  <StarRating value={accuracyScore} onChange={setAccuracyScore} label="Accuracy" />
                  <StarRating value={completenessScore} onChange={setCompletenessScore} label="Completeness" />
                  <StarRating value={formattingScore} onChange={setFormattingScore} label="Formatting" />
                  <StarRating value={overallScore} onChange={setOverallScore} label="Overall" />
                </div>
              </div>

              {/* Step-specific feedback */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-medium text-gray-900 mb-4">Step Feedback</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stepFeedback).map(([step, feedback]) => (
                    <div key={step}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {step}
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) =>
                          setStepFeedback(prev => ({ ...prev, [step]: e.target.value }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        placeholder={`Feedback for ${step} step...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare size={16} className="inline mr-1" />
                  General Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  placeholder="Any additional comments or observations..."
                />
              </div>

              {/* Decision */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-medium text-gray-900 mb-4">Decision</h4>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setIsApproved(true)}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      isApproved === true
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300 text-gray-600'
                    }`}
                  >
                    <ThumbsUp size={24} />
                    <div className="text-left">
                      <p className="font-medium">Approve</p>
                      <p className="text-xs opacity-75">Ready for publishing</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsApproved(false)}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      isApproved === false
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300 text-gray-600'
                    }`}
                  >
                    <ThumbsDown size={24} />
                    <div className="text-left">
                      <p className="font-medium">Reject</p>
                      <p className="text-xs opacity-75">Needs revision</p>
                    </div>
                  </button>
                </div>

                {isApproved === false && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:ring-red-500 focus:border-red-500"
                      placeholder="Explain why this document needs revision..."
                    />
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSaving || isApproved === null || (isApproved === false && !rejectionReason)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium ${
                    isSaving || isApproved === null || (isApproved === false && !rejectionReason)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isApproved
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {isApproved ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                      {isApproved ? 'Approve & Continue' : 'Reject & Send Back'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a document from the queue to review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
