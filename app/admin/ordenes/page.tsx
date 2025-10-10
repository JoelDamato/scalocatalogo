'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import AdminNavbar from '../../../src/components/AdminNavbar'
import { useAuth } from '../../../src/hooks/useAuth_simple'
import { toast } from 'react-toastify'

interface Orden {
  id: string
  cliente_id?: string
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
  descuento_aplicado?: number
  total_con_descuento?: number
  metodo_pago?: 'transferencia' | 'efectivo'
  estado: 'pendiente' | 'vendida' | 'cancelada'
  mensaje_whatsapp: string
  lista_precio_id?: string | null
  created_at: string
  updated_at: string
}

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

interface Producto {
  id: string
  nombre: string
  precio: number | null
  costo: number | null
  categoria: string | null
  publicado: boolean
}

interface ListaPrecios {
  id: string
  nombre: string
  porcentaje_ganancia: number
  activa: boolean
}

interface EstadisticasFacturacion {
  facturacionDia: number
  facturacionMes: number
  ordenesHoy: number
  ordenesMes: number
  ticketPromedioDia: number
  ticketPromedioMes: number
}

export default function AdminOrdenes() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [ordenesPorPagina] = useState(10)
  
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
  
  // Estados para crear nueva orden
  const [mostrarFormularioNuevaOrden, setMostrarFormularioNuevaOrden] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecios[]>([])
  const [listaSeleccionada, setListaSeleccionada] = useState<string>('precio_base')
  const [filtroListaPrecio, setFiltroListaPrecio] = useState<string>('todas')
  const [productosSeleccionados, setProductosSeleccionados] = useState<{[key: string]: number}>({})
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  
  // Estados para gestión de clientes
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: ''
  })
  const [modoCliente, setModoCliente] = useState<'seleccionar' | 'crear'>('seleccionar')
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState<EstadisticasFacturacion>({
    facturacionDia: 0,
    facturacionMes: 0,
    ordenesHoy: 0,
    ordenesMes: 0,
    ticketPromedioDia: 0,
    ticketPromedioMes: 0
  })

  // Estados para edición de facturas
  const [facturaEditando, setFacturaEditando] = useState<Orden | null>(null)
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false)
  const [productosEditando, setProductosEditando] = useState<{[key: string]: number}>({})

  useEffect(() => {
    setIsVisible(true)
    cargarDatos()
  }, [])

  // Resetear página cuando cambie el filtro
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado])

  // Recargar órdenes cuando cambie el filtro de lista de precios
  useEffect(() => {
    if (isVisible) {
      cargarOrdenes()
    }
  }, [filtroListaPrecio])

  const cargarDatos = async () => {
    await Promise.all([
      cargarOrdenes(),
      cargarProductos(),
      cargarListasPrecios(),
      cargarEstadisticas(),
      cargarClientes()
    ])
  }

  const cargarOrdenes = async () => {
    try {
      console.log('📋 Cargando todas las órdenes...')
      const { data, error } = await supabase
        .from('ordenes')
        .select('id, cliente_id, cliente_nombre, cliente_telefono, productos, total, descuento_aplicado, total_con_descuento, metodo_pago, estado, mensaje_whatsapp, lista_precio_id, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando órdenes:', error)
        return
      }

      console.log('📋 Todas las órdenes cargadas:', data)
      console.log('📋 Total de órdenes:', data?.length || 0)
      
      // Aplicar filtro por lista de precios
      let ordenesFiltradas = data || []
      if (filtroListaPrecio !== 'todas') {
        if (filtroListaPrecio === 'precio_base') {
          ordenesFiltradas = ordenesFiltradas.filter(orden => !orden.lista_precio_id)
        } else {
          ordenesFiltradas = ordenesFiltradas.filter(orden => orden.lista_precio_id === filtroListaPrecio)
        }
      }
      
      // Mostrar detalles de cada orden
      ordenesFiltradas?.forEach((orden, index) => {
        console.log(`📋 Orden ${index + 1}:`, {
          id: orden.id,
          cliente_nombre: orden.cliente_nombre,
          total: orden.total,
          tipo_total: typeof orden.total,
          estado: orden.estado,
          lista_precio_id: orden.lista_precio_id,
          created_at: orden.created_at
        })
      })

      setOrdenes(ordenesFiltradas)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, costo, categoria, publicado')
        .eq('publicado', true)
        .order('nombre')

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      setProductos(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarListasPrecios = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .eq('activa', true)
        .order('nombre')

      if (error) {
        console.error('Error cargando listas de precios:', error)
        return
      }

      setListasPrecios(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      console.log('🔍 Iniciando cargarEstadisticas...')
      
      const hoy = new Date()
      const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
      const inicioDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      
      console.log('📅 Fechas calculadas:', {
        hoy: hoy.toISOString(),
        inicioDelDia: inicioDelDia.toISOString(),
        inicioDelMes: inicioDelMes.toISOString()
      })

      // Obtener solo órdenes vendidas del día
      console.log('📊 Consultando órdenes vendidas del día...')
      const { data: ordenesHoy, error: errorHoy } = await supabase
        .from('ordenes')
        .select('id, total, total_con_descuento, metodo_pago, estado, created_at')
        .gte('created_at', inicioDelDia.toISOString())
        .eq('estado', 'vendida')

      // Obtener solo órdenes vendidas del mes
      console.log('📊 Consultando órdenes vendidas del mes...')
      const { data: ordenesMes, error: errorMes } = await supabase
        .from('ordenes')
        .select('id, total, total_con_descuento, metodo_pago, estado, created_at')
        .gte('created_at', inicioDelMes.toISOString())
        .eq('estado', 'vendida')

      // Contar órdenes vendidas del día
      const { count: countHoy, error: errorCountHoy } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioDelDia.toISOString())
        .eq('estado', 'vendida')

      // Contar órdenes vendidas del mes
      const { count: countMes, error: errorCountMes } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioDelMes.toISOString())
        .eq('estado', 'vendida')

      console.log('📋 Resultados de consultas:', {
        ordenesHoy: ordenesHoy?.length || 0,
        ordenesMes: ordenesMes?.length || 0,
        countHoy,
        countMes,
        errorHoy,
        errorMes,
        errorCountHoy,
        errorCountMes
      })

      if (!errorHoy && !errorMes && !errorCountHoy && !errorCountMes) {
        // Debug: mostrar datos obtenidos
        console.log('📊 Órdenes del día:', ordenesHoy)
        console.log('📊 Órdenes del mes:', ordenesMes)
        
        // Calcular facturación total según método de pago
        const facturacionDia = ordenesHoy?.reduce((sum, orden) => {
          let total = 0
          
          // Si es efectivo, usar total_con_descuento, sino usar total
          if (orden.metodo_pago === 'efectivo' && orden.total_con_descuento) {
            if (typeof orden.total_con_descuento === 'number') {
              total = orden.total_con_descuento
            } else if (typeof orden.total_con_descuento === 'string') {
              total = parseFloat(orden.total_con_descuento) || 0
            }
          } else {
            // Para transferencia o si no hay total_con_descuento, usar total
            if (typeof orden.total === 'number') {
              total = orden.total
            } else if (typeof orden.total === 'string') {
              total = parseFloat(orden.total) || 0
            } else if (orden.total && typeof orden.total === 'object' && orden.total.value) {
              total = parseFloat(orden.total.value) || 0
            }
          }
          
          console.log(`💰 Orden del día - ID: ${orden.id}, Método: ${orden.metodo_pago}, Total: ${orden.total}, Total con descuento: ${orden.total_con_descuento}, Usado: ${total}`)
          return sum + total
        }, 0) || 0
        
        const facturacionMes = ordenesMes?.reduce((sum, orden) => {
          let total = 0
          
          // Si es efectivo, usar total_con_descuento, sino usar total
          if (orden.metodo_pago === 'efectivo' && orden.total_con_descuento) {
            if (typeof orden.total_con_descuento === 'number') {
              total = orden.total_con_descuento
            } else if (typeof orden.total_con_descuento === 'string') {
              total = parseFloat(orden.total_con_descuento) || 0
            }
          } else {
            // Para transferencia o si no hay total_con_descuento, usar total
            if (typeof orden.total === 'number') {
              total = orden.total
            } else if (typeof orden.total === 'string') {
              total = parseFloat(orden.total) || 0
            } else if (orden.total && typeof orden.total === 'object' && orden.total.value) {
              total = parseFloat(orden.total.value) || 0
            }
          }
          
          console.log(`💰 Orden del mes - ID: ${orden.id}, Método: ${orden.metodo_pago}, Total: ${orden.total}, Total con descuento: ${orden.total_con_descuento}, Usado: ${total}`)
          return sum + total
        }, 0) || 0
        
        // Calcular ticket promedio (todas las órdenes)
        const ticketPromedioDia = (ordenesHoy && ordenesHoy.length > 0) ? facturacionDia / ordenesHoy.length : 0
        const ticketPromedioMes = (ordenesMes && ordenesMes.length > 0) ? facturacionMes / ordenesMes.length : 0

        const estadisticasCalculadas = {
          facturacionDia,
          facturacionMes,
          ordenesHoy: countHoy || 0,
          ordenesMes: countMes || 0,
          ticketPromedioDia,
          ticketPromedioMes
        }

        console.log('✅ Estadísticas calculadas:', estadisticasCalculadas)

        setEstadisticas(estadisticasCalculadas)
      } else {
        console.error('❌ Errores en cargarEstadisticas:', { errorHoy, errorMes, errorCountHoy, errorCountMes })
      }
    } catch (error) {
      console.error('💥 Error cargando estadísticas:', error)
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
        return
      }

      setClientes(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Funciones para gestión de clientes
  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.warn('El nombre del cliente es obligatorio')
      return
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoCliente.nombre.trim(),
          email: '',
          telefono: '',
          direccion: '',
          notas: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setClienteSeleccionado(data[0].id)
        setClienteNombre(data[0].nombre)
        setClienteTelefono('')
        setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
        setMostrarFormularioCliente(false)
        setModoCliente('seleccionar')
        await cargarClientes()
        toast.success('Cliente creado exitosamente')
      }
    } catch (error) {
      console.error('Error creando cliente:', error)
      toast.error('Error al crear el cliente')
    }
  }

  const seleccionarCliente = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (cliente) {
      setClienteSeleccionado(clienteId)
      setClienteNombre(cliente.nombre)
      setClienteTelefono(cliente.telefono)
    }
  }

  // Funciones para crear nueva orden
  const calcularPrecioProducto = (producto: Producto) => {
    if (listaSeleccionada === 'precio_base') {
      return producto.precio || 0
    }
    
    const lista = listasPrecios.find(l => l.id === listaSeleccionada)
    if (!lista || !producto.costo) {
      return producto.precio || 0
    }
    
    return producto.costo * (1 + lista.porcentaje_ganancia / 100)
  }

  const toggleProductoSeleccionado = (productoId: string) => {
    setProductosSeleccionados(prev => ({
      ...prev,
      [productoId]: prev[productoId] ? prev[productoId] + 1 : 1
    }))
  }

  const actualizarCantidadProducto = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      const nuevosProductos = { ...productosSeleccionados }
      delete nuevosProductos[productoId]
      setProductosSeleccionados(nuevosProductos)
    } else {
      setProductosSeleccionados(prev => ({
        ...prev,
        [productoId]: cantidad
      }))
    }
  }

  const calcularTotalOrden = () => {
    return Object.entries(productosSeleccionados).reduce((total, [productoId, cantidad]) => {
      const producto = productos.find(p => p.id === productoId)
      if (!producto) return total
      
      const precio = calcularPrecioProducto(producto)
      return total + (precio * cantidad)
    }, 0)
  }

  const crearNuevaOrden = async () => {
    if (!clienteNombre || Object.keys(productosSeleccionados).length === 0) {
      toast.warn('Por favor completa el nombre del cliente y selecciona al menos un producto')
      return
    }

    try {
      const productosOrden = Object.entries(productosSeleccionados).map(([productoId, cantidad]) => {
        const producto = productos.find(p => p.id === productoId)!
        const precio = calcularPrecioProducto(producto)
        return {
          id: producto.id,
          nombre: producto.nombre,
          cantidad,
          precio,
          subtotal: precio * cantidad
        }
      })

      const total = calcularTotalOrden()
      const nombreLista = listaSeleccionada === 'precio_base' ? 'Precio Base' : 
        listasPrecios.find(l => l.id === listaSeleccionada)?.nombre || 'Lista Personalizada'

      const mensajeWhatsApp = `*Nueva Orden - ${nombreLista}*\n\n` +
        `*Cliente:* ${clienteNombre}\n` +
        `*Teléfono:* ${clienteTelefono || 'No proporcionado'}\n\n` +
        `*Productos:*\n` +
        productosOrden.map(p => `• ${p.nombre} x${p.cantidad} - $${p.subtotal.toFixed(2)}`).join('\n') +
        `\n\n*Total: $${total.toFixed(2)}*`

      const { data, error } = await supabase
        .from('ordenes')
        .insert({
          cliente_id: clienteSeleccionado || undefined,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono || undefined,
          productos: productosOrden,
          total,
          estado: 'pendiente',
          mensaje_whatsapp: mensajeWhatsApp,
          lista_precio_id: listaSeleccionada === 'precio_base' ? null : listaSeleccionada
        })
        .select()

      if (error) {
        console.error('Error creando orden:', error)
        toast.error('Error al crear la orden')
        return
      }

      // Limpiar formulario
      setClienteNombre('')
      setClienteTelefono('')
      setClienteSeleccionado('')
      setModoCliente('seleccionar')
      setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
      setProductosSeleccionados({})
      setListaSeleccionada('precio_base')
      setMostrarFormularioNuevaOrden(false)

      // Recargar datos
      await cargarDatos()
      toast.success('Orden creada exitosamente')

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear la orden')
    }
  }

  const actualizarEstadoOrden = async (ordenId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId)

      if (error) {
        console.error('Error actualizando estado:', error)
        toast.error('Error al actualizar el estado')
        return
      }

      setOrdenes(ordenes.map(orden => 
        orden.id === ordenId 
          ? { ...orden, estado: nuevoEstado as any }
          : orden
      ))

      // Recargar estadísticas
      await cargarEstadisticas()
      toast.success('Estado actualizado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  // Función para eliminar factura
  const eliminarFactura = async (facturaId: string) => {
    confirmDelete(
      '¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.',
      async () => {
        try {
          const { error } = await supabase
            .from('ordenes')
            .delete()
            .eq('id', facturaId)

          if (error) throw error

          // Actualizar estado local
          setOrdenes(ordenes.filter(orden => orden.id !== facturaId))
          
          // Recargar estadísticas
          await cargarEstadisticas()
          
          toast.success('Factura eliminada correctamente')
        } catch (error) {
          console.error('Error eliminando factura:', error)
          toast.error('Error al eliminar la factura')
        }
      }
    )
  }

  const editarFactura = (factura: Orden) => {
    setFacturaEditando(factura)
    setClienteNombre(factura.cliente_nombre || '')
    setClienteTelefono(factura.cliente_telefono || '')
    setClienteSeleccionado(factura.cliente_id || '')
    setModoCliente('seleccionar')
    
    // Convertir productos de la factura a formato de edición
    const productosMap: {[key: string]: number} = {}
    factura.productos.forEach(producto => {
      productosMap[producto.id] = producto.cantidad
    })
    setProductosEditando(productosMap)
    setMostrarModalEdicion(true)
  }

  const guardarEdicionFactura = async () => {
    if (!facturaEditando) return

    try {
      // Calcular nuevos productos y total
      const productosActualizados = []
      let nuevoTotal = 0

      for (const [productoId, cantidad] of Object.entries(productosEditando)) {
        if (cantidad > 0) {
          const producto = productos.find(p => p.id === productoId)
          if (producto) {
            const precio = calcularPrecioProducto(producto)
            const subtotal = precio * cantidad
            productosActualizados.push({
              id: productoId,
              nombre: producto.nombre,
              cantidad: cantidad,
              precio: precio,
              subtotal: subtotal
            })
            nuevoTotal += subtotal
          }
        }
      }

      const facturaActualizada = {
        cliente_id: clienteSeleccionado || undefined,
        cliente_nombre: clienteNombre || undefined,
        cliente_telefono: clienteTelefono || undefined,
        productos: productosActualizados,
        total: nuevoTotal,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('ordenes')
        .update(facturaActualizada)
        .eq('id', facturaEditando.id)

      if (error) throw error

      // Actualizar estado local
      setOrdenes(ordenes.map(orden => 
        orden.id === facturaEditando.id 
          ? { ...orden, ...facturaActualizada }
          : orden
      ))

      toast.success('Factura actualizada correctamente')
      cerrarModalEdicion()
      await cargarEstadisticas() // Recargar estadísticas
    } catch (error) {
      console.error('Error actualizando factura:', error)
      toast.error('Error al actualizar la factura')
    }
  }

  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false)
    setFacturaEditando(null)
    setProductosEditando({})
    setClienteNombre('')
    setClienteTelefono('')
    setClienteSeleccionado('')
    setModoCliente('seleccionar')
    setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
  }

  const descargarFacturasCSV = () => {
    try {
      // Crear encabezados CSV
      const headers = ['ID Factura', 'Fecha', 'Cliente', 'Teléfono', 'Productos', 'Total', 'Método Pago', 'Descuento', 'Total Final', 'Estado']
      
      // Convertir facturas a filas CSV
      const filas = ordenes.map(orden => [
        `"${orden.id.slice(-8).toUpperCase()}"`,
        `"${new Date(orden.created_at).toLocaleDateString('es-ES')}"`,
        `"${(orden.cliente_nombre || 'Cliente Anónimo').replace(/"/g, '""')}"`,
        `"${(orden.cliente_telefono || '').replace(/"/g, '""')}"`,
        `"${orden.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ').replace(/"/g, '""')}"`,
        orden.total.toFixed(2),
        `"${orden.metodo_pago === 'efectivo' ? 'Efectivo' : orden.metodo_pago === 'transferencia' ? 'Transferencia' : 'N/A'}"`,
        orden.descuento_aplicado ? orden.descuento_aplicado.toFixed(2) : '0.00',
        orden.total_con_descuento ? orden.total_con_descuento.toFixed(2) : orden.total.toFixed(2),
        `"${orden.estado.toUpperCase()}"`
      ])

      // Crear contenido CSV
      const csvContent = [headers.join(','), ...filas.map(fila => fila.join(','))].join('\n')

    // Crear y descargar archivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
      link.setAttribute('download', `facturas-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
      
      toast.success('¡Facturas descargadas exitosamente!')
    } catch (error) {
      console.error('Error descargando CSV:', error)
      toast.error('Error al descargar las facturas')
    }
  }

  // Función para generar PDF de factura
  const generarPDFFactura = async (factura: Orden) => {
    try {
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF()

      // Configuración del documento
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.text('FACTURA', 105, 30, { align: 'center' })

      // Dibujar borde principal
      doc.setDrawColor(0, 0, 0) // Negro
      doc.setLineWidth(0.5)
      doc.rect(15, 15, 180, 260) // Borde exterior

      // Información de la empresa
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('M DESCARTABLES', 20, 50)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Fecha: ' + new Date(factura.created_at).toLocaleDateString('es-ES'), 20, 60)
      doc.text('Factura #: ' + factura.id.slice(-8).toUpperCase(), 20, 70)

      // Línea separadora
      doc.line(20, 80, 190, 80)

      // Información del cliente
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('CLIENTE:', 20, 95)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(factura.cliente_nombre || 'Cliente Anónimo', 20, 105)
      if (factura.cliente_telefono) {
        doc.text('Tel: ' + factura.cliente_telefono, 20, 115)
      }

      // Línea separadora
      doc.line(20, 125, 190, 125)

      // Tabla de productos
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('PRODUCTOS:', 20, 140)
      
      // Encabezados de la tabla
      const tableY = 150
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      
      // Dibujar encabezados de tabla
      doc.rect(20, tableY - 5, 120, 8) // Columna producto
      doc.rect(140, tableY - 5, 25, 8) // Columna cantidad
      doc.rect(165, tableY - 5, 25, 8) // Columna subtotal
      
      doc.text('PRODUCTO', 25, tableY)
      doc.text('CANT.', 145, tableY)
      doc.text('SUBTOTAL', 170, tableY)
      
      // Línea debajo de encabezados
      doc.line(20, tableY + 3, 190, tableY + 3)
      
      let yPosition = tableY + 10
      doc.setFont('helvetica', 'normal')
      
      factura.productos.forEach((producto, index) => {
        // Dibujar filas de la tabla
        doc.rect(20, yPosition - 5, 120, 8) // Columna producto
        doc.rect(140, yPosition - 5, 25, 8) // Columna cantidad
        doc.rect(165, yPosition - 5, 25, 8) // Columna subtotal
        
        // Texto de la fila
        doc.text(producto.nombre, 25, yPosition)
        doc.text(producto.cantidad.toString(), 145, yPosition)
        doc.text(`$${producto.subtotal.toFixed(2)}`, 170, yPosition)
        
        yPosition += 10
      })
      
      // Línea separadora antes del total
      doc.line(20, yPosition + 5, 190, yPosition + 5)
      
      // Total
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('TOTAL: $' + factura.total.toFixed(2), 150, yPosition + 15)

      // Información adicional
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Estado: ' + factura.estado.toUpperCase(), 20, yPosition + 25)
      
      if (factura.metodo_pago) {
        doc.text('Método de pago: ' + factura.metodo_pago.toUpperCase(), 20, yPosition + 35)
      }
      
      if (factura.descuento_aplicado && factura.descuento_aplicado > 0) {
        doc.text('Descuento aplicado: $' + factura.descuento_aplicado.toFixed(2), 20, yPosition + 45)
        doc.text('Total con descuento: $' + (factura.total_con_descuento || factura.total).toFixed(2), 20, yPosition + 55)
      }

      // Pie de página
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('Gracias por su compra', 105, 270, { align: 'center' })

      // Descargar
      doc.save(`factura-${factura.id.slice(-8)}.pdf`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  // Función para abrir WhatsApp con el cliente
  const abrirWhatsAppCliente = (factura: Orden) => {
    if (!factura.cliente_telefono) {
      toast.warn('Este cliente no tiene número de teléfono registrado')
      return
    }

    // Limpiar el número de teléfono (remover caracteres no numéricos)
    const numeroLimpio = factura.cliente_telefono.replace(/\D/g, '')
    
    // Abrir WhatsApp directamente con el número del cliente
    const whatsappUrl = `https://wa.me/${numeroLimpio}`
    window.open(whatsappUrl, '_blank')
  }

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
            Cargando Facturas
          </h2>
          <p style={{
            color: '#6B7280',
            fontSize: '1rem',
            margin: 0
          }}>
            Obteniendo datos de facturación...
          </p>
        </div>
        
        {/* CSS para la animación de carga */}
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
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          border: '2px solid #000000',
          padding: '2rem',
          background: '#FFFFFF',
          color: '#000000',
          fontSize: '1.2rem'
        }}>
          Acceso denegado - Inicia sesión primero
        </div>
      </div>
    )
  }

  // Filtrar órdenes
  const ordenesFiltradas = filtroEstado 
    ? ordenes.filter(orden => orden.estado === filtroEstado)
    : ordenes
  
  // Calcular paginación
  const totalPaginas = Math.ceil(ordenesFiltradas.length / ordenesPorPagina)
  const indiceInicio = (paginaActual - 1) * ordenesPorPagina
  const indiceFin = indiceInicio + ordenesPorPagina
  const ordenesPaginadas = ordenesFiltradas.slice(indiceInicio, indiceFin)
  
  // Función para cambiar página
  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
  }
  
  // Función para ir a la primera página
  const irPrimeraPagina = () => {
    setPaginaActual(1)
  }
  
  // Función para ir a la última página
  const irUltimaPagina = () => {
    setPaginaActual(totalPaginas)
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
        {/* Estadísticas de Facturación */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ color: '#6B7280', margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Facturación Hoy
            </h3>
            <p style={{ color: '#111827', fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>
              ${estadisticas.facturacionDia.toFixed(2)}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              {estadisticas.ordenesHoy} órdenes
          </p>
        </div>

    <div style={{
      background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '16px',
          textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ color: '#6B7280', margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Facturación Este Mes
            </h3>
            <p style={{ color: '#111827', fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>
              ${estadisticas.facturacionMes.toFixed(2)}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              {estadisticas.ordenesMes} órdenes
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ color: '#6B7280', margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ticket Promedio Hoy
            </h3>
            <p style={{ color: '#111827', fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>
              ${estadisticas.ticketPromedioDia.toFixed(2)}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              por orden
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ color: '#6B7280', margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ticket Promedio Mes
            </h3>
            <p style={{ color: '#111827', fontSize: '2.25rem', fontWeight: '700', margin: 0 }}>
              ${estadisticas.ticketPromedioMes.toFixed(2)}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              por orden
            </p>
          </div>
        </div>

        {/* Header y Controles */}
        <div style={{
          background: '#FFFFFF',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.2s',
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
                Gestión de Ventas
              </h1>
              <p style={{
                color: '#6B7280',
                margin: '0.5rem 0 0 0',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {ordenesFiltradas.length} {ordenesFiltradas.length === 1 ? 'orden' : 'órdenes'} 
                {totalPaginas > 1 && ` • Página ${paginaActual} de ${totalPaginas}`}
              </p>
            </div>

            <button
              onClick={() => setMostrarFormularioNuevaOrden(true)}
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
              + Crear Nueva Factura
            </button>

            <button
              onClick={descargarFacturasCSV}
              disabled={ordenes.length === 0}
              style={{
                background: ordenes.length === 0 ? '#9CA3AF' : '#3B82F6',
                color: '#FFFFFF',
                border: `1px solid ${ordenes.length === 0 ? '#9CA3AF' : '#3B82F6'}`,
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: ordenes.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (ordenes.length > 0) {
                  e.currentTarget.style.background = '#2563EB'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseOut={(e) => {
                if (ordenes.length > 0) {
                  e.currentTarget.style.background = '#3B82F6'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              📥 Descargar CSV
            </button>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
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
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="vendida">Pagada</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <select
              value={filtroListaPrecio}
              onChange={(e) => setFiltroListaPrecio(e.target.value)}
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
              <option value="todas">Todas las listas</option>
              <option value="precio_base">Precio Base</option>
              {listasPrecios.map(lista => (
                <option key={lista.id} value={lista.id}>
                  {lista.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Facturas */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.4s'
        }}>
          {ordenesPaginadas.map((orden, index) => (
            <div key={orden.id} style={{
                  background: '#FFFFFF',
                  padding: '1.5rem',
              borderRadius: '12px',
              transition: `all 0.3s ease, all 1s ease-out ${0.1 * index}s`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                  <h3 style={{ color: '#111827', margin: '0 0 0.5rem 0', fontWeight: '600', fontSize: '1.125rem' }}>
                    {orden.cliente_nombre || 'Cliente Anónimo'}
                    </h3>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>
                    {orden.cliente_telefono && `📱 ${orden.cliente_telefono}`}
                  </p>
                  <p style={{ color: '#6B7280', margin: '0.5rem 0', fontSize: '0.875rem' }}>
                    📅 {new Date(orden.created_at).toLocaleDateString('es-ES')} - {new Date(orden.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {orden.metodo_pago && (
                    <p style={{ color: '#6B7280', margin: '0.5rem 0', fontSize: '0.875rem' }}>
                      💳 {orden.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                      {orden.metodo_pago === 'efectivo' && orden.descuento_aplicado && orden.descuento_aplicado > 0 && (
                        <span style={{ color: '#10B981', fontWeight: '600' }}>
                          {' '}(-${orden.descuento_aplicado.toFixed(2)})
                        </span>
                      )}
                    </p>
                  )}
                  </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    background: orden.estado === 'vendida' ? '#10B981' : 
                               orden.estado === 'cancelada' ? '#EF4444' : '#F59E0B',
                    color: '#FFFFFF',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    textTransform: 'capitalize'
                  }}>
                    {orden.estado}
                  </div>
                  <p style={{ color: '#111827', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                    ${orden.total_con_descuento ? orden.total_con_descuento.toFixed(2) : orden.total.toFixed(2)}
                  </p>
                  {orden.total_con_descuento && orden.total_con_descuento !== orden.total && (
                    <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: '0.25rem 0 0 0', textDecoration: 'line-through' }}>
                      ${orden.total.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#374151', margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Productos
                </h4>
                <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  {orden.productos.map((producto, idx) => (
                    <div key={idx} style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      marginBottom: idx === orden.productos.length - 1 ? 0 : '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{producto.nombre} <span style={{ color: '#6B7280' }}>x{producto.cantidad}</span></span>
                      <span style={{ fontWeight: '600' }}>${producto.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  </div>
                </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {orden.estado !== 'vendida' && (
                      <button
                    onClick={() => actualizarEstadoOrden(orden.id, 'vendida')}
                        style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: '1px solid #10B981',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '140px'
                        }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#059669'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#10B981'
                    }}
                  >
                    ✓ Pagada
                      </button>
                )}
                {orden.estado !== 'cancelada' && (
                      <button
                    onClick={() => actualizarEstadoOrden(orden.id, 'cancelada')}
                        style={{
                      background: '#FFFFFF',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '140px'
                        }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#EF4444'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.color = '#EF4444'
                    }}
                  >
                    ✕ Cancelada
                      </button>
                )}
                {orden.estado !== 'pendiente' && (
                      <button
                    onClick={() => actualizarEstadoOrden(orden.id, 'pendiente')}
                        style={{
                      background: '#FFFFFF',
                      color: '#F59E0B',
                      border: '1px solid #F59E0B',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '140px'
                        }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#F59E0B'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.color = '#F59E0B'
                    }}
                  >
                    ↻ Pendiente
                      </button>
                )}

                {/* Botones adicionales: Editar, Eliminar, PDF, WhatsApp */}
                <div style={{
                  borderTop: '1px solid #E5E7EB', 
                  marginTop: '1rem', 
                  paddingTop: '1rem',
                  display: 'flex',
                  gap: '0.75rem', 
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => editarFactura(orden)}
                    style={{
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      border: '1px solid #F59E0B',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '140px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#D97706'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#F59E0B'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  
                  <button
                    onClick={() => generarPDFFactura(orden)}
                    style={{
                      background: '#6366F1',
                      color: '#FFFFFF',
                      border: '1px solid #6366F1',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '140px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#4F46E5'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#6366F1'
                    }}
                  >
                    📄 Descargar PDF
                  </button>
                  
                  {orden.cliente_telefono && (
                    <button
                      onClick={() => abrirWhatsAppCliente(orden)}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: '1px solid #10B981',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '140px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#059669'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#10B981'
                      }}
                    >
                      📱 WhatsApp
                    </button>
                  )}
                  
                  <button
                    onClick={() => eliminarFactura(orden.id)}
                        style={{
                          background: '#FFFFFF',
                      color: '#DC2626',
                      border: '1px solid #DC2626',
                      padding: '0.5rem 1rem',
                          borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '140px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#DC2626'
                      e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.color = '#DC2626'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
                  </div>
                </div>
                    ))}

          {ordenesFiltradas.length === 0 && (
                <div style={{
                    background: '#FFFFFF',
              padding: '4rem',
              borderRadius: '16px',
              textAlign: 'center',
              color: '#6B7280',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: '#111827', margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                No hay facturas que mostrar
              </h3>
              <p style={{ margin: 0, color: '#6B7280' }}>
                Crea tu primera factura usando el botón "Crear Nueva Factura"
              </p>
              </div>
          )}

          {/* Controles de paginación */}
          {totalPaginas > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              padding: '1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              {/* Botón Primera Página */}
              <button
                onClick={irPrimeraPagina}
                disabled={paginaActual === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: paginaActual === 1 ? '#F9FAFB' : '#FFFFFF',
                  color: paginaActual === 1 ? '#9CA3AF' : '#374151',
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (paginaActual !== 1) {
                    e.currentTarget.style.background = '#F3F4F6'
                  }
                }}
                onMouseOut={(e) => {
                  if (paginaActual !== 1) {
                    e.currentTarget.style.background = '#FFFFFF'
                  }
                }}
              >
                ⏮️ Primera
              </button>

              {/* Botón Página Anterior */}
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: paginaActual === 1 ? '#F9FAFB' : '#FFFFFF',
                  color: paginaActual === 1 ? '#9CA3AF' : '#374151',
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (paginaActual !== 1) {
                    e.currentTarget.style.background = '#F3F4F6'
                  }
                }}
                onMouseOut={(e) => {
                  if (paginaActual !== 1) {
                    e.currentTarget.style.background = '#FFFFFF'
                  }
                }}
              >
                ⏪ Anterior
              </button>

              {/* Información de página */}
              <div style={{
                padding: '0.5rem 1rem',
                background: '#F3F4F6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                Página {paginaActual} de {totalPaginas}
              </div>

              {/* Botón Página Siguiente */}
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: paginaActual === totalPaginas ? '#F9FAFB' : '#FFFFFF',
                  color: paginaActual === totalPaginas ? '#9CA3AF' : '#374151',
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (paginaActual !== totalPaginas) {
                    e.currentTarget.style.background = '#F3F4F6'
                  }
                }}
                onMouseOut={(e) => {
                  if (paginaActual !== totalPaginas) {
                    e.currentTarget.style.background = '#FFFFFF'
                  }
                }}
              >
                Siguiente ⏩
              </button>

              {/* Botón Última Página */}
              <button
                onClick={irUltimaPagina}
                disabled={paginaActual === totalPaginas}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: paginaActual === totalPaginas ? '#F9FAFB' : '#FFFFFF',
                  color: paginaActual === totalPaginas ? '#9CA3AF' : '#374151',
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (paginaActual !== totalPaginas) {
                    e.currentTarget.style.background = '#F3F4F6'
                  }
                }}
                onMouseOut={(e) => {
                  if (paginaActual !== totalPaginas) {
                    e.currentTarget.style.background = '#FFFFFF'
                  }
                }}
              >
                Última ⏭️
              </button>
            </div>
          )}
        </div>
                </div>

      {/* Modal para crear nueva orden */}
      {mostrarFormularioNuevaOrden && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#111827', margin: 0, fontWeight: '700', fontSize: '1.5rem' }}>
                Crear Nueva Factura
              </h2>
              <button
                onClick={() => {
                  setMostrarFormularioNuevaOrden(false)
                  setClienteNombre('')
                  setClienteTelefono('')
                  setClienteSeleccionado('')
                  setModoCliente('seleccionar')
                  setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
                  setProductosSeleccionados({})
                  setListaSeleccionada('precio_base')
                }}
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
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#E5E7EB'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Selección de cliente */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: '#111827', 
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>👤 Cliente</h3>
              
              {/* Tabs para seleccionar modo */}
              <div style={{
                display: 'flex',
                marginBottom: '1rem',
                background: '#F3F4F6',
                borderRadius: '8px',
                padding: '4px'
              }}>
                <button
                  onClick={() => setModoCliente('seleccionar')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: modoCliente === 'seleccionar' ? '#FFFFFF' : 'transparent',
                    color: modoCliente === 'seleccionar' ? '#111827' : '#6B7280',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: modoCliente === 'seleccionar' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  📋 Seleccionar Existente
                </button>
                <button
                  onClick={() => setModoCliente('crear')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: modoCliente === 'crear' ? '#FFFFFF' : 'transparent',
                    color: modoCliente === 'crear' ? '#111827' : '#6B7280',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: modoCliente === 'crear' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  ➕ Crear Rápido
                </button>
              </div>
              
              {/* Modo seleccionar cliente existente */}
              {modoCliente === 'seleccionar' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Seleccionar cliente
                  </label>
                  <select
                    value={clienteSeleccionado}
                    onChange={(e) => {
                      if (e.target.value) {
                        seleccionarCliente(e.target.value)
                      } else {
                        setClienteSeleccionado('')
                        setClienteNombre('')
                        setClienteTelefono('')
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#F3F4F6',
                      color: '#111827',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.telefono ? `(${cliente.telefono})` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {/* Mostrar datos del cliente seleccionado */}
                  {clienteSeleccionado && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#EBF8FF',
                      borderRadius: '8px',
                      border: '1px solid #BEE3F8'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1E40AF',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Cliente Seleccionado
                      </h4>
                      <p style={{
                        margin: '0 0 0.25rem 0',
                        color: '#1E40AF',
                        fontSize: '0.875rem'
                      }}>
                        <strong>Nombre:</strong> {clienteNombre}
                      </p>
                      {clienteTelefono && (
                        <p style={{
                          margin: '0',
                          color: '#1E40AF',
                          fontSize: '0.875rem'
                        }}>
                          <strong>Teléfono:</strong> {clienteTelefono}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Modo crear cliente rápido */}
              {modoCliente === 'crear' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingresa solo el nombre del cliente"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#F3F4F6',
                      color: '#111827',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '1rem'
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => {
                        setModoCliente('seleccionar')
                        setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
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
                      onClick={crearNuevoCliente}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Crear y Seleccionar
                    </button>
                  </div>
                </div>
              )}
            </div>
              
            {/* Selección de lista de precios */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: '#111827', 
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>💰 Lista de Precios</h3>
              <select
                value={listaSeleccionada}
                onChange={(e) => setListaSeleccionada(e.target.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  fontSize: '1rem',
                  width: '100%',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6'
                  e.target.style.background = '#FFFFFF'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB'
                  e.target.style.background = '#F3F4F6'
                }}
              >
                <option value="precio_base" style={{ background: '#FFFFFF', color: '#111827' }}>Precio Base</option>
                {listasPrecios.map(lista => (
                  <option key={lista.id} value={lista.id} style={{ background: '#FFFFFF', color: '#111827' }}>
                    {lista.nombre} (+{lista.porcentaje_ganancia}% ganancia)
                  </option>
                ))}
              </select>
              </div>
              
            {/* Selección de productos */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: '#111827', 
                marginBottom: '1rem',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>🛍️ Productos</h3>
              <div style={{
                maxHeight: '300px', 
                overflowY: 'auto',
                background: '#F8F9FA',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #E5E7EB'
              }}>
                {productos.map(producto => {
                  const precio = calcularPrecioProducto(producto)
                  const cantidad = productosSeleccionados[producto.id] || 0
                  
                  return (
                    <div key={producto.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                      padding: '0.75rem',
                      background: cantidad > 0 ? '#E0F2FE' : '#FFFFFF',
                          borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: cantidad > 0 ? '1px solid #0284C7' : '1px solid #E5E7EB',
                      transition: 'all 0.2s ease'
                    }}>
                      <div>
                        <div style={{ color: '#111827', fontWeight: '600', fontSize: '0.875rem' }}>{producto.nombre}</div>
                        <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                          ${precio.toFixed(2)} {producto.categoria && `• ${producto.categoria}`}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {cantidad > 0 && (
                          <>
                <button
                              onClick={() => actualizarCantidadProducto(producto.id, cantidad - 1)}
                    style={{
                                background: '#EF4444',
                                color: '#FFFFFF',
                      border: 'none',
                                borderRadius: '4px',
                                width: '24px',
                                height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}
                            >
                              -
                  </button>
                        <span style={{
                              color: '#111827', 
                              minWidth: '20px', 
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              {cantidad}
                        </span>
                  <button
                              onClick={() => actualizarCantidadProducto(producto.id, cantidad + 1)}
                  style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                      border: 'none',
                                borderRadius: '4px',
                                width: '24px',
                                height: '24px',
                    cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}
                            >
                              +
                  </button>
                          </>
                        )}
                        
                        {cantidad === 0 && (
                          <button
                            onClick={() => toggleProductoSeleccionado(producto.id)}
                        style={{
                              background: '#3B82F6',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                  </div>
                </div>

            {/* Total y botones */}
            {Object.keys(productosSeleccionados).length > 0 && (
              <div style={{
                background: '#F3F4F6',
                  padding: '1rem',
                    borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #E5E7EB'
              }}>
        <div style={{
          display: 'flex',
                  justifyContent: 'space-between', 
          alignItems: 'center',
                  color: '#111827',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}>
                  <span>Total:</span>
                  <span style={{ 
                    color: '#111827',
                    fontSize: '1.25rem',
                    fontWeight: '700'
                  }}>${calcularTotalOrden().toFixed(2)}</span>
              </div>
              </div>
            )}
              
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                  setMostrarFormularioNuevaOrden(false)
                  setClienteNombre('')
                  setClienteTelefono('')
                  setClienteSeleccionado('')
                  setModoCliente('seleccionar')
                  setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
                  setProductosSeleccionados({})
                  setListaSeleccionada('precio_base')
                  }}
                  style={{
                    background: '#FFFFFF',
                  color: '#6B7280',
                  border: '1px solid #D1D5DB',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#6B7280'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                onClick={crearNuevaOrden}
                disabled={!clienteNombre || Object.keys(productosSeleccionados).length === 0}
                  style={{
                  background: (!clienteNombre || Object.keys(productosSeleccionados).length === 0) 
                    ? '#9CA3AF' 
                    : '#10B981',
                  color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: (!clienteNombre || Object.keys(productosSeleccionados).length === 0) 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (clienteNombre && Object.keys(productosSeleccionados).length > 0) {
                    e.currentTarget.style.background = '#059669'
                  }
                }}
                onMouseOut={(e) => {
                  if (clienteNombre && Object.keys(productosSeleccionados).length > 0) {
                    e.currentTarget.style.background = '#10B981'
                  }
                }}
              >
                Crear Factura
                </button>
              </div>
        </div>
        </div>
      )}

      {/* Modal para editar factura */}
      {mostrarModalEdicion && facturaEditando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <h2 style={{ 
                color: '#111827', 
                margin: 0, 
              fontWeight: '700',
                fontSize: '1.5rem' 
              }}>
                Editar Factura #{facturaEditando.id.slice(-8).toUpperCase()}
              </h2>
              <button
                onClick={cerrarModalEdicion}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                  e.currentTarget.style.color = '#111827'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#6B7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Información del cliente */}
            <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                👤 Cliente
            </h3>
            
            {/* Tabs para seleccionar modo */}
            <div style={{
              display: 'flex',
              marginBottom: '1rem',
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => setModoCliente('seleccionar')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: modoCliente === 'seleccionar' ? '#FFFFFF' : 'transparent',
                  color: modoCliente === 'seleccionar' ? '#111827' : '#6B7280',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: modoCliente === 'seleccionar' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                📋 Seleccionar Existente
              </button>
              <button
                onClick={() => setModoCliente('crear')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: modoCliente === 'crear' ? '#FFFFFF' : 'transparent',
                  color: modoCliente === 'crear' ? '#111827' : '#6B7280',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: modoCliente === 'crear' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                ➕ Crear Rápido
              </button>
            </div>
            
            {/* Modo seleccionar cliente existente */}
            {modoCliente === 'seleccionar' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Seleccionar cliente
                </label>
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => {
                    if (e.target.value) {
                      seleccionarCliente(e.target.value)
                    } else {
                      setClienteSeleccionado('')
                      setClienteNombre('')
                      setClienteTelefono('')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#F3F4F6',
                    color: '#111827',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '1rem'
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.telefono ? `(${cliente.telefono})` : ''}
                    </option>
                  ))}
                </select>
                
                {/* Mostrar datos del cliente seleccionado */}
                {clienteSeleccionado && (
                  <div style={{
                    padding: '1rem',
                    background: '#EBF8FF',
                    borderRadius: '8px',
                    border: '1px solid #BEE3F8'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1E40AF',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Cliente Seleccionado
                    </h4>
                    <p style={{
                      margin: '0 0 0.25rem 0',
                      color: '#1E40AF',
                      fontSize: '0.875rem'
                    }}>
                      <strong>Nombre:</strong> {clienteNombre}
                    </p>
                    {clienteTelefono && (
                      <p style={{
                        margin: '0',
                        color: '#1E40AF',
                        fontSize: '0.875rem'
                      }}>
                        <strong>Teléfono:</strong> {clienteTelefono}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Modo crear cliente rápido */}
            {modoCliente === 'crear' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nombre del cliente *
                </label>
                <input
                  type="text"
                  placeholder="Ingresa solo el nombre del cliente"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#F3F4F6',
                    color: '#111827',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '1rem'
                  }}
                />
                
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setModoCliente('seleccionar')
                      setNuevoCliente({ nombre: '', email: '', telefono: '', direccion: '', notas: '' })
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
                    onClick={crearNuevoCliente}
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Crear y Seleccionar
                  </button>
                </div>
              </div>
            )}
              </div>

            {/* Productos */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                Productos de la Factura
              </h3>
              
              <div style={{
                background: '#F8F9FA',
                borderRadius: '8px',
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {productos.filter(p => p.publicado).map(producto => {
                  const cantidad = productosEditando[producto.id] || 0
                  const precio = calcularPrecioProducto(producto)
                  
                  return (
                    <div key={producto.id} style={{
                display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: cantidad > 0 ? '#E0F2FE' : '#FFFFFF',
                      borderRadius: '8px',
                      border: cantidad > 0 ? '1px solid #0284C7' : '1px solid #E5E7EB'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {producto.nombre}
                        </h4>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          margin: 0
                        }}>
                          ${precio.toFixed(2)} c/u
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
              }}>
                <button
                  onClick={() => {
                            const newCantidad = Math.max(0, cantidad - 1)
                            if (newCantidad === 0) {
                              const { [producto.id]: _, ...rest } = productosEditando
                              setProductosEditando(rest)
                            } else {
                              setProductosEditando({ ...productosEditando, [producto.id]: newCantidad })
                            }
                          }}
                          disabled={cantidad === 0}
                  style={{
                            background: cantidad === 0 ? '#F3F4F6' : '#EF4444',
                            color: cantidad === 0 ? '#9CA3AF' : '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            fontSize: '0.75rem',
                            cursor: cantidad === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          -
                        </button>
                        
                        <span style={{
                          minWidth: '20px',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {cantidad}
                        </span>
                        
                        <button
                          onClick={() => {
                            setProductosEditando({ ...productosEditando, [producto.id]: cantidad + 1 })
                          }}
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total */}
            <div style={{
              background: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Total:
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  ${Object.entries(productosEditando).reduce((total, [productoId, cantidad]) => {
                    const producto = productos.find(p => p.id === productoId)
                    return total + (producto ? calcularPrecioProducto(producto) * cantidad : 0)
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cerrarModalEdicion}
                style={{
                  background: '#FFFFFF',
                    color: '#6B7280',
                  border: '1px solid #D1D5DB',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                    cursor: 'pointer',
                  transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#6B7280'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                onClick={guardarEdicionFactura}
                disabled={Object.keys(productosEditando).length === 0}
                  style={{
                  background: Object.keys(productosEditando).length === 0 ? '#9CA3AF' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: Object.keys(productosEditando).length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                  if (Object.keys(productosEditando).length > 0) {
                    e.currentTarget.style.background = '#059669'
                  }
                  }}
                  onMouseOut={(e) => {
                  if (Object.keys(productosEditando).length > 0) {
                    e.currentTarget.style.background = '#10B981'
                  }
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}
