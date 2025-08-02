import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import Router from 'next/router'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import slugify from 'slugify'
import { z } from 'zod'

import { Avatar, Button, cn, PencilIcon, Select, SelectTrigger, SelectValue, TextField, Tooltip, UIText } from '@campsite/ui'

import { AvatarUploader } from '@/components/AvatarUploader'
import { Form, Title } from '@/components/OrgOnboarding/Components'
import { useCreateOrganization } from '@/hooks/useCreateOrganization'
import { apiErrorToast } from '@/utils/apiErrorToast'
import { useGetOrganizationMemberships } from '@/hooks/useGetOrganizationMemberships'

const NO_SELECTION = 'no-selection'
const OTHER_SELECTION = 'other'

const ROLE_OPTIONS = [
  { value: NO_SELECTION, label: 'Select your role' },
  { value: 'founder', label: 'Founder or Leadership' },
  { value: 'eng-manager', label: 'Engineering/Design Manager' },
  { value: 'product-manager', label: 'Product Manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'software-engineer', label: 'Software Engineer' },
  { value: 'operations', label: 'Operations' },
  { value: 'agency', label: 'Agency/Consultant' },
  { value: 'freelance', label: 'Freelance' },
  { value: OTHER_SELECTION, label: 'Other' }
]

const SIZE_OPTIONS = [
  { value: NO_SELECTION, label: 'Select your organization size' },
  { value: '1', label: 'Just me' },
  { value: '2-5', label: '2-5' },
  { value: '5-25', label: '5-25' },
  { value: '25-100', label: '25-100' },
  { value: '100-250', label: '100-250' },
  { value: '250-1000', label: '250-1000' },
  { value: '1000+', label: '1000+' }
]

const SOURCE_OPTIONS = [
  { value: NO_SELECTION, label: 'Select an option' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'google', label: 'Google' },
  { value: 'product-hunt', label: 'Product Hunt' },
  { value: 'twitter', label: 'X/Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'colleague-friend', label: 'Colleague/Friend' },
  { value: 'design-website', label: 'Design website' },
  { value: 'facebook-instagram', label: 'Facebook/Instagram' },
  { value: 'campsite-email', label: 'Campsite email' },
  { value: OTHER_SELECTION, label: 'Other' }
]

function randomizeOptions(options: { value: string; label: string }[]) {
  const [firstOption, ...restOptions] = options
  const lastOption = restOptions.pop()!
  const shuffledRestOptions = restOptions.sort(() => 0.5 - Math.random())

  return [firstOption, ...shuffledRestOptions, lastOption]
}

const newOrgSchema = z
  .object({
    name: z.string().nonempty({ message: 'Name is required' }).min(2, { message: 'Name is too short' }),
    slug: z.string().nonempty({ message: 'Slug is required' }).min(2, { message: 'Slug is too short' }),
    avatar_path: z.string().optional(),
    role: z
      .string()
      .refine((value) => value !== NO_SELECTION, { message: 'Must select your role' })
      .refine((value) => ROLE_OPTIONS.map((option) => option.value).includes(value), {
        message: 'Invalid role'
      }),
    size: z
      .string()
      .refine((value) => value !== NO_SELECTION, { message: 'Must select your team size' })
      .refine((value) => SIZE_OPTIONS.map((option) => option.value).includes(value), {
        message: 'Invalid size'
      }),
    source: z
      .string()
      .refine((value) => value !== NO_SELECTION, { message: 'Must select how you heard about Campsite' })
      .refine((value) => SOURCE_OPTIONS.map((option) => option.value).includes(value), {
        message: 'Invalid source'
      }),
    sourceOther: z.string().optional(),
    why: z.string().min(2, { message: 'Please share why you want to use Campsite' })
  })
  .superRefine((data, ctx) => {
    if (data.source === OTHER_SELECTION && (!data.sourceOther || data.sourceOther.length <= 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify what brought you to Campsite',
        path: ['sourceOther']
      })
    }
  })

const DEFAULT_NEW_ORG_VALUES: NewOrgSchema = {
  name: '',
  slug: '',
  role: NO_SELECTION,
  size: NO_SELECTION,
  source: NO_SELECTION,
  sourceOther: '',
  why: ''
}

type NewOrgSchema = z.infer<typeof newOrgSchema>

function MultiOrgOnboardingTip() {
  const { data: memberships } = useGetOrganizationMemberships()
  
  if (!memberships || memberships.length === 0) return null
  
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-sm font-semibold">{memberships.length + 1}</span>
        </div>
        <div>
          <UIText weight="font-medium" className="text-blue-900 dark:text-blue-100">
            Creating your {memberships.length === 1 ? 'second' : 'next'} organization
          </UIText>
          <UIText size="text-sm" className="text-blue-800 dark:text-blue-200 mt-1">
            You can easily switch between organizations using the sidebar or keyboard shortcuts (⌘+1-9). 
            Each organization has its own projects, members, and settings.
          </UIText>
          <div className="mt-2 flex flex-wrap gap-2">
            {memberships.slice(0, 3).map(membership => (
              <div key={membership.id} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded-md border">
                <Avatar 
                  size="xs" 
                  name={membership.organization.name} 
                  urls={membership.organization.avatar_urls}
                  rounded="rounded"
                />
                <UIText size="text-xs" className="text-gray-700 dark:text-gray-300">
                  {membership.organization.name}
                </UIText>
              </div>
            ))}
            {memberships.length > 3 && (
              <div className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                <UIText size="text-xs" className="text-gray-600 dark:text-gray-400">
                  +{memberships.length - 3} more
                </UIText>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NewOrganizationForm() {
  const createOrganizationMutation = useCreateOrganization()
  const {
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue: setFormValue,
    trigger
  } = useForm<NewOrgSchema>({
    resolver: zodResolver(newOrgSchema),
    defaultValues: DEFAULT_NEW_ORG_VALUES
  })
  const [editSlug, setEditSlug] = useState(false)

  // run validation on mount
  useEffect(() => {
    trigger()
  }, [trigger])

  const { name, slug, role, size, avatar_path, source, sourceOther, why } = watch()

  const setValue = (key: keyof NewOrgSchema, value: any) => {
    setFormValue(key, value, { shouldValidate: true, shouldDirty: true })
  }

  const onSubmit = handleSubmit(async (data) => {
    createOrganizationMutation.mutate(
      {
        name: data.name,
        slug: data.slug,
        avatar_path: data.avatar_path,
        role: data.role,
        org_size: data.size,
        source: data.sourceOther || data.source,
        why: data.why
      },
      {
        onSuccess: ({ slug }) => Router.push(`/${slug}/onboard/channels`),
        onError: apiErrorToast
      }
    )
  })

  const { randomizedRoleOptions, randomizedSourceOptions } = useMemo(
    () => ({
      randomizedRoleOptions: randomizeOptions(ROLE_OPTIONS),
      randomizedSourceOptions: randomizeOptions(SOURCE_OPTIONS)
    }),
    []
  )

  return (
    <div className="mx-auto w-full max-w-md">
      <MultiOrgOnboardingTip />
      
      <Title
        title='Create your organization'
        subtitle='This is the new home for all of your team’s conversations. Next you will set up your workspace and invite your team.'
      />
      <Form onSubmit={onSubmit}>
        <div className='flex w-full flex-col gap-6'>
          <div className='flex gap-4'>
            <div className='flex flex-col'>
              <UIText
                element='label'
                secondary
                weight='font-medium'
                className='mb-1.5'
                size='text-xs'
                htmlFor='org-logo'
              >
                Logo
              </UIText>
              <AvatarUploader
                id='org-logo'
                onFileUploadError={(_, error) => {
                  setValue('avatar_path', null)
                  toast.error(error.message)
                }}
                onFileUploadSuccess={(_, key) => {
                  setValue('avatar_path', key)
                }}
                src={avatar_path}
                resource='User'
                onFileUploadStart={(file) => {
                  setValue('avatar_path', file.key)
                }}
                shape='square'
                className='place-self-start'
                size='sm'
              />
            </div>

            <div
              className={cn('flex min-w-0 flex-1 flex-col', {
                'gap-4': editSlug,
                'gap-2': !editSlug
              })}
            >
              <TextField
                id='new-org-name'
                label={<RequiredLabel label='Name' forId='new-org-name' />}
                value={name}
                onChange={(value) => {
                  setValue('name', value)

                  // automatically set slug if the slug hasn't been focused yet
                  if (!editSlug) {
                    setValue('slug', slugify(value, { lower: true, remove: /[*+~.()'"!:@]/g }))
                  }
                }}
                additionalClasses='h-10 max-w-full'
                placeholder='Required'
                required
              />

              {editSlug ? (
                <TextField
                  value={slug}
                  onChange={(value) => setValue('slug', value)}
                  additionalClasses='h-10'
                  prefix='app.campsite.com/'
                  placeholder='Required'
                  required
                  autoFocus
                />
              ) : (
                <span className='text-quaternary flex max-w-full items-center py-0.5 text-sm'>
                  app.campsite.com/<span className='text-secondary truncate'>{slug}</span>
                  {name.length > 0 && (
                    <Tooltip label='Change your URL'>
                      <button
                        type='button'
                        className='hover:text-primary -my-0.5 ml-1 p-0.5'
                        onClick={() => setEditSlug(true)}
                      >
                        <PencilIcon />
                      </button>
                    </Tooltip>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className='mb-2 mt-3 h-px border-b' />

          <div className='flex flex-col'>
            <RequiredLabel label='What is your role?' forId='select-role' />
            <Select value={role} options={randomizedRoleOptions} onChange={(value) => setValue('role', value)}>
              <SelectTrigger id='select-role' className='font-normal'>
                <SelectValue />
              </SelectTrigger>
            </Select>
          </div>

          <div className='flex flex-col'>
            <RequiredLabel label='How large is your organization?' forId='select-size' />
            <Select value={size} options={SIZE_OPTIONS} onChange={(value) => setValue('size', value)}>
              <SelectTrigger id='select-size' className='font-normal'>
                <SelectValue />
              </SelectTrigger>
            </Select>
          </div>

          <div className='flex flex-col'>
            <RequiredLabel label='How did you hear about Campsite?' forId='select-source' />
            <Select
              value={source}
              options={randomizedSourceOptions}
              onChange={(value) => {
                setValue('source', value)
                setValue('sourceOther', '')

                if (value === OTHER_SELECTION) {
                  setTimeout(() => {
                    document.getElementById('select-source-other')?.focus()
                  }, 300)
                }
              }}
            >
              <SelectTrigger id='select-source' className='font-normal'>
                <SelectValue />
              </SelectTrigger>
            </Select>

            {source === OTHER_SELECTION && (
              <TextField
                id='select-source-other'
                value={sourceOther}
                onChange={(value) => setValue('sourceOther', value)}
                placeholder='What brought you to Campsite?'
                additionalClasses='max-w-full mt-2'
                inputClasses='pb-2'
                multiline
                autoFocus
              />
            )}
          </div>

          <div
            className={cn('flex min-w-0 flex-1 flex-col', {
              'gap-4': editSlug,
              'gap-2': !editSlug
            })}
          >
            <TextField
              label={<RequiredLabel label='What do you want to use Campsite for?' forId='select-why' />}
              value={why}
              onChange={(value) => setValue('why', value)}
              additionalClasses='max-w-full'
              inputClasses='pb-2'
              maxRows={4}
              placeholder='Required'
              required
              multiline
            />
          </div>

          <Button
            type='submit'
            variant='primary'
            size='large'
            className='mt-6'
            disabled={createOrganizationMutation.isPending || createOrganizationMutation.isSuccess || !isValid}
            tooltip={Object.values(errors).find((error) => !!error?.message)?.message}
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  )
}

function RequiredLabel({ label, forId }: { label: string; forId: string }) {
  return (
    <UIText element='label' secondary weight='font-medium' className='mb-1.5' size='text-xs' htmlFor={forId}>
      {label}{' '}
      <Tooltip label='Required'>
        <span className='text-red-500'>*</span>
      </Tooltip>
    </UIText>
  )
}
