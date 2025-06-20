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
    const token = process.env.HUGGING_FACE_ACCESS_TOKEN;
    if (!token) throw new Error("Missing HUGGING_FACE_ACCESS_TOKEN");

    const { messages } = await req.json();
    const latestInput = messages[messages.length - 1]?.content;
    if (!latestInput) throw new Error("Missing user input");

    // Prompt template with history injected by memory
    const prompt = PromptTemplate.fromTemplate(`You are VetLLM, a helpful assistant for veterinary science.
{history}
Human: {input}
VetLLM:`);

    // Model: Mistral 7B hosted on Hugging Face
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

    // Tool setup
    const tools = [new SerpAPI()]; // Web search tool

    // Memory setup (LangChain will handle history injection automatically)
    const memory = new BufferMemory({ returnMessages: true, memoryKey: "history" });

    // Agent setup
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "zero-shot-react-description",
      verbose: true,
      memory,
    });

    // Final call to the agent
    const result = await executor.call({ input: latestInput });

    return new Response(
      JSON.stringify({ content: result.output?.trim() || "", role: "assistant" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("LangChain Error:", error);
    return new Response(
      JSON.stringify({ error: "Woof! Error: " + error.message + " 🐾" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
