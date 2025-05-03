"use client"

import { Table } from "@tanstack/react-table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  customPagination?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}

export function DataTablePagination<TData>({
  table,
  customPagination,
}: DataTablePaginationProps<TData>) {
  // Use custom pagination if provided, otherwise use table pagination
  const useCustomPagination = !!customPagination;

  // Calculate pagination information
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = useCustomPagination
    ? customPagination.totalItems
    : table.getFilteredRowModel().rows.length
  const totalPages = useCustomPagination
    ? customPagination.totalPages
    : table.getPageCount()
  const selectedRows = table.getFilteredSelectedRowModel().rows.length

  // For display, custom pagination uses 1-based indexing, table uses 0-based
  const currentPage = useCustomPagination
    ? customPagination.page
    : pageIndex + 1
  const currentPageSize = useCustomPagination
    ? customPagination.pageSize
    : pageSize

  // Generate page numbers to display
  const pageNumbers = generatePageNumbers(
    useCustomPagination ? currentPage - 1 : pageIndex,
    totalPages
  )

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (useCustomPagination) {
      customPagination.onPageChange(newPage);
    } else {
      table.setPageIndex(newPage - 1);
    }
  }

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    if (useCustomPagination) {
      customPagination.onPageSizeChange(newPageSize);
    } else {
      table.setPageSize(newPageSize);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div>
          {selectedRows > 0 && (
            <span className="mr-2">{selectedRows} of {totalRows} row(s) selected.</span>
          )}
          Showing {totalRows > 0 ? (currentPage - 1) * currentPageSize + 1 : 0} to {Math.min(currentPage * currentPageSize, totalRows)} of {totalRows} entries
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                aria-disabled={currentPage <= 1}
              />
            </PaginationItem>

            {pageNumbers.map((pageNumber, i) => {
              // Render ellipsis
              if (pageNumber === -1) {
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
                    isActive={pageNumber === currentPage}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                aria-disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(currentPage: number, totalPages: number): number[] {
  const pageNumbers: number[] = [];
  const maxPageItems = 7; // Max number of page items to show

  // Adjust for 0-based index to 1-based display
  const displayPage = currentPage + 1;

  if (totalPages <= maxPageItems) {
    // Show all pages if total pages is less than max
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always show first page
    pageNumbers.push(1);

    // Calculate start and end of middle section
    let startPage = Math.max(2, displayPage - 1);
    let endPage = Math.min(totalPages - 1, displayPage + 1);

    // Adjust if we're near the start
    if (displayPage <= 3) {
      endPage = 4;
    }

    // Adjust if we're near the end
    if (displayPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageNumbers.push(-1); // -1 represents ellipsis
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push(-1); // -1 represents ellipsis
    }

    // Always show last page
    pageNumbers.push(totalPages);
  }

  return pageNumbers;
}
