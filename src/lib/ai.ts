const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'
const AI_MODEL = process.env.AI_MODEL || 'google/gemma-3-4b-it:free'
const AI_VISION_MODEL = process.env.AI_VISION_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free'

interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: string } }>
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + AI_API_KEY,
    ...(AI_BASE_URL.includes('openrouter')
      ? { 'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://doxod.app', 'X-Title': 'Doxod Finance' }
      : {}),
  }
}

export async function aiChat(messages: AiMessage[], maxTokens = 100): Promise<{ text: string | null; error: string | null }> {
  if (!AI_API_KEY) return { text: null, error: 'No AI_API_KEY' }

  try {
    const res = await fetch(AI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[aiChat] API error:', res.status, err)
      return { text: null, error: 'API ' + res.status + ': ' + err.slice(0, 200) }
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() ?? null
    return { text, error: null }
  } catch (e) {
    console.error('[aiChat] catch:', e)
    return { text: null, error: String(e) }
  }
}

export async function aiVision(
  imageBase64: string,
  prompt: string,
  maxTokens = 300
): Promise<{ text: string | null; error: string | null }> {
  if (!AI_API_KEY) return { text: null, error: 'No AI_API_KEY' }

  try {
    const res = await fetch(AI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: getHeaders(),
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

    if (!res.ok) {
      const err = await res.text()
      console.error('[aiVision] API error:', res.status, err)
      return { text: null, error: 'API ' + res.status + ': ' + err.slice(0, 200) }
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() ?? null
    console.log('[aiVision] response:', text?.slice(0, 200))
    return { text, error: null }
  } catch (e) {
    console.error('[aiVision] catch:', e)
    return { text: null, error: String(e) }
  }
}

export { AI_API_KEY, AI_BASE_URL, AI_MODEL, AI_VISION_MODEL }
