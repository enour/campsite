import { useState } from 'react'

import { PublicOrganization } from '@campsite/types'
import { 
  Avatar, 
  Button, 
  Link, 
  UIText, 
  Badge,
  CheckIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  ShieldCheckIcon
} from '@campsite/ui'

import { EmptyState } from '@/components/EmptyState'
import { FullPageLoading } from '@/components/FullPageLoading'
import * as SettingsSection from '@/components/SettingsSection'
import { LeaveOrganizationDialog } from '@/components/UserSettings/OrganizationsTable/LeaveOrganizationDialog'
import { useGetOrganizationMemberships } from '@/hooks/useGetOrganizationMemberships'
import { useGetUnreadNotificationsCount } from '@/hooks/useGetUnreadNotificationsCount'
import { COMMUNITY_SLUG } from '@campsite/config'

function formatRole(roleName: string): string {
  return roleName.charAt(0).toUpperCase() + roleName.slice(1)
}

function getRoleIcon(roleName: string) {
  switch (roleName) {
    case 'admin':
      return <ShieldCheckIcon size={14} className="text-orange-600" />
    case 'member':
      return <CheckIcon size={14} className="text-green-600" />
    case 'viewer':
      return <ClockIcon size={14} className="text-gray-500" />
    case 'guest':
      return <UserGroupIcon size={14} className="text-blue-500" />
    default:
      return null
  }
}

function getActivityStatus(lastSeenAt: string | null): { label: string; color: string } {
  if (!lastSeenAt) return { label: 'Never active', color: 'gray' }
  
  const lastSeen = new Date(lastSeenAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) return { label: 'Active today', color: 'green' }
  if (daysDiff === 1) return { label: 'Active yesterday', color: 'green' }
  if (daysDiff <= 7) return { label: `Active ${daysDiff} days ago`, color: 'yellow' }
  if (daysDiff <= 30) return { label: `Active ${daysDiff} days ago`, color: 'orange' }
  return { label: `Inactive for ${daysDiff} days`, color: 'red' }
}

export function OrganizationsTable() {
  const { data: memberships, isLoading } = useGetOrganizationMemberships()
  const unreadCounts = useGetUnreadNotificationsCount()

  if (isLoading) return <FullPageLoading />
  if (!memberships?.length)
    return (
      <EmptyState
        title='You are not in any organizations'
        message='You are not a member of any organizations yet. Create an organization or join an existing one by invitation.'
      >
        <div className='mt-4'>
          <Button href='/new'>Create organization</Button>
        </div>
      </EmptyState>
    )

  // Sort organizations: starred first, then by activity, then alphabetically
  const sortedMemberships = [...memberships].sort((a, b) => {
    // Community org always goes last
    if (a.organization.slug === COMMUNITY_SLUG) return 1
    if (b.organization.slug === COMMUNITY_SLUG) return -1
    
    // Admin organizations first
    if (a.organization.viewer_is_admin && !b.organization.viewer_is_admin) return -1
    if (!a.organization.viewer_is_admin && b.organization.viewer_is_admin) return 1
    
    // Then by name
    return a.organization.name.localeCompare(b.organization.name)
  })

  return (
    <SettingsSection.Section>
      <SettingsSection.Header>
        <SettingsSection.Title>My Organizations</SettingsSection.Title>
        <SettingsSection.Description>
          Manage your organization memberships and access settings.
        </SettingsSection.Description>
      </SettingsSection.Header>
      
      <div className='rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
        <div className='bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <UIText size='text-sm' weight='font-medium' className='text-gray-700 dark:text-gray-300'>
              {memberships.length} {memberships.length === 1 ? 'Organization' : 'Organizations'}
            </UIText>
            <Button href='/new' size='sm' variant='primary'>
              Create new
            </Button>
          </div>
        </div>
        
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {sortedMemberships.map((membership) => (
            <OrganizationRow 
              key={membership.id} 
              membership={membership} 
              unreadCount={unreadCounts.data?.home_inbox[membership.organization.slug] || 0}
            />
          ))}
        </div>
      </div>
    </SettingsSection.Section>
  )
}

interface RowProps {
  membership: any // Using any for now since we don't have the full type
  unreadCount: number
}

function OrganizationRow(props: RowProps) {
  const { membership, unreadCount } = props
  const { organization, role_name, last_seen_at } = membership
  const [isOpen, setIsOpen] = useState(false)
  const activityStatus = getActivityStatus(last_seen_at)

  return (
    <div className='flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
      <Link href={`/${organization.slug}`} className='group flex flex-1 items-center gap-3'>
        <div className='relative'>
          <Avatar 
            rounded='rounded-lg' 
            urls={organization.avatar_urls} 
            name={organization.name} 
            size='lg' 
          />
          {unreadCount > 0 && (
            <div className='absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center'>
              <span className='text-white text-xs font-semibold'>{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </div>

        <div className='flex flex-col min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <UIText weight='font-semibold' className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate'>
              {organization.name}
            </UIText>
            {organization.slug === COMMUNITY_SLUG && (
              <Badge variant='secondary' size='sm'>Community</Badge>
            )}
          </div>
          
          <div className='flex items-center gap-3 mt-1'>
            <div className='flex items-center gap-1'>
              {getRoleIcon(role_name)}
              <UIText size='text-sm' className='text-gray-600 dark:text-gray-400'>
                {formatRole(role_name)}
              </UIText>
            </div>
            
            <div className='flex items-center gap-1'>
              <div className={`w-2 h-2 rounded-full bg-${activityStatus.color}-500`} />
              <UIText size='text-xs' className='text-gray-500 dark:text-gray-500'>
                {activityStatus.label}
              </UIText>
            </div>
            
            {organization.member_count && (
              <div className='flex items-center gap-1'>
                <UserGroupIcon size={12} className='text-gray-400' />
                <UIText size='text-xs' className='text-gray-500 dark:text-gray-500'>
                  {organization.member_count} members
                </UIText>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className='flex items-center gap-2'>
        {organization.viewer_is_admin && (
          <Button 
            href={`/${organization.slug}/settings`} 
            size='sm'
            variant='flat'
          >
            Settings
          </Button>
        )}

        {organization.viewer_can_leave && (
          <>
            <LeaveOrganizationDialog organization={organization} open={isOpen} onOpenChange={setIsOpen} />
            <Button 
              onClick={() => setIsOpen(true)} 
              size='sm'
              variant='plain'
              className='text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
            >
              Leave
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
