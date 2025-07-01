-- Insertar datos de ejemplo para testing

-- Insertar algunos clientes de ejemplo
INSERT INTO clients (name, email, phone, address, dni, fecha_nacimiento, vencimiento_dni, numero_pasaporte, vencimiento_pasaporte) VALUES
('García, Juan Carlos', 'juan.garcia@email.com', '11-1234-5678', 'Av. Corrientes 1234, CABA', '12345678', '1985-03-15', '2025-03-15', 'ABC123456', '2026-03-15'),
('López, María Elena', 'maria.lopez@email.com', '11-8765-4321', 'Av. Santa Fe 5678, CABA', '87654321', '1990-07-22', '2026-07-22', NULL, NULL),
('Rodríguez, Carlos Alberto', 'carlos.rodriguez@email.com', '11-5555-1234', 'Av. Rivadavia 9876, CABA', '11223344', '1978-11-30', '2025-11-30', 'XYZ789012', '2027-11-30'),
('Fernández, Ana Sofía', 'ana.fernandez@email.com', '11-9999-8888', 'Av. Cabildo 4567, CABA', '99887766', '1992-05-18', '2026-05-18', NULL, NULL),
('Martínez, Roberto Luis', 'roberto.martinez@email.com', '11-7777-3333', 'Av. Las Heras 2345, CABA', '55443322', '1980-09-12', '2025-09-12', 'DEF456789', '2028-09-12')
ON CONFLICT (dni) DO NOTHING;

-- Insertar algunos buses de ejemplo
INSERT INTO buses (patente, asientos, tipo_servicio, imagen_distribucion) VALUES
('ABC123', 45, 'Semi-cama', NULL),
('DEF456', 38, 'Ejecutivo', NULL),
('GHI789', 52, 'Común', NULL),
('JKL012', 30, 'Cama', NULL)
ON CONFLICT (patente) DO NOTHING;

-- Insertar algunos viajes de ejemplo
INSERT INTO trips (destino, fecha_salida, fecha_regreso, importe, currency, type, descripcion, bus_id, archived) VALUES
('Bariloche', '2024-02-15 08:00:00', '2024-02-20 18:00:00', 150000, 'ARS', 'grupal', 'Incluye transporte, alojamiento 4 estrellas, desayuno y excursiones', (SELECT id FROM buses WHERE patente = 'ABC123' LIMIT 1), false),
('Mendoza', '2024-03-10 07:30:00', '2024-03-15 19:00:00', 120000, 'ARS', 'grupal', 'Incluye transporte, alojamiento 3 estrellas, desayuno y tour de bodegas', (SELECT id FROM buses WHERE patente = 'DEF456' LIMIT 1), false),
('Miami', '2024-04-05 10:00:00', '2024-04-12 22:00:00', 1200, 'USD', 'aereo', 'Vuelo directo, hotel 4 estrellas, desayuno incluido', NULL, false),
('Crucero por el Caribe', '2024-05-20 16:00:00', '2024-05-27 10:00:00', 800, 'USD', 'crucero', 'Crucero de 7 días, pensión completa, entretenimiento a bordo', NULL, false),
('Traslado Aeropuerto', '2024-01-25 14:00:00', '2024-01-25 16:00:00', 25000, 'ARS', 'individual', 'Traslado privado desde/hacia aeropuerto', NULL, false);

-- Actualizar viajes con información específica
UPDATE trips SET 
  aerolinea = 'American Airlines',
  numero_vuelo = 'AA1234',
  clase = 'economica',
  escalas = 'Sin escalas'
WHERE type = 'aereo';

UPDATE trips SET 
  naviera = 'Royal Caribbean',
  barco = 'Symphony of the Seas',
  cabina = 'balcon'
WHERE type = 'crucero';

-- Insertar algunos pasajeros de ejemplo
INSERT INTO trip_passengers (trip_id, client_id, pagado, numero_asiento, numero_cabina) VALUES
((SELECT id FROM trips WHERE destino = 'Bariloche' LIMIT 1), (SELECT id FROM clients WHERE dni = '12345678' LIMIT 1), true, 15, NULL),
((SELECT id FROM trips WHERE destino = 'Bariloche' LIMIT 1), (SELECT id FROM clients WHERE dni = '87654321' LIMIT 1), false, 16, NULL),
((SELECT id FROM trips WHERE destino = 'Mendoza' LIMIT 1), (SELECT id FROM clients WHERE dni = '11223344' LIMIT 1), true, 8, NULL),
((SELECT id FROM trips WHERE destino = 'Miami' LIMIT 1), (SELECT id FROM clients WHERE dni = '99887766' LIMIT 1), false, 12, NULL),
((SELECT id FROM trips WHERE destino = 'Crucero por el Caribe' LIMIT 1), (SELECT id FROM clients WHERE dni = '55443322' LIMIT 1), true, NULL, 'A205');

-- Insertar algunos pagos de ejemplo
INSERT INTO payments (client_id, trip_id, amount, currency, type, description, receipt_number) VALUES
((SELECT id FROM clients WHERE dni = '12345678' LIMIT 1), (SELECT id FROM trips WHERE destino = 'Bariloche' LIMIT 1), 150000, 'ARS', 'payment', 'Pago completo viaje a Bariloche - Asiento 15', 'REC-001'),
((SELECT id FROM clients WHERE dni = '11223344' LIMIT 1), (SELECT id FROM trips WHERE destino = 'Mendoza' LIMIT 1), 120000, 'ARS', 'payment', 'Pago completo viaje a Mendoza - Asiento 8', 'REC-002'),
((SELECT id FROM clients WHERE dni = '55443322' LIMIT 1), (SELECT id FROM trips WHERE destino = 'Crucero por el Caribe' LIMIT 1), 800, 'USD', 'payment', 'Pago completo crucero por el Caribe - Cabina A205', 'REC-003'),
((SELECT id FROM clients WHERE dni = '87654321' LIMIT 1), (SELECT id FROM trips WHERE destino = 'Bariloche' LIMIT 1), 75000, 'ARS', 'payment', 'Pago parcial viaje a Bariloche - Asiento 16', 'REC-004');
