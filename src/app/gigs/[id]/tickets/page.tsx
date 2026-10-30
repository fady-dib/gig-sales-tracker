'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { TicketType, TicketSale } from '@/lib/types'
import { Plus, Pencil, Trash2, X, Check, Minus, Ticket } from 'lucide-react'
import { format } from 'date-fns'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

interface CartItem {
  typeId: string
  name: string
  price: number
  qty: number
}

export default function TicketsPage() {
  const supabase = createClient()
  const { id } = useParams() as { id: string }

  const [tab, setTab] = useState<'sell' | 'types'>('sell')
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  // Type management
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [editingType, setEditingType] = useState<TicketType | null>(null)
  const [typeForm, setTypeForm] = useState({ name: '', price: '' })
  const [savingType, setSavingType] = useState(false)
  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<string | null>(null)
  const [deleteSaleConfirm, setDeleteSaleConfirm] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [typesRes, salesRes] = await Promise.all([
      supabase.from('ticket_types').select('*').eq('gig_id', id).order('created_at'),
      supabase.from('ticket_sales').select('*').eq('gig_id', id).order('created_at', { ascending: false }),
    ])
    if (typesRes.error) setError(typesRes.error.message)
    else setTicketTypes(typesRes.data ?? [])
    if (salesRes.error) setError(salesRes.error.message)
    else setTicketSales(salesRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Cart logic
  function addToCart(type: TicketType) {
    setCart((prev) => {
      const existing = prev.find((i) => i.typeId === type.id)
      if (existing) return prev.map((i) => i.typeId === type.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { typeId: type.id, name: type.name, price: type.price, qty: 1 }]
    })
  }

  function updateQty(typeId: string, delta: number) {
    setCart((prev) => {
      const item = prev.find((i) => i.typeId === typeId)
      if (!item) return prev
      const newQty = item.qty + delta
      if (newQty <= 0) return prev.filter((i) => i.typeId !== typeId)
      return prev.map((i) => i.typeId === typeId ? { ...i, qty: newQty } : i)
    })
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkoutLoading) return
    setCheckoutLoading(true)
    setError(null)

    const rows = cart.map((item) => ({
      id: crypto.randomUUID(),
      gig_id: id,
      ticket_type: item.name,
      price: item.price,
      quantity: item.qty,
      notes: notes.trim() || null,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('ticket_sales').insert(rows)
    if (error) { setError(error.message); setCheckoutLoading(false); return }

    setCart([])
    setNotes('')
    setCheckoutSuccess(true)
    setTimeout(() => setCheckoutSuccess(false), 3000)
    setCheckoutLoading(false)
    await fetchAll()
  }

  // Type CRUD
  function startEdit(type: TicketType) {
    setEditingType(type)
    setTypeForm({ name: type.name, price: type.price.toString() })
    setShowTypeForm(false)
  }

  function cancelTypeEdit() {
    setEditingType(null)
    setTypeForm({ name: '', price: '' })
  }

  async function handleSaveType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeForm.name.trim() || !typeForm.price) return
    setSavingType(true)
    const payload = { name: typeForm.name.trim(), price: parseFloat(typeForm.price) }

    if (editingType) {
      const { error } = await supabase.from('ticket_types').update(payload).eq('id', editingType.id)
      if (error) setError(error.message)
      else { cancelTypeEdit(); await fetchAll() }
    } else {
      const { error } = await supabase.from('ticket_types').insert({
        id: crypto.randomUUID(), gig_id: id, created_at: new Date().toISOString(), ...payload,
      })
      if (error) setError(error.message)
      else { setTypeForm({ name: '', price: '' }); setShowTypeForm(false); await fetchAll() }
    }
    setSavingType(false)
  }

  async function handleDeleteType(typeId: string) {
    const { error } = await supabase.from('ticket_types').delete().eq('id', typeId)
    if (error) setError(error.message)
    else { setDeleteTypeConfirm(null); await fetchAll() }
  }

  async function handleDeleteSale(saleId: string) {
    const { error } = await supabase.from('ticket_sales').delete().eq('id', saleId)
    if (error) setError(error.message)
    else { setDeleteSaleConfirm(null); await fetchAll() }
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const totalTickets = ticketSales.reduce((s, t) => s + t.quantity, 0)
  const totalRevenue = ticketSales.reduce((s, t) => s + t.price * t.quantity, 0)

  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text)' }}>Tickets</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {totalTickets} sold · {fmt.format(totalRevenue)} revenue
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)22', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['sell', 'types'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? 'var(--accent)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--muted)',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {t === 'sell' ? 'Sell Tickets' : 'Manage Types'}
          </button>
        ))}
      </div>

      {/* ── SELL TAB ── */}
      {tab === 'sell' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ticket type cards */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : ticketTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl" style={{ border: '1px dashed var(--border)' }}>
                <Ticket size={28} style={{ color: 'var(--muted)' }} />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No ticket types yet.</p>
                <button
                  onClick={() => setTab('types')}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Add Types
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticketTypes.map((type) => {
                  const inCart = cart.find((i) => i.typeId === type.id)
                  return (
                    <button
                      key={type.id}
                      onClick={() => addToCart(type)}
                      className="rounded-xl p-4 text-left transition-all active:scale-95"
                      style={{
                        background: inCart ? 'var(--accent)22' : 'var(--surface)',
                        border: `1px solid ${inCart ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text)' }}>
                        {type.name}
                      </div>
                      <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                        {type.price === 0 ? 'Free' : fmt.format(type.price)}
                      </div>
                      {inCart && (
                        <div className="text-xs mt-1 font-medium" style={{ color: 'var(--accent)' }}>
                          {inCart.qty} in order
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Order panel */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Current Order</span>
                {cartCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
                    {cartCount}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col gap-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
                    Click a ticket type to add
                  </p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.typeId} className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.name}</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                            {item.price === 0 ? 'Free' : fmt.format(item.price * item.qty)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQty(item.typeId, -1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--border)', color: 'var(--text)' }}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="text-sm font-bold w-5 text-center" style={{ color: 'var(--text)' }}>{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.typeId, 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Notes (optional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. table 5, reservation…"
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>

                    {/* Total + checkout */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Total</span>
                      <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{fmt.format(cartTotal)}</span>
                    </div>

                    {checkoutSuccess && (
                      <div className="text-center text-sm font-medium py-2 px-3 rounded-lg" style={{ background: 'var(--success)22', color: 'var(--success)', border: '1px solid var(--success)44' }}>
                        Tickets saved!
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {checkoutLoading ? 'Saving…' : 'Confirm Sale'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TYPES TAB ── */}
      {tab === 'types' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              {ticketTypes.length} type{ticketTypes.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setShowTypeForm(!showTypeForm); cancelTypeEdit() }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={15} />
              Add Type
            </button>
          </div>

          {/* Add form */}
          {showTypeForm && !editingType && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <form onSubmit={handleSaveType} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Type Name *</label>
                  <input
                    type="text" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    placeholder="e.g. Walk-in, Guest, VIP…" required autoFocus
                    className="px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-32">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Price *</label>
                  <input
                    type="number" min="0" step="0.01" value={typeForm.price}
                    onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })}
                    placeholder="0.00" required
                    className="px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingType} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--accent)', color: '#fff' }}>
                    {savingType ? 'Saving…' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowTypeForm(false)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Types list */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
            </div>
          ) : ticketTypes.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>No ticket types yet.</div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {ticketTypes.map((type, i) => (
                editingType?.id === type.id ? (
                  <div key={type.id} className="px-5 py-3" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--surface-2)' }}>
                    <form onSubmit={handleSaveType} className="flex flex-wrap gap-3 items-center">
                      <input
                        type="text" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        required autoFocus className="px-3 py-1.5 rounded-lg text-sm outline-none flex-1 min-w-32" style={inputStyle}
                      />
                      <input
                        type="number" min="0" step="0.01" value={typeForm.price}
                        onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })}
                        required className="px-3 py-1.5 rounded-lg text-sm outline-none w-24" style={inputStyle}
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingType} className="p-1.5 rounded-lg" style={{ color: 'var(--success)' }}><Check size={16} /></button>
                        <button type="button" onClick={cancelTypeEdit} className="p-1.5 rounded-lg" style={{ color: 'var(--muted)' }}><X size={16} /></button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div
                    key={type.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div>
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{type.name}</span>
                      <span className="ml-3 text-sm font-bold" style={{ color: 'var(--accent)' }}>
                        {type.price === 0 ? 'Free' : fmt.format(type.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {deleteTypeConfirm === type.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete?</span>
                          <button onClick={() => handleDeleteType(type.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'var(--danger)', color: '#fff' }}>Yes</button>
                          <button onClick={() => setDeleteTypeConfirm(null)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>No</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => startEdit(type)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--muted)' }}><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTypeConfirm(type.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {ticketSales.length > 0 && (() => {
        const typeOptions = ['all', ...Array.from(new Set(ticketSales.map((s) => s.ticket_type)))]
        const filtered = historyFilter === 'all' ? ticketSales : ticketSales.filter((s) => s.ticket_type === historyFilter)
        return (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Sales History</h2>
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {filtered.map((sale, i) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {sale.quantity}x {sale.ticket_type}
                      {sale.price === 0 ? ' · Free' : ` · ${fmt.format(sale.price * sale.quantity)}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {format(new Date(sale.created_at), 'MMM d, h:mm a')}
                      {sale.notes && ` · ${sale.notes}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {deleteSaleConfirm === sale.id ? (
                      <>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete?</span>
                        <button onClick={() => handleDeleteSale(sale.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'var(--danger)', color: '#fff' }}>Yes</button>
                        <button onClick={() => setDeleteSaleConfirm(null)} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>No</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteSaleConfirm(sale.id)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
