'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isAdmin, getCurrentUser } from '@/lib/user-store';
import {
  DollarSign,
  Edit,
  Save,
  X,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useProgramPricings,
  useUpdateProgramPricing,
  type ProgramPricingItem,
} from '@/hooks/usePricing';

export default function AdminPricingPage() {
  const router = useRouter();

  // TanStack Query Hooks
  const {
    data: pricings = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProgramPricings();

  const updatePricingMutation = useUpdateProgramPricing();

  // Local UI States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProgramPricingItem>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Kiểm tra quyền admin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  // Tìm kiếm theo tên hoặc cấp độ
  const filteredPricings = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pricings;
    return pricings.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.difficulty || '').toLowerCase().includes(term)
    );
  }, [pricings, searchTerm]);

  const handleEdit = (pricing: ProgramPricingItem) => {
    setEditingId(pricing.id);
    setFormData({
      id: pricing.id,
      isPremium: pricing.isPremium,
      price: pricing.price,
      aiMonitoringFee: pricing.aiMonitoringFee,
    });
  };

  const handleSave = async (programId: string) => {
    try {
      await updatePricingMutation.mutateAsync({
        id: programId,
        isPremium: formData.isPremium ?? false,
        price: formData.isPremium ? Number(formData.price) || 0 : 0,
        aiMonitoringFee: Number(formData.aiMonitoringFee) || 0,
      });

      toast.success('Pricing updated successfully');
      setEditingId(null);
      setFormData({});
    } catch (err: any) {
      console.error('Error saving pricing:', err);
      toast.error(err.message || 'Failed to save pricing');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pricing data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError && pricings.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1">
          <div className="p-8">
            <Card className="p-8 text-center max-w-lg mx-auto mt-20">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Pricing</h2>
              <p className="text-muted-foreground mb-6">
                {(error as Error)?.message ||
                  'Failed to load pricing data from server.'}
              </p>
              <Button
                onClick={() => refetch()}
                className="flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Pricing Management</h1>
              </div>
              <p className="text-muted-foreground">
                Configure program pricing tier, purchase costs, and AI
                monitoring subscription fees
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by program name or difficulty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredPricings.length} / {pricings.length} programs
              </p>
            </div>
          </Card>

          {/* Pricing table */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border py-4">
              <CardTitle className="text-lg">Program Pricing Tiers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Tier Type</TableHead>
                      <TableHead>Program Price ($)</TableHead>
                      <TableHead>AI Monitoring Fee ($/mo)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPricings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No pricing data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPricings.map((pricing) => {
                        const isEditing = editingId === pricing.id;
                        const isSaving =
                          updatePricingMutation.isPending &&
                          updatePricingMutation.variables?.id === pricing.id;

                        return (
                          <TableRow key={pricing.id}>
                            <TableCell className="font-semibold">
                              {pricing.name}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                  pricing.difficulty === 'beginner'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                    : pricing.difficulty === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                                }`}
                              >
                                {pricing.difficulty || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {pricing.totalDays
                                ? `${pricing.totalDays} days`
                                : '30 days'}
                              {pricing.durationWeeks &&
                                ` (${pricing.durationWeeks} wks)`}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  value={formData.isPremium ? 'true' : 'false'}
                                  onValueChange={(value) =>
                                    setFormData({
                                      ...formData,
                                      isPremium: value === 'true',
                                      price:
                                        value === 'false'
                                          ? 0
                                          : formData.price || 19.99,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-28 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="false">Free</SelectItem>
                                    <SelectItem value="true">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    pricing.isPremium
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                                  }`}
                                >
                                  {pricing.isPremium ? '★ Premium' : 'Free'}
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
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-24 text-sm"
                                  disabled={!formData.isPremium}
                                />
                              ) : pricing.isPremium ? (
                                <span className="font-semibold text-foreground">
                                  ${Number(pricing.price).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  $0.00 (Free)
                                </span>
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
                                      aiMonitoringFee:
                                        parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-24 text-sm"
                                />
                              ) : (
                                <span className="font-semibold text-foreground">
                                  $
                                  {Number(
                                    pricing.aiMonitoringFee ?? 9.99
                                  ).toFixed(2)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSave(pricing.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={isSaving}
                                      title="Save pricing changes"
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
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(pricing)}
                                    title="Edit pricing"
                                  >
                                    <Edit className="w-4 h-4 mr-1" /> Edit
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pricing guidelines card */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Pricing Guidelines & Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300">
                  Free Programs
                </span>
                <p className="text-muted-foreground flex-1">
                  Users can enroll and follow standard workout schedules for free.
                  AI Pose Tracking & Rep Counting requires an AI Monitoring subscription ($9.99/month default).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300">
                  Premium Programs
                </span>
                <p className="text-muted-foreground flex-1">
                  Requires a one-time purchase price to unlock full workout schedules and premium exercises.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                  AI Monitoring Fee
                </span>
                <p className="text-muted-foreground flex-1">
                  Configurable monthly fee for real-time computer vision pose analysis, automatic rep counting, and form correction.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
