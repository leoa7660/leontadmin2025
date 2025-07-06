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
import { Plus, Edit, Trash2, Search, BusIcon, Upload, Eye, X, ImageIcon } from "lucide-react"
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
import Image from "next/image"

interface BusesManagerProps {
  buses: Bus[]
  setBuses: (buses: Bus[]) => void
}

export function BusesManager({ buses, setBuses }: BusesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        alert("Por favor selecciona un archivo de imagen válido")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen debe ser menor a 5MB")
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingBus) {
      // Editar bus existente
      setBuses(
        buses.map((bus) =>
          bus.id === editingBus.id
            ? {
                ...bus,
                patente: formData.patente,
                asientos: Number.parseInt(formData.asientos),
                tipoServicio: formData.tipoServicio,
                imagenDistribucion: formData.imagenDistribucion,
              }
            : bus,
        ),
      )
    } else {
      // Crear nuevo bus
      const newBus: Bus = {
        id: Date.now().toString(),
        patente: formData.patente,
        asientos: Number.parseInt(formData.asientos),
        tipoServicio: formData.tipoServicio,
        imagenDistribucion: formData.imagenDistribucion,
        createdAt: new Date(),
      }
      setBuses([...buses, newBus])
    }

    resetForm()
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

  const handleDelete = (busId: string) => {
    setBuses(buses.filter((bus) => bus.id !== busId))
  }

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageDialogOpen(true)
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
                <Button onClick={() => setEditingBus(null)}>
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
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {formData.imagenDistribucion ? "Cambiar Imagen" : "Subir Imagen"}
                          </Button>
                          {formData.imagenDistribucion && (
                            <Button type="button" variant="outline" size="sm" onClick={removeImage}>
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
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingBus ? "Guardar Cambios" : "Crear Bus"}</Button>
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
                        <Button variant="outline" size="sm" onClick={() => handleEdit(bus)}>
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
                              <AlertDialogTitle>¿Eliminar bus?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el bus {bus.patente} de
                                la base de datos.
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
