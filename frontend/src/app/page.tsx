'use client'

import { useAuthStore } from '@/store/authStore'
import { LeftSidebar } from '@/components/home/LeftSidebar'
import { MainContent } from '@/components/home/MainContent'
import { RightSidebar } from '@/components/home/RightSidebar'
import { InternalTeamHome } from '@/components/internal-team'

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore()

  // Role-based home page routing
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'internal_team':
      case 'admin':
        return <InternalTeamHome />

      case 'lawyer':
        // TODO: Lawyer-specific home page
        return <GuestHome />

      case 'firm':
        // TODO: Firm-specific home page
        return <GuestHome />

      default:
        return <GuestHome />
    }
  }

  // Default guest / unauthenticated view
  return <GuestHome />
}

function GuestHome() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] bg-gray-100">
      {/* Left Sidebar */}
      <aside className="w-64 flex-shrink-0 p-4">
        <LeftSidebar />
      </aside>

      {/* Main Content - Center */}
      <main className="flex-1 p-4">
        <MainContent />
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 flex-shrink-0 p-4">
        <RightSidebar />
      </aside>
    </div>
  )
}
