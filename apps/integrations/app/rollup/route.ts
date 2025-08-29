/* eslint-disable no-console */
import { getQueue } from '../../lib/queue'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const queue = getQueue()
  const provider = request.nextUrl.searchParams.get('model') === 'openai' ? 'openai' : 'anthropic'
  await queue.add('daily-rollup', { modelProvider: provider }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
  return NextResponse.json({ enqueued: true })
}
