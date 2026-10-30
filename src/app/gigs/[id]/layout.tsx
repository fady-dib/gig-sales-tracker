'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Gig } from '@/lib/types'
import NavLink from '@/components/NavLink'
import { Music, LayoutDashboard, ShoppingCart, Package, Ticket, History, BarChart2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GigLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const id = params.id as string
  const [gig, setGig] = useState<Gig | null>(null)

  useEffect(() => {
    async function fetchGig() {
      const { data } = await supabase.from('gigs').select('*').eq('id', id).single()
      if (data) setGig(data)
    }
    fetchGig()
  }, [id])

  const navItems = [
    { href: `/gigs/${id}`, label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { href: `/gigs/${id}/pos`, label: 'POS', icon: <ShoppingCart size={16} /> },
    { href: `/gigs/${id}/products`, label: 'Products', icon: <Package size={16} /> },
    { href: `/gigs/${id}/tickets`, label: 'Tickets', icon: <Ticket size={16} /> },
    { href: `/gigs/${id}/history`, label: 'History', icon: <History size={16} /> },
    { href: `/gigs/${id}/reports`, label: 'Reports', icon: <BarChart2 size={16} /> },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col p-4 sticky top-0 h-screen"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <Link
          href="/gigs"
          className="flex items-center gap-2 mb-5 px-1 py-1 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft size={14} />
          All Gigs
        </Link>

        <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-6" style={{ background: 'var(--surface-2)' }}>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Music size={16} color="#fff" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
              {gig?.name ?? '...'}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
              {gig?.venue ?? ''}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
