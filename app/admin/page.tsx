'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import Link from 'next/link'
import AdminAuth from '../../src/components/AdminAuth'
import AdminNavbar from '../../src/components/AdminNavbar'
import CloudinaryService from '../../src/services/cloudinaryService'
import { useAuth } from '../../src/hooks/useAuth'

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

interface ProductoPopular {
  id: string
  nombre: string
  foto_url: string | null
  precio: number | null
  total_selecciones: number
}

export default function AdminPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosPopulares, setProductosPopulares] = useState<ProductoPopular[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: '',
    costo: '',
    foto_url: '',
    publicado: true
  })
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [archivoCSV, setArchivoCSV] = useState<File | null>(null)
  const [subiendoCSV, setSubiendoCSV] = useState(false)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  const [porcentajeGanancia, setPorcentajeGanancia] = useState(30) // 30% por defecto
  const [calculoAutomatico, setCalculoAutomatico] = useState(true)

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setIsVisible(true)
      cargarProductos()
      cargarProductosPopulares()
    }
  }, [isAuthenticated, authLoading])

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando productos:', error)
        return
      }

      setProductos(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const cargarProductosPopulares = async () => {
    try {
      const { data, error } = await supabase
        .from('producto_selecciones')
        .select(`
          producto_id,
          productos!inner(id, nombre, foto_url, precio)
        `)

      if (error) {
        console.error('Error cargando productos populares:', error)
        return
      }

      const conteoSelecciones: { [key: string]: { producto: any, count: number } } = {}
      
      data?.forEach(item => {
        const productoId = item.producto_id
        if (conteoSelecciones[productoId]) {
          conteoSelecciones[productoId].count++
        } else {
          conteoSelecciones[productoId] = {
            producto: item.productos,
            count: 1
          }
        }
      })

      const productosPopularesArray = Object.values(conteoSelecciones)
        .map(item => ({
          id: item.producto.id,
          nombre: item.producto.nombre,
          foto_url: item.producto.foto_url,
          precio: item.producto.precio,
          total_selecciones: item.count
        }))
        .sort((a, b) => b.total_selecciones - a.total_selecciones)
        .slice(0, 5)

      setProductosPopulares(productosPopularesArray)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      alert('El nombre del producto es requerido')
      return
    }

    try {
      let fotoUrl = formData.foto_url.trim()

      // Si hay un archivo seleccionado, subirlo primero
      if (archivoFoto) {
        const urlSubida = await subirFoto(archivoFoto)
        if (urlSubida) {
          fotoUrl = urlSubida
        } else {
          alert('Error al subir la foto. Inténtalo de nuevo.')
          return
        }
      }

      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        categoria: formData.categoria.trim() || null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        costo: formData.costo ? parseFloat(formData.costo) : null,
        foto_url: fotoUrl || null,
        publicado: formData.publicado
      }

      let error
      if (productoEditando) {
        const { error: updateError } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', productoEditando.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('productos')
          .insert([productoData])
        error = insertError
      }

      if (error) {
        console.error('Error guardando producto:', error)
        alert('Error al guardar el producto')
        return
      }

      setFormData({
        nombre: '',
        descripcion: '',
        categoria: '',
        precio: '',
        foto_url: '',
        publicado: true
      })
      setMostrarFormulario(false)
      setProductoEditando(null)
      cargarProductos()
      cargarProductosPopulares()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el producto')
    }
  }

  const editarProducto = (producto: Producto) => {
    setProductoEditando(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      precio: producto.precio?.toString() || '',
      costo: producto.costo?.toString() || '',
      foto_url: producto.foto_url || '',
      publicado: producto.publicado
    })
    setMostrarFormulario(true)
  }

  const cancelarEdicion = () => {
    setProductoEditando(null)
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: '',
      precio: '',
      costo: '',
      foto_url: '',
      publicado: true
    })
    setArchivoFoto(null)
    setMostrarFormulario(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB')
        return
      }
      
      setArchivoFoto(file)
    }
  }

  const calcularPrecioVenta = (costo: number, porcentaje: number): number => {
    return costo * (1 + porcentaje / 100)
  }

  const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const costo = parseFloat(e.target.value) || 0
    setFormData(prev => ({
      ...prev,
      costo: e.target.value
    }))

    // Si el cálculo automático está activado, calcular el precio
    if (calculoAutomatico && costo > 0) {
      const precioCalculado = calcularPrecioVenta(costo, porcentajeGanancia)
      setFormData(prev => ({
        ...prev,
        precio: precioCalculado.toFixed(2)
      }))
    }
  }

  const handlePorcentajeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const porcentaje = parseFloat(e.target.value) || 0
    setPorcentajeGanancia(porcentaje)

    // Si el cálculo automático está activado y hay un costo, recalcular el precio
    if (calculoAutomatico && formData.costo) {
      const costo = parseFloat(formData.costo) || 0
      if (costo > 0) {
        const precioCalculado = calcularPrecioVenta(costo, porcentaje)
        setFormData(prev => ({
          ...prev,
          precio: precioCalculado.toFixed(2)
        }))
      }
    }
  }

  const subirFoto = async (file: File): Promise<string | null> => {
    try {
      setSubiendoFoto(true)
      
      // Subir archivo a Cloudinary
      const imageUrl = await CloudinaryService.uploadImage(file, 'productos')
      
      return imageUrl
    } catch (error) {
      console.error('Error subiendo foto:', error)
      alert('Error al subir la foto. Inténtalo de nuevo.')
      return null
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Por favor selecciona un archivo CSV válido')
        return
      }
      
      setArchivoCSV(file)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['nombre', 'costo']
    
    // Verificar que tenga los headers requeridos
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`)
    }

    const productos = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) {
        console.warn(`Fila ${i + 1} tiene un número incorrecto de columnas, saltando...`)
        continue
      }

      const producto: any = {}
      headers.forEach((header, index) => {
        producto[header] = values[index] || null
      })

      // Validar datos requeridos
      if (!producto.nombre || !producto.costo) {
        console.warn(`Fila ${i + 1} tiene datos faltantes, saltando...`)
        continue
      }

      // Convertir costo a número
      const costo = parseFloat(producto.costo)
      if (isNaN(costo)) {
        console.warn(`Fila ${i + 1} tiene un costo inválido, saltando...`)
        continue
      }

      // Calcular precio automáticamente basado en el costo y porcentaje de ganancia
      const precio = calcularPrecioVenta(costo, porcentajeGanancia)

      productos.push({
        nombre: producto.nombre,
        descripcion: producto.descripcion || null,
        categoria: producto.categoria || null,
        precio: precio,
        costo: costo,
        foto_url: null, // Las fotos se cargan después individualmente
        publicado: producto.publicado === 'true' || producto.publicado === '1' || producto.publicado === 'si' || producto.publicado === 'sí'
      })
    }

    return productos
  }

  const cargarProductosCSV = async () => {
    if (!archivoCSV) {
      alert('Por favor selecciona un archivo CSV')
      return
    }

    try {
      setSubiendoCSV(true)
      
      const csvText = await archivoCSV.text()
      const productos = parseCSV(csvText)

      if (productos.length === 0) {
        alert('No se encontraron productos válidos en el archivo CSV')
        return
      }

      // Insertar productos en lotes
      const batchSize = 10
      for (let i = 0; i < productos.length; i += batchSize) {
        const batch = productos.slice(i, i + batchSize)
        const { error } = await supabase
          .from('productos')
          .insert(batch)

        if (error) {
          console.error('Error insertando lote:', error)
          throw error
        }
      }

      alert(`¡Éxito! Se cargaron ${productos.length} productos desde el CSV`)
      setArchivoCSV(null)
      cargarProductos()
      cargarProductosPopulares()
    } catch (error) {
      console.error('Error cargando CSV:', error)
      alert(`Error al cargar el CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setSubiendoCSV(false)
    }
  }

  const descargarPlantillaCSV = () => {
    const headers = ['nombre', 'descripcion', 'categoria', 'costo', 'publicado']
    const ejemplo = ['Producto Ejemplo', 'Descripción del producto', 'Categoría', '7.00', 'true']
    
    const csvContent = [headers, ejemplo].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_productos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const eliminarProducto = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando producto:', error)
        alert('Error al eliminar el producto')
        return
      }

      cargarProductos()
      cargarProductosPopulares()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el producto')
    }
  }

  const togglePublicacion = async (id: string, publicado: boolean) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ publicado: !publicado })
        .eq('id', id)

      if (error) {
        console.error('Error actualizando producto:', error)
        alert('Error al actualizar el producto')
        return
      }

      cargarProductos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el producto')
    }
  }

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
    return <AdminAuth onAuthSuccess={() => {}} />
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'white', fontSize: '1.1rem' }}>Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '100px'
    }}>
      <AdminNavbar />
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
        `,
        zIndex: 1
      }} />

      <main style={{
        position: 'relative',
        zIndex: 3,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out'
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '800',
              color: 'white',
              marginBottom: '0.5rem',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔧 Panel de Administración
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.1rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              Gestiona productos y visualiza estadísticas
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                padding: '0.75rem 1.5rem',
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
            
            <Link href="/admin/ordenes" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 15px 35px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.3)'
              }}>
                📋 Ver Órdenes
              </button>
            </Link>
          </div>
        </div>

        {/* Popular Products & Orders Tabs */}
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
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '1rem'
          }}>
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🔥 Ranking de Productos
            </button>
            
            <Link href="/admin/ordenes" style={{ textDecoration: 'none' }}>
              <button
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
              >
                📋 Ver Todas las Órdenes
              </button>
            </Link>
          </div>

          {/* Ranking de Productos */}
          {productosPopulares.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '1rem',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏆 Top {productosPopulares.length} Productos Más Seleccionados
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {productosPopulares.map((producto, index) => (
                  <div key={producto.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateX(5px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}>
                    {/* Ranking position */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flex: 1
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                                   index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)' :
                                   index === 2 ? 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)' :
                                   'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: index < 3 ? '#000000' : 'white',
                        boxShadow: index < 3 ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontWeight: '600',
                          fontSize: '1rem',
                          color: 'white',
                          marginBottom: '0.25rem',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                        }}>
                          {producto.nombre}
                        </h4>
                        <div style={{ marginTop: '0.5rem' }}>
                          {producto.precio && (
                            <p style={{
                              fontSize: '0.85rem',
                              color: 'rgba(255, 255, 255, 0.7)',
                              margin: '0 0 0.25rem 0',
                              fontWeight: '600'
                            }}>
                              💰 ${producto.precio}
                            </p>
                          )}
                          {producto.costo && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.5)',
                              margin: '0 0 0.25rem 0'
                            }}>
                              Costo: ${producto.costo}
                            </p>
                          )}
                          {producto.precio && producto.costo && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.5)',
                              margin: 0
                            }}>
                              Ganancia: ${(producto.precio - producto.costo).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection count */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: '500'
                      }}>
                        Selecciones:
                      </span>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#FFD700',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}>
                        {producto.total_selecciones}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          marginBottom: '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out 0.4s',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setMostrarFormulario(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}
          >
            ➕ Agregar Producto
          </button>

          <button
            onClick={() => setMostrarInstrucciones(!mostrarInstrucciones)}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(139, 92, 246, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)'
            }}
          >
            📊 Cargar CSV
          </button>
        </div>

        {/* CSV Upload Section */}
        {mostrarInstrucciones && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '2rem',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 0.5s'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '1.5rem',
              textAlign: 'center',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              📊 Carga Masiva de Productos
            </h3>

            {/* Instrucciones */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              borderRadius: '15px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 Instrucciones
              </h4>
              <ol style={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.6',
                paddingLeft: '1.5rem',
                margin: 0
              }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Descarga la plantilla:</strong> Haz clic en "Descargar Plantilla" para obtener un archivo CSV de ejemplo
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Completa los datos:</strong> Llena el archivo con tus productos (nombre y costo son obligatorios)
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Formato de columnas:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    <li><code>nombre</code> - Nombre del producto (obligatorio)</li>
                    <li><code>descripcion</code> - Descripción (opcional)</li>
                    <li><code>categoria</code> - Categoría (opcional)</li>
                    <li><code>costo</code> - Costo del producto en números (obligatorio)</li>
                    <li><code>publicado</code> - true/false para publicar (opcional, por defecto true)</li>
                  </ul>
                </li>
                <li style={{ marginBottom: '0.5rem', color: '#8B5CF6', fontWeight: '600' }}>
                  <strong>💡 Nota:</strong> El precio de venta se calculará automáticamente basado en el costo y el porcentaje de ganancia configurado arriba
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Sube el archivo:</strong> Selecciona tu archivo CSV y haz clic en "Cargar Productos"
                </li>
                <li>
                  <strong>Agrega fotos:</strong> Después de cargar, edita cada producto individualmente para agregar las fotos
                </li>
              </ol>
            </div>

            {/* Controles de CSV */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <button
                onClick={descargarPlantillaCSV}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                📥 Descargar Plantilla
              </button>

              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVChange}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  📁 Seleccionar CSV
                </button>
              </div>

              <button
                onClick={cargarProductosCSV}
                disabled={!archivoCSV || subiendoCSV}
                style={{
                  background: archivoCSV && !subiendoCSV
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: archivoCSV && !subiendoCSV ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: archivoCSV && !subiendoCSV ? 1 : 0.6
                }}
                onMouseOver={(e) => {
                  if (archivoCSV && !subiendoCSV) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (archivoCSV && !subiendoCSV) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {subiendoCSV ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    🚀 Cargar Productos
                  </>
                )}
              </button>
            </div>

            {/* Mostrar archivo seleccionado */}
            {archivoCSV && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1rem',
                borderRadius: '12px',
                marginTop: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
              }}>
                <p style={{
                  color: 'white',
                  margin: 0,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  📁 Archivo seleccionado: <strong>{archivoCSV.name}</strong>
                  <span style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    ({(archivoCSV.size / 1024).toFixed(1)} KB)
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Products List */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease-out 0.6s'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            Productos ({productos.length})
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '1.5rem'
          }}>
            Gestiona todos los productos de tu tienda
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {productos.map((producto, index) => (
              <div key={producto.id} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '1.5rem',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 1s ease-out ${0.8 + index * 0.1}s`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Imagen */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {producto.foto_url ? (
                      <img
                        src={producto.foto_url}
                        alt={producto.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '2rem' }}>📦</div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <h4 style={{
                        fontWeight: '700',
                        color: 'white',
                        fontSize: '1.1rem',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {producto.nombre}
                      </h4>
                      <span style={{
                        background: producto.publicado 
                          ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                          : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {producto.publicado ? 'Publicado' : 'Borrador'}
                      </span>
                      {producto.categoria && (
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {producto.categoria}
                        </span>
                      )}
                    </div>
                    {producto.descripcion && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {producto.descripcion}
                      </p>
                    )}
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                    }}>
                      {producto.precio ? `$${producto.precio}` : 'Sin precio'}
                    </div>
                    {producto.costo && (
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: '0.25rem'
                      }}>
                        Costo: ${producto.costo}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => editarProducto(producto)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '1.2rem'
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
                      ✏️
                    </button>
                    <button
                      onClick={() => togglePublicacion(producto.id, producto.publicado)}
                      style={{
                        background: producto.publicado 
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '1.2rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = producto.publicado 
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = producto.publicado 
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      {producto.publicado ? '👁️' : '🚫'}
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '1.2rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {productos.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '0.5rem',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                }}>
                  No hay productos
                </h3>
                <p>
                  Agrega tu primer producto para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Formulario */}
      {mostrarFormulario && (
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
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '0.5rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1.5rem'
            }}>
              {productoEditando ? 'Modifica los datos del producto' : 'Completa los datos del nuevo producto'}
            </p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Nombre del producto"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del producto"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  placeholder="Categoría"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
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
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
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

              {/* Campo de Costo */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  💰 Costo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo}
                  onChange={handleCostoChange}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
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

              {/* Configuración de Cálculo Automático */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="checkbox"
                    id="calculoAutomatico"
                    checked={calculoAutomatico}
                    onChange={(e) => setCalculoAutomatico(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="calculoAutomatico" style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    margin: 0
                  }}>
                    🧮 Calcular precio automáticamente
                  </label>
                </div>

                {calculoAutomatico && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '0.5rem'
                    }}>
                      Porcentaje de ganancia (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={porcentajeGanancia}
                      onChange={handlePorcentajeChange}
                      placeholder="30"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '0.9rem',
                        backdropFilter: 'blur(10px)',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: '0.5rem 0 0 0'
                    }}>
                      El precio se calculará como: Costo × (1 + {porcentajeGanancia}%) = ${formData.costo ? (parseFloat(formData.costo) * (1 + porcentajeGanancia / 100)).toFixed(2) : '0.00'}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  📸 Foto del Producto
                </label>
                
                {/* Input de archivo */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '0.5rem'
                  }}
                />
                
                {/* Mostrar archivo seleccionado */}
                {archivoFoto && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <p style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      📁 {archivoFoto.name} ({(archivoFoto.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
                
                {/* Input de URL como alternativa */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    O ingresa una URL (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.foto_url}
                    onChange={(e) => setFormData({...formData, foto_url: e.target.value})}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
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
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <input
                  type="checkbox"
                  id="publicado"
                  checked={formData.publicado}
                  onChange={(e) => setFormData({...formData, publicado: e.target.checked})}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#667eea'
                  }}
                />
                <label htmlFor="publicado" style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer'
                }}>
                  Publicado
                </label>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendoFoto}
                  style={{
                    background: subiendoFoto 
                      ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: subiendoFoto ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1,
                    opacity: subiendoFoto ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {subiendoFoto ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid #FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Subiendo foto...
                    </>
                  ) : (
                    <>
                      {productoEditando ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </div>
            </form>
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
