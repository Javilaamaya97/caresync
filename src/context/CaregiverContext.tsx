import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { Caregiver } from '../types/shift'

import { useAuth } from './AuthContext'

import {
  getCurrentCaregiver,
} from '../services/caregiverService'

interface CaregiverContextValue {
  caregiver: Caregiver | null
  loading: boolean
  refreshCaregiver: () => Promise<void>
}

const CaregiverContext =
  createContext<CaregiverContextValue>({
    caregiver: null,
    loading: true,
    refreshCaregiver: async () => {},
  })

export function CaregiverProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  const [caregiver, setCaregiver] =
    useState<Caregiver | null>(null)

  const [loading, setLoading] =
    useState(true)

  const loadCaregiver = useCallback(async () => {
  if (!user) {
    setCaregiver(null)
    setLoading(false)
    return
  }

  try {
    setLoading(true)

    const caregiverData =
      await getCurrentCaregiver(
        user.id,
      )

    if (!caregiverData) {
      setCaregiver(null)
      return
    }

    setCaregiver({
      id: caregiverData.id,
      familyId:
        caregiverData.family_id,
      name: caregiverData.name,
      role: caregiverData.role,
      createdAt:
        caregiverData.created_at,
    })
  } catch (error) {
    console.error(
      'Error cargando cuidador:',
      error,
    )

    setCaregiver(null)
    } finally {
    setLoading(false)
  }
}, [user])

useEffect(() => {
  loadCaregiver()
}, [loadCaregiver])

  return (
    <CaregiverContext.Provider
  value={{
    caregiver,
    loading,
    refreshCaregiver: loadCaregiver,
  }}
>
      {children}
    </CaregiverContext.Provider>
  )
}

export function useCaregiver() {
  return useContext(
    CaregiverContext,
  )
}