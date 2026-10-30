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
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
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
                await supabase.auth.signOut()
                router.push('/login')
                router.refresh()
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              <LogOut size={15} />
              Sign out
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
                  placeholder="e.g. Friday Night Vibes"
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
                  placeholder="e.g. Club Neon"
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
                className="h-36 rounded-xl animate-pulse"
                style={{ background: 'var(--surface)' }}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gigs.map((gig) => (
              <button
                key={gig.id}
                onClick={() => router.push(`/gigs/${gig.id}`)}
                className="rounded-xl p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--accent)' + '22' }}
                >
                  <Music size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
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
                  <p
                    className="text-xs mt-3 leading-relaxed line-clamp-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    {gig.notes}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
