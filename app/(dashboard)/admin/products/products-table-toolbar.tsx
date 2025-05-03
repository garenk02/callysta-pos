'use client'

import { Table } from "@tanstack/react-table"
import { X, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter"
import { useAuth } from "@/hooks/useAuth"

interface ProductsTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
  onBulkActivate?: (productIds: string[]) => void
  onBulkDeactivate?: (productIds: string[]) => void
}

export function ProductsTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
  onBulkActivate,
  onBulkDeactivate,
}: ProductsTableToolbarProps<TData>) {
  const { isAdmin } = useAuth()
  const isFiltered = table.getState().columnFilters.length > 0
  const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  // Handle reset filters
  const handleResetFilters = () => {
    table.resetColumnFilters()
  }

  // Get selected product IDs
  const getSelectedProductIds = () => {
    return table.getFilteredSelectedRowModel().rows.map(row => {
      const product = row.original as any
      return product.id
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <div className="relative w-full sm:w-[250px]">
            <Input
              placeholder={`Search by ${searchKey}...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={handleSearchChange}
              className="h-9 w-full"
            />
          </div>
        )}
        {filterableColumns.length > 0 &&
          filterableColumns.map(
            (column) =>
              table.getColumn(column.id) && (
                <DataTableFacetedFilter
                  key={column.id}
                  column={table.getColumn(column.id)}
                  title={column.title}
                  options={column.options.map(option => ({
                    ...option,
                    // Ensure value is never an empty string
                    value: option.value || "undefined"
                  }))}
                  onValueChange={(value) => {
                    if (value === "undefined") value = undefined;
                    table.getColumn(column.id)?.setFilterValue(value);
                  }}
                />
              )
          )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {hasSelection && isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkActivate?.(getSelectedProductIds())}
              className="h-9"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkDeactivate?.(getSelectedProductIds())}
              className="h-9"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
