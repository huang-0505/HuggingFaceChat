export const runtime = "nodejs";

import { PromptTemplate } from "@langchain/core/prompts";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";



console.log("ENV TOKEN IN SERVER:", process.env.HUGGING_FACE_ACCESS_TOKEN?.slice(0, 5));

export async function POST(req: Request) {
  try {
    console.log("🐾 Incoming request");
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN;
    if (!token) throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN");

    const { messages } = await req.json();
    console.log("✅ Messages received:", messages);

    const latestInput = messages[messages.length - 1]?.content;
    if (!latestInput) throw new Error("Missing user input");

    console.log("🧠 Latest user input:", latestInput);

    // Prompt
    const prompt = PromptTemplate.fromTemplate(`You are VetLLM, a helpful assistant for veterinary science.
{history}
Human: {input}
VetLLM:`);

    // Model
    const model = new HuggingFaceInference({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      apiKey: token,
      modelKwargs: {
        temperature: 0.7,
        max_new_tokens: 500,
        do_sample: true,
        return_full_text: false,
        repetition_penalty: 1.1,
        stop: ["Human:", "\nHuman:", "User:", "\nUser:"],
      },
    });

    console.log("✅ Model initialized");

    // Tool
    const tools = [new SerpAPI()];
    console.log("🔧 Tools loaded");

    // Memory
    const memory = new BufferMemory({ returnMessages: true, memoryKey: "history" });
    console.log("🧠 Memory initialized");

    // Agent
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "zero-shot-react-description",
      verbose: true,
      memory,
    });

    console.log("🤖 Agent initialized");

    // Agent execution
    const result = await executor.call({ input: latestInput });
    console.log("✅ Agent response:", result);

    return new Response(
      JSON.stringify({ content: result.output?.trim() || "", role: "assistant" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ LangChain Error:", error);
    return new Response(
      JSON.stringify({ error: "Woof! I encountered an error. Please try again - I'm here to help with your pet questions! 🐾" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
