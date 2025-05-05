'use client'

import React, { useRef } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { ColumnDef } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VirtualizedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  currentSearchValue?: string
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
  onFilterChange?: (columnId: string, value: string | undefined) => void
  height?: number | string
  selectedFilters?: Record<string, string | undefined>
}

export function VirtualizedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onSearch,
  searchPlaceholder = 'Search...',
  currentSearchValue = '',
  filterableColumns = [],
  onFilterChange,
  height = 600,
  selectedFilters = {},
}: VirtualizedDataTableProps<TData, TValue>) {
  const [searchValue, setSearchValue] = React.useState(currentSearchValue)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Update searchValue when currentSearchValue prop changes
  React.useEffect(() => {
    setSearchValue(currentSearchValue)
  }, [currentSearchValue])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchValue)
    }
  }

  // Autofocus removed as per requirements

  // Extract column headers
  const columnHeaders = columns.map((column) => {
    // @ts-ignore - ColumnDef typing issue
    const header = typeof column.header === 'function'
      // @ts-ignore - ColumnDef typing issue
      ? column.header({ column })
      : column.header?.toString() || '';

    return {
      // @ts-ignore - ColumnDef typing issue
      id: column.id || column.accessorKey?.toString() || '',
      content: header,
      // @ts-ignore - ColumnDef typing issue
      className: column.meta?.className as string || '',
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {searchKey && onSearch && (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder={searchPlaceholder}
                  className="w-full pl-8"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <Button type="submit" variant="default" size="sm">
                Search
              </Button>
            </form>
          )}

          {/* Show reset button when filters or search are active */}
          {(searchValue || Object.values(selectedFilters).some(value => value !== undefined)) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Reset search
                if (searchValue && onSearch) {
                  setSearchValue('');
                  onSearch('');
                }

                // Reset filters
                if (Object.keys(selectedFilters).length > 0 && onFilterChange) {
                  Object.keys(selectedFilters).forEach(columnId => {
                    onFilterChange(columnId, undefined);
                  });
                }
              }}
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {filterableColumns.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {filterableColumns.map((column) => (
              <select
                key={column.id}
                className="h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={selectedFilters[column.id] || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : e.target.value
                  if (onFilterChange) {
                    onFilterChange(column.id, value)
                  }
                }}
              >
                <option value="">{column.title}: All</option>
                {column.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border">
        {/* Custom table implementation to avoid DOM nesting issues */}
        <div className="relative w-full overflow-auto" style={{ height }}>
          {/* Table header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex w-full min-w-max">
              {columnHeaders.map((header) => (
                <div
                  key={header.id}
                  className={cn(
                    "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap flex items-center",
                    header.className
                  )}
                >
                  {header.content}
                </div>
              ))}
            </div>
          </div>

          {/* Table body content - always present */}
          <div className="h-[calc(100%-40px)]">
            {/* Virtualized rows - always render, even with empty data */}
            <Virtuoso
              style={{ height: '100%' }}
              totalCount={data.length}
              itemContent={(index) => {
                  const item = data[index];
                  return (
                    <div className="flex w-full min-w-max hover:bg-muted/50 border-b transition-colors">
                      {columns.map((column, colIndex) => {
                        let cellContent;

                        if (column.cell) {
                          // Use the cell renderer function
                          // @ts-ignore - ColumnDef typing issue
                          cellContent = column.cell({
                            row: {
                              original: item,
                              // Implement getValue for compatibility with existing columns
                              getValue: (key: string) => {
                                // @ts-ignore - ColumnDef typing issue
                                const accessorKey = column.accessorKey?.toString();
                                if (key === accessorKey) {
                                  // @ts-ignore - Dynamic access
                                  return item[accessorKey];
                                }
                                // @ts-ignore - Dynamic access
                                return item[key];
                              }
                            }
                          });
                        // @ts-ignore - ColumnDef typing issue
                        } else if (column.accessorKey) {
                          // Fallback to direct property access
                          // @ts-ignore - Dynamic access
                          // @ts-ignore - ColumnDef typing issue
                          cellContent = item[column.accessorKey.toString()];
                        }

                        // Check if this is the name column to allow text wrapping
                        // @ts-ignore - ColumnDef typing issue
                        const accessorKey = column.accessorKey?.toString();
                        const isNameColumn = accessorKey === 'name';

                        return (
                          <div
                            key={colIndex}
                            className={cn(
                              "p-2 align-middle flex items-center",
                              // Only apply whitespace-nowrap to non-name columns
                              !isNameColumn && "whitespace-nowrap",
                              // @ts-ignore - ColumnDef typing issue
                              column.meta?.className as string || ''
                            )}
                          >
                            {cellContent}
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
          </div>
        </div>
      </div>
    </div>
  )
}
