// Located at: app/api/chat/route.ts

export const runtime = "nodejs";

// This is the main function that handles your chat requests
export async function POST(req: Request) {
  try {
    // Check for the environment variable once at the start
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN;
    if (!token) {
      throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN environment variable");
    }

    // Get the conversation history from the frontend
    const { messages } = await req.json();
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3";

    // --- CRITICAL IMPROVEMENT: PRECISE PROMPT FORMATTING ---
    // This format exactly matches what Mistral Instruct models expect.
    let conversationText = "<s>"; // Start with the Begin-of-Sequence token

    // Loop through the entire message history
    for (const message of messages) {
      if (message.role === "user") {
        conversationText += `[INST] ${message.content} [/INST]`;
      } else if (message.role === "assistant") {
        conversationText += `${message.content}</s>`; // End assistant's turn with an End-of-Sequence token
      }
    }
    // Note: We do NOT add a space or newline after the final [/INST] tag.
    // The model should start generating its response immediately after it.

    console.log("Final conversation text sent to HF:", conversationText.slice(0, 200) + "...");

    // Make the direct API call to Hugging Face
    const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: conversationText,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false, // Correct for chat
          repetition_penalty: 1.1,
          stop: ["[INST]", "</s>"], // Stop it from generating user turns
        },
      }),
    });

    // Check for errors from the Hugging Face API
    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API Error:", errorText);
      throw new Error(`HF API Error: ${response.status} - ${errorText}`);
    }

    // Parse the successful response
    const data = await response.json();
    const generatedText = (Array.isArray(data) && data[0]?.generated_text) ? data[0].generated_text : (data.generated_text || "");

    // Send the final response back to your chatbot UI
    return new Response(
      JSON.stringify({
        content: generatedText.trim(),
        role: "assistant",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    // This catches any error and sends a structured message to the frontend
    console.error("Error in /api/chat:", error);

    return new Response(
      JSON.stringify({
        error: "Woof! Error: " + error.message + " 🐾",
        details: error.message || "No additional details",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}