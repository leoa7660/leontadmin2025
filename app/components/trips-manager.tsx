"use client"

import type React from "react"
import { useState } from "react"
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
import type { Bus, Client, Trip, TripPassenger, Payment } from "../page"
import {
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  UserPlus,
  Receipt,
  Printer,
  Eye,
  Edit,
  ArrowRightLeft,
  Archive,
  ArchiveRestore,
  Ticket,
  ImageIcon,
  Car,
  Users,
  Ship,
  Plane,
  Loader2,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { createTrip, updateTrip, createTripPassenger, updateTripPassenger, createPayment } from "../actions/database"

interface TripsManagerProps {
  trips: Trip[]
  setTrips: (trips: Trip[]) => void
  buses: Bus[]
  clients: Client[]
  tripPassengers: TripPassenger[]
  setTripPassengers: (passengers: TripPassenger[]) => void
  payments: Payment[]
  setPayments: (payments: Payment[]) => void
  onDataChange?: () => Promise<void>
}

export function TripsManager({
  trips,
  setTrips,
  buses,
  clients,
  tripPassengers,
  setTripPassengers,
  payments,
  setPayments,
  onDataChange,
}: TripsManagerProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSeatChangeDialogOpen, setIsSeatChangeDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedPassenger, setSelectedPassenger] = useState<TripPassenger | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("grupal")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "grupal",
    busId: "",
    destino: "",
    fechaSalida: "",
    fechaRegreso: "",
    importe: "",
    currency: "ARS",
    descripcion: "",
    // Campos para cruceros
    naviera: "",
    barco: "",
    cabina: "",
    // Campos para aéreos
    aerolinea: "",
    numeroVuelo: "",
    clase: "",
    escalas: "",
  })
  const [passengerClientId, setPassengerClientId] = useState("")
  const [selectedSeat, setSelectedSeat] = useState("")
  const [selectedCabin, setSelectedCabin] = useState("")
  const [newSeatNumber, setNewSeatNumber] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")

  // Filtrar viajes por tipo y estado
  const grupalTrips = trips.filter((trip) => trip.type === "grupal" && !trip.archived)
  const individualTrips = trips.filter((trip) => trip.type === "individual" && !trip.archived)
  const cruceroTrips = trips.filter((trip) => trip.type === "crucero" && !trip.archived)
  const aereoTrips = trips.filter((trip) => trip.type === "aereo" && !trip.archived)
  const archivedTrips = trips.filter((trip) => trip.archived)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newTripData: Omit<Trip, "id" | "createdAt"> = {
        busId: formData.type === "grupal" ? formData.busId : undefined,
        destino: formData.destino,
        fechaSalida: new Date(formData.fechaSalida),
        fechaRegreso: new Date(formData.fechaRegreso),
        importe: Number.parseFloat(formData.importe),
        currency: formData.currency as "ARS" | "USD",
        type: formData.type as "grupal" | "individual" | "crucero" | "aereo",
        descripcion: formData.descripcion,
        archived: false,
        // Campos específicos para cruceros
        naviera: formData.type === "crucero" ? formData.naviera : undefined,
        barco: formData.type === "crucero" ? formData.barco : undefined,
        cabina: formData.type === "crucero" ? formData.cabina : undefined,
        // Campos específicos para aéreos
        aerolinea: formData.type === "aereo" ? formData.aerolinea : undefined,
        numeroVuelo: formData.type === "aereo" ? formData.numeroVuelo : undefined,
        clase: formData.type === "aereo" ? formData.clase : undefined,
        escalas: formData.type === "aereo" ? formData.escalas : undefined,
      }

      await createTrip(newTripData)

      toast({
        title: "Viaje creado",
        description: "El viaje se ha creado exitosamente.",
      })

      resetForm()

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error creating trip:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el viaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: "grupal",
      busId: "",
      destino: "",
      fechaSalida: "",
      fechaRegreso: "",
      importe: "",
      currency: "ARS",
      descripcion: "",
      naviera: "",
      barco: "",
      cabina: "",
      aerolinea: "",
      numeroVuelo: "",
      clase: "",
      escalas: "",
    })
    setIsDialogOpen(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTrip) return
    setIsLoading(true)

    try {
      const updatedTripData: Partial<Trip> = {
        busId: formData.type === "grupal" ? formData.busId : undefined,
        destino: formData.destino,
        fechaSalida: new Date(formData.fechaSalida),
        fechaRegreso: new Date(formData.fechaRegreso),
        importe: Number.parseFloat(formData.importe),
        currency: formData.currency as "ARS" | "USD",
        type: formData.type as "grupal" | "individual" | "crucero" | "aereo",
        descripcion: formData.descripcion,
        naviera: formData.type === "crucero" ? formData.naviera : undefined,
        barco: formData.type === "crucero" ? formData.barco : undefined,
        cabina: formData.type === "crucero" ? formData.cabina : undefined,
        aerolinea: formData.type === "aereo" ? formData.aerolinea : undefined,
        numeroVuelo: formData.type === "aereo" ? formData.numeroVuelo : undefined,
        clase: formData.type === "aereo" ? formData.clase : undefined,
        escalas: formData.type === "aereo" ? formData.escalas : undefined,
      }

      await updateTrip(editingTrip.id, updatedTripData)

      toast({
        title: "Viaje actualizado",
        description: "El viaje se ha actualizado exitosamente.",
      })

      resetEditForm()

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error updating trip:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el viaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetEditForm = () => {
    setFormData({
      type: "grupal",
      busId: "",
      destino: "",
      fechaSalida: "",
      fechaRegreso: "",
      importe: "",
      currency: "ARS",
      descripcion: "",
      naviera: "",
      barco: "",
      cabina: "",
      aerolinea: "",
      numeroVuelo: "",
      clase: "",
      escalas: "",
    })
    setEditingTrip(null)
    setIsEditDialogOpen(false)
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      type: trip.type,
      busId: trip.busId || "",
      destino: trip.destino,
      fechaSalida: trip.fechaSalida.toISOString().slice(0, 16),
      fechaRegreso: trip.fechaRegreso.toISOString().slice(0, 16),
      importe: trip.importe.toString(),
      currency: trip.currency,
      descripcion: trip.descripcion,
      naviera: trip.naviera || "",
      barco: trip.barco || "",
      cabina: trip.cabina || "",
      aerolinea: trip.aerolinea || "",
      numeroVuelo: trip.numeroVuelo || "",
      clase: trip.clase || "",
      escalas: trip.escalas || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleArchiveTrip = async (tripId: string) => {
    setIsLoading(true)
    try {
      await updateTrip(tripId, { archived: true })
      toast({
        title: "Viaje archivado",
        description: "El viaje se ha archivado exitosamente.",
      })

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error archiving trip:", error)
      toast({
        title: "Error",
        description: "Error al archivar el viaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnarchiveTrip = async (tripId: string) => {
    setIsLoading(true)
    try {
      await updateTrip(tripId, { archived: false })
      toast({
        title: "Viaje desarchivado",
        description: "El viaje se ha desarchivado exitosamente.",
      })

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error unarchiving trip:", error)
      toast({
        title: "Error",
        description: "Error al desarchivar el viaje",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPassenger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return
    setIsLoading(true)

    try {
      let seatNumber = 1
      let cabinNumber = ""

      if (selectedTrip.type === "grupal") {
        seatNumber = Number.parseInt(selectedSeat)
      } else if (selectedTrip.type === "aereo") {
        seatNumber = Number.parseInt(selectedSeat)
      } else if (selectedTrip.type === "crucero") {
        cabinNumber = selectedCabin
      }

      const newPassengerData: Omit<TripPassenger, "id" | "fechaReserva"> = {
        tripId: selectedTrip.id,
        clientId: passengerClientId,
        pagado: false,
        numeroAsiento: seatNumber,
        numeroCabina: selectedTrip.type === "crucero" ? cabinNumber : undefined,
      }

      await createTripPassenger(newPassengerData)

      toast({
        title: "Pasajero agregado",
        description: "El pasajero se ha agregado exitosamente al viaje.",
      })

      setPassengerClientId("")
      setSelectedSeat("")
      setSelectedCabin("")
      setIsPassengerDialogOpen(false)

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error adding passenger:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar el pasajero",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeSeat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPassenger || !selectedTrip || !newSeatNumber) return
    setIsLoading(true)

    try {
      await updateTripPassenger(selectedPassenger.id, {
        numeroAsiento: Number.parseInt(newSeatNumber),
      })

      toast({
        title: "Asiento cambiado",
        description: "El asiento se ha cambiado exitosamente.",
      })

      setNewSeatNumber("")
      setIsSeatChangeDialogOpen(false)

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error changing seat:", error)
      toast({
        title: "Error",
        description: "Error al cambiar el asiento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPassenger || !selectedTrip) return
    setIsLoading(true)

    try {
      const paymentData: Omit<Payment, "id" | "date"> = {
        clientId: selectedPassenger.clientId,
        tripId: selectedTrip.id,
        amount: Number.parseFloat(paymentAmount),
        currency: selectedTrip.currency,
        type: "payment",
        description: `Pago por ${getTripTypeLabel(selectedTrip.type)} a ${selectedTrip.destino}${getPassengerLocationInfo(selectedPassenger, selectedTrip)}`,
        receiptNumber: `REC-${Date.now()}`,
      }

      await createPayment(paymentData)

      // Si el pago es completo, marcar como pagado
      if (Number.parseFloat(paymentAmount) >= selectedTrip.importe) {
        await updateTripPassenger(selectedPassenger.id, { pagado: true })
      }

      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado exitosamente.",
      })

      // Crear el objeto payment para mostrar el recibo
      const newPayment: Payment = {
        ...paymentData,
        id: Date.now().toString(),
        date: new Date(),
      }
      setSelectedPayment(newPayment)

      setPaymentAmount("")
      setIsPaymentDialogOpen(false)

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el pago",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para obtener etiqueta del tipo de viaje
  const getTripTypeLabel = (type: string) => {
    switch (type) {
      case "grupal":
        return "viaje grupal"
      case "individual":
        return "viaje individual"
      case "crucero":
        return "crucero"
      case "aereo":
        return "vuelo"
      default:
        return "viaje"
    }
  }

  // Función para obtener información de ubicación del pasajero
  const getPassengerLocationInfo = (passenger: TripPassenger, trip: Trip) => {
    if (trip.type === "grupal" || trip.type === "aereo") {
      return ` - Asiento ${passenger.numeroAsiento}`
    } else if (trip.type === "crucero") {
      return ` - Cabina ${passenger.numeroCabina}`
    }
    return ""
  }

  // Función para obtener icono del tipo de viaje
  const getTripIcon = (type: string) => {
    switch (type) {
      case "grupal":
        return <Users className="h-4 w-4" />
      case "individual":
        return <Car className="h-4 w-4" />
      case "crucero":
        return <Ship className="h-4 w-4" />
      case "aereo":
        return <Plane className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const printReceipt = (payment: Payment) => {
    const trip = trips.find((t) => t.id === payment.tripId)
    const client = clients.find((c) => c.id === payment.clientId)
    const passenger = tripPassengers.find((p) => p.clientId === payment.clientId && p.tripId === payment.tripId)
    const bus = buses.find((b) => b.id === trip?.busId)

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Pago - ${payment.receiptNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 20px; 
            }
            .logo-section { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              gap: 15px; 
              margin-bottom: 15px; 
            }
            .company-info { 
              text-align: center; 
              margin-bottom: 15px; 
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              margin: 0; 
            }
            .company-subtitle { 
              font-size: 14px; 
              color: #666; 
              margin: 0; 
            }
            .receipt-title { 
              font-size: 18px; 
              margin-top: 15px; 
              font-weight: bold; 
            }
            .receipt-number { 
              font-size: 14px; 
              color: #666; 
            }
            .section { 
              margin: 20px 0; 
            }
            .section-title { 
              font-weight: bold; 
              font-size: 16px; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
            }
            .info-label { 
              font-weight: bold; 
            }
            .total-section { 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              margin-top: 20px; 
            }
            .total-amount { 
              font-size: 20px; 
              font-weight: bold; 
              color: #2563eb; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #ddd; 
              color: #666; 
              font-size: 12px; 
            }
            .logo-placeholder {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: linear-gradient(135deg, #2563eb, #3b82f6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 18px;
              margin: 0 auto;
            }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
              .logo-placeholder { 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <div class="logo-placeholder">LT</div>
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
            <div class="section-title">Detalles del ${getTripTypeLabel(trip?.type || "")}</div>
            <div class="info-row">
              <span class="info-label">Destino:</span>
              <span>${trip?.destino || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo:</span>
              <span>${trip?.type === "grupal" ? "Salida Grupal" : trip?.type === "individual" ? "Salida Individual" : trip?.type === "crucero" ? "Crucero" : trip?.type === "aereo" ? "Vuelo" : "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Salida:</span>
              <span>${trip?.fechaSalida.toLocaleDateString() || "N/A"}</span>
            </div>
            ${
              trip?.type === "grupal" && passenger?.numeroAsiento
                ? `
            <div class="info-row">
              <span class="info-label">Asiento:</span>
              <span>N° ${passenger.numeroAsiento}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bus:</span>
              <span>${bus?.patente || "N/A"} - ${bus?.tipoServicio || "N/A"}</span>
            </div>
            `
                : ""
            }
            ${
              trip?.type === "aereo" && passenger?.numeroAsiento
                ? `
            <div class="info-row">
              <span class="info-label">Asiento:</span>
              <span>N° ${passenger.numeroAsiento}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Aerolínea:</span>
              <span>${trip.aerolinea || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Vuelo:</span>
              <span>${trip.numeroVuelo || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Clase:</span>
              <span>${trip.clase || "N/A"}</span>
            </div>
            `
                : ""
            }
            ${
              trip?.type === "crucero" && passenger?.numeroCabina
                ? `
            <div class="info-row">
              <span class="info-label">Cabina:</span>
              <span>${passenger.numeroCabina}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Naviera:</span>
              <span>${trip.naviera || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Barco:</span>
              <span>${trip.barco || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo de Cabina:</span>
              <span>${trip.cabina || "N/A"}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="total-section">
            <div class="info-row">
              <span class="info-label">TOTAL PAGADO:</span>
              <span class="total-amount">${trip?.currency === "USD" ? "US$" : "$"}${payment.amount.toLocaleString()}</span>
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

  const printVoucher = (passenger: TripPassenger, trip: Trip) => {
    const client = clients.find((c) => c.id === passenger.clientId)
    const bus = trip.busId ? buses.find((b) => b.id === trip.busId) : null

    const voucherContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Voucher de ${getTripTypeLabel(trip.type)} - ${trip.destino}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .logo-section { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 15px; 
            margin-bottom: 15px; 
          }
          .company-info { 
            text-align: center; 
            margin-bottom: 15px; 
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin: 0; 
          }
          .company-subtitle { 
            font-size: 14px; 
            color: #666; 
            margin: 0; 
          }
          .voucher-title { 
            font-size: 20px; 
            margin-top: 15px; 
            font-weight: bold; 
            color: #2563eb; 
          }
          .destination { 
            font-size: 16px; 
            color: #666; 
            margin-top: 5px; 
          }
          .section { 
            margin: 20px 0; 
          }
          .section-title { 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
            color: #2563eb; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
          }
          .info-label { 
            font-weight: bold; 
          }
          .highlight-section { 
            background-color: #f0f8ff; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #2563eb; 
          }
          .departure-info { 
            background-color: #fff3cd; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #ffc107; 
          }
          .departure-time { 
            font-size: 24px; 
            font-weight: bold; 
            color: #856404; 
            text-align: center; 
          }
          .departure-date { 
            font-size: 18px; 
            font-weight: bold; 
            color: #856404; 
            text-align: center; 
            margin-bottom: 10px; 
          }
          .seat-info { 
            background-color: #d1ecf1; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #17a2b8; 
            text-align: center; 
          }
          .seat-number { 
            font-size: 28px; 
            font-weight: bold; 
            color: #0c5460; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            color: #666; 
            font-size: 12px; 
          }
          .important-note { 
            background-color: #f8d7da; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 20px 0; 
            border-left: 4px solid #dc3545; 
          }
          .important-note p { 
            margin: 5px 0; 
            color: #721c24; 
            font-weight: bold; 
          }
          .logo-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            margin: 0 auto;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .logo-placeholder { 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <div class="logo-placeholder">LT</div>
            <div class="company-info">
              <h1 class="company-name">LT Tour Operator</h1>
              <p class="company-subtitle">Tu compañía de confianza para viajar</p>
            </div>
          </div>
          <div class="voucher-title">VOUCHER DE ${getTripTypeLabel(trip.type).toUpperCase()}</div>
          <div class="destination">${trip.destino}</div>
        </div>

        <div class="section">
          <div class="section-title">Información del Pasajero</div>
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span>${client?.name || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">DNI:</span>
            <span>${client?.dni || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span>${client?.phone || "N/A"}</span>
          </div>
        </div>

        <div class="departure-info">
          <div class="section-title">Información de Salida</div>
          <div class="departure-date">${trip.fechaSalida.toLocaleDateString()}</div>
          <div class="departure-time">${trip.fechaSalida.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>

        ${
          trip.type === "grupal" && bus
            ? `
        <div class="seat-info">
          <div class="section-title">Asiento Asignado</div>
          <div class="seat-number">N° ${passenger.numeroAsiento}</div>
          <p style="margin: 10px 0; color: #0c5460;">Bus: ${bus.patente} - ${bus.tipoServicio}</p>
        </div>
        `
            : trip.type === "aereo"
              ? `
        <div class="seat-info">
          <div class="section-title">Información del Vuelo</div>
          <div class="seat-number">Asiento ${passenger.numeroAsiento}</div>
          <p style="margin: 10px 0; color: #0c5460;">
            ${trip.aerolinea} - Vuelo ${trip.numeroVuelo}<br>
            Clase: ${trip.clase}
            ${trip.escalas ? `<br>Escalas: ${trip.escalas}` : ""}
          </p>
        </div>
        `
              : trip.type === "crucero"
                ? `
        <div class="seat-info">
          <div class="section-title">Información del Crucero</div>
          <div class="seat-number">Cabina ${passenger.numeroCabina}</div>
          <p style="margin: 10px 0; color: #0c5460;">
            ${trip.naviera} - ${trip.barco}<br>
            Tipo de Cabina: ${trip.cabina}
          </p>
        </div>
        `
                : `
        <div class="seat-info">
          <div class="section-title">Servicio Individual</div>
          <p style="margin: 10px 0; color: #0c5460;">Traslado personalizado</p>
        </div>
        `
        }

        <div class="section">
          <div class="section-title">Detalles del ${getTripTypeLabel(trip.type)}</div>
          <div class="info-row">
            <span class="info-label">Destino:</span>
            <span>${trip.destino}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha de Regreso:</span>
            <span>${trip.fechaRegreso.toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hora de Regreso:</span>
            <span>${trip.fechaRegreso.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div class="highlight-section">
          <div class="section-title">El ${getTripTypeLabel(trip.type)} incluye</div>
          <p style="margin: 0; line-height: 1.6;">${trip.descripcion}</p>
        </div>

        <div class="important-note">
          <p>IMPORTANTE:</p>
          <p>• Presentarse 30 minutos antes de la salida</p>
          <p>• Traer documento de identidad</p>
          <p>• Conservar este voucher durante todo el ${getTripTypeLabel(trip.type)}</p>
          ${
            trip.type === "aereo"
              ? "<p>• Llegar al aeropuerto con 2 horas de anticipación</p>"
              : trip.type === "crucero"
                ? "<p>• Realizar check-in en el puerto según horarios indicados</p>"
                : ""
          }
        </div>

        <div class="footer">
          <p><strong>LT Tour Operator</strong> - Tu compañía de confianza para viajar</p>
          <p>¡Que tengas un excelente ${getTripTypeLabel(trip.type)}!</p>
          <p>Voucher generado el ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="background-color: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            Imprimir Voucher
          </button>
        </div>
      </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(voucherContent)
      printWindow.document.close()
      printWindow.focus()
    }
  }

  const getTripPassengers = (tripId: string) => {
    return tripPassengers.filter((p) => p.tripId === tripId)
  }

  const getAvailableSeats = (trip: Trip) => {
    if (trip.type === "individual") return 1
    if (trip.type === "crucero") return 999 // Capacidad "ilimitada" para cruceros

    const bus = buses.find((b) => b.id === trip.busId)
    const passengers = getTripPassengers(trip.id)
    return bus ? bus.asientos - passengers.length : trip.type === "aereo" ? 300 - passengers.length : 0 // Asumimos 300 asientos para vuelos
  }

  const getAvailableClients = (tripId: string) => {
    const tripPassengerIds = tripPassengers.filter((p) => p.tripId === tripId).map((p) => p.clientId)
    return clients.filter((c) => !tripPassengerIds.includes(c.id))
  }

  const getOccupiedSeats = (tripId: string, excludePassengerId?: string) => {
    return tripPassengers
      .filter((p) => p.tripId === tripId && (excludePassengerId ? p.id !== excludePassengerId : true))
      .map((p) => p.numeroAsiento)
  }

  const getAvailableSeatNumbers = (trip: Trip, excludePassengerId?: string) => {
    if (trip.type === "individual") return [1]
    if (trip.type === "crucero") return [] // Para cruceros usamos números de cabina

    const occupiedSeats = getOccupiedSeats(trip.id, excludePassengerId)

    if (trip.type === "grupal") {
      const bus = buses.find((b) => b.id === trip.busId)
      if (!bus) return []
      const allSeats = Array.from({ length: bus.asientos }, (_, i) => i + 1)
      return allSeats.filter((seat) => !occupiedSeats.includes(seat))
    } else if (trip.type === "aereo") {
      // Para vuelos, asumimos asientos del 1 al 300
      const allSeats = Array.from({ length: 300 }, (_, i) => i + 1)
      return allSeats.filter((seat) => !occupiedSeats.includes(seat))
    }

    return []
  }

  const openSeatChangeDialog = (passenger: TripPassenger, trip: Trip) => {
    setSelectedPassenger(passenger)
    setSelectedTrip(trip)
    setIsSeatChangeDialogOpen(true)
  }

  // Componente para mostrar información específica del tipo de viaje
  const TripTypeInfo = ({ trip }: { trip: Trip }) => {
    if (trip.type === "individual") {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Viaje Individual</p>
          <p className="text-sm">Servicio personalizado</p>
        </div>
      )
    } else if (trip.type === "crucero") {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Ship className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Crucero</p>
          <p className="text-sm">
            {trip.naviera} - {trip.barco}
          </p>
          <p className="text-xs">Cabinas: {trip.cabina}</p>
        </div>
      )
    } else if (trip.type === "aereo") {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Plane className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Vuelo</p>
          <p className="text-sm">
            {trip.aerolinea} - {trip.numeroVuelo}
          </p>
          <p className="text-xs">Clase: {trip.clase}</p>
          {trip.escalas && <p className="text-xs">Escalas: {trip.escalas}</p>}
        </div>
      )
    } else {
      // Viaje grupal
      const bus = buses.find((b) => b.id === trip.busId)
      if (!bus?.imagenDistribucion) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay imagen de distribución disponible</p>
            <p className="text-xs">
              Bus: {bus?.patente} - {bus?.asientos} asientos
            </p>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold">Distribución de Asientos - Bus {bus.patente}</h4>
            <p className="text-sm text-muted-foreground">
              {bus.tipoServicio} - {bus.asientos} asientos
            </p>
          </div>

          <div className="relative">
            <Image
              src={bus.imagenDistribucion || "/placeholder.svg"}
              alt={`Distribución ${bus.patente}`}
              width={400}
              height={300}
              className="rounded-lg border object-contain w-full max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                setSelectedTrip(trip)
                setIsImageDialogOpen(true)
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-transparent"
              onClick={() => {
                setSelectedTrip(trip)
                setIsImageDialogOpen(true)
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver completa
            </Button>
          </div>
        </div>
      )
    }
  }

  const renderTripGrid = (tripsToShow: Trip[], emptyMessage: string) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tripsToShow.map((trip) => {
            const bus = trip.busId ? buses.find((b) => b.id === trip.busId) : null
            const passengers = getTripPassengers(trip.id)
            const availableSeats = getAvailableSeats(trip)
            const maxCapacity =
              trip.type === "individual"
                ? 1
                : trip.type === "crucero"
                  ? 999
                  : trip.type === "aereo"
                    ? 300
                    : bus?.asientos || 0
            const occupancyPercentage = maxCapacity > 0 ? (passengers.length / maxCapacity) * 100 : 0

            // Colores específicos por tipo de viaje
            const getGradientColor = () => {
              if (trip.archived) return "bg-gradient-to-r from-gray-400 to-gray-500"
              switch (trip.type) {
                case "individual":
                  return "bg-gradient-to-r from-purple-500 to-purple-600"
                case "crucero":
                  return "bg-gradient-to-r from-cyan-500 to-blue-600"
                case "aereo":
                  return "bg-gradient-to-r from-sky-500 to-indigo-600"
                default:
                  return "bg-gradient-to-r from-blue-500 to-blue-600"
              }
            }

            return (
              <div key={trip.id} className="flex flex-col items-center space-y-2">
                <div
                  className={`relative w-[120px] h-[60px] ${getGradientColor()} rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center text-white overflow-hidden`}
                  onClick={() => {
                    setSelectedTrip(trip)
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="relative z-10 text-center px-2">
                    <h3 className="text-sm font-bold leading-tight truncate">{trip.destino}</h3>
                    <div className="text-xs opacity-90">
                      ${trip.currency === "USD" ? "US$" : "$"}${trip.importe.toLocaleString()}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {trip.type === "grupal"
                        ? "👥 Grupal"
                        : trip.type === "individual"
                          ? "👤 Individual"
                          : trip.type === "crucero"
                            ? "🚢 Crucero"
                            : "✈️ Aéreo"}
                    </div>
                  </div>
                  {!trip.archived && (
                    <div className="absolute top-1 right-1">
                      <div
                        className={`w-2 h-2 rounded-full ${availableSeats > 0 ? "bg-green-400" : "bg-red-400"}`}
                      ></div>
                    </div>
                  )}
                  {trip.archived && <Archive className="absolute top-1 right-1 h-3 w-3 text-white/70" />}
                  <div className="absolute bottom-1 left-1">{getTripIcon(trip.type)}</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xs font-medium text-gray-700">{trip.fechaSalida.toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">
                    {trip.type === "individual"
                      ? `${passengers.length}/1 cliente`
                      : trip.type === "crucero"
                        ? `${passengers.length} pasajeros`
                        : trip.type === "aereo"
                          ? `${passengers.length}/300 pasajeros`
                          : `${passengers.length}/${bus?.asientos || 0} pasajeros`}
                  </div>
                  {trip.archived && (
                    <Badge variant="secondary" className="text-xs">
                      Archivado
                    </Badge>
                  )}

                  <div className="flex gap-1 justify-center flex-wrap">
                    {!trip.archived && availableSeats > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs bg-transparent"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setIsPassengerDialogOpen(true)
                        }}
                        disabled={isLoading}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />+
                      </Button>
                    )}

                    {!trip.archived && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs bg-transparent"
                        onClick={() => handleEditTrip(trip)}
                        disabled={isLoading}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs bg-transparent">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[720px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getTripIcon(trip.type)}
                            {trip.destino}
                            {trip.archived && <Badge variant="secondary">Archivado</Badge>}
                          </DialogTitle>
                          <DialogDescription className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {trip.fechaSalida.toLocaleDateString()} - {trip.fechaRegreso.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />${trip.currency === "USD" ? "US$" : "$"}
                              {trip.importe.toLocaleString()} por persona
                            </span>
                            <Badge
                              variant={
                                trip.type === "grupal" ? "default" : trip.type === "crucero" ? "secondary" : "outline"
                              }
                              className="flex items-center gap-1"
                            >
                              {trip.type === "grupal"
                                ? "👥 Salida Grupal"
                                : trip.type === "individual"
                                  ? "👤 Salida Individual"
                                  : trip.type === "crucero"
                                    ? "🚢 Crucero"
                                    : "✈️ Vuelo"}
                            </Badge>
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span>Ocupación</span>
                              <span>{Math.round(occupancyPercentage)}%</span>
                            </div>
                            <Progress value={occupancyPercentage} className="h-2" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Detalles del Servicio</h4>
                              <p className="text-sm text-muted-foreground">
                                {trip.type === "individual"
                                  ? "Servicio personalizado individual"
                                  : trip.type === "crucero"
                                    ? `${trip.naviera} - ${trip.barco} (${trip.cabina})`
                                    : trip.type === "aereo"
                                      ? `${trip.aerolinea} - Vuelo ${trip.numeroVuelo} (${trip.clase})`
                                      : `${bus?.patente} - ${bus?.tipoServicio}`}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Incluye</h4>
                              <p className="text-sm text-muted-foreground">{trip.descripcion}</p>
                            </div>
                          </div>

                          <TripTypeInfo trip={trip} />

                          {passengers.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">
                                {trip.type === "individual" ? "Cliente" : "Pasajeros Registrados"}
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {passengers.map((passenger) => {
                                  const client = clients.find((c) => c.id === passenger.clientId)
                                  return (
                                    <div
                                      key={passenger.id}
                                      className="flex items-center justify-between p-2 bg-muted rounded text-sm flex-wrap gap-2"
                                    >
                                      <div className="flex items-center gap-4 flex-1">
                                        {trip.type === "grupal" && (
                                          <span className="font-medium">Asiento {passenger.numeroAsiento}</span>
                                        )}
                                        {trip.type === "aereo" && (
                                          <span className="font-medium">Asiento {passenger.numeroAsiento}</span>
                                        )}
                                        {trip.type === "crucero" && (
                                          <span className="font-medium">Cabina {passenger.numeroCabina}</span>
                                        )}
                                        <span className="text-muted-foreground">{client?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {!trip.archived && (trip.type === "grupal" || trip.type === "aereo") && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 text-xs bg-transparent"
                                            onClick={() => openSeatChangeDialog(passenger, trip)}
                                            disabled={isLoading}
                                          >
                                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                                            Cambiar Asiento
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 text-xs bg-transparent"
                                          onClick={() => printVoucher(passenger, trip)}
                                        >
                                          <Ticket className="h-3 w-3 mr-1" />
                                          Voucher
                                        </Button>
                                        {passenger.pagado ? (
                                          <Badge variant="default" className="text-xs">
                                            Pagado
                                          </Badge>
                                        ) : (
                                          <>
                                            <Badge variant="secondary" className="text-xs">
                                              Pendiente
                                            </Badge>
                                            {!trip.archived && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs bg-transparent"
                                                onClick={() => {
                                                  setSelectedTrip(trip)
                                                  setSelectedPassenger(passenger)
                                                  setIsPaymentDialogOpen(true)
                                                }}
                                                disabled={isLoading}
                                              >
                                                <Receipt className="h-3 w-3 mr-1" />
                                                Cobrar
                                              </Button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-4 border-t">
                            {!trip.archived && availableSeats > 0 && (
                              <Button
                                onClick={() => {
                                  setSelectedTrip(trip)
                                  setIsPassengerDialogOpen(true)
                                }}
                                disabled={isLoading}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                {trip.type === "individual"
                                  ? "Asignar Cliente"
                                  : trip.type === "crucero"
                                    ? "Agregar Pasajero"
                                    : trip.type === "aereo"
                                      ? `Agregar Pasajero (${availableSeats} disponibles)`
                                      : `Agregar Pasajero (${availableSeats} disponibles)`}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              onClick={() =>
                                trip.archived ? handleUnarchiveTrip(trip.id) : handleArchiveTrip(trip.id)
                              }
                              disabled={isLoading}
                            >
                              {trip.archived ? (
                                <>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Desarchivar
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archivar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs bg-transparent"
                      onClick={() => (trip.archived ? handleUnarchiveTrip(trip.id) : handleArchiveTrip(trip.id))}
                      disabled={isLoading}
                    >
                      {trip.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {tripsToShow.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Viajes</CardTitle>
              <CardDescription>Organiza tus viajes por tipo y gestiona las reservas</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Nuevo Viaje
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo Viaje</DialogTitle>
                  <DialogDescription>Crea un nuevo viaje disponible para reservas</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    {/* TIPO DE VIAJE - PRIMERO */}
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipo de Viaje</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value, busId: "" })}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grupal">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Salida Grupal</div>
                                <div className="text-xs text-muted-foreground">Requiere bus - Múltiples pasajeros</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="individual">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Salida Individual</div>
                                <div className="text-xs text-muted-foreground">Sin bus - Servicio personalizado</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="crucero">
                            <div className="flex items-center gap-2">
                              <Ship className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Crucero</div>
                                <div className="text-xs text-muted-foreground">Viaje en barco - Cabinas</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="aereo">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Aéreo</div>
                                <div className="text-xs text-muted-foreground">Viaje en avión - Asientos</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* BUS - SEGUNDO (SOLO SI ES GRUPAL) */}
                    {formData.type === "grupal" && (
                      <div className="grid gap-2">
                        <Label htmlFor="busId">Bus</Label>
                        <Select
                          value={formData.busId}
                          onValueChange={(value) => setFormData({ ...formData, busId: value })}
                          required
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar bus" />
                          </SelectTrigger>
                          <SelectContent>
                            {buses.map((bus) => (
                              <SelectItem key={bus.id} value={bus.id}>
                                {bus.patente} - {bus.tipoServicio} ({bus.asientos} asientos)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* DESTINO - TERCERO */}
                    <div className="grid gap-2">
                      <Label htmlFor="destino">Destino</Label>
                      <Input
                        id="destino"
                        value={formData.destino}
                        onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                        type="text"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* FECHAS - CUARTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fechaSalida">Fecha de Salida</Label>
                        <Input
                          id="fechaSalida"
                          type="datetime-local"
                          value={formData.fechaSalida}
                          onChange={(e) => setFormData({ ...formData, fechaSalida: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fechaRegreso">Fecha de Regreso</Label>
                        <Input
                          id="fechaRegreso"
                          type="datetime-local"
                          value={formData.fechaRegreso}
                          onChange={(e) => setFormData({ ...formData, fechaRegreso: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/*IMPORTE Y MONEDA - QUINTO */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="importe">Importe por persona</Label>
                        <Input
                          id="importe"
                          type="number"
                          step="0.01"
                          value={formData.importe}
                          onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                          required
                          disabled={isLoading}
                        />
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
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ARS">🇦🇷 Pesos Argentinos</SelectItem>
                            <SelectItem value="USD">🇺🇸 Dólares Americanos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* CAMPOS ESPECÍFICOS PARA CRUCEROS */}
                    {formData.type === "crucero" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="naviera">Naviera</Label>
                            <Input
                              id="naviera"
                              value={formData.naviera}
                              onChange={(e) => setFormData({ ...formData, naviera: e.target.value })}
                              placeholder="Ej: MSC, Royal Caribbean"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="barco">Nombre del Barco</Label>
                            <Input
                              id="barco"
                              value={formData.barco}
                              onChange={(e) => setFormData({ ...formData, barco: e.target.value })}
                              placeholder="Ej: MSC Seaside"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cabina">Tipo de Cabina</Label>
                          <Input
                            id="cabina"
                            value={formData.cabina}
                            onChange={(e) => setFormData({ ...formData, cabina: e.target.value })}
                            placeholder="Ej: Interior, Balcón, Suite"
                            disabled={isLoading}
                          />
                        </div>
                      </>
                    )}

                    {/* CAMPOS ESPECÍFICOS PARA AÉREOS */}
                    {formData.type === "aereo" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="aerolinea">Aerolínea</Label>
                            <Input
                              id="aerolinea"
                              value={formData.aerolinea}
                              onChange={(e) => setFormData({ ...formData, aerolinea: e.target.value })}
                              placeholder="Ej: Aerolíneas Argentinas"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="numeroVuelo">Número de Vuelo</Label>
                            <Input
                              id="numeroVuelo"
                              value={formData.numeroVuelo}
                              onChange={(e) => setFormData({ ...formData, numeroVuelo: e.target.value })}
                              placeholder="Ej: AR1234"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="clase">Clase</Label>
                            <Select
                              value={formData.clase}
                              onValueChange={(value) => setFormData({ ...formData, clase: value })}
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar clase" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="economica">Económica</SelectItem>
                                <SelectItem value="premium">Premium Economy</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="primera">Primera Clase</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="escalas">Escalas (opcional)</Label>
                            <Input
                              id="escalas"
                              value={formData.escalas}
                              onChange={(e) => setFormData({ ...formData, escalas: e.target.value })}
                              placeholder="Ej: 1 escala en Lima"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* DESCRIPCIÓN - ÚLTIMO */}
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion">Descripción / Incluye</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Describe qué incluye el viaje..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Crear Viaje"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="grupal" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupales ({grupalTrips.length})
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Individuales ({individualTrips.length})
              </TabsTrigger>
              <TabsTrigger value="crucero" className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Cruceros ({cruceroTrips.length})
              </TabsTrigger>
              <TabsTrigger value="aereo" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Aéreos ({aereoTrips.length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archivados ({archivedTrips.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grupal">
              {renderTripGrid(grupalTrips, "No hay viajes grupales disponibles")}
            </TabsContent>

            <TabsContent value="individual">
              {renderTripGrid(individualTrips, "No hay viajes individuales disponibles")}
            </TabsContent>

            <TabsContent value="crucero">{renderTripGrid(cruceroTrips, "No hay cruceros disponibles")}</TabsContent>

            <TabsContent value="aereo">{renderTripGrid(aereoTrips, "No hay vuelos disponibles")}</TabsContent>

            <TabsContent value="archived">{renderTripGrid(archivedTrips, "No hay viajes archivados")}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* DIALOGO PARA EDITAR VIAJE */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Viaje</DialogTitle>
            <DialogDescription>Modifica los detalles del viaje</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              {/* TIPO DE VIAJE - PRIMERO */}
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Tipo de Viaje</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value, busId: "" })}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grupal">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Salida Grupal</div>
                          <div className="text-xs text-muted-foreground">Requiere bus - Múltiples pasajeros</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Salida Individual</div>
                          <div className="text-xs text-muted-foreground">Sin bus - Servicio personalizado</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="crucero">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Crucero</div>
                          <div className="text-xs text-muted-foreground">Viaje en barco - Cabinas</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="aereo">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Aéreo</div>
                          <div className="text-xs text-muted-foreground">Viaje en avión - Asientos</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BUS - SEGUNDO (SOLO SI ES GRUPAL) */}
              {formData.type === "grupal" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-busId">Bus</Label>
                  <Select
                    value={formData.busId}
                    onValueChange={(value) => setFormData({ ...formData, busId: value })}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.patente} - {bus.tipoServicio} ({bus.asientos} asientos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* DESTINO - TERCERO */}
              <div className="grid gap-2">
                <Label htmlFor="edit-destino">Destino</Label>
                <Input
                  id="edit-destino"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  type="text"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* FECHAS - CUARTO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fechaSalida">Fecha de Salida</Label>
                  <Input
                    id="edit-fechaSalida"
                    type="datetime-local"
                    value={formData.fechaSalida}
                    onChange={(e) => setFormData({ ...formData, fechaSalida: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-fechaRegreso">Fecha de Regreso</Label>
                  <Input
                    id="edit-fechaRegreso"
                    type="datetime-local"
                    value={formData.fechaRegreso}
                    onChange={(e) => setFormData({ ...formData, fechaRegreso: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/*IMPORTE Y MONEDA - QUINTO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-importe">Importe por persona</Label>
                  <Input
                    id="edit-importe"
                    type="number"
                    step="0.01"
                    value={formData.importe}
                    onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                    required
                    disabled={isLoading}
                  />
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">🇦🇷 Pesos Argentinos</SelectItem>
                      <SelectItem value="USD">🇺🇸 Dólares Americanos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS PARA CRUCEROS */}
              {formData.type === "crucero" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-naviera">Naviera</Label>
                      <Input
                        id="edit-naviera"
                        value={formData.naviera}
                        onChange={(e) => setFormData({ ...formData, naviera: e.target.value })}
                        placeholder="Ej: MSC, Royal Caribbean"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-barco">Nombre del Barco</Label>
                      <Input
                        id="edit-barco"
                        value={formData.barco}
                        onChange={(e) => setFormData({ ...formData, barco: e.target.value })}
                        placeholder="Ej: MSC Seaside"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cabina">Tipo de Cabina</Label>
                    <Input
                      id="edit-cabina"
                      value={formData.cabina}
                      onChange={(e) => setFormData({ ...formData, cabina: e.target.value })}
                      placeholder="Ej: Interior, Balcón, Suite"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {/* CAMPOS ESPECÍFICOS PARA AÉREOS */}
              {formData.type === "aereo" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-aerolinea">Aerolínea</Label>
                      <Input
                        id="edit-aerolinea"
                        value={formData.aerolinea}
                        onChange={(e) => setFormData({ ...formData, aerolinea: e.target.value })}
                        placeholder="Ej: Aerolíneas Argentinas"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-numeroVuelo">Número de Vuelo</Label>
                      <Input
                        id="edit-numeroVuelo"
                        value={formData.numeroVuelo}
                        onChange={(e) => setFormData({ ...formData, numeroVuelo: e.target.value })}
                        placeholder="Ej: AR1234"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-clase">Clase</Label>
                      <Select
                        value={formData.clase}
                        onValueChange={(value) => setFormData({ ...formData, clase: value })}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar clase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="economica">Económica</SelectItem>
                          <SelectItem value="premium">Premium Economy</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="primera">Primera Clase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-escalas">Escalas (opcional)</Label>
                      <Input
                        id="edit-escalas"
                        value={formData.escalas}
                        onChange={(e) => setFormData({ ...formData, escalas: e.target.value })}
                        placeholder="Ej: 1 escala en Lima"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* DESCRIPCIÓN - ÚLTIMO */}
              <div className="grid gap-2">
                <Label htmlFor="edit-descripcion">Descripción / Incluye</Label>
                <Textarea
                  id="edit-descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe qué incluye el viaje..."
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetEditForm} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Actualizar Viaje"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOGO PARA AGREGAR PASAJERO */}
      <Dialog open={isPassengerDialogOpen} onOpenChange={setIsPassengerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTrip?.type === "individual"
                ? "Asignar Cliente"
                : selectedTrip?.type === "crucero"
                  ? "Agregar Pasajero al Crucero"
                  : selectedTrip?.type === "aereo"
                    ? "Agregar Pasajero al Vuelo"
                    : "Agregar Pasajero al Viaje"}
            </DialogTitle>
            <DialogDescription>
              {selectedTrip?.type === "individual"
                ? "Asigna un cliente a este viaje individual"
                : selectedTrip?.type === "crucero"
                  ? "Selecciona el cliente y asigna una cabina"
                  : selectedTrip?.type === "aereo"
                    ? "Selecciona el cliente y asigna un asiento"
                    : "Selecciona el cliente y asigna un asiento"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPassenger}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="passenger-client">Cliente</Label>
                <Select value={passengerClientId} onValueChange={setPassengerClientId} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTrip &&
                      getAvailableClients(selectedTrip.id).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.dni}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrip?.type === "grupal" && (
                <div className="grid gap-2">
                  <Label htmlFor="passenger-seat">Asiento</Label>
                  <Select value={selectedSeat} onValueChange={setSelectedSeat} required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSeatNumbers(selectedTrip).map((seatNumber) => (
                        <SelectItem key={seatNumber} value={seatNumber.toString()}>
                          Asiento {seatNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedTrip?.type === "aereo" && (
                <div className="grid gap-2">
                  <Label htmlFor="passenger-seat-aereo">Asiento</Label>
                  <Select value={selectedSeat} onValueChange={setSelectedSeat} required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSeatNumbers(selectedTrip)
                        .slice(0, 50)
                        .map((seatNumber) => (
                          <SelectItem key={seatNumber} value={seatNumber.toString()}>
                            Asiento {seatNumber}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedTrip?.type === "crucero" && (
                <div className="grid gap-2">
                  <Label htmlFor="passenger-cabin">Número de Cabina</Label>
                  <Input
                    id="passenger-cabin"
                    value={selectedCabin}
                    onChange={(e) => setSelectedCabin(e.target.value)}
                    placeholder="Ej: A101, B205, Suite 301"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPassengerClientId("")
                  setSelectedSeat("")
                  setSelectedCabin("")
                  setIsPassengerDialogOpen(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : selectedTrip?.type === "individual" ? (
                  "Asignar Cliente"
                ) : (
                  "Agregar Pasajero"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOGO PARA CAMBIAR ASIENTO */}
      <Dialog open={isSeatChangeDialogOpen} onOpenChange={setIsSeatChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Asiento</DialogTitle>
            <DialogDescription>Selecciona el nuevo asiento para el pasajero</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeSeat}>
            <div className="grid gap-4 py-4">
              {selectedPassenger && selectedTrip && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Pasajero</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      Cliente: {clients.find((c) => c.id === selectedPassenger.clientId)?.name || "Desconocido"}
                    </div>
                    <div>Asiento actual: {selectedPassenger.numeroAsiento}</div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="new-seat">Nuevo Asiento</Label>
                <Select value={newSeatNumber} onValueChange={setNewSeatNumber} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nuevo asiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTrip &&
                      getAvailableSeatNumbers(selectedTrip, selectedPassenger?.id).map((seatNumber) => (
                        <SelectItem key={seatNumber} value={seatNumber.toString()}>
                          Asiento {seatNumber}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewSeatNumber("")
                  setIsSeatChangeDialogOpen(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Cambiar Asiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOGO PARA PROCESAR PAGO */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>Registra el pago del cliente para este viaje</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment}>
            <div className="grid gap-4 py-4">
              {selectedPassenger && selectedTrip && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Detalles del Viaje</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      Cliente: {clients.find((c) => c.id === selectedPassenger.clientId)?.name || "Desconocido"}
                    </div>
                    <div>Destino: {selectedTrip.destino}</div>
                    <div>
                      Importe: {selectedTrip.currency === "USD" ? "US$" : "$"}
                      {selectedTrip.importe.toLocaleString()}
                    </div>
                    {selectedTrip.type === "grupal" && <div>Asiento: {selectedPassenger.numeroAsiento}</div>}
                    {selectedTrip.type === "aereo" && <div>Asiento: {selectedPassenger.numeroAsiento}</div>}
                    {selectedTrip.type === "crucero" && <div>Cabina: {selectedPassenger.numeroCabina}</div>}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="payment-amount">Monto del Pago</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={selectedTrip ? selectedTrip.importe.toString() : "0"}
                  required
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  {selectedTrip && (
                    <>
                      Importe total: {selectedTrip.currency === "USD" ? "US$" : "$"}
                      {selectedTrip.importe.toLocaleString()}
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentAmount("")
                  setIsPaymentDialogOpen(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Procesar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOGO PARA VER IMAGEN COMPLETA */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Distribución de Asientos - {selectedTrip && buses.find((b) => b.id === selectedTrip.busId)?.patente}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedTrip && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {buses.find((b) => b.id === selectedTrip.busId)?.tipoServicio} -{" "}
                    {buses.find((b) => b.id === selectedTrip.busId)?.asientos} asientos
                  </p>
                </div>
                <div className="flex justify-center">
                  <Image
                    src={buses.find((b) => b.id === selectedTrip.busId)?.imagenDistribucion || "/placeholder.svg"}
                    alt={`Distribución ${buses.find((b) => b.id === selectedTrip.busId)?.patente}`}
                    width={600}
                    height={400}
                    className="rounded-lg border object-contain max-w-full max-h-[500px]"
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MOSTRAR RECIBO DESPUÉS DEL PAGO */}
      {selectedPayment && (
        <Dialog
          open={!!selectedPayment}
          onOpenChange={() => {
            setSelectedPayment(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pago Procesado Exitosamente</DialogTitle>
              <DialogDescription>El pago se ha registrado correctamente</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {selectedPayment.currency === "USD" ? "US$" : "$"}
                  {selectedPayment.amount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Recibo N° {selectedPayment.receiptNumber}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => printReceipt(selectedPayment)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo
              </Button>
              <Button onClick={() => setSelectedPayment(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
