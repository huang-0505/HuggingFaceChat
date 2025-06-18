"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Plus, Search, Library, Code, Sparkles, Settings, Mic, Send, ChevronDown } from "lucide-react"

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

export default function HuggingFaceChatUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chats, setChats] = useState<Chat[]>([
    { id: "1", title: "Custom Model Testing", messages: [], lastMessage: new Date() },
    { id: "2", title: "Text Generation Examples", messages: [], lastMessage: new Date() },
    { id: "3", title: "Model Fine-tuning Discussion", messages: [], lastMessage: new Date() },
  ])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("Your Custom Model")
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
          model: "your-custom-model-name", // Replace with your actual model
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
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentChatId(null)
  }

  const sidebarItems = [
    { icon: MessageSquare, label: "New chat", action: startNewChat },
  ]

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#171717] border-r border-gray-800 flex flex-col">
        {/* Model Selector */}
        <div className="p-4 border-b border-gray-800">
          <Button variant="ghost" className="w-full justify-between text-left font-medium hover:bg-gray-800">
            {selectedModel}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="p-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start mb-1 hover:bg-gray-800"
              onClick={item.action}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="bg-gray-800" />

        {/* Custom Models Section */}
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2 px-2">Custom Models</div>
          <div className="space-y-1">
            <div className="flex items-center px-2 py-1 text-sm">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs mr-2">🤗</div>
              Your Fine-tuned Model
            </div>
            <div className="flex items-center px-2 py-1 text-sm">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs mr-2">T</div>
              Text Generation Model
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <Separator className="bg-gray-800" />

        {/* Chat History */}
        <div className="p-2 flex-1">
          <div className="text-xs text-gray-400 mb-2 px-2">Chats</div>
          <ScrollArea className="h-40">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start mb-1 text-sm hover:bg-gray-800 truncate"
                onClick={() => setCurrentChatId(chat.id)}
              >
                {chat.title}
              </Button>
            ))}
          </ScrollArea>
        </div>

        {/* Settings */}
        <div className="p-2 border-t border-gray-800">
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-800">
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-semibold mb-8 text-gray-200">Where should we begin?</h1>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-[#2d2d2d] text-white"
                        : "bg-[#1a1a1a] text-gray-200 border border-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] text-gray-200 border border-gray-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
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
              <div className="flex items-center bg-[#2d2d2d] rounded-lg border border-gray-700 focus-within:border-gray-600">
                <Button type="button" variant="ghost" size="sm" className="ml-2 text-gray-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <span className="text-xs mr-1">🔧</span>
                  Tools
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="mr-2 text-gray-400 hover:text-white"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
