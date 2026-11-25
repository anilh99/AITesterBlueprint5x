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

function textFromAdf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textFromAdf).filter(Boolean).join('\n');
  if (value.text) return value.text;
  return textFromAdf(value.content);
}

function findAcceptanceCriteria(fields) {
  for (const [name, value] of Object.entries(fields)) {
    if (/acceptance.?criteria/i.test(name) && value) return textFromAdf(value);
  }
  return '';
}

async function validate() {
  const { data } = await jiraClient().get('/rest/api/3/myself');
  return `Connected to Jira as ${data.displayName || data.emailAddress}`;
}

async function getIssue(issueId) {
  const { data } = await jiraClient().get(
    `/rest/api/3/issue/${encodeURIComponent(issueId.trim())}`
  );
  const fields = data.fields || {};
  return {
    key: data.key,
    summary: fields.summary || '',
    description: textFromAdf(fields.description),
    acceptanceCriteria: findAcceptanceCriteria(fields),
    issueType: fields.issuetype?.name || '',
    priority: fields.priority?.name || '',
    status: fields.status?.name || '',
    components: (fields.components || []).map((item) => item.name),
    labels: fields.labels || []
  };
}

module.exports = { validate, getIssue };
