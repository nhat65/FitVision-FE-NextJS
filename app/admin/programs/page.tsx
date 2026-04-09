'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAdmin, getCurrentUser } from '@/lib/user-store'
import { deleteProgram, getProgramStats } from '@/lib/admin-store'
import { Trash2, Eye, Plus, Edit2, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProgramStat {
  programId: string
  programName: string
  enrolledUsers: number
  completionRate: number
  averageRating: number
}

export default function ProgramsManagement() {
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramStat[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramStat[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<ProgramStat | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !isAdmin()) {
      router.push('/login')
      return
    }

    const programsData = getProgramStats()
    setPrograms(programsData)
    setFilteredPrograms(programsData)
    setLoading(false)
  }, [router])

  useEffect(() => {
    const filtered = programs.filter((program) =>
      program.programName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPrograms(filtered)
  }, [searchTerm, programs])

  const handleDeleteProgram = (programId: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      deleteProgram(programId)
      setPrograms(programs.filter((p) => p.programId !== programId))
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Workout Programs</h1>
              <p className="text-muted-foreground mt-2">Manage all 30-day workout programs</p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Program
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by program name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground">
                {filteredPrograms.length} programs found
              </p>
            </div>
          </Card>

          {/* Programs Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Enrolled Users</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.programId}>
                      <TableCell className="font-semibold">{program.programName}</TableCell>
                      <TableCell>30 Days</TableCell>
                      <TableCell>{program.enrolledUsers} users</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${program.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {Math.round(program.completionRate)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {'★'.repeat(Math.floor(program.averageRating))}
                          <span className="text-sm text-muted-foreground">
                            ({program.averageRating.toFixed(1)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProgram(program)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProgram(program.programId)}
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
                      No programs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Program Details Modal */}
          {selectedProgram && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedProgram.programName}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedProgram(null)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">30 Days</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Enrolled Users</p>
                      <p className="font-semibold">{selectedProgram.enrolledUsers}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${selectedProgram.completionRate}%` }}
                          />
                        </div>
                        <span className="font-semibold">
                          {Math.round(selectedProgram.completionRate)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <p className="font-semibold flex items-center gap-2">
                        {'★'.repeat(Math.floor(selectedProgram.averageRating))}
                        {selectedProgram.averageRating.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedProgram(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDeleteProgram(selectedProgram.programId)
                        setSelectedProgram(null)
                      }}
                    >
                      Delete
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
