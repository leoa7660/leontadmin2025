import { supabaseAdmin } from "./supabase"

// Función para ejecutar transacciones
export async function executeTransaction<T>(operations: Array<() => Promise<any>>): Promise<T> {
  try {
    const results = await Promise.all(operations.map((op) => op()))
    return results as T
  } catch (error) {
    console.error("Transaction failed:", error)
    throw error
  }
}

// Función para backup de datos
export async function createBackup() {
  try {
    const [users, clients, buses, trips, tripPassengers, payments] = await Promise.all([
      supabaseAdmin.from("users").select("*"),
      supabaseAdmin.from("clients").select("*"),
      supabaseAdmin.from("buses").select("*"),
      supabaseAdmin.from("trips").select("*"),
      supabaseAdmin.from("trip_passengers").select("*"),
      supabaseAdmin.from("payments").select("*"),
    ])

    return {
      timestamp: new Date().toISOString(),
      data: {
        users: users.data || [],
        clients: clients.data || [],
        buses: buses.data || [],
        trips: trips.data || [],
        tripPassengers: tripPassengers.data || [],
        payments: payments.data || [],
      },
    }
  } catch (error) {
    console.error("Error creating backup:", error)
    throw new Error("Error al crear backup")
  }
}

// Función para validar integridad de datos
export async function validateDataIntegrity() {
  try {
    // Verificar referencias huérfanas en trip_passengers
    const { data: tripPassengers } = await supabaseAdmin
      .from("trip_passengers")
      .select("id, trip_id, client_id")

    const { data: trips } = await supabaseAdmin
      .from("trips")
      .select("id")

    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("id")

    const tripIds = new Set(trips?.map(t => t.id) || [])
    const clientIds = new Set(clients?.map(c => c.id) || [])

    const orphanedTripPassengers = tripPassengers?.filter(tp => 
      !tripIds.has(tp.trip_id) || !clientIds.has(tp.client_id)
    ) || []

    // Verificar referencias huérfanas en payments
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("id, trip_id, client_id")

    const orphanedPayments = payments?.filter(p => 
      !tripIds.has(p.trip_id) || !clientIds.has(p.client_id)
    ) || []

    return {
      isValid: orphanedTripPassengers.length === 0 && orphanedPayments.length === 0,
      issues: {
        orphanedTripPassengers,
        orphanedPayments,
      },
    }
  } catch (error) {
    console.error("Error validating data integrity:", error)
    throw new Error("Error al validar integridad de datos")
  }
}

// Función para limpiar datos antiguos
export async function cleanupOldData(daysOld = 365) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Archivar viajes antiguos en lugar de eliminarlos
    const { error } = await supabaseAdmin
      .from("trips")
      .update({ archived: true })
      .lt("fecha_regreso", cutoffDate.toISOString())
      .eq("archived", false)

    if (error) {
      throw error
    }

    return { success: true, cutoffDate }
  } catch (error) {
    console.error("Error cleaning up old data:", error)
    throw new Error("Error al limpiar datos antiguos")
  }
}
