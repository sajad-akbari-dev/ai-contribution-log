import { describe, expect, it } from 'vitest'
import { summarizeByPhase } from '@/features/ai-log/lib/summary'

describe('summarizeByPhase', () => {
  it('returns one zeroed row per phase, in SDLC order, when there are no logs', () => {
    const rows = summarizeByPhase([])
    expect(rows.map((r) => r.phase)).toEqual(['requirements', 'design', 'build', 'test', 'deploy'])
    expect(rows.every((r) => r.logs === 0 && r.minutesSaved === 0)).toBe(true)
    expect(rows.every((r) => r.acceptanceRate === null)).toBe(true)
  })

  it('counts logs, acceptance rate and minutes saved per phase', () => {
    const rows = summarizeByPhase([
      { phase: 'build', outcome: 'accepted', minutesSaved: 30 },
      { phase: 'build', outcome: 'edited', minutesSaved: 15 },
      { phase: 'build', outcome: 'rejected', minutesSaved: 0 },
      { phase: 'build', outcome: 'accepted', minutesSaved: 45 },
      { phase: 'test', outcome: 'accepted', minutesSaved: 20 },
    ])
    const build = rows.find((r) => r.phase === 'build')
    const test = rows.find((r) => r.phase === 'test')
    const design = rows.find((r) => r.phase === 'design')

    expect(build).toEqual({ phase: 'build', logs: 4, acceptanceRate: 0.5, minutesSaved: 90 })
    expect(test).toEqual({ phase: 'test', logs: 1, acceptanceRate: 1, minutesSaved: 20 })
    expect(design?.logs).toBe(0)
  })

  it('does not count edited outcomes as accepted', () => {
    const [row] = summarizeByPhase([{ phase: 'requirements', outcome: 'edited', minutesSaved: 10 }])
    expect(row?.acceptanceRate).toBe(0)
  })
})
