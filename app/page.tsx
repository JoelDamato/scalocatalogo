export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '120px 1rem 2rem 1rem',
      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          color: '#1a202c',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          M DESCARTABLES
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#4a5568',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          lineHeight: '1.6'
        }}>
          Productos descartables de la más alta calidad para tu hogar y negocio. 
          Envíos rápidos y precios competitivos.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a 
            href="/productos"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              padding: '1rem 2rem',
              borderRadius: '50px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block'
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
            Ver Nuestros Productos
          </a>
          
          <a 
            href="/admin"
            style={{
              background: 'transparent',
              color: '#8B5CF6',
              padding: '1rem 2rem',
              borderRadius: '50px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '700',
              border: '2px solid #8B5CF6',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#8B5CF6'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#8B5CF6'
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
            }}
          >
            Administración
          </a>
        </div>
      </div>
    </div>
  )
}
