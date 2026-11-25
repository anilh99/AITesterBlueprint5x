const express = require('express');
const cors = require('cors');
const { getIssue, testConnection } = require('./jira');
const { testLLM } = require('./llm');
const { generateTestPlan } = require('./template');
const { getConfig, saveSettings, port } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Secrets are never sent to the browser; only whether they are set
app.get('/api/settings', (req, res) => {
  const c = getConfig();
  res.json({
    jiraUrl: c.jiraUrl,
    jiraEmail: c.jiraEmail,
    jiraTokenSet: !!c.jiraToken,
    llmProvider: c.llmProvider,
    ollamaUrl: c.ollamaUrl,
    groqApiKeySet: !!c.groqApiKey,
  });
});

app.put('/api/settings', (req, res) => {
  const { jiraUrl, jiraEmail, jiraToken, llmProvider, ollamaUrl, groqApiKey } = req.body || {};
  const updates = {};
  if (typeof jiraUrl === 'string') updates.jiraUrl = jiraUrl.trim();
  if (typeof jiraEmail === 'string') updates.jiraEmail = jiraEmail.trim();
  if (jiraToken) updates.jiraToken = jiraToken.trim();
  if (['ollama', 'groq'].includes(llmProvider)) updates.llmProvider = llmProvider;
  if (typeof ollamaUrl === 'string') updates.ollamaUrl = ollamaUrl.trim();
  if (groqApiKey) updates.groqApiKey = groqApiKey.trim();
  saveSettings(updates);
  res.json({ success: true });
});

const testRoute = (fn) => async (req, res) => {
  try {
    res.json({ ok: true, message: await fn() });
  } catch (error) {
    res.json({ ok: false, message: error.message });
  }
};
app.post('/api/settings/test-jira', testRoute(testConnection));
app.post('/api/settings/test-llm', testRoute(testLLM));

app.post('/api/generate-plan', async (req, res) => {
  try {
    const { issueId } = req.body;
    
    if (!issueId || typeof issueId !== 'string') {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    const issue = await getIssue(issueId);
    const testPlan = generateTestPlan(issue);
    
    res.json({
      success: true,
      issueKey: issue.key,
      testPlan,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Failed to generate test plan',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
