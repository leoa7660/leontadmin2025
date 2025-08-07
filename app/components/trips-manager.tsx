'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Plane, Ship, Bus, Users, Calendar, MapPin, DollarSign, FileDown, Trash2, Edit, Plus, UserPlus, Printer } from 'lucide-react'
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
  const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripPassengers, setTripPassengers] = useState<TripPassenger[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)

  const [newTrip, setNewTrip] = useState({
    destino: '',
    fechaSalida: '',
    fechaRegreso: '',
    importe: 0,
    currency: 'ARS' as 'ARS' | 'USD',
    type: 'individual' as Trip['type'],
    descripcion: '',
    busId: '',
    archived: false
  })

  const [newPassenger, setNewPassenger] = useState({
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
      setTripPassengers(filteredPassengers)
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

  const handleCreateTrip = async () => {
    try {
      setLoading(true)
      await createTrip({
        destino: newTrip.destino,
        fechaSalida: new Date(newTrip.fechaSalida),
        fechaRegreso: new Date(newTrip.fechaRegreso),
        importe: newTrip.importe,
        currency: newTrip.currency,
        type: newTrip.type,
        descripcion: newTrip.descripcion,
        busId: newTrip.busId || undefined,
        archived: false
      })
      setNewTrip({
        destino: '',
        fechaSalida: '',
        fechaRegreso: '',
        importe: 0,
        currency: 'ARS',
        type: 'individual',
        descripcion: '',
        busId: '',
        archived: false
      })
      setIsCreateDialogOpen(false)
      onDataChange()
      toast({
        title: "Éxito",
        description: "Viaje creado correctamente"
      })
    } catch (error) {
      console.error('Error creating trip:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el viaje",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTrip = async () => {
    if (!selectedTrip) return
    
    try {
      setLoading(true)
      await updateTrip(selectedTrip.id, {
        destino: newTrip.destino,
        fechaSalida: new Date(newTrip.fechaSalida),
        fechaRegreso: new Date(newTrip.fechaRegreso),
        importe: newTrip.importe,
        currency: newTrip.currency,
        type: newTrip.type,
        descripcion: newTrip.descripcion,
        busId: newTrip.busId || undefined
      })
      setIsEditDialogOpen(false)
      setSelectedTrip(null)
      onDataChange()
      toast({
        title: "Éxito",
        description: "Viaje actualizado correctamente"
      })
    } catch (error) {
      console.error('Error updating trip:', error)
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
    if (!confirm('¿Estás seguro de que quieres eliminar este viaje?')) return
    
    try {
      setLoading(true)
      await deleteTrip(tripId)
      onDataChange()
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente"
      })
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPassenger = async () => {
    if (!selectedTrip) return
    
    try {
      setLoading(true)
      await createTripPassenger({
        tripId: selectedTrip.id,
        clientId: newPassenger.clientId,
        numeroAsiento: selectedTrip.type !== 'crucero' ? parseInt(newPassenger.numeroAsiento) || 0 : 0,
        numeroCabina: selectedTrip.type === 'crucero' ? newPassenger.numeroCabina : undefined,
        pagado: newPassenger.pagado
      })
      setNewPassenger({
        clientId: '',
        numeroAsiento: '',
        numeroCabina: '',
        pagado: false
      })
      await loadTripPassengers(selectedTrip.id)
      toast({
        title: "Éxito",
        description: "Pasajero agregado al viaje"
      })
    } catch (error) {
      console.error('Error adding passenger:', error)
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
    if (!confirm('¿Estás seguro de que quieres eliminar este pasajero del viaje?')) return
    
    try {
      setLoading(true)
      await deleteTripPassenger(passengerId)
      if (selectedTrip) {
        await loadTripPassengers(selectedTrip.id)
      }
      toast({
        title: "Éxito",
        description: "Pasajero eliminado del viaje"
      })
    } catch (error) {
      console.error('Error deleting passenger:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pasajero",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (trip: Trip) => {
    setSelectedTrip(trip)
    setNewTrip({
      destino: trip.destino,
      fechaSalida: trip.fechaSalida.toISOString().split('T')[0],
      fechaRegreso: trip.fechaRegreso.toISOString().split('T')[0],
      importe: trip.importe,
      currency: trip.currency,
      type: trip.type,
      descripcion: trip.descripcion || '',
      busId: trip.busId || '',
      archived: trip.archived
    })
    setIsEditDialogOpen(true)
  }

  const openPassengerDialog = (trip: Trip) => {
    setSelectedTrip(trip)
    loadTripPassengers(trip.id)
    setIsPassengerDialogOpen(true)
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
      return {
        'Nombre': client?.name || '',
        'Email': client?.email || '',
        'Teléfono': client?.phone || '',
        'Documento': client?.dni || '',
        'Fecha Nacimiento': client?.fechaNacimiento ? client.fechaNacimiento.toLocaleDateString('es-ES') : '',
        'Asiento/Cabina': selectedTrip.type === 'crucero' ? passenger.numeroCabina : passenger.numeroAsiento,
        'Estado Pago': passenger.pagado ? 'Pagado' : 'Pendiente'
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pasajeros')
    XLSX.writeFile(wb, `pasajeros_${selectedTrip.destino}_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    toast({
      title: "Éxito",
      description: "Lista de pasajeros exportada correctamente"
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

  const getTripIcon = (tipo: string) => {
    switch (tipo) {
      case 'aereo': return <Plane className="h-4 w-4" />
      case 'crucero': return <Ship className="h-4 w-4" />
      case 'grupal': return <Users className="h-4 w-4" />
      default: return <Bus className="h-4 w-4" />
    }
  }

  const getStatusBadge = (archived: boolean) => {
    return <Badge variant={archived ? 'secondary' : 'default'}>
      {archived ? 'Archivado' : 'Activo'}
    </Badge>
  }

  const getPaymentStatusBadge = (pagado: boolean) => {
    return <Badge variant={pagado ? 'default' : 'destructive'}>
      {pagado ? 'Pagado' : 'Pendiente'}
    </Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Viajes</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destino">Destino</Label>
                <Input
                  id="destino"
                  value={newTrip.destino}
                  onChange={(e) => setNewTrip({ ...newTrip, destino: e.target.value })}
                  placeholder="Destino del viaje"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Viaje</Label>
                <Select value={newTrip.type} onValueChange={(value: Trip['type']) => setNewTrip({ ...newTrip, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupal">Grupal</SelectItem>
                    <SelectItem value="aereo">Aéreo</SelectItem>
                    <SelectItem value="crucero">Crucero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fechaSalida">Fecha de Salida</Label>
                <Input
                  id="fechaSalida"
                  type="date"
                  value={newTrip.fechaSalida}
                  onChange={(e) => setNewTrip({ ...newTrip, fechaSalida: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fechaRegreso">Fecha de Regreso</Label>
                <Input
                  id="fechaRegreso"
                  type="date"
                  value={newTrip.fechaRegreso}
                  onChange={(e) => setNewTrip({ ...newTrip, fechaRegreso: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="importe">Precio</Label>
                <Input
                  id="importe"
                  type="number"
                  value={newTrip.importe}
                  onChange={(e) => setNewTrip({ ...newTrip, importe: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select value={newTrip.currency} onValueChange={(value: 'ARS' | 'USD') => setNewTrip({ ...newTrip, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newTrip.type === 'grupal' && (
                <div>
                  <Label htmlFor="busId">Bus</Label>
                  <Select value={newTrip.busId} onValueChange={(value) => setNewTrip({ ...newTrip, busId: value })}>
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
              <div className="col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={newTrip.descripcion}
                  onChange={(e) => setNewTrip({ ...newTrip, descripcion: e.target.value })}
                  placeholder="Descripción del viaje (opcional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTrip} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Viaje'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {trips.filter(trip => !trip.archived).map((trip) => (
          <Card key={trip.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getTripIcon(trip.type)}
                  <CardTitle className="text-lg">{trip.destino}</CardTitle>
                  {getStatusBadge(trip.archived)}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPassengerDialog(trip)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Pasajeros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(trip)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTrip(trip.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Salida: {trip.fechaSalida.toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Regreso: {trip.fechaRegreso.toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{trip.currency} ${trip.importe.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Tipo: {trip.type}</span>
                </div>
              </div>
              {trip.descripcion && (
                <p className="text-sm text-muted-foreground mt-2">{trip.descripcion}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Viaje</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_destino">Destino</Label>
              <Input
                id="edit_destino"
                value={newTrip.destino}
                onChange={(e) => setNewTrip({ ...newTrip, destino: e.target.value })}
                placeholder="Destino del viaje"
              />
            </div>
            <div>
              <Label htmlFor="edit_type">Tipo de Viaje</Label>
              <Select value={newTrip.type} onValueChange={(value: Trip['type']) => setNewTrip({ ...newTrip, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="grupal">Grupal</SelectItem>
                  <SelectItem value="aereo">Aéreo</SelectItem>
                  <SelectItem value="crucero">Crucero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_fechaSalida">Fecha de Salida</Label>
              <Input
                id="edit_fechaSalida"
                type="date"
                value={newTrip.fechaSalida}
                onChange={(e) => setNewTrip({ ...newTrip, fechaSalida: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_fechaRegreso">Fecha de Regreso</Label>
              <Input
                id="edit_fechaRegreso"
                type="date"
                value={newTrip.fechaRegreso}
                onChange={(e) => setNewTrip({ ...newTrip, fechaRegreso: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_importe">Precio</Label>
              <Input
                id="edit_importe"
                type="number"
                value={newTrip.importe}
                onChange={(e) => setNewTrip({ ...newTrip, importe: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit_currency">Moneda</Label>
              <Select value={newTrip.currency} onValueChange={(value: 'ARS' | 'USD') => setNewTrip({ ...newTrip, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTrip.type === 'grupal' && (
              <div>
                <Label htmlFor="edit_busId">Bus</Label>
                <Select value={newTrip.busId} onValueChange={(value) => setNewTrip({ ...newTrip, busId: value })}>
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
            <div className="col-span-2">
              <Label htmlFor="edit_descripcion">Descripción</Label>
              <Textarea
                id="edit_descripcion"
                value={newTrip.descripcion}
                onChange={(e) => setNewTrip({ ...newTrip, descripcion: e.target.value })}
                placeholder="Descripción del viaje (opcional)"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditTrip} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Viaje'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Passengers Dialog */}
      <Dialog open={isPassengerDialogOpen} onOpenChange={setIsPassengerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                Pasajeros - {selectedTrip?.destino}
              </DialogTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDF}
                  disabled={tripPassengers.length === 0}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={tripPassengers.length === 0}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Add Passenger Form */}
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Agregar Pasajero</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passenger_client">Cliente</Label>
                <Select value={newPassenger.clientId} onValueChange={(value) => setNewPassenger({ ...newPassenger, clientId: value })}>
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
              <div>
                <Label htmlFor="passenger_asiento">
                  {selectedTrip?.type === 'crucero' ? 'Cabina' : 'Asiento'}
                </Label>
                {selectedTrip?.type === 'crucero' ? (
                  <Input
                    id="passenger_asiento"
                    value={newPassenger.numeroCabina}
                    onChange={(e) => setNewPassenger({ ...newPassenger, numeroCabina: e.target.value })}
                    placeholder="Ej: A101"
                  />
                ) : (
                  <Input
                    id="passenger_asiento"
                    value={newPassenger.numeroAsiento}
                    onChange={(e) => setNewPassenger({ ...newPassenger, numeroAsiento: e.target.value })}
                    placeholder="Ej: 12"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="passenger_pagado">Estado de Pago</Label>
                <Select value={newPassenger.pagado ? 'paid' : 'pending'} onValueChange={(value) => setNewPassenger({ ...newPassenger, pagado: value === 'paid' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleAddPassenger} disabled={loading || !newPassenger.clientId}>
                {loading ? 'Agregando...' : 'Agregar Pasajero'}
              </Button>
            </div>
          </div>

          {/* Passengers Table */}
          <div>
            <h3 className="font-semibold mb-3">Lista de Pasajeros ({tripPassengers.length})</h3>
            {tripPassengers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Fecha Nacimiento</TableHead>
                    <TableHead>{selectedTrip?.type === 'crucero' ? 'Cabina' : 'Asiento'}</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tripPassengers.map((passenger) => {
                    const client = clients.find(c => c.id === passenger.clientId)
                    return (
                      <TableRow key={passenger.id}>
                        <TableCell>{client?.name || 'Cliente no encontrado'}</TableCell>
                        <TableCell>{client?.dni || '-'}</TableCell>
                        <TableCell>
                          {client?.fechaNacimiento ? client.fechaNacimiento.toLocaleDateString('es-ES') : '-'}
                        </TableCell>
                        <TableCell>
                          {selectedTrip?.type === 'crucero' ? passenger.numeroCabina : passenger.numeroAsiento || '-'}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(passenger.pagado)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePassenger(passenger.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay pasajeros registrados para este viaje
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
