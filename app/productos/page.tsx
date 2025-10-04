'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import Link from 'next/link'
import { useConfiguracion } from '../../src/hooks/useConfiguracion'
import { toast } from 'react-toastify'

interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  precio: number | null
  foto_url: string | null
  publicado: boolean
  created_at: string
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<{[key: string]: number}>({})
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [mostrarPopupPedido, setMostrarPopupPedido] = useState(false)
  const [vistaLista, setVistaLista] = useState(false)
  const [carruselIndice, setCarruselIndice] = useState(0)
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo'>('transferencia')
  const [aplicarDescuento, setAplicarDescuento] = useState(true)
  const { configuracion } = useConfiguracion()

  useEffect(() => {
    setIsVisible(true)
    cargarProductos()
    cargarProductosDestacados()
  }, [])

  useEffect(() => {
    filtrarProductos()
  }, [productos, busqueda, categoriaFiltro])

  // Forzar vista de lista en móvil
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth <= 768) {
        setVistaLista(true)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Carrusel manual solamente (sin movimiento automático)
  // useEffect(() => {
  //   if (productosDestacados.length > 0) {
  //     const interval = setInterval(() => {
  //       setCarruselIndice(prev => (prev + 1) % productosDestacados.length)
  //     }, 8000) // Cambia cada 8 segundos
  //     
  //     return () => clearInterval(interval)
  //   }
  // }, [productosDestacados.length])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('publicado', true)
        .order('nombre', { ascending: true }) // Ordenar alfabéticamente

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      setProductos(data || [])
      
      const categoriasUnicas = Array.from(
        new Set((data || []).map(p => p.categoria).filter(Boolean))
      ) as string[]
      setCategorias(categoriasUnicas)
      
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const cargarProductosDestacados = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('publicado', true)
        .not('foto_url', 'is', null) // Solo productos con foto
        .limit(6) // Máximo 6 productos destacados
        .order('created_at', { ascending: false }) // Los más recientes

      if (error) {
        console.error('Error cargando productos destacados:', error)
        return
      }

      setProductosDestacados(data || [])
    } catch (error) {
      console.error('Error cargando productos destacados:', error)
    }
  }

  const filtrarProductos = () => {
    let filtrados = productos

    if (busqueda) {
      filtrados = filtrados.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
      )
    }

    if (categoriaFiltro) {
      filtrados = filtrados.filter(producto => producto.categoria === categoriaFiltro)
    }

    // Mantener orden alfabético
    filtrados = filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre))

    setProductosFiltrados(filtrados)
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
      registrarSeleccion(productoId)
    }
  }

  const registrarSeleccion = async (productoId: string) => {
    try {
      await supabase
        .from('producto_selecciones')
        .insert({
          producto_id: productoId,
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Error registrando selección:', error)
    }
  }

  const generarMensajeWhatsApp = () => {
    const productosElegidos = productos.filter(p => 
      productosSeleccionados[p.id] && productosSeleccionados[p.id] > 0
    )
    const total = calcularTotal()
    const descuento = calcularDescuento()
    const totalConDescuento = calcularTotalConDescuento()
    
    let mensaje = '¡Hola! Me interesan estos productos de M DESCARTABLES:\n\n'
    
    productosElegidos.forEach((producto, index) => {
      const cantidad = productosSeleccionados[producto.id]
      const subtotal = producto.precio ? producto.precio * cantidad : 0
      
      mensaje += `${index + 1}. ${producto.nombre}`
      mensaje += ` x${cantidad}`
      if (producto.precio) {
        mensaje += ` - $${producto.precio} c/u = $${subtotal.toFixed(2)}`
      }
      mensaje += '\n'
    })
    
    mensaje += `\n💰 SUBTOTAL: $${total.toFixed(2)}`
    
    if (metodoPago === 'efectivo' && descuento > 0) {
      mensaje += `\n💵 Descuento por pago en efectivo (${configuracion.descuento_efectivo}%): -$${descuento.toFixed(2)}`
      mensaje += `\n🎯 TOTAL A PAGAR: $${totalConDescuento.toFixed(2)}`
    } else {
      mensaje += `\n🎯 TOTAL A PAGAR: $${total.toFixed(2)}`
    }
    
    mensaje += `\n\n💳 Método de pago: ${metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}`
    mensaje += '\n\n¿Podrían confirmar disponibilidad?'
    
    return mensaje
  }

  const calcularTotal = () => {
    let total = 0
    Object.keys(productosSeleccionados).forEach(productoId => {
      const producto = productos.find(p => p.id === productoId)
      const cantidad = productosSeleccionados[productoId]
      if (producto && producto.precio) {
        total += producto.precio * cantidad
      }
    })
    return total
  }

  const calcularDescuento = () => {
    if (metodoPago === 'efectivo' && configuracion.descuento_efectivo_activo && configuracion.descuento_efectivo && aplicarDescuento) {
      return calcularTotal() * (configuracion.descuento_efectivo / 100)
    }
    return 0
  }

  const calcularTotalConDescuento = () => {
    return calcularTotal() - calcularDescuento()
  }

  const obtenerProductosSeleccionados = () => {
    return productos.filter(p => 
      productosSeleccionados[p.id] && productosSeleccionados[p.id] > 0
    )
  }

  const enviarWhatsApp = async () => {
    const productosSeleccionadosArray = obtenerProductosSeleccionados()
    if (productosSeleccionadosArray.length === 0) {
      toast.warn('Por favor selecciona al menos un producto')
      return
    }

    const total = calcularTotal()
    const mensaje = generarMensajeWhatsApp()

    // Guardar orden en la base de datos
    try {
      const descuento = calcularDescuento()
      const totalConDescuento = calcularTotalConDescuento()
      
      const ordenData = {
        productos: productosSeleccionadosArray.map(producto => ({
          id: producto.id,
          nombre: producto.nombre,
          cantidad: productosSeleccionados[producto.id],
          precio: producto.precio,
          subtotal: producto.precio ? producto.precio * productosSeleccionados[producto.id] : 0
        })),
        total: total,
        descuento_aplicado: descuento,
        total_con_descuento: totalConDescuento,
        metodo_pago: metodoPago,
        mensaje_whatsapp: mensaje,
        estado: 'pendiente'
      }

      const { error } = await supabase
        .from('ordenes')
        .insert([ordenData])

      if (error) {
        console.error('Error guardando orden:', error)
        toast.error('Error al guardar la orden, pero se abrirá WhatsApp')
      } else {
        console.log('Orden guardada exitosamente')
      }
    } catch (error) {
      console.error('Error guardando orden:', error)
      toast.error('Error al guardar la orden, pero se abrirá WhatsApp')
    }

    const numeroWhatsApp = configuracion.numero_whatsapp.replace(/\D/g, '') // Remover caracteres no numéricos
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    setMostrarPopupPedido(false)
  }

  const mostrarPedido = () => {
    const productosSeleccionadosArray = obtenerProductosSeleccionados()
    if (productosSeleccionadosArray.length === 0) {
      toast.warn('Por favor selecciona al menos un producto')
      return
    }
    setMostrarPopupPedido(true)
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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8B5CF6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Cargando productos...</p>
        </div>
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
        padding: '5rem 0.75rem 2rem 0.75rem',
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
            fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            lineHeight: '1.2',
            paddingTop: '0.5rem'
          }}>
            Nuestros Productos
          </h1>
        
        </div>

        {/* Carrusel de Productos Destacados */}
        {productosDestacados.length > 0 && (
          <div style={{
            marginBottom: '3rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 0.1s',
            width: '100%',
            maxWidth: '100%'
          }}>
           
            
            <div style={{
              position: 'relative',
              width: '80%',
              maxWidth: '1200px',
              margin: '0 auto',
              overflow: 'hidden',
              borderRadius: '15px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* Carrusel contenedor */}
              <div style={{
                display: 'flex',
                transform: `translateX(-${carruselIndice * 100}%)`,
                transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                width: `${productosDestacados.length * 100}%`
              }}>
                {productosDestacados.map((producto, index) => (
                  <div key={producto.id} style={{
                    width: '100%',
                    flexShrink: 0,
                    padding: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3rem',
                    minHeight: '400px'
                  }}>
                    {/* Imagen del producto */}
                    <div style={{
                      width: '280px',
                      height: '280px',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                      background: '#F8F9FA'
                    }}>
                      {producto.foto_url ? (
                        <img
                          src={producto.foto_url}
                          alt={producto.nombre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#F8F9FA'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(139, 92, 246, 0.05)',
                          color: '#9CA3AF',
                          fontSize: '3rem'
                        }}>
                          📦
                        </div>
                      )}
                    </div>
                    
                    {/* Información del producto */}
                    <div style={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      justifyContent: 'center',
                      paddingLeft: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '1.5rem',
                        lineHeight: '1.2'
                      }}>
                        {producto.nombre}
                      </h3>
                      
                      {producto.descripcion && (
                        <p style={{
                          fontSize: '1.3rem',
                          color: '#6B7280',
                          lineHeight: '1.6',
                          marginBottom: '1.5rem',
                          maxWidth: '600px'
                        }}>
                          {producto.descripcion}
                        </p>
                      )}
                      
                      {producto.categoria && (
                        <div style={{
                          display: 'inline-block',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#8B5CF6',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '30px',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginBottom: '2rem'
                        }}>
                          {producto.categoria}
                        </div>
                      )}
                      
                      {producto.precio && (
                        <div style={{
                          fontSize: '3.5rem',
                          fontWeight: '800',
                          color: '#10B981',
                          marginBottom: '0'
                        }}>
                          ${producto.precio.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Indicadores */}
              <div style={{
                position: 'absolute',
                bottom: '0.1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.3rem',
                zIndex: 2
              }}>
                {productosDestacados.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCarruselIndice(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      background: index === carruselIndice 
                        ? '#8B5CF6' 
                        : 'rgba(139, 92, 246, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: index === carruselIndice 
                        ? '0 0 0 2px rgba(139, 92, 246, 0.3)' 
                        : 'none'
                    }}
                  />
                ))}
              </div>
              
              {/* Botones de navegación */}
              <button
                onClick={() => setCarruselIndice(prev => 
                  prev === 0 ? productosDestacados.length - 1 : prev - 1
                )}
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#8B5CF6',
                  transition: 'all 0.3s ease',
                  zIndex: 2,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                }}
              >
                ←
              </button>
              
              <button
                onClick={() => setCarruselIndice(prev => 
                  (prev + 1) % productosDestacados.length
                )}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#8B5CF6',
                  transition: 'all 0.3s ease',
                  zIndex: 2,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                }}
              >
                →
              </button>
            </div>
          </div>
        )}

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
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
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(139, 92, 246, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                📋 Lista
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div style={{
          display: vistaLista ? 'block' : 'grid',
          gridTemplateColumns: vistaLista ? 'none' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: vistaLista ? '0.5rem' : '1rem',
          marginBottom: '2rem'
        }}>
          {productosFiltrados.map((producto, index) => (
            <div
              key={producto.id}
              style={{
                background: vistaLista ? 'rgba(255, 255, 255, 0.8)' : 'rgba(139, 92, 246, 0.05)',
                borderRadius: vistaLista ? '12px' : '20px',
                padding: vistaLista ? '1rem 1.5rem' : '0',
                backdropFilter: 'blur(10px)',
                border: vistaLista ? '1px solid rgba(139, 92, 246, 0.1)' : '1px solid rgba(139, 92, 246, 0.1)',
                overflow: vistaLista ? 'visible' : 'hidden',
                cursor: 'pointer',
                boxShadow: vistaLista ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 20px 40px rgba(0, 0, 0, 0.1)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 1s ease-out ${0.3 + index * 0.1}s`,
                display: vistaLista ? 'flex' : 'block',
                alignItems: vistaLista ? 'center' : 'stretch',
                justifyContent: vistaLista ? 'space-between' : 'flex-start',
                marginBottom: vistaLista ? '0.5rem' : '0',
                ...(productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0 && {
                  border: vistaLista ? '2px solid rgba(139, 92, 246, 0.3)' : '2px solid rgba(255, 255, 255, 0.5)',
                  background: vistaLista ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: vistaLista ? '0 4px 12px rgba(139, 92, 246, 0.2)' : '0 25px 50px rgba(0, 0, 0, 0.2)'
                })
              }}
              onMouseOver={(e) => {
                if (vistaLista) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                  e.currentTarget.style.transform = 'translateX(5px)'
                } else {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.2)'
                }
              }}
              onMouseOut={(e) => {
                if (vistaLista) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.transform = 'translateX(0)'
                } else {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }
              }}
              onClick={() => toggleProductoSeleccionado(producto.id)}
            >
              {vistaLista ? (
                // Vista de Lista
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flex: 1
                  }}>
                    {/* Imagen pequeña */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {producto.foto_url ? (
                        <img
                          src={producto.foto_url}
                          alt={producto.nombre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#F8F9FA'
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                            if (nextElement) nextElement.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div 
                        style={{
                          display: producto.foto_url ? 'none' : 'flex',
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(139, 92, 246, 0.05)',
                          color: '#9CA3AF',
                          fontSize: '1.5rem'
                        }}
                      >
                        📦
                      </div>
                    </div>
                    
                    {/* Información del producto */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: '0.25rem',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                      }}>
                        {producto.nombre}
                      </h3>
                      {producto.descripcion && (
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#6B7280',
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {producto.descripcion}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#8B5CF6',
                          background: 'rgba(139, 92, 246, 0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px'
                        }}>
                          {producto.categoria || 'Sin categoría'}
                        </span>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#000000'
                        }}>
                          {producto.precio ? `$${producto.precio}` : 'Consultar precio'}
                        </span>
                      </div>
                      
                      {/* Subtotal debajo del precio */}
                      {productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0 && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: 'rgba(139, 92, 246, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(139, 92, 246, 0.1)',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#6B7280'
                          }}>
                            Subtotal: ${producto.precio ? (producto.precio * productosSeleccionados[producto.id]).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Controles de cantidad */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actualizarCantidad(producto.id, (productosSeleccionados[producto.id] || 0) - 1)
                        }}
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: '#8B5CF6',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                        }}
                      >
                        -
                      </button>
                      <span style={{
                        minWidth: '40px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#000000'
                      }}>
                        {productosSeleccionados[producto.id] || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actualizarCantidad(producto.id, (productosSeleccionados[producto.id] || 0) + 1)
                        }}
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: '#8B5CF6',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Vista de Cuadrícula
                <>
                  {/* Imagen del producto */}
              <div style={{
                width: '100%',
                height: '200px',
                background: 'rgba(139, 92, 246, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {producto.foto_url ? (
                  <img
                    src={producto.foto_url}
                    alt={producto.nombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      background: '#F8F9FA'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                      if (nextElement) nextElement.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  style={{
                    display: producto.foto_url ? 'none' : 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(139, 92, 246, 0.05)',
                    color: '#9CA3AF',
                    fontSize: '3rem'
                  }}
                >
                  📦
                </div>
                
                {/* Badge de selección */}
                {productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                    borderRadius: '15px',
                    padding: '0.25rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                  }}>
                    <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {productosSeleccionados[producto.id]}x
                    </span>
                  </div>
                )}
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#000000',
                    margin: 0,
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    lineHeight: '1.3'
                  }}>
                    {producto.nombre}
                  </h3>
                  {producto.categoria && (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#000000',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '15px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {producto.categoria}
                    </span>
                  )}
                </div>
                
                {producto.descripcion && (
                  <p style={{
                    color: '#6B7280',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    marginBottom: '1rem'
                  }}>
                    {producto.descripcion}
                  </p>
                )}
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#000000',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                    }}>
                      {producto.precio ? `$${producto.precio}` : 'Consultar precio'}
                    </div>
                  </div>
                  
                  {/* Controles de cantidad */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
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
                          background: 'rgba(139, 92, 246, 0.05)',
                          color: '#000000',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                          e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        -
                      </button>
                      
                      <span style={{
                        color: '#000000',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        minWidth: '24px',
                        textAlign: 'center'
                      }}>
                        {productosSeleccionados[producto.id] || 0}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const cantidadActual = productosSeleccionados[producto.id] || 0
                          actualizarCantidad(producto.id, cantidadActual + 1)
                          registrarSeleccion(producto.id)
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                          color: '#000000',
                          border: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)'
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0) {
                          actualizarCantidad(producto.id, 0)
                        } else {
                          actualizarCantidad(producto.id, 1)
                          registrarSeleccion(producto.id)
                        }
                      }}
                      style={{
                        background: productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: '#000000',
                        border: productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.background = productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(255, 255, 255, 0.2)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {productosSeleccionados[producto.id] && productosSeleccionados[producto.id] > 0 ? '🗑️ Quitar' : '➕ Agregar'}
                    </button>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            padding: '3rem',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '0.5rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              No se encontraron productos
            </h3>
            <p style={{
              color: '#6B7280',
              marginBottom: '1rem'
            }}>
              Intenta ajustar los filtros de búsqueda o{' '}
              <button 
                onClick={() => {
                  setBusqueda('')
                  setCategoriaFiltro('')
                }}
                style={{
                  color: '#000000',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'inherit'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
              >
                limpiar filtros
              </button>
            </p>
          </div>
        )}

        {/* Hacer Pedido Button */}
        {Object.keys(productosSeleccionados).length > 0 && obtenerProductosSeleccionados().length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            left: '1rem',
            background: 'rgba(139, 92, 246, 0.05)',
            padding: '0.75rem 1rem',
            borderRadius: '25px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#000000',
              padding: '0.25rem 0.75rem',
              borderRadius: '15px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {Object.values(productosSeleccionados).reduce((sum, cantidad) => sum + cantidad, 0)} items
            </span>
            <button 
              onClick={mostrarPedido}
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#000000',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)'
              }}
            >
              🛒 Hacer Pedido
            </button>
          </div>
        )}

        {/* Back to Home */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out 0.8s'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(139, 92, 246, 0.05)',
              color: '#000000',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)'
            }}>
              ← Volver al Inicio
            </button>
          </Link>
        </div>
      </main>

      {/* Popup de Pedido */}
      {mostrarPopupPedido && (
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
            border: '1px solid rgba(139, 92, 246, 0.2)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: '#000000',
              marginBottom: '1.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              🛒 Resumen del Pedido
            </h3>
            
            <div style={{
              marginBottom: '1.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {obtenerProductosSeleccionados().map((producto, index) => {
                const cantidad = productosSeleccionados[producto.id]
                const subtotal = producto.precio ? producto.precio * cantidad : 0
                return (
                  <div key={producto.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    background: 'rgba(139, 92, 246, 0.05)',
                    borderRadius: '12px',
                    marginBottom: '0.75rem',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: '#000000',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}>
                        {producto.nombre}
                      </h4>
                      <p style={{
                        color: '#6B7280',
                        fontSize: '0.95rem',
                        fontWeight: '500'
                      }}>
                        Cantidad: {cantidad} x ${producto.precio || 0}
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        color: '#000000',
                        fontSize: '1.1rem',
                        fontWeight: '700'
                      }}>
                        ${subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Selección de método de pago */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB'
            }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                💳 Método de Pago
              </h4>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setMetodoPago('transferencia')}
                  style={{
                    background: metodoPago === 'transferencia' ? '#3B82F6' : '#FFFFFF',
                    color: metodoPago === 'transferencia' ? '#FFFFFF' : '#374151',
                    border: '2px solid #3B82F6',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🏦 Transferencia
                </button>
                
                <button
                  onClick={() => setMetodoPago('efectivo')}
                  style={{
                    background: metodoPago === 'efectivo' ? '#10B981' : '#FFFFFF',
                    color: metodoPago === 'efectivo' ? '#FFFFFF' : '#374151',
                    border: '2px solid #10B981',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  💵 Efectivo
                  {metodoPago === 'efectivo' && configuracion.descuento_efectivo_activo && configuracion.descuento_efectivo > 0 && aplicarDescuento && (
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      -{configuracion.descuento_efectivo}%
                    </span>
                  )}
                </button>
              </div>
              
              {metodoPago === 'efectivo' && configuracion.descuento_efectivo_activo && configuracion.descuento_efectivo > 0 && (
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    id="aplicarDescuento"
                    checked={aplicarDescuento}
                    onChange={(e) => setAplicarDescuento(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="aplicarDescuento"
                    style={{
                      fontSize: '0.9rem',
                      color: '#374151',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Aplicar descuento del {configuracion.descuento_efectivo}%
                  </label>
                </div>
              )}
            </div>

            <div style={{
              borderTop: '2px solid rgba(139, 92, 246, 0.2)',
              paddingTop: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  color: '#374151',
                  fontSize: '1.2rem',
                  fontWeight: '700'
                }}>
                  Subtotal:
                </span>
                <span style={{
                  color: '#6B7280',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>
              
              {metodoPago === 'efectivo' && calcularDescuento() > 0 && aplicarDescuento && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    color: '#10B981',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    Descuento por efectivo ({configuracion.descuento_efectivo}%):
                  </span>
                  <span style={{
                    color: '#10B981',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    -${calcularDescuento().toFixed(2)}
                  </span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid #E5E7EB'
              }}>
                <span style={{
                  color: '#111827',
                  fontSize: '1.4rem',
                  fontWeight: '800'
                }}>
                  Total a Pagar:
                </span>
                <span style={{
                  color: '#111827',
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  ${calcularTotalConDescuento().toFixed(2)}
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
                  background: 'transparent',
                  color: '#6B7280',
                  border: '2px solid #E5E7EB',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                ❌ Cerrar
              </button>
              <button
                onClick={enviarWhatsApp}
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)'
                }}
              >
                📱 Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}