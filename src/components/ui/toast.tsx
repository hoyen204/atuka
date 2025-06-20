import * as React from "react"
import { toast as toastify, ToastContainer, ToastOptions } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Toast types for compatibility
export type ToastProps = {
  variant?: "default" | "destructive"
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

export type ToastActionElement = React.ReactElement

// Toast function that wraps react-toastify
export const toast = ({
  title,
  description,
  variant = "default",
  action,
  ...options
}: ToastProps & ToastOptions) => {
  const content = (
    <div className="grid gap-1">
      {title && <div className="text-sm font-semibold">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )

  const toastOptions: ToastOptions = {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    ...options,
  }

  if (variant === "destructive") {
    return toastify.error(content, toastOptions)
  }

  return toastify(content, toastOptions)
}

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        theme="light"
      />
    </>
  )
}

// Viewport component (not needed with react-toastify but kept for compatibility)
export const ToastViewport: React.FC = () => null

// Individual toast components (kept for compatibility but not used)
export const Toast: React.FC<ToastProps & { children?: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
)

export const ToastTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={`text-sm font-semibold ${className || ''}`}>{children}</div>
)

export const ToastDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={`text-sm opacity-90 ${className || ''}`}>{children}</div>
)

export const ToastClose: React.FC = () => null

export const ToastAction: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={className}>{children}</div>
)