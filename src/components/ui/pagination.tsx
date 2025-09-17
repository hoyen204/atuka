import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button, ButtonProps } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Input } from "./input"
import { useResponsive } from "../../hooks/useResponsive"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9",
      isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

interface PaginationComponentProps {
  currentPage: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function PaginationComponent({ 
  currentPage, 
  totalPages, 
  pageSize, 
  total, 
  onPageChange, 
  onPageSizeChange 
}: PaginationComponentProps) {
  const [jumpPage, setJumpPage] = React.useState("")
  const { isMobile } = useResponsive()
  
  const startEntry = (currentPage - 1) * pageSize + 1
  const endEntry = Math.min(currentPage * pageSize, total)
  
  const getVisiblePages = () => {
    if (isMobile) {
      // Chỉ hiển thị 3 pages tối đa trên mobile
      if (totalPages <= 3) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      
      if (currentPage === 1) {
        return [1, 2, "..."]
      } else if (currentPage === totalPages) {
        return ["...", totalPages - 1, totalPages]
      } else {
        return ["...", currentPage, "..."]
      }
    }
    
    // Desktop logic giữ nguyên
    const delta = 1
    const range = []
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      range.unshift("...")
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...")
    }

    range.unshift(1)
    if (totalPages !== 1) range.push(totalPages)

    return range
  }

  const handleJumpPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(jumpPage)
      if (page >= 1 && page <= totalPages) {
        onPageChange(page)
        setJumpPage("")
      }
    }
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full animate-pagination-fade-in">
        {/* Mobile Info Row - Compact */}
        <div className="flex items-center justify-between text-xs text-gray-600 animate-pagination-slide-in">
          <span className="truncate">
            {startEntry}-{endEntry} / {total.toLocaleString()}
          </span>
          
          {onPageSizeChange && (
            <div className="flex items-center gap-1">
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
                <SelectTrigger className="w-16 h-8 text-xs border-0 bg-gray-100 dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Mobile Navigation - Large Touch Buttons */}
        <div className="flex items-center justify-center pagination-mobile-spacing">
          {/* Previous */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-mobile-touch px-3 flex-shrink-0 active:animate-pagination-button-press transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Page Numbers - Touch Friendly */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-xs">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="flex pagination-mobile-touch w-8 items-center justify-center text-sm text-gray-400">
                    ⋯
                  </span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={cn(
                      "pagination-mobile-touch w-11 text-sm font-medium active:animate-pagination-number-pop transition-all duration-200",
                      currentPage === page 
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105"
                    )}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-mobile-touch px-3 flex-shrink-0 active:animate-pagination-button-press transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Page Info */}
        <div className="text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-full py-2 px-4 animate-pagination-slide-in">
          Trang {currentPage} / {totalPages}
          {total > 0 && (
            <span className="block text-[10px] text-gray-400 mt-0.5">
              {total.toLocaleString()} items
            </span>
          )}
        </div>
      </div>
    )
  }

  // Desktop layout (cải thiện với animations)
  return (
    <div className="flex flex-col gap-4 animate-pagination-fade-in">
      {/* Desktop Info và Controls */}
      <div className="flex items-center justify-between text-sm text-gray-600 animate-pagination-slide-in">
        <div className="flex items-center gap-4">
          <span className="transition-colors duration-200">
            Hiển thị {startEntry.toLocaleString()} - {endEntry.toLocaleString()} trong tổng số {total?.toLocaleString() || 0} mục
          </span>
          
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Hiển thị:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
                <SelectTrigger className="w-20 h-8 transition-all duration-200 hover:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-gray-500">mục/trang</span>
            </div>
          )}
        </div>

        {/* Jump to page */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Đến trang:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={handleJumpPage}
            placeholder={currentPage.toString()}
            className="w-16 h-8 text-center transition-all duration-200 hover:border-primary/50 focus:scale-105"
          />
          <span className="text-gray-500">/ {totalPages}</span>
        </div>
      </div>

      {/* Desktop Pagination Controls */}
      <Pagination className="animate-pagination-slide-in">
        <PaginationContent>
          {/* First Page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1}
              title="Trang đầu tiên"
              className="hover:scale-105 active:animate-pagination-button-press transition-all duration-200 disabled:hover:scale-100"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Previous Page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-1 pl-2.5 hover:scale-105 active:animate-pagination-button-press transition-all duration-200 disabled:hover:scale-100"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trước</span>
            </Button>
          </PaginationItem>
          
          {/* Page Numbers */}
          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === "..." ? (
                <PaginationEllipsis className="text-gray-400" />
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "w-9 h-9 hover:scale-105 active:animate-pagination-number-pop transition-all duration-200",
                    currentPage === page 
                      ? "ring-2 ring-primary/20 shadow-lg bg-primary text-primary-foreground" 
                      : "hover:bg-accent/50"
                  )}
                  title={`Trang ${page}`}
                >
                  {page}
                </Button>
              )}
            </PaginationItem>
          ))}
          
          {/* Next Page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="gap-1 pr-2.5 hover:scale-105 active:animate-pagination-button-press transition-all duration-200 disabled:hover:scale-100"
              title="Trang sau"
            >
              <span>Sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Last Page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              title="Trang cuối cùng"
              className="hover:scale-105 active:animate-pagination-button-press transition-all duration-200 disabled:hover:scale-100"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} 