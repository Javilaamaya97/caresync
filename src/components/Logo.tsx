interface LogoProps {
  showTagline?: boolean
}

export function Logo({ showTagline = true }: LogoProps) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold tracking-tight text-slate-900">
        Care<span className="text-emerald-600">Sync</span>
      </span>

      {showTagline && (
        <span className="text-xs text-slate-500">
          Organiza. Coordina. Cuida.
        </span>
      )}
    </div>
  )
}
