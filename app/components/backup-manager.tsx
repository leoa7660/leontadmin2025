"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Client, Trip, Payment, TripPassenger, Bus } from "../page"
import { Download, Upload, Database, FileText, Users, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"

interface BackupManagerProps {
  clients: Client[]
  setClients: (clients: Client[]) => void
  trips: Trip[]
  payments: Payment[]
  tripPassengers: TripPassenger[]
  buses: Bus[]
}

interface BackupData {
  clients: Client[]
  trips: Trip[]
  payments: Payment[]
  tripPassengers: TripPassenger[]
  buses: Bus[]
  metadata: {
    exportDate: string
    version: string
    totalClients: number
    totalTrips: number
    totalPayments: number
  }
}

export function BackupManager({ clients, setClients, trips, payments, tripPassengers, buses }: BackupManagerProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedBackupType, setSelectedBackupType] = useState<"complete" | "clients" | "accounts">("complete")

  // Función para crear backup completo
  const createCompleteBackup = () => {
    const backupData: BackupData = {
      clients,
      trips,
      payments,
      tripPassengers,
      buses,
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        totalClients: clients.length,
        totalTrips: trips.length,
        totalPayments: payments.length,
      },
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    })

    downloadFile(blob, `backup-completo-${new Date().toISOString().split("T")[0]}.json`)
  }

  // Función para crear backup solo de clientes
  const createClientsBackup = () => {
    const backupData = {
      clients,
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        totalClients: clients.length,
        type: "clients-only",
      },
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    })

    downloadFile(blob, `backup-clientes-${new Date().toISOString().split("T")[0]}.json`)
  }

  // Función para crear backup de cuentas corrientes
  const createAccountsBackup = () => {
    // Calcular saldos por cliente y moneda
    const accountsData = clients.map((client) => {
      // Obtener viajes del cliente
      const clientPassengers = tripPassengers.filter((tp) => tp.clientId === client.id)
      const clientTrips = clientPassengers.map((tp) => {
        const trip = trips.find((t) => t.id === tp.tripId)
        return { passenger: tp, trip }
      })

      // Calcular saldos por moneda
      const arsBalance = calculateClientBalance(client.id, "ARS")
      const usdBalance = calculateClientBalance(client.id, "USD")

      // Obtener historial de pagos
      const clientPayments = payments.filter((p) => p.clientId === client.id)

      return {
        client: {
          id: client.id,
          name: client.name,
          dni: client.dni,
          email: client.email,
        },
        balances: {
          ARS: arsBalance,
          USD: usdBalance,
        },
        trips: clientTrips.map((ct) => ({
          tripId: ct.trip?.id,
          destino: ct.trip?.destino,
          fechaSalida: ct.trip?.fechaSalida,
          importe: ct.trip?.importe,
          currency: ct.trip?.currency,
          numeroAsiento: ct.passenger.numeroAsiento,
          pagado: ct.passenger.pagado,
        })),
        payments: clientPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          date: p.date,
          description: p.description,
          receiptNumber: p.receiptNumber,
        })),
      }
    })

    const backupData = {
      accounts: accountsData,
      summary: {
        totalClients: clients.length,
        totalActiveAccounts: accountsData.filter(
          (acc) => acc.balances.ARS.totalCharges > 0 || acc.balances.USD.totalCharges > 0,
        ).length,
        totalARS: accountsData.reduce((sum, acc) => sum + acc.balances.ARS.balance, 0),
        totalUSD: accountsData.reduce((sum, acc) => sum + acc.balances.USD.balance, 0),
      },
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        type: "accounts-only",
      },
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    })

    downloadFile(blob, `backup-cuentas-corrientes-${new Date().toISOString().split("T")[0]}.json`)
  }

  // Función auxiliar para calcular balance de cliente
  const calculateClientBalance = (clientId: string, currency: "ARS" | "USD") => {
    const clientPassengers = tripPassengers.filter((tp) => {
      const trip = trips.find((t) => t.id === tp.tripId)
      return tp.clientId === clientId && trip?.currency === currency
    })

    const totalCharges = clientPassengers.reduce((sum, passenger) => {
      const trip = trips.find((t) => t.id === passenger.tripId)
      if (trip && trip.currency === currency) {
        return sum + trip.importe
      }
      return sum
    }, 0)

    const totalPayments = payments
      .filter((p) => p.clientId === clientId && p.type === "payment" && p.currency === currency)
      .reduce((sum, p) => sum + p.amount, 0)

    return {
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
    }
  }

  // Función para descargar archivo
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Función para exportar a Excel/CSV
  const exportToExcel = (type: "clients" | "accounts") => {
    if (type === "clients") {
      const csvContent = [
        "Apellido y Nombre,Email,Teléfono,Dirección,DNI,Fecha Nacimiento,Vencimiento DNI,Número Pasaporte,Vencimiento Pasaporte,Fecha Registro",
        ...clients.map((client) =>
          [
            client.name,
            client.email,
            client.phone,
            client.address,
            client.dni,
            client.fechaNacimiento.toISOString().split("T")[0],
            client.vencimientoDni ? client.vencimientoDni.toISOString().split("T")[0] : "",
            client.numeroPasaporte || "",
            client.vencimientoPasaporte ? client.vencimientoPasaporte.toISOString().split("T")[0] : "",
            client.createdAt.toISOString().split("T")[0],
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      downloadFile(blob, `clientes-${new Date().toISOString().split("T")[0]}.csv`)
    } else if (type === "accounts") {
      const csvContent = [
        "Cliente,DNI,Email,Saldo ARS,Saldo USD,Total Comprado ARS,Total Pagado ARS,Total Comprado USD,Total Pagado USD",
        ...clients.map((client) => {
          const arsBalance = calculateClientBalance(client.id, "ARS")
          const usdBalance = calculateClientBalance(client.id, "USD")
          return [
            client.name,
            client.dni,
            client.email,
            arsBalance.balance,
            usdBalance.balance,
            arsBalance.totalCharges,
            arsBalance.totalPayments,
            usdBalance.totalCharges,
            usdBalance.totalPayments,
          ].join(",")
        }),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      downloadFile(blob, `cuentas-corrientes-${new Date().toISOString().split("T")[0]}.csv`)
    }
  }

  // Función para manejar importación de backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string)

          if (backupData.clients) {
            // Confirmar antes de importar
            const confirmImport = window.confirm(
              `¿Estás seguro de que quieres importar este backup?\n\nEsto agregará ${backupData.clients.length} clientes a la base de datos actual.`,
            )

            if (confirmImport) {
              // Convertir fechas de string a Date
              const importedClients = backupData.clients.map((client: any) => ({
                ...client,
                fechaNacimiento: new Date(client.fechaNacimiento),
                vencimientoDni: client.vencimientoDni ? new Date(client.vencimientoDni) : undefined,
                vencimientoPasaporte: client.vencimientoPasaporte ? new Date(client.vencimientoPasaporte) : undefined,
                createdAt: new Date(client.createdAt),
              }))

              setClients([...clients, ...importedClients])
              alert(`Se importaron ${importedClients.length} clientes exitosamente.`)
              setIsImportDialogOpen(false)
            }
          } else {
            alert("El archivo no contiene datos de clientes válidos.")
          }
        } catch (error) {
          alert("Error al leer el archivo. Asegúrate de que sea un backup válido.")
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestión de Backups
          </CardTitle>
          <CardDescription>Exporta e importa datos para mantener respaldos seguros</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="export" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Exportar Datos</TabsTrigger>
              <TabsTrigger value="import">Importar Backup</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Backup Completo */}
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Backup Completo
                    </CardTitle>
                    <CardDescription>Todos los datos del sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Clientes:</span>
                        <Badge variant="outline">{clients.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Viajes:</span>
                        <Badge variant="outline">{trips.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagos:</span>
                        <Badge variant="outline">{payments.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Buses:</span>
                        <Badge variant="outline">{buses.length}</Badge>
                      </div>
                    </div>
                    <Button onClick={createCompleteBackup} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar JSON
                    </Button>
                  </CardContent>
                </Card>

                {/* Backup de Clientes */}
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Solo Clientes
                    </CardTitle>
                    <CardDescription>Base de datos de clientes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total clientes:</span>
                        <Badge variant="outline">{clients.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Con documentos:</span>
                        <Badge variant="outline">
                          {clients.filter((c) => c.vencimientoDni || c.numeroPasaporte).length}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button onClick={createClientsBackup} className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar JSON
                      </Button>
                      <Button onClick={() => exportToExcel("clients")} className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Backup de Cuentas Corrientes */}
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Cuentas Corrientes
                    </CardTitle>
                    <CardDescription>Saldos y movimientos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cuentas activas:</span>
                        <Badge variant="outline">
                          {
                            clients.filter((client) => {
                              const arsBalance = calculateClientBalance(client.id, "ARS")
                              const usdBalance = calculateClientBalance(client.id, "USD")
                              return arsBalance.totalCharges > 0 || usdBalance.totalCharges > 0
                            }).length
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total pagos:</span>
                        <Badge variant="outline">{payments.length}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button onClick={createAccountsBackup} className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar JSON
                      </Button>
                      <Button onClick={() => exportToExcel("accounts")} className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Descargar Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Recomendaciones de Backup</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Realiza backups completos semanalmente</li>
                      <li>• Exporta clientes antes de importaciones masivas</li>
                      <li>• Guarda los archivos en ubicaciones seguras</li>
                      <li>• Los archivos JSON mantienen toda la información</li>
                      <li>• Los archivos Excel son útiles para análisis externos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Importar Backup</h3>
                <p className="text-sm text-gray-500 mb-4">Selecciona un archivo de backup JSON para restaurar datos</p>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" id="backup-import" />
                <Button onClick={() => document.getElementById("backup-import")?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo de Backup
                </Button>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Precauciones al Importar</h4>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• Los datos importados se AGREGAN a los existentes</li>
                      <li>• No se eliminan datos actuales</li>
                      <li>• Pueden generarse duplicados si importas el mismo backup varias veces</li>
                      <li>• Realiza un backup antes de importar datos</li>
                      <li>• Solo se pueden importar archivos JSON generados por este sistema</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
