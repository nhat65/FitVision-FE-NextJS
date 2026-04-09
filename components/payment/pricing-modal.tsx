'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Check } from 'lucide-react'
import { processPurchase } from '@/lib/subscription-store'
import type { WorkoutProgram } from '@/lib/workout-data'

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: WorkoutProgram
  userId: string
  onSuccess?: () => void
}

export function PricingModal({
  open,
  onOpenChange,
  program,
  userId,
  onSuccess,
}: PricingModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'program' | 'ai'>('program')

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const result = processPurchase(userId, program.id, selectedOption === 'program' ? 'program' : 'ai-monitoring')
      
      if (result.success) {
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.()
          setLoading(false)
        }, 1000)
      } else {
        alert(result.error || 'Purchase failed')
        setLoading(false)
      }
    } catch (error) {
      alert('An error occurred during purchase')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Access to {program.name}</DialogTitle>
          <DialogDescription>
            Choose your subscription option
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Program Access Option */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'program'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('program')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">Program Access</h3>
                <p className="text-sm text-muted-foreground">
                  Full 30-day program with exercises
                </p>
              </div>
              {selectedOption === 'program' && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="mt-3">
              {program.price && program.price > 0 ? (
                <div className="text-2xl font-bold">
                  ${program.price}
                  <span className="text-sm text-muted-foreground ml-2">one-time</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-primary">Free</div>
              )}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                30-day program access
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                All exercises included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Progress tracking
              </li>
            </ul>
          </div>

          {/* AI Monitoring Option */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'ai'
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedOption('ai')}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">
                  Program + AI Monitoring
                </h3>
                <p className="text-sm text-muted-foreground">
                  Program + real-time form feedback
                </p>
              </div>
              {selectedOption === 'ai' && (
                <Check className="w-5 h-5 text-accent" />
              )}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">
                ${(program.price || 0) + (program.aiMonitoringFee || 9.99)}
                <span className="text-sm text-muted-foreground ml-2">one-time</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Then ${program.aiMonitoringFee || 9.99}/month after 30 days
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                30-day program access
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                All exercises included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                AI-powered form feedback
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Real-time rep counting
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                Performance analytics
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
