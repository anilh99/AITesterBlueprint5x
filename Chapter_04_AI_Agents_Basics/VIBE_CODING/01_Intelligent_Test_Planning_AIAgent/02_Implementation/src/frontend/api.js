export async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Could not reach the application API. Check that the backend is running and the deployment is ready.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  let result;
  if (isJson) {
    try {
      result = await response.json();
    } catch {
      throw new Error(`The application API returned invalid JSON (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    if (typeof result?.error === 'string' && result.error) throw new Error(result.error);
    if (!isJson) {
      throw new Error(`The application API returned HTTP ${response.status} with a non-JSON response. Check the Vercel function route and deployment logs.`);
    }
    throw new Error(`The application API returned HTTP ${response.status}.`);
  }

  if (!isJson) {
    throw new Error(`The application API returned a non-JSON response (HTTP ${response.status}). Verify the deployment includes the API.`);
  }
  return result;
}
