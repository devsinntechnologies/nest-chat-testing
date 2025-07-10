// @ts-nocheck
import { useGetAllUsersQuery } from '@/hooks/UseAuth'
import React, { useState } from 'react'
import ChatWithSeller from './ChatWithSeller'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const AllUsers = () => {
  const userId = useSelector((state: RootState) => state.authSlice.user?.id)
  const { data, isLoading, isError } = useGetAllUsersQuery({})
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  console.log(data)
  if (isLoading) return <p>Loading users...</p>
  if (isError) return <p>Failed to fetch users.</p>

  const users = data?.data?.filter((user) => user.id !== userId) || []

  return (
    <div className="space-y-4">
      {users.length === 0 && <p>No other users found.</p>}

      {users.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Select a User</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {users.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
              >
                {user.name} ({user.email})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {selectedUserId && (
        <div className="mt-6 p-4 border rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium">
              {
                users.find((u) => u.id === selectedUserId)?.name ||
                'Selected User'
              }
            </p>
            <p className="text-sm text-gray-600">
              {
                users.find((u) => u.id === selectedUserId)?.email ||
                ''
              }
            </p>
          </div>
          <ChatWithSeller receiverId={selectedUserId} />
        </div>
      )}
    </div>
  )
}

export default AllUsers
