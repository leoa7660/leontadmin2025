"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ClientsManager } from "./components/clients-manager"
import { TripsManager } from "./components/trips-manager"
import { AccountsManager } from "./components/accounts-manager"
import { Dashboard } from "./components/dashboard"
import { Login } from "./components/login"
import { UsersManager } from "./components/users-manager"
import { Users, MapPin, CreditCard, BarChart3, BusIcon, LogOut, Shield, Database } from "lucide-react"
import { BusesManager } from "./components/buses-manager"
import Image from "next/image"
import { BackupManager } from "./components/backup-manager"
import {
  getUsers,
  getClients,
  getTrips,
  getPayments,
  getBuses,
  getTripPassengers,
  authenticateUser,
} from "./actions/database"

// Tipos de datos (mantener los mismos que ya tienes)
export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  dni: string
  fechaNacimiento: Date
  vencimientoDni?: Date
  numeroPasaporte?: string
  vencimientoPasaporte?: Date
  createdAt: Date
}

export interface Bus {
  id: string
  patente: string
  asientos: number
  tipoServicio: string
  createdAt: Date
  imagenDistribucion?: string // Nueva propiedad para la imagen de distribución
}

// Interfaz Trip expandida para incluir cruceros y aéreos
export interface Trip {
  id: string
  busId?: string // Solo para viajes grupales
  destino: string
  fechaSalida: Date
  fechaRegreso: Date
  importe: number
  currency: "ARS" | "USD"
  type: "grupal" | "individual" | "crucero" | "aereo" // Nuevos tipos agregados
  descripcion: string
  createdAt: Date
  archived?: boolean

  // Campos específicos para cruceros
  naviera?: string // Nombre de la naviera
  barco?: string // Nombre del barco
  cabina?: string // Tipo de cabina

  // Campos específicos para aéreos
  aerolinea?: string // Nombre de la aerolínea
  numeroVuelo?: string // Número de vuelo
  clase?: string // Clase del vuelo (económica, ejecutiva, primera)
  escalas?: string // Información sobre escalas
}

export interface TripPassenger {
  id: string
  tripId: string
  clientId: string
  fechaReserva: Date
  pagado: boolean
  numeroAsiento: number // Para grupales y aéreos
  numeroCabina?: string // Para cruceros
}

export interface Payment {
  id: string
  clientId: string
  tripId: string
  amount: number
  currency: "ARS" | "USD" // Nueva propiedad para la moneda
  type: "payment" | "charge"
  description: string
  date: Date
  receiptNumber?: string
}

export interface User {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: "admin" | "manager" | "operator" | "readonly"
  createdAt: Date
  isActive: boolean
}

export default function TravelAgencyApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [tripPassengers, setTripPassengers] = useState<TripPassenger[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Cargar todos los datos cuando el usuario se autentica
  const loadAllData = async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const [usersData, clientsData, tripsData, paymentsData, busesData, tripPassengersData] = await Promise.all([
        getUsers(),
        getClients(),
        getTrips(),
        getPayments(),
        getBuses(),
        getTripPassengers(),
      ])

      setUsers(usersData)
      setClients(clientsData)
      setTrips(tripsData)
      setPayments(paymentsData)
      setBuses(busesData)
      setTripPassengers(tripPassengersData)
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error al cargar los datos. Por favor, recarga la página.")
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadAllData()
    }
  }, [isAuthenticated, currentUser])

  const handleLogin = async (username: string, password: string) => {
    try {
      const user = await authenticateUser(username, password)
      if (user) {
        setCurrentUser(user)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      console.error("Error during authentication:", error)
      return false
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setClients([])
    setTrips([])
    setPayments([])
    setBuses([])
    setTripPassengers([])
    setUsers([])
  }

  // Función para verificar permisos
  const hasPermission = (permission: string) => {
    if (!currentUser) return false
    if (currentUser.role === "admin") return true

    const rolePermissions: Record<string, string[]> = {
      manager: ["clients", "trips", "accounts", "buses", "dashboard"],
      operator: ["clients", "trips", "accounts", "dashboard"],
      readonly: ["dashboard"],
    }

    return rolePermissions[currentUser.role]?.includes(permission) || false
  }

  // Si no está autenticado, mostrar pantalla de login
  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} users={[]} />
  }

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando datos...</h2>
          <p className="text-gray-500">Por favor espera mientras conectamos con la base de datos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.jfif"
                alt="LT Tour Operator Logo"
                width={80}
                height={80}
                className="rounded-full shadow-lg"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Gestión - LT Tour Operator</h1>
                <p className="text-gray-600">Gestiona clientes, viajes y facturación de manera eficiente</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Conectado a la base de datos</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Bienvenido,</p>
                <p className="font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue={currentUser.role === "admin" ? "dashboard" : "clients"} className="space-y-6">
          <TabsList
            className={`grid w-full ${currentUser.role === "admin" ? "grid-cols-7" : "grid-cols-5"} lg:w-[1050px]`}
          >
            {currentUser.role === "admin" && (
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
            )}
            {hasPermission("clients") && (
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pasajeros
              </TabsTrigger>
            )}
            {hasPermission("buses") && (
              <TabsTrigger value="buses" className="flex items-center gap-2">
                <BusIcon className="h-4 w-4" />
                Buses
              </TabsTrigger>
            )}
            {hasPermission("trips") && (
              <TabsTrigger value="trips" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Viajes
              </TabsTrigger>
            )}
            {hasPermission("accounts") && (
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cuentas
              </TabsTrigger>
            )}
            {currentUser.role === "admin" && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
            )}
            {currentUser.role === "admin" && (
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backup
              </TabsTrigger>
            )}
          </TabsList>

          {currentUser.role === "admin" && (
            <TabsContent value="dashboard">
              <Dashboard clients={clients} trips={trips} payments={payments} buses={buses} />
            </TabsContent>
          )}

          {hasPermission("clients") && (
            <TabsContent value="clients">
              <ClientsManager clients={clients} setClients={setClients} onDataChange={loadAllData} />
            </TabsContent>
          )}

          {hasPermission("buses") && (
            <TabsContent value="buses">
              <BusesManager buses={buses} setBuses={setBuses} onDataChange={loadAllData} />
            </TabsContent>
          )}

          {hasPermission("trips") && (
            <TabsContent value="trips">
              <TripsManager
                trips={trips}
                setTrips={setTrips}
                buses={buses}
                clients={clients}
                tripPassengers={tripPassengers}
                setTripPassengers={setTripPassengers}
                payments={payments}
                setPayments={setPayments}
                onDataChange={loadAllData}
              />
            </TabsContent>
          )}

          {hasPermission("accounts") && (
            <TabsContent value="accounts">
              <AccountsManager
                clients={clients}
                trips={trips}
                payments={payments}
                setPayments={setPayments}
                tripPassengers={tripPassengers}
                buses={buses}
                currentUser={currentUser}
                onDataChange={loadAllData}
              />
            </TabsContent>
          )}

          {currentUser.role === "admin" && (
            <TabsContent value="users">
              <UsersManager users={users} setUsers={setUsers} currentUser={currentUser} onDataChange={loadAllData} />
            </TabsContent>
          )}
          {currentUser.role === "admin" && (
            <TabsContent value="backup">
              <BackupManager
                clients={clients}
                setClients={setClients}
                trips={trips}
                payments={payments}
                tripPassengers={tripPassengers}
                buses={buses}
                onDataChange={loadAllData}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
