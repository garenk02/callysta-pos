"use client"

import { Table } from "@tanstack/react-table"
import { X, Power } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
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
  onSearch?: (value: string) => void
  onFilterChange?: (columnId: string, value: string | undefined) => void
  onActivate?: (selectedRows: TData[]) => void
  onDeactivate?: (selectedRows: TData[]) => void
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
  onSearch,
  onFilterChange,
  onActivate,
  onDeactivate,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (onSearch) {
      onSearch(value);
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  };

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: string | undefined) => {
    if (onFilterChange) {
      onFilterChange(columnId, value);
    } else {
      if (value === undefined) {
        table.getColumn(columnId)?.setFilterValue(undefined);
      } else {
        table.getColumn(columnId)?.setFilterValue(value);
      }
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    if (onSearch && searchKey) {
      onSearch('');
    }

    if (onFilterChange) {
      filterableColumns.forEach(column => {
        onFilterChange(column.id, undefined);
      });
    } else {
      table.resetColumnFilters();
    }
  };

  // Get selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const hasSelection = selectedCount > 0 && onActivate && onDeactivate

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={`Search by ${searchKey}...`}
            value={onSearch ? '' : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")}
            onChange={handleSearchChange}
            className="h-9 w-[250px]"
          />
        )}

        {/* Bulk action buttons - shown when rows are selected */}
        {selectedCount > 0 && (
          <>
            <div className="flex items-center border rounded-md h-9 px-3 bg-primary/10">
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
            </div>
          </>
        )}

        {selectedCount > 0 && onActivate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onActivate(selectedRows.map(row => row.original))}
            className="h-9 px-3 gap-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Power className="h-4 w-4" />
            Activate
          </Button>
        )}

        {selectedCount > 0 && onDeactivate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onDeactivate(selectedRows.map(row => row.original))}
            className="h-9 px-3 gap-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Power className="h-4 w-4" />
            Deactivate
          </Button>
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
                    handleFilterChange(column.id, value);
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
      <DataTableViewOptions table={table} />
    </div>
  )
}
