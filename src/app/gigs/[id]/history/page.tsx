'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Transaction, TransactionItem } from '@/lib/types'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function HistoryPage() {
  const supabase = createClient()
  const { id } = useParams() as { id: string }
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const { data: txns, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('gig_id', id)
      .order('created_at', { ascending: false })

    if (txnError) { setError(txnError.message); setLoading(false); return }
    if (!txns || txns.length === 0) { setTransactions([]); setLoading(false); return }

    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .in('transaction_id', txns.map((t) => t.id))

    if (itemsError) { setError(itemsError.message); setLoading(false); return }

    const itemsMap: Record<string, TransactionItem[]> = {}
    ;(items ?? []).forEach((item: TransactionItem) => {
      if (!itemsMap[item.transaction_id]) itemsMap[item.transaction_id] = []
      itemsMap[item.transaction_id].push(item)
    })
    setTransactions(txns.map((t) => ({ ...t, items: itemsMap[t.id] ?? [] })))
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  function toggleExpand(txnId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(txnId)) next.delete(txnId)
      else next.add(txnId)
      return next
    })
  }

  async function handleDelete(txnId: string) {
    // Delete items first
    await supabase.from('transaction_items').delete().eq('transaction_id', txnId)
    const { error } = await supabase.from('transactions').delete().eq('id', txnId)
    if (error) setError(error.message)
    else { setDeleteConfirm(null); await fetchTransactions() }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Sales History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl skeleton" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--muted)' }}>
          No transactions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => {
            const total = txn.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
            const summary = txn.items
              .map((i) => `${i.quantity}x ${i.product_name}`)
              .join(', ')
            const isExpanded = expanded.has(txn.id)

            return (
              <div
                key={txn.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                  onClick={() => toggleExpand(txn.id)}
                >
                  <button className="flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {summary || 'No items'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {format(new Date(txn.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                      {fmt.format(total)}
                    </span>
                    {deleteConfirm === txn.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete?</span>
                        <button
                          onClick={() => handleDelete(txn.id)}
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
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(txn.id) }}
                        className="p-1.5 rounded transition-opacity hover:opacity-70"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Item</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Unit Price</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txn.items.map((item) => (
                          <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{item.product_name}</td>
                            <td className="px-5 py-2.5" style={{ color: 'var(--muted)' }}>{fmt.format(item.unit_price)}</td>
                            <td className="px-5 py-2.5" style={{ color: 'var(--muted)' }}>{item.quantity}</td>
                            <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--accent)' }}>
                              {fmt.format(item.unit_price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                          <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-sm" style={{ color: 'var(--muted)' }}>
                            Total
                          </td>
                          <td className="px-5 py-2.5 font-bold text-sm" style={{ color: 'var(--text)' }}>
                            {fmt.format(total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
