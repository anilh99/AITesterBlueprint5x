const axios = require('axios');
const { getConfig } = require('./config');

function client(overrides) {
  const { jiraEmail, jiraToken, jiraUrl } = getConfig(overrides);
  if (!jiraEmail || !jiraToken || !jiraUrl) {
    throw new Error('Jira credentials not configured. Open Settings to add them.');
  }
  return {
    jiraUrl,
    headers: {
      Authorization: `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
      Accept: 'application/json',
    },
  };
}

function explain(error) {
  const status = error.response?.status;
  if (status === 401) return 'Jira authentication failed (check email and API token)';
  if (status === 403) return 'Jira permission denied';
  if (status === 404) return 'Jira issue or URL not found';
  return error.message;
}

async function getIssue(issueKey, overrides) {
  const { jiraUrl, headers } = client(overrides);
  try {
    const { data } = await axios.get(
      `${jiraUrl}/rest/api/3/issue/${encodeURIComponent(issueKey.trim())}`,
      { headers, timeout: 15000 }
    );
    return {
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description?.content?.[0]?.content?.[0]?.text || '',
      issueType: data.fields.issuetype?.name || '',
      priority: data.fields.priority?.name || '',
      labels: data.fields.labels || [],
    };
  } catch (error) {
    throw new Error(`Failed to retrieve Jira issue: ${explain(error)}`);
  }
}

async function testConnection(overrides) {
  const { jiraUrl, headers } = client(overrides);
  try {
    const { data } = await axios.get(`${jiraUrl}/rest/api/3/myself`, { headers, timeout: 15000 });
    return `Connected to Jira as ${data.displayName || data.emailAddress}`;
  } catch (error) {
    throw new Error(explain(error));
  }
}

module.exports = { getIssue, testConnection };
