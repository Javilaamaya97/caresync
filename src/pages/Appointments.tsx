
import { useEffect, useState } from 'react'
import { useCaregiver } from '../context/CaregiverContext'
import {
  createAppointment,
  getFamilyAppointments,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../services/appointmentService'

import type {
  Appointment,
} from '../services/appointmentService'

export function Appointments() {
  const { caregiver } = useCaregiver()

  const [appointments, setAppointments] =
    useState<Appointment[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [institution, setInstitution] = useState('')
  const [address, setAddress] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadAppointments() {
    if (!caregiver?.familyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data = await getFamilyAppointments(
        caregiver.familyId,
      )

      setAppointments(data)
    } catch (err) {
  console.error('ERROR COMPLETO AL GUARDAR CITA:', err)

  if (err instanceof Error) {
    setError(err.message)
  } else {
    setError(JSON.stringify(err))
  }
} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [caregiver?.familyId])
function handleEdit(appointment: Appointment) {
  setEditingId(appointment.id)

  setTitle(appointment.title)
  setSpecialty(appointment.specialty ?? '')
  setDoctorName(appointment.doctor_name ?? '')
  setInstitution(appointment.institution ?? '')
  setAddress(appointment.address ?? '')
  setAppointmentDate(appointment.appointment_date)
  setAppointmentTime(
    appointment.appointment_time?.slice(0, 5) ?? ''
  )
  setReason(appointment.reason ?? '')
  setNotes(appointment.notes ?? '')

  setShowForm(true)

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
  function resetForm() {
    setTitle('')
    setSpecialty('')
    setDoctorName('')
    setInstitution('')
    setAddress('')
    setAppointmentDate('')
    setAppointmentTime('')
    setReason('')
    setNotes('')
    setShowForm(false)
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!caregiver?.familyId) {
      setError('No se encontró la familia.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const appointmentData = {
  family_id: caregiver.familyId,
  title: title.trim(),
  specialty: specialty.trim(),
  doctor_name: doctorName.trim(),
  institution: institution.trim(),
  address: address.trim(),
  appointment_date: appointmentDate,
  appointment_time: appointmentTime || undefined,
  reason: reason.trim(),
  notes: notes.trim(),
}

if (editingId) {
  await updateAppointment(editingId, appointmentData)
} else {
  await createAppointment(appointmentData)
}

      resetForm()
      await loadAppointments()
    } catch (err: any) {
  console.error('ERROR AL GUARDAR CITA:', {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
  })

  setError(
    `${err.message || 'Error desconocido'} (${err.code || 'sin código'})`
  )
} finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(
    id: string,
    status: Appointment['status'],
  ) {
    try {
      await updateAppointmentStatus(id, status)
      await loadAppointments()
    } catch (err) {
      console.error('Error actualizando cita:', err)
      setError('No fue posible actualizar la cita.')
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      '¿Estás segura de eliminar esta cita?',
    )

    if (!confirmed) return

    try {
      await deleteAppointment(id)
      await loadAppointments()
    } catch (err) {
      console.error('Error eliminando cita:', err)
      setError('No fue posible eliminar la cita.')
    }
  }

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      appointment.status === 'scheduled' &&
      appointment.appointment_date >=
        new Date().toLocaleDateString('en-CA'),
  )

  const historyAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== 'scheduled' ||
      appointment.appointment_date <
        new Date().toLocaleDateString('en-CA'),
  )

  function formatAppointmentDate(date: string) {
    const [year, month, day] = date.split('-').map(Number)

    return new Date(year, month - 1, day).toLocaleDateString(
      'es-CO',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    )
  }

  function statusLabel(status: Appointment['status']) {
    if (status === 'completed') return 'Realizada'
    if (status === 'cancelled') return 'Cancelada'
    return 'Programada'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Citas médicas
          </h1>

          <p className="mt-2 text-slate-500">
            Organiza y comparte las citas médicas de tu familia.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          + Nueva cita
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Registrar cita médica
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nombre de la cita *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Control médico"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Especialidad
                </label>
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej. Neurología"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Médico
                </label>
                <input
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Nombre del médico"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Institución / IPS
                </label>
                <input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Nombre de la institución"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Fecha *
                </label>
                <input
                  required
                  type="date"
                  min={new Date().toLocaleDateString('en-CA')}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Hora
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Dirección
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección de la cita"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Motivo de la consulta
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe el motivo..."
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preparación, documentos, recomendaciones..."
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cita'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-3 font-semibold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Próximas citas ({upcomingAppointments.length})
        </h2>

        {loading ? (
          <p className="text-slate-500">Cargando citas...</p>
        ) : upcomingAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-3xl">🩺</p>
            <p className="mt-3 font-semibold text-slate-800">
              No hay citas programadas
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Registra una cita para comenzar a organizar el cuidado.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingAppointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {appointment.title}
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      {appointment.specialty || 'Sin especialidad'}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Programada
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>📅 {formatAppointmentDate(appointment.appointment_date)}</p>

                  {appointment.appointment_time && (
                    <p>🕒 {appointment.appointment_time.slice(0, 5)}</p>
                  )}

                  {appointment.doctor_name && (
                    <p>👨‍⚕️ {appointment.doctor_name}</p>
                  )}

                  {appointment.institution && (
                    <p>🏥 {appointment.institution}</p>
                  )}

                  {appointment.address && (
                    <p>📍 {appointment.address}</p>
                  )}

                  {appointment.reason && (
                    <p>Motivo: {appointment.reason}</p>
                  )}

                  {appointment.notes && (
                    <p>Observaciones: {appointment.notes}</p>
                  )}
                </div>
<button
  onClick={() => handleEdit(appointment)}
  className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
>
  Editar
</button>
                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        appointment.id,
                        'completed',
                      )
                    }
                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                  >
                    Marcar realizada
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        appointment.id,
                        'cancelled',
                      )
                    }
                    className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                  >
                    Cancelar cita
                  </button>

                  <button
                    onClick={() => handleDelete(appointment.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Historial ({historyAppointments.length})
        </h2>

        {historyAppointments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Todavía no hay citas en el historial.
          </div>
        ) : (
          <div className="space-y-3">
            {historyAppointments.map((appointment) => (
              <article
                key={appointment.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {appointment.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatAppointmentDate(appointment.appointment_date)}
                    {' · '}
                    {appointment.specialty || 'Sin especialidad'}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {statusLabel(appointment.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
