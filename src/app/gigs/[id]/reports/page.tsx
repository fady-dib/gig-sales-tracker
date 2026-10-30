'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Transaction, TransactionItem, TicketSale } from '@/lib/types'
import StatCard from '@/components/StatCard'
import { Download, DollarSign, ShoppingBag, Ticket, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const PIE_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
]

interface ProductStat {
  name: string
  qty: number
  revenue: number
  category: string
}

interface CategoryStat {
  name: string
  revenue: number
}

export default function ReportsPage() {
  const { id } = useParams() as { id: string }
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute stats
  const allItems = transactions.flatMap((t) => t.items)
  const barRevenue = allItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const ticketRevenue = ticketSales.reduce((s, t) => s + t.price * t.quantity, 0)
  const totalRevenue = barRevenue + ticketRevenue
  const totalItems = allItems.reduce((s, i) => s + i.quantity, 0)

  // Product breakdown
  const productMap: Record<string, ProductStat> = {}
  transactions.forEach((txn) => {
    txn.items.forEach((item) => {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0, category: '' }
      }
      productMap[item.product_name].qty += item.quantity
      productMap[item.product_name].revenue += item.unit_price * item.quantity
    })
  })
  const productStats = Object.values(productMap).sort((a, b) => b.revenue - a.revenue)
  const top10 = productStats.slice(0, 10)

  // Category breakdown (from items - we need product category, but items only have product_name)
  // We'll use a lookup from product data if available, or just skip category breakdown per item
  // For now, build category from product query
  const [products, setProducts] = useState<{ name: string; category: string }[]>([])
  useEffect(() => {
    supabase.from('products').select('name, category').eq('gig_id', id).then(({ data }) => {
      if (data) setProducts(data)
    })
  }, [id])

  const categoryMap: Record<string, number> = {}
  allItems.forEach((item) => {
    const product = products.find((p) => p.name === item.product_name)
    const cat = product?.category ?? 'Other'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + item.unit_price * item.quantity
  })
  const categoryStats: CategoryStat[] = Object.entries(categoryMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  function exportCSV() {
    const rows: string[] = [
      'Transaction ID,Date,Product,Qty,Unit Price,Subtotal',
    ]
    transactions.forEach((txn) => {
      txn.items.forEach((item) => {
        rows.push(
          [
            txn.id,
            txn.created_at,
            `"${item.product_name.replace(/"/g, '""')}"`,
            item.quantity,
            item.unit_price.toFixed(2),
            (item.unit_price * item.quantity).toFixed(2),
          ].join(',')
        )
      })
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gig-report-${id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    fontSize: '12px',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Full breakdown of your gig revenue</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Revenue"
              value={fmt.format(totalRevenue)}
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar chart: top 10 products */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
                Revenue by Product (Top 10)
              </h2>
              {top10.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
                  No data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis
                        type="number"
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        tickFormatter={(v) => `$${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fill: 'var(--muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [fmt.format(Number(v)), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="var(--accent)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie chart: revenue by category */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
                Revenue by Category
              </h2>
              {categoryStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
                  No data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="revenue"
                        nameKey="name"
                        paddingAngle={2}
                      >
                        {categoryStats.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [fmt.format(Number(v)), 'Revenue']}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Product breakdown table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Product Breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Product', 'Qty Sold', 'Revenue'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center" style={{ color: 'var(--muted)' }}>
                      No sales data yet
                    </td>
                  </tr>
                ) : (
                  productStats.map((p, i) => (
                    <tr
                      key={p.name}
                      style={{ borderTop: '1px solid var(--border)', background: i % 2 === 1 ? 'var(--surface-2)' : 'transparent' }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>{p.name}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>{p.qty}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--accent)' }}>
                        {fmt.format(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
