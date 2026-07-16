import sharp from 'sharp'
import path from 'path'
import { rootLogger } from '../logger.js'

const SIZES = [
  { suffix: '800x800', width: 800, height: 800 },
  { suffix: '400x400', width: 400, height: 400 },
  { suffix: '200x200', width: 200, height: 200 },
]

export default async function processImageJob(job) {
  const { filePath } = job.data
  if (!filePath) {
    rootLogger.warn('[image-job] No filePath provided')
    return { skipped: true }
  }

  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const baseName = path.basename(filePath, ext)

  const results = []

  for (const size of SIZES) {
    const webpPath = path.join(dir, `${baseName}_${size.suffix}.webp`)
    try {
      await sharp(filePath)
        .resize(size.width, size.height, { fit: 'cover', position: 'center' })
        .webp({ quality: 80, effort: 4 })
        .toFile(webpPath)
      results.push({ size: size.suffix, path: webpPath, format: 'webp' })
    } catch (err) {
      rootLogger.error(`[image-job] Resize ${size.suffix} failed:`, err)
    }
  }

  const avifPath = path.join(dir, `${baseName}_800x800.avif`)
  try {
    await sharp(filePath)
      .resize(800, 800, { fit: 'cover', position: 'center' })
      .avif({ quality: 65, effort: 4 })
      .toFile(avifPath)
    results.push({ size: '800x800', path: avifPath, format: 'avif' })
  } catch (err) {
    rootLogger.error('[image-job] AVIF conversion failed:', err)
  }

  rootLogger.info(`[image-job] Processed ${filePath}: ${results.length} variants`)
  return { processed: results.length, results }
}
