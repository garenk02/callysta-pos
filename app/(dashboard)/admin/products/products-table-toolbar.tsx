'use client'

import { Table } from "@tanstack/react-table"
import { X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  onSearch?: (value: string) => void
  onFilterChange?: (columnId: string, value: string | undefined) => void
  selectedFilters?: {
    is_active?: string
    category?: string
  }
}

export function ProductsTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
  onSearch,
  onFilterChange,
  selectedFilters,
}: ProductsTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (onSearch) {
      onSearch(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: string | undefined) => {
    if (onFilterChange) {
      onFilterChange(columnId, value)
    } else {
      if (value === undefined || value === "all") {
        table.getColumn(columnId)?.setFilterValue(undefined)
      } else {
        table.getColumn(columnId)?.setFilterValue(value)
      }
    }
  }

  // Handle reset filters
  const handleResetFilters = () => {
    if (onSearch && searchKey) {
      onSearch('')
    }

    if (onFilterChange) {
      filterableColumns.forEach(column => {
        onFilterChange(column.id, undefined)
      })
    } else {
      table.resetColumnFilters()
    }
  }

  // We've removed the checkbox column, so we don't need to get selected product IDs anymore

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search...`}
            value={(onSearch ? '' : (table.getColumn(searchKey)?.getFilterValue() as string)) ?? ""}
            onChange={handleSearchChange}
            className="h-9"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filterableColumns.length > 0 && filterableColumns.map((column) => (
          <div key={column.id} className="flex items-center">
            <Select
              value={
                // Use selectedFilters if provided, otherwise fall back to table state
                selectedFilters && column.id === "is_active" && selectedFilters.is_active
                  ? selectedFilters.is_active
                  : selectedFilters && column.id === "category" && selectedFilters.category
                    ? selectedFilters.category
                    : "all"
              }
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange(column.id, undefined)
                } else {
                  handleFilterChange(column.id, value)
                }
              }}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder={column.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {column.title}s</SelectItem>
                {column.options.map((option) => (
                  <SelectItem key={option.value} value={option.value || "undefined"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-8 px-2"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* We've removed bulk actions since we removed the checkbox column */}
    </div>
  )
}
