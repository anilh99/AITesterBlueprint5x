const express = require('express');
const cors = require('cors');
const config = require('./config');
const jira = require('./jira');
const testCases = require('./test-cases');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/settings', (req, res) => {
  res.json({
    jiraUrl: config.jiraBaseUrl,
    jiraEmail: config.jiraEmail,
    jiraTokenSet: !!config.jiraToken,
    groqApiKeySet: !!config.groqApiKey
  });
});

app.post('/api/jira/validate', async (req, res) => {
  try {
    res.json({ ok: true, message: await jira.validate() });
  } catch (error) {
    const status = error.response?.status;
    res.json({
      ok: false,
      error: status === 401 ? 'Jira authentication failed.' :
        status === 403 ? 'Jira permission denied.' :
          error.message || 'Jira connection failed.'
    });
  }
});

app.post('/api/test-cases/generate', async (req, res) => {
  const issueId = req.body?.jiraIssueId;
  if (!issueId || typeof issueId !== 'string') {
    return res.status(400).json({ error: 'A valid Jira Issue ID is required.' });
  }

  try {
    const issue = await jira.getIssue(issueId);
    const content = await testCases.generate(issue);
    res.json({
      success: true,
      jiraIssueId: issue.key,
      data: issue,
      testCases: { status: 'generated', content }
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) return res.status(401).json({ error: 'Jira authentication failed.' });
    if (status === 403) return res.status(403).json({ error: 'Jira permission denied.' });
    if (status === 404) return res.status(404).json({ error: 'Jira issue not found.' });
    res.status(500).json({ error: error.message || 'Test case generation failed.' });
  }
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Backend running at http://localhost:${config.port}`);
  });
}

module.exports = app;
