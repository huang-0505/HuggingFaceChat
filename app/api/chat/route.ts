import { streamText } from "ai"
import { HfInference } from "@huggingface/inference"
import { NextResponse } from "next/server"

// Configure maximum duration for streaming responses
export const maxDuration = 60

// Create a custom adapter for Hugging Face models
const createHuggingFaceAdapter = (modelId: string, apiKey: string) => {
  const hf = new HfInference(apiKey)

  return {
    generate: async ({ messages }: { messages: any[] }) => {
      try {
        // Convert chat messages to the format expected by Hugging Face
        const prompt =
          messages.map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`).join("\n") + "\nAssistant: "

        // Stream the response from Hugging Face
        const stream = await hf.textGenerationStream({
          model: modelId,
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            do_sample: true,
          },
        })

        // Return an async generator that yields text chunks
        return {
          async *streamTokens() {
            for await (const chunk of stream) {
              if (chunk.token.text) {
                yield chunk.token.text
              }
            }
          },
        }
      } catch (error) {
        console.error("Error calling Hugging Face API:", error)
        throw error
      }
    },
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get your Hugging Face API key from environment variables
    const apiKey = process.env.HUGGING_FACE_API_KEY
    // Replace with your model ID
    const modelId = process.env.HUGGING_FACE_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.2"

    if (!apiKey) {
      return NextResponse.json({ error: "Hugging Face API key is not configured" }, { status: 500 })
    }

    // Create the Hugging Face adapter
    const huggingFaceAdapter = createHuggingFaceAdapter(modelId, apiKey)

    // Use the AI SDK's streamText function with our custom adapter
    const result = await streamText({
      model: {
        provider: "huggingface",
        generate: huggingFaceAdapter.generate,
      },
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat route:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
