'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import OrderCart, { CartItem } from '@/components/OrderCart'

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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('gig_id', id)
      .order('name')
    if (error) setError(error.message)
    else setProducts(data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
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
      id: transactionId,
      gig_id: id,
      created_at: new Date().toISOString(),
    })
    if (txnError) { setError(txnError.message); setCheckoutLoading(false); return }

    const itemsToInsert = cart.map((item) => ({
      id: crypto.randomUUID(),
      transaction_id: transactionId,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert)
    if (itemsError) { setError(itemsError.message); setCheckoutLoading(false); return }

    setCart([])
    setCheckoutSuccess(true)
    setTimeout(() => setCheckoutSuccess(false), 3000)
    setCheckoutLoading(false)
  }

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory)

  const availableCategories = ['All', ...PRODUCT_CATEGORIES.filter((c) =>
    products.some((p) => p.category === c)
  )] as (ProductCategory | 'All')[]

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Point of Sale</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div
            className="px-6 py-3 flex gap-2 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
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
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--muted)' }}>
                {products.length === 0 ? 'No products yet. Add products first.' : 'No products in this category.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart sidebar */}
        <div
          className="w-72 flex-shrink-0 p-4"
          style={{ borderLeft: '1px solid var(--border)' }}
        >
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
    </div>
  )
}
