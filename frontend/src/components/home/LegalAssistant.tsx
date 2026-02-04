'use client'

import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { Bot, Send, Loader2, X, Maximize2, Minimize2, Square } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useChatStore } from '@/store/chatStore'

// Quick Actions - defined outside component to prevent re-creation
const quickActions = [
  'Search for corporate lawyers',
  'File a case online',
  'Get legal advice',
  'Find templates',
] as const

// Memoized message component to prevent unnecessary re-renders
const MessageBubble = memo(({ message }: { message: { id: string; role: 'user' | 'assistant'; content: string } }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
        message.role === 'user'
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {message.content}
    </div>
  </div>
))
MessageBubble.displayName = 'MessageBubble'

// Memoized Messages List
const MessagesList = memo(({ messages, isLoading, error, containerRef }: { 
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  // Keep scrolling inside the chat box without moving the whole page
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isLoading, containerRef])

  return (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-center">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </>
  )
})
MessagesList.displayName = 'MessagesList'

// Memoized Input Area
const ChatInput = memo(({ 
  isLoading, 
  onSend, 
  onStop 
}: { 
  isLoading: boolean;
  onSend: (msg: string) => void;
  onStop: () => void;
}) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }, [input, isLoading, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      onSend(input.trim())
      setInput('')
    }
  }, [input, isLoading, onSend])

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700 transition-colors"
            title="Stop generation"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700 disabled:text-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Your data stays secured feel free to ask any legal questions.
      </p>
    </div>
  )
})
ChatInput.displayName = 'ChatInput'

// Main component - minimal re-renders
export const LegalAssistant = memo(function LegalAssistant() {
  // Selective subscriptions - only re-render when specific values change
  const messages = useChatStore((state) => state.messages)
  const isLoading = useChatStore((state) => state.isLoading)
  const error = useChatStore((state) => state.error)
  const isExpanded = useChatStore((state) => state.isExpanded)

  // Chat container ref for internal scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Actions don't cause re-renders
  const sendMessage = useChatStore((state) => state.sendMessage)
  const stopGeneration = useChatStore((state) => state.stopGeneration)
  const clearChat = useChatStore((state) => state.clearChat)
  const setExpanded = useChatStore((state) => state.setExpanded)
  
  const handleQuickAction = useCallback((action: string) => {
    sendMessage(action)
  }, [sendMessage])
  
  const handleToggleExpand = useCallback(() => {
    setExpanded(!isExpanded)
  }, [setExpanded, isExpanded])

  return (
    <div className={`bg-white rounded-xl shadow-sm transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Legal Assistant</h2>
            <p className="text-xs text-gray-500">Powered by {siteConfig.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
              title="Clear chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleExpand}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={`overflow-y-auto p-4 space-y-3 ${
          isExpanded ? 'h-[calc(100%-140px)]' : 'h-48'
        }`}
      >
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <Bot className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ask me anything about legal matters!</p>
            
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {quickActions.map((action, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-primary-100 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MessagesList 
            messages={messages} 
            isLoading={isLoading} 
            error={error}
            containerRef={messagesContainerRef}
          />
        )}
      </div>

      {/* Input Area */}
      <ChatInput 
        isLoading={isLoading} 
        onSend={sendMessage} 
        onStop={stopGeneration} 
      />
    </div>
  )
})

LegalAssistant.displayName = 'LegalAssistant'
