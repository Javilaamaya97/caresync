import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useCaregiver } from '../context/CaregiverContext'
import { getFamilyById } from '../services/familyService'
import { signOut } from '../services/authService'

import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Inicio', path: '/', icon: '🏠' },
  { name: 'Calendario', path: '/calendar', icon: '📅' },
  { name: 'Citas', path: '/appointments', icon: '🩺' },
  { name: 'Turnos', path: '/shifts', icon: '🔄' },
  {
    name: 'Cambios',
    path: '/shift-changes',
    icon: '🔁',
  },
  { name: 'Medicamentos', path: '/medications', icon: '💊' },
  { name: 'Pendientes', path: '/tasks', icon: '✅' },
  { name: 'Familia', path: '/family', icon: '👨‍👩‍👧‍👦' },
  { name: 'Configuración', path: '/settings', icon: '⚙️' },
]

export function AppLayout() {
  const { user } = useAuth()
  const { caregiver } = useCaregiver()
  const navigate = useNavigate()

  const [familyName, setFamilyName] =
    useState('Familia')

  const [memberCount, setMemberCount] =
    useState(0)

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
        setMemberCount(
          family.caregivers.length,
        )
      } catch (error) {
        console.error(
          'Error cargando familia:',
          error,
        )
      }
    }

    loadFamily()
  }, [caregiver])

  const handleSignOut =
    async () => {
      try {
        await signOut()
        navigate('/login', {
          replace: true,
        })
      } catch (error) {
        console.error(
          'Error cerrando sesión:',
          error,
        )
      }
    }

  const userName =
    caregiver?.name ??
    user?.user_metadata?.name ??
    'Usuario'

  const initials =
    userName
      .trim()
      .charAt(0)
      .toUpperCase()

  const role =
    caregiver?.role === 'admin'
      ? 'Administrador'
      : 'Cuidador'

  return (
    <div className="min-h-screen bg-slate-50">

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">

          <div className="border-b border-slate-200 p-6">
            <Logo />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {familyName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {memberCount}{' '}
                {memberCount === 1
                  ? 'cuidador'
                  : 'cuidadores'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <span className="text-lg">
                🚪
              </span>

              Cerrar sesión
            </button>

          </div>
        </div>
      </aside>

      <div className="lg:pl-64">

        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">

            <div className="lg:hidden">
              <Logo showTagline={false} />
            </div>

            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">
                {familyName}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/settings')
              }
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {userName}
                </p>

                <p className="text-xs text-slate-500">
                  {role}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                {initials}
              </div>
            </button>

          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}