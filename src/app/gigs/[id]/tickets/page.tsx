'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TicketSale } from '@/lib/types'
import { Trash2, Ticket } from 'lucide-react'
import { format } from 'date-fns'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const TICKET_SUGGESTIONS = ['General Admission', 'VIP', 'Early Bird', 'Student', 'Group']

interface TicketForm {
  ticket_type: string
  price: string
  quantity: string
  notes: string
}

const defaultForm: TicketForm = { ticket_type: '', price: '', quantity: '1', notes: '' }

export default function TicketsPage() {
  const { id } = useParams() as { id: string }
  const [tickets, setTickets] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<TicketForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ticket_sales')
      .select('*')
      .eq('gig_id', id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setTickets(data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ticket_type.trim() || !form.price || !form.quantity) return
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('ticket_sales').insert({
      id: crypto.randomUUID(),
      gig_id: id,
      ticket_type: form.ticket_type.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
      notes: form.notes.trim() || null,
      created_at: new Date().toISOString(),
    })

    if (error) setError(error.message)
    else { setForm(defaultForm); await fetchTickets() }
    setSaving(false)
  }

  async function handleDelete(ticketId: string) {
    const { error } = await supabase.from('ticket_sales').delete().eq('id', ticketId)
    if (error) setError(error.message)
    else { setDeleteConfirm(null); await fetchTickets() }
  }

  const totalQty = tickets.reduce((s, t) => s + t.quantity, 0)
  const totalRevenue = tickets.reduce((s, t) => s + t.price * t.quantity, 0)

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Ticket Sales</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Track ticket sales for this gig</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' + '22' }}>
            <Ticket size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Total Tickets</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{totalQty}</div>
          </div>
        </div>
        <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--success)' + '22' }}>
            <Ticket size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Ticket Revenue</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{fmt.format(totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--text)' }}>Add Ticket Sale</h2>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Ticket Type *</label>
            <input
              type="text"
              list="ticket-type-suggestions"
              value={form.ticket_type}
              onChange={(e) => setForm({ ...form, ticket_type: e.target.value })}
              placeholder="e.g. General Admission"
              required
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <datalist id="ticket-type-suggestions">
              {TICKET_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Price *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
              required
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Quantity *</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {saving ? 'Adding...' : 'Add Sale'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Type', 'Price', 'Qty', 'Total', 'Date', 'Notes', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-3">
                    <div className="h-5 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center" style={{ color: 'var(--muted)' }}>
                  No ticket sales yet.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>
                    {ticket.ticket_type}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>
                    {fmt.format(ticket.price)}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>
                    {ticket.quantity}
                  </td>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--accent)' }}>
                    {fmt.format(ticket.price * ticket.quantity)}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {ticket.notes ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    {deleteConfirm === ticket.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete?</span>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ background: 'var(--danger)', color: '#fff' }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(ticket.id)}
                        className="p-1.5 rounded transition-opacity hover:opacity-70"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
