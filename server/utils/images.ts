import sharp from 'sharp'

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

export async function prepareOriginal(input: Buffer, max = 2000) {
  const img = sharp(input, { failOn: 'none', limitInputPixels: 40_000_000 }).rotate()
  const buf = await img.resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer()
  const meta = await sharp(buf).metadata()
  return { buffer: buf, width: meta.width || 0, height: meta.height || 0 }
}

export async function makeVariants(input: Buffer) {
  const web = await sharp(input).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()
  const thumb = await sharp(input).resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
  const meta = await sharp(web).metadata()
  return { web, thumb, width: meta.width || 0, height: meta.height || 0 }
}

/** Ausschnitt aus einem Bild nach normalisiertem Rahmen [ymin,xmin,ymax,xmax] 0..1000, mit etwas Rand. */
export async function cropBox(input: Buffer, box: [number, number, number, number], pad = 12) {
  const meta = await sharp(input).metadata()
  const W = meta.width || 0, H = meta.height || 0
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const y1 = clamp(Math.round(box[0] / 1000 * H) - pad, 0, H - 1)
  const x1 = clamp(Math.round(box[1] / 1000 * W) - pad, 0, W - 1)
  const y2 = clamp(Math.round(box[2] / 1000 * H) + pad, y1 + 1, H)
  const x2 = clamp(Math.round(box[3] / 1000 * W) + pad, x1 + 1, W)
  return sharp(input).extract({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 }).jpeg({ quality: 90 }).toBuffer()
}

export function toBase64Jpeg(buffer: Buffer, max = 1536) {
  return sharp(buffer).resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer().then(b => b.toString('base64'))
}

/** Dreht ein Bild im Uhrzeigersinn, damit Marken und Münzen aufrecht gespeichert werden. */
export async function rotateImage(input: Buffer, degrees: number) {
  return sharp(input).rotate(degrees).jpeg({ quality: 90 }).toBuffer()
}
