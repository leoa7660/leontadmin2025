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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { User } from "../page"
import { Plus, Edit, Trash2, Search, Shield, UserIcon, Loader2 } from "lucide-react"
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
import { createUser, updateUser, deleteUser } from "../actions/database"

interface UsersManagerProps {
  users: User[]
  currentUser: User
  onDataChange: () => Promise<void>
}

export function UsersManager({ users, currentUser, onDataChange }: UsersManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "operator" as User["role"],
    isActive: true,
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingUser) {
        // Editar usuario existente
        await updateUser(editingUser.id, {
          username: formData.username,
          password: formData.password || editingUser.password, // Mantener contraseña actual si no se cambia
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        })

        toast({
          title: "Usuario actualizado",
          description: `El usuario ${formData.name} ha sido actualizado exitosamente.`,
        })
      } else {
        // Crear nuevo usuario
        await createUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        })

        toast({
          title: "Usuario creado",
          description: `El usuario ${formData.name} ha sido creado exitosamente.`,
        })
      }

      // Recargar datos
      await onDataChange()
      resetForm()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar el usuario. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "operator",
      isActive: true,
    })
    setEditingUser(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: "", // No mostrar la contraseña actual
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (userId === currentUser.id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propio usuario.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(userId)

    try {
      await deleteUser(userId)
      await onDataChange()

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al eliminar el usuario. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser.id) {
      toast({
        title: "Error",
        description: "No puedes desactivar tu propio usuario.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateUser(user.id, {
        isActive: !user.isActive,
      })

      await onDataChange()

      toast({
        title: user.isActive ? "Usuario desactivado" : "Usuario activado",
        description: `El usuario ${user.name} ha sido ${user.isActive ? "desactivado" : "activado"} exitosamente.`,
      })
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cambiar el estado del usuario.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Administrador
          </Badge>
        )
      case "manager":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            Gerente
          </Badge>
        )
      case "operator":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            Operador
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const canManageUsers = currentUser.role === "admin"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios del sistema y sus permisos</CardDescription>
            </div>
            {canManageUsers && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingUser(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Modifica los datos del usuario" : "Completa los datos del nuevo usuario"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Nombre Completo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: Juan Pérez"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username">
                            Usuario <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Ej: jperez"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="juan@empresa.com"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="password">
                          {editingUser ? "Nueva Contraseña (dejar vacío para mantener actual)" : "Contraseña"}{" "}
                          {!editingUser && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? "Dejar vacío para no cambiar" : "Contraseña segura"}
                          required={!editingUser}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="role">
                          Rol <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value as User["role"] })}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operator">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Operador</div>
                                  <div className="text-xs text-muted-foreground">Acceso básico</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Gerente</div>
                                  <div className="text-xs text-muted-foreground">Gestión completa</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Administrador</div>
                                  <div className="text-xs text-muted-foreground">Acceso total</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          disabled={isLoading}
                        />
                        <Label htmlFor="isActive">Usuario activo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, usuario o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    {canManageUsers && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canManageUsers && user.id !== currentUser.id ? (
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => handleToggleActive(user)}
                              size="sm"
                            />
                          ) : (
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={isDeleting === user.id}>
                                    {isDeleting === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                                      {user.name} del sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
