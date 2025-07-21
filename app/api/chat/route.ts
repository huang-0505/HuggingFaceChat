import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Build conversation context
  let conversationText = `You are VetLLM, a helpful veterinary AI assistant. You specialize in providing information about pet health, behavior, and care. Always be compassionate, provide helpful information, and recommend consulting a veterinarian for serious health concerns.

`

  // Add conversation history
  messages.forEach((message: any) => {
    if (message.role === "user") {
      conversationText += `Human: ${message.content}\n`
    } else if (message.role === "assistant") {
      conversationText += `Assistant: ${message.content}\n`
    }
  })

  conversationText += "Assistant:"

  try {
    // Use textGeneration with a model that supports it
    const response = await hf.textGeneration({
      model: "microsoft/DialoGPT-medium",
      inputs: conversationText,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false,
      },
      options: {
        use_cache: false,
      },
    })

    // Create a proper streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        const text = response.generated_text || "I'm here to help with your pet questions!"

        // Split the text into chunks and stream them
        const words = text.split(" ")
        let i = 0

        const streamWords = () => {
          if (i < words.length) {
            const chunk = words[i] + " "
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
            i++
            setTimeout(streamWords, 50)
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

    // Try with a different approach - use a simple text generation model
    try {
      const fallbackResponse = await hf.textGeneration({
        model: "gpt2",
        inputs: `As a veterinary assistant, here's helpful advice about "${messages[messages.length - 1]?.content}":`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.8,
          return_full_text: false,
        },
      })

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const text =
            fallbackResponse.generated_text ||
            "I recommend consulting with your veterinarian for the best advice about your pet's needs."
          const data = `data: ${JSON.stringify({ content: text })}\n\n`
          controller.enqueue(encoder.encode(data))
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      })
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError)

      // Final fallback with a helpful veterinary response
      const userQuestion = messages[messages.length - 1]?.content || ""
      let helpfulResponse = "I'm here to help with your pet questions! "

      // Simple keyword-based responses for common pet questions
      if (userQuestion.toLowerCase().includes("feed") || userQuestion.toLowerCase().includes("food")) {
        helpfulResponse +=
          "For feeding advice, it's best to consult your veterinarian about the right diet for your pet's age, size, and health needs. Generally, pets should have regular feeding schedules with high-quality pet food appropriate for their species."
      } else if (userQuestion.toLowerCase().includes("sick") || userQuestion.toLowerCase().includes("health")) {
        helpfulResponse +=
          "If you're concerned about your pet's health, please contact your veterinarian immediately. They can provide proper diagnosis and treatment."
      } else if (userQuestion.toLowerCase().includes("behavior") || userQuestion.toLowerCase().includes("training")) {
        helpfulResponse +=
          "Pet behavior can vary greatly. For training and behavior concerns, consider consulting with a veterinary behaviorist or certified pet trainer."
      } else {
        helpfulResponse +=
          "For specific questions about your pet's health, behavior, or care, I always recommend consulting with a qualified veterinarian who can provide personalized advice."
      }

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const data = `data: ${JSON.stringify({ content: helpfulResponse })}\n\n`
          controller.enqueue(encoder.encode(data))
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      })
    }
  }
}
