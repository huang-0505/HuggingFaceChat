"use client"

import type React from "react"
import { useState, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function useHuggingFaceChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        })

        if (!response.ok) {
          // Handle error response
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to get response")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split("\n")

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim()
                  if (data === "[DONE]") {
                    setIsLoading(false)
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                        ),
                      )
                    }
                  } catch (e) {
                    // Ignore parsing errors for individual chunks
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        }
      } catch (error) {
        console.error("Chat error:", error)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages, isLoading],
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  }
}
