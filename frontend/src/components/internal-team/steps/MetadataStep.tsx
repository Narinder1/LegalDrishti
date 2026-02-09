'use client'

import { useState, useEffect } from 'react'
import { Tag, FileText, Plus, X, Save, ArrowRight, AlertCircle } from 'lucide-react'
import { usePipelineStore, Document } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

interface MetadataFormData {
  case_number: string
  court_name: string
  bench: string
  parties: string
  citation: string
  parallel_citations: string
  legal_topics: string[]
  acts_referred: string[]
  sections_referred: string[]
  headnotes: string
  ratio_decidendi: string
  obiter_dicta: string
}

const initialFormData: MetadataFormData = {
  case_number: '',
  court_name: '',
  bench: '',
  parties: '',
  citation: '',
  parallel_citations: '',
  legal_topics: [],
  acts_referred: [],
  sections_referred: [],
  headnotes: '',
  ratio_decidendi: '',
  obiter_dicta: '',
}

const COURTS = [
  'Supreme Court of India',
  'Delhi High Court',
  'Bombay High Court',
  'Madras High Court',
  'Calcutta High Court',
  'Karnataka High Court',
  'Gujarat High Court',
  'Punjab and Haryana High Court',
  'Allahabad High Court',
  'Other High Court',
  'National Company Law Tribunal (NCLT)',
  'National Green Tribunal (NGT)',
  'District Court',
  'Other',
]

const COMMON_ACTS = [
  'Indian Contract Act, 1872',
  'Indian Penal Code, 1860',
  'Code of Criminal Procedure, 1973',
  'Code of Civil Procedure, 1908',
  'Constitution of India',
  'Companies Act, 2013',
  'Arbitration and Conciliation Act, 1996',
  'Income Tax Act, 1961',
  'GST Act, 2017',
  'Consumer Protection Act, 2019',
  'Negotiable Instruments Act, 1881',
  'Transfer of Property Act, 1882',
  'Indian Evidence Act, 1872',
  'Motor Vehicles Act, 1988',
  'Information Technology Act, 2000',
]

export function MetadataStep() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [formData, setFormData] = useState<MetadataFormData>(initialFormData)
  const [newTopic, setNewTopic] = useState('')
  const [newAct, setNewAct] = useState('')
  const [newSection, setNewSection] = useState('')

  const {
    documents,
    fetchDocuments,
    fetchMetadata,
    saveMetadata,
    metadata,
    myTasks,
    fetchMyTasks,
    isLoading,
    isSaving,
    error,
  } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchDocuments(tokens.access_token, { status: 'chunked' })
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
      setFormData({
        case_number: metadata.case_number || '',
        court_name: metadata.court_name || '',
        bench: metadata.bench || '',
        parties: metadata.parties || '',
        citation: metadata.citation || '',
        parallel_citations: metadata.parallel_citations || '',
        legal_topics: metadata.legal_topics || [],
        acts_referred: metadata.acts_referred || [],
        sections_referred: metadata.sections_referred || [],
        headnotes: metadata.headnotes || '',
        ratio_decidendi: metadata.ratio_decidendi || '',
        obiter_dicta: metadata.obiter_dicta || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [metadata])

  const handleSelectDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setFormData(initialFormData)
  }

  const updateField = (field: keyof MetadataFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: 'legal_topics' | 'acts_referred' | 'sections_referred', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateField(field, [...formData[field], value.trim()])
    }
  }

  const removeFromArray = (field: 'legal_topics' | 'acts_referred' | 'sections_referred', index: number) => {
    updateField(field, formData[field].filter((_, i) => i !== index))
  }

  const handleSaveMetadata = async () => {
    if (!selectedDoc || !tokens?.access_token) return

    await saveMetadata(selectedDoc.id, formData, tokens.access_token)
    
    // Refresh documents
    await fetchDocuments(tokens.access_token, { status: 'chunked' })
  }

  // Get documents ready for metadata
  const pendingDocs = documents.filter(d => d.status === 'chunked')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Metadata</h1>
        <p className="text-gray-600">Add legal metadata and classification to documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Documents Queue</h3>
            <p className="text-xs text-gray-500 mt-1">{pendingDocs.length} need metadata</p>
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
                    <Tag className={`w-5 h-5 mt-0.5 ${
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
                No documents need metadata
              </div>
            )}
          </div>
        </div>

        {/* Metadata Form */}
        <div className="lg:col-span-3">
          {selectedDoc ? (
            <div className="space-y-4">
              {/* Document Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedDoc.title || selectedDoc.original_filename}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedDoc.chunk_count} chunks • {selectedDoc.category || 'Uncategorized'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
                {/* Case Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Case Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                      <input
                        type="text"
                        value={formData.case_number}
                        onChange={(e) => updateField('case_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Civil Appeal No. 1234/2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                      <select
                        value={formData.court_name}
                        onChange={(e) => updateField('court_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Court</option>
                        {COURTS.map(court => (
                          <option key={court} value={court}>{court}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bench</label>
                      <input
                        type="text"
                        value={formData.bench}
                        onChange={(e) => updateField('bench', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Hon'ble Justice X, Hon'ble Justice Y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parties</label>
                      <input
                        type="text"
                        value={formData.parties}
                        onChange={(e) => updateField('parties', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., ABC vs XYZ"
                      />
                    </div>
                  </div>
                </div>

                {/* Citation */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Citation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Citation</label>
                      <input
                        type="text"
                        value={formData.citation}
                        onChange={(e) => updateField('citation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., (2025) 1 SCC 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parallel Citations</label>
                      <input
                        type="text"
                        value={formData.parallel_citations}
                        onChange={(e) => updateField('parallel_citations', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., AIR 2025 SC 456"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Topics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Legal Topics</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('legal_topics', newTopic)
                          setNewTopic('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Add legal topic..."
                    />
                    <button
                      onClick={() => {
                        addToArray('legal_topics', newTopic)
                        setNewTopic('')
                      }}
                      className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.legal_topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {topic}
                        <button onClick={() => removeFromArray('legal_topics', idx)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acts Referred */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Acts Referred</h4>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newAct}
                      onChange={(e) => {
                        if (e.target.value) {
                          addToArray('acts_referred', e.target.value)
                          setNewAct('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select common act...</option>
                      {COMMON_ACTS.filter(act => !formData.acts_referred.includes(act)).map(act => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newAct}
                      onChange={(e) => setNewAct(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('acts_referred', newAct)
                          setNewAct('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Or type custom..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.acts_referred.map((act, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full text-sm"
                      >
                        {act}
                        <button onClick={() => removeFromArray('acts_referred', idx)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Sections Referred</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('sections_referred', newSection)
                          setNewSection('')
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Section 302 IPC"
                    />
                    <button
                      onClick={() => {
                        addToArray('sections_referred', newSection)
                        setNewSection('')
                      }}
                      className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sections_referred.map((section, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {section}
                        <button onClick={() => removeFromArray('sections_referred', idx)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legal Content */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Legal Content</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headnotes</label>
                      <textarea
                        value={formData.headnotes}
                        onChange={(e) => updateField('headnotes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Key points summarizing the judgment..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ratio Decidendi</label>
                      <textarea
                        value={formData.ratio_decidendi}
                        onChange={(e) => updateField('ratio_decidendi', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="The principle of law on which the court's decision is based..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Obiter Dicta</label>
                      <textarea
                        value={formData.obiter_dicta}
                        onChange={(e) => updateField('obiter_dicta', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Remarks made by the court that are not binding..."
                      />
                    </div>
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

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSaveMetadata}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium ${
                    isSaving
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
                      Save Metadata
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
              <p className="text-gray-500">
                Choose a document from the queue to add metadata
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
