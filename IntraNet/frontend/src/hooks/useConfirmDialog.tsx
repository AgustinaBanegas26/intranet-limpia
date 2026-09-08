import { useCallback, useState } from 'react'
import { ConfirmDialog, type ConfirmDialogProps } from '../components/ui/ConfirmDialog'

type ConfirmOptions = Omit<ConfirmDialogProps, 'open' | 'loading' | 'onConfirm' | 'onCancel'>

type PendingConfirm = ConfirmOptions & {
  resolve: (confirmed: boolean) => void
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve })
      }),
    [],
  )

  const close = (result: boolean) => {
    pending?.resolve(result)
    setPending(null)
  }

  const ConfirmDialogHost = (
    <ConfirmDialog
      open={!!pending}
      title={pending?.title ?? ''}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      variant={pending?.variant}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  )

  return { confirm, ConfirmDialogHost }
}
