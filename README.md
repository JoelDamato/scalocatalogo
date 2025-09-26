# 🛍️ Scala Catálogo - E-commerce Platform

Una plataforma de e-commerce moderna construida con Next.js, Supabase y Cloudinary.

## 🚀 Características

- **Catálogo de productos** con búsqueda y filtros
- **Listas de precios personalizadas** con descuentos
- **Panel de administración** completo
- **Sistema de pedidos** por WhatsApp
- **Gestión de imágenes** con Cloudinary
- **Carga masiva** de productos via CSV
- **Diseño responsive** y moderno

## 🔧 Variables de Entorno

Para configurar el proyecto en Vercel, necesitas las siguientes variables de entorno:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://erpmlplzdvesedkgbuzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycG1scGx6ZHZlc2Vka2didXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTMwNTksImV4cCI6MjA3Mzk2OTA1OX0.sXrmcf2HoY1R2yLGWnSf6BQdMgL2fLG7XOlVuhRaAw
```

### Cloudinary
```
CLOUDINARY_CLOUD_NAME=dlatm24cg
CLOUDINARY_API_KEY=145871242324443
CLOUDINARY_API_SECRET=PQbatR503WGJCbmlGYw2allT-y8
```

### Next.js
```
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

## 📦 Instalación

1. Clona el repositorio
2. Instala las dependencias: `pnpm install`
3. Configura las variables de entorno
4. Ejecuta el proyecto: `pnpm dev`

## 🗄️ Base de Datos

El proyecto usa Supabase. Las tablas necesarias se crean automáticamente:
- `productos`
- `ordenes`
- `configuracion_sistema`
- `listas_precios`

## 🚀 Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Despliega automáticamente

## 📱 Funcionalidades

- **Página principal** con hero section y CTA
- **Catálogo de productos** con filtros y búsqueda
- **Listas de precios** personalizadas con descuentos
- **Panel de admin** con CRUD completo
- **Sistema de pedidos** integrado con WhatsApp
- **Gestión de configuración** del sistema
- **Carga masiva** de productos via CSV

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **Supabase** - Base de datos y autenticación
- **Cloudinary** - Gestión de imágenes
- **TypeScript** - Tipado estático
- **CSS-in-JS** - Estilos dinámicos
