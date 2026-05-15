import Tesseract from 'tesseract.js'

export interface ReceiptItem {
  name: string
  amount: number
  category: string
}

export async function ocrReceipt(imageBuffer: Buffer): Promise<string> {
  const result = await Tesseract.recognize(imageBuffer, 'rus+eng', {
    logger: () => {},
  })
  return result.data.text
}

export function parseReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items: ReceiptItem[] = []

  const pricePattern = /([\d]+(?:[.,]\d{1,2}))\s*[₽рРRР]?$/

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
