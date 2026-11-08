import Holidays from 'date-holidays'

const holidays = new Holidays('CO')

export function isHoliday(
  date: Date,
): boolean {
  return getHolidayName(date) !== null
}

export function getHolidayName(
  date: Date,
): string | null {
  const holidayList = holidays.getHolidays(
    date.getFullYear(),
  )

  const dateKey = formatDateKey(date)

  const holiday = holidayList.find(
    (item) =>
      item.date.substring(0, 10) === dateKey &&
      item.type === 'public',
  )

  return holiday?.name ?? null
}

function formatDateKey(
  date: Date,
): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}