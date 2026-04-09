"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles, Activity, Target } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered Fitness Platform
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
            <span className="block">Train Smarter</span>
            <span className="block mt-2 text-primary">with AI Coach</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto text-pretty">
            FitVision AI uses Computer Vision to track your workouts in real-time, 
            automatically count reps, and guide you through 30-day structured programs.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link href="/ai-coach">
                Try AI Coach Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 h-12 bg-transparent" asChild>
              <Link href="/workouts">
                <Play className="mr-2 h-5 w-5" />
                View Workout Programs
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold text-primary">50+</span>
              <span className="text-sm text-muted-foreground mt-1">Exercises</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold text-primary">99%</span>
              <span className="text-sm text-muted-foreground mt-1">Accuracy</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold text-primary">24/7</span>
              <span className="text-sm text-muted-foreground mt-1">AI Support</span>
            </div>
          </div>
        </div>

        {/* Feature cards preview */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Real-time Tracking</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Track your form and count reps automatically via camera
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">30-Day Programs</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Structured workout plans for lasting results
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Personalized Plans</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Workout programs designed specifically for you
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
