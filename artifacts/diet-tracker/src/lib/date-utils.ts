export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isFutureDate(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date > today;
}
