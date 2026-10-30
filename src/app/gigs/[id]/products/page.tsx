'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Product, PRODUCT_CATEGORIES } from '@/lib/types'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

interface ProductForm {
  name: string
  category: Product['category']
  price: string
  cost_price: string
}

const defaultForm: ProductForm = {
  name: '',
  category: 'Beer',
  price: '',
  cost_price: '',
}

export default function ProductsPage() {
  const supabase = createClient()
  const { id } = useParams() as { id: string }
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  function startEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() ?? '',
    })
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(defaultForm)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
    }

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId)
      if (error) setError(error.message)
      else { cancelEdit(); await fetchProducts() }
    } else {
      const { error } = await supabase.from('products').insert({
        id: crypto.randomUUID(),
        gig_id: id,
        created_at: new Date().toISOString(),
        ...payload,
      })
      if (error) setError(error.message)
      else { setForm(defaultForm); setShowForm(false); await fetchProducts() }
    }
    setSaving(false)
  }

  async function handleDelete(productId: string) {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) setError(error.message)
    else { setDeleteConfirm(null); await fetchProducts() }
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Manage your bar menu items</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultForm) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Add Form */}
      {showForm && !editingId && (
        <div
          className="rounded-xl p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>Add Product</h2>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Heineken"
                required
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Cost Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                placeholder="0.00"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div className="col-span-2 sm:col-span-4 flex gap-3 justify-end">
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
                {saving ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Category', 'Price', 'Cost', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold"
                  style={{ color: 'var(--muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-3">
                    <div className="h-5 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center" style={{ color: 'var(--muted)' }}>
                  No products yet. Add your first product.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                editingId === product.id ? (
                  <tr key={product.id} style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={5} className="px-5 py-3">
                      <form onSubmit={handleSave} className="flex gap-3 items-end flex-wrap">
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="px-3 py-1.5 rounded-lg text-sm outline-none w-40"
                          style={inputStyle}
                          placeholder="Name"
                        />
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={inputStyle}
                        >
                          {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          required
                          className="px-3 py-1.5 rounded-lg text-sm outline-none w-24"
                          style={inputStyle}
                          placeholder="Price"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.cost_price}
                          onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                          className="px-3 py-1.5 rounded-lg text-sm outline-none w-24"
                          style={inputStyle}
                          placeholder="Cost"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ color: 'var(--success)' }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                            style={{ color: 'var(--muted)' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={product.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>
                      {product.name}
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>
                      {product.category}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--accent)' }}>
                      {fmt.format(product.price)}
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>
                      {product.cost_price != null ? fmt.format(product.cost_price) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(product.id)}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-1.5 rounded transition-opacity hover:opacity-70"
                            style={{ color: 'var(--muted)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-1.5 rounded transition-opacity hover:opacity-70"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
