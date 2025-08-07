'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Plane, Ship, Bus, Users, Calendar, MapPin, DollarSign, FileDown, Trash2, Edit, Plus, UserPlus, Printer, Eye } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { 
  createTrip, 
  updateTrip, 
  deleteTrip, 
  createTripPassenger, 
  deleteTripPassenger,
  getTrips,
  getTripPassengers,
  getClients,
  getBuses
} from '@/app/actions/database'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  dni: string
  fechaNacimiento: Date
  address: string
  createdAt: Date
}

interface Bus {
  id: string
  patente: string
  asientos: number
  tipoServicio: string
  createdAt: Date
}

interface Trip {
  id: string
  destino: string
  fechaSalida: Date
  fechaRegreso: Date
  importe: number
  currency: 'ARS' | 'USD'
  type: 'aereo' | 'crucero' | 'individual' | 'grupal'
  descripcion?: string
  busId?: string
  archived: boolean
  createdAt: Date
}

interface TripPassenger {
  id: string
  tripId: string
  clientId: string
  numeroAsiento?: number
  numeroCabina?: string
  pagado: boolean
  fechaReserva: Date
}

interface TripsManagerProps {
  trips: Trip[]
  onDataChange: () => void
}

export function TripsManager({ trips, onDataChange }: TripsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isAddPassengerDialogOpen, setIsAddPassengerDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripPassengers, setTripPassengers] = useState<TripPassenger[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    destino: '',
    fechaSalida: '',
    fechaRegreso: '',
    importe: '',
    currency: 'ARS' as 'ARS' | 'USD',
    type: 'individual' as Trip['type'],
    descripcion: '',
    busId: ''
  })

  const [passengerFormData, setPassengerFormData] = useState({
    clientId: '',
    numeroAsiento: '',
    numeroCabina: '',
    pagado: false
  })

  useEffect(() => {
    loadClients()
    loadBuses()
  }, [])

  const loadClients = async () => {
    try {
      const clientsData = await getClients()
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      })
    }
  }

  const loadBuses = async () => {
    try {
      const busesData = await getBuses()
      setBuses(busesData)
    } catch (error) {
      console.error('Error loading buses:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los buses",
        variant: "destructive"
      })
    }
  }

  const loadTripPassengers = async (tripId: string) => {
    try {
      setLoading(true)
      const allPassengers = await getTripPassengers()
      const filteredPassengers = allPassengers.filter(p => p.tripId === tripId)
      
      // Ordenar pasajeros por número de asiento/cabina
      const sortedPassengers = filteredPassengers.sort((a, b) => {
        if (selectedTrip?.type === 'crucero') {
          const cabinA = a.numeroCabina || ''
          const cabinB = b.numeroCabina || ''
          return cabinA.localeCompare(cabinB)
        } else {
          const seatA = a.numeroAsiento || 0
          const seatB = b.numeroAsiento || 0
          return seatA - seatB
        }
      })
      
      setTripPassengers(sortedPassengers)
    } catch (error) {
      console.error('Error loading trip passengers:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pasajeros del viaje",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createTrip({
        destino: formData.destino,
        fechaSalida: new Date(formData.fechaSalida),
        fechaRegreso: new Date(formData.fechaRegreso),
        importe: parseFloat(formData.importe),
        currency: formData.currency,
        type: formData.type,
        descripcion: formData.descripcion,
        busId: formData.busId || undefined,
        archived: false
      })

      toast({
        title: "Éxito",
        description: "Viaje creado correctamente"
      })

      setIsCreateDialogOpen(false)
      resetForm()
      onDataChange()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el viaje",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return

    setLoading(true)

    try {
      await updateTrip(selectedTrip.id, {
        destino: formData.destino,
        fechaSalida: new Date(formData.fechaSalida),
        fechaRegreso: new Date(formData.fechaRegreso),
        importe: parseFloat(formData.importe),
        currency: formData.currency,
        type: formData.type,
        descripcion: formData.descripcion,
        busId: formData.busId || undefined
      })

      toast({
        title: "Éxito",
        description: "Viaje actualizado correctamente"
      })

      setIsEditDialogOpen(false)
      resetForm()
      onDataChange()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId)
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente"
      })
      onDataChange()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive"
      })
    }
  }

  const handleAddPassenger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return

    setLoading(true)

    try {
      await createTripPassenger({
        tripId: selectedTrip.id,
        clientId: passengerFormData.clientId,
        numeroAsiento: selectedTrip.type !== 'crucero' ? parseInt(passengerFormData.numeroAsiento) || 0 : 0,
        numeroCabina: selectedTrip.type === 'crucero' ? passengerFormData.numeroCabina : undefined,
        pagado: passengerFormData.pagado
      })

      toast({
        title: "Éxito",
        description: "Pasajero agregado correctamente"
      })

      setIsAddPassengerDialogOpen(false)
      resetPassengerForm()
      loadTripPassengers(selectedTrip.id)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el pasajero",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePassenger = async (passengerId: string) => {
    try {
      await deleteTripPassenger(passengerId)
      toast({
        title: "Éxito",
        description: "Pasajero eliminado correctamente"
      })
      if (selectedTrip) {
        loadTripPassengers(selectedTrip.id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el pasajero",
        variant: "destructive"
      })
    }
  }

  const exportToExcel = () => {
    if (!selectedTrip || tripPassengers.length === 0) {
      toast({
        title: "Error",
        description: "No hay pasajeros para exportar",
        variant: "destructive"
      })
      return
    }

    const data = tripPassengers.map(passenger => {
      const client = clients.find(c => c.id === passenger.clientId)
      const fullName = client?.name || ''
      const nameParts = fullName.trim().split(' ')
      const lastName = nameParts.length > 1 ? nameParts.slice(-1).join(' ') : ''
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : fullName

      return {
        'Apellido': lastName,
        'Nombre': firstName,
        'Fecha de Nacimiento': client?.fechaNacimiento ? 
          client.fechaNacimiento.toLocaleDateString('es-ES') : '',
        'Número de Documento': client?.dni || '',
        'Teléfono': client?.phone || '',
        'Email': client?.email || '',
        [selectedTrip.type === 'crucero' ? 'Cabina' : 'Asiento']: 
          selectedTrip.type === 'crucero' ? 
          (passenger.numeroCabina || '') : 
          (passenger.numeroAsiento?.toString() || ''),
        'Estado de Pago': passenger.pagado ? 'Pagado' : 'Pendiente',
        'Fecha de Reserva': passenger.fechaReserva.toLocaleDateString('es-ES')
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    
    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 20 }, // Apellido
      { wch: 20 }, // Nombre
      { wch: 18 }, // Fecha de Nacimiento
      { wch: 15 }, // Número de Documento
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Email
      { wch: 10 }, // Asiento/Cabina
      { wch: 15 }, // Estado de Pago
      { wch: 15 }  // Fecha de Reserva
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Pasajeros')
    const departureDate = selectedTrip.fechaSalida.toLocaleDateString('es-ES').replace(/\//g, '-')
    const fileName = `Pasajeros_${selectedTrip.destino}_${departureDate}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    toast({
      title: "Éxito",
      description: `Lista de pasajeros exportada como ${fileName}`
    })
  }

  const generatePDF = () => {
    if (!selectedTrip || tripPassengers.length === 0) {
      toast({
        title: "Error",
        description: "No hay pasajeros para generar el PDF",
        variant: "destructive"
      })
      return
    }

    try {
      const doc = new jsPDF()
      
      // Título del documento
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(`Lista de Pasajeros - ${selectedTrip.destino}`, 20, 20)
      
      // Información del viaje
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de Salida: ${selectedTrip.fechaSalida.toLocaleDateString('es-ES')}`, 20, 35)
      doc.text(`Fecha de Regreso: ${selectedTrip.fechaRegreso.toLocaleDateString('es-ES')}`, 20, 45)
      doc.text(`Precio: ${selectedTrip.currency} $${selectedTrip.importe.toLocaleString()}`, 20, 55)
      
      // Obtener y ordenar pasajeros alfabéticamente
      const passengersWithClients = tripPassengers
        .map(passenger => {
          const client = clients.find(c => c.id === passenger.clientId)
          return { passenger, client }
        })
        .filter(item => item.client)
        .sort((a, b) => {
          const nameA = `${a.client!.name}`.toLowerCase()
          const nameB = `${b.client!.name}`.toLowerCase()
          return nameA.localeCompare(nameB)
        })

      // Encabezados de la tabla
      let yPosition = 75
      doc.setFont('helvetica', 'bold')
      doc.text('N°', 20, yPosition)
      doc.text('Apellido y Nombre', 35, yPosition)
      doc.text('N° Documento', 120, yPosition)
      doc.text('Fecha Nacimiento', 160, yPosition)
      
      // Línea separadora
      doc.line(20, yPosition + 3, 190, yPosition + 3)
      
      // Datos de los pasajeros
      doc.setFont('helvetica', 'normal')
      yPosition += 15
      
      passengersWithClients.forEach((item, index) => {
        const { client } = item
        
        // Verificar si necesitamos una nueva página
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
          
          // Repetir encabezados en nueva página
          doc.setFont('helvetica', 'bold')
          doc.text('N°', 20, yPosition)
          doc.text('Apellido y Nombre', 35, yPosition)
          doc.text('N° Documento', 120, yPosition)
          doc.text('Fecha Nacimiento', 160, yPosition)
          doc.line(20, yPosition + 3, 190, yPosition + 3)
          doc.setFont('helvetica', 'normal')
          yPosition += 15
        }
        
        // Número correlativo
        doc.text(`${index + 1}`, 20, yPosition)
        
        // Apellido y nombre
        const fullName = client!.name || ''
        doc.text(fullName, 35, yPosition)
        
        // Número de documento
        doc.text(client!.dni || '', 120, yPosition)
        
        // Fecha de nacimiento
        const birthDate = client!.fechaNacimiento ? 
          client!.fechaNacimiento.toLocaleDateString('es-ES') : ''
        doc.text(birthDate, 160, yPosition)
        
        yPosition += 10
      })
      
      // Pie de página con fecha de generación
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Generado el ${new Date().toLocaleDateString('es-ES')} - Página ${i} de ${pageCount}`,
          20,
          285
        )
      }
      
      // Guardar el PDF
      const fileName = `Lista_Pasajeros_${selectedTrip.destino}_${selectedTrip.fechaSalida.toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`
      doc.save(fileName)
      
      toast({
        title: "Éxito",
        description: "Lista de pasajeros generada en PDF correctamente"
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      destino: '',
      fechaSalida: '',
      fechaRegreso: '',
      importe: '',
      currency: 'ARS',
      type: 'individual',
      descripcion: '',
      busId: ''
    })
    setSelectedTrip(null)
  }

  const resetPassengerForm = () => {
    setPassengerFormData({
      clientId: '',
      numeroAsiento: '',
      numeroCabina: '',
      pagado: false
    })
  }

  const openEditDialog = (trip: Trip) => {
    setSelectedTrip(trip)
    setFormData({
      destino: trip.destino,
      fechaSalida: trip.fechaSalida.toISOString().split('T')[0],
      fechaRegreso: trip.fechaRegreso.toISOString().split('T')[0],
      importe: trip.importe.toString(),
      currency: trip.currency,
      type: trip.type,
      descripcion: trip.descripcion || '',
      busId: trip.busId || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDetailsDialog = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsDetailsDialogOpen(true)
    loadTripPassengers(trip.id)
  }

  const getTripIcon = (type: string) => {
    switch (type) {
      case 'aereo': return <Plane className="h-4 w-4" />
      case 'crucero': return <Ship className="h-4 w-4" />
      case 'individual': return <Bus className="h-4 w-4" />
      case 'grupal': return <Users className="h-4 w-4" />
      default: return <Plane className="h-4 w-4" />
    }
  }

  const getTripTypeLabel = (type: string) => {
    switch (type) {
      case 'aereo': return 'Aéreo'
      case 'crucero': return 'Crucero'
      case 'individual': return 'Individual'
      case 'grupal': return 'Grupal'
      default: return 'Aéreo'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Viajes</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Viaje</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destino">Destino</Label>
                  <Input
                    id="destino"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Viaje</Label>
                  <Select value={formData.type} onValueChange={(value: Trip['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aereo">Aéreo</SelectItem>
                      <SelectItem value="crucero">Crucero</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="grupal">Grupal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaSalida">Fecha de Salida</Label>
                  <Input
                    id="fechaSalida"
                    type="date"
                    value={formData.fechaSalida}
                    onChange={(e) => setFormData({ ...formData, fechaSalida: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fechaRegreso">Fecha de Regreso</Label>
                  <Input
                    id="fechaRegreso"
                    type="date"
                    value={formData.fechaRegreso}
                    onChange={(e) => setFormData({ ...formData, fechaRegreso: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="importe">Precio</Label>
                  <Input
                    id="importe"
                    type="number"
                    step="0.01"
                    value={formData.importe}
                    onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={formData.currency} onValueChange={(value: 'ARS' | 'USD') => setFormData({ ...formData, currency: value })}>
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
              {formData.type === 'grupal' && (
                <div>
                  <Label htmlFor="busId">Bus</Label>
                  <Select value={formData.busId} onValueChange={(value) => setFormData({ ...formData, busId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.patente} - {bus.asientos} asientos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Viaje'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de tarjetas de viajes - Diseño anterior restaurado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips.filter(trip => !trip.archived).map((trip) => (
          <Card key={trip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTripIcon(trip.type)}
                  <CardTitle className="text-lg">{trip.destino}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {getTripTypeLabel(trip.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {trip.fechaSalida.toLocaleDateString('es-ES')} - {trip.fechaRegreso.toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                {trip.currency} ${trip.importe.toLocaleString()}
              </div>
              {trip.descripcion && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {trip.descripcion}
                </p>
              )}
              <Separator />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetailsDialog(trip)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <div className="space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(trip)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el viaje "{trip.destino}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para editar viaje */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Viaje</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTrip} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_destino">Destino</Label>
                <Input
                  id="edit_destino"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_type">Tipo de Viaje</Label>
                <Select value={formData.type} onValueChange={(value: Trip['type']) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aereo">Aéreo</SelectItem>
                    <SelectItem value="crucero">Crucero</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupal">Grupal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_fechaSalida">Fecha de Salida</Label>
                <Input
                  id="edit_fechaSalida"
                  type="date"
                  value={formData.fechaSalida}
                  onChange={(e) => setFormData({ ...formData, fechaSalida: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_fechaRegreso">Fecha de Regreso</Label>
                <Input
                  id="edit_fechaRegreso"
                  type="date"
                  value={formData.fechaRegreso}
                  onChange={(e) => setFormData({ ...formData, fechaRegreso: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_importe">Precio</Label>
                <Input
                  id="edit_importe"
                  type="number"
                  step="0.01"
                  value={formData.importe}
                  onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_currency">Moneda</Label>
                <Select value={formData.currency} onValueChange={(value: 'ARS' | 'USD') => setFormData({ ...formData, currency: value })}>
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
            {formData.type === 'grupal' && (
              <div>
                <Label htmlFor="edit_busId">Bus</Label>
                <Select value={formData.busId} onValueChange={(value) => setFormData({ ...formData, busId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.patente} - {bus.asientos} asientos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="edit_descripcion">Descripción</Label>
              <Textarea
                id="edit_descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Viaje'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles del viaje */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedTrip && getTripIcon(selectedTrip.type)}
              <span>Detalles del Viaje: {selectedTrip?.destino}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="passengers">Pasajeros ({tripPassengers.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Destino</Label>
                    <p className="text-sm font-medium">{selectedTrip.destino}</p>
                  </div>
                  <div>
                    <Label>Tipo de Viaje</Label>
                    <p className="text-sm font-medium">{getTripTypeLabel(selectedTrip.type)}</p>
                  </div>
                  <div>
                    <Label>Fecha de Salida</Label>
                    <p className="text-sm font-medium">{selectedTrip.fechaSalida.toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <Label>Fecha de Regreso</Label>
                    <p className="text-sm font-medium">{selectedTrip.fechaRegreso.toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <Label>Precio</Label>
                    <p className="text-sm font-medium">{selectedTrip.currency} ${selectedTrip.importe.toLocaleString()}</p>
                  </div>
                </div>
                {selectedTrip.descripcion && (
                  <div>
                    <Label>Descripción</Label>
                    <p className="text-sm">{selectedTrip.descripcion}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="passengers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Lista de Pasajeros</h3>
                  <div className="space-x-2">
                    {tripPassengers.length > 0 && (
                      <>
                        <Button onClick={generatePDF} variant="outline" size="sm">
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir PDF
                        </Button>
                        <Button onClick={exportToExcel} variant="outline" size="sm">
                          <FileDown className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </Button>
                      </>
                    )}
                    <Dialog open={isAddPassengerDialogOpen} onOpenChange={setIsAddPassengerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Agregar Pasajero
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Pasajero</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddPassenger} className="space-y-4">
                          <div>
                            <Label htmlFor="clientId">Cliente</Label>
                            <Select value={passengerFormData.clientId} onValueChange={(value) => setPassengerFormData({ ...passengerFormData, clientId: value })}>
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
                          {selectedTrip.type === 'crucero' ? (
                            <div>
                              <Label htmlFor="numeroCabina">Número de Cabina</Label>
                              <Input
                                id="numeroCabina"
                                value={passengerFormData.numeroCabina}
                                onChange={(e) => setPassengerFormData({ ...passengerFormData, numeroCabina: e.target.value })}
                                placeholder="Ej: A101, B205"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="numeroAsiento">Número de Asiento</Label>
                              <Input
                                id="numeroAsiento"
                                value={passengerFormData.numeroAsiento}
                                onChange={(e) => setPassengerFormData({ ...passengerFormData, numeroAsiento: e.target.value })}
                                placeholder="Ej: 12, 15"
                              />
                            </div>
                          )}
                          <div>
                            <Label htmlFor="pagado">Estado de Pago</Label>
                            <Select value={passengerFormData.pagado ? 'paid' : 'pending'} onValueChange={(value) => setPassengerFormData({ ...passengerFormData, pagado: value === 'paid' })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="paid">Pagado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddPassengerDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? 'Agregando...' : 'Agregar Pasajero'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {tripPassengers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay pasajeros registrados para este viaje
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tripPassengers.map((passenger) => {
                      const client = clients.find(c => c.id === passenger.clientId)
                      if (!client) return null
                      
                      return (
                        <Card key={passenger.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-medium">{client.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  DNI: {client.dni} | Tel: {client.phone}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Email: {client.email}
                                </p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span>
                                    {selectedTrip.type === 'crucero' ? 'Cabina' : 'Asiento'}: {' '}
                                    <span className="font-medium">
                                      {selectedTrip.type === 'crucero' ? passenger.numeroCabina : passenger.numeroAsiento}
                                    </span>
                                  </span>
                                  <Badge variant={passenger.pagado ? 'default' : 'secondary'}>
                                    {passenger.pagado ? 'Pagado' : 'Pendiente'}
                                  </Badge>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar pasajero?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente a "{client.name}" de este viaje.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePassenger(passenger.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
