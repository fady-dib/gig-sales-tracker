'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Transaction, TransactionItem, TicketSale } from '@/lib/types'
import StatCard from '@/components/StatCard'
import { DollarSign, ShoppingBag, Ticket, TrendingUp, Receipt, Star } from 'lucide-react'
import { format } from 'date-fns'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function DashboardPage() {
  const supabase = createClient()
  const { id } = useParams() as { id: string }
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [txnRes, ticketRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('gig_id', id).order('created_at', { ascending: false }),
        supabase.from('ticket_sales').select('*').eq('gig_id', id),
      ])

      if (txnRes.error) { setError(txnRes.error.message); setLoading(false); return }
      if (ticketRes.error) { setError(ticketRes.error.message); setLoading(false); return }

      const txns = txnRes.data ?? []
      if (txns.length > 0) {
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
      } else {
        setTransactions([])
      }
      setTicketSales(ticketRes.data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  const barRevenue = transactions.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
    0
  )
  const ticketRevenue = ticketSales.reduce((sum, ts) => sum + ts.price * ts.quantity, 0)
  const totalRevenue = barRevenue + ticketRevenue
  const totalItems = transactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)

  // Best-selling product
  const productTotals: Record<string, { name: string; qty: number }> = {}
  transactions.forEach((t) => {
    t.items.forEach((i) => {
      const key = i.product_name
      if (!productTotals[key]) productTotals[key] = { name: i.product_name, qty: 0 }
      productTotals[key].qty += i.quantity
    })
  })
  const bestSelling = Object.values(productTotals).sort((a, b) => b.qty - a.qty)[0]

  const recentTxns = transactions.slice(0, 5)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Overview of your gig performance</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total Revenue"
            value={fmt.format(totalRevenue)}
            subtitle="Bar + Tickets"
            icon={<DollarSign size={16} color="#fff" />}
            accent
          />
          <StatCard
            title="Bar Sales"
            value={fmt.format(barRevenue)}
            icon={<ShoppingBag size={16} style={{ color: 'var(--muted)' }} />}
          />
          <StatCard
            title="Ticket Revenue"
            value={fmt.format(ticketRevenue)}
            icon={<Ticket size={16} style={{ color: 'var(--muted)' }} />}
          />
          <StatCard
            title="Items Sold"
            value={totalItems}
            icon={<TrendingUp size={16} style={{ color: 'var(--muted)' }} />}
          />
          <StatCard
            title="Transactions"
            value={transactions.length}
            icon={<Receipt size={16} style={{ color: 'var(--muted)' }} />}
          />
          <StatCard
            title="Best Seller"
            value={bestSelling ? bestSelling.name : '—'}
            subtitle={bestSelling ? `${bestSelling.qty} sold` : 'No sales yet'}
            icon={<Star size={16} style={{ color: 'var(--muted)' }} />}
          />
        </div>
      )}

      {/* Recent transactions */}
      <div className="rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>Recent Transactions</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No transactions yet
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentTxns.map((t) => {
              const total = t.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
              const summary = t.items
                .map((i) => `${i.quantity}x ${i.product_name}`)
                .join(', ')
                .slice(0, 60)
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {summary}{summary.length >= 60 ? '...' : ''}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {format(new Date(t.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                    {fmt.format(total)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
