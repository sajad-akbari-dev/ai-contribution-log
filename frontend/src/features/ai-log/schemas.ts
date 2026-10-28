import { z } from 'zod'
import {
  AI_OUTCOMES,
  AI_PHASES,
  MAX_MINUTES_SAVED,
  MAX_SUMMARY_LENGTH,
  MAX_TEAM_NAME_LENGTH,
} from './constants'

// These limits mirror firebase/firestore.rules. The form gives friendly errors;
// the rules are what actually enforce them.

export const aiLogFormSchema = z.object({
  phase: z.enum(AI_PHASES, { error: 'Choose a phase' }),
  taskSummary: z
    .string()
    .trim()
    .min(1, 'Describe the task')
    .max(MAX_SUMMARY_LENGTH, `Keep it under ${MAX_SUMMARY_LENGTH} characters`),
  outcome: z.enum(AI_OUTCOMES, { error: 'Choose an outcome' }),
  minutesSaved: z
    .number({ error: 'Enter the minutes saved' })
    .int('Minutes saved must be a whole number')
    .min(0, 'Minutes saved cannot be negative')
    .max(MAX_MINUTES_SAVED, `Minutes saved cannot exceed ${MAX_MINUTES_SAVED}`),
})

export type AiLogFormInput = z.infer<typeof aiLogFormSchema>

export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Team name is required')
    .max(MAX_TEAM_NAME_LENGTH, `Keep it under ${MAX_TEAM_NAME_LENGTH} characters`),
})

export type TeamFormInput = z.infer<typeof teamFormSchema>

export const addMemberFormSchema = z.object({
  uid: z.string().trim().min(1, 'Paste your teammate’s user ID'),
})

export type AddMemberFormInput = z.infer<typeof addMemberFormSchema>
