// Dates are shown as DD.MM.YYYY HH:MM in local time regardless of interface language (spec 4.3.2).
const pad = (value: number): string => String(value).padStart(2, '0')

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${formatTime(date)}`
}

export function formatDayMonth(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`
}

export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
