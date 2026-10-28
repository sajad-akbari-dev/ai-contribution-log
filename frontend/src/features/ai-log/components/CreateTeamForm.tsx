'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createTeam } from '../lib/mutations'
import { teamFormSchema, type TeamFormInput } from '../schemas'
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from './styles'

export function CreateTeamForm() {
  const { user } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormInput>({ resolver: zodResolver(teamFormSchema) })

  const onSubmit = async (data: TeamFormInput) => {
    if (!user) return
    setFormError(null)
    const result = await createTeam(user.uid, data.name)
    if (result.success) {
      toast.success('Team created')
      reset()
    } else {
      setFormError(result.error ?? 'Failed to create team')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-start dark:border-zinc-800"
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="team-name" className={labelClass}>
          New team name
        </label>
        <input
          id="team-name"
          type="text"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'team-name-error' : undefined}
          className={inputClass}
          placeholder="e.g. Platform squad"
          {...register('name')}
        />
        {errors.name && (
          <p id="team-name-error" className={errorTextClass} role="alert">
            {errors.name.message}
          </p>
        )}
        {formError && (
          <p className={errorTextClass} role="alert">
            {formError}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !user}
        className={`${primaryButtonClass} sm:mt-6`}
      >
        {isSubmitting ? 'Creating…' : 'Create team'}
      </button>
    </form>
  )
}
