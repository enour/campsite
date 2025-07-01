import { useTheme } from 'next-themes'

import { useOrderedLayeredHotkeys } from '@campsite/ui/DismissibleLayer/useLayeredHotkeys'

import { type Theme, useUpdateTheme } from './useUpdateTheme'

export function useThemeKeyboardShortcuts() {
  const { setTheme } = useTheme()
  const updateTheme = useUpdateTheme()

  function switchToTheme(theme: Theme) {
    setTheme(theme)
    updateTheme.mutate({ theme })
  }

  // Ctrl/Cmd + Shift + 1 for Light theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+1'],
    callback: () => switchToTheme('light')
  })

  // Ctrl/Cmd + Shift + 2 for Dark theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+2'],
    callback: () => switchToTheme('dark')
  })

  // Ctrl/Cmd + Shift + 3 for Yellow theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+3'],
    callback: () => switchToTheme('yellow')
  })

  // Ctrl/Cmd + Shift + 4 for Purple theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+4'],
    callback: () => switchToTheme('purple')
  })

  // Ctrl/Cmd + Shift + 5 for System theme (moved to 7)
  // Ctrl/Cmd + Shift + 6 for Turquoise theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+6'],
    callback: () => switchToTheme('turquoise')
  })

  // Ctrl/Cmd + Shift + 7 for System theme
  useOrderedLayeredHotkeys({
    keys: ['mod+shift+7'],
    callback: () => switchToTheme('system')
  })
}