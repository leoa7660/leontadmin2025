-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'readonly')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  dni TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  vencimiento_dni DATE,
  numero_pasaporte TEXT,
  vencimiento_pasaporte DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de buses
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patente TEXT NOT NULL UNIQUE,
  asientos INTEGER NOT NULL,
  tipo_servicio TEXT NOT NULL,
  imagen_distribucion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de viajes
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id UUID REFERENCES buses(id),
  destino TEXT NOT NULL,
  fecha_salida TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_regreso TIMESTAMP WITH TIME ZONE NOT NULL,
  importe DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  type TEXT NOT NULL CHECK (type IN ('grupal', 'individual', 'crucero', 'aereo')),
  descripcion TEXT NOT NULL,
  naviera TEXT,
  barco TEXT,
  cabina TEXT,
  aerolinea TEXT,
  numero_vuelo TEXT,
  clase TEXT,
  escalas TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasajeros de viajes
CREATE TABLE IF NOT EXISTS trip_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  fecha_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pagado BOOLEAN DEFAULT FALSE,
  numero_asiento INTEGER,
  numero_cabina TEXT,
  UNIQUE(trip_id, client_id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('ARS', 'USD')),
  type TEXT NOT NULL CHECK (type IN ('payment', 'charge')),
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receipt_number TEXT
);

-- Insertar usuarios por defecto
INSERT INTO users (username, password, name, email, role) VALUES
('admin', 'admin123', 'Administrador', 'admin@ltour.com', 'admin'),
('operador', 'op123', 'Operador', 'operador@ltour.com', 'operator'),
('ltour', 'ltour2024', 'LT Tour Manager', 'manager@ltour.com', 'manager')
ON CONFLICT (username) DO NOTHING;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_trips_fecha_salida ON trips(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_trips_type ON trips(type);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_trip_id ON trip_passengers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_client_id ON trip_passengers(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);

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
