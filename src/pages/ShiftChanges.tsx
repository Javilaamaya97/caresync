
import {
  useEffect,
  useState,
} from 'react'

import {
  getCaregivers,
} from '../services/caregiverService'

import {
  createShiftChangeRequest,
  getPendingShiftChanges,
  acceptShiftChange,
  rejectShiftChange,
} from '../services/shiftChangeService'

import {
  getFamilyShifts,
} from '../services/shiftService'

import { useCaregiver } from '../context/CaregiverContext'

interface FamilyCaregiver {
  id: string
  name: string
  role: string
}

interface FamilyShift {
  id: string
  family_id: string
  caregiver_id: string
  start_date: string
  end_date: string
  status: string
  caregivers:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null
}

interface ShiftChangeRequest {
  id: string
  shift_id: string
  requested_by: string
  proposed_to: string
  reason: string | null
  status: string
  requested_by_caregiver?: {
    id: string
    name: string
  } | null
  proposed_to_caregiver?: {
    id: string
    name: string
  } | null
}

export function ShiftChanges() {
  const { caregiver, loading } = useCaregiver()

  const [shifts, setShifts] = useState<FamilyShift[]>([])
  const [familyCaregivers, setFamilyCaregivers] =
    useState<FamilyCaregiver[]>([])

  const [selectedShiftId, setSelectedShiftId] =
    useState('')

  const [proposedTo, setProposedTo] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  const [pendingChanges, setPendingChanges] =
    useState<ShiftChangeRequest[]>([])

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const currentUser = caregiver?.id

  // Cargar turnos y cuidadores reales de Supabase
  useEffect(() => {
    async function loadData() {
      if (!caregiver) return

      try {
        setLoadingData(true)

        const [shiftData, caregiverData] = await Promise.all([
          getFamilyShifts(caregiver.familyId),
          getCaregivers(caregiver.familyId),
        ])

        const normalizedShifts: FamilyShift[] = (
          shiftData ?? []
        ).map((shift) => ({
          ...shift,
          caregivers: Array.isArray(shift.caregivers)
            ? shift.caregivers
            : shift.caregivers
              ? [shift.caregivers]
              : [],
        }))

        // Solo mostrar turnos futuros o vigentes
        const today = new Date().toISOString().slice(0, 10)

        const availableShifts = normalizedShifts.filter(
          (shift) =>
            shift.end_date >= today &&
            shift.caregiver_id === caregiver.id &&
            shift.status === 'confirmed',
        )

        setShifts(availableShifts)
        setFamilyCaregivers(caregiverData ?? [])

        setSelectedShiftId((previous) =>
          availableShifts.some((shift) => shift.id === previous)
            ? previous
            : availableShifts[0]?.id ?? '',
        )

        setProposedTo((previous) =>
          caregiverData?.some(
            (member) =>
              member.id === previous &&
              member.id !== caregiver.id,
          )
            ? previous
            : caregiverData?.find(
                (member) => member.id !== caregiver.id,
              )?.id ?? '',
        )
      } catch (error) {
        console.error('Error cargando datos de cambios:', error)
        setMessage('No fue posible cargar los datos.')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [caregiver])

  // Cargar solicitudes dirigidas al cuidador actual
  useEffect(() => {
    async function loadPendingChanges() {
      if (!caregiver) return

      try {
        const data = await getPendingShiftChanges(caregiver.id)
        setPendingChanges(data ?? [])
      } catch (error) {
        console.error('Error cargando solicitudes:', error)
      }
    }

    loadPendingChanges()
  }, [caregiver])

  const availableCaregivers = familyCaregivers.filter(
    (member) => member.id !== currentUser,
  )

  async function refreshPendingChanges() {
    if (!currentUser) return

    const data = await getPendingShiftChanges(currentUser)
    setPendingChanges(data ?? [])
  }

  async function requestChange() {
    if (!currentUser || !selectedShiftId || !proposedTo) {
      setMessage('Selecciona un turno y un cuidador.')
      return
    }

    try {
      setSaving(true)
      setMessage('')

      await createShiftChangeRequest(
        selectedShiftId,
        currentUser,
        proposedTo,
        reason.trim() || undefined,
      )

      setReason('')
      setMessage('Solicitud enviada correctamente.')
    } catch (error) {
      console.error('Error creando solicitud:', error)
      setMessage('No fue posible crear la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAccept(requestId: string) {
    try {
      setProcessingId(requestId)
      setMessage('')

      await acceptShiftChange(requestId)
      await refreshPendingChanges()

      // Actualizar también los turnos después de aceptar
      if (caregiver) {
        const data = await getFamilyShifts(caregiver.familyId)

        setShifts(
          (data ?? []).filter(
            (shift) =>
              shift.end_date >= new Date().toISOString().slice(0, 10) &&
              shift.status === 'confirmed' &&
              shift.caregiver_id === caregiver.id,
          ) as FamilyShift[],
        )
      }

      setMessage('Cambio de turno aceptado correctamente.')
    } catch (error) {
      console.error('Error aceptando cambio:', error)
      setMessage('No fue posible aceptar el cambio.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(requestId: string) {
    try {
      setProcessingId(requestId)
      setMessage('')

      await rejectShiftChange(requestId)
      await refreshPendingChanges()

      setMessage('Solicitud rechazada correctamente.')
    } catch (error) {
      console.error('Error rechazando cambio:', error)
      setMessage('No fue posible rechazar la solicitud.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500">
        Cargando información familiar...
      </p>
    )
  }

  if (!caregiver) {
    return (
      <p className="text-sm text-slate-500">
        No se encontró el cuidador asociado a esta cuenta.
      </p>
    )
  }

  if (loadingData) {
    return (
      <p className="text-sm text-slate-500">
        Cargando turnos y cuidadores...
      </p>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          Organización familiar
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Cambios de turno
        </h1>

        <p className="mt-2 text-slate-500">
          Solicita un cambio con otro cuidador.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Solicitar cambio
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Turno
            </label>

            <select
              value={selectedShiftId}
              onChange={(event) =>
                setSelectedShiftId(event.target.value)
              }
              disabled={shifts.length === 0}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              {shifts.length === 0 ? (
                <option value="">
                  No tienes turnos disponibles
                </option>
              ) : (
                shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.start_date} — {shift.end_date}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Proponer a
            </label>

            <select
              value={proposedTo}
              onChange={(event) =>
                setProposedTo(event.target.value)
              }
              disabled={availableCaregivers.length === 0}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              {availableCaregivers.length === 0 ? (
                <option value="">
                  No hay otros cuidadores disponibles
                </option>
              ) : (
                availableCaregivers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Motivo
              <span className="ml-1 text-slate-400">
                (opcional)
              </span>
            </label>

            <textarea
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Ej. Tengo una cita ese día..."
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={requestChange}
            disabled={
              saving ||
              !selectedShiftId ||
              !proposedTo
            }
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Enviando...' : 'Solicitar cambio'}
          </button>

          {message && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Solicitudes pendientes
        </h2>

        {pendingChanges.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No tienes solicitudes pendientes.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {pendingChanges.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {request.requested_by_caregiver?.name ?? 'Cuidador'}
                  {' → '}
                  {request.proposed_to_caregiver?.name ?? 'Cuidador'}
                </p>

                {request.reason && (
                  <p className="mt-1 text-sm text-slate-500">
                    {request.reason}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId !== null}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {processingId === request.id
                      ? 'Procesando...'
                      : 'Aceptar'}
                  </button>

                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId !== null}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
