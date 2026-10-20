'use client'

import { toast } from 'sonner'
import { secondaryButtonClass } from './styles'

/** Shows a user ID with a copy button, so a team owner can be given it to add them. */
export function CopyUid({ uid }: { uid: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uid)
      toast.success('User ID copied')
    } catch {
      toast.error('Could not copy — select the ID and copy it manually')
    }
  }

  return (
    <div className="mt-1 flex items-center gap-3">
      <code className="rounded bg-zinc-100 px-2 py-1 text-xs break-all dark:bg-zinc-800">
        {uid}
      </code>
      <button type="button" onClick={handleCopy} className={secondaryButtonClass}>
        Copy
      </button>
    </div>
  )
}
