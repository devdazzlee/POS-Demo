"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, ToastViewportPosition } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster({ position = "bottom-right" }: { position?: ToastViewportPosition } = {}) {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport position={position} />
    </ToastProvider>
  )
}
