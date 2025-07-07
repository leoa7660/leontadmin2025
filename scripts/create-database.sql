-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipos enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'readonly');
CREATE TYPE currency_type AS ENUM ('ARS', 'USD');
CREATE TYPE trip_type AS ENUM ('grupal', 'individual', 'crucero', 'aereo');
CREATE TYPE payment_type AS ENUM ('payment', 'charge');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'operator',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  vencimiento_dni DATE,
  numero_pasaporte TEXT UNIQUE,
  vencimiento_pasaporte DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT valid_dni CHECK (length(dni) >= 7 AND dni ~ '^[0-9]+$'),
  CONSTRAINT valid_birth_date CHECK (fecha_nacimiento <= CURRENT_DATE),
  CONSTRAINT valid_dni_expiration CHECK (vencimiento_dni IS NULL OR vencimiento_dni > fecha_nacimiento),
  CONSTRAINT valid_passport_expiration CHECK (vencimiento_pasaporte IS NULL OR vencimiento_pasaporte > fecha_nacimiento)
);

-- Tabla de buses
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patente TEXT NOT NULL UNIQUE,
  asientos INTEGER NOT NULL CHECK (asientos > 0 AND asientos <= 100),
  tipo_servicio TEXT NOT NULL,
  imagen_distribucion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de viajes
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  destino TEXT NOT NULL,
  fecha_salida TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_regreso TIMESTAMP WITH TIME ZONE NOT NULL,
  importe DECIMAL(12, 2) NOT NULL CHECK (importe >= 0),
  currency currency_type NOT NULL DEFAULT 'ARS',
  type trip_type NOT NULL,
  descripcion TEXT NOT NULL,
  naviera TEXT,
  barco TEXT,
  cabina TEXT,
  aerolinea TEXT,
  numero_vuelo TEXT,
  clase TEXT,
  escalas TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (fecha_regreso >= fecha_salida),
  CONSTRAINT bus_required_for_grupal CHECK (
    (type = 'grupal' AND bus_id IS NOT NULL) OR 
    (type != 'grupal')
  ),
  CONSTRAINT cruise_fields_required CHECK (
    (type = 'crucero' AND naviera IS NOT NULL AND barco IS NOT NULL) OR 
    (type != 'crucero')
  ),
  CONSTRAINT flight_fields_required CHECK (
    (type = 'aereo' AND aerolinea IS NOT NULL AND numero_vuelo IS NOT NULL) OR 
    (type != 'aereo')
  )
);

-- Tabla de pasajeros de viajes
CREATE TABLE IF NOT EXISTS trip_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  fecha_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pagado BOOLEAN DEFAULT FALSE,
  numero_asiento INTEGER CHECK (numero_asiento > 0),
  numero_cabina TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un cliente no puede estar dos veces en el mismo viaje
  UNIQUE(trip_id, client_id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount != 0),
  currency currency_type NOT NULL DEFAULT 'ARS',
  type payment_type NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trip_passengers_updated_at BEFORE UPDATE ON trip_passengers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insertar usuarios por defecto
INSERT INTO users (username, password, name, email, role) VALUES
('admin', 'admin123', 'Administrador', 'admin@ltour.com', 'admin'),
('operador', 'op123', 'Operador', 'operador@ltour.com', 'operator'),
('ltour', 'ltour2024', 'LT Tour Manager', 'manager@ltour.com', 'manager')
ON CONFLICT (username) DO NOTHING;

-- Crear índices optimizados
CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni);
CREATE INDEX IF NOT EXISTS idx_clients_name_gin ON clients USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_expiring_docs ON clients(vencimiento_dni, vencimiento_pasaporte) WHERE vencimiento_dni IS NOT NULL OR vencimiento_pasaporte IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_fecha_salida ON trips(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_trips_type ON trips(type);
CREATE INDEX IF NOT EXISTS idx_trips_archived ON trips(archived);
CREATE INDEX IF NOT EXISTS idx_trips_destino_gin ON trips USING gin(to_tsvector('spanish', destino));

CREATE INDEX IF NOT EXISTS idx_trip_passengers_trip_id ON trip_passengers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_client_id ON trip_passengers(client_id);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_pagado ON trip_passengers(pagado);

CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora, se puede refinar después)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON buses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON trips FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON trip_passengers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON payments FOR ALL USING (true);

-- Crear vistas útiles
CREATE OR REPLACE VIEW client_summary AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone,
  c.dni,
  EXTRACT(YEAR FROM AGE(c.fecha_nacimiento)) as age,
  CASE 
    WHEN c.vencimiento_dni IS NOT NULL AND c.vencimiento_dni < NOW() + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN c.vencimiento_dni IS NOT NULL AND c.vencimiento_dni < NOW() THEN 'expired'
    ELSE 'valid'
  END as dni_status,
  CASE 
    WHEN c.vencimiento_pasaporte IS NOT NULL AND c.vencimiento_pasaporte < NOW() + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN c.vencimiento_pasaporte IS NOT NULL AND c.vencimiento_pasaporte < NOW() THEN 'expired'
    ELSE 'valid'
  END as passport_status,
  COUNT(tp.id) as total_trips,
  COALESCE(SUM(CASE WHEN tp.pagado THEN 1 ELSE 0 END), 0) as paid_trips
FROM clients c
LEFT JOIN trip_passengers tp ON c.id = tp.client_id
GROUP BY c.id, c.name, c.email, c.phone, c.dni, c.fecha_nacimiento, c.vencimiento_dni, c.vencimiento_pasaporte;

-- Crear vista de balance de clientes
CREATE OR REPLACE VIEW client_balance AS
SELECT 
  c.id as client_id,
  c.name,
  COALESCE(SUM(CASE WHEN p.type = 'charge' THEN p.amount ELSE -p.amount END), 0) as balance_ars,
  COALESCE(SUM(CASE WHEN p.type = 'charge' AND p.currency = 'USD' THEN p.amount 
                   WHEN p.type = 'payment' AND p.currency = 'USD' THEN -p.amount 
                   ELSE 0 END), 0) as balance_usd
FROM clients c
LEFT JOIN payments p ON c.id = p.client_id
GROUP BY c.id, c.name;
