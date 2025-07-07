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
import type { Bus } from "../page"
import { Plus, Edit, Trash2, Search, BusIcon, Upload, Eye, X, ImageIcon, Loader2 } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { createBus, updateBus, deleteBus } from "../actions/database"

interface BusesManagerProps {
  buses: Bus[]
  setBuses: (buses: Bus[]) => void
  onDataChange?: () => void
}

export function BusesManager({ buses, setBuses, onDataChange }: BusesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setFormData({ ...formData, imagenDistribucion: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, imagenDistribucion: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
        // Editar bus existente
        await updateBus(editingBus.id, busData)
        toast({
          title: "Éxito",
          description: "Bus actualizado correctamente",
        })
      } else {
        // Crear nuevo bus
        await createBus(busData)
        toast({
          title: "Éxito",
          description: "Bus creado correctamente",
        })
      }

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }

      resetForm()
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
        title: "Éxito",
        description: "Bus eliminado correctamente",
      })

      // Recargar datos
      if (onDataChange) {
        await onDataChange()
      }
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

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageDialogOpen(true)
  }

  const handleNewBus = () => {
    setEditingBus(null)
    resetForm()
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Buses</CardTitle>
              <CardDescription>Administra la flota de buses de tu agencia</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewBus}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Bus
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingBus ? "Editar Bus" : "Nuevo Bus"}</DialogTitle>
                  <DialogDescription>
                    {editingBus ? "Modifica los datos del bus" : "Completa los datos del nuevo bus"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="patente">Número de Patente</Label>
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
                        max="60"
                        value={formData.asientos}
                        onChange={(e) => setFormData({ ...formData, asientos: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipoServicio">Tipo de Servicio</Label>
                      <Input
                        id="tipoServicio"
                        value={formData.tipoServicio}
                        onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
                        placeholder="Ej: Ejecutivo, Semi-cama, Cama"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imagen">Distribución de Butacas (Imagen)</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="imagen-upload"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                            disabled={isLoading}
                          >
                            <Upload className="h-4 w-4" />
                            {formData.imagenDistribucion ? "Cambiar Imagen" : "Subir Imagen"}
                          </Button>
                          {formData.imagenDistribucion && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeImage}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                        </p>
                        {formData.imagenDistribucion && (
                          <div className="mt-2">
                            <div className="relative w-full max-w-xs">
                              <Image
                                src={formData.imagenDistribucion || "/placeholder.svg"}
                                alt="Vista previa de distribución"
                                width={200}
                                height={150}
                                className="rounded-lg border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openImageDialog(formData.imagenDistribucion)}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <BusIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {bus.patente}
                      </div>
                    </TableCell>
                    <TableCell>{bus.asientos} asientos</TableCell>
                    <TableCell>{bus.tipoServicio}</TableCell>
                    <TableCell>
                      {bus.imagenDistribucion ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Image
                              src={bus.imagenDistribucion || "/placeholder.svg"}
                              alt={`Distribución ${bus.patente}`}
                              width={40}
                              height={30}
                              className="rounded border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageDialog(bus.imagenDistribucion!)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded">
                              <Eye className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openImageDialog(bus.imagenDistribucion!)}
                            className="h-6 px-2 text-xs"
                          >
                            Ver
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-xs">Sin imagen</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{bus.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(bus)}
                          disabled={isDeleting === bus.id}
                        >
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
                                Esta acción no se puede deshacer. Se eliminará permanentemente el bus {bus.patente} de
                                la base de datos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(bus.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
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
            {filteredBuses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron buses" : "No hay buses registrados"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para ver imagen completa */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Distribución de Butacas</DialogTitle>
            <DialogDescription>Vista completa de la distribución de asientos</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {selectedImage && (
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt="Distribución de butacas"
                width={600}
                height={400}
                className="rounded-lg border object-contain max-w-full max-h-[60vh]"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsImageDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
