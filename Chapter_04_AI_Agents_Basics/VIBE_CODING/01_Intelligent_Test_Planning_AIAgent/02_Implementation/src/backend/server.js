import express from 'express';
import fs from 'node:fs/promises';
import { templatePath } from './config.js';
import { getJiraIssue, isValidIssueKey, testJiraConnection } from './jira.js';
import { generateWithModel, listModels } from './ai.js';

const app = express();
const port = Number(process.env.PORT) || 3001;
const settings = {
  jira: {
    baseUrl: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL || '',
    token: process.env.JIRA_API_TOKEN || '',
  },
  ai: {
    provider: process.env.AI_PROVIDER || '',
    model: process.env.AI_PROVIDER === 'ollama' ? process.env.OLLAMA_MODEL || '' : process.env.GROQ_MODEL || '',
    apiKey: process.env.GROQ_API_KEY || '',
  },
};

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

function publicSettings() {
  return {
    jira: {
      configured: Boolean(settings.jira.baseUrl && settings.jira.email && settings.jira.token),
      tokenConfigured: Boolean(settings.jira.token),
    },
    ai: {
      provider: settings.ai.provider,
      model: settings.ai.model,
      configured: Boolean(settings.ai.provider && settings.ai.model),
    },
  };
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.get('/api/settings', (_request, response) => response.json(publicSettings()));

app.put('/api/settings', (request, response) => {
  const { jira, ai } = request.body || {};
  if (jira !== undefined) {
    if (!jira || typeof jira !== 'object' || Array.isArray(jira)) return response.status(400).json({ error: 'Jira settings must be an object.' });
    const baseUrl = typeof jira.baseUrl === 'string' && jira.baseUrl.trim() ? jira.baseUrl.trim() : settings.jira.baseUrl;
    const email = typeof jira.email === 'string' && jira.email.trim() ? jira.email.trim() : settings.jira.email;
    const token = typeof jira.token === 'string' && jira.token ? jira.token : settings.jira.token;
    if (baseUrl) {
      try {
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
      } catch {
        return response.status(400).json({ error: 'Enter a valid Jira base URL using HTTP or HTTPS, without embedded credentials.' });
      }
    }
    if (email && email.length > 254) return response.status(400).json({ error: 'The Jira email is too long.' });
    if (token.length > 4096) return response.status(400).json({ error: 'The Jira token is too long.' });
    settings.jira = { baseUrl, email, token };
  }
  if (ai !== undefined) {
    if (!ai || typeof ai !== 'object' || Array.isArray(ai)) return response.status(400).json({ error: 'AI settings must be an object.' });
    const provider = typeof ai.provider === 'string' ? ai.provider : settings.ai.provider;
    if (provider && !['ollama', 'groq'].includes(provider)) return response.status(400).json({ error: 'Select Ollama or Groq.' });
    const model = typeof ai.model === 'string' ? ai.model.trim() : settings.ai.model;
    const apiKey = typeof ai.apiKey === 'string' && ai.apiKey ? ai.apiKey : settings.ai.apiKey;
    if (model.length > 200 || apiKey.length > 4096) return response.status(400).json({ error: 'AI settings exceed the supported length.' });
    settings.ai = { provider, model, apiKey };
  }
  response.json(publicSettings());
});

app.post('/api/jira/test', async (_request, response) => {
  try {
    const message = await testJiraConnection(settings);
    response.json({ message, settings: publicSettings() });
  } catch (error) {
    response.status(502).json({ error: error.message || 'Jira connection failed.' });
  }
});

app.post('/api/ai/models', async (request, response) => {
  try {
    const result = await listModels(settings, request.body || {});
    response.json({ ...result, message: `${result.provider === 'groq' ? 'Groq' : 'Ollama'} connection succeeded.` });
  } catch (error) {
    response.status(502).json({ error: error.message || 'AI provider connection failed.' });
  }
});

app.post('/api/plan', async (request, response) => {
  const issueKey = typeof request.body?.issueKey === 'string' ? request.body.issueKey.trim().toUpperCase() : '';
  if (!isValidIssueKey(issueKey)) return response.status(400).json({ error: 'Enter a Jira issue key in the form PROJECT-123.' });
  try {
    const [issue, template] = await Promise.all([
      getJiraIssue(settings, issueKey),
      fs.readFile(templatePath, 'utf8'),
    ]);
    const plan = await generateWithModel(settings, issue, template);
    response.json({ issue: { key: issue.key, summary: issue.summary }, plan });
  } catch (error) {
    const message = error.message || 'Test plan generation failed.';
    const status = /not fully configured|configure a|choose ollama|not configured|invalid/i.test(message) ? 400 : 502;
    response.status(status).json({ error: message });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) return response.status(400).json({ error: 'Request body must be valid JSON.' });
  response.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Backend ready on http://127.0.0.1:${port}`);
});
