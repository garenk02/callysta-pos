'use client'

import React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePagination } from '@/hooks/usePagination'

interface PaginationControlsProps {
  totalItems: number
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  className?: string
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function PaginationControls({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showPageSizeSelector = true,
  className,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    pageItems,
    startIndex,
    endIndex,
    hasPreviousPage,
    hasNextPage,
  } = usePagination({
    totalItems,
    initialPage,
    initialPageSize,
    pageSizeOptions,
  })

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10)
    setPageSize(newPageSize)
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
        <span className="font-medium">{endIndex + 1}</span> of{' '}
        <span className="font-medium">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-4">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        )}

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={!hasPreviousPage ? 'pointer-events-none opacity-50' : ''}
                tabIndex={!hasPreviousPage ? -1 : undefined}
                aria-disabled={!hasPreviousPage}
              />
            </PaginationItem>

            {pageItems.map((pageNumber, i) => {
              // Render ellipsis
              if (pageNumber < 0) {
                return (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              // Render page number
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === page}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
                tabIndex={!hasNextPage ? -1 : undefined}
                aria-disabled={!hasNextPage}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
