export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          name: string
          email: string
          role: "admin" | "manager" | "operator" | "readonly"
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          name: string
          email: string
          role: "admin" | "manager" | "operator" | "readonly"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          name?: string
          email?: string
          role?: "admin" | "manager" | "operator" | "readonly"
          is_active?: boolean
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          address: string
          dni: string
          fecha_nacimiento: string
          vencimiento_dni: string | null
          numero_pasaporte: string | null
          vencimiento_pasaporte: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone: string
          address: string
          dni: string
          fecha_nacimiento: string
          vencimiento_dni?: string | null
          numero_pasaporte?: string | null
          vencimiento_pasaporte?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          address?: string
          dni?: string
          fecha_nacimiento?: string
          vencimiento_dni?: string | null
          numero_pasaporte?: string | null
          vencimiento_pasaporte?: string | null
          updated_at?: string
        }
      }
      buses: {
        Row: {
          id: string
          patente: string
          asientos: number
          tipo_servicio: string
          imagen_distribucion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patente: string
          asientos: number
          tipo_servicio: string
          imagen_distribucion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patente?: string
          asientos?: number
          tipo_servicio?: string
          imagen_distribucion?: string | null
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          bus_id: string | null
          destino: string
          fecha_salida: string
          fecha_regreso: string
          importe: number
          currency: "ARS" | "USD"
          type: "grupal" | "individual" | "crucero" | "aereo"
          descripcion: string
          naviera: string | null
          barco: string | null
          cabina: string | null
          aerolinea: string | null
          numero_vuelo: string | null
          clase: string | null
          escalas: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bus_id?: string | null
          destino: string
          fecha_salida: string
          fecha_regreso: string
          importe: number
          currency: "ARS" | "USD"
          type: "grupal" | "individual" | "crucero" | "aereo"
          descripcion: string
          naviera?: string | null
          barco?: string | null
          cabina?: string | null
          aerolinea?: string | null
          numero_vuelo?: string | null
          clase?: string | null
          escalas?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bus_id?: string | null
          destino?: string
          fecha_salida?: string
          fecha_regreso?: string
          importe?: number
          currency?: "ARS" | "USD"
          type?: "grupal" | "individual" | "crucero" | "aereo"
          descripcion?: string
          naviera?: string | null
          barco?: string | null
          cabina?: string | null
          aerolinea?: string | null
          numero_vuelo?: string | null
          clase?: string | null
          escalas?: string | null
          archived?: boolean
          updated_at?: string
        }
      }
      trip_passengers: {
        Row: {
          id: string
          trip_id: string
          client_id: string
          fecha_reserva: string
          pagado: boolean
          numero_asiento: number | null
          numero_cabina: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          client_id: string
          fecha_reserva?: string
          pagado?: boolean
          numero_asiento?: number | null
          numero_cabina?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          client_id?: string
          fecha_reserva?: string
          pagado?: boolean
          numero_asiento?: number | null
          numero_cabina?: string | null
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          client_id: string
          trip_id: string
          amount: number
          currency: "ARS" | "USD"
          type: "payment" | "charge"
          description: string
          date: string
          receipt_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          trip_id: string
          amount: number
          currency: "ARS" | "USD"
          type: "payment" | "charge"
          description: string
          date?: string
          receipt_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          trip_id?: string
          amount?: number
          currency?: "ARS" | "USD"
          type?: "payment" | "charge"
          description?: string
          date?: string
          receipt_number?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "manager" | "operator" | "readonly"
      currency_type: "ARS" | "USD"
      trip_type: "grupal" | "individual" | "crucero" | "aereo"
      payment_type: "payment" | "charge"
    }
  }
}
