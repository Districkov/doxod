import sharp from 'sharp'

export interface ReceiptItem {
  name: string
  amount: number
  category: string
}

export async function ocrReceipt(imageBuffer: Buffer): Promise<string> {
  const processed = await sharp(imageBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .jpeg({ quality: 85 })
    .toBuffer()

  const base64 = processed.toString('base64')

  const formData = new FormData()
  formData.append('base64Image', `data:image/jpeg;base64,${base64}`)
  formData.append('language', 'rus')
  formData.append('isTable', 'true')
  formData.append('OCREngine', '2')

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      'apikey': process.env.OCR_SPACE_API_KEY || 'K82689348888957',
    },
    body: formData,
  })

  if (!res.ok) throw new Error(`OCR.space ${res.status}`)

  const data = await res.json()
  if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage || 'OCR error')

  const texts = (data.ParsedResults || []).map((r: any) => r.ParsedText || '').join('\n')
  return texts
}

export function parseReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items: ReceiptItem[] = []

  for (const line of lines) {
    const match = line.match(/^(.+?)\s{2,}(\d[\d ]*[.,]\d{1,2})\s*[₽рРRР]?$/)
    if (match) {
      const name = match[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
      const amount = parseFloat(match[2].replace(/\s/g, '').replace(',', '.'))
      if (name.length >= 2 && amount > 0 && amount < 1000000) {
        items.push({ name, amount, category: '' })
        continue
      }
    }

    const endPriceMatch = line.match(/(.+?)\s+(\d+[\s]*[.,]\d{1,2})\s*$/)
    if (endPriceMatch) {
      const name = endPriceMatch[1].replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
      const amount = parseFloat(endPriceMatch[2].replace(/\s/g, '').replace(',', '.'))
      if (name.length >= 2 && amount > 0 && amount < 1000000) {
        items.push({ name, amount, category: '' })
        continue
      }
    }

    const pricePattern = /([\d]+(?:[.,]\d{1,2}))\s*[₽рРRР]?$/
    const simpleMatch = line.match(pricePattern)
    if (simpleMatch && !line.match(/^(итого|сумма|итог|к оплате|сдача|наличные|карта|товар|чек|кассир|инн|ккт|регн|фд|фп|снос|сайт|тел)/i)) {
      const priceOnly = parseFloat(simpleMatch[1].replace(',', '.'))
      if (priceOnly > 0 && priceOnly < 1000000 && line.length > 3) {
        const name = line.replace(simpleMatch[0], '').replace(/[^а-яА-Яa-zA-Z0-9\s-]/g, '').trim()
        if (name.length >= 2) {
          items.push({ name, amount: priceOnly, category: '' })
        }
      }
    }
  }

  return items
}
