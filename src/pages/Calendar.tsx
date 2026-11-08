
import { useEffect, useState } from 'react'
import { useCaregiver } from '../context/CaregiverContext'
import { getFamilyShifts } from '../services/shiftService'
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isWeekend,
} from '../services/dateService'
import { getHolidayName } from '../services/holidayService'

interface CalendarShift {
  id: string
  start_date: string
  end_date: string
  status: string
  caregivers: {
    id: string
    name: string
  }[] | null
}

const caregiverColors = [
  'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
]

export function Calendar() {
  const { caregiver } = useCaregiver()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<CalendarShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadShifts() {
      if (!caregiver?.familyId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const data = await getFamilyShifts(caregiver.familyId)

        const normalizedShifts: CalendarShift[] = (data ?? []).map(
          (shift) => ({
            ...shift,
            caregivers: Array.isArray(shift.caregivers)
              ? shift.caregivers
              : shift.caregivers
                ? [shift.caregivers]
                : [],
          }),
        )

        setShifts(normalizedShifts)
      } catch (err) {
        console.error('Error cargando calendario:', err)
        setError('No fue posible cargar los turnos.')
      } finally {
        setLoading(false)
      }
    }

    loadShifts()
  }, [caregiver])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const weekdays = [
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
    'Dom',
  ]

  function getShiftsForDay(day: number) {
    const dateKey = [
      year,
      String(month + 1).padStart(2, '0'),
      String(day).padStart(2, '0'),
    ].join('-')

    return shifts.filter(
      (shift) =>
        shift.start_date <= dateKey &&
        shift.end_date >= dateKey,
    )
  }

  function getCaregiverColor(name: string) {
    const names = Array.from(
      new Set(
        shifts.map((shift) => shift.caregivers?.[0]?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    )

    const index = names.indexOf(name)

    return caregiverColors[
      index >= 0 ? index % caregiverColors.length : 0
    ]
  }

  function changeMonth(direction: number) {
    setCurrentDate(
      new Date(year, month + direction, 1),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Calendario de cuidado
        </h1>
        <p className="mt-2 text-slate-500">
          Consulta la programación de turnos de tu familia.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50"
          >
            ←
          </button>

          <h2 className="text-xl font-bold capitalize text-slate-900">
            {currentDate.toLocaleDateString('es-CO', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>

          <button
            onClick={() => changeMonth(1)}
            className="rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50"
          >
            →
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Cargando calendario...
          </p>
        ) : error ? (
          <p className="py-10 text-center text-red-600">
            {error}
          </p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((weekday) => (
              <div
                key={weekday}
                className="py-2 text-center text-sm font-semibold text-slate-500"
              >
                {weekday}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from(
              { length: daysInMonth },
              (_, index) => index + 1,
            ).map((day) => {
              const date = new Date(year, month, day, 12)
              const dayShifts = getShiftsForDay(day)
              const isToday =
                date.toDateString() === new Date().toDateString()
              const holidayName = getHolidayName(date)

              return (
                <div
                  key={day}
                  className={`min-h-28 rounded-xl border p-2 ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-50'
                      : isWeekend(date)
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-100 bg-white'
                  }`}
                >
                  <p className="mb-2 text-sm font-semibold text-slate-700">
  {day}
</p>

{holidayName && (
  <div className="mb-2 rounded-md bg-red-100 px-1.5 py-1 text-xs font-medium text-red-700">
    🎉 {holidayName}
  </div>
)}

                  <div className="space-y-1">
                    {dayShifts.map((shift) => {
                      const name =
                        shift.caregivers?.[0]?.name ??
                        'Sin cuidador'

                      return (
                        <div
                          key={shift.id}
                          title={`${name} - ${shift.status}`}
                          className={`rounded-md px-1.5 py-1 text-xs font-medium ${
                            getCaregiverColor(name)
                          }`}
                        >
                          {name}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-slate-800">
          Estado de los turnos
        </h3>

        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>🟢 Confirmado</span>
          <span>🟡 Pendiente</span>
          <span>🔄 Cambiado</span>
        </div>
      </div>
    </div>
  )
}
