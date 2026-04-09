'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAdmin, getCurrentUser } from '@/lib/user-store'
import { deleteUser, getUserActivityData } from '@/lib/admin-store'
import { Trash2, Eye, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  userId: string
  userName: string
  email: string
  lastActive: Date
  workoutsSessions: number
  currentProgram: string | null
}

export default function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !isAdmin()) {
      router.push('/login')
      return
    }

    const userActivityData = getUserActivityData()
    setUsers(userActivityData)
    setFilteredUsers(userActivityData)
    setLoading(false)
  }, [router])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId)
      setUsers(users.filter((u) => u.userId !== userId))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground mt-2">Manage all users and their information</p>
          </div>

          {/* Search Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground">
                {filteredUsers.length} users found
              </p>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Workout Sessions</TableHead>
                  <TableHead>Current Program</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-semibold">{user.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{user.workoutsSessions}</TableCell>
                      <TableCell>
                        {user.currentProgram ? (
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                            {user.currentProgram}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.userId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedUser.userName}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedUser(null)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{selectedUser.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Workout Sessions</p>
                      <p className="font-semibold">{selectedUser.workoutsSessions}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Current Program</p>
                      <p className="font-semibold">
                        {selectedUser.currentProgram || 'No active program'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Last Active</p>
                      <p className="font-semibold">
                        {new Date(selectedUser.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedUser(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDeleteUser(selectedUser.userId)
                        setSelectedUser(null)
                      }}
                    >
                      Delete User
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
