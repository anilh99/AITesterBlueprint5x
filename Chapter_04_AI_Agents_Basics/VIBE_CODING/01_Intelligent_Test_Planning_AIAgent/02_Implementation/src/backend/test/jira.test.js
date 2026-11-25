import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import vercelApp from '../../server.js';
import { getPublicSettings } from '../app.js';
import { templatePath } from '../config.js';
import { getJiraIssue, isValidIssueKey, richTextToPlainText, testJiraConnection } from '../jira.js';
import { generateWithModel, listModels } from '../ai.js';

test('exports the Express app from the Vercel entry point without opening a server', () => {
  assert.equal(typeof vercelApp, 'function');
  assert.equal(typeof vercelApp.listen, 'function');
});

test('marks deployment settings read-only on Vercel', () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    assert.equal(getPublicSettings().editable, false);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test('serves the health route and rejects persistent settings in Vercel mode', async () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  const server = createServer(vercelApp);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });

    const update = await fetch(`http://127.0.0.1:${port}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jira: {} }),
    });
    assert.equal(update.status, 409);
    assert.match((await update.json()).error, /project environment variables/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test('includes the supplied test-plan template for serverless deployments', async () => {
  const template = await fs.readFile(templatePath, 'utf8');
  for (const section of ['## 1. Scope & Objectives', '## 2. Gaps & Questions for the author', '## 3. Test Scenarios', '## 8. Timelines, Sprint Details', '## HUMAN REVIEW GATE']) {
    assert.ok(template.includes(section), `Missing template section: ${section}`);
  }
});

test('accepts a Jira project key and positive issue number', () => {
  assert.equal(isValidIssueKey('QA-123'), true);
  assert.equal(isValidIssueKey('team_2-7'), true);
});

test('rejects malformed or unsafe Jira issue keys', () => {
  for (const value of ['', 'QA', '-123', 'QA-0', 'QA-12/issue', 'QA-123?fields=*']) {
    assert.equal(isValidIssueKey(value), false, value);
  }
});

test('extracts plain text from Jira rich-text documents', () => {
  const document = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Requirement one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Requirement two' }] },
    ],
  };
  assert.equal(richTextToPlainText(document), 'Requirement one\nRequirement two');
});

test('retrieves Jira issue fields and acceptance criteria with mocked Jira responses', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    if (calls.length === 1) {
      return Response.json([{ id: 'customfield_10', name: 'Acceptance Criteria' }]);
    }
    return Response.json({
      key: 'QA-123',
      fields: {
        summary: 'Example story',
        description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'As a user' }] }] },
        customfield_10: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Given a user' }] }] },
        issuetype: { name: 'Story' },
        project: { name: 'Quality' },
        status: { name: 'Open' },
        priority: { name: 'High' },
        labels: ['login'],
        components: [{ name: 'Authentication' }],
      },
    });
  };
  try {
    const result = await getJiraIssue({
      jira: { baseUrl: 'https://jira.example.test', email: 'qa@example.test', token: 'test-secret' },
    }, 'QA-123');
    assert.equal(result.key, 'QA-123');
    assert.equal(result.description, 'As a user');
    assert.deepEqual(result.acceptanceCriteria, ['Given a user']);
    assert.equal(result.priority, 'High');
    assert.equal(calls.length, 2);
    assert.match(calls[1].searchParams.get('fields'), /customfield_10/);
    assert.equal(calls[1].pathname, '/rest/api/3/issue/QA-123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('tests Jira connection through the current-user endpoint with mocked response', async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl;
  globalThis.fetch = async (url) => {
    calledUrl = new URL(url);
    return Response.json({ accountId: 'mock-account' });
  };
  try {
    const message = await testJiraConnection({
      jira: { baseUrl: 'https://jira.example.test', email: 'qa@example.test', token: 'test-secret' },
    });
    assert.equal(message, 'Jira connection succeeded.');
    assert.equal(calledUrl.pathname, '/rest/api/3/myself');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('lists local models and generates a deterministic Ollama request using mocks', async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.OLLAMA_BASE_URL;
  process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: new URL(url), options });
    if (calls.length === 1) return Response.json({ models: [{ name: 'mock-qa-model' }] });
    return Response.json({ message: { content: '# Draft test plan' } });
  };
  try {
    const settings = { ai: { provider: 'ollama', model: 'mock-qa-model' } };
    const available = await listModels(settings);
    assert.deepEqual(available.models, ['mock-qa-model']);
    const plan = await generateWithModel(settings, { key: 'QA-123' }, '# Template');
    assert.equal(plan, '# Draft test plan');
    const payload = JSON.parse(calls[1].options.body);
    assert.equal(payload.options.temperature, 0);
    assert.equal(payload.messages[1].content.includes('# Template'), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.OLLAMA_BASE_URL;
    else process.env.OLLAMA_BASE_URL = originalBase;
  }
});
