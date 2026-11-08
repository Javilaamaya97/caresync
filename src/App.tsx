import { Login } from './pages/Login'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { FamilyRequired } from './components/FamilyRequired'

import { Dashboard } from './pages/Dashboard'
import { Calendar } from './pages/Calendar'
import { Appointments } from './pages/Appointments'
import { Shifts } from './pages/Shifts'
import { Medications } from './pages/Medications'
import { Tasks } from './pages/Tasks'
import { Family } from './pages/Family'
import { Settings } from './pages/Settings'
import { ShiftChanges } from './pages/ShiftChanges'
import { Register } from './pages/Register'
import { FamilySetup } from './pages/FamilySetup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
{/* Inicio de sesión */}
<Route
  path="/login"
  element={<Login />}
/>
        {/* Registro */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Configuración inicial de familia */}
        <Route
          path="/family-setup"
          element={<FamilySetup />}
        />

        {/* Aplicación */}
        <Route element={<FamilyRequired />}>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/calendar"
              element={<Calendar />}
            />

            <Route
              path="/appointments"
              element={<Appointments />}
            />

            <Route
              path="/shifts"
              element={<Shifts />}
            />

            <Route
              path="/medications"
              element={<Medications />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/family"
              element={<Family />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="/shift-changes"
              element={<ShiftChanges />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App