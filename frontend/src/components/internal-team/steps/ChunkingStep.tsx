'use client'

import { useState, useEffect } from 'react'
import { Scissors, FileText, Plus, Trash2, Save, ArrowRight, GripVertical, AlertCircle, CheckCircle, X } from 'lucide-react'
import { usePipelineStore, Document, DocumentChunk } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

interface ChunkData {
  id?: number
  chunk_index: number
  content: string
  heading: string
  section_type: string
  start_page: number | null
  end_page: number | null
}

const SECTION_TYPES = [
  'introduction',
  'facts',
  'issues',
  'arguments',
  'analysis',
  'judgment',
  'order',
  'conclusion',
  'other',
]

export function ChunkingStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [chunks, setChunks] = useState<ChunkData[]>([])
  const [sourceText, setSourceText] = useState('')
  const [autoChunkSize, setAutoChunkSize] = useState(1000)
  const [successMessage, setSuccessMessage] = useState('')

  const {
    documents,
    fetchDocuments,
    fetchExtractedText,
    fetchChunks,
    saveChunks,
    extractedText,
    chunks: savedChunks,
    myTasks,
    fetchMyTasks,
    isLoading,
    isSaving,
    error,
    setActiveStep,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { status: 'text_extracted' })
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchDocuments, fetchMyTasks])

  useEffect(() => {
    if (selectedDoc && tokens?.access_token) {
      fetchExtractedText(selectedDoc.id, tokens.access_token)
      fetchChunks(selectedDoc.id, tokens.access_token)
    }
  }, [selectedDoc, tokens, fetchExtractedText, fetchChunks])

  useEffect(() => {
    if (extractedText) {
      setSourceText(extractedText.cleaned_text || extractedText.raw_text)
    }
  }, [extractedText])

  useEffect(() => {
    if (savedChunks.length > 0) {
      setChunks(savedChunks.map(c => ({
        id: c.id,
        chunk_index: c.chunk_index,
        content: c.content,
        heading: c.heading || '',
        section_type: c.section_type || '',
        start_page: c.start_page,
        end_page: c.end_page,
      })))
    }
  }, [savedChunks])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setChunks([])
  }

  const handleAutoChunk = () => {
    if (!sourceText) return

    const words = sourceText.split(/\s+/)
    const wordsPerChunk = Math.floor(autoChunkSize / 5) // Approx 5 chars per word
    
    const newChunks: ChunkData[] = []
    let currentChunk: string[] = []
    let chunkIndex = 0

    words.forEach((word, idx) => {
      currentChunk.push(word)
      
      if (currentChunk.length >= wordsPerChunk || idx === words.length - 1) {
        newChunks.push({
          chunk_index: chunkIndex,
          content: currentChunk.join(' '),
          heading: `Section ${chunkIndex + 1}`,
          section_type: '',
          start_page: null,
          end_page: null,
        })
        currentChunk = []
        chunkIndex++
      }
    })

    setChunks(newChunks)
  }

  const handleChunkByParagraph = () => {
    if (!sourceText) return

    const paragraphs = sourceText.split(/\n\n+/).filter(p => p.trim())
    
    const newChunks: ChunkData[] = paragraphs.map((para, idx) => ({
      chunk_index: idx,
      content: para.trim(),
      heading: `Paragraph ${idx + 1}`,
      section_type: '',
      start_page: null,
      end_page: null,
    }))

    setChunks(newChunks)
  }

  const addChunk = () => {
    setChunks([
      ...chunks,
      {
        chunk_index: chunks.length,
        content: '',
        heading: '',
        section_type: '',
        start_page: null,
        end_page: null,
      },
    ])
  }

  const removeChunk = (index: number) => {
    const newChunks = chunks.filter((_, i) => i !== index)
    // Reindex
    setChunks(newChunks.map((c, i) => ({ ...c, chunk_index: i })))
  }

  const updateChunk = (index: number, field: keyof ChunkData, value: string | number | null) => {
    setChunks(chunks.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ))
  }

  const handleSaveChunks = async () => {
    if (!selectedDoc || !tokens?.access_token || chunks.length === 0) return

    await saveChunks(selectedDoc.id, chunks, tokens.access_token)
    
    // Advance document to the next step (metadata)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/pipeline/documents/${selectedDoc.id}/advance-step`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        // Show success toast
        setSuccessMessage('Successfully sent to the next step!')
        setTimeout(() => setSuccessMessage(''), 3000)

        // Clear selection and refresh
        setSelectedDoc(null)
        setChunks([])
        setSourceText('')
        await fetchDocuments(tokens.access_token, { status: 'text_extracted' })

        // Navigate to metadata step
        setActiveStep('metadata')
      }
    } catch (err) {
      console.error('Failed to advance step:', err)
    }
  }

  // Get documents ready for chunking
  const pendingDocs = documents.filter(d => d.status === 'text_extracted')

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chunking</h1>
        <p className="text-gray-600">Break extracted text into manageable chunks for processing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Documents Queue</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} ready for chunking</p>
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
                    <Scissors className={`w-5 h-5 mt-0.5 ${
                      selectedDoc?.id === doc.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title || doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.word_count ? `${doc.word_count} words` : doc.file_type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents ready for chunking
              </div>
            )}
          </div>
        </div>

        {/* Chunking Editor */}
        <div className="lg:col-span-3">
          {selectedDoc ? (
            <div className="space-y-4">
              {/* Document Info & Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedDoc.title || selectedDoc.original_filename}</h3>
                      <p className="text-sm text-gray-500">
                        {sourceText.split(/\s+/).filter(Boolean).length} words available
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auto-chunk controls */}
                <div className="mt-4 flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Chunk size:</label>
                    <input
                      type="number"
                      value={autoChunkSize}
                      onChange={(e) => setAutoChunkSize(parseInt(e.target.value) || 1000)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      min={100}
                      step={100}
                    />
                    <span className="text-xs text-gray-500">chars</span>
                  </div>
                  <button
                    onClick={handleAutoChunk}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    Auto-Chunk by Size
                  </button>
                  <button
                    onClick={handleChunkByParagraph}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    Chunk by Paragraphs
                  </button>
                </div>
              </div>

              {/* Chunks List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Chunks ({chunks.length})</h3>
                  <button
                    onClick={addChunk}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    <Plus size={16} />
                    Add Chunk
                  </button>
                </div>

                {chunks.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {chunks.map((chunk, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 pt-1">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={chunk.heading}
                                onChange={(e) => updateChunk(index, 'heading', e.target.value)}
                                placeholder="Heading"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                              <select
                                value={chunk.section_type}
                                onChange={(e) => updateChunk(index, 'section_type', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="">Section Type</option>
                                {SECTION_TYPES.map(type => (
                                  <option key={type} value={type} className="capitalize">
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={chunk.start_page || ''}
                                  onChange={(e) => updateChunk(index, 'start_page', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Start"
                                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                  type="number"
                                  value={chunk.end_page || ''}
                                  onChange={(e) => updateChunk(index, 'end_page', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="End"
                                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <textarea
                              value={chunk.content}
                              onChange={(e) => updateChunk(index, 'content', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none"
                              placeholder="Chunk content..."
                            />
                            <p className="text-xs text-gray-400">
                              {chunk.content.length} characters • {chunk.content.split(/\s+/).filter(Boolean).length} words
                            </p>
                          </div>
                          <button
                            onClick={() => removeChunk(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No chunks yet. Use auto-chunk or add manually.</p>
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

              {/* Success Toast */}
              {successMessage && (
                <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg shadow-sm border border-green-100">
                  <CheckCircle size={18} />
                  <span className="text-sm">{successMessage}</span>
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="text-green-500 hover:text-green-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSaveChunks}
                  disabled={isSaving || chunks.length === 0}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium ${
                    isSaving || chunks.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={18} />
                      Proceed to Metadata
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a document from the queue to start chunking
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
