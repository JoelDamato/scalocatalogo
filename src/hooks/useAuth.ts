import { useState, useEffect } from 'react'

const AUTH_KEY = 'admin_auth'
const PASSWORD = '12345'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada al cargar la página
    // Usar un timeout para asegurar que el componente esté montado
    const timer = setTimeout(() => {
      checkStoredAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const checkStoredAuth = () => {
    console.log('🔍 Verificando autenticación almacenada...')
    try {
      // Verificar si localStorage está disponible
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('❌ localStorage no disponible')
        setLoading(false)
        return
      }

      const storedAuth = localStorage.getItem(AUTH_KEY)
      console.log('📦 Auth almacenado:', storedAuth ? 'Encontrado' : 'No encontrado')
      
      if (storedAuth) {
        const { password, timestamp } = JSON.parse(storedAuth)
        
        // Verificar que la contraseña sea correcta y que no haya expirado (24 horas)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (password === PASSWORD && (now - timestamp) < twentyFourHours) {
          console.log('✅ Autenticación válida encontrada')
          setIsAuthenticated(true)
        } else {
          console.log('⏰ Autenticación expirada o inválida')
          // Si la contraseña es incorrecta o ha expirado, limpiar el localStorage
          localStorage.removeItem(AUTH_KEY)
        }
      } else {
        console.log('🔓 No hay autenticación previa')
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error)
      try {
        localStorage.removeItem(AUTH_KEY)
      } catch (e) {
        // Ignore localStorage errors
      }
    } finally {
      console.log('🏁 Verificación de auth completada, loading = false')
      setLoading(false)
    }
  }

  const login = (password: string) => {
    if (password === PASSWORD) {
      try {
        const authData = {
          password: PASSWORD,
          timestamp: Date.now()
        }
        
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
        }
        setIsAuthenticated(true)
        return true
      } catch (error) {
        console.error('Error guardando autenticación:', error)
        // Aún permitir la autenticación aunque falle localStorage
        setIsAuthenticated(true)
        return true
      }
    }
    return false
  }

  const logout = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(AUTH_KEY)
      }
    } catch (error) {
      console.error('Error eliminando autenticación:', error)
    }
    setIsAuthenticated(false)
  }

  const refreshAuth = () => {
    // Actualizar el timestamp para extender la sesión
    if (isAuthenticated) {
      try {
        const authData = {
          password: PASSWORD,
          timestamp: Date.now()
        }
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
        }
      } catch (error) {
        console.error('Error refrescando autenticación:', error)
      }
    }
  }

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    refreshAuth
  }
}
