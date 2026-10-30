'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Gig } from '@/lib/types'
import NavLink from '@/components/NavLink'
import {
  Music, LayoutDashboard, ShoppingCart, Package, Ticket,
  History, BarChart2, ArrowLeft, LogOut, Menu, X,
} from 'lucide-react'
import Link from 'next/link'

export default function GigLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [gig, setGig] = useState<Gig | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchGig() {
      const { data } = await supabase.from('gigs').select('*').eq('id', id).single()
      if (data) setGig(data)
    }
    fetchGig()
  }, [id])

  async function handleLogout() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 flex-col p-4 sticky top-0 h-screen"
        style={{
          background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <Link
          href="/gigs"
          className="flex items-center gap-2 mb-5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          <ArrowLeft size={14} />
          All Gigs
        </Link>

        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, var(--surface-2) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
            <Music size={16} color="#fff" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{gig?.name ?? '...'}</div>
            <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{gig?.venue ?? ''}</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>{item.label}</NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-70 w-full mt-2 disabled:opacity-50"
          style={{ color: 'var(--muted)' }}
        >
          <LogOut size={14} className={signingOut ? 'animate-spin' : ''} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </aside>

      {/* ── Mobile Header ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/gigs" className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={15} />
          Gigs
        </Link>
        <span className="text-sm font-bold truncate max-w-[140px]" style={{ color: 'var(--text)' }}>
          {gig?.name ?? '...'}
        </span>
        <button onClick={() => setMenuOpen(true)} className="p-1" style={{ color: 'var(--muted)' }}>
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile Slide-over ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div
            className="w-64 h-full flex flex-col p-4"
            style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <Music size={14} color="#fff" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{gig?.name ?? '...'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{gig?.venue ?? ''}</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-1" onClick={() => setMenuOpen(false)}>
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href} icon={item.icon}>{item.label}</NavLink>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-70 w-full mt-2"
              style={{ color: 'var(--muted)' }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
