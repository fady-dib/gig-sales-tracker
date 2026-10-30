'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import OrderCart, { CartItem } from '@/components/OrderCart'
import { ShoppingCart, X } from 'lucide-react'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function POSPage() {
  const supabase = createClient()
  const { id } = useParams() as { id: string }
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'All'>('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').eq('gig_id', id).order('name')
    if (error) setError(error.message)
    else setProducts(data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId)
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter((i) => i.productId !== productId)
      return prev.map((i) => i.productId === productId ? { ...i, quantity: newQty } : i)
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkoutLoading) return
    setCheckoutLoading(true)
    setError(null)

    const transactionId = crypto.randomUUID()
    const { error: txnError } = await supabase.from('transactions').insert({
      id: transactionId, gig_id: id, created_at: new Date().toISOString(),
    })
    if (txnError) { setError(txnError.message); setCheckoutLoading(false); return }

    const { error: itemsError } = await supabase.from('transaction_items').insert(
      cart.map((item) => ({
        id: crypto.randomUUID(),
        transaction_id: transactionId,
        product_id: item.productId,
        product_name: item.productName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      }))
    )
    if (itemsError) { setError(itemsError.message); setCheckoutLoading(false); return }

    setCart([])
    setCartOpen(false)
    setCheckoutSuccess(true)
    setTimeout(() => setCheckoutSuccess(false), 3000)
    setCheckoutLoading(false)
  }

  const filteredProducts = activeCategory === 'All' ? products : products.filter((p) => p.category === activeCategory)
  const availableCategories = ['All', ...PRODUCT_CATEGORIES.filter((c) => products.some((p) => p.category === c))] as (ProductCategory | 'All')[]
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  return (
    <div className="md:h-screen h-[calc(100vh-3.5rem)] flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="px-4 md:px-6 py-3 md:py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text)' }}>Point of Sale</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="px-4 md:px-6 py-2 md:py-3 flex gap-2 overflow-x-auto flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeCategory === cat ? 'var(--accent)' : 'var(--surface)',
                  color: activeCategory === cat ? '#fff' : 'var(--muted)',
                  border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)22', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            {checkoutSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium text-center" style={{ background: 'var(--success)22', color: 'var(--success)', border: '1px solid var(--success)44' }}>
                Order placed successfully!
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 md:h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--muted)' }}>
                {products.length === 0 ? 'No products yet. Add products first.' : 'No products in this category.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop cart sidebar */}
        <div className="hidden md:block w-72 flex-shrink-0 p-4" style={{ borderLeft: '1px solid var(--border)' }}>
          <OrderCart
            items={cart}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onCheckout={handleCheckout}
            loading={checkoutLoading}
            success={checkoutSuccess}
          />
        </div>
      </div>

      {/* Mobile sticky cart bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setCartOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm"
          style={{
            background: cartItemCount > 0 ? 'var(--accent)' : 'var(--surface-2)',
            color: cartItemCount > 0 ? '#fff' : 'var(--muted)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} />
            <span>{cartItemCount > 0 ? `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}` : 'Cart empty'}</span>
          </div>
          {cartItemCount > 0 && <span className="font-bold">{fmt.format(cartTotal)}</span>}
        </button>
      </div>

      {/* Mobile cart bottom sheet */}
      {cartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div
            className="rounded-t-2xl flex flex-col"
            style={{ background: 'var(--surface)', maxHeight: '85vh', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-bold text-base" style={{ color: 'var(--text)' }}>Current Order</span>
              <button onClick={() => setCartOpen(false)} style={{ color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <OrderCart
                items={cart}
                onUpdateQty={updateQty}
                onRemove={removeFromCart}
                onCheckout={handleCheckout}
                loading={checkoutLoading}
                success={checkoutSuccess}
                hideHeader
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
