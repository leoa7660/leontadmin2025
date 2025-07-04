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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Client, Trip, Payment, TripPassenger, Bus, User } from "../page"
import {
  Plus,
  DollarSign,
  Receipt,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  Printer,
  Loader2,
  Users,
  Eye,
  Edit,
  Trash2,
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    clientId: "",
    tripId: "",
    amount: "",
    currency: "ARS",
    type: "payment",
    description: "",
    receiptNumber: "",
  })

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dni.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calcular balance por cliente
  const getClientBalance = (clientId: string) => {
    const clientPayments = payments.filter((p) => p.clientId === clientId)
    const clientTrips = tripPassengers
      .filter((tp) => tp.clientId === clientId)
      .map((tp) => trips.find((t) => t.id === tp.tripId))
      .filter(Boolean) as Trip[]

    const totalCharges = clientTrips.reduce((sum, trip) => sum + trip.importe, 0)
    const totalPayments = clientPayments
      .filter((p) => p.type === "payment")
      .reduce((sum, payment) => sum + payment.amount, 0)
    const additionalCharges = clientPayments
      .filter((p) => p.type === "charge")
      .reduce((sum, payment) => sum + payment.amount, 0)

    return {
      totalCharges: totalCharges + additionalCharges,
      totalPayments,
      balance: totalCharges + additionalCharges - totalPayments,
      trips: clientTrips,
      payments: clientPayments,
    }
  }

  // Obtener viajes disponibles para un cliente
  const getAvailableTripsForClient = (clientId: string) => {
    const clientTripIds = tripPassengers.filter((tp) => tp.clientId === clientId).map((tp) => tp.tripId)
    return trips.filter((trip) => clientTripIds.includes(trip.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const paymentData = {
        clientId: formData.clientId,
        tripId: formData.tripId,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency as "ARS" | "USD",
        type: formData.type as "payment" | "charge",
        description: formData.description,
        receiptNumber: formData.receiptNumber || `REC-${Date.now()}`,
      }

      await createPayment(paymentData)
      await onDataChange()

      toast({
        title: formData.type === "payment" ? "Pago registrado" : "Cargo agregado",
        description: `${formData.type === "payment" ? "El pago" : "El cargo"} ha sido registrado exitosamente.`,
      })

      resetForm()
    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al registrar el movimiento. Por favor, intenta de nuevo.",
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
      receiptNumber: "",
    })
    setIsDialogOpen(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPayment) return

    setIsLoading(true)

    try {
      const paymentData = {
        clientId: formData.clientId,
        tripId: formData.tripId,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency as "ARS" | "USD",
        type: formData.type as "payment" | "charge",
        description: formData.description,
        receiptNumber: formData.receiptNumber,
      }

      await updatePayment(editingPayment.id, paymentData)
      await onDataChange()

      toast({
        title: "Movimiento actualizado",
        description: "El movimiento ha sido actualizado exitosamente.",
      })

      resetEditForm()
    } catch (error) {
      console.error("Error updating payment:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al actualizar el movimiento. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetEditForm = () => {
    setFormData({
      clientId: "",
      tripId: "",
      amount: "",
      currency: "ARS",
      type: "payment",
      description: "",
      receiptNumber: "",
    })
    setEditingPayment(null)
    setIsEditDialogOpen(false)
  }

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      clientId: payment.clientId,
      tripId: payment.tripId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      type: payment.type,
      description: payment.description,
      receiptNumber: payment.receiptNumber || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este movimiento?")) return

    setIsDeleting(paymentId)

    try {
      await deletePayment(paymentId)
      await onDataChange()

      toast({
        title: "Movimiento eliminado",
        description: "El movimiento ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el movimiento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const printReceipt = (payment: Payment) => {
    const client = clients.find((c) => c.id === payment.clientId)
    const trip = trips.find((t) => t.id === payment.tripId)
    const passenger = tripPassengers.find((p) => p.clientId === payment.clientId && p.tripId === payment.tripId)
    const bus = trip?.busId ? buses.find((b) => b.id === trip.busId) : null

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${payment.receiptNumber}</title>
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
            <div class="receipt-title">${payment.type === "payment" ? "RECIBO DE PAGO" : "COMPROBANTE DE CARGO"}</div>
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
            <div class="section-title">Detalles del Movimiento</div>
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span>${payment.type === "payment" ? "Pago" : "Cargo"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Descripción:</span>
              <span>${payment.description}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span>${payment.date.toLocaleDateString()}</span>
            </div>
            ${
              trip
                ? `
            <div class="info-row">
              <span class="info-label">Viaje:</span>
              <span>${trip.destino} - ${trip.fechaSalida.toLocaleDateString()}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="total-section">
            <div class="info-row">
              <span class="info-label">TOTAL ${payment.type === "payment" ? "PAGADO" : "CARGADO"}:</span>
              <span class="total-amount">${payment.currency === "USD" ? "US$" : "$"}${payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>LT Tour Operator</strong> - Tu compañía de confianza para viajar</p>
            <p>Gracias por confiar en nosotros</p>
            <p>Comprobante generado el ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
              Imprimir Comprobante
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

  const printAccountStatement = (client: Client) => {
    const balance = getClientBalance(client.id)

    const statementContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estado de Cuenta - ${client.name}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .logo-section { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px; }
            .logo { width: 60px; height: 60px; border-radius: 50%; }
            .company-info { text-align: center; margin-bottom: 15px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin: 0; }
            .company-subtitle { font-size: 14px; color: #666; margin: 0; }
            .statement-title { font-size: 20px; margin-top: 15px; font-weight: bold; }
            .client-name { font-size: 16px; color: #666; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #2563eb; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { font-weight: bold; }
            .summary-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .balance-positive { color: #28a745; font-weight: bold; }
            .balance-negative { color: #dc3545; font-weight: bold; }
            .balance-zero { color: #6c757d; font-weight: bold; }
            .movements-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .movements-table th, .movements-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .movements-table th { background-color: #f8f9fa; font-weight: bold; }
            .payment { color: #28a745; }
            .charge { color: #dc3545; }
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
            <div class="statement-title">ESTADO DE CUENTA</div>
            <div class="client-name">${client.name}</div>
          </div>

          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span>${client.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">DNI:</span>
              <span>${client.dni}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${client.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span>${client.phone}</span>
            </div>
          </div>

          <div class="summary-section">
            <div class="section-title">Resumen de Cuenta</div>
            <div class="info-row">
              <span class="info-label">Total Cargos:</span>
              <span>$${balance.totalCharges.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Pagos:</span>
              <span class="payment">$${balance.totalPayments.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">SALDO:</span>
              <span class="${balance.balance > 0 ? "balance-negative" : balance.balance < 0 ? "balance-positive" : "balance-zero"}">
                $${Math.abs(balance.balance).toLocaleString()} ${balance.balance > 0 ? "(Debe)" : balance.balance < 0 ? "(A favor)" : ""}
              </span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalle de Movimientos</div>
            <table class="movements-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                ${balance.payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(
                    (payment) => `
                  <tr>
                    <td>${payment.date.toLocaleDateString()}</td>
                    <td>${payment.description}</td>
                    <td class="${payment.type}">${payment.type === "payment" ? "Pago" : "Cargo"}</td>
                    <td class="${payment.type}">$${payment.amount.toLocaleString()}</td>
                    <td>${payment.receiptNumber || "-"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>LT Tour Operator</strong> - Tu compañía de confianza para viajar</p>
            <p>Estado de cuenta generado el ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
              Imprimir Estado de Cuenta
            </button>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(statementContent)
      printWindow.document.close()
      printWindow.focus()
    }
  }

  const exportAccountStatement = (client: Client) => {
    const balance = getClientBalance(client.id)
    const csvContent = [
      ["Estado de Cuenta - " + client.name],
      [""],
      ["Cliente", client.name],
      ["DNI", client.dni],
      ["Email", client.email],
      ["Teléfono", client.phone],
      [""],
      ["Resumen"],
      ["Total Cargos", balance.totalCharges],
      ["Total Pagos", balance.totalPayments],
      ["Saldo", balance.balance],
      [""],
      ["Detalle de Movimientos"],
      ["Fecha", "Descripción", "Tipo", "Monto", "Recibo"],
      ...balance.payments.map((payment) => [
        payment.date.toLocaleDateString(),
        payment.description,
        payment.type === "payment" ? "Pago" : "Cargo",
        payment.amount,
        payment.receiptNumber || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `estado_cuenta_${client.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Cuentas</CardTitle>
              <CardDescription>Administra pagos, cargos y estados de cuenta de los clientes</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nuevo Movimiento</DialogTitle>
                  <DialogDescription>Registra un nuevo pago o cargo en la cuenta del cliente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">Cliente</Label>
                      <Select
                        value={formData.clientId}
                        onValueChange={(value) => setFormData({ ...formData, clientId: value, tripId: "" })}
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
                        disabled={!formData.clientId || isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar viaje" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin viaje específico</SelectItem>
                          {formData.clientId &&
                            getAvailableTripsForClient(formData.clientId).map((trip) => (
                              <SelectItem key={trip.id} value={trip.id}>
                                {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                          required
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment">💰 Pago</SelectItem>
                            <SelectItem value="charge">📋 Cargo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="currency">Moneda</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
                      <Label htmlFor="amount">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ej: Pago por viaje a Bariloche, Cargo por servicios adicionales..."
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="receiptNumber">Número de Recibo (opcional)</Label>
                      <Input
                        id="receiptNumber"
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        placeholder="Se generará automáticamente si se deja vacío"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Registrar {formData.type === "payment" ? "Pago" : "Cargo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Estados de Cuenta
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Cuenta por Cliente</CardTitle>
              <CardDescription>Visualiza el balance y movimientos de cada cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre, DNI o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-4">
                {filteredClients.map((client) => {
                  const balance = getClientBalance(client.id)
                  return (
                    <Card key={client.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold">{client.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {client.dni} • {client.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Total Cargos</p>
                                <p className="font-semibold">${balance.totalCharges.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Total Pagos</p>
                                <p className="font-semibold text-green-600">
                                  ${balance.totalPayments.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Saldo</p>
                                <p
                                  className={`font-semibold ${
                                    balance.balance > 0
                                      ? "text-red-600"
                                      : balance.balance < 0
                                        ? "text-green-600"
                                        : "text-gray-600"
                                  }`}
                                >
                                  ${Math.abs(balance.balance).toLocaleString()}
                                  {balance.balance > 0 ? " (Debe)" : balance.balance < 0 ? " (A favor)" : ""}
                                </p>
                              </div>
                            </div>
                          </div>

                          {balance.trips.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">Viajes:</p>
                              <div className="flex flex-wrap gap-2">
                                {balance.trips.map((trip) => (
                                  <Badge key={trip.id} variant="outline" className="text-xs">
                                    {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {balance.balance > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pendiente
                            </Badge>
                          )}
                          {balance.balance === 0 && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Al día
                            </Badge>
                          )}
                          {balance.balance < 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />A favor
                            </Badge>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClient(client)}
                            className="bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalle
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printAccountStatement(client)}
                            className="bg-transparent"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Imprimir
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportAccountStatement(client)}
                            className="bg-transparent"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Exportar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No se encontraron clientes que coincidan con la búsqueda.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Movimientos</CardTitle>
              <CardDescription>Historial completo de pagos y cargos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => {
                    const client = clients.find((c) => c.id === payment.clientId)
                    const trip = trips.find((t) => t.id === payment.tripId)
                    return (
                      <Card key={payment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {payment.type === "payment" ? (
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                ) : (
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                )}
                                <Badge variant={payment.type === "payment" ? "default" : "destructive"}>
                                  {payment.type === "payment" ? "Pago" : "Cargo"}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="font-semibold">{client?.name}</h3>
                                <p className="text-sm text-muted-foreground">{payment.description}</p>
                                {trip && (
                                  <p className="text-xs text-muted-foreground">
                                    Viaje: {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Fecha</p>
                                <p className="font-semibold">{payment.date.toLocaleDateString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Monto</p>
                                <p
                                  className={`font-semibold ${
                                    payment.type === "payment" ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {payment.currency === "USD" ? "US$" : "$"}
                                  {payment.amount.toLocaleString()}
                                </p>
                              </div>
                              {payment.receiptNumber && (
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Recibo</p>
                                  <p className="font-semibold text-xs">{payment.receiptNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printReceipt(payment)}
                              className="bg-transparent"
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Imprimir
                            </Button>

                            {(currentUser.role === "admin" || currentUser.role === "manager") && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPayment(payment)}
                                  className="bg-transparent"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePayment(payment.id)}
                                  disabled={isDeleting === payment.id}
                                  className="bg-transparent"
                                >
                                  {isDeleting === payment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}

                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados.</p>
                    <p className="text-sm">Comienza registrando el primer pago o cargo.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para ver detalle de cliente */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Estado de Cuenta - {selectedClient.name}</DialogTitle>
              <DialogDescription>Detalle completo de movimientos y balance</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(() => {
                const balance = getClientBalance(selectedClient.id)
                return (
                  <>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Cargos</p>
                        <p className="text-2xl font-bold">${balance.totalCharges.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Pagos</p>
                        <p className="text-2xl font-bold text-green-600">${balance.totalPayments.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Saldo</p>
                        <p
                          className={`text-2xl font-bold ${
                            balance.balance > 0
                              ? "text-red-600"
                              : balance.balance < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }`}
                        >
                          ${Math.abs(balance.balance).toLocaleString()}
                          {balance.balance > 0 ? " (Debe)" : balance.balance < 0 ? " (A favor)" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Movimientos</h4>
                      {balance.payments.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {balance.payments
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((payment) => {
                              const trip = trips.find((t) => t.id === payment.tripId)
                              return (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between p-3 bg-muted rounded text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        payment.type === "payment" ? "bg-green-500" : "bg-red-500"
                                      }`}
                                    ></div>
                                    <div>
                                      <p className="font-medium">{payment.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {payment.date.toLocaleDateString()}
                                        {trip && ` • ${trip.destino}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`font-semibold ${
                                        payment.type === "payment" ? "text-green-600" : "text-red-600"
                                      }`}
                                    >
                                      {payment.currency === "USD" ? "US$" : "$"}
                                      {payment.amount.toLocaleString()}
                                    </p>
                                    {payment.receiptNumber && (
                                      <p className="text-xs text-muted-foreground">{payment.receiptNumber}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No hay movimientos registrados</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => printAccountStatement(selectedClient)} className="flex-1">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir Estado de Cuenta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportAccountStatement(selectedClient)}
                        className="flex-1 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para editar movimiento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Movimiento</DialogTitle>
            <DialogDescription>Modifica los datos del movimiento existente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-client">Cliente</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value, tripId: "" })}
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
                <Label htmlFor="edit-trip">Viaje (opcional)</Label>
                <Select
                  value={formData.tripId}
                  onValueChange={(value) => setFormData({ ...formData, tripId: value })}
                  disabled={!formData.clientId || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar viaje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin viaje específico</SelectItem>
                    {formData.clientId &&
                      getAvailableTripsForClient(formData.clientId).map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">💰 Pago</SelectItem>
                      <SelectItem value="charge">📋 Cargo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
                <Label htmlFor="edit-amount">Monto</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-receiptNumber">Número de Recibo</Label>
                <Input
                  id="edit-receiptNumber"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetEditForm} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
