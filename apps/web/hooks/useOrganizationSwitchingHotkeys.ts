import { useEffect } from 'react'
import Router from 'next/router'

import { useScope } from '@/contexts/scope'
import { useGetOrganizationMemberships } from '@/hooks/useGetOrganizationMemberships'

export function useOrganizationSwitchingHotkeys() {
  const { scope } = useScope()
  const { data: memberships } = useGetOrganizationMemberships()

  useEffect(() => {
    // Check if hotkeys are enabled (default to true)
    const enableOrgSwitchHotkeys = localStorage.getItem('enable-org-switch-hotkeys') !== 'false'
    
    if (!enableOrgSwitchHotkeys || !memberships || memberships.length <= 1) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Check for Cmd/Ctrl + number key
      if ((event.metaKey || event.ctrlKey) && event.key >= '1' && event.key <= '9') {
        const index = parseInt(event.key) - 1
        const targetMembership = memberships[index]
        
        if (targetMembership && targetMembership.organization.slug !== scope) {
          event.preventDefault()
          Router.push(`/${targetMembership.organization.slug}`)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [memberships, scope])
}