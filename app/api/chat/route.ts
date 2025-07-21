// Located at: app/api/chat/route.js (or .ts)

// This tells Vercel to use the more robust Node.js runtime
export const runtime = "nodejs";

// The main function that handles chat requests
export async function POST(req) {
  try {
    // 1. Get the conversation messages from the frontend's request
    const { messages } = await req.json();

    // 2. Get your Hugging Face token from Vercel's environment variables
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN;

    // A crucial check to make sure the token is configured in Vercel
    if (!token) {
      throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN environment variable");
    }

    // 3. Define the model we are calling
    const modelName = "mistralai/Mistral-7B-Instruct-v0.3";

    // 4. Format the conversation history into the specific string format that Mistral expects
    let conversationText = "<s>"; // Start with the Begin-of-Sequence token

    // Loop through all messages except the very last one
    for (let i = 0; i < messages.length - 1; i++) {
        const message = messages[i];
        if (message.role === "user") {
            conversationText += `[INST] ${message.content} [/INST]`;
        } else if (message.role === "assistant") {
            conversationText += `${message.content}</s>`; // End assistant's turn
        }
    }
    // Add the final user message. The model will generate what comes after this.
    const lastUserMessage = messages[messages.length - 1];
    conversationText += `[INST] ${lastUserMessage.content} [/INST]`;


    // 5. Make the direct API call to Hugging Face
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
          temperature: 0.6,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false, // Very important for chat!
        },
      }),
    });

    // 6. Check for errors from the Hugging Face API
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API Error: ${response.status} - ${errorText}`);
    }

    // 7. Parse the successful response
    const data = await response.json();
    const generatedText = data[0]?.generated_text || "";

    // 8. Send the final response back to your chatbot UI
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: generatedText.trim(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    // This block catches any error and sends a structured message to the frontend.
    console.error("Error in /api/chat:", error);
    
    // Check if error is an object and has a message property
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    return new Response(
      JSON.stringify({
        error: "Woof! I encountered an error. Please try again - I'm here to help with your pet questions! 🐾",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}