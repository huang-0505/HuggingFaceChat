import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json()

    // Get the last message as the prompt
    const lastMessage = messages[messages.length - 1]
    const prompt = lastMessage.content

    // Use your custom model here - replace with your actual model name
    const modelName = model || "microsoft/DialoGPT-medium"

    const response = await hf.textGeneration({
      model: modelName,
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
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
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
