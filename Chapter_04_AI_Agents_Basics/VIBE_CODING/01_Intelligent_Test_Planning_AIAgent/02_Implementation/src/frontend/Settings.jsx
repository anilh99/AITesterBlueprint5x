import { useEffect, useState } from 'react';
import { getSettings, testJira, testLLM } from './api';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    getSettings()
      .then(setForm)
      .catch((e) => setResults({ load: { ok: false, message: e.message } }));
  }, []);

  if (!form) return <div className="empty">{results.load?.message || 'Loading...'}</div>;

  async function run(name, test) {
    setBusy(name);
    try {
      const result = await test(form);
      setResults((r) => ({ ...r, [name]: result }));
      setForm(await getSettings());
    } catch (e) {
      setResults((r) => ({ ...r, [name]: { ok: false, message: e.message } }));
    }
    setBusy('');
  }

  const Result = ({ name }) =>
    results[name] ? (
      <div className={results[name].ok ? 'success' : 'error'}>{results[name].message}</div>
    ) : null;

  return (
    <div className="settings">
      <section className="card">
        <h2>JIRA Connection</h2>
        <p>URL: {form.jiraUrl || 'Not configured'}</p>
        <p>Email: {form.jiraEmail || 'Not configured'}</p>
        <p>Token: {form.jiraTokenSet ? 'Configured' : 'Not configured'}</p>
        <button disabled={!!busy} onClick={() => run('jira', testJira)}>
          {busy === 'jira' ? 'Testing...' : 'Test Connection'}
        </button>
        <Result name="jira" />
      </section>

      <section className="card">
        <h2>LLM Configuration</h2>
        <p>Provider: {form.llmProvider === 'ollama' ? 'Ollama' : 'Groq.com'}</p>
        <p>Groq API key: {form.groqApiKeySet ? 'Configured' : 'Not configured'}</p>
        <button disabled={!!busy} onClick={() => run('llm', testLLM)}>
          {busy === 'llm' ? 'Testing...' : 'Test Groq.com'}
        </button>
        <Result name="llm" />
      </section>
    </div>
  );
}
