"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Client, Trip, Payment, TripPassenger, Bus, User } from "../page"

const supabase = createServerSupabaseClient()

// ============ USUARIOS ============
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("name")

  if (error) {
    console.error("Error fetching users:", error)
    throw new Error("Error al cargar usuarios")
  }

  return data.map((user) => ({
    id: user.id,
    username: user.username,
    password: user.password,
    name: user.name,
    email: user.email,
    role: user.role as User["role"],
    createdAt: new Date(user.created_at),
    isActive: user.is_active,
  }))
}

export async function createUser(userData: Omit<User, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("users").insert({
    username: userData.username,
    password: userData.password,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    is_active: userData.isActive,
  })

  if (error) {
    console.error("Error creating user:", error)
    throw new Error("Error al crear usuario")
  }

  revalidatePath("/")
}

export async function updateUser(id: string, userData: Partial<User>): Promise<void> {
  const updateData: any = {}

  if (userData.username) updateData.username = userData.username
  if (userData.password) updateData.password = userData.password
  if (userData.name) updateData.name = userData.name
  if (userData.email) updateData.email = userData.email
  if (userData.role) updateData.role = userData.role
  if (userData.isActive !== undefined) updateData.is_active = userData.isActive

  const { error } = await supabase.from("users").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating user:", error)
    throw new Error("Error al actualizar usuario")
  }

  revalidatePath("/")
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("Error deleting user:", error)
    throw new Error("Error al eliminar usuario")
  }

  revalidatePath("/")
}

// ============ CLIENTES ============
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("name")

  if (error) {
    console.error("Error fetching clients:", error)
    throw new Error("Error al cargar clientes")
  }

  return data.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email || "",
    phone: client.phone,
    address: client.address,
    dni: client.dni,
    fechaNacimiento: new Date(client.fecha_nacimiento),
    vencimientoDni: client.vencimiento_dni ? new Date(client.vencimiento_dni) : undefined,
    numeroPasaporte: client.numero_pasaporte || undefined,
    vencimientoPasaporte: client.vencimiento_pasaporte ? new Date(client.vencimiento_pasaporte) : undefined,
    createdAt: new Date(client.created_at),
  }))
}

export async function createClient(clientData: Omit<Client, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("clients").insert({
    name: clientData.name,
    email: clientData.email || null,
    phone: clientData.phone,
    address: clientData.address,
    dni: clientData.dni,
    fecha_nacimiento: clientData.fechaNacimiento.toISOString().split("T")[0],
    vencimiento_dni: clientData.vencimientoDni ? clientData.vencimientoDni.toISOString().split("T")[0] : null,
    numero_pasaporte: clientData.numeroPasaporte || null,
    vencimiento_pasaporte: clientData.vencimientoPasaporte
      ? clientData.vencimientoPasaporte.toISOString().split("T")[0]
      : null,
  })

  if (error) {
    console.error("Error creating client:", error)
    throw new Error("Error al crear cliente")
  }

  revalidatePath("/")
}

export async function updateClient(id: string, clientData: Partial<Client>): Promise<void> {
  const updateData: any = {}

  if (clientData.name) updateData.name = clientData.name
  if (clientData.email !== undefined) updateData.email = clientData.email || null
  if (clientData.phone) updateData.phone = clientData.phone
  if (clientData.address) updateData.address = clientData.address
  if (clientData.dni) updateData.dni = clientData.dni
  if (clientData.fechaNacimiento) updateData.fecha_nacimiento = clientData.fechaNacimiento.toISOString().split("T")[0]
  if (clientData.vencimientoDni !== undefined)
    updateData.vencimiento_dni = clientData.vencimientoDni
      ? clientData.vencimientoDni.toISOString().split("T")[0]
      : null
  if (clientData.numeroPasaporte !== undefined) updateData.numero_pasaporte = clientData.numeroPasaporte || null
  if (clientData.vencimientoPasaporte !== undefined)
    updateData.vencimiento_pasaporte = clientData.vencimientoPasaporte
      ? clientData.vencimientoPasaporte.toISOString().split("T")[0]
      : null

  const { error } = await supabase.from("clients").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating client:", error)
    throw new Error("Error al actualizar cliente")
  }

  revalidatePath("/")
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    throw new Error("Error al eliminar cliente")
  }

  revalidatePath("/")
}

export async function importClients(clientsData: Omit<Client, "id" | "createdAt">[]): Promise<void> {
  const insertData = clientsData.map((client) => ({
    name: client.name,
    email: client.email || null,
    phone: client.phone,
    address: client.address,
    dni: client.dni,
    fecha_nacimiento: client.fechaNacimiento.toISOString().split("T")[0],
    vencimiento_dni: client.vencimientoDni ? client.vencimientoDni.toISOString().split("T")[0] : null,
    numero_pasaporte: client.numeroPasaporte || null,
    vencimiento_pasaporte: client.vencimientoPasaporte ? client.vencimientoPasaporte.toISOString().split("T")[0] : null,
  }))

  const { error } = await supabase.from("clients").insert(insertData)

  if (error) {
    console.error("Error importing clients:", error)
    throw new Error("Error al importar clientes")
  }

  revalidatePath("/")
}

// ============ BUSES ============
export async function getBuses(): Promise<Bus[]> {
  const { data, error } = await supabase.from("buses").select("*").order("patente")

  if (error) {
    console.error("Error fetching buses:", error)
    throw new Error("Error al cargar buses")
  }

  return data.map((bus) => ({
    id: bus.id,
    patente: bus.patente,
    asientos: bus.asientos,
    tipoServicio: bus.tipo_servicio,
    imagenDistribucion: bus.imagen_distribucion || undefined,
    createdAt: new Date(bus.created_at),
  }))
}

export async function createBus(busData: Omit<Bus, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("buses").insert({
    patente: busData.patente,
    asientos: busData.asientos,
    tipo_servicio: busData.tipoServicio,
    imagen_distribucion: busData.imagenDistribucion || null,
  })

  if (error) {
    console.error("Error creating bus:", error)
    throw new Error("Error al crear bus")
  }

  revalidatePath("/")
}

export async function updateBus(id: string, busData: Partial<Bus>): Promise<void> {
  const updateData: any = {}

  if (busData.patente) updateData.patente = busData.patente
  if (busData.asientos) updateData.asientos = busData.asientos
  if (busData.tipoServicio) updateData.tipo_servicio = busData.tipoServicio
  if (busData.imagenDistribucion !== undefined) updateData.imagen_distribucion = busData.imagenDistribucion || null

  const { error } = await supabase.from("buses").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating bus:", error)
    throw new Error("Error al actualizar bus")
  }

  revalidatePath("/")
}

export async function deleteBus(id: string): Promise<void> {
  const { error } = await supabase.from("buses").delete().eq("id", id)

  if (error) {
    console.error("Error deleting bus:", error)
    throw new Error("Error al eliminar bus")
  }

  revalidatePath("/")
}

// ============ VIAJES ============
export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from("trips").select("*").order("fecha_salida", { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
    throw new Error("Error al cargar viajes")
  }

  return data.map((trip) => ({
    id: trip.id,
    busId: trip.bus_id || undefined,
    destino: trip.destino,
    fechaSalida: new Date(trip.fecha_salida),
    fechaRegreso: new Date(trip.fecha_regreso),
    importe: trip.importe,
    currency: trip.currency as "ARS" | "USD",
    type: trip.type as Trip["type"],
    descripcion: trip.descripcion,
    naviera: trip.naviera || undefined,
    barco: trip.barco || undefined,
    cabina: trip.cabina || undefined,
    aerolinea: trip.aerolinea || undefined,
    numeroVuelo: trip.numero_vuelo || undefined,
    clase: trip.clase || undefined,
    escalas: trip.escalas || undefined,
    archived: trip.archived,
    createdAt: new Date(trip.created_at),
  }))
}

export async function createTrip(tripData: Omit<Trip, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("trips").insert({
    bus_id: tripData.busId || null,
    destino: tripData.destino,
    fecha_salida: tripData.fechaSalida.toISOString(),
    fecha_regreso: tripData.fechaRegreso.toISOString(),
    importe: tripData.importe,
    currency: tripData.currency,
    type: tripData.type,
    descripcion: tripData.descripcion,
    naviera: tripData.naviera || null,
    barco: tripData.barco || null,
    cabina: tripData.cabina || null,
    aerolinea: tripData.aerolinea || null,
    numero_vuelo: tripData.numeroVuelo || null,
    clase: tripData.clase || null,
    escalas: tripData.escalas || null,
    archived: tripData.archived || false,
  })

  if (error) {
    console.error("Error creating trip:", error)
    throw new Error("Error al crear viaje")
  }

  revalidatePath("/")
}

export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<void> {
  const updateData: any = {}

  if (tripData.busId !== undefined) updateData.bus_id = tripData.busId || null
  if (tripData.destino) updateData.destino = tripData.destino
  if (tripData.fechaSalida) updateData.fecha_salida = tripData.fechaSalida.toISOString()
  if (tripData.fechaRegreso) updateData.fecha_regreso = tripData.fechaRegreso.toISOString()
  if (tripData.importe) updateData.importe = tripData.importe
  if (tripData.currency) updateData.currency = tripData.currency
  if (tripData.type) updateData.type = tripData.type
  if (tripData.descripcion) updateData.descripcion = tripData.descripcion
  if (tripData.naviera !== undefined) updateData.naviera = tripData.naviera || null
  if (tripData.barco !== undefined) updateData.barco = tripData.barco || null
  if (tripData.cabina !== undefined) updateData.cabina = tripData.cabina || null
  if (tripData.aerolinea !== undefined) updateData.aerolinea = tripData.aerolinea || null
  if (tripData.numeroVuelo !== undefined) updateData.numero_vuelo = tripData.numeroVuelo || null
  if (tripData.clase !== undefined) updateData.clase = tripData.clase || null
  if (tripData.escalas !== undefined) updateData.escalas = tripData.escalas || null
  if (tripData.archived !== undefined) updateData.archived = tripData.archived

  const { error } = await supabase.from("trips").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating trip:", error)
    throw new Error("Error al actualizar viaje")
  }

  revalidatePath("/")
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id)

  if (error) {
    console.error("Error deleting trip:", error)
    throw new Error("Error al eliminar viaje")
  }

  revalidatePath("/")
}

// ============ PASAJEROS DE VIAJES ============
export async function getTripPassengers(): Promise<TripPassenger[]> {
  const { data, error } = await supabase
    .from("trip_passengers")
    .select("*")
    .order("fecha_reserva", { ascending: false })

  if (error) {
    console.error("Error fetching trip passengers:", error)
    throw new Error("Error al cargar pasajeros")
  }

  return data.map((passenger) => ({
    id: passenger.id,
    tripId: passenger.trip_id,
    clientId: passenger.client_id,
    fechaReserva: new Date(passenger.fecha_reserva),
    pagado: passenger.pagado,
    numeroAsiento: passenger.numero_asiento || 0,
    numeroCabina: passenger.numero_cabina || undefined,
  }))
}

export async function createTripPassenger(passengerData: Omit<TripPassenger, "id" | "fechaReserva">): Promise<void> {
  const { error } = await supabase.from("trip_passengers").insert({
    trip_id: passengerData.tripId,
    client_id: passengerData.clientId,
    pagado: passengerData.pagado,
    numero_asiento: passengerData.numeroAsiento || null,
    numero_cabina: passengerData.numeroCabina || null,
  })

  if (error) {
    console.error("Error creating trip passenger:", error)
    throw new Error("Error al agregar pasajero")
  }

  revalidatePath("/")
}

export async function updateTripPassenger(id: string, passengerData: Partial<TripPassenger>): Promise<void> {
  const updateData: any = {}

  if (passengerData.tripId) updateData.trip_id = passengerData.tripId
  if (passengerData.clientId) updateData.client_id = passengerData.clientId
  if (passengerData.pagado !== undefined) updateData.pagado = passengerData.pagado
  if (passengerData.numeroAsiento !== undefined) updateData.numero_asiento = passengerData.numeroAsiento || null
  if (passengerData.numeroCabina !== undefined) updateData.numero_cabina = passengerData.numeroCabina || null

  const { error } = await supabase.from("trip_passengers").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating trip passenger:", error)
    throw new Error("Error al actualizar pasajero")
  }

  revalidatePath("/")
}

export async function deleteTripPassenger(id: string): Promise<void> {
  const { error } = await supabase.from("trip_passengers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting trip passenger:", error)
    throw new Error("Error al eliminar pasajero")
  }

  revalidatePath("/")
}

// ============ PAGOS ============
export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from("payments").select("*").order("date", { ascending: false })

  if (error) {
    console.error("Error fetching payments:", error)
    throw new Error("Error al cargar pagos")
  }

  return data.map((payment) => ({
    id: payment.id,
    clientId: payment.client_id,
    tripId: payment.trip_id,
    amount: payment.amount,
    currency: payment.currency as "ARS" | "USD",
    type: payment.type as "payment" | "charge",
    description: payment.description,
    date: new Date(payment.date),
    receiptNumber: payment.receipt_number || undefined,
  }))
}

export async function createPayment(paymentData: Omit<Payment, "id" | "date">): Promise<void> {
  const { error } = await supabase.from("payments").insert({
    client_id: paymentData.clientId,
    trip_id: paymentData.tripId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    type: paymentData.type,
    description: paymentData.description,
    receipt_number: paymentData.receiptNumber || null,
  })

  if (error) {
    console.error("Error creating payment:", error)
    throw new Error("Error al crear pago")
  }

  revalidatePath("/")
}

export async function updatePayment(id: string, paymentData: Partial<Payment>): Promise<void> {
  const updateData: any = {}

  if (paymentData.clientId) updateData.client_id = paymentData.clientId
  if (paymentData.tripId) updateData.trip_id = paymentData.tripId
  if (paymentData.amount) updateData.amount = paymentData.amount
  if (paymentData.currency) updateData.currency = paymentData.currency
  if (paymentData.type) updateData.type = paymentData.type
  if (paymentData.description) updateData.description = paymentData.description
  if (paymentData.receiptNumber !== undefined) updateData.receipt_number = paymentData.receiptNumber || null

  const { error } = await supabase.from("payments").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating payment:", error)
    throw new Error("Error al actualizar pago")
  }

  revalidatePath("/")
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting payment:", error)
    throw new Error("Error al eliminar pago")
  }

  revalidatePath("/")
}

// ============ FUNCIONES DE AUTENTICACIÓN ============
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .eq("is_active", true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    username: data.username,
    password: data.password,
    name: data.name,
    email: data.email,
    role: data.role as User["role"],
    createdAt: new Date(data.created_at),
    isActive: data.is_active,
  }
}
