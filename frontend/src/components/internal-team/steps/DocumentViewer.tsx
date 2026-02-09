'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, FileWarning, Download } from 'lucide-react'

interface DocumentViewerProps {
  url: string
  fileType: string // 'pdf', 'docx', 'doc', 'txt', 'rtf', 'odt'
}

export function DocumentViewer({ url, fileType }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const isPdf = fileType === 'pdf'
  const isDocx = fileType === 'docx' || fileType === 'doc'
  const isText = fileType === 'txt' || fileType === 'rtf' || fileType === 'odt'

  // Fetch PDF as blob to bypass download managers (IDM etc.)
  const loadPdf = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch PDF')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setBlobUrl(objectUrl)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load PDF'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [url])

  // Handle DOCX/DOC files using mammoth
  const loadDocx = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch document')
      const arrayBuffer = await response.arrayBuffer()
      const mammoth = await import('mammoth')
      const result = await mammoth.convertToHtml({ arrayBuffer })
      setHtmlContent(result.value)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load document'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [url])

  // Handle TXT/RTF files
  const loadText = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch document')
      const text = await response.text()
      setTextContent(text)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load document'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (isPdf) {
      loadPdf()
    } else if (isDocx) {
      loadDocx()
    } else if (isText) {
      loadText()
    }
  }, [isPdf, isDocx, isText, loadPdf, loadDocx, loadText])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="text-sm">Loading document...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
        <FileWarning size={40} className="text-red-400 mb-4" />
        <p className="text-sm font-medium text-red-600">Failed to load document</p>
        <p className="text-xs text-gray-400 mt-1">{error}</p>
      </div>
    )
  }

  // PDF rendering — fetch as blob, render via browser's native viewer
  if (isPdf && blobUrl) {
    return (
      <div className="flex flex-col h-full">
        <iframe
          src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full flex-1 min-h-[70vh] rounded-b-xl border-0"
          title="PDF Document Viewer"
        />
      </div>
    )
  }

  // DOCX/DOC rendering
  if (isDocx && htmlContent !== null) {
    return (
      <div className="h-full overflow-auto p-6 bg-white">
        <div
          className="prose prose-sm max-w-none 
            prose-headings:text-gray-900 prose-p:text-gray-700 
            prose-table:border prose-th:bg-gray-100 prose-th:p-2 prose-td:p-2 prose-td:border
            prose-img:max-w-full prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    )
  }

  // TXT/RTF rendering
  if (isText && textContent !== null) {
    return (
      <div className="h-full overflow-auto p-6 bg-white">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
          {textContent}
        </pre>
      </div>
    )
  }

  // Unsupported format fallback
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
      <FileWarning size={40} className="text-amber-400 mb-4" />
      <p className="text-sm font-medium">Unsupported file format: .{fileType}</p>
      <a
        href={url}
        download
        className="mt-3 text-sm text-blue-500 hover:text-blue-600 underline"
      >
        Download file instead
      </a>
    </div>
  )
}
