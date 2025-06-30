import { useEffect } from 'react'
import { Message, MessageThread } from '@campsite/types'
import { useAppFocused } from '@/hooks/useAppFocused'
import { useCreateMessage } from '@/hooks/useCreateMessage'
import { useMarkThreadRead } from '@/hooks/useMarkThreadRead'

interface ThreadViewEffectsProps {
  threadId: string
  thread: MessageThread | undefined
  endInView: boolean
  messages: Message[]
  threadPlacement?: 'hovercard' | undefined
  setHasNewMessages: (hasNew: boolean) => void
}

export function ThreadViewEffects({
  threadId,
  thread,
  endInView,
  messages,
  threadPlacement,
  setHasNewMessages
}: ThreadViewEffectsProps) {
  const isFocused = useAppFocused()
  const createMessage = useCreateMessage()
  const { mutate: markThreadRead } = useMarkThreadRead()

  // Handle new messages indicator
  useEffect(() => {
    if (!endInView || !messages.length) return
    setHasNewMessages(false)
  }, [endInView, messages.length, setHasNewMessages])

  // Handle marking thread as read
  useEffect(() => {
    if (!threadId || !isFocused || createMessage.isPending) return
    if (!thread?.viewer_is_thread_member || !messages.length) return

    const markAsRead = () => {
      if (threadPlacement === 'hovercard') {
        return setTimeout(() => markThreadRead({ threadId }), 1000)
      }
      markThreadRead({ threadId })
    }

    const timeoutId = markAsRead()
    return () => {
      if (typeof timeoutId === 'number') {
        clearTimeout(timeoutId)
      }
    }
  }, [
    threadId,
    isFocused,
    createMessage.isPending,
    thread?.viewer_is_thread_member,
    messages.length,
    threadPlacement,
    markThreadRead
  ])

  return null // This component only handles effects
}