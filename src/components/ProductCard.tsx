'use client'

import { Product } from '@/lib/types'
import { Plus } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const CATEGORY_COLORS: Record<string, string> = {
  Beer: '#f59e0b',
  Cocktails: '#ec4899',
  Spirits: '#8b5cf6',
  Wine: '#ef4444',
  'Soft Drinks': '#06b6d4',
  Water: '#3b82f6',
  Other: '#6b7280',
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const color = CATEGORY_COLORS[product.category] ?? '#6b7280'

  return (
    <button
      onClick={() => onAdd(product)}
      className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-2 cursor-pointer"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: color + '22', color }}
        >
          {product.category}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={14} color="#fff" />
        </div>
      </div>
      <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>
        {product.name}
      </div>
      <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
        {fmt.format(product.price)}
      </div>
    </button>
  )
}
