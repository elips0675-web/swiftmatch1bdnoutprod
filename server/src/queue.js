import Bull from 'bull'
import { rootLogger } from './logger.js'

const REDIS_URL = process.env.REDIS_URL
const DEFAULT_TTL = 60_000

export let emailQueue = null
export let pushQueue = null
export let imageQueue = null

const queues = []

function createQueue(name) {
  if (!REDIS_URL) {
    rootLogger.info(`[queue] Redis not configured — ${name} queue disabled`)
    return null
  }
  const q = new Bull(name, REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      lockDuration: DEFAULT_TTL,
      stalledInterval: 30_000,
      maxStalledCount: 2,
    },
  })

  q.on('completed', (job) => {
    rootLogger.info(`[queue] ${name} job ${job.id} completed`, { jobName: name, jobId: job.id })
  })

  q.on('failed', (job, err) => {
    rootLogger.error(`[queue] ${name} job ${job.id} failed: ${err.message}`, { jobName: name, jobId: job.id, error: err.message })
  })

  q.on('error', (err) => {
    rootLogger.error(`[queue] ${name} error: ${err.message}`, { jobName: name, error: err.message })
  })

  queues.push(q)
  return q
}

export function initQueues() {
  emailQueue = createQueue('email')
  pushQueue = createQueue('push')
  imageQueue = createQueue('image')

  if (emailQueue) {
    emailQueue.process(async (job) => {
      const { default: processEmail } = await import('./jobs/email.job.js')
      await processEmail(job)
    })
  }

  if (pushQueue) {
    pushQueue.process(async (job) => {
      const { default: processPush } = await import('./jobs/push.job.js')
      await processPush(job)
    })
  }

  if (imageQueue) {
    imageQueue.process(async (job) => {
      const { default: processImage } = await import('./jobs/image.job.js')
      await processImage(job)
    })
  }

  rootLogger.info('[queue] Queues initialized')
}

export async function closeQueues() {
  if (queues.length === 0) return
  rootLogger.info('[queue] Closing queues...')
  await Promise.allSettled(queues.map(q => q.close()))
  rootLogger.info('[queue] All queues closed')
}

export default { emailQueue, pushQueue, imageQueue, initQueues, closeQueues }
