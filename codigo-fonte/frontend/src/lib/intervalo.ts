/** 15 → "15 min", 60 → "1 h", 90 → "1 h 30 min" */
export function intervaloEmTexto(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  if (horas === 0) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}
