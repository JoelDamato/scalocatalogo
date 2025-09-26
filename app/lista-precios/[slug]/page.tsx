'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { useConfiguracion } from '../../../src/hooks/useConfiguracion'
import Link from 'next/link'

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  precio: number | null
  costo: number | null
  foto_url: string | null
  publicado: boolean
  created_at: string
}

interface ListaPrecios {
  id: string
  nombre: string
  descripcion: string | null
  porcentaje_descuento: number
  activa: boolean
  url_personalizada: string
  created_at: string
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ListaPreciosPage({ params }: PageProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<{[key: string]: number}>({})
  const [lista, setLista] = useState<ListaPrecios | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [vistaLista, setVistaLista] = useState(false)
  const [mostrarPopupPedido, setMostrarPopupPedido] = useState(false)
  const [slug, setSlug] = useState<string>('')
  const { configuracion } = useConfiguracion()

  useEffect(() => {
    const initializeSlug = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    initializeSlug()
  }, [params])

  useEffect(() => {
    if (slug) {
      setIsVisible(true)
      cargarLista()
      cargarProductos()
    }
  }, [slug])

  useEffect(() => {
    filtrarProductos()
  }, [productos, busqueda, categoriaFiltro])

  const cargarLista = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .eq('url_personalizada', slug)
        .eq('activa', true)
        .single()

      if (error) {
        console.error('Error cargando lista:', error)
        return
      }

      setLista(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('publicado', true)
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      setProductos(data || [])
      
      // Extraer categorías únicas
      const categoriasUnicas = [...new Set((data || [])
        .map(p => p.categoria)
        .filter(Boolean))] as string[]
      setCategorias(categoriasUnicas)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarProductos = () => {
    let filtrados = productos.filter(producto => {
      const coincideBusqueda = busqueda === '' || 
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
      
      const coincideCategoria = categoriaFiltro === '' || producto.categoria === categoriaFiltro
      
      return coincideBusqueda && coincideCategoria
    })

    // Ordenar alfabéticamente
    filtrados = filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre))

    setProductosFiltrados(filtrados)
  }

  const calcularPrecioConDescuento = (precioOriginal: number): number => {
    if (!lista) return precioOriginal
    const descuento = (precioOriginal * lista.porcentaje_descuento) / 100
    return precioOriginal - descuento
  }

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      const nuevosSeleccionados = { ...productosSeleccionados }
      delete nuevosSeleccionados[productoId]
      setProductosSeleccionados(nuevosSeleccionados)
    } else {
      setProductosSeleccionados(prev => ({
        ...prev,
        [productoId]: cantidad
      }))
    }
  }

  const toggleProductoSeleccionado = (productoId: string) => {
    const cantidadActual = productosSeleccionados[productoId] || 0
    if (cantidadActual > 0) {
      actualizarCantidad(productoId, 0)
    } else {
      actualizarCantidad(productoId, 1)
    }
  }

  const calcularTotal = () => {
    let total = 0
    Object.keys(productosSeleccionados).forEach(productoId => {
      const producto = productos.find(p => p.id === productoId)
      const cantidad = productosSeleccionados[productoId]
      if (producto && producto.precio && lista) {
        const precioConDescuento = calcularPrecioConDescuento(producto.precio)
        total += precioConDescuento * cantidad
      }
    })
    return total
  }

  const obtenerProductosSeleccionados = () => {
    return productos.filter(p => 
      productosSeleccionados[p.id] && productosSeleccionados[p.id] > 0
    )
  }

  const generarMensajeWhatsApp = () => {
    const productosElegidos = productos.filter(p => 
      productosSeleccionados[p.id] && productosSeleccionados[p.id] > 0
    )
    
    if (productosElegidos.length === 0) return ''

    let mensaje = `🛒 *Pedido desde Lista: ${lista?.nombre}*\n\n`
    mensaje += `📋 *Productos seleccionados:*\n\n`
    
    let total = 0
    productosElegidos.forEach((producto, index) => {
      const cantidad = productosSeleccionados[producto.id]
      const precioOriginal = producto.precio || 0
      const precioConDescuento = calcularPrecioConDescuento(precioOriginal)
      const subtotal = precioConDescuento * cantidad
      total += subtotal
      
      mensaje += `${index + 1}. *${producto.nombre}*\n`
      mensaje += `   Cantidad: ${cantidad}\n`
      mensaje += `   Precio original: $${precioOriginal.toFixed(2)}\n`
      mensaje += `   Precio con descuento: $${precioConDescuento.toFixed(2)}\n`
      mensaje += `   Subtotal: $${subtotal.toFixed(2)}\n\n`
    })
    
    mensaje += `💰 *Total: $${total.toFixed(2)}*\n\n`
    mensaje += `🎯 *Descuento aplicado: ${lista?.porcentaje_descuento}%*\n\n`
    mensaje += `¡Hola! Me interesa realizar este pedido.`
    
    return mensaje
  }

  const enviarWhatsApp = async () => {
    const productosSeleccionadosArray = obtenerProductosSeleccionados()
    if (productosSeleccionadosArray.length === 0) {
      alert('Por favor selecciona al menos un producto')
      return
    }

    const total = calcularTotal()
    const mensaje = generarMensajeWhatsApp()

    // Guardar orden en la base de datos
    try {
      const { error } = await supabase
        .from('ordenes')
        .insert({
          cliente_nombre: 'Cliente Lista de Precios',
          cliente_telefono: 'N/A',
          productos: productosSeleccionadosArray.map(producto => ({
            id: producto.id,
            nombre: producto.nombre,
            cantidad: productosSeleccionados[producto.id],
            precio: calcularPrecioConDescuento(producto.precio || 0),
            subtotal: calcularPrecioConDescuento(producto.precio || 0) * productosSeleccionados[producto.id]
          })),
          total: total,
          mensaje_whatsapp: mensaje,
          estado: 'pendiente'
        })

      if (error) {
        console.error('Error guardando orden:', error)
        alert('Error al guardar la orden, pero se abrirá WhatsApp')
      } else {
        console.log('Orden guardada exitosamente')
      }
    } catch (error) {
      console.error('Error guardando orden:', error)
      alert('Error al guardar la orden, pero se abrirá WhatsApp')
    }

    const numeroWhatsApp = configuracion.numero_whatsapp.replace(/\D/g, '')
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    setMostrarPopupPedido(false)
  }

  const mostrarPedido = () => {
    const productosSeleccionadosArray = obtenerProductosSeleccionados()
    if (productosSeleccionadosArray.length === 0) {
      alert('Por favor selecciona al menos un producto')
      return
    }
    setMostrarPopupPedido(true)
  }

  const handleWhatsApp = () => {
    const numeroWhatsApp = configuracion.numero_whatsapp.replace(/\D/g, '')
    const mensaje = `¡Hola! Me interesa conocer más sobre los productos de la lista "${lista?.nombre}".`
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Cargando...
        </div>
      </div>
    )
  }

  if (!lista) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h1 style={{ color: '#666', margin: 0 }}>Lista no encontrada</h1>
        <p style={{ color: '#999', margin: 0 }}>Esta lista de precios no existe o no está disponible</p>
        <Link href="/" style={{
          color: '#8B5CF6',
          textDecoration: 'none',
          fontWeight: '600'
        }}>
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.02) 0%, transparent 50%)
        `,
        zIndex: 1
      }} />

      <main style={{
        position: 'relative',
        zIndex: 3,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '5rem 1rem 2rem 1rem',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            {lista.nombre}
          </h1>
          {lista.descripcion && (
            <p style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
              color: '#374151',
              maxWidth: '600px',
              margin: '0 auto 1rem auto',
              lineHeight: '1.6',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              {lista.descripcion}
            </p>
          )}
          <div style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '25px',
            display: 'inline-block',
            fontSize: '1.1rem',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            marginTop: '1rem'
          }}>
            🎯 ¡Disfruta de un {lista.porcentaje_descuento}% de descuento!
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out 0.2s'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            🔍 Filtros de Búsqueda
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Buscar productos
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(139, 92, 246, 0.05)',
                  color: '#000000',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Categoría
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(139, 92, 246, 0.05)',
                  color: '#000000',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }}
              >
                <option value="" style={{ color: '#333' }}>Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria} style={{ color: '#333' }}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Controles de Vista */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setVistaLista(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  background: vistaLista ? '#F9FAFB' : '#8B5CF6',
                  color: vistaLista ? '#333' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                📱 Grid
              </button>
              <button
                onClick={() => setVistaLista(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  background: vistaLista ? '#8B5CF6' : '#F9FAFB',
                  color: vistaLista ? '#FFFFFF' : '#333',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                📋 Lista
              </button>
            </div>
            
            <button
              onClick={mostrarPedido}
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)'
              }}
            >
              🛒 Hacer Pedido ({Object.keys(productosSeleccionados).length})
            </button>
          </div>
        </div>

        {/* Productos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: vistaLista ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out 0.4s'
        }}>
          {productosFiltrados.map((producto) => {
            const precioOriginal = producto.precio || 0
            const precioConDescuento = calcularPrecioConDescuento(precioOriginal)
            const ahorro = precioOriginal - precioConDescuento

            return (
              <div key={producto.id} style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
              }}
              onClick={() => toggleProductoSeleccionado(producto.id)}>
                {/* Indicador de selección */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: productosSeleccionados[producto.id] ? '#25D366' : 'transparent',
                  border: '2px solid #25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {productosSeleccionados[producto.id] ? '✓' : ''}
                </div>

                {producto.foto_url && (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    marginBottom: '1rem',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={producto.foto_url}
                      alt={producto.nombre}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
                
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#1F2937',
                  margin: '0 0 0.5rem 0'
                }}>
                  {producto.nombre}
                </h3>
                
                {producto.descripcion && (
                  <p style={{
                    color: '#6B7280',
                    fontSize: '0.9rem',
                    margin: '0 0 1rem 0',
                    lineHeight: '1.4'
                  }}>
                    {producto.descripcion}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {precioOriginal > 0 && (
                    <>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#8B5CF6'
                      }}>
                        ${precioConDescuento.toFixed(2)}
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        color: '#9CA3AF',
                        textDecoration: 'line-through'
                      }}>
                        ${precioOriginal.toFixed(2)}
                      </span>
                      <span style={{
                        background: '#10B981',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        Ahorras ${ahorro.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>

                {producto.categoria && (
                  <div style={{
                    background: '#F3F4F6',
                    color: '#6B7280',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    display: 'inline-block',
                    marginBottom: '1rem'
                  }}>
                    {producto.categoria}
                  </div>
                )}

                {/* Controles de cantidad */}
                {productosSeleccionados[producto.id] && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    padding: '0.5rem',
                    background: 'rgba(37, 211, 102, 0.1)',
                    borderRadius: '10px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const cantidadActual = productosSeleccionados[producto.id] || 0
                        if (cantidadActual > 0) {
                          actualizarCantidad(producto.id, cantidadActual - 1)
                        }
                      }}
                      style={{
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      -
                    </button>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#1F2937',
                      minWidth: '30px',
                      textAlign: 'center'
                    }}>
                      {productosSeleccionados[producto.id]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const cantidadActual = productosSeleccionados[producto.id] || 0
                        actualizarCantidad(producto.id, cantidadActual + 1)
                      }}
                      style={{
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {productosFiltrados.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            margin: '2rem 0'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              🔍
            </div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1F2937',
              margin: '0 0 1rem 0'
            }}>
              No se encontraron productos
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#6B7280',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.6'
            }}>
              Intenta ajustar los filtros de búsqueda o explorar otras categorías
            </p>
            <button
              onClick={() => {
                setBusqueda('')
                setCategoriaFiltro('')
              }}
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        )}

        {/* Footer con contacto */}
        <footer style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '3rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '3rem',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 0.6s'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: '700',
              color: '#1F2937',
              margin: '0 0 1rem 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              ¿Tienes preguntas sobre esta lista?
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#6B7280',
              margin: '0 0 2rem 0',
              lineHeight: '1.6'
            }}>
              Contáctanos directamente para más información sobre precios especiales
            </p>
            <button
              onClick={handleWhatsApp}
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.6)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)'
              }}
            >
              💬 Contactar por WhatsApp
            </button>
          </div>
        </footer>

        {/* Popup de Pedido */}
      {mostrarPopupPedido && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1F2937',
                margin: 0
              }}>
                🛒 Resumen del Pedido
              </h2>
              <button
                onClick={() => setMostrarPopupPedido(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                Lista: {lista?.nombre}
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#6B7280',
                marginBottom: '1rem'
              }}>
                Descuento aplicado: {lista?.porcentaje_descuento}%
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              {obtenerProductosSeleccionados().map((producto, index) => {
                const cantidad = productosSeleccionados[producto.id]
                const precioOriginal = producto.precio || 0
                const precioConDescuento = calcularPrecioConDescuento(precioOriginal)
                const subtotal = precioConDescuento * cantidad

                return (
                  <div key={producto.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#F9FAFB',
                    borderRadius: '10px',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {producto.nombre}
                      </p>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#6B7280',
                        margin: 0
                      }}>
                        Cantidad: {cantidad} | Precio: ${precioConDescuento.toFixed(2)}
                      </p>
                    </div>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#1F2937',
                      margin: 0
                    }}>
                      ${subtotal.toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>

            <div style={{
              borderTop: '2px solid #E5E7EB',
              paddingTop: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#1F2937'
                }}>
                  Total:
                </span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#8B5CF6'
                }}>
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => setMostrarPopupPedido(false)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#E5E7EB'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={enviarWhatsApp}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)'
                }}
              >
                📱 Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
