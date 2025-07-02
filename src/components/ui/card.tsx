import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "interactive" | "glass" | "gradient"
    hover?: boolean
  }
>(({ className, variant = "default", hover = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border bg-card text-card-foreground shadow transition-all duration-300",
      variant === "default" && "hover:shadow-lg hover:shadow-primary/5",
      variant === "interactive" && "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer transform-gpu",
      variant === "glass" && "glass-effect hover:shadow-2xl",
      variant === "gradient" && "bg-gradient-to-br from-card via-card to-muted/20 hover:shadow-xl hover:shadow-primary/20",
      "animate-fade-in",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 transition-all duration-300",
      animated && "hover:bg-accent/5 rounded-t-xl",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight transition-colors duration-300",
      gradient && "bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent",
      "group-hover:text-primary",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0 transition-all duration-300",
      animated && "group-hover:translate-y-[-1px]",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 transition-all duration-300",
      animated && "group-hover:bg-accent/5 rounded-b-xl",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 