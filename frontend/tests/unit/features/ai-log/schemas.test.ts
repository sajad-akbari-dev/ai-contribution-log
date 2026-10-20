import { describe, expect, it } from 'vitest'
import { aiLogFormSchema, teamFormSchema } from '@/features/ai-log/schemas'

const validLog = {
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

describe('teamFormSchema', () => {
  it('requires a name of 1–60 characters', () => {
    expect(teamFormSchema.safeParse({ name: '' }).success).toBe(false)
    expect(teamFormSchema.safeParse({ name: 'x'.repeat(61) }).success).toBe(false)
    expect(teamFormSchema.safeParse({ name: 'Platform squad' }).success).toBe(true)
  })
})
