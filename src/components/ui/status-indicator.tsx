import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  label: string;
  description?: string;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  label, 
  description, 
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300",
      badgeColor: "bg-green-100 text-green-700"
    },
    offline: {
      color: "bg-red-500", 
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-300",
      badgeColor: "bg-red-100 text-red-700"
    },
    warning: {
      color: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20", 
      textColor: "text-amber-700 dark:text-amber-300",
      badgeColor: "bg-amber-100 text-amber-700"
    },
    error: {
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-300", 
      badgeColor: "bg-red-100 text-red-700"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-md transition-all duration-200",
      config.bgColor,
      className
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          config.color
        )} />
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Badge variant="secondary" className={config.badgeColor}>
        {status === "online" ? "Online" : 
         status === "offline" ? "Offline" :
         status === "warning" ? "Warning" : "Error"}
      </Badge>
    </div>
  );
} 