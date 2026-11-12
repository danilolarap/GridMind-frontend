import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDailyData, normalizeForecast, normalizeComparison, normalizeLiveReading, weeklyData } from '../src/services/analytics.ts';

test('daily analytics reject invalid envelopes and records, coerce numeric strings, and sort by date', () => {
  assert.deepEqual(normalizeDailyData({ error: 'unavailable' }), []);
  assert.deepEqual(normalizeDailyData([null, { date: 'invalid', totalKwh: 1 },
    { date: '2026-11-12', totalKwh: '2.5' }, { date: '2026-11-11', totalKwh: 1 },
    { date: '2026-11-10', totalKwh: null }, { date: '2026-11-09', totalKwh: 'Infinity' }]),
    [{ date: '2026-11-11', totalKwh: 1 }, { date: '2026-11-12', totalKwh: 2.5 }]);
});

test('forecast distinguishes a real zero from absent or nonnumeric predictions', () => {
  assert.deepEqual(normalizeForecast({ predicted_next_30_days: '0' }), { predicted_next_30_days: 0 });
  for (const value of [null, {}, { predicted_next_30_days: '' }, { predicted_next_30_days: true }, { predicted_next_30_days: 'NaN' }]) {
    assert.equal(normalizeForecast(value), null);
  }
});

test('comparison requires both readings and normalizes values used by reports', () => {
  assert.equal(normalizeComparison({ status: 'SUCCESS', billKwh: 2 }), null);
  assert.deepEqual(normalizeComparison({ status: 'SUCCESS', billKwh: '12.5', measuredKwh: '10' }),
    { status: 'SUCCESS', billKwh: 12.5, measuredKwh: 10, advice: '' });
});

test('live readings reject unusable payloads and preserve valid device timestamps', () => {
  for (const value of [null, {}, { esp32Id: 'sensor', consumption: 'bad' }]) assert.equal(normalizeLiveReading(value), null);
  const reading = normalizeLiveReading({ esp32Id: 'sensor', consumption: '0.25', power: '30', timestamp: '2026-11-12T10:00:00Z' });
  assert.deepEqual(reading, { esp32Id: 'sensor', consumption: 0.25, power: 30, voltage: 0, current: 0, timestamp: '2026-11-12T10:00:00Z' });
});

test('weekly chart groups Monday through Sunday and crosses year boundaries', () => {
  assert.deepEqual(weeklyData([
    { date: '2026-01-05', totalKwh: 4 }, { date: '2025-12-31', totalKwh: 2 }, { date: '2026-01-04', totalKwh: 3 },
  ]), [{ date: '2025-12-29', totalKwh: 5 }, { date: '2026-01-05', totalKwh: 4 }]);
  assert.deepEqual(weeklyData([]), []);
});
