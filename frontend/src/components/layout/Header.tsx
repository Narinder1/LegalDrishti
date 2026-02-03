'use client'

import Link from 'next/link'
import { Search, Users } from 'lucide-react'
import { siteConfig } from '@/config'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚖️</span>
            </div>
            <div>
              <span className="font-bold text-xl text-gray-900">{siteConfig.name}</span>
              <p className="text-xs text-gray-500">{siteConfig.tagline}</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {siteConfig.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                {link.label === 'Find Experts' && <Search className="w-4 h-4" />}
                {link.label === 'Resources' && <span className="text-sm">📚</span>}
                {link.label === 'Join as Expert' && <Users className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <span>→</span>
              Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
