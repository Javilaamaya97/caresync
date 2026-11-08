export function toLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function formatDate(
  date: Date,
): string {
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getDaysInMonth(
  year: number,
  month: number,
): number {
  return new Date(
    year,
    month + 1,
    0,
  ).getDate()
}

export function getFirstDayOfMonth(
  year: number,
  month: number,
): number {
  const day = new Date(
    year,
    month,
    1,
  ).getDay()

  return day === 0 ? 6 : day - 1
}

export function isWeekend(
  date: Date,
): boolean {
  const day = date.getDay()

  return day === 0 || day === 6
}
export function getNextSaturday(
  date: Date,
): Date {
  const result = new Date(date)

  result.setHours(
    12,
    0,
    0,
    0,
  )

  const day = result.getDay()

  const daysUntilSaturday =
    (6 - day + 7) % 7

  result.setDate(
    result.getDate() +
      daysUntilSaturday,
  )

  return result
}