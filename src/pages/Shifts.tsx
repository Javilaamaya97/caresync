import { useEffect, useState } from 'react'

import { useCaregiver } from '../context/CaregiverContext'

import { getHolidayName } from '../services/holidayService'

import {
  getFamilyShifts,
  createShift,
} from '../services/shiftService'

import {
  getFamilyWithCaregivers,
} from '../services/familyService'

import {
  getDaysInMonth,
  getFirstDayOfMonth,
} from '../services/dateService'

interface FamilyShift {
  id: string
  family_id: string
  caregiver_id: string
  start_date: string
  end_date: string
  status: string
  caregivers:
  | {
      id: string
      name: string
    }
  | {
      id: string
      name: string
    }[]
  | null
}

export function Shifts() {
  const { caregiver } = useCaregiver()

  const [currentDate, setCurrentDate] =
    useState(new Date())

  const [shifts, setShifts] =
    useState<FamilyShift[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [showCreateForm, setShowCreateForm] =
  useState(false)

const [caregivers, setCaregivers] =
  useState<
    {
      id: string
      name: string
      role: string
      is_active: boolean
    }[]
  >([])

const [selectedCaregiverId, setSelectedCaregiverId] =
  useState('')

const [startDate, setStartDate] =
  useState('')

const [endDate, setEndDate] =
  useState('')

const [creating, setCreating] =
  useState(false)

  useEffect(() => {
    async function loadShifts() {
      if (!caregiver) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const data =
          await getFamilyShifts(
            caregiver.familyId,
          )
        
        const family =
  await getFamilyWithCaregivers(caregiver.familyId)

const activeCaregivers =
  (family.caregivers ?? []).filter(
    (member: any) =>
      member.is_active !== false,
  )

setCaregivers(
  activeCaregivers,
)

        setShifts(
          (data ?? []) as FamilyShift[],
        )
      } catch (error) {
        console.error(
          'Error cargando turnos:',
          error,
        )

        setError(
          'No fue posible cargar los turnos.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadShifts()
  }, [caregiver])

  const year =
    currentDate.getFullYear()

  const month =
    currentDate.getMonth()

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(
        year,
        month - 1,
        1,
      ),
    )
  }

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(
        year,
        month + 1,
        1,
      ),
    )
  }

  const daysInMonth =
    getDaysInMonth(
      year,
      month,
    )

  const firstDay =
    getFirstDayOfMonth(
      year,
      month,
    )

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      {
        length: daysInMonth,
      },
      (_, index) => index + 1,
    ),
  ]

  const getShiftForDate = (
    date: Date,
  ) => {
    const dateKey =
      formatDateKey(date)

    return shifts.find(
      (shift) =>
        dateKey >= shift.start_date &&
        dateKey <= shift.end_date,
    )
  }

  const todayKey =
    formatDateKey(new Date())

  const upcomingShifts =
    shifts
      .filter(
        (shift) =>
          shift.end_date >=
          todayKey,
      )
      .slice(0, 6)

  if (loading) {
    return (
      <div>
        <p className="text-sm text-slate-500">
          Cargando turnos...
        </p>
      </div>
    )
  }
async function handleCreateShift() {
  if (!caregiver) return

  if (!selectedCaregiverId) {
    setError('Selecciona un cuidador.')
    return
  }

  if (!startDate || !endDate) {
    setError('Selecciona la fecha de inicio y la fecha de finalización.')
    return
  }

  if (endDate < startDate) {
    setError('La fecha de finalización no puede ser anterior a la fecha de inicio.')
    return
  }

  try {
    setCreating(true)
    setError('')

    await createShift(
      caregiver.familyId,
      selectedCaregiverId,
      startDate,
      endDate,
      'confirmed',
    )

    const data = await getFamilyShifts(caregiver.familyId)

    setShifts((data ?? []) as FamilyShift[])

    setSelectedCaregiverId('')
    setStartDate('')
    setEndDate('')
    setShowCreateForm(false)
  } catch (error) {
    console.error('Error creando turno:', error)
    setError('No fue posible crear el turno.')
  } finally {
    setCreating(false)
  }
}
  return (
    <div>

      <div className="mb-8 flex items-start justify-between gap-4">
  <div>
    <p className="text-sm font-medium text-emerald-600">
      Organización familiar
    </p>

    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
      Turnos
    </h1>

    <p className="mt-2 text-slate-500">
      Consulta quién está encargado del cuidado.
    </p>
  </div>

  <button
    type="button"
    onClick={() => setShowCreateForm(!showCreateForm)}
    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
  >
    + Crear turno
  </button>
</div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {showCreateForm && (
  <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">
        Crear nuevo turno
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Asigna un cuidador y define el periodo del turno.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <label
          htmlFor="caregiver"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cuidador
        </label>

        <select
  id="caregiver"
  value={selectedCaregiverId}
  onChange={(event) => setSelectedCaregiverId(event.target.value)}
  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
>
          <option value="" disabled>
            Selecciona un cuidador
          </option>

          {caregivers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="startDate"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Fecha de inicio
        </label>

        <input
  id="startDate"
  type="date"
  value={startDate}
  onChange={(event) => setStartDate(event.target.value)}
  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
/>
      </div>

      <div>
        <label
          htmlFor="endDate"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Fecha de finalización
        </label>

        <input
  id="endDate"
  type="date"
  value={endDate}
  onChange={(event) => setEndDate(event.target.value)}
  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
/>
      </div>
    </div>

    <div className="mt-5 flex justify-end gap-3">
      <button
        type="button"
        onClick={() => setShowCreateForm(false)}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>

      <button
  type="button"
  onClick={handleCreateShift}
  disabled={creating}
  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {creating ? 'Creando...' : 'Crear turno'}
</button>
    </div>
  </section>
)}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <button
            type="button"
            onClick={
              goToPreviousMonth
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            aria-label="Mes anterior"
          >
            ←
          </button>

          <h2 className="text-lg font-semibold capitalize text-slate-900">
            {currentDate.toLocaleDateString(
              'es-CO',
              {
                month: 'long',
                year: 'numeric',
              },
            )}
          </h2>

          <button
            type="button"
            onClick={
              goToNextMonth
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            aria-label="Mes siguiente"
          >
            →
          </button>

        </div>

        <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
          <div>LUN</div>
          <div>MAR</div>
          <div>MIÉ</div>
          <div>JUE</div>
          <div>VIE</div>
          <div>SÁB</div>
          <div>DOM</div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">

          {calendarDays.map(
            (day, index) => {
              const date =
                day === null
                  ? null
                  : new Date(
                      year,
                      month,
                      day,
                      12,
                    )

              const shift =
                date !== null
                  ? getShiftForDate(
                      date,
                    )
                  : null

              const holidayName =
                date !== null
                  ? getHolidayName(
                      date,
                    )
                  : null

              return (
                <div
                  key={`${day}-${index}`}
                  className={`min-h-20 rounded-xl border p-2 ${
                    day === null
                      ? 'border-transparent bg-transparent'
                      : shift
                        ? 'border-emerald-200 bg-emerald-50'
                        : holidayName
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-slate-100 bg-white'
                  }`}
                >

                  {day !== null && (
                    <span className="text-sm font-medium text-slate-700">
                      {day}
                    </span>
                  )}

                  {shift && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      {Array.isArray(shift.caregivers)
  ? shift.caregivers[0]?.name ?? 'Cuidador'
  : shift.caregivers?.name ?? 'Cuidador'}
                    </p>
                  )}

                  {holidayName && (
                    <p className="mt-1 text-[10px] font-medium text-amber-700">
                      🎉 {holidayName}
                    </p>
                  )}

                </div>
              )
            },
          )}

        </div>

      </section>

      <section className="mt-6">

        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Próximos turnos
        </h2>

        {upcomingShifts.length ===
          0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No hay turnos próximos registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingShifts.map(
              (shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                />
              ),
            )}
          </div>
        )}

      </section>

    </div>
  )
}

interface ShiftCardProps {
  shift: FamilyShift
}

function ShiftCard({
  shift,
}: ShiftCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="font-semibold text-slate-900">
          {Array.isArray(shift.caregivers)
  ? shift.caregivers[0]?.name ?? 'Cuidador'
  : shift.caregivers?.name ?? 'Cuidador'}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {formatDateRange(
            shift.start_date,
            shift.end_date,
          )}
        </p>

      </div>

      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        {getStatusLabel(
          shift.status,
        )}
      </span>

    </div>
  )
}

function getStatusLabel(
  status: string,
) {
  switch (status) {
    case 'confirmed':
      return '✓ Confirmado'

    case 'pending':
      return 'Pendiente'

    case 'changed':
      return '🔄 Cambiado'

    default:
      return status
  }
}

function formatDateRange(
  startDate: string,
  endDate: string,
) {
  const start =
    new Date(
      `${startDate}T12:00:00`,
    )

  const end =
    new Date(
      `${endDate}T12:00:00`,
    )

  return `${start.toLocaleDateString(
    'es-CO',
    {
      day: 'numeric',
      month: 'long',
    },
  )} — ${end.toLocaleDateString(
    'es-CO',
    {
      day: 'numeric',
      month: 'long',
    },
  )}`
}

function formatDateKey(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}