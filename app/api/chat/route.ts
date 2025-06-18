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

    // Build conversation as a single string for Mistral
    let conversationText = ""

    for (const message of messages) {
      if (message.role === "user") {
        conversationText += `[INST] ${message.content} [/INST]\n`
      } else {
        conversationText += `${message.content}\n`
      }
    }

    // Remove the last newline and add space for the assistant response
    conversationText = conversationText.trim()

    console.log("Conversation text:", conversationText.slice(0, 200) + "...")

    // Use raw fetch with string input (not object)
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: conversationText, // String, not object!
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
          repetition_penalty: 1.1,
          stop: ["[INST]", "</s>"],
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

    // Handle different response formats
    let generatedText = ""
    if (Array.isArray(data) && data[0]?.generated_text) {
      generatedText = data[0].generated_text
    } else if (data.generated_text) {
      generatedText = data.generated_text
    } else {
      console.error("Unexpected response format:", data)
      throw new Error("Unexpected response format from Mistral")
    }

    return new Response(
      JSON.stringify({
        content: generatedText.trim(),
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
