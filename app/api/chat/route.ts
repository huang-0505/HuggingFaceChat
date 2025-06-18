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

    // Use Mistral model
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3"

    // Build conversation arrays for conversational API
    const past_user_inputs = messages
      .filter((m: any) => m.role === "user")
      .slice(0, -1) // All user messages except the last one
      .map((m: any) => m.content)

    const generated_responses = messages.filter((m: any) => m.role === "assistant").map((m: any) => m.content)

    const latest_message = messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content // Get the latest user message

    console.log("Past user inputs:", past_user_inputs)
    console.log("Generated responses:", generated_responses)
    console.log("Latest message:", latest_message)

    if (!latest_message) {
      throw new Error("No user message found.")
    }

    // Make sure arrays are balanced (same length or generated_responses is one less)
    if (past_user_inputs.length !== generated_responses.length) {
      console.log("Adjusting conversation history for balance")
      // If unbalanced, trim to make them equal
      const minLength = Math.min(past_user_inputs.length, generated_responses.length)
      past_user_inputs.splice(minLength)
      generated_responses.splice(minLength)
    }

    console.log("Calling Mistral with conversational API...")

    const response = await hf.conversational({
      model: modelName,
      inputs: {
        past_user_inputs,
        generated_responses,
        text: latest_message,
      },
      parameters: {
        max_length: 500,
        temperature: 0.7,
        do_sample: true,
        repetition_penalty: 1.1,
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
    console.error("Full error:", JSON.stringify(error, null, 2))

    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
        details: error.response?.data || "No additional details",
        fullError: error.toString(),
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
