import { getQueue } from '../../lib/queue'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const queue = getQueue()
  const [counts, paused] = await Promise.all([
    queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    queue.isPaused()
  ])

  return NextResponse.json({ ok: true, paused, counts })
}

