type ConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'accent'
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
  tone = 'accent',
}: ConfirmModalProps) {
  if (!open) {
    return null
  }

  const confirmClass =
    tone === 'danger'
      ? 'border-[#ff1e9d] bg-[#ff1e9d] text-black'
      : 'border-[#00fff7] bg-[#00fff7] text-black'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
      <div className="w-full max-w-md border border-white bg-black p-6">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.3em] text-[#00fff7]">confirm action</p>
          <h3 className="mt-3 text-2xl font-black text-white">{title}</h3>
          <p className="mt-3 text-sm text-zinc-400">{description}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-white px-4 py-3 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 border px-4 py-3 text-xs font-black tracking-[0.12em] transition hover:opacity-80 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
