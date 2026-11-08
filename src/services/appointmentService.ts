
import { supabase } from '../lib/supabase'

export interface Appointment {
  id: string
  family_id: string
  created_by: string
  title: string
  specialty: string | null
  doctor_name: string | null
  institution: string | null
  address: string | null
  appointment_date: string
  appointment_time: string | null
  reason: string | null
  notes: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface AppointmentInput {
  family_id: string
  title: string
  specialty?: string
  doctor_name?: string
  institution?: string
  address?: string
  appointment_date: string
  appointment_time?: string
  reason?: string
  notes?: string
}

export async function getFamilyAppointments(
  familyId: string,
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('family_id', familyId)
    .order('appointment_date', {
      ascending: true,
    })

  if (error) throw error

  return (data ?? []) as Appointment[]
}

export async function createAppointment(
  appointment: AppointmentInput,
) {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single()

  if (error) throw error

  return data as Appointment
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
) {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error

  return data as Appointment
}

export async function deleteAppointment(
  appointmentId: string,
) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) throw error
}
export async function updateAppointment(
  appointmentId: string,
  appointment: AppointmentInput,
) {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      title: appointment.title,
      specialty: appointment.specialty,
      doctor_name: appointment.doctor_name,
      institution: appointment.institution,
      address: appointment.address,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      reason: appointment.reason,
      notes: appointment.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error

  return data as Appointment
}