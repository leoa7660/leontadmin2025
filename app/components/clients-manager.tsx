"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import type { Client } from "../page"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  Loader2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient, updateClient, deleteClient, importClients } from "../actions/database"

interface ClientsManagerProps {
  clients: Client[]
  onDataChange: () => Promise<void>
}

export function ClientsManager({ clients, onDataChange }: ClientsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dni: "",
    fechaNacimiento: "",
    vencimientoDni: "",
    numeroPasaporte: "",
    vencimientoPasaporte: "",
  })

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.dni.includes(searchTerm),
  )

  // Función para verificar si un documento está próximo a vencer (30 días)
  const isDocumentExpiringSoon = (expirationDate: Date) => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expirationDate <= thirtyDaysFromNow
  }

  // Función para verificar si un documento ya venció
  const isDocumentExpired = (expirationDate: Date) => {
    const today = new Date()
    return expirationDate < today
  }

  // Obtener clientes con documentos próximos a vencer o vencidos
  const getClientsWithExpiringDocs = () => {
    return clients.filter((client) => {
      const dniExpiring = client.vencimientoDni && isDocumentExpiringSoon(client.vencimientoDni)
      const passportExpiring = client.vencimientoPasaporte && isDocumentExpiringSoon(client.vencimientoPasaporte)
      return dniExpiring || passportExpiring
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingClient) {
        // Editar cliente existente
        await updateClient(editingClient.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dni: formData.dni,
          fechaNacimiento: new Date(formData.fechaNacimiento),
          vencimientoDni: formData.vencimientoDni ? new Date(formData.vencimientoDni) : undefined,
          numeroPasaporte: formData.numeroPasaporte || undefined,
          vencimientoPasaporte: formData.vencimientoPasaporte ? new Date(formData.vencimientoPasaporte) : undefined,
        })

        toast({
          title: "Cliente actualizado",
          description: `El cliente ${formData.name} ha sido actualizado exitosamente.`,
        })
      } else {
        // Crear nuevo cliente
        await createClient({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dni: formData.dni,
          fechaNacimiento: new Date(formData.fechaNacimiento),
          vencimientoDni: formData.vencimientoDni ? new Date(formData.vencimientoDni) : undefined,
          numeroPasaporte: formData.numeroPasaporte || undefined,
          vencimientoPasaporte: formData.vencimientoPasaporte ? new Date(formData.vencimientoPasaporte) : undefined,
        })

        toast({
          title: "Cliente creado",
          description: `El cliente ${formData.name} ha sido creado exitosamente.`,
        })
      }

      // Recargar datos
      await onDataChange()
      resetForm()
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      dni: "",
      fechaNacimiento: "",
      vencimientoDni: "",
      numeroPasaporte: "",
      vencimientoPasaporte: "",
    })
    setEditingClient(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      dni: client.dni,
      fechaNacimiento: client.fechaNacimiento.toISOString().split("T")[0],
      vencimientoDni: client.vencimientoDni ? client.vencimientoDni.toISOString().split("T")[0] : "",
      numeroPasaporte: client.numeroPasaporte || "",
      vencimientoPasaporte: client.vencimientoPasaporte ? client.vencimientoPasaporte.toISOString().split("T")[0] : "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (clientId: string) => {
    setIsDeleting(clientId)

    try {
      await deleteClient(clientId)
      await onDataChange()

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar el cliente. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const renderDocumentStatus = (expirationDate: Date, documentType: string) => {
    if (isDocumentExpired(expirationDate)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {documentType} Vencido
        </Badge>
      )
    } else if (isDocumentExpiringSoon(expirationDate)) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {documentType} por vencer
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {documentType} vigente
      </Badge>
    )
  }

  const clientsWithExpiringDocs = getClientsWithExpiringDocs()

  // Función para manejar la importación de clientes
  const handleImportClients = () => {
    setIsImportDialogOpen(true)
  }

  // Función para procesar archivo Excel
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)

      // Simular lectura del archivo Excel
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          // En una implementación real, usarías una librería como xlsx
          // Por ahora simulamos datos de ejemplo
          const mockData = [
            {
              name: "García, Juan Carlos",
              email: "juan.garcia@email.com",
              phone: "11-1234-5678",
              address: "Av. Corrientes 1234, CABA",
              dni: "12345678",
              fechaNacimiento: "1985-03-15",
              vencimientoDni: "2025-03-15",
              numeroPasaporte: "ABC123456",
              vencimientoPasaporte: "2026-03-15",
            },
            {
              name: "López, María Elena",
              email: "maria.lopez@email.com",
              phone: "11-8765-4321",
              address: "Av. Santa Fe 5678, CABA",
              dni: "87654321",
              fechaNacimiento: "1990-07-22",
              vencimientoDni: "",
              numeroPasaporte: "",
              vencimientoPasaporte: "",
            },
          ]
          setImportPreview(mockData)
        } catch (error) {
          toast({
            title: "Error",
            description: "Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.",
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  // Función para confirmar la importación
  const confirmImport = async () => {
    try {
      setIsLoading(true)

      const newClientsData = importPreview.map((row) => ({
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        address: row.address || "",
        dni: row.dni || "",
        fechaNacimiento: new Date(row.fechaNacimiento || Date.now()),
        vencimientoDni: row.vencimientoDni ? new Date(row.vencimientoDni) : undefined,
        numeroPasaporte: row.numeroPasaporte || undefined,
        vencimientoPasaporte: row.vencimientoPasaporte ? new Date(row.vencimientoPasaporte) : undefined,
      }))

      await importClients(newClientsData)
      await onDataChange()

      setIsImportDialogOpen(false)
      setImportFile(null)
      setImportPreview([])

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${newClientsData.length} clientes exitosamente.`,
      })
    } catch (error) {
      console.error("Error importing clients:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al importar clientes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para exportar backup de clientes
  const handleExportClients = () => {
    const dataToExport = {
      clients: clients,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `backup-clientes-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Función para descargar plantilla Excel
  const downloadTemplate = () => {
    const template = `Apellido y Nombre,Email,Teléfono,Dirección,DNI,Fecha Nacimiento,Vencimiento DNI,Número Pasaporte,Vencimiento Pasaporte
García Juan Carlos,juan.garcia@email.com,11-1234-5678,Av. Corrientes 1234,12345678,1985-03-15,2025-03-15,ABC123456,2026-03-15
López María Elena,maria.lopez@email.com,11-8765-4321,Av. Santa Fe 5678,87654321,1990-07-22,,,`

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-clientes.csv"
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
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>Administra la base de datos de clientes de tu agencia</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingClient(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                    <DialogDescription>
                      {editingClient ? "Modifica los datos del cliente" : "Completa los datos del nuevo cliente"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Apellido y Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: García, Juan Carlos"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">
                            Teléfono <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="address">
                          Dirección <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fechaNacimiento">
                            Fecha de Nacimiento <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="fechaNacimiento"
                            type="date"
                            value={formData.fechaNacimiento}
                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dni">
                            DNI <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dni"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            placeholder="12345678"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="vencimientoDni">Vencimiento DNI</Label>
                        <Input
                          id="vencimientoDni"
                          type="date"
                          value={formData.vencimientoDni}
                          onChange={(e) => setFormData({ ...formData, vencimientoDni: e.target.value })}
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Dejar vacío si el DNI no tiene vencimiento</p>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Información de Pasaporte (Opcional)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="numeroPasaporte">Número de Pasaporte</Label>
                            <Input
                              id="numeroPasaporte"
                              value={formData.numeroPasaporte}
                              onChange={(e) => setFormData({ ...formData, numeroPasaporte: e.target.value })}
                              placeholder="ABC123456"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="vencimientoPasaporte">Vencimiento Pasaporte</Label>
                            <Input
                              id="vencimientoPasaporte"
                              type="date"
                              value={formData.vencimientoPasaporte}
                              onChange={(e) => setFormData({ ...formData, vencimientoPasaporte: e.target.value })}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingClient ? "Guardar Cambios" : "Crear Cliente"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Nuevos botones para importar y exportar */}
              <Button variant="outline" onClick={handleImportClients}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>

              <Button variant="outline" onClick={handleExportClients}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Backup
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Todos los Clientes ({clients.length})</TabsTrigger>
              <TabsTrigger value="expiring" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Documentos por Vencer ({clientsWithExpiringDocs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apellido y Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado Documentos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.dni}</TableCell>
                        <TableCell>{calculateAge(client.fechaNacimiento)} años</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.vencimientoDni ? (
                              renderDocumentStatus(client.vencimientoDni, "DNI")
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                DNI Permanente
                              </Badge>
                            )}
                            {client.numeroPasaporte &&
                              client.vencimientoPasaporte &&
                              renderDocumentStatus(client.vencimientoPasaporte, "Pasaporte")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isDeleting === client.id}>
                                  {isDeleting === client.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{" "}
                                    {client.name} de la base de datos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(client.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="expiring" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apellido y Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Vencimiento DNI</TableHead>
                      <TableHead>Pasaporte</TableHead>
                      <TableHead>Vencimiento Pasaporte</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsWithExpiringDocs.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.dni}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {client.vencimientoDni ? (
                              <>
                                <span>{client.vencimientoDni.toLocaleDateString()}</span>
                                {isDocumentExpired(client.vencimientoDni) && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                {!isDocumentExpired(client.vencimientoDni) &&
                                  isDocumentExpiringSoon(client.vencimientoDni) && (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">Sin vencimiento</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{client.numeroPasaporte || "N/A"}</TableCell>
                        <TableCell>
                          {client.vencimientoPasaporte ? (
                            <div className="flex items-center gap-2">
                              <span>{client.vencimientoPasaporte.toLocaleDateString()}</span>
                              {isDocumentExpired(client.vencimientoPasaporte) && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              {!isDocumentExpired(client.vencimientoPasaporte) &&
                                isDocumentExpiringSoon(client.vencimientoPasaporte) && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.vencimientoDni && renderDocumentStatus(client.vencimientoDni, "DNI")}
                            {client.numeroPasaporte &&
                              client.vencimientoPasaporte &&
                              renderDocumentStatus(client.vencimientoPasaporte, "Pasaporte")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Actualizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {clientsWithExpiringDocs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-green-500" />
                      <p>¡Excelente! Todos los documentos están vigentes</p>
                      <p className="text-sm">No hay documentos próximos a vencer</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para importar clientes */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Clientes desde Excel
            </DialogTitle>
            <DialogDescription>Carga múltiples clientes desde un archivo Excel o CSV</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!importFile ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Selecciona un archivo</h3>
                  <p className="text-sm text-gray-500 mb-4">Formatos soportados: .xlsx, .xls, .csv</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Formato requerido:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • <strong>Apellido y Nombre:</strong> Formato "Apellido, Nombre"
                    </li>
                    <li>
                      • <strong>Email:</strong> Dirección de correo válida
                    </li>
                    <li>
                      • <strong>Teléfono:</strong> Número de contacto
                    </li>
                    <li>
                      • <strong>Dirección:</strong> Dirección completa
                    </li>
                    <li>
                      • <strong>DNI:</strong> Solo números
                    </li>
                    <li>
                      • <strong>Fecha Nacimiento:</strong> Formato YYYY-MM-DD
                    </li>
                    <li>
                      • <strong>Vencimiento DNI:</strong> Formato YYYY-MM-DD (opcional)
                    </li>
                    <li>
                      • <strong>Número Pasaporte:</strong> Opcional
                    </li>
                    <li>
                      • <strong>Vencimiento Pasaporte:</strong> Formato YYYY-MM-DD (opcional)
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vista previa de importación</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportFile(null)
                      setImportPreview([])
                    }}
                  >
                    Cambiar archivo
                  </Button>
                </div>

                {importPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Nombre</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">DNI</th>
                            <th className="px-3 py-2 text-left">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{row.name}</td>
                              <td className="px-3 py-2">{row.email}</td>
                              <td className="px-3 py-2">{row.dni}</td>
                              <td className="px-3 py-2">{row.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Se encontraron <strong>{importPreview.length} clientes</strong> para importar
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            {importPreview.length > 0 && (
              <Button onClick={confirmImport} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Database className="h-4 w-4 mr-2" />
                Importar {importPreview.length} Clientes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
