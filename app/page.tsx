"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, Send, Mic, ChevronDown, Dog } from "lucide-react"
import { useHuggingFaceChat } from "../hooks/use-huggingface-chat"

export default function VetLLMChat() {
  const [consultations, setConsultations] = useState<string[]>([])
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useHuggingFaceChat()

  const startNewConsultation = () => {
    // Clear current messages and reset chat
    setMessages([])
    setInput("")

    // Create new consultation with timestamp
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const newConsultation = `Consultation ${timeString}`

    setConsultations([newConsultation, ...consultations])
  }

  const isEmptyChat = messages.length === 0

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-lg">VetLLM</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* New Consultation Button */}
        <div className="p-4">
          <Button
            onClick={startNewConsultation}
            className="w-full justify-start gap-2 bg-transparent border border-gray-600 hover:bg-gray-700 text-white"
          >
            <Plus className="w-4 h-4" />
            New consultation
          </Button>
        </div>

        {/* Recent Consultations */}
        <div className="flex-1 px-4">
          <h3 className="text-sm text-gray-400 mb-3">Recent consultations</h3>
          <ScrollArea className="h-full">
            {consultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Dog className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No recent consultations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {consultations.map((consultation, index) => (
                  <div key={index} className="p-2 rounded-lg hover:bg-gray-700 cursor-pointer text-sm">
                    {consultation}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          {isEmptyChat ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <Dog className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4">How can I help your furry friend today?</h1>
                <p className="text-xl text-gray-400 mb-8">Ask me anything about pet health, behavior, or care!</p>

                {/* Animal Icons */}
                <div className="flex justify-center gap-4 text-2xl">
                  <span className="cursor-pointer hover:scale-110 transition-transform">🐶</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">🐱</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">🐰</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">🐹</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">🐭</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Dog className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">VetLLM</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-lg px-4 py-3 bg-gray-700 text-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Dog className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-400">VetLLM</span>
                    </div>
                    <div className="flex items-center gap-1">
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
            </div>
          )}
        </ScrollArea>

        <Separator className="bg-gray-700" />

        {/* Input Area */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-3 bg-gray-800 rounded-lg border border-gray-600 p-3">
              <Plus className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your pet's health, behavior, or care..."
                className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
                disabled={isLoading}
              />
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                Tools
              </Button>
              <Mic className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="bg-transparent hover:bg-gray-700 p-1"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto mt-4">
            <p className="text-center text-sm text-gray-500">
              <Dog className="w-4 h-4 inline mr-1" />
              VetLLM can help with pet health questions, but always consult your veterinarian for serious concerns
              <Dog className="w-4 h-4 inline ml-1" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
