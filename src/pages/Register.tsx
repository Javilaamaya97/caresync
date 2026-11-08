import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { signUp } from '../services/authService'

export function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const result = await signUp(
  name,
  email,
  password,
)

if (!result.session) {
  setError(
    'La cuenta fue creada, pero no se inició la sesión automáticamente.',
  )
  return
}

navigate('/family-setup')
    } catch (error) {
  console.error(
    'Error real al registrar:',
    error,
  )

  if (error instanceof Error) {
    setError(error.message)
  } else {
    setError(
      'No fue posible crear la cuenta.',
    )
  }
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
            Crear cuenta
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Únete a CareSync
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="text-sm font-medium text-slate-700">
              Nombre
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Tu nombre"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
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
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading
              ? 'Creando cuenta...'
              : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            navigate('/login')
          }
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700"
        >
          Ya tengo una cuenta
        </button>
      </div>
    </div>
  )
}