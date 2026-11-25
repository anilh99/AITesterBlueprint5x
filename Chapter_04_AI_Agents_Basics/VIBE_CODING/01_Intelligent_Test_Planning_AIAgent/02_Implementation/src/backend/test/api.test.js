import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../../frontend/api.js';

test('preserves readable Jira API errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'Jira authentication failed.' }, { status: 502 });
  try {
    await assert.rejects(requestJson('/api/jira/test'), /Jira authentication failed\./);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('identifies non-JSON deployment errors by HTTP status', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>Not found</html>', {
    status: 404,
    headers: { 'Content-Type': 'text/html' },
  });
  try {
    await assert.rejects(requestJson('/api/jira/test'), /HTTP 404 with a non-JSON response.*Vercel function route/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('reports when the application API cannot be reached', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError('network failure'); };
  try {
    await assert.rejects(requestJson('/api/jira/test'), /Could not reach the application API/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
