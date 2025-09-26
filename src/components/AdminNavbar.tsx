'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNavbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Productos', icon: '📦' },
    { href: '/admin/ordenes', label: 'Órdenes', icon: '📋' },
    { href: '/admin/feedback', label: 'Feedback', icon: '💬' },
    { href: '/admin/listas-precios', label: 'Listas de Precios', icon: '💰' },
    { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' }
  ]

  return (
    <nav style={{
      background: 'rgba(139, 92, 246, 0.1)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
      padding: '1rem 0',
      marginBottom: '2rem',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: '80px',
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isActive 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : '#6B7280',
                border: isActive 
                  ? 'none' 
                  : '2px solid rgba(139, 92, 246, 0.2)',
                boxShadow: isActive 
                  ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                  : 'none'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
                  e.currentTarget.style.color = '#8B5CF6'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                  e.currentTarget.style.color = '#6B7280'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
