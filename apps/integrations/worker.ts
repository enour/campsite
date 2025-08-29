import IORedis from 'ioredis'
import { Worker, Job } from 'bullmq'
import { QUEUE_NAME } from './lib/queue'
import { runRollup } from './worker/runRollup'

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

async function processJob(job: Job) {
  if (job.name === 'daily-rollup') {
    return runRollup(job.data)
  }

  throw new Error(`Unknown job: ${job.name}`)
}

export const worker = new Worker(QUEUE_NAME, processJob, {
  connection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10)
})

worker.on('ready', () => {
  console.log('[integrations-worker] ready')
})

worker.on('failed', (job, err) => {
  console.error('[integrations-worker] failed', job?.id, err)
})

worker.on('completed', (job) => {
  console.log('[integrations-worker] completed', job.id)
})

