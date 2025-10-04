'use client'

import { useState, useEffect } from 'react'
import AdminNavbar from "../../../src/components/AdminNavbar"
import { useAuth } from "../../../src/hooks/useAuth"
import { toast } from 'react-toastify'
export default function AdminFeedback() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  })
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const webhookUrl = 'https://discord.com/api/webhooks/1421310768669921380/1OugUkFLEe9iYc8BkUUYIvwcHsLnKo9zGjW-Tg5f9JgryM1PGy2_dsuRhHnRYKICDgpC'
      
      const embed = {
        title: '💬 NUEVO FEEDBACK',
        color: 0x10B981, // Color verde
        fields: [
          {
            name: '👤 Nombre',
            value: formData.nombre || 'Anónimo',
            inline: true
          },
          {
            name: '📧 Email',
            value: formData.email || 'No proporcionado',
            inline: true
          },
          {
            name: '📅 Fecha',
            value: new Date().toLocaleString('es-ES'),
            inline: true
          },
          {
            name: '💭 Mensaje',
            value: formData.mensaje,
            inline: false
          }
        ],
        footer: {
          text: 'Sistema de Feedback - M Descartables'
        },
        timestamp: new Date().toISOString()
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      if (response.ok) {
        toast.success('¡Feedback enviado exitosamente! Gracias por tu comentario. Te contactaremos pronto por email.')
        setFormData({ nombre: '', email: '', mensaje: '' })
      } else {
        throw new Error('Error al enviar el feedback')
      }
    } catch (error) {
      console.error('Error enviando feedback:', error)
      toast.error('Error al enviar el feedback. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Verificando autenticación...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Acceso no autorizado
          </div>
          <a href="/admin" style={{
            color: '#FFFFFF',
            textDecoration: 'none',
            background: '#111827',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}>
            Ir al login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '100px 1rem 2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <AdminNavbar />
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Feedback
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#6B7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Comparte tus comentarios, sugerencias o reporta problemas. Te contactaremos por email con nuestra respuesta.
          </p>
        </div>

        {/* Formulario */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Tu Nombre (Opcional)
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Escribe tu nombre aquí..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                  fontWeight: '400',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#F3F4F6',
                  color: '#111827',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#111827'
                  e.target.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Tu Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu-email@ejemplo.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                  fontWeight: '400',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#F3F4F6',
                  color: '#111827',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#111827'
                  e.target.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                Te contactaremos a este email con nuestra respuesta
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Tu Mensaje *
              </label>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                placeholder="Escribe tu feedback, sugerencia o problema aquí..."
                rows={6}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem',
                  fontWeight: '400',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#F3F4F6',
                  color: '#111827',
                  resize: 'vertical',
                  minHeight: '120px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#111827'
                  e.target.style.boxShadow = '0 0 0 3px rgba(17, 24, 39, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                * Campo obligatorio
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => setFormData({ nombre: '', email: '', mensaje: '' })}
                style={{
                  background: 'transparent',
                  color: '#6B7280',
                  border: '2px solid #E5E7EB',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.color = '#374151'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.color = '#6B7280'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                🗑️ Limpiar
              </button>

              <button
                type="submit"
                disabled={loading || !formData.mensaje.trim() || !formData.email.trim()}
                style={{
                  background: loading 
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  opacity: loading || !formData.mensaje.trim() ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading && formData.mensaje.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && formData.mensaje.trim()) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    📤 Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginTop: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '0.75rem'
          }}>
            ℹ️ Información
          </h3>
          <p style={{
            color: '#6B7280',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            Tu feedback será enviado directamente a nuestro equipo de desarrollo. 
            Te responderemos lo antes posible. ¡Gracias por ayudarnos a mejorar!
          </p>u
        </div>
      </main>

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
