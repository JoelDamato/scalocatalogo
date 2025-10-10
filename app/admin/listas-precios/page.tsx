'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import Link from 'next/link'
import AdminAuth from "../../../src/components/AdminAuth"
import AdminNavbar from "../../../src/components/AdminNavbar"
import { useAuth } from "../../../src/hooks/useAuth"
import { toast } from 'react-toastify'

interface ListaPrecios {
  id: string
  nombre: string
  descripcion: string | null
  porcentaje_ganancia: number
  activa: boolean
  url_personalizada: string
  created_at: string
  updated_at: string
}

export default function ListasPreciosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [listas, setListas] = useState<ListaPrecios[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [mostrarTabla, setMostrarTabla] = useState(false)
  const [margenesPorLista, setMargenesPorLista] = useState<{[listaId: string]: {[productoId: string]: number}}>({})
  const [margenGlobalPorLista, setMargenGlobalPorLista] = useState<{[listaId: string]: number}>({})
  const [listaSeleccionada, setListaSeleccionada] = useState<string>('')
  const [archivoMargenesCSV, setArchivoMargenesCSV] = useState<File | null>(null)
  const [productosModificados, setProductosModificados] = useState<Set<string>>(new Set())
  
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
  const [editandoLista, setEditandoLista] = useState<ListaPrecios | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porcentaje_ganancia: 50, // 50% por defecto
    activa: true
  })

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setIsVisible(true)
      cargarListas()
      cargarProductos()
      cargarMargenesPersonalizados()
    }
  }, [isAuthenticated, authLoading])

  const cargarListas = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando listas:', error)
        return
      }

      setListas(data || [])
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
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarMargenesPersonalizados = async () => {
    try {
      const { data, error } = await supabase
        .from('margenes_personalizados')
        .select('*')

      if (error) {
        console.error('Error cargando márgenes personalizados:', error)
        return
      }

      // Organizar los márgenes por lista y producto
      const margenesOrganizados: {[listaId: string]: {[productoId: string]: number}} = {}
      data?.forEach(margen => {
        if (!margenesOrganizados[margen.lista_precio_id]) {
          margenesOrganizados[margen.lista_precio_id] = {}
        }
        margenesOrganizados[margen.lista_precio_id][margen.producto_id] = margen.margen_porcentaje
      })

      setMargenesPorLista(margenesOrganizados)
    } catch (error) {
      console.error('Error cargando márgenes personalizados:', error)
    }
  }

  // Funciones para manejo de márgenes por lista
  const calcularPrecioConGanancia = (producto: any, lista: ListaPrecios): number => {
    if (!producto.costo) return producto.precio || 0
    
    // Usar margen personalizado de la lista si existe, sino usar margen global de la lista, sino usar el de la lista
    const margenPersonalizado = margenesPorLista[lista.id]?.[producto.id]
    const margenGlobal = margenGlobalPorLista[lista.id]
    const margen = margenPersonalizado ?? (margenGlobal || lista?.porcentaje_ganancia || 0)
    const ganancia = (producto.costo * margen) / 100
    return producto.costo + ganancia
  }

  const aplicarMargenGlobal = (listaId: string) => {
    const margenGlobal = margenGlobalPorLista[listaId] || 0
    if (margenGlobal <= 0) {
      toast.warn('Por favor ingresa un margen válido')
      return
    }
    
    const nuevosMargenes = { ...margenesPorLista }
    if (!nuevosMargenes[listaId]) {
      nuevosMargenes[listaId] = {}
    }
    
    productos.forEach(producto => {
      if (producto.costo) {
        nuevosMargenes[listaId][producto.id] = margenGlobal
      }
    })
    
    setMargenesPorLista(nuevosMargenes)
    toast.success(`Margen del ${margenGlobal}% aplicado a todos los productos de esta lista`)
  }

  const limpiarMargenes = async (listaId: string) => {
    try {
      // Eliminar márgenes personalizados de la base de datos
      const { error } = await supabase
        .from('margenes_personalizados')
        .delete()
        .eq('lista_precio_id', listaId)
      
      if (error) {
        console.error('Error eliminando márgenes personalizados:', error)
        toast.error('Error al eliminar los márgenes personalizados')
        return
      }

      // Limpiar el estado local
      const nuevosMargenes = { ...margenesPorLista }
      delete nuevosMargenes[listaId]
      setMargenesPorLista(nuevosMargenes)
      
      const nuevosMargenesGlobales = { ...margenGlobalPorLista }
      delete nuevosMargenesGlobales[listaId]
      setMargenGlobalPorLista(nuevosMargenesGlobales)
      
      toast.success('Márgenes personalizados eliminados para esta lista')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar los márgenes personalizados')
    }
  }

  const actualizarMargenProducto = (listaId: string, productoId: string, margen: number) => {
    const nuevosMargenes = { ...margenesPorLista }
    if (!nuevosMargenes[listaId]) {
      nuevosMargenes[listaId] = {}
    }
    nuevosMargenes[listaId][productoId] = margen
    setMargenesPorLista(nuevosMargenes)
    
    // Marcar producto como modificado
    setProductosModificados(prev => new Set([...prev, `${listaId}-${productoId}`]))
  }

  const guardarMargenIndividual = async (listaId: string, productoId: string) => {
    try {
      const margen = margenesPorLista[listaId]?.[productoId]
      
      if (margen && margen > 0) {
        const { error } = await supabase
          .from('margenes_personalizados')
          .upsert({
            lista_precio_id: listaId,
            producto_id: productoId,
            margen_porcentaje: margen
          }, {
            onConflict: 'lista_precio_id,producto_id'
          })

        if (error) {
          console.error('Error guardando margen individual:', error)
          toast.error('Error al guardar el margen')
          return
        }
        
        // Remover de productos modificados
        setProductosModificados(prev => {
          const nuevos = new Set(prev)
          nuevos.delete(`${listaId}-${productoId}`)
          return nuevos
        })
        
        toast.success('Margen guardado correctamente')
      } else {
        // Eliminar margen si es 0 o negativo
        const { error } = await supabase
          .from('margenes_personalizados')
          .delete()
          .eq('lista_precio_id', listaId)
          .eq('producto_id', productoId)

        if (error) {
          console.error('Error eliminando margen individual:', error)
          toast.error('Error al eliminar el margen')
          return
        }
        
        // Remover de productos modificados
        setProductosModificados(prev => {
          const nuevos = new Set(prev)
          nuevos.delete(`${listaId}-${productoId}`)
          return nuevos
        })
        
        toast.success('Margen eliminado correctamente')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar el margen')
    }
  }

  const guardarMargenesPersonalizados = async () => {
    try {
      let margenesGuardados = 0
      let margenesEliminados = 0

      // Procesar todos los márgenes de todas las listas
      for (const listaId of Object.keys(margenesPorLista)) {
        const margenesLista = margenesPorLista[listaId]
        
        for (const productoId of Object.keys(margenesLista)) {
          const margen = margenesLista[productoId]
          
          if (margen > 0) {
            const { error } = await supabase
              .from('margenes_personalizados')
              .upsert({
                lista_precio_id: listaId,
                producto_id: productoId,
                margen_porcentaje: margen
              })
            
            if (error) {
              console.error('Error guardando margen personalizado:', error)
              toast.error(`Error al guardar margen para producto ${productoId}`)
              return
            }
            margenesGuardados++
          } else {
            // Si el margen es 0 o negativo, eliminar el registro
            const { error } = await supabase
              .from('margenes_personalizados')
              .delete()
              .eq('lista_precio_id', listaId)
              .eq('producto_id', productoId)
            
            if (error) {
              console.error('Error eliminando margen personalizado:', error)
              toast.error(`Error al eliminar margen para producto ${productoId}`)
              return
            }
            margenesEliminados++
          }
        }
      }

      if (margenesGuardados > 0 || margenesEliminados > 0) {
        toast.success(`Márgenes guardados: ${margenesGuardados} guardados, ${margenesEliminados} eliminados`)
        setProductosModificados(new Set()) // Limpiar productos modificados
      } else {
        toast.info('No hay cambios en los márgenes para guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar los márgenes personalizados')
    }
  }

  const actualizarMargenGlobalLista = (listaId: string, margen: number) => {
    const nuevosMargenesGlobales = { ...margenGlobalPorLista }
    nuevosMargenesGlobales[listaId] = margen
    setMargenGlobalPorLista(nuevosMargenesGlobales)
  }

  const manejarArchivoMargenesCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!listaSeleccionada) {
      toast.warn('Por favor selecciona una lista primero')
      return
    }

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV válido')
      return
    }

    setArchivoMargenesCSV(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lineas = csv.split('\n').filter(linea => linea.trim())
        
        if (lineas.length < 2) {
          toast.error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos')
          return
        }

        // Asumir formato: nombre_producto,margen_porcentaje
        const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase())
        const indiceNombre = encabezados.findIndex(h => h.includes('nombre') || h.includes('producto'))
        const indiceMargen = encabezados.findIndex(h => h.includes('margen') || h.includes('ganancia') || h.includes('porcentaje'))

        if (indiceNombre === -1 || indiceMargen === -1) {
          toast.error('El CSV debe tener columnas de "nombre" y "margen" (o "ganancia", "porcentaje")')
          return
        }

        const nuevosMargenes = { ...margenesPorLista }
        if (!nuevosMargenes[listaSeleccionada]) {
          nuevosMargenes[listaSeleccionada] = {}
        }
        
        let productosEncontrados = 0

        for (let i = 1; i < lineas.length; i++) {
          const columnas = lineas[i].split(',').map(c => c.trim())
          const nombreProducto = columnas[indiceNombre]
          const margenStr = columnas[indiceMargen]

          if (!nombreProducto || !margenStr) continue

          const margen = parseFloat(margenStr)
          if (isNaN(margen)) continue

          // Buscar el producto por nombre
          const producto = productos.find(p => 
            p.nombre.toLowerCase().includes(nombreProducto.toLowerCase()) ||
            nombreProducto.toLowerCase().includes(p.nombre.toLowerCase())
          )

          if (producto) {
            nuevosMargenes[listaSeleccionada][producto.id] = margen
            productosEncontrados++
          }
        }

        if (productosEncontrados === 0) {
          toast.warn('No se encontraron productos que coincidan con los nombres del CSV')
          return
        }

        setMargenesPorLista(nuevosMargenes)
        toast.success(`Márgenes aplicados a ${productosEncontrados} productos de la lista seleccionada`)
        
      } catch (error) {
        console.error('Error procesando CSV:', error)
        toast.error('Error al procesar el archivo CSV')
      }
    }
    
    reader.readAsText(file)
  }

  const descargarCSVTemplateMargenes = () => {
    const encabezados = ['nombre_producto', 'margen_porcentaje']
    const datos = productos.map(p => [p.nombre, '0'])
    const csv = [encabezados, ...datos].map(fila => fila.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `margenes_productos.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Template CSV descargado')
  }

  const generarURLPersonalizada = async (nombre: string) => {
    try {
      const { data, error } = await supabase
        .rpc('generar_url_personalizada', { nombre_lista: nombre })

      if (error) {
        console.error('Error generando URL:', error)
        return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }

      return data
    } catch (error) {
      console.error('Error:', error)
      return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
  }

  const guardarLista = async () => {
    try {
      if (!formData.nombre.trim()) {
        toast.warn('El nombre es obligatorio')
        return
      }

      const urlPersonalizada = await generarURLPersonalizada(formData.nombre)

      const listaData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        porcentaje_ganancia: formData.porcentaje_ganancia,
        activa: formData.activa,
        url_personalizada: urlPersonalizada
      }

      let error
      if (editandoLista) {
        const { error: updateError } = await supabase
          .from('listas_precios')
          .update(listaData)
          .eq('id', editandoLista.id)

        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('listas_precios')
          .insert(listaData)

        error = insertError
      }

      if (error) {
        console.error('Error guardando lista:', error)
        toast.error('Error al guardar la lista')
        return
      }

      toast.success('Lista guardada exitosamente')
      setMostrarFormulario(false)
      setEditandoLista(null)
      setFormData({
        nombre: '',
        descripcion: '',
        porcentaje_ganancia: 50,
        activa: true
      })
      await cargarListas()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la lista')
    }
  }

  const editarLista = (lista: ListaPrecios) => {
    setEditandoLista(lista)
    setFormData({
      nombre: lista.nombre,
      descripcion: lista.descripcion || '',
      porcentaje_ganancia: lista.porcentaje_ganancia,
      activa: lista.activa
    })
    setMostrarFormulario(true)
  }

  const cancelarEdicion = () => {
    setEditandoLista(null)
    setFormData({
      nombre: '',
      descripcion: '',
      porcentaje_ganancia: 50,
      activa: true
    })
    setMostrarFormulario(false)
  }

  const eliminarLista = async (id: string) => {
    confirmDelete(
      '¿Estás seguro de que quieres eliminar esta lista de precios?',
      async () => {
        try {
          const { error } = await supabase
            .from('listas_precios')
            .delete()
            .eq('id', id)

          if (error) {
            console.error('Error eliminando lista:', error)
            toast.error('Error al eliminar la lista')
            return
          }

          toast.success('Lista eliminada exitosamente')
          await cargarListas()
        } catch (error) {
          console.error('Error:', error)
          toast.error('Error al eliminar la lista')
        }
      }
    )
  }

  const copiarURL = (url: string) => {
    const urlCompleta = `${window.location.origin}/lista-precios/${url}`
    navigator.clipboard.writeText(urlCompleta)
    toast.success('URL copiada al portapapeles')
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
    return <AdminAuth onAuthSuccess={() => {}} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '100px 1rem 2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <AdminNavbar />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.025em',
              margin: 0
            }}>
              Listas de Precios
            </h1>
            <button
              onClick={() => setMostrarFormulario(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#111827',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              ➕ Nueva Lista
            </button>

            <button
              onClick={() => setMostrarTabla(!mostrarTabla)}
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
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              {mostrarTabla ? 'Ver Listas' : '📊 Ver margenes'}
            </button>
          </div>

          {/* Controles de Margen */}
          <div style={{
            background: '#F8F9FA',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              💰 Control de Márgenes por Lista de Precios
            </h3>

            {/* Selector de Lista */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Seleccionar Lista de Precios
              </label>
              <select
                value={listaSeleccionada}
                onChange={(e) => setListaSeleccionada(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  color: '#111827',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="">Selecciona una lista...</option>
                {listas.map(lista => (
                  <option key={lista.id} value={lista.id}>
                    {lista.nombre} (Margen base: {lista.porcentaje_ganancia}%)
                  </option>
                ))}
              </select>
            </div>

            {listaSeleccionada && (
              <>
                <div style={{
                  background: '#EFF6FF',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #BFDBFE'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: '#1E40AF',
                    fontWeight: '500'
                  }}>
                    📋 Configurando márgenes para: <strong>{listas.find(l => l.id === listaSeleccionada)?.nombre}</strong>
                  </p>
                </div>
            
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Margen Global para la Lista */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Margen Global para esta Lista (%)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        placeholder="Ej: 50"
                        value={margenGlobalPorLista[listaSeleccionada] || ''}
                        onChange={(e) => actualizarMargenGlobalLista(listaSeleccionada, parseFloat(e.target.value) || 0)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          color: '#111827',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => aplicarMargenGlobal(listaSeleccionada)}
                        style={{
                          background: '#8B5CF6',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* Cargar CSV de Márgenes */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Cargar Márgenes desde CSV
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={manejarArchivoMargenesCSV}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          color: '#111827',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={descargarCSVTemplateMargenes}
                        style={{
                          background: '#10B981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={guardarMargenesPersonalizados}
                    style={{
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    💾 Guardar Márgenes
                  </button>
                  <button
                    onClick={() => limpiarMargenes(listaSeleccionada)}
                    style={{
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    🗑️ Limpiar Márgenes de esta Lista
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Formulario */}
          {mostrarFormulario && (
            <div style={{
              background: '#F9FAFB',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #E5E7EB'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1.5rem'
              }}>
                {editandoLista ? 'Editar Lista' : 'Nueva Lista de Precios'}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Clientes VIP, Oferta Especial"
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
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    Porcentaje de Ganancia sobre Costo (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    value={formData.porcentaje_ganancia}
                    onChange={(e) => setFormData({...formData, porcentaje_ganancia: parseFloat(e.target.value) || 50})}
                    placeholder="50"
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
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Los precios se calcularán como: Costo + (Costo × Porcentaje / 100)
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    Estado
                  </label>
                  <select
                    value={formData.activa ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, activa: e.target.value === 'true'})}
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
                    <option value="true" style={{ background: '#FFFFFF', color: '#111827' }}>Activa</option>
                    <option value="false" style={{ background: '#FFFFFF', color: '#111827' }}>Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                  placeholder="Descripción de la lista de precios..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#F3F4F6',
                    color: '#111827',
                    fontSize: '1rem',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1.5rem'
              }}>
                <button
                  onClick={cancelarEdicion}
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
                  onClick={guardarLista}
                  style={{
                    background: '#111827',
                    color: '#FFFFFF',
                    border: '1px solid #111827',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#374151'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#111827'
                  }}
                >
                  {editandoLista ? 'Actualizar' : 'Crear Lista'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de listas */}
          {mostrarTabla ? (
            /* Vista de Tabla */
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              marginTop: '2rem',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#F8F9FA',
                padding: '1rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  📊 Gestión de Productos - Vista Tabla
                </h3>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      background: '#F3F4F6',
                      borderBottom: '2px solid #E5E7EB'
                    }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Producto</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Categoría</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Costo</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Margen (%)</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Precio Final</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Lista</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto, index) => {
                      // Calcular precio para cada lista
                      const preciosPorLista = listas.map(lista => {
                        const margenPersonalizado = margenesPorLista[lista.id]?.[producto.id]
                        const margenGlobal = margenGlobalPorLista[lista.id]
                        const margen = margenPersonalizado ?? (margenGlobal || lista?.porcentaje_ganancia || 0)
                        
                        return {
                          lista: lista,
                          precio: calcularPrecioConGanancia(producto, lista),
                          margen: margen
                        }
                      })
                      
                      return (
                        <tr key={producto.id} style={{
                          borderBottom: '1px solid #E5E7EB',
                          background: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                        }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {producto.foto_url && (
                                <img
                                  src={producto.foto_url}
                                  alt={producto.nombre}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                  }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                                  {producto.nombre}
                                </div>
                                {producto.descripcion && (
                                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                                    {producto.descripcion.length > 50 
                                      ? `${producto.descripcion.substring(0, 50)}...` 
                                      : producto.descripcion
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: '#6B7280' }}>
                            {producto.categoria || 'Sin categoría'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#6B7280' }}>
                            ${producto.costo?.toFixed(2) || 'N/A'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {preciosPorLista.map(({ lista, margen }) => (
                                <div key={lista.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#6B7280', minWidth: '60px' }}>
                                    {lista.nombre}:
                                  </span>
                                  <input
                                    type="number"
                                    value={margenesPorLista[lista.id]?.[producto.id] ?? (margenGlobalPorLista[lista.id] || lista.porcentaje_ganancia || 0)}
                                    onChange={(e) => {
                                      const nuevoMargen = parseFloat(e.target.value) || 0
                                      actualizarMargenProducto(lista.id, producto.id, nuevoMargen)
                                    }}
                                    style={{
                                      width: '60px',
                                      padding: '0.2rem 0.3rem',
                                      borderRadius: '3px',
                                      border: '1px solid #D1D5DB',
                                      fontSize: '0.75rem',
                                      textAlign: 'right'
                                    }}
                                  />
                                  <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>%</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#10B981' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {preciosPorLista.map(({ lista, precio }) => (
                                <div key={lista.id} style={{ fontSize: '0.875rem' }}>
                                  {lista.nombre}: ${precio.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {listas.map(lista => (
                                <Link
                                  key={lista.id}
                                  href={`/lista-precios/${lista.url_personalizada}`}
                                  target="_blank"
                                  style={{
                                    background: '#3B82F6',
                                    color: 'white',
                                    textDecoration: 'none',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                  }}
                                >
                                  Ver {lista.nombre}
                                </Link>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {listas.map(lista => {
                                const hasChanges = productosModificados.has(`${lista.id}-${producto.id}`)
                                return (
                                  <button
                                    key={lista.id}
                                    onClick={() => guardarMargenIndividual(lista.id, producto.id)}
                                    disabled={!hasChanges}
                                    style={{
                                      background: hasChanges ? '#10B981' : '#E5E7EB',
                                      color: hasChanges ? 'white' : '#9CA3AF',
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      cursor: hasChanges ? 'pointer' : 'not-allowed',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                      if (hasChanges) {
                                        e.currentTarget.style.background = '#059669'
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (hasChanges) {
                                        e.currentTarget.style.background = '#10B981'
                                      }
                                    }}
                                  >
                                    💾 Guardar
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Vista de Lista Original */
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {listas.map((lista) => (
              <div key={lista.id} style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {lista.nombre}
                      {lista.activa ? (
                        <span style={{
                          background: '#10B981',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}>
                          Activa
                        </span>
                      ) : (
                        <span style={{
                          background: '#EF4444',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}>
                          Inactiva
                        </span>
                      )}
                    </h3>
                    {lista.descripcion && (
                      <p style={{
                        color: '#6B7280',
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem'
                      }}>
                        {lista.descripcion}
                      </p>
                    )}
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: 0,
                      fontSize: '0.85rem'
                    }}>
                      Ganancia: {lista.porcentaje_ganancia}% sobre costo | 
                      URL: <code style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>{lista.url_personalizada}</code>
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => copiarURL(lista.url_personalizada)}
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22C55E',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📋 Copiar URL
                    </button>
                    <button
                      onClick={() => editarLista(lista)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => eliminarLista(lista.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Mensaje cuando no hay listas */}
          {listas.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                  No hay listas de precios creadas aún
                </p>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                  Crea tu primera lista para comenzar
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
