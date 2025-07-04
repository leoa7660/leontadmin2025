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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Bus } from "../page"
import { Plus, Edit, Trash2, Search, Upload, Loader2 } from "lucide-react"
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
import { createBus, updateBus, deleteBus } from "../actions/database"

interface BusesManagerProps {
  buses: Bus[]
  onDataChange: () => void
}

const TIPOS_SERVICIO = [
  { value: "ejecutivo", label: "Ejecutivo" },
  { value: "semicama", label: "Semicama" },
  { value: "cama", label: "Cama" },
  { value: "suite", label: "Suite" },
]

export function BusesManager({ buses, onDataChange }: BusesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    patente: "",
    asientos: "",
    tipoServicio: "",
    imagenDistribucion: "",
  })

  const filteredBuses = buses.filter(
    (bus) =>
      bus.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.tipoServicio.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const busData = {
        patente: formData.patente.toUpperCase(),
        asientos: Number.parseInt(formData.asientos),
        tipoServicio: formData.tipoServicio,
        imagenDistribucion: formData.imagenDistribucion || undefined,
      }

      if (editingBus) {
        await updateBus(editingBus.id, busData)
        toast({
          title: "Bus actualizado",
          description: `El bus ${formData.patente} ha sido actualizado correctamente.`,
        })
      } else {
        await createBus(busData)
        toast({
          title: "Bus creado",
          description: `El bus ${formData.patente} ha sido creado correctamente.`,
        })
      }

      resetForm()
      onDataChange() // Recargar datos
    } catch (error) {
      console.error("Error saving bus:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el bus",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patente: "",
      asientos: "",
      tipoServicio: "",
      imagenDistribucion: "",
    })
    setEditingBus(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus)
    setFormData({
      patente: bus.patente,
      asientos: bus.asientos.toString(),
      tipoServicio: bus.tipoServicio,
      imagenDistribucion: bus.imagenDistribucion || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (busId: string) => {
    setIsDeleting(busId)

    try {
      await deleteBus(busId)

      toast({
        title: "Bus eliminado",
        description: "El bus ha sido eliminado correctamente.",
      })

      onDataChange() // Recargar datos
    } catch (error) {
      console.error("Error deleting bus:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el bus",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setFormData({ ...formData, imagenDistribucion: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const getTipoServicioLabel = (tipo: string) => {
    return TIPOS_SERVICIO.find((t) => t.value === tipo)?.label || tipo
  }

  const getTipoServicioBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "suite":
        return "default"
      case "cama":
        return "secondary"
      case "semicama":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Buses</CardTitle>
              <CardDescription>Administra la flota de buses de la agencia</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBus(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Bus
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingBus ? "Editar Bus" : "Nuevo Bus"}</DialogTitle>
                  <DialogDescription>
                    {editingBus ? "Modifica los datos del bus" : "Completa los datos del nuevo bus"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="patente">Patente</Label>
                      <Input
                        id="patente"
                        value={formData.patente}
                        onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                        placeholder="ABC123"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="asientos">Cantidad de Asientos</Label>
                      <Input
                        id="asientos"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.asientos}
                        onChange={(e) => setFormData({ ...formData, asientos: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipoServicio">Tipo de Servicio</Label>
                      <Select
                        value={formData.tipoServicio}
                        onValueChange={(value) => setFormData({ ...formData, tipoServicio: value })}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_SERVICIO.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imagen">Imagen de Distribución de Asientos</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="imagen"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isLoading}
                        />
                        <Button type="button" variant="outline" size="sm" disabled={isLoading}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.imagenDistribucion && (
                        <div className="mt-2">
                          <img
                            src={formData.imagenDistribucion || "/placeholder.svg"}
                            alt="Distribución de asientos"
                            className="max-w-full h-32 object-contain border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingBus ? "Guardar Cambios" : "Crear Bus"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por patente o tipo de servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patente</TableHead>
                  <TableHead>Asientos</TableHead>
                  <TableHead>Tipo de Servicio</TableHead>
                  <TableHead>Distribución</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.patente}</TableCell>
                    <TableCell>{bus.asientos}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoServicioBadgeVariant(bus.tipoServicio)}>
                        {getTipoServicioLabel(bus.tipoServicio)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bus.imagenDistribucion ? (
                        <img
                          src={bus.imagenDistribucion || "/placeholder.svg"}
                          alt="Distribución"
                          className="w-12 h-8 object-contain border rounded"
                        />
                      ) : (
                        <span className="text-muted-foreground">Sin imagen</span>
                      )}
                    </TableCell>
                    <TableCell>{bus.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(bus)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isDeleting === bus.id}>
                              {isDeleting === bus.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar bus?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el bus {bus.patente} del
                                sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(bus.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBuses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron buses" : "No hay buses registrados"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
