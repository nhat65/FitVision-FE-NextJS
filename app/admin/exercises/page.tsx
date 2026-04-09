'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAdmin, getCurrentUser } from '@/lib/user-store'
import { deleteExercise, getExerciseStats, addExercise } from '@/lib/admin-store'
import { Trash2, Eye, Plus, Edit2, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ExerciseStat {
  exerciseId: string
  exerciseName: string
  timesPerformed: number
  averageReps: number
}

export default function ExercisesManagement() {
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseStat[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseStat[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseStat | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !isAdmin()) {
      router.push('/login')
      return
    }

    const exercisesData = getExerciseStats()
    setExercises(exercisesData)
    setFilteredExercises(exercisesData)
    setLoading(false)
  }, [router])

  useEffect(() => {
    const filtered = exercises.filter((exercise) =>
      exercise.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredExercises(filtered)
  }, [searchTerm, exercises])

  const handleDeleteExercise = (exerciseId: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      deleteExercise(exerciseId)
      setExercises(exercises.filter((e) => e.exerciseId !== exerciseId))
    }
  }

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      addExercise({
        name: newExerciseName,
        muscleGroup: 'General',
        difficulty: 'intermediate',
        description: '',
      })
      setExercises(getExerciseStats())
      setNewExerciseName('')
      setShowAddForm(false)
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
              <h1 className="text-3xl font-bold">Exercises Management</h1>
              <p className="text-muted-foreground mt-2">Manage exercise library</p>
            </div>
            <Button
              className="flex items-center gap-2"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </Button>
          </div>

          {/* Add Exercise Form */}
          {showAddForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">New Exercise</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Exercise name..."
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                />
                <Button onClick={handleAddExercise}>Add</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewExerciseName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Search Bar */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by exercise name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground">
                {filteredExercises.length} exercises found
              </p>
            </div>
          </Card>

          {/* Exercises Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise Name</TableHead>
                  <TableHead>Times Performed</TableHead>
                  <TableHead>Average Reps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <TableRow key={exercise.exerciseId}>
                      <TableCell className="font-semibold">{exercise.exerciseName}</TableCell>
                      <TableCell>{exercise.timesPerformed}</TableCell>
                      <TableCell>{exercise.averageReps} reps</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExercise(exercise)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise.exerciseId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No exercises found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Exercise Details Modal */}
          {selectedExercise && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedExercise.exerciseName}</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedExercise(null)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Times Performed</p>
                      <p className="font-semibold">{selectedExercise.timesPerformed}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Average Reps</p>
                      <p className="font-semibold">{selectedExercise.averageReps}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">Popularity</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(
                                (selectedExercise.timesPerformed / 100) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {Math.min(selectedExercise.timesPerformed, 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedExercise(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDeleteExercise(selectedExercise.exerciseId)
                        setSelectedExercise(null)
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
