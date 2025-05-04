'use client'

import { DataTable } from '@/components/ui/data-table'
import { User } from '@/types'
import { ColumnDef } from '@tanstack/react-table'

interface UsersTableProps {
  columns: ColumnDef<User>[]
  data: User[]
}

export function UsersTable({ columns, data }: UsersTableProps) {
  // Custom toolbar with search functionality
  const tableToolbar = (table: any) => {
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
    />
  )
}
