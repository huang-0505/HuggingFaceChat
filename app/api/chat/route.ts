import { HfInference } from "@huggingface/inference"

console.log("TOKEN:", process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json()

    const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN!) // <-- Ensure this is set in Vercel

    // Use last user message as the prompt
    const lastMessage = messages[messages.length - 1]
    const prompt = lastMessage.content

    // Your model ID on Hugging Face (replace this if hardcoding is fine)
    const modelName = model || "huang342/vetllm0.05" // Replace with your real model ID

    const response = await hf.textGeneration({
      model: modelName,
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
        return_full_text: false,
      },
    })

    return new Response(
      JSON.stringify({
        content: response.generated_text,
        role: "assistant",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Hugging Face error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate response from Hugging Face." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
