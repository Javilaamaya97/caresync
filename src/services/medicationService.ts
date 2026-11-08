import { supabase } from '../lib/supabase'

export interface Medication {
  id: string
  family_id: string
  name: string
  presentation: string | null
  dosage: string | null
  quantity_available: number
  consumption_frequency: string | null
  start_date: string | null
  acquisition_type: 'eps' | 'particular'
  next_replenishment_date: string | null
  responsible_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MedicationInput = Omit<
  Medication,
  'id' | 'created_at' | 'updated_at'
>

export async function getMedications(familyId: string) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('family_id', familyId)
    .order('next_replenishment_date', {
      ascending: true,
      nullsFirst: false,
    })

  if (error) throw error
  return data as Medication[]
}

export async function createMedication(
  medication: MedicationInput,
) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medication)
    .select()
    .single()

  if (error) throw error
  return data as Medication
}

export async function updateMedication(
  id: string,
  changes: Partial<MedicationInput>,
) {
  const { data, error } = await supabase
    .from('medications')
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Medication
}

export async function deleteMedication(id: string) {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)

  if (error) throw error
}