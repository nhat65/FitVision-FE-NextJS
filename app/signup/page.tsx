"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dumbbell, Eye, EyeOff, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { calculateBMI, getRecommendedProgram, type UserProfile } from "@/lib/user-store"
import { saveTokens } from "@/lib/auth-store"

type Step = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    height: "",
    weight: "",
    fitnessLevel: "" as UserProfile["fitnessLevel"] | "",
    fitnessGoal: "" as UserProfile["fitnessGoal"] | ""
  })

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError("Please fill in all fields")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const height = parseFloat(formData.height)
    const weight = parseFloat(formData.weight)
    
    if (!height || height < 100 || height > 250) {
      setError("Please enter a valid height (100-250 cm)")
      return false
    }
    if (!weight || weight < 30 || weight > 300) {
      setError("Please enter a valid weight (30-300 kg)")
      return false
    }
    if (!formData.fitnessLevel) {
      setError("Please select your fitness level")
      return false
    }
    if (!formData.fitnessGoal) {
      setError("Please select your fitness goal")
      return false
    }
    return true
  }

  const handleNext = () => {
    setError("")
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          height: formData.height,
          weight: formData.weight,
          fitnessLevel: formData.fitnessLevel,
          fitnessGoal: formData.fitnessGoal,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const tokens = await response.json()
      saveTokens(tokens)
      
      const mockUser: UserProfile = {
        id: tokens.user.id,
        email: formData.email,
        name: formData.name,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        fitnessLevel: formData.fitnessLevel as UserProfile["fitnessLevel"],
        fitnessGoal: formData.fitnessGoal as UserProfile["fitnessGoal"],
        createdAt: new Date().toISOString()
      }
      
      const recommendedId = getRecommendedProgram(mockUser)
      router.push(`/workouts/${recommendedId}?recommended=true`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      setStep(1)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate BMI for display in step 3
  const bmi = formData.height && formData.weight 
    ? calculateBMI(parseFloat(formData.height), parseFloat(formData.weight))
    : null



  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-mono text-xl font-bold tracking-tight">
                FitVision<span className="text-primary">AI</span>
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Create Account"}
              {step === 2 && "Your Fitness Profile"}
              {step === 3 && "Your Personalized Plan"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Start your 30-day transformation today"}
              {step === 2 && "Help us recommend the best program for you"}
              {step === 3 && "Based on your profile, here's what we recommend"}
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/50" : "w-8 bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                
                <Button onClick={handleNext} className="w-full">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Step 2: Fitness Profile */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={formData.height}
                      onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                      min="100"
                      max="250"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      min="30"
                      max="300"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Current Fitness Level</Label>
                  <Select
                    value={formData.fitnessLevel}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessLevel: value as UserProfile["fitnessLevel"] }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        Beginner - New to working out
                      </SelectItem>
                      <SelectItem value="intermediate">
                        Intermediate - Some experience
                      </SelectItem>
                      <SelectItem value="advanced">
                        Advanced - Very experienced
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Primary Fitness Goal</Label>
                  <Select
                    value={formData.fitnessGoal}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessGoal: value as UserProfile["fitnessGoal"] }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">
                        Weight Loss - Burn fat and slim down
                      </SelectItem>
                      <SelectItem value="muscle-gain">
                        Muscle Gain - Build strength and size
                      </SelectItem>
                      <SelectItem value="endurance">
                        Endurance - Improve stamina
                      </SelectItem>
                      <SelectItem value="flexibility">
                        Flexibility - Better mobility
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Recommendation Summary */}
            {step === 3 && (
              <div className="space-y-6">
                {/* BMI Card */}
                {bmi && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Your BMI</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{bmi.value}</span>
                      <span className="text-sm text-muted-foreground">({bmi.category})</span>
                    </div>
                  </div>
                )}
                
                {/* Profile Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Height</span>
                    <span className="font-medium">{formData.height} cm</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{formData.weight} kg</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium capitalize">{formData.fitnessLevel}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-medium capitalize">{formData.fitnessGoal?.replace("-", " ")}</span>
                  </div>
                </div>
                
                {/* Recommended Program */}
                {recommendedProgram && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="text-sm text-primary mb-2 font-medium">Recommended 30-Day Program</div>
                    <div className="font-semibold text-lg">{recommendedProgram.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{recommendedProgram.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {recommendedProgram.goals.slice(0, 3).map((goal, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 text-primary" />
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Start Program"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
