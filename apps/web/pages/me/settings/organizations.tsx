import Head from 'next/head'

import { CopyCurrentUrl } from '@/components/CopyCurrentUrl'
import AuthAppProviders from '@/components/Providers/AuthAppProviders'
import { UserSettingsLayout } from '@/components/UserSettings/UserSettingsLayout'
import { OrganizationInvitationsTable } from '@/components/UserSettings/OrganizationInvitationsTable'
import { OrganizationsTable } from '@/components/UserSettings/OrganizationsTable/OrganizationsTable'
import { SuggestedOrganizationsTable } from '@/components/UserSettings/SuggestedOrganizationsTable'
import * as SettingsSection from '@/components/SettingsSection'
import { useGetOrganizationMemberships } from '@/hooks/useGetOrganizationMemberships'
import { UIText, Badge, Switch, Button } from '@campsite/ui'
import { useState } from 'react'

function MultiOrgPreferences() {
  const { data: memberships } = useGetOrganizationMemberships()
  const [showAllOrgNotifications, setShowAllOrgNotifications] = useState(
    localStorage.getItem('show-all-org-notifications') === 'true'
  )
  const [enableOrgSwitchHotkeys, setEnableOrgSwitchHotkeys] = useState(
    localStorage.getItem('enable-org-switch-hotkeys') !== 'false' // default to true
  )

  const handleNotificationToggle = (enabled: boolean) => {
    setShowAllOrgNotifications(enabled)
    localStorage.setItem('show-all-org-notifications', enabled.toString())
  }

  const handleHotkeysToggle = (enabled: boolean) => {
    setEnableOrgSwitchHotkeys(enabled)
    localStorage.setItem('enable-org-switch-hotkeys', enabled.toString())
  }

  if (!memberships || memberships.length <= 1) return null

  return (
    <SettingsSection.Section>
      <SettingsSection.Header>
        <SettingsSection.Title>Multi-Organization Preferences</SettingsSection.Title>
        <SettingsSection.Description>
          Customize how you interact with multiple organizations.
        </SettingsSection.Description>
      </SettingsSection.Header>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex-1">
            <UIText weight="font-medium">Cross-organization notifications</UIText>
            <UIText size="text-sm" className="text-gray-600 dark:text-gray-400 mt-1">
              Show notifications from all organizations in the sidebar
            </UIText>
          </div>
          <Switch
            checked={showAllOrgNotifications}
            onCheckedChange={handleNotificationToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex-1">
            <UIText weight="font-medium">Organization switching hotkeys</UIText>
            <UIText size="text-sm" className="text-gray-600 dark:text-gray-400 mt-1">
              Use ⌘+1-9 (or Ctrl+1-9) to quickly switch between organizations
            </UIText>
          </div>
          <Switch
            checked={enableOrgSwitchHotkeys}
            onCheckedChange={handleHotkeysToggle}
          />
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <UIText weight="font-medium" className="text-blue-900 dark:text-blue-100">
            Quick Tips for Multi-Organization Use
          </UIText>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• Use ⌘+1-9 to quickly switch between your first 9 organizations</li>
            <li>• Recent organizations appear at the top of the organization switcher</li>
            <li>• Unread counts are shown across all organizations in the sidebar</li>
            <li>• Use the search (/) to find content across all your organizations</li>
          </ul>
        </div>
      </div>
    </SettingsSection.Section>
  )
}

export default function OrganizationsPage() {
  return (
    <>
      <title>My Organizations</title>

      <UserSettingsLayout>
        <MultiOrgPreferences />
        <OrganizationInvitationsTable />
        <SuggestedOrganizationsTable />
        <OrganizationsTable />
      </UserSettingsLayout>
    </>
  )
}
