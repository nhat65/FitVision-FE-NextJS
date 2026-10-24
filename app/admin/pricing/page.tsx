'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAccessToken } from '@/lib/auth-store'
import { isAdmin, getCurrentUser } from '@/lib/user-store'
import { DollarSign, Edit, Save, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProgramPricing {
  id: string
  name: string
  difficulty: string
  totalDays: number
  durationWeeks: number
  isPremium: boolean
  price: number
  aiMonitoringFee: number
}

export default function AdminPricingPage() {
  const router = useRouter()
  const [pricings, setPricings] = useState<ProgramPricing[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<ProgramPricing>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Kiểm tra quyền admin và fetch data
  useEffect(() => {
    const user = getCurrentUser()
    if (!user || !isAdmin()) {
      router.push('/login')
      return
    }

    fetchPricings()
  }, [router])

  // Fetch tất cả pricing từ API
  const fetchPricings = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pricing data')
      }

      const data = await response.json()
      setPricings(data.data || [])
    } catch (error) {
      console.error('Error fetching pricings:', error)
      toast.error('Failed to load pricing data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pricing: ProgramPricing) => {
    setEditingId(pricing.id)
    setFormData({ ...pricing })
  }

  const handleSave = async (programId: string) => {
    if (!formData.id) return

    setSavingId(programId)

    try {
      const token = getAccessToken()
      const updatedPricing = {
        isPremium: formData.isPremium ?? false,
        price: formData.price ?? 0,
        aiMonitoringFee: formData.aiMonitoringFee ?? 9.99,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workout-plan/${programId}/pricing`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedPricing),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save pricing')
      }

      const result = await response.json()
      const savedPricing = result.data

      // Update local state
      setPricings((prev) =>
        prev.map((p) =>
          p.id === programId
            ? {
                ...p,
                isPremium: savedPricing.isPremium,
                price: savedPricing.price,
                aiMonitoringFee: savedPricing.aiMonitoringFee,
              }
            : p
        )
      )

      toast.success('Pricing updated successfully')
      setEditingId(null)
      setFormData({})
    } catch (error: any) {
      console.error('Error saving pricing:', error)
      toast.error(error.message || 'Failed to save pricing')
    } finally {
      setSavingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({})
  }

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Loading pricing data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
     
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
                        <TableHead>Duration</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>AI Fee/Month</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No pricing data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        pricings.map((pricing) => {
                          const isEditing = editingId === pricing.id
                          const isSaving = savingId === pricing.id

                          return (
                            <TableRow key={pricing.id}>
                              <TableCell className="font-medium">
                                {pricing.name}
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">
                                  {pricing.difficulty || 'N/A'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {pricing.totalDays || 'N/A'} days
                                {pricing.durationWeeks && ` (${pricing.durationWeeks} weeks)`}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Select
                                    value={formData.isPremium ? 'true' : 'false'}
                                    onValueChange={(value) =>
                                      setFormData({
                                        ...formData,
                                        isPremium: value === 'true',
                                        price: value === 'false' ? 0 : formData.price,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="false">Free</SelectItem>
                                      <SelectItem value="true">Premium</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    pricing.isPremium 
                                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  }`}>
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
                                    disabled={!formData.isPremium}
                                  />
                                ) : (
                                  pricing.isPremium ? `$${pricing.price}` : 'Free'
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.aiMonitoringFee}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        aiMonitoringFee: parseFloat(e.target.value),
                                      })
                                    }
                                    className="w-24"
                                  />
                                ) : (
                                  `$${pricing.aiMonitoringFee ?? 0}`
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSave(pricing.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={isSaving}
                                      >
                                        {isSaving ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Save className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleCancel}
                                        disabled={isSaving}
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
                        })
                      )}
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