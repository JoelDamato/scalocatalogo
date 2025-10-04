'use client'

import { useState, useEffect } from 'react'
import AdminNavbar from '../../../src/components/AdminNavbar'
import { useAuth } from '../../../src/hooks/useAuth_simple'
import { supabase } from '../../../src/lib/supabase'
import { toast } from 'react-toastify'

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  notas: string
  created_at: string
  updated_at: string
}

interface CompraCliente {
  cliente_id: string | null
  cliente_nombre: string
  total_compras: number
  cantidad_ordenes: number
  ultima_compra: string
}

export default function ClientesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [comprasPorCliente, setComprasPorCliente] = useState<CompraCliente[]>([])
  
  // Función de confirmación con toast
  const confirmDelete = (message: string, onConfirm: () => void) => {
    const toastId = toast(
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => toast.dismiss(toastId)}
            style={{
              background: '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(toastId)
              onConfirm()
            }}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            Eliminar
          </button>
        </div>
      </div>,
      {
        position: 'top-center',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        style: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }
      }
    )
  }
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1)
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear())
  const [busqueda, setBusqueda] = useState('')
  
  // Formulario de cliente
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: ''
  })
  const [editandoCliente, setEditandoCliente] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      setIsVisible(true)
      cargarDatos()
    }
  }, [isAuthenticated, mesSeleccionado, añoSeleccionado])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([
        cargarClientes(),
        cargarComprasPorCliente()
      ])
    } finally {
      setLoading(false)
    }
  }

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error cargando clientes:', error)
        if (error.code === 'PGRST116') {
          console.log('Tabla clientes no existe aún')
          setClientes([])
          // Si no hay tabla, mostrar formulario automáticamente
          setMostrarFormulario(true)
        }
        return
      }

      setClientes(data || [])
      
      // Si no hay clientes, mostrar formulario automáticamente
      if (!data || data.length === 0) {
        setMostrarFormulario(true)
      }
    } catch (error) {
      console.error('Error:', error)
      setClientes([])
      setMostrarFormulario(true)
    }
  }

  const cargarComprasPorCliente = async () => {
    try {
      console.log('🛒 Cargando compras por cliente...')
      const fechaInicio = new Date(añoSeleccionado, mesSeleccionado - 1, 1).toISOString()
      const fechaFin = new Date(añoSeleccionado, mesSeleccionado, 0, 23, 59, 59).toISOString()
      
      console.log('📅 Fechas de filtro:', { fechaInicio, fechaFin, mesSeleccionado, añoSeleccionado })

      // Primero verificar si la tabla clientes existe
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id')
        .limit(1)

      if (clientesError) {
        console.log('❌ Tabla clientes no existe aún, saltando carga de compras')
        setComprasPorCliente([])
        return
      }

      // Obtener solo órdenes vendidas del mes
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          cliente_id,
          cliente_nombre,
          total,
          created_at,
          estado
        `)
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFin)
        .eq('estado', 'vendida')
        .or('cliente_id.not.is.null,cliente_nombre.not.is.null') // Órdenes con cliente_id O cliente_nombre

      console.log('📊 Órdenes encontradas:', data?.length || 0)
      console.log('📊 Datos de órdenes:', data)

      if (error) {
        console.error('❌ Error cargando compras:', error)
        setComprasPorCliente([])
        return
      }

      // Agrupar por cliente (incluyendo clientes anónimos)
      const comprasAgrupadas = (data || []).reduce((acc: { [key: string]: CompraCliente }, orden: any) => {
        // Usar cliente_id si existe, sino usar cliente_nombre como identificador
        const clienteKey = orden.cliente_id || `anonimo_${orden.cliente_nombre}`
        const clienteId = orden.cliente_id || null
        const clienteNombre = orden.cliente_nombre || 'Cliente sin nombre'
        
        if (!clienteNombre || clienteNombre === 'Cliente sin nombre') return acc // Saltar órdenes sin nombre de cliente
        
        if (!acc[clienteKey]) {
          acc[clienteKey] = {
            cliente_id: clienteId,
            cliente_nombre: clienteNombre,
            total_compras: 0,
            cantidad_ordenes: 0,
            ultima_compra: orden.created_at
          }
        }
        
        // Manejar diferentes tipos de total
        let total = 0
        if (typeof orden.total === 'number') {
          total = orden.total
        } else if (typeof orden.total === 'string') {
          total = parseFloat(orden.total) || 0
        }
        
        console.log(`💰 Cliente ${clienteNombre} (${clienteId ? 'Registrado' : 'Anónimo'}) - Total: ${orden.total}, Tipo: ${typeof orden.total}, Parseado: ${total}`)
        
        acc[clienteKey].total_compras += total
        acc[clienteKey].cantidad_ordenes += 1
        if (new Date(orden.created_at) > new Date(acc[clienteKey].ultima_compra)) {
          acc[clienteKey].ultima_compra = orden.created_at
        }
        return acc
      }, {})

      const comprasArray = Object.values(comprasAgrupadas)
      console.log('✅ Compras agrupadas:', comprasArray)
      setComprasPorCliente(comprasArray)
    } catch (error) {
      console.error('💥 Error:', error)
      setComprasPorCliente([])
    }
  }

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      toast.warn('El nombre es obligatorio')
      return
    }

    setGuardando(true)
    try {
      if (editandoCliente) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editandoCliente)

        if (error) throw error
      } else {
        // Crear nuevo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      await cargarClientes()
      setFormData({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
      setMostrarFormulario(false)
      setEditandoCliente(null)
    } catch (error) {
      console.error('Error guardando cliente:', error)
      toast.error('Error al guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  const editarCliente = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    })
    setEditandoCliente(cliente.id)
    setMostrarFormulario(true)
  }

  const eliminarCliente = async (id: string) => {
    confirmDelete(
      '¿Estás seguro de que quieres eliminar este cliente?',
      async () => {
        try {
          const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)

          if (error) throw error

          await cargarClientes()
          toast.success('Cliente eliminado correctamente')
        } catch (error) {
          console.error('Error eliminando cliente:', error)
          toast.error('Error al eliminar el cliente')
        }
      }
    )
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Cargando Clientes
          </h2>
          <p style={{
            color: '#6B7280',
            fontSize: '1rem',
            margin: 0
          }}>
            Obteniendo datos de clientes...
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#FFFFFF',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p>Necesitas iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      <AdminNavbar />
      
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              👥 Gestión de Clientes
            </h1>
            <p style={{
              color: '#6B7280',
              margin: '0.5rem 0 0 0'
            }}>
              Administra tus clientes y visualiza sus compras
            </p>
          </div>
          
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {mostrarFormulario ? '❌ Cancelar' : '➕ Nuevo Cliente'}
          </button>
        </div>

        {/* Filtros de mes y año */}
        <div style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            📊 Estadísticas de Compras
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mes
              </label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
              >
                {meses.map((mes, index) => (
                  <option key={index} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Año
              </label>
              <select
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(año => (
                  <option key={año} value={año}>
                    {año}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen de compras */}
          {comprasPorCliente.length > 0 && (
            <div style={{
              background: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Resumen del {meses[mesSeleccionado - 1]} {añoSeleccionado}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#6B7280'
              }}>
                <div>
                  <strong>Total Clientes:</strong> {comprasPorCliente.length}
                </div>
                <div>
                  <strong>Total Ventas:</strong> ${comprasPorCliente.reduce((sum, c) => sum + c.total_compras, 0).toFixed(2)}
                </div>
                <div>
                  <strong>Total Órdenes:</strong> {comprasPorCliente.reduce((sum, c) => sum + c.cantidad_ordenes, 0)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario de cliente */}
        {mostrarFormulario && (
          <div style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1.5rem'
            }}>
              {editandoCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h3>
            
            <form onSubmit={guardarCliente}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre completo"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@ejemplo.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="+54 9 11 1234-5678"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Dirección completa"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas adicionales sobre el cliente..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem',
                      resize: 'vertical',
                      minHeight: '80px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false)
                    setEditandoCliente(null)
                    setFormData({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
                  }}
                  style={{
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    background: guardando ? '#9CA3AF' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: guardando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : (editandoCliente ? 'Actualizar' : 'Crear Cliente')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Búsqueda */}
        <div style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <input
            type="text"
            placeholder="Buscar clientes por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Lista de clientes */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {clientesFiltrados.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6B7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                {busqueda ? 'No se encontraron clientes' : '¡Comienza agregando tu primer cliente!'}
              </h3>
              <p style={{ marginBottom: '1.5rem' }}>
                {busqueda ? 'Intenta con otros términos de búsqueda' : 'Los clientes te permitirán hacer un seguimiento de sus compras y generar estadísticas'}
              </p>
              {!busqueda && (
                <button
                  onClick={() => setMostrarFormulario(true)}
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  ➕ Crear Primer Cliente
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Cliente
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Contacto
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Compras del Mes
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Total Gastado
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => {
                    const comprasCliente = comprasPorCliente.find(c => c.cliente_id === cliente.id)
                    return (
                      <tr key={cliente.id} style={{
                        borderBottom: '1px solid #F3F4F6'
                      }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>
                              {cliente.nombre}
                            </div>
                            {cliente.direccion && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6B7280'
                              }}>
                                📍 {cliente.direccion}
                              </div>
                            )}
                            {cliente.notas && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6B7280',
                                marginTop: '0.25rem',
                                fontStyle: 'italic'
                              }}>
                                📝 {cliente.notas}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            {cliente.email && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6B7280',
                                marginBottom: '0.25rem'
                              }}>
                                📧 {cliente.email}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6B7280'
                              }}>
                                📞 {cliente.telefono}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {comprasCliente ? (
                            <div>
                              <div style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#10B981'
                              }}>
                                {comprasCliente.cantidad_ordenes} órdenes
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#6B7280'
                              }}>
                                ${comprasCliente.total_compras.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span style={{
                              color: '#9CA3AF',
                              fontSize: '0.875rem'
                            }}>
                              Sin compras
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {comprasCliente ? (
                            <div style={{
                              fontSize: '1.25rem',
                              fontWeight: '700',
                              color: '#059669'
                            }}>
                              ${comprasCliente.total_compras.toFixed(2)}
                            </div>
                          ) : (
                            <span style={{
                              color: '#9CA3AF',
                              fontSize: '0.875rem'
                            }}>
                              $0.00
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => editarCliente(cliente)}
                              style={{
                                background: '#3B82F6',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => eliminarCliente(cliente.id)}
                              style={{
                                background: '#EF4444',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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
