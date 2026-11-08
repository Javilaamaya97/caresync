
import { useEffect, useMemo, useState } from 'react'

import { useCaregiver } from '../context/CaregiverContext'
import { useAuth } from '../context/AuthContext'

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService'

import type {
  Task,
  TaskInput,
} from '../services/taskService'

import { getCaregivers } from '../services/caregiverService'

interface CaregiverOption {
  id: string
  name: string
}

interface TaskForm {
  title: string
  description: string
  responsible_id: string
  due_date: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
}

const emptyForm: TaskForm = {
  title: '',
  description: '',
  responsible_id: '',
  due_date: '',
  priority: 'medium',
  status: 'pending',
}

function formatDate(date: string | null) {
  if (!date) return 'Sin fecha'

  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function getLocalDate() {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getPriorityLabel(priority: Task['priority']) {
  const labels = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }

  return labels[priority]
}

function getStatusLabel(status: Task['status']) {
  const labels = {
    pending: 'Pendiente',
    in_progress: 'En proceso',
    completed: 'Completada',
  }

  return labels[status]
}

function getStatusColor(status: Task['status']) {
  const colors = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }

  return colors[status]
}

function getPriorityColor(priority: Task['priority']) {
  const colors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  }

  return colors[priority]
}

export function Tasks() {
  const { caregiver, loading: caregiverLoading } = useCaregiver()
  const { user } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [caregivers, setCaregivers] = useState<CaregiverOption[]>([])

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<TaskForm>(emptyForm)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterResponsible, setFilterResponsible] = useState('all')
  const [search, setSearch] = useState('')

  const [message, setMessage] = useState('')

  async function loadData() {
    if (!caregiver) return

    try {
      setLoadingData(true)

      const [taskData, caregiverData] = await Promise.all([
        getTasks(caregiver.familyId),
        getCaregivers(caregiver.familyId),
      ])

      setTasks(taskData ?? [])
      setCaregivers(caregiverData ?? [])
    } catch (error) {
      console.error('Error cargando pendientes:', error)
      setMessage('No fue posible cargar los pendientes.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (caregiver) {
      loadData()
    }
  }, [caregiver?.id, caregiver?.familyId])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description ?? '').toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        filterStatus === 'all' || task.status === filterStatus

      const matchesResponsible =
        filterResponsible === 'all' ||
        task.responsible_id === filterResponsible

      return matchesSearch && matchesStatus && matchesResponsible
    })
  }, [tasks, search, filterStatus, filterResponsible])

  const pendingCount = tasks.filter(
    (task) => task.status === 'pending',
  ).length

  const inProgressCount = tasks.filter(
    (task) => task.status === 'in_progress',
  ).length

  const completedCount = tasks.filter(
    (task) => task.status === 'completed',
  ).length

  const overdueCount = tasks.filter(
    (task) =>
      task.status !== 'completed' &&
      task.due_date !== null &&
      task.due_date < getLocalDate(),
  ).length

  function updateForm(
    field: keyof TaskForm,
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

  function openEditForm(task: Task) {
    setEditingId(task.id)

    setForm({
      title: task.title,
      description: task.description ?? '',
      responsible_id: task.responsible_id ?? '',
      due_date: task.due_date ?? '',
      priority: task.priority,
      status: task.status,
    })

    setMessage('')
    setShowForm(true)
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!caregiver || !user) {
      setMessage('No se encontró la sesión del usuario.')
      return
    }

    try {
      setSaving(true)
      setMessage('')

      const taskData: TaskInput = {
        family_id: caregiver.familyId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        responsible_id: form.responsible_id || null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
        created_by: user.id,
      }

      if (editingId) {
        const { created_by, ...changes } = taskData

        await updateTask(editingId, changes)

        setMessage('Pendiente actualizado correctamente.')
      } else {
        await createTask(taskData)

        setMessage('Pendiente creado correctamente.')
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)

      await loadData()
    } catch (error) {
      console.error('Error guardando pendiente:', error)
      setMessage('No fue posible guardar el pendiente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(
    task: Task,
    status: Task['status'],
  ) {
    try {
      await updateTask(task.id, { status })

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? { ...item, status }
            : item,
        ),
      )
    } catch (error) {
      console.error('Error actualizando estado:', error)
      setMessage('No fue posible actualizar el estado.')
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      '¿Estás segura de que deseas eliminar este pendiente?',
    )

    if (!confirmed) return

    try {
      await deleteTask(id)

      setTasks((previous) =>
        previous.filter((task) => task.id !== id),
      )

      setMessage('Pendiente eliminado correctamente.')
    } catch (error) {
      console.error('Error eliminando pendiente:', error)
      setMessage('No fue posible eliminar el pendiente.')
    }
  }

  if (caregiverLoading || loadingData) {
    return (
      <p className="text-sm text-slate-500">
        Cargando pendientes...
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
            Organización familiar
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Pendientes
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organiza las actividades y responsabilidades familiares.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Crear pendiente
        </button>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pendientes</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">En proceso</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Completados</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Vencidos</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {overdueCount}
          </p>
        </div>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId ? 'Editar pendiente' : 'Nuevo pendiente'}
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
                  Actividad *
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    updateForm('title', event.target.value)
                  }
                  placeholder="Ej. Reclamar medicamentos"
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

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Fecha límite
                </label>

                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    updateForm('due_date', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Prioridad
                </label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateForm('priority', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Estado
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm('status', event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En proceso</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Descripción
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                placeholder="Describe qué se debe realizar..."
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
                    : 'Crear pendiente'}
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
            Actividades familiares
          </h2>

          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar actividad..."
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En proceso</option>
              <option value="completed">Completados</option>
            </select>

            <select
              value={filterResponsible}
              onChange={(event) =>
                setFilterResponsible(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Todos los responsables</option>
              {caregivers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-700">
              No hay actividades para mostrar.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Crea un pendiente para comenzar a organizar las tareas familiares.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredTasks.map((task) => {
              const responsible = caregivers.find(
                (member) => member.id === task.responsible_id,
              )

              const isOverdue =
                task.status !== 'completed' &&
                task.due_date !== null &&
                task.due_date < getLocalDate()

              return (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {task.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(task.status)}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          Prioridad {getPriorityLabel(task.priority)}
                        </span>

                        {isOverdue && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Vencido
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <p>
                          <strong>Responsable:</strong>{' '}
                          {responsible?.name || 'Sin asignar'}
                        </p>

                        <p>
                          <strong>Fecha límite:</strong>{' '}
                          {formatDate(task.due_date)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="text-xs font-medium text-slate-500">
                          Cambiar estado:
                        </label>

                        <select
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(
                              task,
                              event.target.value as Task['status'],
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="in_progress">En proceso</option>
                          <option value="completed">Completada</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(task)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(task.id)}
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
