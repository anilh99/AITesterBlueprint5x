const axios = require('axios');
const config = require('./config');

function jiraClient() {
  if (!config.jiraBaseUrl || !config.jiraEmail || !config.jiraToken) {
    throw new Error('Jira credentials are not configured.');
  }
  return axios.create({
    baseURL: config.jiraBaseUrl,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.jiraEmail}:${config.jiraToken}`).toString('base64')}`,
      Accept: 'application/json'
    },
    timeout: 15000
  });
}

async function testConnection() {
  const client = jiraClient();
  const { data } = await client.get('/rest/api/3/myself');
  return `Connected to Jira as ${data.displayName || data.emailAddress}`;
}

async function getIssue(issueId) {
  const client = jiraClient();
  const { data } = await client.get(`/rest/api/3/issue/${encodeURIComponent(issueId.trim())}`, {
    params: { fields: 'summary,description,issuetype,priority,status,components,labels,issuelinks,acceptancecriteria' }
  });
  const fields = data.fields || {};
  return {
    key: data.key,
    summary: fields.summary || '',
    description: fields.description?.content?.map((b) => b.content?.map((c) => c.text || '').join('')).filter(Boolean).join('\n') || '',
    acceptanceCriteria: fields.acceptancecriteria || '',
    issueType: fields.issuetype?.name || '',
    priority: fields.priority?.name || '',
    status: fields.status?.name || '',
    components: (fields.components || []).map((item) => item.name),
    labels: fields.labels || [],
    linkedIssues: (fields.issuelinks || []).map((link) => link.outwardIssue?.key || link.inwardIssue?.key).filter(Boolean)
  };
}

module.exports = { testConnection, getIssue };
