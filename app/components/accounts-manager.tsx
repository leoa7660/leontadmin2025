"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Client, Trip, Payment, TripPassenger, Bus, User } from "../page"
import {
  Plus,
  Search,
  DollarSign,
  Receipt,
  Printer,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Calendar,
  UserIcon,
  MapPin,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createPayment, updatePayment, deletePayment } from "../actions/database"

interface AccountsManagerProps {
  clients: Client[]
  trips: Trip[]
  payments: Payment[]
  tripPassengers: TripPassenger[]
  buses: Bus[]
  currentUser: User
  onDataChange: () => Promise<void>
}

export function AccountsManager({
  clients,
  trips,
  payments,
  tripPassengers,
  buses,
  currentUser,
  onDataChange,
}: AccountsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    clientId: "",
    tripId: "",
    amount: "",
    currency: "ARS" as "ARS" | "USD",
    type: "payment" as "payment" | "charge",
    description: "",
  })

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dni.includes(searchTerm),
  )

  // Función para obtener el balance de un cliente
  const getClientBalance = (clientId: string) => {
    const clientPayments = payments.filter((p) => p.clientId === clientId)
    const balance = clientPayments.reduce((acc, payment) => {
      if (payment.type === "payment") {
        return acc + payment.amount
      } else {
        return acc - payment.amount
      }
    }, 0)
    return balance
  }

  // Función para obtener los pagos de un cliente
  const getClientPayments = (clientId: string) => {
    return payments.filter((p) => p.clientId === clientId).sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Función para obtener información del viaje
  const getTripInfo = (tripId: string) => {
    return trips.find((t) => t.id === tripId)
  }

  // Función para obtener información del bus
  const getBusInfo = (busId: string) => {
    return buses.find((b) => b.id === busId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const paymentData = {
        clientId: formData.clientId,
        tripId: formData.tripId,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        type: formData.type,
        description: formData.description,
        receiptNumber: `REC-${Date.now()}`,
      }

      if (editingPayment) {
        // Editar pago existente
        await updatePayment(editingPayment.id, paymentData)

        toast({
          title: "Pago actualizado",
          description: "El pago ha sido actualizado exitosamente.",
        })
      } else {
        // Crear nuevo pago
        await createPayment(paymentData)

        toast({
          title: "Pago registrado",
          description: "El pago ha sido registrado exitosamente.",
        })
      }

      // Recargar datos
      await onDataChange()
      resetForm()
    } catch (error) {
      console.error("Error saving payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el pago. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      clientId: "",
      tripId: "",
      amount: "",
      currency: "ARS",
      type: "payment",
      description: "",
    })
    setEditingPayment(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      clientId: payment.clientId,
      tripId: payment.tripId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      type: payment.type,
      description: payment.description,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (paymentId: string) => {
    setIsDeleting(paymentId)

    try {
      await deletePayment(paymentId)
      await onDataChange()

      toast({
        title: "Pago eliminado",
        description: "El pago ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el pago. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const printReceipt = (payment: Payment) => {
    const client = clients.find((c) => c.id === payment.clientId)
    const trip = trips.find((t) => t.id === payment.tripId)
    const bus = trip?.busId ? buses.find((b) => b.id === trip.busId) : null

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Pago - ${payment.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-section { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px; }
            .logo { width: 60px; height: 60px; border-radius: 50%; }
            .company-info { text-align: center; margin-bottom: 15px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin: 0; }
            .company-subtitle { font-size: 14px; color: #666; margin: 0; }
            .receipt-title { font-size: 18px; margin-top: 15px; font-weight: bold; }
            .receipt-number { font-size: 14px; color: #666; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { font-weight: bold; }
            .total-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .total-amount { font-size: 20px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAABQACAwQGAQf/xAAsEAACAQMDAgUEAwEAAAAAAAABAgMABBEFEiExQVEGEyJhcTKBkaGx0eHw/8QAGQEAAwEBAQAAAAAAAAAAAAAAAQIDAAQF/8QAIhEAAgICAgICAwAAAAAAAAAAAAECEQMhEjFBUWETInH/2gAMAwEAAhEDEQA/AOqdM1Kx1Kzju7C4S4t5BuV0OQR/tTqmgdM0+fTdOt7O8uFuLiJNrOhyAf8AKdXQcKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=" alt="LT Tour Operator Logo" class="logo" />
              <div class="company-info">
                <h1 class="company-name">LT Tour Operator</h1>
                <p class="company-subtitle">Tu compañía de confianza para viajar</p>
              </div>
            </div>
            <div class="receipt-title">RECIBO DE PAGO</div>
            <div class="receipt-number">N° ${payment.receiptNumber}</div>
          </div>

          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span>${client?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">DNI:</span>
              <span>${client?.dni || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${client?.email || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span>${client?.phone || "N/A"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalles del Pago</div>
            <div class="info-row">
              <span class="info-label">Concepto:</span>
              <span>${payment.description}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span>${payment.date.toLocaleDateString()}</span>
            </div>
            {trip && (
              <>
                <div class="info-row">
                  <span class="info-label">Viaje:</span>
                  <span>{trip.destino}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha de Salida:</span>
                  <span>{trip.fechaSalida.toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>

          <div class="total-section">
            <div class="info-row">
              <span class="info-label">TOTAL PAGADO:</span>
              <span class="total-amount">${payment.currency === "USD" ? "US$" : "$"}${payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>LT Tour Operator</strong> - Tu compañía de confianza para viajar</p>
            <p>Gracias por confiar en nosotros</p>
            <p>Recibo generado el ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
              Imprimir Recibo
            </button>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.focus()
    }
  }

  const exportClientStatement = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    const clientPayments = getClientPayments(clientId)
    const balance = getClientBalance(clientId)

    if (!client) return

    const statementData = {
      client: {
        name: client.name,
        dni: client.dni,
        email: client.email,
        phone: client.phone,
      },
      balance,
      payments: clientPayments.map((payment) => ({
        date: payment.date.toISOString(),
        description: payment.description,
        amount: payment.amount,
        currency: payment.currency,
        type: payment.type,
        receiptNumber: payment.receiptNumber,
      })),
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(statementData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estado-cuenta-${client.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Cuentas Corrientes</CardTitle>
              <CardDescription>Administra pagos, cobros y estados de cuenta de los clientes</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingPayment(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingPayment ? "Editar Movimiento" : "Nuevo Movimiento"}</DialogTitle>
                  <DialogDescription>
                    {editingPayment ? "Modifica los datos del movimiento" : "Registra un nuevo pago o cargo"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">
                        Cliente <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.dni}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="trip">Viaje (opcional)</Label>
                      <Select
                        value={formData.tripId}
                        onValueChange={(value) => setFormData({ ...formData, tripId: value })}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar viaje" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin viaje asociado</SelectItem>
                          {trips
                            .filter((trip) => !trip.archived)
                            .map((trip) => (
                              <SelectItem key={trip.id} value={trip.id}>
                                {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">
                          Tipo <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value as "payment" | "charge" })}
                          required
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Pago (Ingreso)
                              </div>
                            </SelectItem>
                            <SelectItem value="charge">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                Cargo (Débito)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="currency">
                          Moneda <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value as "ARS" | "USD" })}
                          required
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ARS">🇦🇷 Pesos Argentinos (ARS)</SelectItem>
                            <SelectItem value="USD">🇺🇸 Dólares Americanos (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="amount">
                        Monto <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">
                        Descripción <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ej: Pago por viaje a Bariloche"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingPayment ? "Guardar Cambios" : "Registrar Movimiento"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clients">Estados de Cuenta</TabsTrigger>
              <TabsTrigger value="payments">Todos los Movimientos</TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre, email o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Último Movimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => {
                      const balance = getClientBalance(client.id)
                      const clientPayments = getClientPayments(client.id)
                      const lastPayment = clientPayments[0]

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.dni}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={balance >= 0 ? "default" : "destructive"}
                              className="flex items-center gap-1"
                            >
                              <DollarSign className="h-3 w-3" />
                              {balance.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lastPayment ? (
                              <div className="text-sm">
                                <div>{lastPayment.date.toLocaleDateString()}</div>
                                <div className="text-muted-foreground">{lastPayment.description}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sin movimientos</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
                                    <Receipt className="h-4 w-4 mr-1" />
                                    Ver Estado
                                  </Button>
                                </DialogTrigger>
                                {selectedClient && (
                                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <UserIcon className="h-5 w-5" />
                                        Estado de Cuenta - {selectedClient.name}
                                      </DialogTitle>
                                      <DialogDescription>
                                        DNI: {selectedClient.dni} | Email: {selectedClient.email}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                        <div>
                                          <h3 className="font-semibold">Balance Actual</h3>
                                          <p className="text-sm text-muted-foreground">
                                            Actualizado al {new Date().toLocaleDateString()}
                                          </p>
                                        </div>
                                        <Badge
                                          variant={balance >= 0 ? "default" : "destructive"}
                                          className="text-lg px-3 py-1"
                                        >
                                          <DollarSign className="h-4 w-4 mr-1" />
                                          {balance.toLocaleString()}
                                        </Badge>
                                      </div>

                                      {clientPayments.length > 0 ? (
                                        <div className="space-y-2">
                                          <h4 className="font-semibold">Historial de Movimientos</h4>
                                          <div className="border rounded-lg">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Fecha</TableHead>
                                                  <TableHead>Descripción</TableHead>
                                                  <TableHead>Viaje</TableHead>
                                                  <TableHead>Tipo</TableHead>
                                                  <TableHead>Monto</TableHead>
                                                  <TableHead>Acciones</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {clientPayments.map((payment) => {
                                                  const trip = getTripInfo(payment.tripId)
                                                  return (
                                                    <TableRow key={payment.id}>
                                                      <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                                                      <TableCell>{payment.description}</TableCell>
                                                      <TableCell>
                                                        {trip ? (
                                                          <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {trip.destino}
                                                          </div>
                                                        ) : (
                                                          <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Badge
                                                          variant={
                                                            payment.type === "payment" ? "default" : "destructive"
                                                          }
                                                        >
                                                          {payment.type === "payment" ? "Pago" : "Cargo"}
                                                        </Badge>
                                                      </TableCell>
                                                      <TableCell>
                                                        <span
                                                          className={
                                                            payment.type === "payment"
                                                              ? "text-green-600 font-medium"
                                                              : "text-red-600 font-medium"
                                                          }
                                                        >
                                                          {payment.type === "payment" ? "+" : "-"}$
                                                          {payment.amount.toLocaleString()} {payment.currency}
                                                        </span>
                                                      </TableCell>
                                                      <TableCell>
                                                        <div className="flex items-center space-x-1">
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => printReceipt(payment)}
                                                          >
                                                            <Printer className="h-3 w-3" />
                                                          </Button>
                                                          {currentUser.role === "admin" && (
                                                            <Button
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => handleEdit(payment)}
                                                            >
                                                              Editar
                                                            </Button>
                                                          )}
                                                        </div>
                                                      </TableCell>
                                                    </TableRow>
                                                  )
                                                })}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                          <p>No hay movimientos registrados para este cliente</p>
                                        </div>
                                      )}
                                    </div>

                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => exportClientStatement(client.id)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Exportar Estado
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                )}
                              </Dialog>

                              <Button variant="outline" size="sm" onClick={() => exportClientStatement(client.id)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Viaje</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Recibo</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((payment) => {
                        const client = clients.find((c) => c.id === payment.clientId)
                        const trip = getTripInfo(payment.tripId)

                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {payment.date.toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{client?.name || "Cliente eliminado"}</TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell>
                              {trip ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {trip.destino}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={payment.type === "payment" ? "default" : "destructive"}>
                                {payment.type === "payment" ? "Pago" : "Cargo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  payment.type === "payment" ? "text-green-600 font-medium" : "text-red-600 font-medium"
                                }
                              >
                                {payment.type === "payment" ? "+" : "-"}${payment.amount.toLocaleString()}{" "}
                                {payment.currency}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment.receiptNumber ? (
                                <Badge variant="outline">{payment.receiptNumber}</Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => printReceipt(payment)}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {currentUser.role === "admin" && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(payment)}>
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(payment.id)}
                                      disabled={isDeleting === payment.id}
                                    >
                                      {isDeleting === payment.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Eliminar"
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados</p>
                    <p className="text-sm">Comienza registrando el primer pago o cargo</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
