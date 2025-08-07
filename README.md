# VetLLM Chat — Next.js + Hugging Face

A ChatGPT‑style interface (dark UI with a simple sidebar) that talks to a Hugging Face model. It’s set up for Mistral (`mistralai/Mistral-7B-Instruct-v0.3`) using the Inference API, and you can swap in your own model.

---
<img width="1437" height="810" alt="image" src="https://github.com/user-attachments/assets/fb14c1ae-3997-4abc-a98d-4b969d83b7c1" />


## Features

- Clean, responsive chat UI (dark theme)
- “New consultation” (start a fresh chat)
- “Recent consultations” list (simple local memory)
- Server-side call to Hugging Face Inference API with your HF token
- Useful error messages and logging to help with setup
- Ready to deploy on Vercel

---

## Tech Stack

- Next.js App Router (React Server/Client Components)
- TypeScript, Tailwind, shadcn/ui
- Hugging Face Inference API (server-side fetch)

> Note: For handling unexpected runtime errors in Next.js, use segment-level `error.tsx` error boundaries; expected errors should be modeled as return values from server logic. [^1][^2]  
> Keep secrets (tokens) server-side and validate inputs in server code. React/Next.js suppresses detailed server errors in production for security. [^3]

---

## Prerequisites

- Node.js 18+
- A Hugging Face account and an Access Token with “Read” permission (token begins with `hf_`)

---

## Getting Started (Local)

1) Clone and install

```bash
git clone <your-repo-url>
cd <your-repo-folder>
npm install
# If you hit peer-deps conflicts:
# npm install --legacy-peer-deps
```

2) Add your Hugging Face token

Create `.env.local` in the project root:

```bash
HUGGING_FACE_ACCESS_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3) Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Configure the Model

The API route uses Mistral by default:

```ts
// app/api/chat/route.ts
const modelName = "mistralai/Mistral-7B-Instruct-v0.3"
```

- To use another HF model, replace `modelName` with `"username/model-name"`.
- Mistral’s Instruct variants typically expect chat-style prompts. This repo formats conversation with `[INST] ... [/INST]` blocks when calling the HF Inference API (string `inputs`).

---

## Environment Variables

Local development:
- `.env.local` file as shown above.  
Production on Vercel:
- Project → Settings → Environment Variables  
  - Name: `HUGGING_FACE_ACCESS_TOKEN`  
  - Value: your `hf_...` token  
  - Target: Production (and Preview/Development if you need)  
- Redeploy after adding or changing env vars (they are injected at build/runtime).

---

## Deployment (Vercel)

1) Push your repo to GitHub  
2) Import the repo in Vercel  
3) Add `HUGGING_FACE_ACCESS_TOKEN` in Project → Settings → Environment Variables  
4) Deploy

To view server errors:
- Vercel Project → Overview → “Runtime Logs”, or the “Logs” tab.  
When testing, trigger a chat message and watch logs stream in real time.

---

## License

MIT — feel free to use, modify, and deploy.

---

## Acknowledgements

- Hugging Face Inference API
- Next.js App Router + shadcn/ui
- Mistral AI models

---

## References

- Error handling patterns in Next.js App Router (expected vs uncaught errors, error boundaries). [^1][^2]  
- Security and server behavior for actions/components and production error redaction. [^3]  
- AI SDK overview and chat UI hooks for building interactive AI interfaces. [^4][^6]

```
```

[^1]: [Getting Started: Error Handling | Next.js](https://nextjs.org/docs/app/getting-started/error-handling)  
[^2]: [Routing: Error Handling | Next.js](https://nextjs.org/docs/app/building-your-application/routing/error-handling)  
[^3]: [How to Think About Security in Next.js | Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions)  
[^4]: [Guides: Get started with GPT-4.5](https://ai-sdk.dev/cookbook/guides/gpt-4-5)  
[^6]: [AI SDK](https://sdk.vercel.ai)
