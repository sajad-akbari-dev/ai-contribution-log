'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { addTeamMember } from '../lib/mutations'
import { addMemberFormSchema, type AddMemberFormInput } from '../schemas'
import { errorTextClass, inputClass, labelClass, secondaryButtonClass } from './styles'

interface AddMemberFormProps {
  teamId: string
}

/** Owner-only. Members are added by user ID, copied from a teammate's Profile page. */
export function AddMemberForm({ teamId }: AddMemberFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormInput>({ resolver: zodResolver(addMemberFormSchema) })

  const onSubmit = async (data: AddMemberFormInput) => {
    setFormError(null)
    const result = await addTeamMember(teamId, data.uid)
    if (result.success) {
      toast.success('Member added')
      reset()
    } else {
      setFormError(result.error ?? 'Failed to add member')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-start dark:border-zinc-800"
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="member-uid" className={labelClass}>
          Add a member by user ID
        </label>
        <input
          id="member-uid"
          type="text"
          aria-invalid={!!errors.uid}
          aria-describedby={errors.uid ? 'member-uid-error' : undefined}
          className={inputClass}
          placeholder="Ask your teammate to copy it from their Profile page"
          {...register('uid')}
        />
        {errors.uid && (
          <p id="member-uid-error" className={errorTextClass} role="alert">
            {errors.uid.message}
          </p>
        )}
        {formError && (
          <p className={errorTextClass} role="alert">
            {formError}
          </p>
        )}
      </div>
      <button type="submit" disabled={isSubmitting} className={`${secondaryButtonClass} sm:mt-6`}>
        {isSubmitting ? 'Adding…' : 'Add member'}
      </button>
    </form>
  )
}
