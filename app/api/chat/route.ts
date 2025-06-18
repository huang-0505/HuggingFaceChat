export const runtime = "nodejs";
import { HfInference } from "@huggingface/inference";

console.log("ENV TOKEN IN SERVER:", process.env.HUGGING_FACE_ACCESS_TOKEN?.slice(0, 5));

export async function POST(req: Request) {
  try {
    // Check token
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN;
    console.log("Token exists:", !!token);
    console.log("Token starts with hf_:", token?.startsWith("hf_"));

    if (!token) {
      throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN environment variable");
    }

    const hf = new HfInference(token);
    const { messages } = await req.json();
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3";

    const past_user_inputs = messages
      .filter((m: any) => m.role === "user")
      .slice(0, -1)
      .map((m: any) => m.content);

    const generated_responses = messages
      .filter((m: any) => m.role === "assistant")
      .map((m: any) => m.content);

    const latest_message = messages
      .filter((m: any) => m.role === "user")
      .slice(-1)[0]?.content;

    if (!latest_message) {
      throw new Error("No user message found.");
    }

    const response = await hf.conversational({
      model: modelName,
      inputs: {
        past_user_inputs,
        generated_responses,
        text: latest_message,
      },
    });

    return new Response(
      JSON.stringify({
        content: response.generated_text.trim(),
        role: "assistant",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("VetLLM Error:", error);
    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
