"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronDown, Mic, Send } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  lastMessage: Date
}

export default function VetLLMChatUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("VetLLM 🐕")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const generateChatTitle = (firstMessage: string): string => {
    // Generate a title from the first message (first 30 characters)
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage
  }

  const startNewChat = () => {
    // If current chat has messages, save it to recent chats
    if (messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === "user")
      const chatTitle = firstUserMessage ? generateChatTitle(firstUserMessage.content) : "New Consultation"

      const currentChat: Chat = {
        id: Date.now().toString(),
        title: chatTitle,
        messages: [...messages],
        lastMessage: new Date(),
      }

      setRecentChats((prev) => [currentChat, ...prev])
    }

    // Start fresh
    setMessages([])
    setCurrentChatId(null)
  }

  const loadChat = (chat: Chat) => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === "user")
      const chatTitle = firstUserMessage ? generateChatTitle(firstUserMessage.content) : "New Consultation"

      const currentChat: Chat = {
        id: Date.now().toString(),
        title: chatTitle,
        messages: [...messages],
        lastMessage: new Date(),
      }

      setRecentChats((prev) => [currentChat, ...prev.filter((c) => c.id !== chat.id)])
    }

    // Load selected chat
    setMessages(chat.messages)
    setCurrentChatId(chat.id)

    // Remove from recent chats since it's now active
    setRecentChats((prev) => prev.filter((c) => c.id !== chat.id))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
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
          model: "your-vetllm-model-name", // Replace with your actual VetLLM model
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Woof! I encountered an error. Please try again - I'm here to help with your pet questions! 🐾",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white">
      {/* Veterinary Sidebar */}
      <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
        {/* Model Selector */}
        <div className="p-4 border-b border-gray-800">
          <Button variant="ghost" className="w-full justify-between text-left font-medium hover:bg-gray-800">
            <div className="flex items-center">
              <span className="mr-2">🐕</span>
              VetLLM
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* New Consultation Button */}
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-start mb-1 hover:bg-gray-800" onClick={startNewChat}>
            <Plus className="h-4 w-4 mr-3" />
            New consultation
          </Button>
        </div>

        {/* Recent Consultations */}
        <div className="p-2 flex-1">
          <div className="text-xs text-gray-400 mb-2 px-2 flex items-center">
            <span className="mr-1">🐾</span>
            Recent consultations
          </div>
          <ScrollArea className="flex-1">
            {recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className="w-full justify-start mb-1 text-sm hover:bg-gray-800 truncate"
                  onClick={() => loadChat(chat)}
                >
                  <span className="mr-2 text-xs">🐶</span>
                  {chat.title}
                </Button>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-2 py-4 text-center">
                <div className="mb-2">🐕‍🦺</div>
                No recent consultations
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🐕‍⚕️</div>
              <h1 className="text-3xl font-semibold mb-4 text-gray-200">How can I help your furry friend today?</h1>
              <p className="text-gray-400 mb-8">Ask me anything about pet health, behavior, or care!</p>
              <div className="flex justify-center space-x-4 text-2xl">
                <span>🐶</span>
                <span>🐱</span>
                <span>🐰</span>
                <span>🐹</span>
                <span>🐦</span>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1">
                        🐕‍⚕️
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === "user"
                          ? "bg-[#2d2d2d] text-white ml-auto"
                          : "bg-[#1a1a1a] text-gray-200 border border-gray-800"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1">
                        👤
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      🐕‍⚕️
                    </div>
                    <div className="bg-[#1a1a1a] text-gray-200 border border-gray-800 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <span className="text-xs text-gray-400 ml-2">Thinking about your pet...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center bg-[#2d2d2d] rounded-lg border border-gray-700 focus-within:border-blue-600">
                <Button type="button" variant="ghost" size="sm" className="ml-2 text-gray-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your pet's health, behavior, or care... 🐾"
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <span className="text-xs mr-1">🩺</span>
                  Tools
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="mr-2 text-blue-400 hover:text-blue-300"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <div className="text-xs text-gray-500 text-center mt-2">
              🐕 VetLLM can help with pet health questions, but always consult your veterinarian for serious concerns 🐕
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
