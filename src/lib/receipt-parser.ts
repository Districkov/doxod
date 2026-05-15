import sharp from 'sharp'

export interface ReceiptItem {
  name: string
  amount: number
  category: string
}

export async function ocrReceipt(imageBuffer: Buffer): Promise<string> {
  const processed = await sharp(imageBuffer)
    .resize({ width: 2000, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .jpeg({ quality: 90 })
    .toBuffer()

  const base64 = processed.toString('base64')

  const formData = new FormData()
  formData.append('base64Image', `data:image/jpeg;base64,${base64}`)
  formData.append('language', 'rus')
  formData.append('OCREngine', '1')
  formData.append('scale', 'true')
  formData.append('isTable', 'true')
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')

  const apiKey = process.env.OCR_SPACE_API_KEY || 'K82689348888957'

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'apikey': apiKey },
    body: formData,
  })

  if (!res.ok) throw new Error(`OCR.space ${res.status}: ${await res.text()}`)

  const data = await res.json()
  if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage || 'OCR error')

  if (!data.ParsedResults || data.ParsedResults.length === 0) {
    throw new Error(`No parsed results. ExitCode=${data.ExitCode}`)
  }

  const texts = data.ParsedResults.map((r: { ParsedText?: string }) => r.ParsedText || '').filter(Boolean).join('\n')

  if (!texts.trim()) {
    throw new Error(`OCR returned empty text`)
  }

  return texts
}

const SKIP = /^(итог|сумма|к оплате|сдача|наличные|карта|чек|кассир|инн|ккт|регн|фд|фп|снос|сайт|тел|провер|прогр|регистр|терминал|оплат|принят|продаж|заводской|дата|время|адрес|кассов|фискал|налого|спасибо|добро|пожал|дисконт|бонус|списание|начислен|ндс|скидк|эквайр|авториз|рефер|слип|приход|возвр|мерчант|transact|merchant|auth|ref|term|point|total|change|cash|card|visa|master|mir|платеж|перевод|зачислен|комисс|справка|дебет|учитывать|оспорить|разделить|добав|кэшбэк|по акци|начислим|lte|добавить|покупк)/i

const MCC = /\bмсс\b/i

function cleanLine(s: string): string {
  return s
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[—–−]/g, '-')
    .replace(/，/g, ',')
    .trim()
}

function isCurrencySuffix(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code === 0x20BD ||
    code === 0x0440 ||
    code === 0x0420 ||
    ch === '$' || ch === '€' || ch === '£' || ch === '₸' || ch === '₴' ||
    /^[RrUuBb]$/.test(ch)
}

function matchPriceLine(line: string): { hasMinus: boolean; amount: number } | null {
  const m = line.match(/^([-])\s*(\d[\d\s]*[.,]\d{1,2})\s*([^\d]*?)\s*$/)
  if (m) {
    const amount = parseFloat(m[2].replace(/\s/g, '').replace(',', '.'))
    if (amount > 0 && amount < 10000000) {
      return { hasMinus: true, amount }
    }
  }
  return null
}

function matchInlineMinus(line: string): { name: string; amount: number } | null {
  const m = line.match(/^(.+?)\s+[-]\s*(\d[\d\s]*[.,]\d{1,2})\s*/)
  if (m) {
    const name = m[1].replace(/[^а-яА-Яa-zA-Z0-9ёЁ\s-]/g, '').trim()
    const amount = parseFloat(m[2].replace(/\s/g, '').replace(',', '.'))
    if (name.length >= 2 && amount > 0 && amount < 10000000) {
      return { name, amount }
    }
  }
  return null
}

export function parseReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n').map((l) => cleanLine(l)).filter((l) => l.length > 0)
  const items: ReceiptItem[] = []

  let pendingName = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.length < 2) continue
    if (/^[\d\s.,;:]+$/.test(line)) continue
    if (/^[=\-_#*|/\\]+$/.test(line)) continue
    if (SKIP.test(line)) continue
    if (MCC.test(line)) continue

    const priceInfo = matchPriceLine(line)
    if (priceInfo) {
      const name = pendingName.length >= 2
        ? pendingName
        : (i > 0 ? lines[i - 1].replace(/[^а-яА-Яa-zA-Z0-9ёЁ\s-]/g, '').trim() : '')
      if (name.length >= 2) {
        items.push({ name, amount: priceInfo.amount, category: '' })
      }
      pendingName = ''
      continue
    }

    const inlineInfo = matchInlineMinus(line)
    if (inlineInfo) {
      items.push({ name: inlineInfo.name, amount: inlineInfo.amount, category: '' })
      pendingName = ''
      continue
    }

    const cleaned = line
      .replace(/\s*[•·]\s*мсс\s*\d{4}\b/gi, '')
      .replace(/\s*мсс\s*\d{4}\b/gi, '')
      .replace(/[^а-яА-Яa-zA-Z0-9ёЁ\s-]/g, '')
      .trim()

    if (cleaned.length >= 2 && /^[а-яА-Яa-zA-Z0-9ёЁ\s-]+$/.test(cleaned)) {
      pendingName = cleaned
      continue
    }

    const multiSpace = line.match(/^(.+?)\s{2,}(.+)$/)
    if (multiSpace) {
      const leftName = multiSpace[1].replace(/[^а-яА-Яa-zA-Z0-9ёЁ\s-]/g, '').trim()
      const priceMatch = multiSpace[2].match(/(\d[\d\s]*[.,]\d{1,2})/)
      if (priceMatch && leftName.length >= 2) {
        const amount = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))
        if (amount > 0 && amount < 100000) {
          items.push({ name: leftName, amount, category: '' })
          pendingName = ''
          continue
        }
      }
      if (leftName.length >= 2) {
        pendingName = leftName
      }
    }
  }

  return items
}
