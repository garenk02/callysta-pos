'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Power } from 'lucide-react'
import { User } from '@/types'
import { ColumnDef } from '@tanstack/react-table'

interface UsersTableProps {
  columns: ColumnDef<User>[]
  data: User[]
  onActivate: (selectedUsers: User[]) => void
  onDeactivate: (selectedUsers: User[]) => void
}

export function UsersTable({ columns, data, onActivate, onDeactivate }: UsersTableProps) {
  const [selectedRows, setSelectedRows] = useState<User[]>([])

  // Handle row selection changes
  const handleRowSelectionChange = (rows: User[]) => {
    setSelectedRows(rows)
    // No alerts needed for production
  }

  // Custom toolbar with bulk action buttons
  const tableToolbar = (table: any) => {
    // Get selected rows directly from the table
    const selectedRows = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original)
    const selectedCount = selectedRows.length

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <input
              placeholder="Search by name..."
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
            />
          </div>

          {selectedCount > 0 && (
            <>
              <div className="flex items-center border rounded-md h-9 px-3 bg-primary/10">
                <span className="text-sm font-medium">
                  {selectedCount} selected
                </span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onActivate(selectedRows)
                }}
                className="h-9 px-3 gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Power className="h-4 w-4" />
                Activate
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onDeactivate(selectedRows)
                }}
                className="h-9 px-3 gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Power className="h-4 w-4" />
                Deactivate
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      filterableColumns={[
        {
          id: "role",
          title: "Role",
          options: [
            { label: "Admin", value: "admin" },
            { label: "Cashier", value: "cashier" },
          ],
        },
        {
          id: "is_active",
          title: "Status",
          options: [
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
      ]}
      tableToolbar={tableToolbar}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
      onRowSelectionChange={handleRowSelectionChange}
    />
  )
}
