import { useState } from 'react'
import { useRouter } from 'next/router'

import { UIText, Button, Avatar, Badge } from '@campsite/ui'
import { DropdownMenu } from '@campsite/ui/DropdownMenu'
import { buildMenuItems } from '@campsite/ui/Menu'

import { useScope } from '@/contexts/scope'
import { useGetOrganizationMemberships } from '@/hooks/useGetOrganizationMemberships'
import { useGetUnreadNotificationsCount } from '@/hooks/useGetUnreadNotificationsCount'

export function MultiOrgActivityIndicator() {
  const { scope } = useScope()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data: memberships } = useGetOrganizationMemberships()
  const unreadCounts = useGetUnreadNotificationsCount()
  
  if (!memberships || memberships.length <= 1) return null
  
  // Calculate total unread across all organizations except current
  const otherOrgsWithUnread = memberships
    .filter(m => m.organization.slug !== scope)
    .map(membership => {
      const orgSlug = membership.organization.slug
      const inboxCount = unreadCounts.data?.home_inbox[orgSlug] || 0
      const chatCount = unreadCounts.data?.messages[orgSlug] || 0
      const totalCount = inboxCount + chatCount
      
      return {
        ...membership,
        unreadCount: totalCount,
        inboxCount,
        chatCount
      }
    })
    .filter(org => org.unreadCount > 0)
  
  const totalUnread = otherOrgsWithUnread.reduce((total, org) => total + org.unreadCount, 0)
  
  if (totalUnread === 0) return null

  // Check user preferences
  const showAllOrgNotifications = localStorage.getItem('show-all-org-notifications') === 'true'
  if (!showAllOrgNotifications) return null
  
  const menuItems = buildMenuItems([
    ...otherOrgsWithUnread.map(org => ({
      type: 'item' as const,
      label: org.organization.name,
      url: `/${org.organization.slug}`,
      leftSlot: (
        <Avatar
          size='xs'
          name={org.organization.name}
          urls={org.organization.avatar_urls}
          rounded='rounded'
        />
      ),
      rightSlot: (
        <div className="flex items-center gap-1">
          {org.inboxCount > 0 && (
            <Badge variant="blue" size="sm">
              {org.inboxCount}
            </Badge>
          )}
          {org.chatCount > 0 && (
            <Badge variant="green" size="sm">
              {org.chatCount}
            </Badge>
          )}
        </div>
      )
    })),
    { type: 'separator' as const },
    {
      type: 'item' as const,
      label: 'View all organizations',
      onSelect: () => {
        setOpen(false)
        router.push('/me/settings/organizations')
      }
    }
  ])
  
  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button className="w-full px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <UIText size="text-sm" className="text-blue-700 dark:text-blue-300 flex-1 text-left">
              {totalUnread} unread in {otherOrgsWithUnread.length} other {otherOrgsWithUnread.length === 1 ? 'organization' : 'organizations'}
            </UIText>
          </div>
        </button>
      }
      items={menuItems}
      align="start"
      sideOffset={4}
    />
  )
}