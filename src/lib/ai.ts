const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'
const AI_MODEL = process.env.AI_MODEL || 'google/gemma-3-4b-it:free'
const AI_VISION_MODEL = process.env.AI_VISION_MODEL || 'google/gemma-3-4b-it:free'

interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: string } }>
}

export async function aiChat(messages: AiMessage[], maxTokens = 100): Promise<string | null> {
  if (!AI_API_KEY) return null

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        ...(AI_BASE_URL.includes('openrouter') ? { 'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://doxod.app' } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function aiVision(
  imageBase64: string,
  prompt: string,
  maxTokens = 200
): Promise<string | null> {
  if (!AI_API_KEY) return null

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        ...(AI_BASE_URL.includes('openrouter') ? { 'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://doxod.app' } : {}),
      },
      body: JSON.stringify({
        model: AI_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,' + imageBase64,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: maxTokens,
        temperature: 0,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export { AI_API_KEY, AI_BASE_URL, AI_MODEL }
