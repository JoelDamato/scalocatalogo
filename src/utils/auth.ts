/**
 * Utilidades de autenticación unificadas
 * Todos los componentes deben usar estas funciones para mantener consistencia
 */

const AUTH_KEY = 'admin_auth'
const PASSWORD = '12345'

export interface AuthData {
  password: string
  timestamp: number
}

/**
 * Verifica si el usuario está autenticado
 * @returns boolean - true si está autenticado y no ha expirado
 */
export const isAuthenticated = (): boolean => {
  try {
    if (typeof window === 'undefined') return false
    
    const storedAuth = localStorage.getItem(AUTH_KEY)
    if (!storedAuth) return false
    
    const authData: AuthData = JSON.parse(storedAuth)
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    // Verificar contraseña correcta y que no haya expirado
    return authData.password === PASSWORD && (now - authData.timestamp) < twentyFourHours
  } catch (error) {
    console.error('Error verificando autenticación:', error)
    // Si hay error, limpiar localStorage
    try {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem('admin_authenticated') // Limpiar sistema viejo
    } catch (e) {
      // Ignorar errores de localStorage
    }
    return false
  }
}

/**
 * Autentica al usuario con la contraseña
 * @param password - La contraseña a verificar
 * @returns boolean - true si la autenticación fue exitosa
 */
export const authenticate = (password: string): boolean => {
  if (password !== PASSWORD) {
    return false
  }

  try {
    if (typeof window === 'undefined') return true // SSR
    
    const authData: AuthData = {
      password: PASSWORD,
      timestamp: Date.now()
    }
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    
    // Limpiar sistema de autenticación viejo
    localStorage.removeItem('admin_authenticated')
    
    return true
  } catch (error) {
    console.error('Error guardando autenticación:', error)
    // Aún permitir autenticación aunque falle localStorage
    return true
  }
}

/**
 * Cierra la sesión del usuario
 */
export const logout = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem('admin_authenticated') // Limpiar sistema viejo
    }
  } catch (error) {
    console.error('Error cerrando sesión:', error)
  }
}

/**
 * Refresca el timestamp de autenticación para extender la sesión
 */
export const refreshAuth = (): void => {
  if (!isAuthenticated()) return
  
  try {
    if (typeof window !== 'undefined') {
      const authData: AuthData = {
        password: PASSWORD,
        timestamp: Date.now()
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    }
  } catch (error) {
    console.error('Error refrescando autenticación:', error)
  }
}

/**
 * Limpia sistemas de autenticación duplicados o obsoletos
 */
export const cleanupOldAuth = (): void => {
  try {
    if (typeof window !== 'undefined') {
      const oldAuth = localStorage.getItem('admin_authenticated')
      const newAuth = localStorage.getItem(AUTH_KEY)
      
      if (oldAuth && !newAuth) {
        // Migrar del sistema viejo al nuevo
        const authData: AuthData = {
          password: PASSWORD,
          timestamp: Date.now()
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
        localStorage.removeItem('admin_authenticated')
        console.log('🔄 Migrado sistema de autenticación')
      } else if (oldAuth && newAuth) {
        // Si existen ambos, eliminar el viejo
        localStorage.removeItem('admin_authenticated')
        console.log('🧹 Limpiado sistema de auth duplicado')
      }
    }
  } catch (error) {
    console.error('Error limpiando autenticación:', error)
  }
}
