export type CaregiverName = string

export interface Caregiver {
  id: string
  familyId: string
  name: CaregiverName
  role: string
  createdAt: string
}

export interface Shift {
  id: string
  familyId: string
  caregiverId: string
  startDate: string
  endDate: string
  responsible: CaregiverName
  status:
    | 'confirmed'
    | 'pending'
    | 'changed'
}

export interface GeneratedShift {
  id: string
  startDate: string
  endDate: string
  responsible: CaregiverName
  status:
    | 'confirmed'
    | 'pending'
    | 'changed'
}

export interface ShiftChange {
  id: string
  shiftId: string
  requestedBy: string
  proposedTo: string
  reason?: string
  status:
    | 'pending'
    | 'accepted'
    | 'rejected'
  createdAt: string
}