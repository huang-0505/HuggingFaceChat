export const runtime = "nodejs";
import { HfInference } from "@huggingface/inference"
console.log("ENV TOKEN IN SERVER:", process.env.HUGGING_FACE_ACCESS_TOKEN?.slice(0, 5));

export async function POST(req: Request) {
  try {
    // Debug: Check if token exists
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN
    console.log("Token exists:", !!token)
    console.log("Token starts with hf_:", token?.startsWith("hf_"))

    if (!token) {
      throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN environment variable")
    }

    const hf = new HfInference(token)
    const { messages } = await req.json()
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3"

    const conversationHistory = messages
      .map((msg: any) => `${msg.role === "user" ? "Human" : "VetLLM"}: ${msg.content}`)
      .join("\n")

    const prompt = conversationHistory + "\nVetLLM:"

    const response = await hf.textGeneration({
      model: modelName,
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
        return_full_text: false,
        repetition_penalty: 1.1,
        stop: ["Human:", "\nHuman:", "User:", "\nUser:"],
      },
    })

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
  } catch (error) {
    console.error("VetLLM Error:", error)
    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
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
