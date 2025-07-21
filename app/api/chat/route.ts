import { HfInference } from "@huggingface/inference"
import { StreamingTextResponse } from "ai"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message
  const lastMessage = messages[messages.length - 1]

  // Create a system prompt for veterinary assistance
  const systemPrompt = `You are VetLLM, a helpful veterinary AI assistant. You specialize in providing information about pet health, behavior, and care. 

Key guidelines:
- Always be compassionate and understanding about pet concerns
- Provide helpful, accurate information about common pet issues
- Always recommend consulting a veterinarian for serious health concerns
- Be friendly and use a warm, professional tone
- Focus on dogs, cats, rabbits, hamsters, and other common pets
- Provide practical advice when appropriate
- If unsure about something, recommend professional veterinary consultation

Remember: You are an AI assistant and cannot replace professional veterinary care.

User: ${lastMessage.content}
Assistant:`

  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: systemPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false,
      },
      options: {
        use_cache: false,
      },
    })

    // Create a readable stream
    const stream = new ReadableStream({
      start(controller) {
        const text = response.generated_text
        const encoder = new TextEncoder()

        // Split the text into chunks and stream them
        const words = text.split(" ")
        let i = 0

        const interval = setInterval(() => {
          if (i < words.length) {
            const chunk = words[i] + " "
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            i++
          } else {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
            clearInterval(interval)
          }
        }, 50) // Adjust speed as needed
      },
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Hugging Face API error:", error)
    return new Response("Error generating response", { status: 500 })
  }
}
