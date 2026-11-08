import { supabase } from '../lib/supabase'

export async function getFamilyById(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('families')
      .select(`
        id,
        name,
        created_at,
        caregivers (
          id,
          family_id,
          name,
          role,
          created_at,
          is_active
        )
      `)
      .eq('id', familyId)
      .eq('caregivers.is_active', true)
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function getFamilyInvite(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('family_invites')
      .select(`
        id,
        family_id,
        code,
        created_at
      `)
      .eq('family_id', familyId)
      .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createFamilyWithAdmin(
  familyName: string,
  caregiverName: string,
) {
  const { data, error } =
    await supabase.rpc(
      'create_family_with_admin',
      {
        p_family_name: familyName,
        p_caregiver_name: caregiverName,
      },
    )

  if (error) {
    throw error
  }

  return data
}
export async function joinFamilyWithInvite(
  inviteCode: string,
  caregiverName: string,
) {
  const { data, error } =
    await supabase.rpc(
      'join_family_with_invite',
      {
        p_invite_code: inviteCode,
        p_caregiver_name: caregiverName,
      },
    )

  if (error) {
    throw error
  }

  return data
}
export async function removeFamilyMember(
  caregiverId: string,
) {
  const { data, error } =
    await supabase.rpc(
      'remove_family_member',
      {
        p_caregiver_id: caregiverId,
      },
    )

  if (error) {
    throw error
  }

  return data
}
export async function getFamilyWithCaregivers(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('families')
      .select(`
        id,
        name,
        caregivers (
          id,
          family_id,
          name,
          role,
          created_at,
          is_active
        )
      `)
      .eq('id', familyId)
      .single()

  if (error) {
    throw error
  }

  return data
}