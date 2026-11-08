import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useCaregiver } from '../context/CaregiverContext'

export function FamilyRequired() {
  const { user, loading: authLoading } = useAuth()

  const {
    caregiver,
    loading: caregiverLoading,
  } = useCaregiver()

  if (
    authLoading ||
    caregiverLoading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Cargando CareSync...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (!caregiver) {
    return (
      <Navigate
        to="/family-setup"
        replace
      />
    )
  }

  return <Outlet />
}