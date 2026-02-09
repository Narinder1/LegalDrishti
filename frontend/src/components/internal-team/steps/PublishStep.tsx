'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  Rocket,
  Tag,
  Plus,
  X,
  Database,
  PartyPopper,
} from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

export function PublishStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [searchKeywords, setSearchKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [searchWeight, setSearchWeight] = useState(1.0)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const {
    documents,
    fetchDocuments,
    fetchMetadata,
    publishDocument,
    metadata,
    myTasks,
    fetchMyTasks,
    isLoading,
    isSaving,
    error,
    clearError,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { status: 'qa_approved' })
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchDocuments, fetchMyTasks])

  useEffect(() => {
    if (selectedDoc && tokens?.access_token) {
      fetchMetadata(selectedDoc.id, tokens.access_token)
    }
  }, [selectedDoc, tokens, fetchMetadata])

  useEffect(() => {
    if (metadata) {
      // Auto-populate keywords from metadata
      const autoKeywords: string[] = []
      if (metadata.legal_topics) autoKeywords.push(...metadata.legal_topics)
      if (metadata.court_name) autoKeywords.push(metadata.court_name)
      if (metadata.acts_referred) autoKeywords.push(...metadata.acts_referred.slice(0, 3))
      setSearchKeywords(autoKeywords)
    }
  }, [metadata])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setSearchKeywords([])
    setSearchWeight(1.0)
    setPublishSuccess(false)
    clearError()
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !searchKeywords.includes(newKeyword.trim())) {
      setSearchKeywords([...searchKeywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    setSearchKeywords(searchKeywords.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    if (!selectedDoc || !tokens?.access_token) return

    await publishDocument(
      selectedDoc.id,
      { search_keywords: searchKeywords, search_weight: searchWeight },
      tokens.access_token
    )

    setPublishSuccess(true)
    // Refresh documents
    await fetchDocuments(tokens.access_token, { status: 'qa_approved' })
  }

  const pendingDocs = documents.filter(d => d.status === 'qa_approved')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publish</h1>
        <p className="text-gray-600">Publish approved documents to the legal database</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Ready to Publish</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} approved</p>
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
                    <Globe className={`w-5 h-5 mt-0.5 ${
                      selectedDoc?.id === doc.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title || doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        QA Approved • {doc.category || 'General'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents ready to publish
              </div>
            )}
          </div>
        </div>

        {/* Publish Editor */}
        <div className="lg:col-span-3">
          {publishSuccess ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Published Successfully!</h3>
              <p className="text-gray-500 mb-6">
                The document has been published to the legal database and is now searchable.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg max-w-md mx-auto">
                <Database size={18} />
                <span>Document is now live in the legal database</span>
              </div>
              <button
                onClick={() => {
                  setPublishSuccess(false)
                  setSelectedDoc(null)
                }}
                className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Publish Another Document
              </button>
            </div>
          ) : selectedDoc ? (
            <div className="space-y-4">
              {/* Document Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedDoc.title || selectedDoc.original_filename}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedDoc.file_type.toUpperCase()} • {selectedDoc.chunk_count} chunks
                    </p>
                  </div>
                </div>

                {/* Pre-publish review */}
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Pre-Publish Review
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-green-700">Text extraction completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-green-700">Chunking completed ({selectedDoc.chunk_count} chunks)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-green-700">Metadata added</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-green-700">Summary generated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-green-700">QA approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Rocket size={14} className="text-green-600" />
                      <span className="text-green-700 font-medium">Ready for publishing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Preview */}
              {metadata && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h4 className="font-medium text-gray-900 mb-3">Document Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {metadata.case_number && (
                      <div>
                        <span className="text-gray-500">Case Number:</span>
                        <span className="ml-2 text-gray-900">{metadata.case_number}</span>
                      </div>
                    )}
                    {metadata.court_name && (
                      <div>
                        <span className="text-gray-500">Court:</span>
                        <span className="ml-2 text-gray-900">{metadata.court_name}</span>
                      </div>
                    )}
                    {metadata.citation && (
                      <div>
                        <span className="text-gray-500">Citation:</span>
                        <span className="ml-2 text-gray-900">{metadata.citation}</span>
                      </div>
                    )}
                    {metadata.parties && (
                      <div>
                        <span className="text-gray-500">Parties:</span>
                        <span className="ml-2 text-gray-900">{metadata.parties}</span>
                      </div>
                    )}
                  </div>
                  {metadata.summary && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Summary:</span>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-3">{metadata.summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Search Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h4 className="font-medium text-gray-900">Search Optimization</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Keywords
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addKeyword()
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Add search keyword..."
                    />
                    <button
                      onClick={addKeyword}
                      className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchKeywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        <Tag size={12} />
                        {keyword}
                        <button onClick={() => removeKeyword(idx)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Weight ({searchWeight})
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={searchWeight}
                    onChange={(e) => setSearchWeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low Priority</span>
                    <span>Normal</span>
                    <span>High Priority</span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Publish Button */}
              <div className="flex justify-end">
                <button
                  onClick={handlePublish}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-lg ${
                    isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-secondary-600 to-primary-600 text-white hover:from-secondary-700 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket size={22} />
                      Publish to Database
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a QA-approved document to publish to the legal database
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
