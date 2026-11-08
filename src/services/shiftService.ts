import { supabase } from '../lib/supabase'
import type {
  CaregiverName,
  GeneratedShift,
} from '../types/shift'

import { getNextSaturday } from './dateService'
import { isHoliday } from './holidayService'
const ROTATION: CaregiverName[] = [
  'Marcela',
  'Diego',
  'Christian',
]

const FIRST_WEEKEND = new Date(
  '2026-08-22T12:00:00',
)

export function getWeekendResponsible(
  weekendStart: Date,
): CaregiverName {
  const differenceInDays = Math.floor(
    (weekendStart.getTime() -
      FIRST_WEEKEND.getTime()) /
      (1000 * 60 * 60 * 24),
  )

  const weekendNumber = Math.floor(
    differenceInDays / 7,
  )

  const index =
    ((weekendNumber % ROTATION.length) +
      ROTATION.length) %
    ROTATION.length

  return ROTATION[index]
}

export function getShiftForDate(
  date: Date,
): CaregiverName | null {
  const dayOfWeek = date.getDay()

  // Lunes a viernes no tienen turno normal.
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    return null
  }

  const saturday = new Date(date)

  // Si es domingo, buscamos el sábado
  // correspondiente al mismo fin de semana.
  if (dayOfWeek === 0) {
    saturday.setDate(
      saturday.getDate() - 1,
    )
  }

  saturday.setHours(12, 0, 0, 0)

  return getWeekendResponsible(saturday)
}

export function getCaregiverForDate(
  date: Date,
): CaregiverName | null {
  const dayOfWeek = date.getDay()

  // Sábado o domingo.
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return getShiftForDate(date)
  }

  // Lunes a viernes que NO son festivos.
  if (!isHoliday(date)) {
    return null
  }

  const associatedWeekend = new Date(date)

  // Festivo del lunes:
  // corresponde al fin de semana anterior.
  if (dayOfWeek === 1) {
    associatedWeekend.setDate(
      associatedWeekend.getDate() - 2,
    )
  } else {
    // Festivo de martes a viernes:
    // corresponde al siguiente fin de semana.
    associatedWeekend.setDate(
      associatedWeekend.getDate() +
        (6 - dayOfWeek),
    )
  }

  associatedWeekend.setHours(12, 0, 0, 0)

  return getWeekendResponsible(
    associatedWeekend,
  )
  
}
export function generateUpcomingShifts(
  startDate: Date,
  numberOfShifts: number,
): GeneratedShift[] {
  const shifts: GeneratedShift[] = []

  const firstSaturday =
  getNextSaturday(startDate)

  for (
    let index = 0;
    index < numberOfShifts;
    index++
  ) {
    const saturday = new Date(
      firstSaturday,
    )

    saturday.setDate(
      saturday.getDate() +
        index * 7,
    )

    const sunday = new Date(
      saturday,
    )

    sunday.setDate(
      sunday.getDate() + 1,
    )

    shifts.push({
  id: `generated-${index + 1}`,
  startDate: formatDateKey(
    saturday,
  ),
  endDate: formatDateKey(
    sunday,
  ),
  responsible:
    getWeekendResponsible(
      saturday,
    ),
  status: 'confirmed',
})
  }

  return shifts
}

function formatDateKey(
  date: Date,
): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}
export async function getShiftsFromSupabase(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('shifts')
      .select(`
        id,
        family_id,
        caregiver_id,
        start_date,
        end_date,
        status,
        caregivers (
          name
        )
      `)
      .eq('family_id', familyId)
      .order('start_date', {
        ascending: true,
      })

  if (error) {
    throw error
  }

  return data
}
export async function getFamilyShifts(
  familyId: string,
) {
  const { data, error } =
    await supabase
      .from('shifts')
      .select(`
        id,
        family_id,
        caregiver_id,
        start_date,
        end_date,
        status,
        caregivers (
  id,
  name
)
      `)
      .eq('family_id', familyId)
      .order('start_date', {
        ascending: true,
      })

  if (error) {
    throw error
  }

  return data
}
export async function getUpcomingFamilyShifts(
  familyId: string,
  fromDate: string,
  limit = 6,
) {
  const { data, error } =
    await supabase
      .from('shifts')
      .select(`
        id,
        family_id,
        caregiver_id,
        start_date,
        end_date,
        status,
        caregivers (
          id,
          name
        )
      `)
      .eq('family_id', familyId)
      .gte('end_date', fromDate)
      .order('start_date', {
        ascending: true,
      })
      .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}
export async function createShift(
  familyId: string,
  caregiverId: string,
  startDate: string,
  endDate: string,
  status: string = 'confirmed',
) {
  const { data, error } = await supabase
    .from('shifts')
    .insert({
      family_id: familyId,
      caregiver_id: caregiverId,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .select(`
      id,
      family_id,
      caregiver_id,
      start_date,
      end_date,
      status,
      caregivers (
        id,
        name
      )
    `)
    .single()

  if (error) throw error

  return data
}