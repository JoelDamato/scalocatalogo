'use client'

import { useState, useEffect } from 'react'
import AdminNavbar from '../../../src/components/AdminNavbar'
import { useAuth } from '../../../src/hooks/useAuth_simple'

interface Ticket {
  id: string
  titulo: string
  descripcion: string
  email: string
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'
  created_at: string
  updated_at: string
}

export default function TicketsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [email, setEmail] = useState('')
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta' | 'critica'>('media')

  useEffect(() => {
    setIsVisible(true)
    cargarTickets()
  }, [])

  const cargarTickets = async () => {
    try {
      // Simulamos datos de tickets (en una implementación real conectarías con Supabase)
      const ticketsSimulados: Ticket[] = [
        {
          id: '1',
          titulo: 'Error en generación de PDF',
          descripcion: 'Los PDFs de facturas no se están generando correctamente para algunos productos con nombres largos.',
          email: 'cliente1@ejemplo.com',
          prioridad: 'alta',
          estado: 'abierto',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          titulo: 'Mejora en la interfaz de productos',
          descripcion: 'Sería útil poder ordenar los productos por categoría en la vista principal.',
          email: 'cliente2@ejemplo.com',
          prioridad: 'baja',
          estado: 'en_progreso',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      
      setTickets(ticketsSimulados)
      setLoading(false)
    } catch (error) {
      console.error('Error cargando tickets:', error)
      setLoading(false)
    }
  }

  const crearTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!titulo.trim() || !descripcion.trim() || !email.trim()) {
      toast.warn('Por favor completa todos los campos')
      return
    }

    try {
      // Enviar a Discord
      const webhookUrl = 'https://discord.com/api/webhooks/1421310768669921380/1OugUkFLEe9iYc8BkUUYIvwcHsLnKo9zGjW-Tg5f9JgryM1PGy2_dsuRhHnRYKICDgpC'
      
      const embed = {
        title: `🎫 NUEVO TICKET DE SOPORTE`,
        color: 0xFF6B35,
        fields: [
          {
            name: '📋 Título',
            value: titulo.trim(),
            inline: false
          },
          {
            name: '📝 Descripción',
            value: descripcion.trim(),
            inline: false
          },
          {
            name: '📧 Email de contacto',
            value: email.trim(),
            inline: true
          },
          {
            name: '⚡ Prioridad',
            value: prioridad.toUpperCase(),
            inline: true
          },
          {
            name: '📅 Fecha',
            value: new Date().toLocaleString('es-ES'),
            inline: true
          }
        ],
        footer: {
          text: 'Sistema de Tickets - M Descartables'
        },
        timestamp: new Date().toISOString()
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      const nuevoTicket: Ticket = {
        id: Date.now().toString(),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        email: email.trim(),
        prioridad,
        estado: 'abierto',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setTickets([nuevoTicket, ...tickets])
      
      // Limpiar formulario
      setTitulo('')
      setDescripcion('')
      setEmail('')
      setPrioridad('media')
      setMostrarFormulario(false)
      
      toast.success('Ticket de soporte enviado correctamente. Te contactaremos pronto.')
    } catch (error) {
      console.error('Error creando ticket:', error)
      toast.error('Error al enviar el ticket de soporte')
    }
  }

  const marcarComoResuelto = async (ticketId: string) => {
    try {
      // Eliminar el ticket de la lista
      setTickets(tickets.filter(ticket => ticket.id !== ticketId))
      toast.success('Ticket marcado como resuelto y eliminado de la lista')
    } catch (error) {
      console.error('Error marcando ticket como resuelto:', error)
      toast.error('Error al marcar el ticket como resuelto')
    }
  }


  if (authLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#F9FAFB',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          color: '#111827', 
          fontSize: '1.2rem',
          background: '#FFFFFF',
          padding: '1rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          Cargando...
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
          padding: '2rem',
          borderRadius: '12px',
          color: '#111827',
          fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          Acceso denegado - Inicia sesión primero
        </div>
      </div>
    )
  }

  const ticketsFiltrados = tickets.filter(ticket => {
    return !filtroPrioridad || ticket.prioridad === filtroPrioridad
  })

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return '#DC2626'
      case 'alta': return '#EA580C'
      case 'media': return '#F59E0B'
      case 'baja': return '#10B981'
      default: return '#6B7280'
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '100px 1rem 2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header y Controles */}
        <div style={{
          background: '#FFFFFF',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                color: '#111827',
                margin: 0,
                fontSize: '1.875rem',
                fontWeight: '700',
                letterSpacing: '-0.025em'
              }}>
                Tickets de Soporte
                {tickets.length > 0 && (
                  <span style={{
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    marginLeft: '0.75rem'
                  }}>
                    {tickets.length}
                  </span>
                )}
              </h1>
              <p style={{
                color: '#6B7280',
                fontSize: '1rem',
                margin: '0.5rem 0 0 0'
              }}>
                Los tickets marcados como resueltos se eliminan automáticamente
              </p>
            </div>

            <button
              onClick={() => setMostrarFormulario(true)}
              style={{
                background: '#111827',
                color: '#FFFFFF',
                border: '1px solid #111827',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#374151'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#111827'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              + Crear Nuevo Ticket
            </button>
          </div>

          {/* Filtro por prioridad */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '400',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                outline: 'none'
              }}
            >
              <option value="">Todas las prioridades</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        {/* Lista de Tickets */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.2s'
        }}>
          {ticketsFiltrados.map((ticket, index) => (
            <div key={ticket.id} style={{
              background: '#FFFFFF',
              padding: '1.5rem',
              borderRadius: '12px',
              transition: `all 0.3s ease, all 1s ease-out ${0.1 * index}s`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#111827', margin: '0 0 0.5rem 0', fontWeight: '600', fontSize: '1.125rem' }}>
                    {ticket.titulo}
                  </h3>
                  <p style={{ color: '#6B7280', margin: '0 0 1rem 0', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    {ticket.descripcion}
                  </p>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>
                    📅 Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES')} - {new Date(ticket.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                  <div style={{
                    background: getPrioridadColor(ticket.prioridad),
                    color: '#FFFFFF',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {ticket.prioridad}
                  </div>
                </div>
              </div>

              {/* Botón de resolución */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => marcarComoResuelto(ticket.id)}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: '1px solid #10B981',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#059669'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#10B981'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  ✅ Marcar como Resuelto
                </button>
              </div>
            </div>
          ))}

          {ticketsFiltrados.length === 0 && (
            <div style={{
              background: '#FFFFFF',
              padding: '4rem',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#6B7280',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
              <h3 style={{ color: '#111827', margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                No hay tickets que mostrar
              </h3>
              <p style={{ margin: 0, color: '#6B7280' }}>
                Crea tu primer ticket usando el botón "Crear Nuevo Ticket"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear nuevo ticket */}
      {mostrarFormulario && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#111827', margin: 0, fontWeight: '700', fontSize: '1.5rem' }}>
                Crear Nuevo Ticket
              </h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  color: '#6B7280',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearTicket}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Título del Ticket
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Describe brevemente el problema o solicitud"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Descripción Detallada
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Proporciona una descripción detallada del problema, pasos para reproducirlo, o detalles de la solicitud"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.5rem 0 0 0' }}>
                  Te contactaremos a este email con la respuesta a tu ticket
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Prioridad
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    outline: 'none'
                  }}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.875rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Crear Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

