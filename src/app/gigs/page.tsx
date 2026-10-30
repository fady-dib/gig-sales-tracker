'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Gig } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Plus, Music, MapPin, Calendar, X, LogOut } from 'lucide-react'
import { format } from 'date-fns'

export default function GigsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [navigatingId, setNavigatingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', venue: '', date: '', notes: '' })

  async function fetchGigs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setGigs(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGigs()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.venue.trim() || !form.date) return
    setSaving(true)
    const { error } = await supabase.from('gigs').insert({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      venue: form.venue.trim(),
      date: form.date,
      notes: form.notes.trim() || null,
      created_at: new Date().toISOString(),
    })
    if (error) {
      setError(error.message)
    } else {
      setForm({ name: '', venue: '', date: '', notes: '' })
      setShowForm(false)
      await fetchGigs()
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>
              My Gigs
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Manage your gigs and track bar sales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={16} />
              New Gig
            </button>
            <button
              onClick={async () => {
                setSigningOut(true)
                await supabase.auth.signOut()
                router.push('/login')
                router.refresh()
              }}
              disabled={signingOut}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              <LogOut size={15} className={signingOut ? 'animate-spin' : ''} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* New Gig Form */}
        {showForm && (
          <div
            className="rounded-xl p-6 mb-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                Create New Gig
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Gig Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder=""
                  required
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Venue *
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder=""
                  required
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Notes
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              {error && (
                <div
                  className="sm:col-span-2 text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}
                >
                  {error}
                </div>
              )}
              <div className="sm:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {saving ? 'Creating...' : 'Create Gig'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-36 skeleton"
              />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface)' }}
            >
              <Music size={28} style={{ color: 'var(--muted)' }} />
            </div>
            <p className="text-base font-medium" style={{ color: 'var(--muted)' }}>
              No gigs yet. Create your first gig.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {gigs.map((gig) => {
              const isNavigating = navigatingId === gig.id
              return (
                <button
                  key={gig.id}
                  onClick={() => { setNavigatingId(gig.id); router.push(`/gigs/${gig.id}`) }}
                  disabled={navigatingId !== null}
                  className="rounded-xl p-5 text-left anim-slide-up relative group"
                  style={{
                    background: isNavigating ? 'var(--surface-2)' : 'var(--surface)',
                    border: `1px solid ${isNavigating ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                    opacity: navigatingId !== null && !isNavigating ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isNavigating ? '0 0 24px rgba(99,102,241,0.18)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (navigatingId) return
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(99,102,241,0.4)'
                    el.style.boxShadow = '0 0 24px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.4)'
                    el.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={(e) => {
                    if (navigatingId) return
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border)'
                    el.style.boxShadow = 'none'
                    el.style.transform = ''
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.15)' }}
                    >
                      <Music size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    {isNavigating ? (
                      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)' }} />
                    ) : null}
                  </div>
                  <h3 className="font-bold text-base mb-2.5" style={{ color: 'var(--text)' }}>
                    {gig.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin size={12} style={{ color: 'var(--muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {gig.venue}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} style={{ color: 'var(--muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {format(new Date(gig.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {gig.notes && (
                    <p className="text-xs mt-3 leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                      {gig.notes}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
