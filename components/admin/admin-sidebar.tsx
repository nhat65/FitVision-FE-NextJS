'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Dumbbell, Zap, BarChart3, DollarSign, LogOut } from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Dumbbell, label: 'Programs', href: '/admin/programs' },
  { icon: Zap, label: 'Exercises', href: '/admin/exercises' },
  { icon: DollarSign, label: 'Pricing', href: '/admin/pricing' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
]

export function AdminSidebar() {
  const router = useRouter()

  const handleLogout = () => {
    logoutUser()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">FitVision</h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start text-base h-10"
                asChild
              >
                <span>
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
