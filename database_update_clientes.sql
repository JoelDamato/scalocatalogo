-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna cliente_id a la tabla ordenes si no existe
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_id ON ordenes(cliente_id);

-- Habilitar RLS (Row Level Security) en la tabla clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir todas las operaciones en clientes" ON clientes
  FOR ALL USING (true);

-- Actualizar la tabla ordenes para permitir cliente_id nulo
ALTER TABLE ordenes ALTER COLUMN cliente_id DROP NOT NULL;
