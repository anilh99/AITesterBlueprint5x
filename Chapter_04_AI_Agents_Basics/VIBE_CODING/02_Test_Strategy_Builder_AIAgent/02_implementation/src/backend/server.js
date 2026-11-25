const express = require('express');
const cors = require('cors');
const config = require('./config');
const jira = require('./jira');
const strategy = require('./strategy');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/settings', (req, res) => {
  res.json({
    jiraUrl: config.jiraBaseUrl,
    jiraEmail: config.jiraEmail,
    jiraTokenSet: !!config.jiraToken,
    groqApiKeySet: !!config.groqApiKey
  });
});

app.post('/api/settings/test-jira', async (req, res) => {
  try {
    res.json({ ok: true, message: await jira.testConnection() });
  } catch (error) {
    res.json({ ok: false, error: error.response?.status === 401 ? 'Jira authentication failed.' : error.message });
  }
});

app.post('/api/strategy', async (req, res) => {
  const { jiraIssueId } = req.body || {};
  if (!jiraIssueId || typeof jiraIssueId !== 'string') {
    return res.status(400).json({ error: 'A valid Jira issue ID is required.' });
  }

  let issue;
  try {
    issue = await jira.getIssue(jiraIssueId);
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) return res.status(404).json({ error: 'Jira issue not found.' });
    if (status === 401) return res.status(401).json({ error: 'Jira authentication failed.' });
    return res.status(500).json({ error: error.message || 'Jira issue retrieval failed.' });
  }

  const content = await strategy.generate(issue);
  res.json({
    success: true,
    jiraIssueId: issue.key,
    data: issue,
    testStrategy: { status: 'generated', content }
  });
});

if (require.main === module) {
  app.listen(config.port, () => console.log(`Backend running at http://localhost:${config.port}`));
}

module.exports = app;
