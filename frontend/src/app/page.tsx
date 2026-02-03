import { LeftSidebar } from '@/components/home/LeftSidebar'
import { MainContent } from '@/components/home/MainContent'
import { RightSidebar } from '@/components/home/RightSidebar'

export default function HomePage() {
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
