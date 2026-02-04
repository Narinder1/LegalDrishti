import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Strip simple markdown (bold/italic/code) from assistant responses
const sanitizeResponse = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')

// Types
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatState {
  // State
  messages: Message[]
  isLoading: boolean
  error: string | null
  isExpanded: boolean
  abortController: AbortController | null

  // Actions
  sendMessage: (messageText: string) => void
  stopGeneration: () => void
  clearChat: () => void
  setExpanded: (expanded: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatState>()(subscribeWithSelector((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  error: null,
  isExpanded: false,
  abortController: null,

  // Send message action - fire and forget, no async/await needed
  sendMessage: (messageText: string) => {
    const trimmedMessage = messageText.trim()
    if (!trimmedMessage || get().isLoading) return

    // Create abort controller for this request
    const controller = new AbortController()

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    }

    // Update state with user message and loading state
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
      abortController: controller,
    }))

    // Fire the API call without blocking
    fetch(`${API_URL}/api/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: trimmedMessage,
        history: get().messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to get response')
        return response.json()
      })
      .then((data) => {
        // Only proceed if not aborted
        if (!controller.signal.aborted) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: sanitizeResponse(String(data.response ?? '')),
            timestamp: new Date(),
          }
          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isLoading: false,
            abortController: null,
          }))
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Request cancelled')
          set({ isLoading: false, abortController: null })
        } else {
          console.error('Chat error:', err)
          set({
            error: 'Failed to connect. Make sure the backend is running.',
            isLoading: false,
            abortController: null,
          })
        }
      })
  },

  // Stop generation action
  stopGeneration: () => {
    const controller = get().abortController
    if (controller) {
      controller.abort()
      set({ isLoading: false, abortController: null })
    }
  },

  // Clear chat action
  clearChat: () => {
    set({ messages: [], error: null, isLoading: false })
  },

  // Set expanded state
  setExpanded: (expanded: boolean) => {
    set({ isExpanded: expanded })
  },

  // Set error
  setError: (error: string | null) => {
    set({ error })
  },
})))
