import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Convert messages to Hugging Face conversational format
  const pastUserInputs: string[] = []
  const generatedResponses: string[] = []

  // Extract conversation history
  for (let i = 0; i < messages.length - 1; i += 2) {
    if (messages[i]?.role === "user") {
      pastUserInputs.push(messages[i].content)
    }
    if (messages[i + 1]?.role === "assistant") {
      generatedResponses.push(messages[i + 1].content)
    }
  }

  // Get the current user input
  const currentUserInput = messages[messages.length - 1]?.content || ""

  // Add system context to the first message
  const systemContext =
    "You are VetLLM, a helpful veterinary AI assistant. You specialize in providing information about pet health, behavior, and care. Always be compassionate, provide helpful information, and recommend consulting a veterinarian for serious health concerns."

  const contextualInput =
    pastUserInputs.length === 0 ? `${systemContext}\n\nUser: ${currentUserInput}` : currentUserInput

  try {
    const response = await hf.conversational({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: {
        past_user_inputs: pastUserInputs,
        generated_responses: generatedResponses,
        text: contextualInput,
      },
      parameters: {
        max_length: 500,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
      },
      options: {
        use_cache: false,
      },
    })

    // Create a proper streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        const text = response.generated_text

        // Split the text into chunks and stream them
        const words = text.split(" ")
        let i = 0

        const streamWords = () => {
          if (i < words.length) {
            const chunk = words[i] + " "
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
            i++
            setTimeout(streamWords, 50) // Adjust speed as needed
          } else {
            const doneData = `data: [DONE]\n\n`
            controller.enqueue(encoder.encode(doneData))
            controller.close()
          }
        }

        streamWords()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Hugging Face API error:", error)

    // Return error response
    return new Response(
      JSON.stringify({
        error: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
