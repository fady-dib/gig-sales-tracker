'use client'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  accent?: boolean
}

export default function StatCard({ title, value, subtitle, icon, accent }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {title}
        </span>
        {icon && (
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: accent ? 'var(--accent)' : 'var(--surface-2)' }}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <div
          className="text-2xl font-bold"
          style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
