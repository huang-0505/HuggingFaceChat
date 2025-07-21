import { HfInference } from "@huggingface/inference"

const hf = new HfInference(process.env.HUGGING_FACE_ACCESS_TOKEN)

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastMessage = messages[messages.length - 1]?.content || ""

  // Build a proper veterinary prompt where AI acts as a veterinarian
  let prompt = `You are Dr. VetLLM, a licensed veterinarian with 15 years of experience treating dogs, cats, rabbits, and other small animals. You provide specific medical advice, diagnoses, and treatment recommendations just like a real veterinarian would during a consultation.

Key guidelines:
- Act as a real veterinarian, not an AI assistant
- Provide specific medical advice and treatment recommendations
- Give detailed explanations about conditions, symptoms, and treatments
- Recommend specific medications, dosages, and procedures when appropriate
- Be professional but warm and caring
- Ask follow-up questions about symptoms when needed
- Provide immediate emergency advice when pets are in danger

`

  // Add conversation history
  messages.forEach((message: any) => {
    if (message.role === "user") {
      prompt += `Pet Owner: ${message.content}\n`
    } else if (message.role === "assistant") {
      prompt += `Dr. VetLLM: ${message.content}\n`
    }
  })

  prompt += "Dr. VetLLM:"

  try {
    const response = await hf.textGeneration({
      model: "microsoft/DialoGPT-medium",
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false,
      },
      options: {
        use_cache: false,
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const text = response.generated_text || getVeterinaryResponse(lastMessage)

        const words = text.split(" ")
        let i = 0

        const streamWords = () => {
          if (i < words.length) {
            const chunk = words[i] + " "
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
            i++
            setTimeout(streamWords, 50)
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
  } catch (error) {
    console.error("Hugging Face API error:", error)

    // Fallback with specific veterinary responses
    const veterinaryResponse = getVeterinaryResponse(lastMessage)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const data = `data: ${JSON.stringify({ content: veterinaryResponse })}\n\n`
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
}

function getVeterinaryResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()

  // Emergency/Toxic situations
  if (lowerQuestion.includes("chocolate") && (lowerQuestion.includes("dog") || lowerQuestion.includes("puppy"))) {
    return "⚠️ EMERGENCY: Chocolate is highly toxic to dogs! Do NOT feed chocolate to your dog under any circumstances. If your dog has already eaten chocolate, contact me immediately or go to the nearest emergency vet clinic. The theobromine in chocolate can cause vomiting, diarrhea, seizures, and even death. Dark chocolate and baking chocolate are the most dangerous. How much chocolate did your dog consume and when?"
  }

  if (lowerQuestion.includes("grapes") || lowerQuestion.includes("raisins")) {
    return "⚠️ EMERGENCY: Grapes and raisins are extremely toxic to dogs and can cause kidney failure. Never give grapes or raisins to dogs. If your dog has eaten any, seek emergency veterinary care immediately. Even small amounts can be dangerous."
  }

  if (lowerQuestion.includes("onion") || lowerQuestion.includes("garlic")) {
    return "⚠️ WARNING: Onions and garlic are toxic to both dogs and cats. They can cause anemia by damaging red blood cells. Avoid feeding any foods containing onions or garlic to your pets. If your pet has consumed these, monitor for symptoms like weakness, lethargy, and pale gums."
  }

  // Feeding questions
  if (lowerQuestion.includes("feed") && lowerQuestion.includes("cat")) {
    return "For cats, I recommend feeding a high-quality commercial cat food that's appropriate for their life stage. Adult cats should eat 2-3 small meals per day. Look for foods with real meat as the first ingredient and avoid foods with excessive fillers. Wet food is excellent for hydration. How old is your cat and what are you currently feeding them?"
  }

  if (lowerQuestion.includes("feed") && lowerQuestion.includes("dog")) {
    return "Dogs should be fed a high-quality commercial dog food appropriate for their age, size, and activity level. Puppies need puppy food until 12-18 months, adults need maintenance food, and seniors may benefit from senior formulas. Feed adult dogs twice daily. What's your dog's breed, age, and current weight?"
  }

  if (lowerQuestion.includes("feed") && lowerQuestion.includes("rabbit")) {
    return "Rabbits need a diet of high-quality hay (timothy hay for adults), fresh vegetables, and a small amount of pellets. Avoid iceberg lettuce and stick to dark leafy greens like romaine, kale, and herbs. Fresh water should always be available. How old is your rabbit?"
  }

  // Health symptoms
  if (lowerQuestion.includes("vomit") || lowerQuestion.includes("throwing up")) {
    return "Vomiting can indicate various conditions from simple dietary indiscretion to serious illness. If it's occasional and your pet is otherwise normal, withhold food for 12 hours then offer small amounts of bland food. However, if there's blood, frequent vomiting, lethargy, or other symptoms, this needs immediate attention. Can you describe the vomit and how often it's happening?"
  }

  if (lowerQuestion.includes("diarrhea") || lowerQuestion.includes("loose stool")) {
    return "Diarrhea can be caused by dietary changes, stress, parasites, or infections. For mild cases, I recommend a bland diet (boiled chicken and rice for dogs, or prescription diet for cats) and ensuring good hydration. If there's blood, mucus, or if it persists more than 24 hours, we need to examine your pet. How long has this been going on?"
  }

  if (lowerQuestion.includes("scratch") || lowerQuestion.includes("itch")) {
    return "Excessive scratching usually indicates allergies, parasites (fleas, mites), or skin infections. I'd recommend checking for fleas first, then consider food allergies or environmental allergens. We may need to do skin scrapings or allergy testing. Are you seeing any redness, hair loss, or specific areas they're focusing on?"
  }

  // Behavioral questions
  if (lowerQuestion.includes("aggressive") || lowerQuestion.includes("biting")) {
    return "Aggression can stem from fear, pain, territorial behavior, or medical issues. First, I'd want to rule out any underlying pain or illness with a physical exam. Then we can discuss behavior modification techniques and possibly anti-anxiety medications. Has this behavior started recently or been ongoing?"
  }

  if (lowerQuestion.includes("training") || lowerQuestion.includes("house") || lowerQuestion.includes("potty")) {
    return "House training requires consistency and patience. Take your pet out frequently (every 2-3 hours for puppies), reward immediately after they go outside, and clean accidents thoroughly with enzymatic cleaners. Never punish accidents. Most pets can be fully house trained within 4-6 months with consistent effort."
  }

  // General health
  if (lowerQuestion.includes("vaccine") || lowerQuestion.includes("shot")) {
    return "Vaccinations are crucial for preventing serious diseases. Dogs need DHPP (distemper, hepatitis, parvovirus, parainfluenza) and rabies vaccines. Cats need FVRCP (feline viral rhinotracheitis, calicivirus, panleukopenia) and rabies. Puppies and kittens need a series starting at 6-8 weeks. When was your pet's last vaccination?"
  }

  if (lowerQuestion.includes("spay") || lowerQuestion.includes("neuter")) {
    return "I generally recommend spaying/neutering between 4-6 months of age, before the first heat cycle for females. This prevents unwanted pregnancies and reduces risks of certain cancers and behavioral issues. The surgery is routine and recovery is typically 10-14 days. Do you have specific concerns about the procedure?"
  }

  // Default response
  return "Hello! I'm Dr. VetLLM, and I'm here to help with your pet's health concerns. Could you tell me more details about what's going on with your pet? The more specific information you can provide about symptoms, duration, and your pet's behavior, the better I can assist you with a proper assessment and treatment plan."
}
