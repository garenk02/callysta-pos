"use client"

import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Power } from "lucide-react"

interface DataTableBulkActionsProps<TData> {
  table: Table<TData>
  onActivate?: (selectedRows: TData[]) => void
  onDeactivate?: (selectedRows: TData[]) => void
}

export function DataTableBulkActions<TData>({
  table,
  onActivate,
  onDeactivate,
}: DataTableBulkActionsProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
  const selectedCount = selectedRows.length

  // Debug selected rows
  console.log('Selected rows:', selectedCount, selectedRows)

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <span className="text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
      </span>
      {onActivate && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onActivate(selectedRows)}
          className="h-8 gap-1 text-green-600 border-green-600 hover:bg-green-50"
        >
          <Power className="h-3.5 w-3.5" />
          Activate
        </Button>
      )}
      {onDeactivate && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeactivate(selectedRows)}
          className="h-8 gap-1 text-red-600 border-red-600 hover:bg-red-50"
        >
          <Power className="h-3.5 w-3.5" />
          Deactivate
        </Button>
      )}
    </div>
  )
}
