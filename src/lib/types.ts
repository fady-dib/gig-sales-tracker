export interface Gig {
  id: string
  name: string
  venue: string
  date: string // ISO date string
  notes?: string
  created_at: string
}

export interface Product {
  id: string
  gig_id: string
  name: string
  category: 'Beer' | 'Cocktails' | 'Spirits' | 'Wine' | 'Soft Drinks' | 'Water' | 'Other'
  price: number
  created_at: string
}

export interface Transaction {
  id: string
  gig_id: string
  created_at: string
  items: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id?: string
  product_name: string
  unit_price: number
  quantity: number
}

export interface TicketType {
  id: string
  gig_id: string
  name: string
  price: number
  created_at: string
}

export interface TicketSale {
  id: string
  gig_id: string
  ticket_type: string
  price: number
  quantity: number
  notes?: string
  created_at: string
}

export type ProductCategory = Product['category']

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Beer',
  'Cocktails',
  'Spirits',
  'Wine',
  'Soft Drinks',
  'Water',
  'Other',
]
