-- Script para depurar datos de la tabla ordenes

-- Mostrar la estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
ORDER BY ordinal_position;

-- Contar total de órdenes
SELECT COUNT(*) as total_ordenes FROM ordenes;

-- Mostrar todas las órdenes con sus datos básicos
SELECT 
  id,
  cliente_nombre,
  total,
  estado,
  created_at
FROM ordenes 
ORDER BY created_at DESC 
LIMIT 10;

-- Mostrar estadísticas por estado
SELECT 
  estado,
  COUNT(*) as cantidad,
  SUM(total) as total_monto,
  AVG(total) as promedio_monto
FROM ordenes 
GROUP BY estado;

-- Mostrar órdenes del día actual
SELECT 
  id,
  cliente_nombre,
  total,
  estado,
  created_at
FROM ordenes 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Mostrar órdenes del mes actual
SELECT 
  id,
  cliente_nombre,
  total,
  estado,
  created_at
FROM ordenes 
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY created_at DESC;
