-- Agregar campo para activar/desactivar descuento por pago en efectivo
ALTER TABLE configuracion_sistema 
ADD COLUMN IF NOT EXISTS descuento_efectivo_activo BOOLEAN DEFAULT true;

-- Actualizar el valor por defecto si la columna ya existe
UPDATE configuracion_sistema 
SET descuento_efectivo_activo = true 
WHERE descuento_efectivo_activo IS NULL;

-- Mostrar la estructura actualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'configuracion_sistema' 
AND column_name = 'descuento_efectivo_activo';
