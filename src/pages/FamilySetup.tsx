import { useCaregiver } from '../context/CaregiverContext'
import { useAuth } from '../context/AuthContext'
import {
  createFamilyWithAdmin,
  joinFamilyWithInvite,
} from '../services/familyService'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FamilySetup() {
  const { user } = useAuth()
const { refreshCaregiver } = useCaregiver()
  const navigate = useNavigate()

  const [mode, setMode] = useState<
    'choose' | 'create' | 'join'
  >('choose')

  const [familyName, setFamilyName] =
    useState('')

  const [inviteCode, setInviteCode] =
    useState('')

  const [error, setError] =
    useState('')

  if (mode === 'choose') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white">
              ♥
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Configura tu familia
            </h1>

            <p className="mt-2 text-slate-500">
              Crea un grupo familiar o únete a uno existente.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                setMode('create')
              }
              className="rounded-2xl border border-slate-200 p-6 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="text-3xl">
                🏠
              </span>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Crear una familia
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Crea un nuevo grupo familiar y serás su administrador.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setMode('join')
              }
              className="rounded-2xl border border-slate-200 p-6 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="text-3xl">
                🔗
              </span>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Unirme a una familia
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Usa el código de invitación que te compartieron.
              </p>
            </button>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/login')
            }
            className="mt-6 w-full text-sm text-slate-500 hover:text-slate-700"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h1 className="text-2xl font-bold text-slate-900">
            Crear familia
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Serás el administrador de esta familia.
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-700">
              Nombre de la familia
            </label>

            <input
              value={familyName}
              onChange={(event) =>
                setFamilyName(
                  event.target.value,
                )
              }
              placeholder="Ej. Familia Ávila"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={async () => {
              if (!familyName.trim()) {
                setError(
                  'Escribe un nombre para la familia.',
                )
                return
              }

              setError('')

              // Próximo paso:
              // crear familia en Supabase.

             try {
  if (!user) {
    setError(
      'No hay un usuario autenticado.',
    )
    return
  }

  const caregiverName =
    user.user_metadata?.name

  if (!caregiverName) {
    setError(
      'No encontramos tu nombre de usuario.',
    )
    return
  }

  const result =
  await createFamilyWithAdmin(
    familyName.trim(),
    caregiverName,
  )

console.log(
  'Familia creada:',
  result,
)

await refreshCaregiver()

navigate('/')
} catch (error) {
  console.error(
    'Error creando familia:',
    error,
  )

  setError(
    'No fue posible crear la familia.',
  )
}
            }}
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Crear familia
          </button>

          <button
            type="button"
            onClick={() =>
              setMode('choose')
            }
            className="mt-3 w-full text-sm text-slate-500"
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        <h1 className="text-2xl font-bold text-slate-900">
          Unirme a una familia
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Introduce el código que te compartió el administrador.
        </p>

        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">
            Código de invitación
          </label>

          <input
            value={inviteCode}
            onChange={(event) =>
              setInviteCode(
                event.target.value.toUpperCase(),
              )
            }
            placeholder="Ej. CARESYNC-7K4P"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm uppercase outline-none focus:border-emerald-500"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={async () => {
  if (!inviteCode.trim()) {
    setError(
      'Introduce el código de invitación.',
    )
    return
  }

  if (!user) {
    setError(
      'No hay un usuario autenticado.',
    )
    return
  }

  const caregiverName =
    user.user_metadata?.name

  if (!caregiverName) {
    setError(
      'No encontramos tu nombre de usuario.',
    )
    return
  }

  setError('')

  try {
    await joinFamilyWithInvite(
      inviteCode.trim(),
      caregiverName,
    )

    await refreshCaregiver()

    navigate('/')
  } catch (error) {
    console.error(
      'Error uniéndose a la familia:',
      error,
    )

    setError(
      error instanceof Error
        ? error.message
        : 'No fue posible unirse a la familia.',
    )
  }
}}
          className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Unirme a la familia
        </button>

        <button
          type="button"
          onClick={() =>
            setMode('choose')
          }
          className="mt-3 w-full text-sm text-slate-500"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}