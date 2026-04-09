import { 
  Camera, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  Repeat 
} from "lucide-react"

const features = [
  {
    name: "Pose Detection",
    description: "AI analyzes 33 body points to track your movements and count reps automatically.",
    icon: Camera,
  },
  {
    name: "30-Day Programs",
    description: "Structured workout plans with progressive difficulty to achieve your fitness goals.",
    icon: Calendar,
  },
  {
    name: "Progress Analytics",
    description: "Detailed progress charts, track calories, workout sessions and fitness metrics.",
    icon: TrendingUp,
  },
  {
    name: "All Fitness Levels",
    description: "From beginners to professional athletes, we have programs suitable for everyone.",
    icon: Users,
  },
  {
    name: "Train Anytime",
    description: "No gym needed, train at home with effective bodyweight exercises.",
    icon: Clock,
  },
  {
    name: "Smart Rep Counter",
    description: "Automatically count reps and sets, track rest time between sets.",
    icon: Repeat,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            Key Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Everything you need to train effectively
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            FitVision AI combines advanced AI technology with sports science 
            to deliver the optimal workout experience.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div 
                key={feature.name} 
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <dt className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-lg">{feature.name}</span>
                </dt>
                <dd className="mt-4 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
