import IORedis from 'ioredis'
import { Queue } from 'bullmq'

const QUEUE_NAME = 'integrations-rollup'

declare global {
  // eslint-disable-next-line no-var
  var __INTEGRATIONS_ROLLUP_QUEUE__: Queue | undefined
}

export function getQueue(): Queue {
  if (!global.__INTEGRATIONS_ROLLUP_QUEUE__) {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

    global.__INTEGRATIONS_ROLLUP_QUEUE__ = new Queue(QUEUE_NAME, {
      connection
    })
  }

  return global.__INTEGRATIONS_ROLLUP_QUEUE__
}

export { QUEUE_NAME }

