"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table,
} from "@tanstack/react-table"

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Power } from "lucide-react"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
  tableToolbar?: (table: Table<TData>) => React.ReactNode
  pagination?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  onSearch?: (query: string) => void
  onFilterChange?: (columnId: string, value: string | undefined) => void
  onSortingChange?: (column: string, direction: 'asc' | 'desc') => void
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  columnVisibility?: Record<string, boolean>
  onActivate?: (selectedRows: TData[]) => void
  onDeactivate?: (selectedRows: TData[]) => void
  onRowSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filterableColumns = [],
  tableToolbar,
  pagination,
  onSearch,
  onFilterChange,
  onSortingChange,
  onColumnVisibilityChange,
  columnVisibility: initialColumnVisibility,
  onActivate,
  onDeactivate,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialColumnVisibility || {}
  )

  // We'll handle row selection changes after table initialization
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Handle search input changes
  const handleSearchChange = React.useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      } else if (searchKey) {
        // Fall back to local filtering if no onSearch callback
        setColumnFilters(prev => {
          const existing = prev.filter(filter => filter.id !== searchKey);
          return value ? [...existing, { id: searchKey, value }] : existing;
        });
      }
    },
    [onSearch, searchKey]
  );

  // Handle filter changes
  const handleFilterChange = React.useCallback(
    (columnId: string, value: string) => {
      if (onFilterChange) {
        onFilterChange(columnId, value || undefined);
      } else {
        // Fall back to local filtering if no onFilterChange callback
        setColumnFilters(prev => {
          const existing = prev.filter(filter => filter.id !== columnId);
          return value ? [...existing, { id: columnId, value }] : existing;
        });
      }
    },
    [onFilterChange]
  );

  // Configure pagination options
  const paginationOptions = pagination
    ? {
        manualPagination: true,
        pageCount: pagination.totalPages,
        state: {
          pagination: {
            pageIndex: pagination.page - 1, // TanStack Table uses 0-based indexing
            pageSize: pagination.pageSize,
          },
        },
        onPaginationChange: (updater) => {
          if (typeof updater === 'function') {
            const newPagination = updater({
              pageIndex: pagination.page - 1,
              pageSize: pagination.pageSize,
            });
            pagination.onPageChange(newPagination.pageIndex + 1);
            if (newPagination.pageSize !== pagination.pageSize) {
              pagination.onPageSizeChange(newPagination.pageSize);
            }
          }
        },
      }
    : {};

  // Handle sorting changes
  const handleSortingChange = React.useCallback(
    (updater: SortingState | ((prevState: SortingState) => SortingState)) => {
      setSorting(updater);

      if (onSortingChange && typeof updater === 'function') {
        const newSorting = updater(sorting);
        if (newSorting.length > 0) {
          const { id, desc } = newSorting[0];
          onSortingChange(id, desc ? 'desc' : 'asc');
        }
      }
    },
    [onSortingChange, sorting]
  );

  // Handle column visibility changes
  const handleColumnVisibilityChange = React.useCallback(
    (updater: VisibilityState | ((prevState: VisibilityState) => VisibilityState)) => {
      setColumnVisibility(updater);

      if (onColumnVisibilityChange && typeof updater === 'function') {
        const newVisibility = updater(columnVisibility);
        onColumnVisibilityChange(newVisibility);
      }
    },
    [onColumnVisibilityChange, columnVisibility]
  );

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: !!onSortingChange, // Use manual sorting if onSortingChange is provided
    ...paginationOptions,
  })

  // Handle row selection changes after table initialization
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, table])

  return (
    <div className="space-y-4">

      {tableToolbar ? (
        tableToolbar(table)
      ) : (
        <DataTableToolbar
          table={table}
          filterableColumns={filterableColumns}
          searchKey={searchKey}
          onSearch={handleSearchChange}
          onFilterChange={handleFilterChange}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )}
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={row.getIsSelected() ? "bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-muted-foreground mb-2">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>
      <DataTablePagination
        table={table}
        customPagination={pagination}
      />
    </div>
  )
}
