import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105 active:scale-95 transform-gpu",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 hover:shadow-lg hover:shadow-destructive/25 hover:-translate-y-0.5 animate-pulse-glow",
        outline: 
          "text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/30 hover:shadow-sm backdrop-blur-sm",
        success:
          "border-transparent bg-green-500 text-white shadow hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5",
        warning:
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600 hover:shadow-lg hover:shadow-yellow-500/25 hover:-translate-y-0.5",
        info:
          "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5",
        gradient:
          "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5 animate-gradient-shift",
        glass:
          "glass-effect text-foreground hover:bg-white/20 dark:hover:bg-black/20 hover:shadow-lg backdrop-blur-md",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-sm",
        lg: "px-3 py-1 text-sm rounded-md",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        wiggle: "hover:animate-wiggle",
        float: "animate-float",
        heartbeat: "animate-heartbeat",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  icon?: React.ReactNode
  removable?: boolean
  onRemove?: () => void
}

function Badge({ 
  className, 
  variant, 
  size, 
  animation, 
  dot = false, 
  icon, 
  removable = false, 
  onRemove, 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size, animation }), 
        "group relative overflow-hidden",
        className
      )} 
      {...props}
    >
      {/* Background shimmer effect */}
      {variant === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
      )}
      
      {/* Dot indicator */}
      {dot && (
        <div className={cn(
          "w-2 h-2 rounded-full mr-1.5 animate-pulse",
          variant === "default" && "bg-primary-foreground",
          variant === "secondary" && "bg-secondary-foreground", 
          variant === "destructive" && "bg-destructive-foreground",
          variant === "success" && "bg-white",
          variant === "warning" && "bg-white",
          variant === "info" && "bg-white",
        )} />
      )}
      
      {/* Icon */}
      {icon && (
        <span className="mr-1 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </span>
      )}
      
      {/* Content */}
      <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
        {children}
      </span>
      
      {/* Remove button */}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1.5 hover:bg-black/10 rounded-full p-0.5 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white/50"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants } 