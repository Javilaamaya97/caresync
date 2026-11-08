import { useEffect, useState } from 'react'
import { useCaregiver } from '../context/CaregiverContext'
import { getUpcomingFamilyShifts } from '../services/shiftService'

interface DashboardShift {
  id: string
  start_date: string
  end_date: string
  status: string
  caregivers: {
    id: string
    name: string
  }[] | null
}
export function Dashboard() {
  const { caregiver, loading } = useCaregiver()

  const [weekendShift, setWeekendShift] =
    useState<DashboardShift | null>(null)

  const [todayShift, setTodayShift] =
  useState<DashboardShift | null>(null)

  const [nextShift, setNextShift] =
  useState<DashboardShift | null>(null)

  const [loadingShift, setLoadingShift] =
    useState(true)

  const [shiftError, setShiftError] =
    useState('')

  const today = new Date()

  const nextSaturday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  )

  const daysUntilSaturday =
    (6 - today.getDay() + 7) % 7

  nextSaturday.setDate(
    nextSaturday.getDate() + daysUntilSaturday,
  )

  const nextSunday = new Date(nextSaturday)
  nextSunday.setDate(nextSunday.getDate() + 1)

  function formatDateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const saturdayKey = formatDateKey(nextSaturday)
  const sundayKey = formatDateKey(nextSunday)
  const todayKey = formatDateKey(today)

  const weekendLabel =
    `${nextSaturday.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
    })} — ${nextSunday.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
    })}`

  useEffect(() => {
  async function loadWeekendShift() {
    if (!caregiver) {
      setLoadingShift(false)
      return
    }

    try {
      setLoadingShift(true)
      setShiftError('')

      const data = await getUpcomingFamilyShifts(
        caregiver.familyId,
        todayKey,
        30,
      )

      const shifts: DashboardShift[] = (data ?? []).map((shift) => ({
        ...shift,
        caregivers: Array.isArray(shift.caregivers)
          ? shift.caregivers
          : shift.caregivers
            ? [shift.caregivers]
            : [],
      }))

      // Buscar quién tiene asignado el cuidado hoy
      const assignedToday = shifts.find(
        (shift) =>
          shift.start_date <= todayKey &&
          shift.end_date >= todayKey,
      )

      // Buscar quién tiene asignado el próximo fin de semana
      const assignedWeekend = shifts.find(
        (shift) =>
          shift.start_date <= sundayKey &&
          shift.end_date >= saturdayKey,
      )

      setTodayShift(assignedToday ?? null)
      setWeekendShift(assignedWeekend ?? null)
      const assignedNext = shifts.find(
  (shift) => shift.start_date > todayKey,
)

setNextShift(assignedNext ?? null)

    } catch (error) {
      console.error('Error cargando turnos:', error)

      setShiftError(
        'No fue posible consultar los turnos.',
      )
    } finally {
      setLoadingShift(false)
    }
  }

  loadWeekendShift()
}, [caregiver, todayKey, saturdayKey, sundayKey])
    return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Resumen del cuidado
        </h1>

        <p className="mt-2 text-slate-500">
          Todo lo importante para organizar el cuidado de tu familiar.
        </p>

        {loading ? (
          <p className="mt-2 text-sm text-slate-400">
            Cargando perfil...
          </p>
        ) : caregiver ? (
          <p className="mt-2 text-sm text-emerald-600">
            Hola, {caregiver.name} 👋
          </p>
        ) : (
          <p className="mt-2 text-sm text-red-600">
            No se encontró el cuidador.
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
  title="Responsable hoy"
  value={loadingShift
    ? 'Consultando...'
    : todayShift?.caregivers?.[0]?.name ?? 'Sin turno asignado'}
  description="Asignación de cuidado"
  icon="👤"
/>

        <DashboardCard
          title="Próxima cita"
          value="Sin citas"
          description="No hay citas registradas"
          icon="🩺"
        />

        <DashboardCard
  title="Próximo turno"
  value={
  loadingShift
    ? 'Consultando...'
    : nextShift?.caregivers?.[0]?.name ?? 'Sin turno asignado'
}
  description={weekendLabel}
  icon="📅"
/>

        <DashboardCard
          title="Pendientes"
          value="0"
          description="No hay tareas pendientes"
          icon="✅"
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <DashboardPanel
          title="Próximas actividades"
          description="Citas, turnos y tareas importantes."
        >
          <EmptyState
            icon="📋"
            title="Todavía no hay actividades"
            description="Cuando registres información aparecerá aquí."
          />
        </DashboardPanel>

        <DashboardPanel
          title="Actividad reciente"
          description="Últimos cambios realizados por la familia."
        >
          <EmptyState
            icon="🔄"
            title="Sin actividad reciente"
            description="Los cambios de turnos y registros aparecerán aquí."
          />
        </DashboardPanel>
      </section>

      <section className="mt-6">
        <DashboardPanel
          title="Próximo fin de semana"
          description="Turno asignado según la programación familiar."
        >
          <div className="flex flex-col gap-4 rounded-xl bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {weekendLabel}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
  {loadingShift
    ? 'Consultando...'
    : weekendShift?.caregivers?.[0]?.name ?? 'Sin turno asignado'}
</p>

              <p className="mt-1 text-sm text-slate-600">
                Responsable del fin de semana
              </p>

              {shiftError && (
                <p className="mt-2 text-sm text-red-600">
                  {shiftError}
                </p>
              )}
            </div>

            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              {loadingShift
                ? 'Consultando'
                : weekendShift
                  ? getStatusLabel(weekendShift.status)
                  : 'Sin asignación'}
            </span>
          </div>
        </DashboardPanel>
      </section>
    </div>
  )
}
interface DashboardCardProps {
  title: string
  value: string
  description: string
  icon: string
}

function DashboardCard({
  title,
  value,
  description,
  icon,
}: DashboardCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <span className="text-2xl">
          {icon}
        </span>
      </div>
    </div>
  )
}
interface DashboardPanelProps {
  title: string
  description: string
  children: React.ReactNode
}

function DashboardPanel({
  title,
  description,
  children,
}: DashboardPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  )
}
interface EmptyStateProps {
  icon: string
  title: string
  description: string
}

function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <span className="text-3xl">
        {icon}
      </span>

      <p className="mt-3 font-medium text-slate-900">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {description}
      </p>
    </div>
  )
}
function getStatusLabel(status: string) {
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