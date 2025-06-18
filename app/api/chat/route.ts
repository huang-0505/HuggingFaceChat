export const runtime = "nodejs"
import { HfInference } from "@huggingface/inference"

console.log("ENV TOKEN IN SERVER:", process.env.HUGGING_FACE_ACCESS_TOKEN?.slice(0, 5))

export async function POST(req: Request) {
  try {
    // Check token
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN
    console.log("Token exists:", !!token)
    console.log("Token starts with hf_:", token?.startsWith("hf_"))

    if (!token) {
      throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN environment variable")
    }

    const hf = new HfInference(token)
    const { messages } = await req.json()

    // Use Mistral model with textGeneration (this is the correct method)
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3"

    // Build conversation context for Mistral
    const conversationHistory = messages
      .map((msg: any) => {
        if (msg.role === "user") {
          return `[INST] ${msg.content} [/INST]`
        } else {
          return msg.content
        }
      })
      .join("\n")

    console.log("Using model:", modelName)
    console.log("Conversation history:", conversationHistory.slice(0, 200) + "...")

    // Use textGeneration - this is the correct method for Mistral
    const response = await hf.textGeneration({
      model: modelName,
      inputs: conversationHistory,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
        return_full_text: false,
        repetition_penalty: 1.1,
        stop: ["[INST]", "</s>"],
      },
    })

    console.log("Mistral Response:", response)

    return new Response(
      JSON.stringify({
        content: response.generated_text.trim(),
        role: "assistant",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error: any) {
    console.error("Mistral Error:", error)
    console.error("Error details:", error.response?.data || error.message)

    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
        details: error.response?.data || "No additional details",
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
