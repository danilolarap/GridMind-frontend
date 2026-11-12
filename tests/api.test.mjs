import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

let server;
let api;
let services;
const storage = new Map();
const calls = [];
before(async () => {
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  globalThis.window = { location: { href: '/' } };
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  services = await server.ssrLoadModule('/src/services/api.ts');
  api = services.default;
});
after(async () => { await server?.close(); });
beforeEach(() => {
  storage.clear();
  calls.length = 0;
  window.location.href = '/';
  api.defaults.adapter = async config => {
    calls.push(config);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
});

test('authenticated requests attach the stored JWT', async () => {
  storage.set('gridmind_token', 'test-token');
  await services.getDevices();
  assert.equal(calls[0].headers.Authorization, 'Bearer test-token');
});

test('login preserves the existing SHA-256 backend password contract', async () => {
  await services.loginUser('user@example.com', 'test-password');
  const payload = JSON.parse(calls[0].data);
  assert.equal(payload.password, createHash('sha256').update('test-password').digest('hex'));
  assert.equal(payload.email, 'user@example.com');
});

function rejectWithStatus(status) {
  api.defaults.adapter = async config => {
    throw { isAxiosError: true, config, response: { status, data: {} } };
  };
}

test('protected 401 responses clear the entire session and redirect to login', async () => {
  for (const key of ['gridmind_token', 'gridmind_email', 'gridmind_name']) storage.set(key, 'test');
  rejectWithStatus(401);
  await assert.rejects(services.getDevices());
  assert.equal(storage.size, 0);
  assert.equal(window.location.href, '/login');
});

test('forbidden responses preserve an authenticated session', async () => {
  storage.set('gridmind_token', 'test-token');
  rejectWithStatus(403);
  await assert.rejects(services.getDevices());
  assert.equal(storage.get('gridmind_token'), 'test-token');
  assert.equal(window.location.href, '/');
});

test('failed login never triggers the protected-route redirect', async () => {
  rejectWithStatus(401);
  await assert.rejects(services.loginUser('user@example.com', 'bad-password'));
  assert.equal(window.location.href, '/');
});
