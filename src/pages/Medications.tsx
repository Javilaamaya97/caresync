
import { useEffect, useMemo, useState } from 'react'

import { useCaregiver } from '../context/CaregiverContext'

import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from '../services/medicationService'

import type {
  Medication,
  MedicationInput,
} from '../services/medicationService'

import { getCaregivers } from '../services/caregiverService'

interface CaregiverOption {
  id: string
  name: string
}

interface MedicationForm {
  name: string
  presentation: string
  dosage: string
  quantity_available: string
  consumption_frequency: string
  start_date: string
  acquisition_type: 'eps' | 'particular'
  next_replenishment_date: string
  responsible_id: string
  notes: string
}

const emptyForm: MedicationForm = {
  name: '',
  presentation: '',
  dosage: '',
  quantity_available: '0',
  consumption_frequency: '',
  start_date: '',
  acquisition_type: 'eps',
  next_replenishment_date: '',
  responsible_id: '',
  notes: '',
}

function getLocalDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(date: string | null) {
  if (!date) return 'Sin fecha'

  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function getMedicationStatus(medication: Medication) {
  if (medication.quantity_available <= 0) {
    return {
      label: 'Agotado',
      color: 'bg-red-100 text-red-700',
    }
  }

  if (!medication.next_replenishment_date) {
    return {
      label: 'Sin programar',
      color: 'bg-slate-100 text-slate-600',
    }
  }

  const today = getLocalDate()
  const difference =
    (new Date(`${medication.next_replenishment_date}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
    (1000 * 60 * 60 * 24)

  if (difference <= 0) {
    return {
      label: 'Pendiente',
      color: 'bg-red-100 text-red-700',
    }
  }

  if (difference <= 7) {
    return {
      label: 'Próximo',
      color: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    label: 'Programado',
    color: 'bg-emerald-100 text-emerald-700',
  }
}

export function Medications() {
  const { caregiver, loading } = useCaregiver()

  const [medications, setMedications] = useState<Medication[]>([])
  const [caregivers, setCaregivers] = useState<CaregiverOption[]>([])

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<MedicationForm>(emptyForm)

  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  async function loadData() {
    if (!caregiver) return

    try {
      setLoadingData(true)

      const [medicationData, caregiverData] = await Promise.all([
        getMedications(caregiver.familyId),
        getCaregivers(caregiver.familyId),
      ])

      setMedications(medicationData ?? [])
      setCaregivers(caregiverData ?? [])
    } catch (error) {
      console.error('Error cargando medicamentos:', error)
      setMessage('No fue posible cargar los medicamentos.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (caregiver) {
      loadData()
    }
  }, [caregiver?.id, caregiver?.familyId])

  const filteredMedications = useMemo(() => {
    return medications.filter((medication) => {
      const matchesSearch = medication.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesFilter =
        filter === 'todos' ||
        medication.acquisition_type === filter

      return matchesSearch && matchesFilter
    })
  }, [medications, search, filter])

  const pendingCount = medications.filter((medication) => {
    return (
      medication.quantity_available > 0 &&
      medication.next_replenishment_date !== null &&
      medication.next_replenishment_date <= getLocalDate()
    )
  }).length

  const upcomingCount = medications.filter((medication) => {
    if (
      !medication.next_replenishment_date ||
      medication.quantity_available <= 0
    ) {
      return false
    }

    const difference =
      (new Date(`${medication.next_replenishment_date}T00:00:00`).getTime() -
        new Date(`${getLocalDate()}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)

    return difference > 0 && difference <= 7
  }).length

  const exhaustedCount = medications.filter(
    (medication) => medication.quantity_available <= 0,
  ).length

  function updateForm(
    field: keyof MedicationForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function openNewForm() {
    setEditingId(null)

    setForm({
      ...emptyForm,
      responsible_id: caregiver?.id ?? '',
    })

    setMessage('')
    setShowForm(true)
  }

  function openEditForm(medication: Medication) {
    setEditingId(medication.id)

    setForm({
      name: medication.name,
      presentation: medication.presentation ?? '',
      dosage: medication.dosage ?? '',
      quantity_available: String(medication.quantity_available),
      consumption_frequency: medication.consumption_frequency ?? '',
      start_date: medication.start_date ?? '',
      acquisition_type: medication.acquisition_type,
      next_replenishment_date:
        medication.next_replenishment_date ?? '',
      responsible_id: medication.responsible_id ?? '',
      notes: medication.notes ?? '',
    })

    setMessage('')
    setShowForm(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!caregiver) return

    try {
      setSaving(true)
      setMessage('')

      const medicationData: MedicationInput = {
        family_id: caregiver.familyId,
        name: form.name.trim(),
        presentation: form.presentation.trim() || null,
        dosage: form.dosage.trim() || null,
        quantity_available: Number(form.quantity_available),
        consumption_frequency:
          form.consumption_frequency.trim() || null,
        start_date: form.start_date || null,
        acquisition_type: form.acquisition_type,
        next_replenishment_date:
          form.next_replenishment_date || null,
        responsible_id: form.responsible_id || null,
        notes: form.notes.trim() || null,
      }

      if (editingId) {
        await updateMedication(editingId, medicationData)
        setMessage('Medicamento actualizado correctamente.')
      } else {
        await createMedication(medicationData)
        setMessage('Medicamento registrado correctamente.')
      }

      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)

      await loadData()
    } catch (error) {
      console.error('Error guardando medicamento:', error)
      setMessage('No fue posible guardar el medicamento.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      '¿Estás segura de que deseas eliminar este medicamento?',
    )

    if (!confirmed) return

    try {
      await deleteMedication(id)

      setMedications((previous) =>
        previous.filter((medication) => medication.id !== id),
      )

      setMessage('Medicamento eliminado correctamente.')
    } catch (error) {
      console.error('Error eliminando medicamento:', error)
      setMessage('No fue posible eliminar el medicamento.')
    }
  }

  if (loading || loadingData) {
    return (
      <p className="text-sm text-slate-500">
        Cargando medicamentos...
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Cuidado y bienestar
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Medicamentos
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Controla las existencias y fechas de reposición.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Agregar medicamento
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Registrados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {medications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pendientes de reclamar</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Próximos 7 días</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Agotados</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {exhaustedCount}
          </p>
        </div>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId ? 'Editar medicamento' : 'Nuevo medicamento'}
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Nombre del medicamento *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateForm('name', event.target.value)
                  }
                  placeholder="Ej. Levodopa"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Presentación
                </label>
                <select
                  value={form.presentation}
                  onChange={(event) =>
                    updateForm('presentation', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="Tabletas">Tabletas</option>
                  <option value="Cápsulas">Cápsulas</option>
                  <option value="Gotas">Gotas</option>
                  <option value="Jarabe">Jarabe</option>
                  <option value="Inyectable">Inyectable</option>
                  <option value="Crema">Crema</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Dosis
                </label>
                <input
                  value={form.dosage}
                  onChange={(event) =>
                    updateForm('dosage', event.target.value)
                  }
                  placeholder="Ej. 250 mg"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Cantidad disponible *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity_available}
                  onChange={(event) =>
                    updateForm('quantity_available', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Frecuencia de consumo
                </label>
                <input
                  value={form.consumption_frequency}
                  onChange={(event) =>
                    updateForm('consumption_frequency', event.target.value)
                  }
                  placeholder="Ej. Cada 8 horas"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    updateForm('start_date', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tipo de adquisición *
                </label>
                <select
                  required
                  value={form.acquisition_type}
                  onChange={(event) =>
                    updateForm(
                      'acquisition_type',
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="eps">EPS</option>
                  <option value="particular">Compra particular</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Fecha del próximo reclamo o compra
                </label>
                <input
                  type="date"
                  value={form.next_replenishment_date}
                  onChange={(event) =>
                    updateForm(
                      'next_replenishment_date',
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Responsable
                </label>
                <select
                  value={form.responsible_id}
                  onChange={(event) =>
                    updateForm('responsible_id', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Sin asignar</option>
                  {caregivers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Observaciones
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateForm('notes', event.target.value)
                }
                placeholder="Información adicional..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Registrar medicamento'}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Medicamentos registrados
          </h2>

          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar medicamento..."
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="eps">EPS</option>
              <option value="particular">Particular</option>
            </select>
          </div>
        </div>

        {filteredMedications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-700">
              No hay medicamentos registrados.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Agrega el primer medicamento para comenzar.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredMedications.map((medication) => {
              const status = getMedicationStatus(medication)

              const responsible = caregivers.find(
                (member) => member.id === medication.responsible_id,
              )

              return (
                <article
                  key={medication.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {medication.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {medication.acquisition_type === 'eps'
                            ? 'EPS'
                            : 'Particular'}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {medication.presentation || 'Sin presentación'}
                        {' · '}
                        {medication.dosage || 'Sin dosis registrada'}
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <strong>Disponible:</strong>{' '}
                          {medication.quantity_available}
                        </p>

                        <p>
                          <strong>Frecuencia:</strong>{' '}
                          {medication.consumption_frequency || 'Sin especificar'}
                        </p>

                        <p>
                          <strong>Próximo reclamo:</strong>{' '}
                          {formatDate(medication.next_replenishment_date)}
                        </p>

                        <p>
                          <strong>Responsable:</strong>{' '}
                          {responsible?.name || 'Sin asignar'}
                        </p>
                      </div>

                      {medication.notes && (
                        <p className="mt-3 text-sm text-slate-500">
                          {medication.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(medication)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(medication.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
