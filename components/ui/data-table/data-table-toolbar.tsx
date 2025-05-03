"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

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
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
  onSearch,
  onFilterChange,
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
