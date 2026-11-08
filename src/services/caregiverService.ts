import { supabase } from '../lib/supabase'

export async function getCaregivers(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('caregivers')
      .select(`
        id,
        family_id,
        name,
        role,
        created_at
      `)
      .eq('family_id', familyId)
      .order('name')

  if (error) {
    throw error
  }

  return data
}
export async function getCurrentCaregiver(
  userId: string,
) {
  const { data: profile, error: profileError } =
    await supabase
      .from('caregiver_profiles')
      .select('caregiver_id')
      .eq('user_id', userId)
      .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    return null
  }

  const { data: caregiver, error: caregiverError } =
    await supabase
      .from('caregivers')
      .select(`
        id,
        family_id,
        name,
        role,
        created_at
      `)
      .eq('id', profile.caregiver_id)
      .single()

  if (caregiverError) {
    throw caregiverError
  }

  return caregiver
}