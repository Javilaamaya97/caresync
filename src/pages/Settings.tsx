import { useAuth } from '../context/AuthContext'
import { useCaregiver } from '../context/CaregiverContext'
import { useEffect, useState } from 'react'

import { getFamilyById } from '../services/familyService'

export function Settings() {
  const { user } = useAuth()
  const { caregiver } = useCaregiver()

  const [familyName, setFamilyName] =
    useState('Cargando...')

  useEffect(() => {
    async function loadFamily() {
      if (!caregiver) {
        return
      }

      try {
        const family =
          await getFamilyById(
            caregiver.familyId,
          )

        setFamilyName(family.name)
      } catch (error) {
        console.error(
          'Error cargando familia:',
          error,
        )

        setFamilyName(
          'No disponible',
        )
      }
    }

    loadFamily()
  }, [caregiver])

  const name =
    caregiver?.name ??
    user?.user_metadata?.name ??
    'Usuario'

  const email =
    user?.email ??
    'No disponible'

  const role =
    caregiver?.role === 'admin'
      ? 'Administrador'
      : 'Cuidador'

  const initials =
    name
      .trim()
      .charAt(0)
      .toUpperCase()

  return (
    <div className="max-w-3xl">

      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          Mi cuenta
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Mi perfil
        </h1>

        <p className="mt-2 text-slate-500">
          Información de tu cuenta y participación en la familia.
        </p>
      </div>

      {/* Perfil principal */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            {initials}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {email}
            </p>

            <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {role === 'Administrador'
                ? '👑 Administrador'
                : '👤 Cuidador'}
            </span>
          </div>

        </div>

      </section>

      {/* Información */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-900">
          Información de la cuenta
        </h2>

        <div className="mt-5 divide-y divide-slate-100">

          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Nombre
            </span>

            <span className="font-medium text-slate-900">
              {name}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Correo electrónico
            </span>

            <span className="font-medium text-slate-900">
              {email}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Rol
            </span>

            <span className="font-medium text-slate-900">
              {role}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              Familia
            </span>

            <span className="font-medium text-slate-900">
              {familyName}
            </span>
          </div>

        </div>

      </section>

      {/* Estado */}

      <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

        <div className="flex items-start gap-3">

          <span className="text-xl">
            ✅
          </span>

          <div>
            <h2 className="font-semibold text-slate-900">
              Cuenta activa
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Tu cuenta está vinculada correctamente
              a una familia de CareSync.
            </p>
          </div>

        </div>

      </section>

    </div>
  )
}