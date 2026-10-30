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
      className="rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 anim-slide-up"
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(79,70,229,0.08) 100%)'
          : 'var(--surface)',
        border: accent ? '1px solid rgba(99,102,241,0.35)' : '1px solid var(--border)',
        boxShadow: accent ? '0 0 32px rgba(99,102,241,0.12)' : 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        if (accent) {
          el.style.boxShadow = '0 0 48px rgba(99,102,241,0.22)'
          el.style.transform = 'translateY(-2px)'
        } else {
          el.style.borderColor = 'rgba(99,102,241,0.3)'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.borderColor = accent ? 'rgba(99,102,241,0.35)' : 'var(--border)'
        el.style.boxShadow = accent ? '0 0 32px rgba(99,102,241,0.12)' : 'none'
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {title}
        </span>
        {icon && (
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: accent ? 'rgba(99,102,241,0.25)' : 'var(--surface-2)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <div
          className="text-2xl font-bold tracking-tight"
          style={{ color: accent ? '#a5b4fc' : 'var(--text)' }}
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
