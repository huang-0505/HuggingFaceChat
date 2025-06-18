import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const modelName = "huang342/vetllm0.05"

    // Build conversation context for better responses
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
        stop: ["Human:", "\nHuman:", "User:", "\nUser:"], // Stop at user input
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
        error: "Woof! I'm having trouble connecting to the VetLLM. Please try again! 🐾",
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
