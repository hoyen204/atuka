import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "floating"
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", error = false, success = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    return (
      <div className="relative group">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:bg-gray-900 dark:placeholder:text-gray-500",
            // Default variant
            variant === "default" && cn(
              "border-gray-200 dark:border-gray-700",
              "hover:border-gray-300 hover:shadow-md dark:hover:border-gray-600",
              "focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:border-blue-400 dark:focus:ring-blue-900",
              "focus:scale-[1.01] hover:scale-[1.005]"
            ),
            // Ghost variant
            variant === "ghost" && cn(
              "border-transparent bg-transparent",
              "hover:bg-accent/50 hover:border-border",
              "focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
            ),
            // Floating variant
            variant === "floating" && cn(
              "border-gray-200 dark:border-gray-700 pt-6 pb-2",
              "hover:border-gray-300 hover:shadow-md dark:hover:border-gray-600",
              "focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:border-blue-400 dark:focus:ring-blue-900",
              "peer"
            ),
            // Error state
            error && cn(
              "border-red-500 dark:border-red-400",
              "focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900",
              "animate-shake"
            ),
            // Success state
            success && cn(
              "border-green-500 dark:border-green-400",
              "focus:border-green-500 focus:ring-green-100 dark:focus:ring-green-900"
            ),
            // Focus glow effect
            "focus:animate-glow-border",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          ref={ref}
          {...props}
        />
        
        {/* Floating label for floating variant */}
        {variant === "floating" && props.placeholder && (
          <label className={cn(
            "absolute left-4 text-gray-400 transition-all duration-300 pointer-events-none",
            "peer-focus:text-xs peer-focus:-translate-y-3 peer-focus:text-blue-500",
            (isFocused || hasValue) ? "text-xs -translate-y-3 text-blue-500" : "text-sm translate-y-3"
          )}>
            {props.placeholder}
          </label>
        )}

        {/* Focus indicator line - improved styling */}
        <div className={cn(
          "absolute bottom-[2px] left-[2px] right-[2px] h-[1px] rounded-b-[10px] transition-all duration-300 ease-out",
          "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500",
          isFocused ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0",
          error && "from-red-500 via-red-600 to-red-500",
          success && "from-green-500 via-green-600 to-green-500"
        )} />

        {/* Error/Success icons */}
        {(error || success) && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300",
            error ? "text-red-500" : "text-green-500"
          )}>
            {error && (
              <svg className="w-5 h-5 animate-wiggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {success && (
              <svg className="w-5 h-5 animate-bounce-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        )}

        {/* Ripple effect on focus */}
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-r from-blue-400/10 to-purple-400/10",
          isFocused && "opacity-100"
        )} />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
