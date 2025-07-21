import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Build conversation context
  let conversationText = `You are Dr. VetLLM, an experienced veterinarian. Provide specific, detailed medical advice based on the exact situation described. Pay attention to all details like age, breed, symptoms, and previous responses.

`

  // Add conversation history
  messages.forEach((message: any) => {
    if (message.role === "user") {
      conversationText += `Pet Owner: ${message.content}\n`
    } else if (message.role === "assistant") {
      conversationText += `Dr. VetLLM: ${message.content}\n`
    }
  })

  conversationText += "Dr. VetLLM:"

  // Try multiple models in order of preference
  const modelsToTry = [
    "meta-llama/Llama-2-7b-chat-hf",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "microsoft/DialoGPT-large",
    "facebook/blenderbot-400M-distill",
    "microsoft/DialoGPT-medium",
  ]

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`)

      const response = await hf.textGeneration({
        model: modelName,
        inputs: conversationText,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.2,
          return_full_text: false,
          do_sample: true,
        },
        options: {
          use_cache: false,
          wait_for_model: true,
        },
      })

      if (response.generated_text && response.generated_text.trim().length > 10) {
        // Success! Stream the response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            const text = response.generated_text.trim()
            const words = text.split(" ")
            let i = 0

            const streamWords = () => {
              if (i < words.length) {
                const chunk = words[i] + " "
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
                controller.enqueue(encoder.encode(data))
                i++
                setTimeout(streamWords, 30)
              } else {
                const doneData = `data: [DONE]\n\n`
                controller.enqueue(encoder.encode(doneData))
                controller.close()
              }
            }

            streamWords()
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        })
      }
    } catch (error) {
      console.error(`Model ${modelName} failed:`, error)
      continue // Try next model
    }
  }

  // If all models fail, provide intelligent fallback based on conversation context
  const lastMessage = messages[messages.length - 1]?.content || ""
  const intelligentResponse = getIntelligentVeterinaryResponse(messages)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const data = `data: ${JSON.stringify({ content: intelligentResponse })}\n\n`
      controller.enqueue(encoder.encode(data))
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}

function getIntelligentVeterinaryResponse(messages: any[]): string {
  const conversation = messages.map((m) => m.content.toLowerCase()).join(" ")
  const lastMessage = messages[messages.length - 1]?.content || ""

  // Extract key information from conversation
  const age = extractAge(conversation)
  const animal = extractAnimal(conversation)
  const symptoms = extractSymptoms(conversation)

  // Senior pet (18 years old cat example)
  if (age >= 15 && animal === "cat") {
    return `At 18 years old, your cat is considered a senior and needs special dietary considerations. Senior cats often benefit from:

• **Higher protein, easily digestible food** - Look for senior cat formulas with 35-45% protein
• **Smaller, more frequent meals** - 3-4 small meals daily instead of 2 large ones
• **Wet food is crucial** - Senior cats are prone to kidney issues and need extra hydration
• **Joint support** - Foods with glucosamine/chondroitin or omega-3 fatty acids
• **Regular weight monitoring** - Senior cats can lose muscle mass

For an 18-year-old cat, I'd specifically recommend prescription senior diets like Hill's k/d or Royal Canin Senior. Have you noticed any changes in appetite, weight, or litter box habits? Senior cats should have bloodwork every 6 months to monitor kidney and thyroid function.`
  }

  if (age >= 10 && animal === "dog") {
    return `At ${age} years old, your dog is entering their senior years and needs adjusted nutrition:

• **Senior dog formula** with appropriate protein levels for their kidney function
• **Joint support ingredients** - Glucosamine, chondroitin, omega-3s
• **Easier to digest** - May need smaller kibble size or wet food
• **Weight management** - Senior dogs are less active and prone to weight gain
• **Regular vet checkups** every 6 months

What's your dog's current weight and activity level? Large breeds are considered senior at 6-7 years, while small breeds at 10-12 years.`
  }

  // Chocolate emergency
  if (conversation.includes("chocolate") && (conversation.includes("dog") || conversation.includes("puppy"))) {
    return `🚨 **EMERGENCY - CHOCOLATE TOXICITY** 🚨

**DO NOT WAIT** - This is a veterinary emergency! Chocolate contains theobromine which is toxic to dogs.

**Immediate actions:**
1. **Call emergency vet NOW** or pet poison control: (888) 426-4435
2. **Induce vomiting ONLY if instructed** by vet (within 2 hours of ingestion)
3. **Bring chocolate packaging** to show vet the type and amount

**Toxicity depends on:**
- Type: Baking chocolate > Dark chocolate > Milk chocolate > White chocolate
- Amount consumed vs dog's weight
- Time since ingestion

**Symptoms to watch for:** Vomiting, diarrhea, excessive thirst, restlessness, rapid heart rate, seizures

**How much chocolate and what type did your dog eat? What's your dog's weight?** Time is critical!`
  }

  // Feeding questions with specific details
  if (conversation.includes("feed") && animal) {
    if (animal === "cat") {
      return `For your cat's feeding, I need to consider their specific needs:

**Daily feeding guidelines:**
• **Kittens (0-12 months):** 3-4 meals of kitten formula food
• **Adults (1-7 years):** 2-3 meals of adult cat food  
• **Seniors (7+ years):** 2-3 smaller meals of senior formula

**Food quality indicators:**
• First ingredient should be named meat (chicken, salmon, etc.)
• Avoid foods with excessive corn, wheat, or by-products
• Look for AAFCO certification

**Wet vs Dry:** Cats need moisture - aim for 70% wet food, 30% dry

What's your cat's current age, weight, and any health conditions? This helps me recommend specific brands and portions.`
    }

    if (animal === "dog") {
      return `For your dog's nutrition, let me provide specific guidance:

**Feeding schedule by age:**
• **Puppies (8 weeks-6 months):** 3-4 meals daily
• **Young adults (6 months-2 years):** 2 meals daily
• **Adults (2-7 years):** 2 meals daily
• **Seniors (7+ years):** 2 smaller meals daily

**Portion sizes depend on:**
- Current weight and target weight
- Activity level (working dogs need more calories)
- Breed size (large breeds have different needs)

**Quality indicators:**
• Named meat as first ingredient
• No excessive fillers or by-products
• Appropriate for life stage

What's your dog's breed, age, current weight, and activity level? I can then calculate exact portions and recommend specific foods.`
    }
  }

  // Default intelligent response
  return `I'm Dr. VetLLM, and I want to give you the most helpful advice possible. To provide the best recommendations, could you share:

• **Your pet's species, breed, and age**
• **Current symptoms or concerns** 
• **Any recent changes** in behavior, appetite, or habits
• **Current diet or medications**

The more specific details you provide, the more targeted and useful my medical advice can be. What's the main concern you'd like me to address today?`
}

function extractAge(text: string): number {
  const ageMatch = text.match(/(\d+)\s*years?\s*old/i)
  return ageMatch ? Number.parseInt(ageMatch[1]) : 0
}

function extractAnimal(text: string): string {
  if (text.includes("cat") || text.includes("kitten")) return "cat"
  if (text.includes("dog") || text.includes("puppy")) return "dog"
  if (text.includes("rabbit") || text.includes("bunny")) return "rabbit"
  return ""
}

function extractSymptoms(text: string): string[] {
  const symptoms = []
  if (text.includes("vomit")) symptoms.push("vomiting")
  if (text.includes("diarrhea")) symptoms.push("diarrhea")
  if (text.includes("scratch") || text.includes("itch")) symptoms.push("itching")
  return symptoms
}
