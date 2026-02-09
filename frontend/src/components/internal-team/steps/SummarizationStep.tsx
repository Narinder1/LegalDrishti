'use client'

import { useState, useEffect } from 'react'
import { FileEdit, FileText, Save, ArrowRight, AlertCircle, Sparkles, Plus, X } from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

export function SummarizationStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [summary, setSummary] = useState('')
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [newKeyPoint, setNewKeyPoint] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    documents,
    fetchDocuments,
    fetchMetadata,
    fetchChunks,
    saveSummary,
    metadata,
    chunks,
    myTasks,
    fetchMyTasks,
    isLoading,
    isSaving,
    error,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { status: 'metadata_added' })
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchDocuments, fetchMyTasks])

  useEffect(() => {
    if (selectedDoc && tokens?.access_token) {
      fetchMetadata(selectedDoc.id, tokens.access_token)
      fetchChunks(selectedDoc.id, tokens.access_token)
    }
  }, [selectedDoc, tokens, fetchMetadata, fetchChunks])

  useEffect(() => {
    if (metadata) {
      setSummary(metadata.summary || '')
      setKeyPoints(metadata.key_points || [])
    } else {
      setSummary('')
      setKeyPoints([])
    }
  }, [metadata])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setSummary('')
    setKeyPoints([])
  }

  const addKeyPoint = () => {
    if (newKeyPoint.trim() && !keyPoints.includes(newKeyPoint.trim())) {
      setKeyPoints([...keyPoints, newKeyPoint.trim()])
      setNewKeyPoint('')
    }
  }

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index))
  }

  const handleAutoGenerate = async () => {
    if (!chunks.length) return
    
    setIsGenerating(true)
    
    // Simulate AI generation - in production, this would call an LLM endpoint
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate a sample summary from chunks
    const combinedText = chunks.map(c => c.content).join('\n\n')
    const words = combinedText.split(/\s+/).slice(0, 200)
    const generatedSummary = `This document discusses ${selectedDoc?.category || 'legal matters'}. ` +
      words.slice(0, 50).join(' ') + '...\n\n' +
      'The key aspects covered include the legal framework, relevant precedents, and the court\'s analysis of the issues at hand.'
    
    setSummary(generatedSummary)
    setKeyPoints([
      'Legal framework established',
      'Key precedents considered',
      'Issues analyzed in detail',
      'Final determination provided',
    ])
    
    setIsGenerating(false)
  }

  const handleSaveSummary = async () => {
    if (!selectedDoc || !tokens?.access_token || !summary) return

    await saveSummary(
      selectedDoc.id,
      { summary, key_points: keyPoints },
      tokens.access_token
    )
    
    // Refresh documents
    await fetchDocuments(tokens.access_token, { status: 'metadata_added' })
  }

  // Get documents ready for summarization
  const pendingDocs = documents.filter(d => d.status === 'metadata_added')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Summarization</h1>
        <p className="text-gray-600">Generate or write summaries for processed documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Documents Queue</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} need summarization</p>
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
                    <FileEdit className={`w-5 h-5 mt-0.5 ${
                      selectedDoc?.id === doc.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title || doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.chunk_count} chunks
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents need summarization
              </div>
            )}
          </div>
        </div>

        {/* Summarization Editor */}
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
                        {chunks.length} chunks • {metadata?.court_name || 'Unknown Court'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAutoGenerate}
                    disabled={isGenerating || chunks.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Auto-Generate
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Source Chunks Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h4 className="font-medium text-gray-900 mb-3">Source Content ({chunks.length} chunks)</h4>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                  {chunks.length > 0 ? (
                    <div className="space-y-2">
                      {chunks.slice(0, 5).map((chunk, idx) => (
                        <div key={chunk.id} className="text-sm">
                          <span className="font-medium text-primary-600">[{idx + 1}]</span>
                          <span className="text-gray-600 ml-2">
                            {chunk.content.substring(0, 200)}...
                          </span>
                        </div>
                      ))}
                      {chunks.length > 5 && (
                        <p className="text-sm text-gray-400 italic">
                          ...and {chunks.length - 5} more chunks
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No chunks available</p>
                  )}
                </div>
              </div>

              {/* Summary Editor */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="Write a comprehensive summary of the document..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {summary.length} characters • {summary.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Points
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newKeyPoint}
                      onChange={(e) => setNewKeyPoint(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addKeyPoint()
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Add a key point..."
                    />
                    <button
                      onClick={addKeyPoint}
                      className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {keyPoints.length > 0 ? (
                    <ul className="space-y-2">
                      {keyPoints.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="w-6 h-6 bg-secondary-100 text-secondary-700 rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm text-gray-700">{point}</span>
                          <button
                            onClick={() => removeKeyPoint(idx)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No key points added yet
                    </p>
                  )}
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
                  onClick={handleSaveSummary}
                  disabled={isSaving || !summary}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium ${
                    isSaving || !summary
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
                      Save Summary
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <FileEdit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a document from the queue to create summaries
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
