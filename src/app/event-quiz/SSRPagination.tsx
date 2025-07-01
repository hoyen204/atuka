import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface SSRPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  generatePageUrl: (page: number) => string;
}

export default function SSRPagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  generatePageUrl,
}: SSRPaginationProps) {
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, "...", currentPage, "...", totalPages];
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-600 text-center">
        {startEntry}-{endEntry} / {total.toLocaleString()}
      </div>

      <nav className="flex justify-center">
        <ul className="flex items-center gap-1">
          <li>
            {currentPage > 1 ? (
              <Link
                href={generatePageUrl(currentPage - 1)}
                className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors border rounded hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium border rounded opacity-50 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
          </li>
          
          {getVisiblePages().map((page, index) => (
            <li key={index}>
              {page === "..." ? (
                <span className="flex w-8 h-8 items-center justify-center text-sm">⋯</span>
              ) : currentPage === page ? (
                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium bg-primary text-primary-foreground rounded">
                  {page}
                </span>
              ) : (
                <Link 
                  href={generatePageUrl(page as number)}
                  className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors border rounded hover:bg-accent"
                >
                  {page}
                </Link>
              )}
            </li>
          ))}
          
          <li>
            {currentPage < totalPages ? (
              <Link
                href={generatePageUrl(currentPage + 1)}
                className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors border rounded hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium border rounded opacity-50 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}
