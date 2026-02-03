import Link from 'next/link'
import { siteConfig, getCopyright } from '@/config'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
          {/* Copyright */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">⚖️</span>
            </div>
            <span>{getCopyright()}</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/resources" className="hover:text-primary-600 transition-colors">
              Resources
            </Link>
            <Link href="/privacy" className="hover:text-primary-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary-600 transition-colors">
              Terms of Service
            </Link>
            <span className="flex items-center gap-1">
              📞 {siteConfig.contact.phone}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
