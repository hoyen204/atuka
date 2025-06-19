import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  className?: string;
}

export function QuickAction({
  title,
  description,
  href,
  icon: Icon,
  bgColor,
  textColor,
  className
}: QuickActionProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "group p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 cursor-pointer",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
            bgColor
          )}>
            <Icon className={cn("w-5 h-5", textColor)} />
          </div>
          <div className="flex-1">
            <p className="font-medium group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
} 