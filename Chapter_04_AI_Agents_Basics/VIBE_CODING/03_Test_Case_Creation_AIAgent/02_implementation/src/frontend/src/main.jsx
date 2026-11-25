import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function App() {
  const [page, setPage] = useState('main');
  return (
    <main className="shell">
      <nav>
        <button className={page === 'main' ? 'active' : ''} onClick={() => setPage('main')}>Main</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
      </nav>
      {page === 'main' ? <MainPage /> : <SettingsPage />}
    </main>
  );
}

function MainPage() {
  const [issueId, setIssueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function generate() {
    if (!issueId.trim()) {
      setError('Enter a Jira Issue ID.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-cases/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jiraIssueId: issueId.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Test case generation failed.');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result.testCases.content);
  }

  function download() {
    const blob = new Blob([result.testCases.content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${issueId.trim()}-test-cases.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section>
      <h1>AI Jira Test Case Generator</h1>
      <div className="row">
        <input
          value={issueId}
          onChange={(e) => setIssueId(e.target.value)}
          placeholder="Jira Issue ID, for example KAN-4"
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />
        <button onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Test Cases'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {result && (
        <article>
          <div className="actions">
            <button onClick={copy}>Copy</button>
            <button onClick={download}>Download</button>
          </div>
          <pre>{result.testCases.content}</pre>
        </article>
      )}
    </section>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/settings`)
      .then((response) => response.json())
      .then(setSettings)
      .catch(() => setMessage('Could not load settings.'));
  }, []);

  async function testJira() {
    setMessage('');
    const response = await fetch(`${API_BASE_URL}/api/jira/validate`, { method: 'POST' });
    const data = await response.json();
    setMessage(data.ok ? data.message : data.error || 'Jira connection failed.');
  }

  if (!settings) return <p className="muted">{message || 'Loading...'}</p>;

  return (
    <section>
      <h1>Settings</h1>
      <div className="grid">
        <div className="card">
          <h2>JIRA Connection</h2>
          <p>URL: {settings.jiraUrl || 'Not configured'}</p>
          <p>Email: {settings.jiraEmail || 'Not configured'}</p>
          <p>Token: {settings.jiraTokenSet ? 'Configured' : 'Not configured'}</p>
          <button onClick={testJira}>Test Connection</button>
        </div>
        <div className="card">
          <h2>LLM Configuration</h2>
          <p>Groq API key: {settings.groqApiKeySet ? 'Configured' : 'Not configured'}</p>
          <p>Template: Test case template loaded from project</p>
        </div>
      </div>
      {message && <p className={message.startsWith('Connected') ? 'success' : 'error'}>{message}</p>}
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
