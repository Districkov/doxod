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
  formData.append('OCREngine', '2')
  formData.append('scale', 'true')
  formData.append('isTable', 'true')
  formData.append('detectOrientation', 'true')

  const apiKey = process.env.OCR_SPACE_API_KEY || 'K82689348888957'

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'apikey': apiKey },
    body: formData,
  })

  if (!res.ok) throw new Error(`OCR.space ${res.status}`)

  const data = await res.json()
  if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage || 'OCR error')

  const texts = (data.ParsedResults || []).map((r: any) => r.ParsedText || '').join('\n')
  return texts
}

const SKIP_WORDS = /^(итого|сумма|итог|к оплате|сдача|наличные|карта|товар|чек|кассир|инн|ккт|регн|фд|фп|снос|сайт|тел|провер|прогр|регистр|элдр|сно|терминал|оплат|принят|продаж|заводской|дата|время|адрес|место|кассов|фискал|налого|сист|сайт|спасибо|покупк|посещен|добро|пожал|дисконт|бонус|списание|начислен|сдач|сумма пропис|итого со|ндс|в т\.ч|из них|скидк|точка|эквайр|код|авториз|рефер|слип|тип чек|приход|возвр|мерчант|transact|merchant|auth|ref|term|point|total|change|cash|card|visa|master|mir|платеж|перевод|зачислен|списан|комисс)/i

function extractPrice(text: string): number | null {
  const patterns = [
    /(\d{1,3}(?:[\s]\d{3})*[.,]\d{1,2})/,
    /(\d+[.,]\d{1,2})/,
    /(\d+)/,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const val = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
      if (val > 0 && val < 10000000) return val
    }
  }
  return null
}

function isGarbageLine(line: string): boolean {
  const clean = line.replace(/[^а-яА-Яa-zA-Z]/g, '')
  if (clean.length < 2) return true
  if (/^[а-яА-Яa-zA-Z]$/.test(clean)) return true
  if (/^\W+$/.test(line)) return true
  if (/^[\d\s.,;:]+$/.test(line)) return true
  if (/^[=\-_#*|/\\]+$/.test(line)) return true
  return false
}

export function parseReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 1)
  const items: ReceiptItem[] = []

  for (const line of lines) {
    if (SKIP_WORDS.test(line)) continue
    if (isGarbageLine(line)) continue

    let name = ''
    let amount: number | null = null

    const qtyPrice = line.match(/^(.+?)\s+(\d+([.,]\d+)?)\s*[xх]\s*(\d+([.,]\d+)?)/i)
    if (qtyPrice) {
      name = qtyPrice[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
      const qty = parseFloat(qtyPrice[2].replace(',', '.'))
      const price = parseFloat(qtyPrice[4].replace(',', '.'))
      amount = Math.round(qty * price * 100) / 100
    }

    if (!amount) {
      const tabSep = line.match(/^(.+?)\t+(.+)$/)
      if (tabSep) {
        name = tabSep[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
        amount = extractPrice(tabSep[2])
      }
    }

    if (!amount) {
      const multiSpace = line.match(/^(.+?)\s{2,}(.+)$/)
      if (multiSpace) {
        const leftName = multiSpace[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
        const rightPrice = extractPrice(multiSpace[2])
        if (rightPrice && leftName.length >= 2) {
          name = leftName
          amount = rightPrice
        }
      }
    }

    if (!amount) {
      const endPrice = line.match(/^(.+?)\s+(-?\d[\d\s]*[.,]\d{1,2})\s*([₽рРeEрР]|руб|rub)?\s*$/i)
      if (endPrice) {
        name = endPrice[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
        amount = parseFloat(endPrice[2].replace(/\s/g, '').replace(',', '.'))
      }
    }

    if (!amount) {
      const dotPrice = line.match(/^(.{2,}?)\s+(\d+\.\d{1,2})\s*$/)
      if (dotPrice) {
        name = dotPrice[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
        amount = parseFloat(dotPrice[2])
      }
    }

    if (!amount) {
      const linePrice = extractPrice(line)
      if (linePrice) {
        const priceStr = line.match(/(\d[\d\s]*[.,]\d{1,2}|\d+)/)
        if (priceStr) {
          const before = line.substring(0, line.indexOf(priceStr[0]))
          name = before.replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
          if (name.length >= 2) {
            amount = linePrice
          }
        }
      }
    }

    if (name.length >= 2 && amount && amount > 0 && amount < 10000000) {
      items.push({ name, amount, category: '' })
    }
  }

  return items
}
