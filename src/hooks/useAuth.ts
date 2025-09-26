import { useState, useEffect } from 'react'

const AUTH_KEY = 'admin_auth'
const PASSWORD = '12345'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión guardada al cargar la página
    checkStoredAuth()
  }, [])

  const checkStoredAuth = () => {
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY)
      if (storedAuth) {
        const { password, timestamp } = JSON.parse(storedAuth)
        
        // Verificar que la contraseña sea correcta y que no haya expirado (24 horas)
        const now = Date.now()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (password === PASSWORD && (now - timestamp) < twentyFourHours) {
          setIsAuthenticated(true)
        } else {
          // Si la contraseña es incorrecta o ha expirado, limpiar el localStorage
          localStorage.removeItem(AUTH_KEY)
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      localStorage.removeItem(AUTH_KEY)
    } finally {
      setLoading(false)
    }
  }

  const login = (password: string) => {
    if (password === PASSWORD) {
      const authData = {
        password: PASSWORD,
        timestamp: Date.now()
      }
      
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
  }

  const refreshAuth = () => {
    // Actualizar el timestamp para extender la sesión
    if (isAuthenticated) {
      const authData = {
        password: PASSWORD,
        timestamp: Date.now()
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
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
