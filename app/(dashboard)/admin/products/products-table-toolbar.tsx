"use client"

import { Table } from "@tanstack/react-table"
import { X, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter"
import { Separator } from "@/components/ui/separator"
import { Product } from "@/types"

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
  onBulkActivate: (productIds: string[]) => void
  onBulkDeactivate: (productIds: string[]) => void
}

export function ProductsTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
  onBulkActivate,
  onBulkDeactivate,
}: ProductsTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  // Get the IDs of selected products
  const getSelectedProductIds = () => {
    return selectedRows.map(row => (row.original as unknown as Product).id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey && (
            <Input
              placeholder={`Search by ${searchKey}...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
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
                    options={column.options}
                  />
                )
            )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-9 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {hasSelection && (
        <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
          <div className="text-sm text-muted-foreground">
            {selectedRows.length} {selectedRows.length === 1 ? 'product' : 'products'} selected
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-green-600"
            onClick={() => onBulkActivate(getSelectedProductIds())}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Set Active</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-amber-600"
            onClick={() => onBulkDeactivate(getSelectedProductIds())}
          >
            <XCircle className="h-4 w-4" />
            <span>Set Inactive</span>
          </Button>
        </div>
      )}
    </div>
  )
}
