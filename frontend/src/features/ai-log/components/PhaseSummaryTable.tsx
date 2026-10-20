import { PHASE_LABELS } from '../constants'
import type { PhaseSummary } from '../lib/summary'
import { cardClass } from './styles'

interface PhaseSummaryTableProps {
  summary: readonly PhaseSummary[]
}

export function PhaseSummaryTable({ summary }: PhaseSummaryTableProps) {
  return (
    <div className={`${cardClass} overflow-x-auto p-0`}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">AI contribution by SDLC phase</caption>
        <thead className="border-b border-zinc-200 text-xs tracking-wide text-zinc-500 uppercase dark:border-zinc-800">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Phase
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Tasks logged
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Acceptance rate
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Minutes saved
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr
              key={row.phase}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <th scope="row" className="px-4 py-3 font-medium">
                {PHASE_LABELS[row.phase]}
              </th>
              <td className="px-4 py-3 text-right tabular-nums">{row.logs}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.acceptanceRate === null ? '—' : `${Math.round(row.acceptanceRate * 100)}%`}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{row.minutesSaved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
