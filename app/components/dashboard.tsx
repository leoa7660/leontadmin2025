import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Client, Trip, Payment } from "../page"
import { Users, MapPin, DollarSign, Bus } from "lucide-react"

interface DashboardProps {
  clients: Client[]
  trips: Trip[]
  payments: Payment[]
  buses?: any[]
}

export function Dashboard({ clients, trips, payments, buses = [] }: DashboardProps) {
  const totalRevenue = payments.filter((p) => p.type === "payment").reduce((sum, p) => sum + p.amount, 0)

  const pendingTrips = trips.filter((t) => t.status === "pending").length
  const completedTrips = trips.filter((t) => t.status === "completed").length

  const totalBuses = buses?.length || 0
  const totalSeats = buses?.reduce((sum, bus) => sum + bus.asientos, 0) || 0

  const stats = [
    {
      title: "Total Clientes",
      value: clients.length,
      icon: Users,
      description: "Clientes registrados",
    },
    {
      title: "Buses Disponibles",
      value: totalBuses,
      icon: Bus,
      description: `${totalSeats} asientos totales`,
    },
    {
      title: "Viajes Activos",
      value: trips.length,
      icon: MapPin,
      description: "Viajes programados",
    },
    {
      title: "Ingresos Totales",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Facturación total",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Clientes</CardTitle>
            <CardDescription>Clientes registrados recientemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clients.slice(-5).map((client) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
              ))}
              {clients.length === 0 && <p className="text-muted-foreground">No hay clientes registrados</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Viajes</CardTitle>
            <CardDescription>Viajes programados próximamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trips
                .filter((t) => t.status === "confirmed")
                .slice(0, 5)
                .map((trip) => {
                  const client = clients.find((c) => c.id === trip.clientId)
                  return (
                    <div key={trip.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{trip.destination}</p>
                        <p className="text-sm text-muted-foreground">
                          {client?.name} - {trip.startDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              {trips.filter((t) => t.status === "confirmed").length === 0 && (
                <p className="text-muted-foreground">No hay viajes confirmados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
