// ===================================================================
// DATE UTILITIES - WORKING DAYS (vereinfachte Version)
// ===================================================================

const STATIC_HOLIDAYS = [
  '01-01', '05-01', '10-03', '12-25', '12-26'
]

function fmt(date: Date): string { return date.toISOString().slice(0, 10) }

export function isWorkingDay(date: Date): boolean {
  const d = date.getDay()
  if (d === 0 || d === 6) return false
  const mmdd = fmt(date).slice(5)
  return !STATIC_HOLIDAYS.includes(mmdd)
}

export function calculateWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate)
  if (workingDays === 0) {
    while (!isWorkingDay(result)) result.setDate(result.getDate() + 1)
    return result
  }
  const dir = workingDays >= 0 ? 1 : -1
  let remaining = Math.abs(workingDays)
  while (remaining > 0) {
    result.setDate(result.getDate() + dir)
    if (isWorkingDay(result)) remaining--
  }
  return result
}

export function getNextWorkingDay(date: Date): Date {
  return calculateWorkingDays(date, 1)
}

export function getPreviousWorkingDay(date: Date): Date {
  return calculateWorkingDays(date, -1)
}

export function formatDurationHours(hours: number): string {
  if (hours < 24) return `${Math.round(hours)} Std.`
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  if (rest === 0) return `${days} Tag${days > 1 ? 'e' : ''}`
  return `${days}d ${Math.round(rest)}h`
}



