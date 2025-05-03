import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  pageItems: number[];
  startIndex: number;
  endIndex: number;
  pageSizeOptions: number[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: UsePaginationProps): UsePaginationReturn {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get page and pageSize from URL or use defaults
  const [page, setPageState] = useState(
    Number(searchParams.get('page')) || initialPage
  );
  const [pageSize, setPageSizeState] = useState(
    Number(searchParams.get('pageSize')) || initialPageSize
  );

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure page is within valid range
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages]);

  // Update URL when page or pageSize changes
  const setPage = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageState(validPage);
    updateUrl(validPage, pageSize);
  };

  const setPageSize = (newPageSize: number) => {
    setPageSizeState(newPageSize);
    // When changing page size, go back to page 1
    setPageState(1);
    updateUrl(1, newPageSize);
  };

  // Update URL with page and pageSize
  const updateUrl = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('pageSize', newPageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Calculate start and end indices for current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // Generate array of page numbers to display
  const pageItems = useMemo(() => {
    const items: number[] = [];
    const maxPageItems = 7; // Max number of page items to show
    
    if (totalPages <= maxPageItems) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);
      
      // Calculate start and end of middle section
      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);
      
      // Adjust if we're near the start
      if (page <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (page >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        items.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        items.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        items.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      items.push(totalPages);
    }
    
    return items;
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    pageItems,
    startIndex,
    endIndex,
    pageSizeOptions,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}
