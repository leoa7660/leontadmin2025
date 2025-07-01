"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Client, Trip, Payment, TripPassenger, Bus, User } from "../page"
import { Receipt, Eye, Printer, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AccountsManagerProps {
  clients: Client[]
  trips: Trip[]
  payments: Payment[]
  setPayments: (payments: Payment[]) => void
  tripPassengers?: TripPassenger[]
  buses?: Bus[]
  currentUser: User
}

export function AccountsManager({
  clients,
  trips,
  payments,
  setPayments,
  tripPassengers = [],
  buses = [],
  currentUser,
}: AccountsManagerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<"ARS" | "USD">("ARS")

  // Función para formatear montos con moneda
  const formatCurrency = (amount: number, currency: "ARS" | "USD") => {
    const symbol = currency === "USD" ? "US$" : "$"
    return `${symbol}${amount.toLocaleString()}`
  }

  // Calcular el saldo de un cliente por moneda
  const getClientBalance = (clientId: string, currency: "ARS" | "USD") => {
    // Obtener todos los viajes del cliente en la moneda especificada
    const clientPassengers = tripPassengers.filter((tp) => {
      const trip = trips.find((t) => t.id === tp.tripId)
      return tp.clientId === clientId && trip?.currency === currency
    })

    // Calcular total de compras (viajes reservados)
    const totalCharges = clientPassengers.reduce((sum, passenger) => {
      const trip = trips.find((t) => t.id === passenger.tripId)
      if (trip && trip.currency === currency) {
        return sum + trip.importe
      }
      return sum
    }, 0)

    // Calcular total de pagos realizados
    const totalPayments = payments
      .filter((p) => p.clientId === clientId && p.type === "payment" && p.currency === currency)
      .reduce((sum, p) => sum + p.amount, 0)

    return {
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
    }
  }

  // Obtener transacciones detalladas de un cliente por moneda
  const getClientTransactions = (clientId: string, currency: "ARS" | "USD") => {
    const transactions: Array<{
      id: string
      date: Date
      type: "charge" | "payment"
      description: string
      amount: number
      currency: "ARS" | "USD"
      tripId?: string
      receiptNumber?: string
    }> = []

    // Agregar cargos (viajes reservados) en la moneda especificada
    const clientPassengers = tripPassengers.filter((tp) => {
      const trip = trips.find((t) => t.id === tp.tripId)
      return tp.clientId === clientId && trip?.currency === currency
    })

    clientPassengers.forEach((passenger) => {
      const trip = trips.find((t) => t.id === passenger.tripId)
      if (trip && trip.currency === currency) {
        transactions.push({
          id: `charge-${passenger.id}`,
          date: passenger.fechaReserva,
          type: "charge",
          description: `Viaje a ${trip.destino} - Asiento ${passenger.numeroAsiento}`,
          amount: trip.importe,
          currency: trip.currency,
          tripId: trip.id,
        })
      }
    })

    // Agregar pagos en la moneda especificada
    const clientPayments = payments.filter(
      (p) => p.clientId === clientId && p.type === "payment" && p.currency === currency,
    )
    clientPayments.forEach((payment) => {
      transactions.push({
        id: payment.id,
        date: payment.date,
        type: "payment",
        description: payment.description,
        amount: payment.amount,
        currency: payment.currency,
        tripId: payment.tripId,
        receiptNumber: payment.receiptNumber,
      })
    })

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const generateReceipt = (payment: Payment) => {
    const client = clients.find((c) => c.id === payment.clientId)
    const trip = trips.find((t) => t.id === payment.tripId)
    const passenger = tripPassengers.find((tp) => tp.clientId === payment.clientId && tp.tripId === payment.tripId)
    const bus = buses.find((b) => b.id === trip?.busId)

    return {
      receiptNumber: payment.receiptNumber || `REC-${payment.id}`,
      date: payment.date.toLocaleDateString(),
      client: client?.name || "Cliente no encontrado",
      trip: trip?.destino || "Viaje no encontrado",
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      seatNumber: passenger?.numeroAsiento,
      bus: bus?.patente,
    }
  }

  const printReceipt = (payment: Payment) => {
    const trip = trips.find((t) => t.id === payment.tripId)
    const client = clients.find((c) => c.id === payment.clientId)
    const passenger = tripPassengers.find((tp) => tp.clientId === payment.clientId && tp.tripId === payment.tripId)
    const bus = buses.find((b) => b.id === trip?.busId)

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
            .company-info { text-align: left; }
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
            .currency-badge { background-color: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
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
            <div class="currency-badge">${payment.currency === "USD" ? "DÓLARES AMERICANOS" : "PESOS ARGENTINOS"}</div>
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
          </div>

          <div class="section">
            <div class="section-title">Detalles del Viaje</div>
            <div class="info-row">
              <span class="info-label">Destino:</span>
              <span>${trip?.destino || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Salida:</span>
              <span>${trip?.fechaSalida.toLocaleDateString() || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bus:</span>
              <span>${bus?.patente || "N/A"} - ${bus?.tipoServicio || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Asiento:</span>
              <span>N° ${passenger?.numeroAsiento || "N/A"}</span>
            </div>
          </div>

          <div class="total-section">
            <div class="info-row">
              <span class="info-label">TOTAL PAGADO:</span>
              <span class="total-amount">${formatCurrency(payment.amount, payment.currency)}</span>
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

  const filteredClients = selectedClientId ? clients.filter((c) => c.id === selectedClientId) : clients

  // Calcular totales por moneda
  const getTotalsByCurrency = (currency: "ARS" | "USD") => {
    const totalCharges = filteredClients.reduce((sum, client) => {
      const { totalCharges } = getClientBalance(client.id, currency)
      return sum + totalCharges
    }, 0)

    const totalPayments = filteredClients.reduce((sum, client) => {
      const { totalPayments } = getClientBalance(client.id, currency)
      return sum + totalPayments
    }, 0)

    const totalPending = filteredClients.reduce((sum, client) => {
      const { balance } = getClientBalance(client.id, currency)
      return sum + (balance > 0 ? balance : 0)
    }, 0)

    const totalReceipts = payments.filter(
      (p) => p.receiptNumber && p.currency === currency && (!selectedClientId || p.clientId === selectedClientId),
    ).length

    return { totalCharges, totalPayments, totalPending, totalReceipts }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cuentas Corrientes</CardTitle>
              <CardDescription>Gestiona los pagos y saldos de tus clientes por moneda</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as "ARS" | "USD")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ARS" className="flex items-center gap-2">
                🇦🇷 Pesos Argentinos (ARS)
              </TabsTrigger>
              <TabsTrigger value="USD" className="flex items-center gap-2">
                🇺🇸 Dólares Americanos (USD)
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCurrency} className="space-y-6">
              {/* Resumen de Saldos - Solo visible para admin y manager */}
              {currentUser.role !== "operator" && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(getTotalsByCurrency(selectedCurrency).totalCharges, selectedCurrency)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(getTotalsByCurrency(selectedCurrency).totalPayments, selectedCurrency)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(getTotalsByCurrency(selectedCurrency).totalPending, selectedCurrency)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Recibos Emitidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{getTotalsByCurrency(selectedCurrency).totalReceipts}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Para operadores, mostrar solo recibos emitidos */}
              {currentUser.role === "operator" && (
                <div className="grid gap-4 md:grid-cols-1">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Recibos Emitidos en {selectedCurrency === "USD" ? "Dólares" : "Pesos"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{getTotalsByCurrency(selectedCurrency).totalReceipts}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Estado de Cuentas por Cliente */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      {currentUser.role !== "operator" && (
                        <>
                          <TableHead>Total Comprado</TableHead>
                          <TableHead>Total Pagado</TableHead>
                          <TableHead>Saldo Pendiente</TableHead>
                        </>
                      )}
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => {
                      const { totalCharges, totalPayments, balance } = getClientBalance(client.id, selectedCurrency)

                      // Solo mostrar clientes que tienen movimientos en esta moneda
                      if (totalCharges === 0 && totalPayments === 0) return null

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          {currentUser.role !== "operator" && (
                            <>
                              <TableCell>
                                <span className="text-blue-600 font-semibold">
                                  {formatCurrency(totalCharges, selectedCurrency)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(totalPayments, selectedCurrency)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={balance > 0 ? "text-red-600 font-semibold" : "text-gray-500"}>
                                  {formatCurrency(Math.abs(balance), selectedCurrency)}
                                </span>
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            {balance > 0 ? (
                              <Badge variant="destructive">
                                {currentUser.role !== "operator"
                                  ? `Debe ${formatCurrency(balance, selectedCurrency)}`
                                  : "Pendiente"}
                              </Badge>
                            ) : balance < 0 ? (
                              <Badge variant="secondary">
                                {currentUser.role !== "operator"
                                  ? `A favor ${formatCurrency(Math.abs(balance), selectedCurrency)}`
                                  : "A favor"}
                              </Badge>
                            ) : (
                              <Badge variant="default">Al día</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => setSelectedClientId(client.id)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Historial de Transacciones */}
              {selectedClientId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Detalle de Cuenta en {selectedCurrency === "USD" ? "Dólares" : "Pesos"} -{" "}
                      {clients.find((c) => c.id === selectedClientId)?.name}
                    </CardTitle>
                    <CardDescription>
                      Historial completo de compras y pagos en {selectedCurrency === "USD" ? "dólares" : "pesos"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Fecha Salida</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Debe</TableHead>
                            <TableHead>Haber</TableHead>
                            <TableHead>Recibo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getClientTransactions(selectedClientId, selectedCurrency).map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                {transaction.tripId &&
                                  (() => {
                                    const trip = trips.find((t) => t.id === transaction.tripId)
                                    return trip ? trip.fechaSalida.toLocaleDateString() : "N/A"
                                  })()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={transaction.type === "payment" ? "default" : "secondary"}>
                                  {transaction.type === "payment" ? "Pago" : "Compra"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.type === "charge" && (
                                  <span className="text-red-600 font-semibold">
                                    {formatCurrency(transaction.amount, transaction.currency)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.type === "payment" && (
                                  <span className="text-green-600 font-semibold">
                                    {formatCurrency(transaction.amount, transaction.currency)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.receiptNumber && (
                                  <div className="flex gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const payment = payments.find((p) => p.id === transaction.id)
                                            if (payment) setSelectedReceipt(payment)
                                          }}
                                        >
                                          <Receipt className="h-4 w-4 mr-1" />
                                          Ver
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                          <DialogTitle>Recibo de Pago</DialogTitle>
                                          <DialogDescription>
                                            Recibo N° {transaction.receiptNumber} -{" "}
                                            {transaction.currency === "USD" ? "Dólares" : "Pesos"}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          {selectedReceipt &&
                                            (() => {
                                              const receipt = generateReceipt(selectedReceipt)
                                              return (
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="font-medium">Fecha:</span>
                                                    <span>{receipt.date}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="font-medium">Cliente:</span>
                                                    <span>{receipt.client}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="font-medium">Viaje:</span>
                                                    <span>{receipt.trip}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="font-medium">Asiento:</span>
                                                    <span>N° {receipt.seatNumber}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="font-medium">Moneda:</span>
                                                    <Badge variant="outline">
                                                      {receipt.currency === "USD" ? "🇺🇸 USD" : "🇦🇷 ARS"}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex justify-between border-t pt-2">
                                                    <span className="font-bold">Total:</span>
                                                    <span className="font-bold">
                                                      {formatCurrency(receipt.amount, receipt.currency)}
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            })()}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const payment = payments.find((p) => p.id === transaction.id)
                                        if (payment) printReceipt(payment)
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {getClientTransactions(selectedClientId, selectedCurrency).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay transacciones registradas en {selectedCurrency === "USD" ? "dólares" : "pesos"}
                        </div>
                      )}
                    </div>

                    {/* Resumen del cliente seleccionado */}
                    {(() => {
                      const { totalCharges, totalPayments, balance } = getClientBalance(
                        selectedClientId,
                        selectedCurrency,
                      )
                      return (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Resumen de Cuenta en {selectedCurrency === "USD" ? "Dólares" : "Pesos"}
                          </h4>
                          <div
                            className={`grid ${currentUser.role !== "operator" ? "grid-cols-3" : "grid-cols-1"} gap-4 text-sm`}
                          >
                            {currentUser.role !== "operator" && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Total Comprado:</span>
                                  <div className="font-semibold text-blue-600">
                                    {formatCurrency(totalCharges, selectedCurrency)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total Pagado:</span>
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(totalPayments, selectedCurrency)}
                                  </div>
                                </div>
                              </>
                            )}
                            <div>
                              <span className="text-muted-foreground">Estado:</span>
                              <div
                                className={`font-semibold ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-gray-600"}`}
                              >
                                {currentUser.role !== "operator" ? (
                                  <>
                                    {formatCurrency(Math.abs(balance), selectedCurrency)}{" "}
                                    {balance > 0 ? "(debe)" : balance < 0 ? "(a favor)" : "(al día)"}
                                  </>
                                ) : (
                                  <>{balance > 0 ? "Pendiente" : balance < 0 ? "A favor" : "Al día"}</>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
