'use client'

import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

interface OrderCartProps {
  items: CartItem[]
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
  loading: boolean
  success: boolean
  hideHeader?: boolean
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function OrderCart({
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
  loading,
  success,
  hideHeader,
}: OrderCartProps) {
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  return (
    <div
      className="flex flex-col h-full rounded-xl"
      style={{ background: 'var(--surface)', border: hideHeader ? 'none' : '1px solid var(--border)' }}
    >
      {!hideHeader && <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <ShoppingCart size={18} style={{ color: 'var(--accent)' }} />
        <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
          Current Order
        </h2>
        {items.length > 0 && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </div>}

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
            <ShoppingCart size={32} style={{ color: 'var(--muted)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No items yet
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Click a product to add it
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight" style={{ color: 'var(--text)' }}>
                  {item.productName}
                </span>
                <button
                  onClick={() => onRemove(item.productId)}
                  className="flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(item.productId, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
                    style={{ background: 'var(--border)', color: 'var(--text)' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.productId, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {fmt.format(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium" style={{ color: 'var(--muted)' }}>
            Total
          </span>
          <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            {fmt.format(total)}
          </span>
        </div>
        {success && (
          <div
            className="text-center text-sm font-medium py-2 px-3 rounded-lg mb-3"
            style={{ background: 'var(--success)' + '22', color: 'var(--success)', border: '1px solid var(--success)' + '44' }}
          >
            Order placed successfully!
          </div>
        )}
        <button
          onClick={onCheckout}
          disabled={items.length === 0 || loading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{
            background: items.length > 0 && !loading ? 'var(--accent)' : 'var(--surface-2)',
            color: '#fff',
          }}
        >
          {loading ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  )
}
