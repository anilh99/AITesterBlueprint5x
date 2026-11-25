export async function generateTestPlan(issueId) {
  const response = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate test plan');
  }

  return response.json();
}

async function request(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export const getSettings = () => request('/api/settings', 'GET');
export const saveSettings = (settings) => request('/api/settings', 'PUT', settings);
export const testJira = () => request('/api/settings/test-jira', 'POST');
export const testLLM = () => request('/api/settings/test-llm', 'POST');
