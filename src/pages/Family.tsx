import { useEffect, useState } from 'react'

import { useCaregiver } from '../context/CaregiverContext'

import {
  getFamilyById,
  getFamilyInvite,
  removeFamilyMember,
} from '../services/familyService'

interface FamilyMember {
  id: string
  name: string
  role: string
  is_active: boolean
}

interface FamilyData {
  id: string
  name: string
  caregivers: FamilyMember[]
}

interface FamilyInvite {
  id: string
  family_id: string
  code: string
  created_at: string
}

export function Family() {
  const { caregiver } = useCaregiver()

  const [family, setFamily] =
    useState<FamilyData | null>(null)

  const [invite, setInvite] =
    useState<FamilyInvite | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [removingId, setRemovingId] =
    useState<string | null>(null)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  async function loadFamily() {
    if (!caregiver) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        familyData,
        inviteData,
      ] = await Promise.all([
        getFamilyById(
          caregiver.familyId,
        ),
        getFamilyInvite(
          caregiver.familyId,
        ),
      ])

      setFamily(
        familyData as FamilyData,
      )

      setInvite(
        inviteData as FamilyInvite | null,
      )
    } catch (error) {
      console.error(
        'Error cargando familia:',
        error,
      )

      setError(
        'No fue posible cargar la información de la familia.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamily()
  }, [caregiver])

  const copyInviteCode =
    async () => {
      if (!invite?.code) {
        return
      }

      await navigator.clipboard.writeText(
        invite.code,
      )

      setMessage(
        'Código copiado al portapapeles.',
      )

      setTimeout(() => {
        setMessage('')
      }, 2500)
    }

  const handleRemoveMember =
    async (
      member: FamilyMember,
    ) => {
      if (!caregiver) {
        return
      }

      if (
        caregiver.role !== 'admin'
      ) {
        return
      }

      if (
        member.id === caregiver.id
      ) {
        return
      }

      const confirmed =
        window.confirm(
          `¿Quieres eliminar a ${member.name} de la familia?\n\nLa persona conservará su cuenta de CareSync, pero dejará de pertenecer a esta familia.`,
        )

      if (!confirmed) {
        return
      }

      try {
        setRemovingId(member.id)
        setError('')

        await removeFamilyMember(
          member.id,
        )

        setMessage(
          `${member.name} fue eliminado de la familia.`,
        )

        await loadFamily()
      } catch (error) {
        console.error(
          'Error eliminando miembro:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible eliminar al miembro.',
        )
      } finally {
        setRemovingId(null)
      }
    }

  if (loading) {
    return (
      <div>
        <p className="text-sm text-slate-500">
          Cargando familia...
        </p>
      </div>
    )
  }

  if (!family) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Familia
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          No se encontró la información de la familia.
        </p>
      </div>
    )
  }

  const activeMembers =
    family.caregivers.filter(
      (member) =>
        member.is_active !== false,
    )

  const isAdmin =
    caregiver?.role === 'admin'

  return (
    <div>

      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          Organización familiar
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {family.name}
        </h1>

        <p className="mt-2 text-slate-500">
          Personas que forman parte de esta familia.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          ✓ {message}
        </div>
      )}

      {/* Código de invitación */}

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

        <p className="text-sm font-medium text-emerald-700">
          Invitar a un familiar
        </p>

        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Comparte este código
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          La persona debe registrarse en CareSync y utilizar este código para unirse a tu familia.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">

          <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 font-mono text-lg font-bold tracking-wider text-emerald-700">
            {invite?.code ??
              'Sin código'}
          </div>

          {invite?.code && (
            <button
              type="button"
              onClick={
                copyInviteCode
              }
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              📋 Copiar código
            </button>
          )}

        </div>

      </section>

      {/* Miembros */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Miembros de la familia
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {activeMembers.length}{' '}
              {activeMembers.length === 1
                ? 'persona'
                : 'personas'}
            </p>
          </div>

          {isAdmin && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              👑 Administrador
            </span>
          )}

        </div>

        <div className="mt-5 space-y-3">

          {activeMembers.map(
            (member) => {
              const isMemberAdmin =
                member.role === 'admin'

              const isCurrentUser =
                member.id ===
                caregiver?.id

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                      {member.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {member.name}
                        {isCurrentUser &&
                          ' (Tú)'}
                      </p>

                      <p className="text-sm text-slate-500">
                        {isMemberAdmin
                          ? 'Administrador'
                          : 'Cuidador'}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    {isMemberAdmin && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        👑 Admin
                      </span>
                    )}

                    {isAdmin &&
                      !isCurrentUser &&
                      !isMemberAdmin && (
                        <button
                          type="button"
                          disabled={
                            removingId ===
                            member.id
                          }
                          onClick={() =>
                            handleRemoveMember(
                              member,
                            )
                          }
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingId ===
                          member.id
                            ? 'Eliminando...'
                            : 'Eliminar'}
                        </button>
                      )}

                  </div>

                </div>
              )
            },
          )}

        </div>

      </section>

    </div>
  )
}