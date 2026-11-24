const FIELD_NAMES = ['summary', 'description', 'issuetype', 'project', 'priority', 'status', 'labels', 'components'];

export function isValidIssueKey(value) {
  return typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,49}-[1-9]\d{0,9}$/i.test(value.trim());
}

export function richTextToPlainText(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  const parts = [];
  if (Array.isArray(value.content)) {
    for (const item of value.content) {
      const text = richTextToPlainText(item);
      if (text) parts.push(text);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      const text = richTextToPlainText(item);
      if (text) parts.push(text);
    }
  }
  const joined = parts.join(['doc', 'paragraph', 'listItem'].includes(value.type) ? '\n' : ' ');
  return joined.replace(/[ \t]+\n/g, '\n').trim();
}

function configFor(settings) {
  const jira = settings.jira;
  const baseUrl = jira.baseUrl?.trim();
  const email = jira.email?.trim();
  const token = jira.token;
  if (!baseUrl || !email || !token) {
    throw new Error('Jira is not fully configured. Add the Jira URL, email, and API token in Settings or the repository .env file.');
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('The Jira URL is invalid. Enter the base URL for your Jira deployment.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('The Jira URL must use HTTP or HTTPS and must not contain credentials.');
  }
  const version = process.env.JIRA_API_VERSION === '2' ? '2' : '3';
  return { url, email, token, version };
}

async function jiraFetch(settings, path, options = {}) {
  const { url, email, token, version } = configFor(settings);
  const [resourcePath, query = ''] = path.split('?');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/rest/api/${version}${resourcePath}`;
  url.search = query;
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', ...options.headers },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('Jira did not respond in time.');
    throw new Error('Could not reach Jira. Check the URL and network connection.');
  }
  if (response.status === 401) throw new Error('Jira authentication failed. Check the configured email and API token.');
  if (response.status === 403) throw new Error('The Jira account does not have permission to access this resource.');
  if (response.status === 404) throw new Error('The Jira issue or endpoint was not found. Check the issue key and Jira URL.');
  if (response.status === 429) throw new Error('Jira rate limited the request. Try again later.');
  if (!response.ok) throw new Error(`Jira returned an error (${response.status}).`);
  return response;
}

export async function testJiraConnection(settings) {
  const response = await jiraFetch(settings, '/myself');
  await response.json();
  return 'Jira connection succeeded.';
}

export async function getJiraIssue(settings, issueKey) {
  const { version } = configFor(settings);
  const fieldsResponse = await jiraFetch(settings, '/field');
  const allFields = await fieldsResponse.json();
  const acceptanceFields = Array.isArray(allFields)
    ? allFields.filter((field) => /acceptance criteria/i.test(field.name || '')).map((field) => field.id)
    : [];
  const requestedFields = [...FIELD_NAMES, ...acceptanceFields].join(',');
  const issueResponse = await jiraFetch(
    settings,
    `/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(requestedFields)}`,
  );
  const issue = await issueResponse.json();
  const fields = issue.fields || {};
  const acceptanceCriteria = acceptanceFields
    .map((fieldId) => richTextToPlainText(fields[fieldId]))
    .filter(Boolean);

  return {
    key: issue.key || issueKey,
    summary: fields.summary || '',
    description: richTextToPlainText(fields.description),
    acceptanceCriteria,
    issueType: fields.issuetype?.name || '',
    project: fields.project?.name || '',
    status: fields.status?.name || '',
    priority: fields.priority?.name || '',
    labels: Array.isArray(fields.labels) ? fields.labels : [],
    components: Array.isArray(fields.components) ? fields.components.map((item) => item.name).filter(Boolean) : [],
    apiVersion: version,
  };
}
