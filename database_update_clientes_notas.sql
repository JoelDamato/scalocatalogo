-- Agregar columna de notas a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Actualizar la columna si ya existe para asegurar que sea TEXT
ALTER TABLE clientes 
ALTER COLUMN notas TYPE TEXT;
