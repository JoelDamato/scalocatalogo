'use client'

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth_simple'

interface AdminAuthProps {
  onAuthSuccess: () => void
}

export default function AdminAuth({ onAuthSuccess }: AdminAuthProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Verificar contraseña usando el hook
    setTimeout(() => {
      if (login(password)) {
        onAuthSuccess()
      } else {
        setError('Contraseña incorrecta')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2.5rem',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '20px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <span style={{ 
              color: '#FFFFFF', 
              fontSize: '1.75rem', 
              fontWeight: '700' 
            }}>
              M
            </span>
          </div>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            M Descartables
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Panel de Administración
          </p>
        </div>

        {/* Formulario de autenticación */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem'
            }}>
              Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: '#FFFFFF',
                color: '#111827',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#111827'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB'
                e.currentTarget.style.boxShadow = 'none'
              }}
              required
            />
            {error && (
              <p style={{ 
                color: '#EF4444', 
                fontSize: '0.875rem', 
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9CA3AF' : '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.875rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#374151'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#111827'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        {/* Enlace de regreso */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a 
            href="/" 
            style={{ 
              color: '#6B7280', 
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            <span>←</span>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
