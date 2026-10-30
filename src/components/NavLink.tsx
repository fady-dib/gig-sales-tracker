'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export default function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
        color: isActive ? '#a5b4fc' : 'var(--muted)',
        borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        boxShadow: isActive ? 'inset 0 0 12px rgba(99,102,241,0.08)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--surface-2)'
          el.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'transparent'
          el.style.color = 'var(--muted)'
        }
      }}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      {children}
    </Link>
  )
}
