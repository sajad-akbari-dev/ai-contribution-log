import { describe, expect, it } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { aiLogFormSchema, teamFormSchema, type AiLogFormInput } from '@/features/ai-log/schemas'

const validLog: AiLogFormInput = {
  phase: 'build',
  taskSummary: 'Drafted unit tests for the login flow',
  outcome: 'accepted',
  minutesSaved: 30,
}

describe('aiLogFormSchema', () => {
  it('accepts a valid log', () => {
    expect(aiLogFormSchema.safeParse(validLog).success).toBe(true)
  })

  it.each([500, -5, 12.5, Number.NaN])('rejects minutes saved of %s', (minutesSaved) => {
    expect(aiLogFormSchema.safeParse({ ...validLog, minutesSaved }).success).toBe(false)
  })

  it('accepts the minutes boundaries 0 and 480', () => {
    expect(aiLogFormSchema.safeParse({ ...validLog, minutesSaved: 0 }).success).toBe(true)
    expect(aiLogFormSchema.safeParse({ ...validLog, minutesSaved: 480 }).success).toBe(true)
  })

  it('rejects an unknown phase or outcome', () => {
    expect(aiLogFormSchema.safeParse({ ...validLog, phase: 'maintenance' }).success).toBe(false)
    expect(aiLogFormSchema.safeParse({ ...validLog, outcome: 'ignored' }).success).toBe(false)
  })

  it('rejects an empty or over-long task summary', () => {
    expect(aiLogFormSchema.safeParse({ ...validLog, taskSummary: '   ' }).success).toBe(false)
    expect(aiLogFormSchema.safeParse({ ...validLog, taskSummary: 'x'.repeat(281) }).success).toBe(
      false
    )
    expect(aiLogFormSchema.safeParse({ ...validLog, taskSummary: 'x'.repeat(280) }).success).toBe(
      true
    )
  })
})

describe('aiLogFormSchema error messages', () => {
  const messageFor = (input: unknown, field: string) =>
    aiLogFormSchema.safeParse(input).error?.issues.find((i) => i.path[0] === field)?.message

  it('shows the custom message when no phase or outcome is chosen', () => {
    expect(messageFor({ ...validLog, phase: '' }, 'phase')).toBe('Choose a phase')
    expect(messageFor({ ...validLog, outcome: undefined }, 'outcome')).toBe('Choose an outcome')
  })

  it('shows the custom message when minutes saved is blank (NaN)', () => {
    expect(messageFor({ ...validLog, minutesSaved: Number.NaN }, 'minutesSaved')).toBe(
      'Enter the minutes saved'
    )
  })

  it('shows specific messages for fractional and out-of-range minutes', () => {
    expect(messageFor({ ...validLog, minutesSaved: 12.5 }, 'minutesSaved')).toBe(
      'Minutes saved must be a whole number'
    )
    expect(messageFor({ ...validLog, minutesSaved: 500 }, 'minutesSaved')).toBe(
      'Minutes saved cannot exceed 480'
    )
    expect(messageFor({ ...validLog, minutesSaved: -5 }, 'minutesSaved')).toBe(
      'Minutes saved cannot be negative'
    )
  })

  it('works through the react-hook-form zodResolver the forms use', async () => {
    const resolver = zodResolver(aiLogFormSchema)
    const bad = await resolver({ ...validLog, minutesSaved: 500 }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    })
    expect(bad.errors.minutesSaved?.message).toBe('Minutes saved cannot exceed 480')

    const good = await resolver(validLog, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    })
    expect(good.errors).toEqual({})
  })
})

describe('teamFormSchema', () => {
  it('requires a name of 1–60 characters', () => {
    expect(teamFormSchema.safeParse({ name: '' }).success).toBe(false)
    expect(teamFormSchema.safeParse({ name: 'x'.repeat(61) }).success).toBe(false)
    expect(teamFormSchema.safeParse({ name: 'Platform squad' }).success).toBe(true)
  })
})
