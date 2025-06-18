export const runtime = "nodejs"

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

    const { messages } = await req.json()
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

    // Make sure arrays are balanced
    if (past_user_inputs.length !== generated_responses.length) {
      console.log("Adjusting conversation history for balance")
      const minLength = Math.min(past_user_inputs.length, generated_responses.length)
      past_user_inputs.splice(minLength)
      generated_responses.splice(minLength)
    }

    // Use raw fetch to call the conversational endpoint directly
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("HF API Error:", errorText)
      throw new Error(`HF API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Mistral Response:", data)

    return new Response(
      JSON.stringify({
        content: data.generated_text.trim(),
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
    console.error("Error details:", error.message)

    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
        details: error.message || "No additional details",
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
