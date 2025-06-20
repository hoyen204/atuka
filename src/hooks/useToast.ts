import * as React from "react"
import { toast as reactToastifyToast, ToastOptions } from "react-toastify"
import { toast } from "../components/ui/toast"

// Types for compatibility
export type ToastProps = {
  variant?: "default" | "destructive"
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

type ToasterToast = ToastProps & {
  id: string
}

// Simple toast function that uses react-toastify
function useToast() {
  const toastFunction = React.useCallback((
    { title, description, variant = "default", action, ...options }: ToastProps & ToastOptions
  ) => {
    return toast({ title, description, variant, action, ...options })
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      reactToastifyToast.dismiss(toastId)
    } else {
      reactToastifyToast.dismiss()
    }
  }, [])

  return {
    toast: toastFunction,
    dismiss,
    // For compatibility with existing code that might expect a toasts array
    toasts: [] as ToasterToast[]
  }
}

// Export the toast function directly for convenience
export { useToast, toast }