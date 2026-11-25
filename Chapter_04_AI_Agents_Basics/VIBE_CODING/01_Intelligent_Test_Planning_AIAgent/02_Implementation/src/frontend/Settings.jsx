import { useEffect, useState } from 'react';
import { getSettings, saveSettings, testJira, testLLM } from './api';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [secrets, setSecrets] = useState({ jiraToken: '', groqApiKey: '' });
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    getSettings()
      .then(setForm)
      .catch((e) => setResults({ load: { ok: false, message: e.message } }));
  }, []);

  if (!form) return <div className="empty">{results.load?.message || 'Loading...'}</div>;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setSecret = (key) => (e) => setSecrets({ ...secrets, [key]: e.target.value });

  // Saves current values (blank secrets keep the stored ones), then runs the test
  async function run(name, test) {
    setBusy(name);
    try {
      const settings = { ...form, ...secrets };
      await saveSettings(settings);
      setSecrets({ jiraToken: '', groqApiKey: '' });
      const result = await test(settings);
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
        <label>URL<input value={form.jiraUrl} onChange={set('jiraUrl')} placeholder="https://your-domain.atlassian.net" /></label>
        <label>Email<input value={form.jiraEmail} onChange={set('jiraEmail')} /></label>
        <label>Token
          <input type="password" value={secrets.jiraToken} onChange={setSecret('jiraToken')}
            placeholder={form.jiraTokenSet ? 'Saved (leave blank to keep)' : 'API token'} />
        </label>
        <button disabled={!!busy} onClick={() => run('jira', testJira)}>
          {busy === 'jira' ? 'Testing...' : 'Test Connection'}
        </button>
        <Result name="jira" />
      </section>

      <section className="card">
        <h2>LLM Configuration</h2>
        <label className="radio">
          <input type="radio" checked={form.llmProvider === 'ollama'}
            onChange={() => setForm({ ...form, llmProvider: 'ollama' })} />
          Ollama Connection
        </label>
        <input value={form.ollamaUrl} onChange={set('ollamaUrl')} disabled={form.llmProvider !== 'ollama'}
          placeholder="http://localhost:11434" />
        <label className="radio">
          <input type="radio" checked={form.llmProvider === 'groq'}
            onChange={() => setForm({ ...form, llmProvider: 'groq' })} />
          <a href="https://groq.com" target="_blank" rel="noreferrer">Groq.com</a> (API key)
        </label>
        <input type="password" value={secrets.groqApiKey} onChange={setSecret('groqApiKey')}
          disabled={form.llmProvider !== 'groq'}
          placeholder={form.groqApiKeySet ? 'Saved (leave blank to keep)' : 'Groq API key'} />
        <button disabled={!!busy} onClick={() => run('llm', testLLM)}>
          {busy === 'llm' ? 'Testing...' : form.llmProvider === 'ollama' ? 'Test Local LLM' : 'Test Groq.com'}
        </button>
        <Result name="llm" />
      </section>
    </div>
  );
}
