import { useSetAtom } from 'jotai'
import Router from 'next/router'

import { useOrderedLayeredHotkeys } from '@campsite/ui/DismissibleLayer/useLayeredHotkeys'

import { defaultInboxView } from '@/components/InboxItems/InboxSplitView'
import { activityOpenAtom } from '@/components/Sidebar/SidebarActivity'
import { useScope } from '@/contexts/scope'
import { useThemeKeyboardShortcuts } from '@/hooks/useThemeKeyboardShortcuts'

export function GlobalKeyboardShortcuts() {
  const { scope } = useScope()
  const setActivityOpen = useSetAtom(activityOpenAtom)

  // Initialize theme keyboard shortcuts
  useThemeKeyboardShortcuts()

  useOrderedLayeredHotkeys({
    keys: ['g', 'i'],
    callback: () => {
      Router.push(`/${scope}/inbox/${defaultInboxView}`)
    }
  })
  useOrderedLayeredHotkeys({
    keys: ['g', 'h'],
    callback: () => Router.push(`/${scope}/posts`)
  })
  useOrderedLayeredHotkeys({
    keys: ['g', 'd'],
    callback: () => Router.push(`/${scope}/notes`)
  })
  useOrderedLayeredHotkeys({
    keys: ['g', 'a'],
    callback: () => setActivityOpen(true)
  })

  return null
}
