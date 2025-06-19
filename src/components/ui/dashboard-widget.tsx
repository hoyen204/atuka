import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient: string;
  bgGlow: string;
  className?: string;
  onClick?: () => void;
}

export function DashboardWidget({
  title,
  value,
  change,
  changeType = "positive",
  icon: Icon,
  gradient,
  bgGlow,
  className,
  onClick
}: DashboardWidgetProps) {
  const changeColors = {
    positive: "text-emerald-600",
    negative: "text-red-600", 
    neutral: "text-slate-600"
  };

  return (
    <Card 
      className={cn(
        "relative group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className={`absolute -top-10 -right-10 w-20 h-20 ${bgGlow} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 text-xs">
                <span className={cn("font-medium", changeColors[changeType])}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 