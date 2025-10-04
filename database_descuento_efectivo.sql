-- Agregar campo de descuento por pago en efectivo a la configuración del sistema
ALTER TABLE configuracion_sistema 
ADD COLUMN IF NOT EXISTS descuento_efectivo DECIMAL(5,2) DEFAULT 3.00;

-- Actualizar el valor por defecto si la columna ya existe
UPDATE configuracion_sistema 
SET descuento_efectivo = 3.00 
WHERE descuento_efectivo IS NULL;

-- Agregar campo de método de pago a la tabla ordenes
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20) DEFAULT 'whatsapp';

-- Agregar campo de descuento aplicado a la tabla ordenes
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS descuento_aplicado DECIMAL(10,2) DEFAULT 0.00;

-- Agregar campo de total con descuento a la tabla ordenes
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS total_con_descuento DECIMAL(10,2);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_metodo_pago ON ordenes(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_ordenes_descuento_aplicado ON ordenes(descuento_aplicado);

-- Mostrar la estructura actualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'configuracion_sistema' 
AND column_name = 'descuento_efectivo';

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
AND column_name IN ('metodo_pago', 'descuento_aplicado', 'total_con_descuento')
ORDER BY column_name;
