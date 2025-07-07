"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Client, Trip, Payment, TripPassenger, Bus, User } from "../page"
import {
  Plus,
  Printer,
  Search,
  Calendar,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  ArrowRightLeft,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createPayment, updatePayment } from "../actions/database"

interface AccountsManagerProps {
  clients: Client[]
  trips: Trip[]
  payments: Payment[]
  setPayments: (payments: Payment[]) => void
  tripPassengers: TripPassenger[]
  buses: Bus[]
  currentUser: User
  onDataChange?: () => Promise<void>
}

export function AccountsManager({
  clients,
  trips,
  payments,
  setPayments,
  tripPassengers,
  buses,
  currentUser,
  onDataChange,
}: AccountsManagerProps) {
  const { toast } = useToast()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState({
    tripId: "",
    amount: "",
    currency: "ARS",
    description: "",
    receiptNumber: "",
  })
  const [chargeData, setChargeData] = useState({
    tripId: "",
    amount: "",
    currency: "ARS",
    description: "",
  })
  const [transferData, setTransferData] = useState({
    targetTripId: "",
    amount: "",
    concept: "", // Nuevo campo para el concepto
  })

  // Filtrar clientes por término de búsqueda
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.dni.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm),
    )
  }, [clients, searchTerm])

  // Obtener pagos de un cliente
  const getClientPayments = (clientId: string) => {
    return payments
      .filter((payment) => payment.clientId === clientId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Obtener viajes de un cliente
  const getClientTrips = (clientId: string) => {
    const clientTripIds = tripPassengers.filter((tp) => tp.clientId === clientId).map((tp) => tp.tripId)
    return trips.filter((trip) => clientTripIds.includes(trip.id))
  }

  // Calcular balance de un cliente
  const getClientBalance = (clientId: string) => {
    const clientPayments = getClientPayments(clientId)
    const balanceARS = clientPayments
      .filter((p) => p.currency === "ARS")
      .reduce((acc, payment) => {
        return payment.type === "payment" ? acc + payment.amount : acc - payment.amount
      }, 0)

    const balanceUSD = clientPayments
      .filter((p) => p.currency === "USD")
      .reduce((acc, payment) => {
        return payment.type === "payment" ? acc + payment.amount : acc - payment.amount
      }, 0)

    return { ARS: balanceARS, USD: balanceUSD }
  }

  // Obtener deuda total de un cliente
  const getClientDebt = (clientId: string) => {
    const clientTrips = getClientTrips(clientId)
    const clientPassengers = tripPassengers.filter((tp) => tp.clientId === clientId)

    let debtARS = 0
    let debtUSD = 0

    clientPassengers.forEach((passenger) => {
      const trip = trips.find((t) => t.id === passenger.tripId)
      if (trip && !passenger.pagado) {
        if (trip.currency === "ARS") {
          debtARS += trip.importe
        } else {
          debtUSD += trip.importe
        }
      }
    })

    return { ARS: debtARS, USD: debtUSD }
  }

  // Obtener estado de cuenta de un cliente
  const getAccountStatus = (clientId: string) => {
    const balance = getClientBalance(clientId)
    const debt = getClientDebt(clientId)

    return {
      balance,
      debt,
      netBalance: {
        ARS: balance.ARS - debt.ARS,
        USD: balance.USD - debt.USD,
      },
    }
  }

  // Manejar pago
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    setIsLoading(true)

    try {
      const newPaymentData: Omit<Payment, "id" | "date"> = {
        clientId: selectedClient.id,
        tripId: paymentData.tripId,
        amount: Number.parseFloat(paymentData.amount),
        currency: paymentData.currency as "ARS" | "USD",
        type: "payment",
        description: paymentData.description,
        receiptNumber: paymentData.receiptNumber || `REC-${Date.now()}`,
      }

      await createPayment(newPaymentData)

      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado exitosamente.",
      })

      resetPaymentForm()

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el pago",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar cargo
  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return
    setIsLoading(true)

    try {
      const newChargeData: Omit<Payment, "id" | "date"> = {
        clientId: selectedClient.id,
        tripId: chargeData.tripId,
        amount: Number.parseFloat(chargeData.amount),
        currency: chargeData.currency as "ARS" | "USD",
        type: "charge",
        description: chargeData.description,
      }

      await createPayment(newChargeData)

      toast({
        title: "Cargo registrado",
        description: "El cargo se ha registrado exitosamente.",
      })

      resetChargeForm()

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error creating charge:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar el cargo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar transferencia
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment || !selectedClient) return
    setIsLoading(true)

    try {
      const transferAmount = Number.parseFloat(transferData.amount)
      const originalAmount = selectedPayment.amount

      if (transferAmount === originalAmount) {
        // Transferencia total - actualizar el pago existente
        await updatePayment(selectedPayment.id, {
          tripId: transferData.targetTripId,
          description: `${selectedPayment.description} - Transferido por: ${transferData.concept}`,
        })
      } else {
        // Transferencia parcial - crear nuevo pago y actualizar el original
        const newPaymentData: Omit<Payment, "id" | "date"> = {
          clientId: selectedClient.id,
          tripId: transferData.targetTripId,
          amount: transferAmount,
          currency: selectedPayment.currency,
          type: selectedPayment.type,
          description: `Transferencia parcial desde ${getOriginalTripName(selectedPayment.tripId)} - Concepto: ${transferData.concept}`,
          receiptNumber: `TRANS-${Date.now()}`,
        }

        await createPayment(newPaymentData)

        // Actualizar el pago original con el monto restante
        await updatePayment(selectedPayment.id, {
          amount: originalAmount - transferAmount,
          description: `${selectedPayment.description} - Transferencia parcial de $${transferAmount} - Concepto: ${transferData.concept}`,
        })
      }

      toast({
        title: "Transferencia realizada",
        description: `Se ha transferido ${transferAmount === originalAmount ? "todo el pago" : `$${transferAmount}`} exitosamente.`,
      })

      resetTransferForm()

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error transferring payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al transferir el pago",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getOriginalTripName = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId)
    return trip ? trip.destino : "Viaje desconocido"
  }

  const resetPaymentForm = () => {
    setPaymentData({
      tripId: "",
      amount: "",
      currency: "ARS",
      description: "",
      receiptNumber: "",
    })
    setIsPaymentDialogOpen(false)
  }

  const resetChargeForm = () => {
    setChargeData({
      tripId: "",
      amount: "",
      currency: "ARS",
      description: "",
    })
    setIsChargeDialogOpen(false)
  }

  const resetTransferForm = () => {
    setTransferData({
      targetTripId: "",
      amount: "",
      concept: "",
    })
    setSelectedPayment(null)
    setIsTransferDialogOpen(false)
  }

  // Obtener viajes disponibles para transferir (mismo cliente, misma moneda, no archivados)
  const getAvailableTripsForTransfer = (payment: Payment) => {
    if (!selectedClient) return []

    const clientTripIds = tripPassengers.filter((tp) => tp.clientId === selectedClient.id).map((tp) => tp.tripId)

    return trips.filter(
      (trip) =>
        clientTripIds.includes(trip.id) &&
        trip.id !== payment.tripId &&
        trip.currency === payment.currency &&
        !trip.archived,
    )
  }

  // Imprimir recibo
  const printReceipt = (payment: Payment) => {
    const client = clients.find((c) => c.id === payment.clientId)
    const trip = trips.find((t) => t.id === payment.tripId)

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${payment.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-size: 20px; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LT Tour Operator</h1>
            <h2>RECIBO DE ${payment.type === "payment" ? "PAGO" : "CARGO"}</h2>
            <p>N° ${payment.receiptNumber || "N/A"}</p>
          </div>
          <div class="info-row"><span>Cliente:</span><span>${client?.name || "N/A"}</span></div>
          <div class="info-row"><span>DNI:</span><span>${client?.dni || "N/A"}</span></div>
          <div class="info-row"><span>Viaje:</span><span>${trip?.destino || "N/A"}</span></div>
          <div class="info-row"><span>Fecha:</span><span>${payment.date.toLocaleDateString()}</span></div>
          <div class="info-row"><span>Concepto:</span><span>${payment.description}</span></div>
          <div class="info-row total">
            <span>TOTAL:</span>
            <span>${payment.currency === "USD" ? "US$" : "$"}${payment.amount.toLocaleString()}</span>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  // Exportar estado de cuenta
  const exportAccountStatement = (client: Client) => {
    const clientPayments = getClientPayments(client.id)
    const accountStatus = getAccountStatus(client.id)

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Fecha,Tipo,Viaje,Descripción,Monto,Moneda,Recibo\n"

    clientPayments.forEach((payment) => {
      const trip = trips.find((t) => t.id === payment.tripId)
      csvContent += `${payment.date.toLocaleDateString()},${payment.type === "payment" ? "Pago" : "Cargo"},${trip?.destino || "N/A"},"${payment.description}",${payment.amount},${payment.currency},${payment.receiptNumber || "N/A"}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `estado_cuenta_${client.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Corrientes</CardTitle>
          <CardDescription>Gestiona los pagos y estados de cuenta de los clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nombre, DNI, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4">
            {filteredClients.map((client) => {
              const accountStatus = getAccountStatus(client.id)
              const clientPayments = getClientPayments(client.id)
              const clientTrips = getClientTrips(client.id)

              return (
                <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader
                    onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                    className="pb-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription>
                          DNI: {client.dni} • {client.email}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4">
                          {accountStatus.netBalance.ARS !== 0 && (
                            <Badge variant={accountStatus.netBalance.ARS > 0 ? "default" : "destructive"}>
                              {accountStatus.netBalance.ARS > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              ${Math.abs(accountStatus.netBalance.ARS).toLocaleString()} ARS
                            </Badge>
                          )}
                          {accountStatus.netBalance.USD !== 0 && (
                            <Badge variant={accountStatus.netBalance.USD > 0 ? "default" : "destructive"}>
                              {accountStatus.netBalance.USD > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              US${Math.abs(accountStatus.netBalance.USD).toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {clientTrips.length} viajes • {clientPayments.length} transacciones
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {selectedClient?.id === client.id && (
                    <CardContent className="pt-0">
                      <Tabs defaultValue="account" className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="account">Estado de Cuenta</TabsTrigger>
                          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
                          <TabsTrigger value="trips">Viajes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="account" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-1">
                                  {accountStatus.balance.ARS !== 0 && (
                                    <div className="text-2xl font-bold text-green-600">
                                      ${accountStatus.balance.ARS.toLocaleString()} ARS
                                    </div>
                                  )}
                                  {accountStatus.balance.USD !== 0 && (
                                    <div className="text-2xl font-bold text-green-600">
                                      US${accountStatus.balance.USD.toLocaleString()}
                                    </div>
                                  )}
                                  {accountStatus.balance.ARS === 0 && accountStatus.balance.USD === 0 && (
                                    <div className="text-2xl font-bold text-muted-foreground">$0</div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Deuda Pendiente</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-1">
                                  {accountStatus.debt.ARS !== 0 && (
                                    <div className="text-2xl font-bold text-red-600">
                                      ${accountStatus.debt.ARS.toLocaleString()} ARS
                                    </div>
                                  )}
                                  {accountStatus.debt.USD !== 0 && (
                                    <div className="text-2xl font-bold text-red-600">
                                      US${accountStatus.debt.USD.toLocaleString()}
                                    </div>
                                  )}
                                  {accountStatus.debt.ARS === 0 && accountStatus.debt.USD === 0 && (
                                    <div className="text-2xl font-bold text-muted-foreground">$0</div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-1">
                                  {accountStatus.netBalance.ARS !== 0 && (
                                    <div
                                      className={`text-2xl font-bold ${accountStatus.netBalance.ARS > 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      ${Math.abs(accountStatus.netBalance.ARS).toLocaleString()} ARS
                                    </div>
                                  )}
                                  {accountStatus.netBalance.USD !== 0 && (
                                    <div
                                      className={`text-2xl font-bold ${accountStatus.netBalance.USD > 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      US${Math.abs(accountStatus.netBalance.USD).toLocaleString()}
                                    </div>
                                  )}
                                  {accountStatus.netBalance.ARS === 0 && accountStatus.netBalance.USD === 0 && (
                                    <div className="text-2xl font-bold text-muted-foreground">$0</div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                              <DialogTrigger asChild>
                                <Button disabled={isLoading}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Registrar Pago
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registrar Pago</DialogTitle>
                                  <DialogDescription>Registra un nuevo pago del cliente</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handlePayment}>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="payment-trip">Viaje</Label>
                                      <Select
                                        value={paymentData.tripId}
                                        onValueChange={(value) => setPaymentData({ ...paymentData, tripId: value })}
                                        required
                                        disabled={isLoading}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar viaje" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {clientTrips.map((trip) => (
                                            <SelectItem key={trip.id} value={trip.id}>
                                              {trip.destino} - {trip.fechaSalida.toLocaleDateString()} (
                                              {trip.currency === "USD" ? "US$" : "$"}
                                              {trip.importe.toLocaleString()})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="payment-amount">Monto</Label>
                                        <Input
                                          id="payment-amount"
                                          type="number"
                                          value={paymentData.amount}
                                          onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                          required
                                          disabled={isLoading}
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="payment-currency">Moneda</Label>
                                        <Select
                                          value={paymentData.currency}
                                          onValueChange={(value) => setPaymentData({ ...paymentData, currency: value })}
                                          required
                                          disabled={isLoading}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="payment-description">Descripción</Label>
                                      <Textarea
                                        id="payment-description"
                                        value={paymentData.description}
                                        onChange={(e) =>
                                          setPaymentData({ ...paymentData, description: e.target.value })
                                        }
                                        disabled={isLoading}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="payment-receipt">N° de Recibo (opcional)</Label>
                                      <Input
                                        id="payment-receipt"
                                        value={paymentData.receiptNumber}
                                        onChange={(e) =>
                                          setPaymentData({ ...paymentData, receiptNumber: e.target.value })
                                        }
                                        disabled={isLoading}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Registrar Pago"}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" disabled={isLoading}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Registrar Cargo
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registrar Cargo</DialogTitle>
                                  <DialogDescription>Registra un nuevo cargo para el cliente</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCharge}>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="charge-trip">Viaje</Label>
                                      <Select
                                        value={chargeData.tripId}
                                        onValueChange={(value) => setChargeData({ ...chargeData, tripId: value })}
                                        required
                                        disabled={isLoading}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar viaje" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {clientTrips.map((trip) => (
                                            <SelectItem key={trip.id} value={trip.id}>
                                              {trip.destino} - {trip.fechaSalida.toLocaleDateString()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="grid gap-2">
                                        <Label htmlFor="charge-amount">Monto</Label>
                                        <Input
                                          id="charge-amount"
                                          type="number"
                                          value={chargeData.amount}
                                          onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
                                          required
                                          disabled={isLoading}
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor="charge-currency">Moneda</Label>
                                        <Select
                                          value={chargeData.currency}
                                          onValueChange={(value) => setChargeData({ ...chargeData, currency: value })}
                                          required
                                          disabled={isLoading}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="charge-description">Descripción</Label>
                                      <Textarea
                                        id="charge-description"
                                        value={chargeData.description}
                                        onChange={(e) => setChargeData({ ...chargeData, description: e.target.value })}
                                        required
                                        disabled={isLoading}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        "Registrar Cargo"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <Button variant="outline" onClick={() => exportAccountStatement(client)}>
                              <Download className="h-4 w-4 mr-2" />
                              Exportar Estado
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="transactions" className="space-y-4">
                          <div className="space-y-2">
                            {clientPayments.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No hay transacciones registradas</p>
                              </div>
                            ) : (
                              clientPayments.map((payment) => {
                                const trip = trips.find((t) => t.id === payment.tripId)
                                const availableTrips = getAvailableTripsForTransfer(payment)

                                return (
                                  <Card key={payment.id}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Badge variant={payment.type === "payment" ? "default" : "destructive"}>
                                              {payment.type === "payment" ? "Pago" : "Cargo"}
                                            </Badge>
                                            <span className="font-medium">
                                              {payment.currency === "USD" ? "US$" : "$"}
                                              {payment.amount.toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            <div>Viaje: {trip?.destino || "N/A"}</div>
                                            <div>Fecha: {payment.date.toLocaleDateString()}</div>
                                            <div>Descripción: {payment.description}</div>
                                            {payment.receiptNumber && <div>Recibo: {payment.receiptNumber}</div>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {availableTrips.length > 0 && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedPayment(payment)
                                                setTransferData({
                                                  targetTripId: "",
                                                  amount: payment.amount.toString(),
                                                  concept: "",
                                                })
                                                setIsTransferDialogOpen(true)
                                              }}
                                              disabled={isLoading}
                                            >
                                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                                              Transferir
                                            </Button>
                                          )}
                                          <Button variant="outline" size="sm" onClick={() => printReceipt(payment)}>
                                            <Printer className="h-4 w-4 mr-1" />
                                            Imprimir
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="trips" className="space-y-4">
                          <div className="space-y-2">
                            {clientTrips.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No hay viajes registrados</p>
                              </div>
                            ) : (
                              clientTrips.map((trip) => {
                                const passenger = tripPassengers.find(
                                  (tp) => tp.tripId === trip.id && tp.clientId === client.id,
                                )
                                const bus = trip.busId ? buses.find((b) => b.id === trip.busId) : null

                                return (
                                  <Card key={trip.id}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{trip.destino}</span>
                                            <Badge variant={passenger?.pagado ? "default" : "destructive"}>
                                              {passenger?.pagado ? "Pagado" : "Pendiente"}
                                            </Badge>
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            <div>
                                              Fecha: {trip.fechaSalida.toLocaleDateString()} -{" "}
                                              {trip.fechaRegreso.toLocaleDateString()}
                                            </div>
                                            <div>
                                              Importe: {trip.currency === "USD" ? "US$" : "$"}
                                              {trip.importe.toLocaleString()}
                                            </div>
                                            {trip.type === "grupal" && passenger && (
                                              <div>
                                                Asiento: {passenger.numeroAsiento} - Bus: {bus?.patente}
                                              </div>
                                            )}
                                            {trip.type === "crucero" && passenger && (
                                              <div>Cabina: {passenger.numeroCabina}</div>
                                            )}
                                            {trip.type === "aereo" && passenger && (
                                              <div>Asiento: {passenger.numeroAsiento}</div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Badge
                                            variant={
                                              trip.type === "grupal"
                                                ? "default"
                                                : trip.type === "crucero"
                                                  ? "secondary"
                                                  : "outline"
                                            }
                                          >
                                            {trip.type === "grupal"
                                              ? "Grupal"
                                              : trip.type === "individual"
                                                ? "Individual"
                                                : trip.type === "crucero"
                                                  ? "Crucero"
                                                  : "Aéreo"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* DIALOGO PARA TRANSFERIR PAGO */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transferir Pago</DialogTitle>
            <DialogDescription>Transfiere este pago a otro viaje del mismo cliente</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <form onSubmit={handleTransfer}>
              <div className="grid gap-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Pago Original</h4>
                  <div className="text-sm space-y-1">
                    <div>Viaje: {getOriginalTripName(selectedPayment.tripId)}</div>
                    <div>
                      Monto: {selectedPayment.currency === "USD" ? "US$" : "$"}
                      {selectedPayment.amount.toLocaleString()}
                    </div>
                    <div>Descripción: {selectedPayment.description}</div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-trip">Viaje Destino</Label>
                  <Select
                    value={transferData.targetTripId}
                    onValueChange={(value) => setTransferData({ ...transferData, targetTripId: value })}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar viaje destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTripsForTransfer(selectedPayment).map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.destino} - {trip.fechaSalida.toLocaleDateString()} (
                          {trip.currency === "USD" ? "US$" : "$"}
                          {trip.importe.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-amount">Monto a Transferir</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    max={selectedPayment.amount}
                    required
                    disabled={isLoading}
                  />
                  <div className="text-xs text-muted-foreground">
                    Máximo: {selectedPayment.currency === "USD" ? "US$" : "$"}
                    {selectedPayment.amount.toLocaleString()}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-concept">Concepto de la Transferencia</Label>
                  <Input
                    id="transfer-concept"
                    type="text"
                    value={transferData.concept}
                    onChange={(e) => setTransferData({ ...transferData, concept: e.target.value })}
                    placeholder="Ej: Cambio de fecha, Cancelación, Reprogramación..."
                    required
                    disabled={isLoading}
                  />
                  <div className="text-xs text-muted-foreground">
                    Especifica la razón por la cual se realiza esta transferencia
                  </div>
                </div>

                {Number.parseFloat(transferData.amount) < selectedPayment.amount && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Transferencia Parcial</span>
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Se transferirán ${transferData.amount} y quedarán $
                      {(selectedPayment.amount - Number.parseFloat(transferData.amount || "0")).toLocaleString()} en el
                      viaje original.
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetTransferForm} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !transferData.targetTripId || !transferData.amount || !transferData.concept}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Transferir Pago"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
