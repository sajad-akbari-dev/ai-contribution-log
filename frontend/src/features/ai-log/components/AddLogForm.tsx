'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AI_OUTCOMES, AI_PHASES, OUTCOME_LABELS, PHASE_LABELS } from '../constants'
import { createAiLog } from '../lib/mutations'
import { aiLogFormSchema, type AiLogFormInput } from '../schemas'
import {
  cardClass,
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './styles'

interface AddLogFormProps {
  uid: string
  teamId: string
  /** Called after a successful save so the dashboard can close the form. */
  onSaved: () => void
  onCancel: () => void
}

export function AddLogForm({ uid, teamId, onSaved, onCancel }: AddLogFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AiLogFormInput>({ resolver: zodResolver(aiLogFormSchema) })

  const onSubmit = async (data: AiLogFormInput) => {
    setFormError(null)
    const result = await createAiLog(uid, teamId, data)
    if (result.success) {
      toast.success('Log saved')
      onSaved()
    } else {
      // Keep the entered values so the user can retry without retyping.
      setFormError(result.error ?? 'Failed to save the log')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-4`} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="log-phase" className={labelClass}>
            SDLC phase
          </label>
          <select
            id="log-phase"
            defaultValue=""
            aria-invalid={!!errors.phase}
            aria-describedby={errors.phase ? 'log-phase-error' : undefined}
            className={inputClass}
            {...register('phase')}
          >
            <option value="" disabled>
              Choose a phase
            </option>
            {AI_PHASES.map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABELS[phase]}
              </option>
            ))}
          </select>
          {errors.phase && (
            <p id="log-phase-error" className={errorTextClass} role="alert">
              {errors.phase.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="log-minutes" className={labelClass}>
            Minutes saved
          </label>
          <input
            id="log-minutes"
            type="number"
            inputMode="numeric"
            step={1}
            aria-invalid={!!errors.minutesSaved}
            aria-describedby={errors.minutesSaved ? 'log-minutes-error' : undefined}
            className={inputClass}
            placeholder="0–480"
            {...register('minutesSaved', { valueAsNumber: true })}
          />
          {errors.minutesSaved && (
            <p id="log-minutes-error" className={errorTextClass} role="alert">
              {errors.minutesSaved.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="log-summary" className={labelClass}>
          What did you use AI for?
        </label>
        <textarea
          id="log-summary"
          rows={2}
          aria-invalid={!!errors.taskSummary}
          aria-describedby={errors.taskSummary ? 'log-summary-error' : undefined}
          className={inputClass}
          placeholder="e.g. Drafted test cases for the login flow"
          {...register('taskSummary')}
        />
        {errors.taskSummary && (
          <p id="log-summary-error" className={errorTextClass} role="alert">
            {errors.taskSummary.message}
          </p>
        )}
      </div>

      <fieldset className="space-y-1.5">
        <legend className={labelClass}>What happened to the output?</legend>
        <div className="flex flex-wrap gap-4">
          {AI_OUTCOMES.map((outcome) => (
            <label key={outcome} className="flex items-center gap-2 text-sm">
              <input type="radio" value={outcome} {...register('outcome')} />
              {OUTCOME_LABELS[outcome]}
            </label>
          ))}
        </div>
        {errors.outcome && (
          <p className={errorTextClass} role="alert">
            {errors.outcome.message}
          </p>
        )}
      </fieldset>

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Saving…' : 'Save log'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={secondaryButtonClass}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
