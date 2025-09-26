'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import AdminNavbar from '../../../src/components/AdminNavbar'
import { useAuth } from '../../../src/hooks/useAuth'

interface Orden {
  id: string
  cliente_nombre?: string
  cliente_telefono?: string
  productos: Array<{
    id: string
    nombre: string
    cantidad: number
    precio: number
    subtotal: number
  }>
  total: number
  estado: 'pendiente' | 'vendida' | 'cancelada'
  mensaje_whatsapp: string
  created_at: string
  updated_at: string
}

export default function AdminOrdenes() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  const [ordenEditando, setOrdenEditando] = useState<Orden | null>(null)
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando órdenes:', error)
        return
      }

      setOrdenes(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstadoOrden = async (ordenId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId)

      if (error) {
        console.error('Error actualizando orden:', error)
        alert('Error al actualizar el estado de la orden')
        return
      }

      // Actualizar el estado local
      setOrdenes(ordenes.map(orden => 
        orden.id === ordenId ? { ...orden, estado: nuevoEstado as any } : orden
      ))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el estado de la orden')
    }
  }

  const eliminarOrden = async (ordenId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('ordenes')
        .delete()
        .eq('id', ordenId)

      if (error) {
        console.error('Error eliminando orden:', error)
        alert('Error al eliminar la orden')
        return
      }

      // Actualizar el estado local
      setOrdenes(ordenes.filter(orden => orden.id !== ordenId))
      alert('Orden eliminada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la orden')
    }
  }

  const editarOrden = (orden: Orden) => {
    setOrdenEditando(orden)
    setMostrarFormularioEdicion(true)
  }

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ordenEditando) return

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const cliente_nombre = formData.get('cliente_nombre') as string
      const cliente_telefono = formData.get('cliente_telefono') as string

      const { error } = await supabase
        .from('ordenes')
        .update({ 
          cliente_nombre: cliente_nombre || undefined,
          cliente_telefono: cliente_telefono || undefined
        })
        .eq('id', ordenEditando.id)

      if (error) {
        console.error('Error actualizando orden:', error)
        alert('Error al actualizar la orden')
        return
      }

      // Actualizar el estado local
      setOrdenes(ordenes.map(orden => 
        orden.id === ordenEditando.id 
          ? { ...orden, cliente_nombre: cliente_nombre || undefined, cliente_telefono: cliente_telefono || undefined }
          : orden
      ))

      setMostrarFormularioEdicion(false)
      setOrdenEditando(null)
      alert('Orden actualizada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la orden')
    }
  }

  const generarPDF = (orden: Orden) => {
    const { jsPDF } = require('jspdf')
    const doc = new jsPDF()

    // Configuración del PDF
    doc.setFont('helvetica')
    
    // Título
    doc.setFontSize(20)
    doc.setTextColor(139, 92, 246)
    doc.text('M DESCARTABLES', 20, 30)
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Orden de Pedido', 20, 45)
    
    // Línea separadora
    doc.setDrawColor(139, 92, 246)
    doc.setLineWidth(0.5)
    doc.line(20, 50, 190, 50)
    
    // Información de la orden
    doc.setFontSize(12)
    doc.text(`ID de Orden: ${orden.id.substring(0, 8)}`, 20, 65)
    doc.text(`Fecha: ${new Date(orden.created_at).toLocaleDateString('es-ES')}`, 20, 75)
    doc.text(`Estado: ${orden.estado.toUpperCase()}`, 20, 85)
    
    if (orden.cliente_nombre) {
      doc.text(`Cliente: ${orden.cliente_nombre}`, 20, 95)
    }
    if (orden.cliente_telefono) {
      doc.text(`Teléfono: ${orden.cliente_telefono}`, 20, 105)
    }
    
    // Productos
    doc.setFontSize(14)
    doc.text('Productos:', 20, 125)
    
    let yPosition = 135
    orden.productos.forEach((producto, index) => {
      doc.setFontSize(10)
      doc.text(`${index + 1}. ${producto.nombre}`, 25, yPosition)
      doc.text(`   Cantidad: ${producto.cantidad}`, 30, yPosition + 5)
      doc.text(`   Precio unitario: $${producto.precio}`, 30, yPosition + 10)
      doc.text(`   Subtotal: $${producto.subtotal.toFixed(2)}`, 30, yPosition + 15)
      yPosition += 25
    })
    
    // Total
    doc.setFontSize(14)
    doc.setTextColor(139, 92, 246)
    doc.text(`TOTAL: $${orden.total.toFixed(2)}`, 20, yPosition + 10)
    
    // Pie de página
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Gracias por su pedido - M DESCARTABLES', 20, 280)
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 20, 285)
    
    // Descargar el PDF
    doc.save(`orden_${orden.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const descargarOrdenes = () => {
    const ordenesParaDescargar = ordenes.map((orden, index) => ({
      '#': index + 1,
      'ID': orden.id.substring(0, 8),
      'Fecha': new Date(orden.created_at).toLocaleDateString('es-ES'),
      'Cliente': orden.cliente_nombre || 'Sin nombre',
      'Teléfono': orden.cliente_telefono || 'Sin teléfono',
      'Productos': orden.productos.map(p => `${p.nombre} (x${p.cantidad})`).join(', '),
      'Total': `$${orden.total}`,
      'Estado': orden.estado
    }))

    // Convertir a CSV
    const headers = Object.keys(ordenesParaDescargar[0])
    const csvContent = [
      headers.join(','),
      ...ordenesParaDescargar.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n')

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ordenes_m_descartables_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const ordenesFiltradas = ordenes.filter(orden => 
    !filtroEstado || orden.estado === filtroEstado
  )

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: 'white',
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: 'white',
            marginBottom: '1rem'
          }}>
            Acceso no autorizado
          </div>
          <a href="/admin" style={{
            color: 'white',
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '8px'
          }}>
            Ir al login
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(139, 92, 246, 0.1)',
            borderTop: '4px solid #8B5CF6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{
            color: '#6B7280',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            Cargando órdenes...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      padding: '100px 1rem 2rem 1rem'
    }}>
      <AdminNavbar />
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            📋 Administración de Órdenes
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
            color: '#6B7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Gestiona todas las órdenes de productos descartables
          </p>
        </div>

        {/* Filtros y controles */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <label style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Filtrar por estado:
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas las órdenes</option>
                <option value="pendiente">Pendientes</option>
                <option value="vendida">Vendidas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>

            <button
              onClick={descargarOrdenes}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              📥 Descargar Órdenes
            </button>
          </div>
        </div>

        {/* Lista de órdenes */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {ordenesFiltradas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '20px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '1rem'
              }}>
                No hay órdenes
              </h3>
              <p style={{
                color: '#6B7280',
                fontSize: '1.1rem'
              }}>
                {filtroEstado ? `No hay órdenes con estado "${filtroEstado}"` : 'No hay órdenes registradas'}
              </p>
            </div>
          ) : (
            ordenesFiltradas.map((orden, index) => (
              <div
                key={orden.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#000000',
                      marginBottom: '0.5rem'
                    }}>
                      Orden #{orden.id.substring(0, 8)}
                    </h3>
                    <p style={{
                      color: '#6B7280',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      📅 {new Date(orden.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {orden.cliente_nombre && (
                      <p style={{
                        color: '#6B7280',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                      }}>
                        👤 {orden.cliente_nombre}
                      </p>
                    )}
                    {orden.cliente_telefono && (
                      <p style={{
                        color: '#6B7280',
                        fontSize: '0.9rem'
                      }}>
                        📞 {orden.cliente_telefono}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      color: '#000000'
                    }}>
                      ${orden.total}
                    </span>
                    
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => actualizarEstadoOrden(orden.id, 'pendiente')}
                        style={{
                          background: orden.estado === 'pendiente' ? '#FEF3C7' : 'transparent',
                          color: orden.estado === 'pendiente' ? '#92400E' : '#6B7280',
                          border: '1px solid #F59E0B',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ⏳ Pendiente
                      </button>
                      <button
                        onClick={() => actualizarEstadoOrden(orden.id, 'vendida')}
                        style={{
                          background: orden.estado === 'vendida' ? '#D1FAE5' : 'transparent',
                          color: orden.estado === 'vendida' ? '#065F46' : '#6B7280',
                          border: '1px solid #10B981',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ✅ Vendida
                      </button>
                      <button
                        onClick={() => actualizarEstadoOrden(orden.id, 'cancelada')}
                        style={{
                          background: orden.estado === 'cancelada' ? '#FEE2E2' : 'transparent',
                          color: orden.estado === 'cancelada' ? '#991B1B' : '#6B7280',
                          border: '1px solid #EF4444',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ❌ Cancelada
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => editarOrden(orden)}
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  
                  <button
                    onClick={() => generarPDF(orden)}
                    style={{
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    📄 PDF
                  </button>
                  
                  <button
                    onClick={() => eliminarOrden(orden.id)}
                    style={{
                      background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>

                {/* Productos */}
                <div style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#000000',
                    marginBottom: '0.75rem'
                  }}>
                    📦 Productos:
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {orden.productos.map((producto, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.1)'
                        }}
                      >
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          color: '#374151'
                        }}>
                          {producto.nombre} (x{producto.cantidad})
                        </span>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: '#000000'
                        }}>
                          ${producto.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mensaje de WhatsApp */}
                <details style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(139, 92, 246, 0.1)'
                }}>
                  <summary style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#000000',
                    cursor: 'pointer',
                    marginBottom: '0.5rem'
                  }}>
                    💬 Ver mensaje de WhatsApp
                  </summary>
                  <pre style={{
                    fontSize: '0.8rem',
                    color: '#6B7280',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    background: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    marginTop: '0.5rem'
                  }}>
                    {orden.mensaje_whatsapp}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Edición */}
      {mostrarFormularioEdicion && ordenEditando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '2.5rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              ✏️ Editar Orden
            </h3>
            
            <form onSubmit={guardarEdicion}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  name="cliente_nombre"
                  defaultValue={ordenEditando.cliente_nombre || ''}
                  placeholder="Nombre del cliente"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Teléfono del Cliente
                </label>
                <input
                  type="tel"
                  name="cliente_telefono"
                  defaultValue={ordenEditando.cliente_telefono || ''}
                  placeholder="Teléfono del cliente"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormularioEdicion(false)
                    setOrdenEditando(null)
                  }}
                  style={{
                    background: 'transparent',
                    color: '#6B7280',
                    border: '2px solid #E5E7EB',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.color = '#6B7280'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
