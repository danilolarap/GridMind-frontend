export interface DailyData { date: string; totalKwh: number; }
export interface Forecast { predicted_next_30_days: number; }
export interface Comparison { status: string; billKwh: number; measuredKwh: number; advice: string; }
export interface LiveReading { esp32Id: string; consumption: number; voltage: number; current: number; power: number; timestamp: string; }

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}
function numeric(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function normalizeDailyData(value: unknown): DailyData[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const data = record(item);
    const totalKwh = numeric(data.totalKwh);
    return typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && Number.isFinite(Date.parse(data.date)) && totalKwh !== null
      ? [{ date: data.date, totalKwh }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
}
export function normalizeForecast(value: unknown): Forecast | null {
  const predicted = numeric(record(value).predicted_next_30_days);
  return predicted === null ? null : { predicted_next_30_days: predicted };
}
export function normalizeComparison(value: unknown): Comparison | null {
  const data = record(value);
  const billKwh = numeric(data.billKwh);
  const measuredKwh = numeric(data.measuredKwh);
  if (typeof data.status !== 'string' || billKwh === null || measuredKwh === null) return null;
  return { status: data.status, billKwh, measuredKwh, advice: typeof data.advice === 'string' ? data.advice : '' };
}
export function normalizeLiveReading(value: unknown): LiveReading | null {
  const data = record(value);
  const consumption = numeric(data.consumption);
  if (typeof data.esp32Id !== 'string' || !data.esp32Id || consumption === null) return null;
  return {
    esp32Id: data.esp32Id, consumption,
    voltage: numeric(data.voltage) ?? 0, current: numeric(data.current) ?? 0, power: numeric(data.power) ?? 0,
    timestamp: typeof data.timestamp === 'string' && Number.isFinite(Date.parse(data.timestamp)) ? data.timestamp : new Date().toISOString(),
  };
}
export function weeklyData(daily: DailyData[]): DailyData[] {
  const weeks = new Map<string, number>();
  for (const reading of daily) {
    const date = new Date(`${reading.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const monday = date.toISOString().slice(0, 10);
    weeks.set(monday, (weeks.get(monday) ?? 0) + reading.totalKwh);
  }
  return Array.from(weeks, ([date, totalKwh]) => ({ date, totalKwh })).sort((a, b) => a.date.localeCompare(b.date));
}
