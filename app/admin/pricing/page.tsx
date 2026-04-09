'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { workoutPrograms } from '@/lib/workout-data'
import {
  getProgramPricing,
  getAllPricings,
  setProgramPricing,
  type ProgramPricing,
} from '@/lib/subscription-store'
import { isAdmin } from '@/lib/user-store'
import { DollarSign, Plus, Edit, Save, X } from 'lucide-react'

export default function AdminPricingPage() {
  const router = useRouter()
  const [pricings, setPricings] = useState<ProgramPricing[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<ProgramPricing>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check admin access
    if (!isAdmin()) {
      router.push('/login')
      return
    }

    // Load pricings
    const allPricings = getAllPricings()
    
    // Add default pricing for programs without pricing
    const enrichedPricings = workoutPrograms.map((program) => {
      const existing = allPricings.find((p) => p.programId === program.id)
      return (
        existing || {
          programId: program.id,
          isPremium: false,
          price: 0,
          aiMonitoringFee: 9.99,
        }
      )
    })

    setPricings(enrichedPricings)
    setLoading(false)
  }, [router])

  const handleEdit = (pricing: ProgramPricing) => {
    setEditingId(pricing.programId)
    setFormData({ ...pricing })
  }

  const handleSave = () => {
    if (editingId && formData.programId) {
      const updatedPricing: ProgramPricing = {
        programId: formData.programId,
        isPremium: formData.isPremium ?? false,
        price: formData.price ?? 0,
        aiMonitoringFee: formData.aiMonitoringFee ?? 9.99,
      }

      setProgramPricing(updatedPricing)

      // Update local state
      setPricings((prev) =>
        prev.map((p) =>
          p.programId === editingId ? updatedPricing : p
        )
      )

      setEditingId(null)
      setFormData({})
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  const getProgram = (programId: string) => {
    return workoutPrograms.find((p) => p.id === programId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Pricing Management</h1>
              </div>
              <p className="text-muted-foreground">
                Configure program pricing and AI monitoring fees
              </p>
            </div>

            {/* Pricing table */}
            <Card>
              <CardHeader>
                <CardTitle>Program Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program Name</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>AI Fee/Month</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricings.map((pricing) => {
                        const program = getProgram(pricing.programId)
                        const isEditing = editingId === pricing.programId

                        return (
                          <TableRow key={pricing.programId}>
                            <TableCell className="font-medium">
                              {program?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">
                                {program?.difficulty}
                              </span>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  value={formData.isPremium ? 'true' : 'false'}
                                  onValueChange={(value) =>
                                    setFormData({
                                      ...formData,
                                      isPremium: value === 'true',
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="false">Free</SelectItem>
                                    <SelectItem value="true">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span>
                                  {pricing.isPremium ? 'Premium' : 'Free'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.price ?? 0}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      price: parseFloat(e.target.value),
                                    })
                                  }
                                  className="w-24"
                                />
                              ) : (
                                `$${pricing.price.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.aiMonitoringFee ?? 9.99}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      aiMonitoringFee: parseFloat(e.target.value),
                                    })
                                  }
                                  className="w-24"
                                />
                              ) : (
                                `$${pricing.aiMonitoringFee.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={handleSave}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={handleCancel}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(pricing)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pricing info card */}
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Pricing Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">Free Programs:</span>
                  <p className="text-muted-foreground">
                    Users can enroll for free. AI monitoring requires a separate $9.99/month subscription.
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Premium Programs:</span>
                  <p className="text-muted-foreground">
                    Set a one-time price. AI monitoring is included for the first month, then $9.99/month.
                  </p>
                </div>
                <div>
                  <span className="font-semibold">AI Monitoring Fee:</span>
                  <p className="text-muted-foreground">
                    Monthly recurring cost for AI features. Default is $9.99/month but can be customized.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
