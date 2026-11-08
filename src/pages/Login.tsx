import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { signIn } from '../services/authService'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

   try {
  await signIn(
    email,
    password,
  )

  navigate('/', {
    replace: true,
  })
} catch (error) {
      console.error(error)

      setError(
        'Correo o contraseña incorrectos.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white">
            ♥
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            CareSync
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organización y cuidado familiar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="text-sm font-medium text-slate-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="correo@ejemplo.com"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="••••••••"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>
        </form>
                <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            ¿No tienes una cuenta?
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/register')
            }
            className="mt-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Crear una cuenta
          </button>
        </div>
      </div>
    </div>
  )
}