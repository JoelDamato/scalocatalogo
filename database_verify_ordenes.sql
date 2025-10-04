-- Verificar y crear tabla ordenes si no existe
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre VARCHAR(255),
  cliente_telefono VARCHAR(50),
  productos JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'vendida', 'cancelada')),
  mensaje_whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_created_at ON ordenes(created_at);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_id ON ordenes(cliente_id);

-- Habilitar RLS (Row Level Security) en la tabla ordenes
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir todas las operaciones en ordenes" ON ordenes
  FOR ALL USING (true);

-- Verificar que la columna total existe y tiene el tipo correcto
DO $$
BEGIN
  -- Verificar si la columna total existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ordenes' AND column_name = 'total'
  ) THEN
    -- Agregar la columna total si no existe
    ALTER TABLE ordenes ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0;
  ELSE
    -- Verificar el tipo de la columna total
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ordenes' 
      AND column_name = 'total' 
      AND data_type = 'numeric'
    ) THEN
      -- Cambiar el tipo de la columna total a DECIMAL
      ALTER TABLE ordenes ALTER COLUMN total TYPE DECIMAL(10,2);
    END IF;
  END IF;
END $$;

-- Mostrar la estructura actual de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
ORDER BY ordinal_position;
