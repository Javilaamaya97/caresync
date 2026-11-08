import { supabase } from '../lib/supabase'

export async function createShiftChangeRequest(
  shiftId: string,
  requestedBy: string,
  proposedTo: string,
  reason?: string,
) {
  const { data, error } =
    await supabase
      .from('shift_changes')
      .insert({
        shift_id: shiftId,
        requested_by: requestedBy,
        proposed_to: proposedTo,
        reason: reason ?? null,
        status: 'pending',
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function getPendingShiftChanges(
  caregiverId: string,
) {
  const { data, error } =
    await supabase
      .from('shift_changes')
      .select(`
        *,
        requested_by_caregiver:caregivers!shift_changes_requested_by_fkey(
          id,
          name
        ),
        proposed_to_caregiver:caregivers!shift_changes_proposed_to_fkey(
          id,
          name
        )
      `)
      .eq('proposed_to', caregiverId)
      .eq('status', 'pending')

  if (error) {
    throw error
  }

  return data
}

export async function acceptShiftChange(
  requestId: string,
) {
  const { error } = await supabase.rpc(
    'accept_shift_change',
    {
      p_request_id: requestId,
    },
  )

  if (error) {
    throw error
  }

}

export async function rejectShiftChange(
  requestId: string,
) {
  const { data, error } =
    await supabase
      .from('shift_changes')
      .update({
        status: 'rejected',
      })
      .eq('id', requestId)
      .select()
      .single()

  if (error) {
    throw error
  }

  return data
} 