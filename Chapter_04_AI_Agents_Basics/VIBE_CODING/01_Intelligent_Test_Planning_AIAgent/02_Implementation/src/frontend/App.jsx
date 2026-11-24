import { useEffect, useState } from 'react';

const EMPTY_SETTINGS = {
  jira: { baseUrl: '', email: '', tokenConfigured: false },
  ai: { provider: '', model: '', configured: false },
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

function App() {
  const [page, setPage] = useState('plan');
  const [issueKey, setIssueKey] = useState('');
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [jiraForm, setJiraForm] = useState({ baseUrl: '', email: '', token: '' });
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsBusy, setSettingsBusy] = useState(false);

  useEffect(() => {
    requestJson('/api/settings')
      .then((data) => {
        setSettings(data);
        setJiraForm({
          baseUrl: data.jira.baseUrl || '',
          email: data.jira.email || '',
          token: '',
        });
        setProvider(data.ai.provider || '');
        setModel(data.ai.model || '');
      })
      .catch((error) => setPlanError(error.message));
  }, []);

  async function generatePlan(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setPlanError('');
    setPlan(null);
    try {
      const result = await requestJson('/api/plan', {
        method: 'POST',
        body: JSON.stringify({ issueKey }),
      });
      setPlan(result);
    } catch (error) {
      setPlanError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveJira(event) {
    event.preventDefault();
    setSettingsBusy(true);
    setSettingsMessage('');
    setSettingsError('');
    try {
      const result = await requestJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ jira: jiraForm }),
      });
      setSettings(result);
      setJiraForm((current) => ({ ...current, token: '' }));
      setSettingsMessage('Jira settings saved in backend memory for this run.');
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function testJira() {
    setSettingsBusy(true);
    setSettingsMessage('');
    setSettingsError('');
    try {
      await requestJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ jira: jiraForm }),
      });
      const result = await requestJson('/api/jira/test', { method: 'POST', body: '{}' });
      setSettings(result.settings);
      setJiraForm((current) => ({ ...current, token: '' }));
      setSettingsMessage(result.message);
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function testProvider() {
    setSettingsBusy(true);
    setSettingsMessage('');
    setSettingsError('');
    setModels([]);
    try {
      const result = await requestJson('/api/ai/models', {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey }),
      });
      setModels(result.models);
      setModel((current) => result.models.includes(current) ? current : (result.models[0] || ''));
      setSettingsMessage(result.message);
      setApiKey('');
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function saveAi() {
    setSettingsBusy(true);
    setSettingsMessage('');
    setSettingsError('');
    try {
      const result = await requestJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ ai: { provider, model, apiKey } }),
      });
      setSettings(result);
      setApiKey('');
      setSettingsMessage('AI settings saved in backend memory for this run.');
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSettingsBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setPage('plan')}>
          <span className="brand-mark">T</span>
          <span>TestPlan<span className="brand-light">Agent</span></span>
        </a>
        <div className="nav-actions">
          <button className={`nav-link ${page === 'plan' ? 'active' : ''}`} onClick={() => setPage('plan')}>Planner</button>
          <button className={`nav-link ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>Settings</button>
          <span className="avatar">QA</span>
        </div>
      </header>

      {page === 'plan' ? (
        <section className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">JIRA · TEST PLANNING</p>
              <h1>Turn a Jira issue into a<br /><span>clear test plan.</span></h1>
              <p className="subheading">Grounded in the issue details. Ready for your review.</p>
            </div>
            <div className="status-pill"><span className="status-dot" /> Drafts require review</div>
          </div>

          <div className="workspace">
            <section className="card prompt-card">
              <div className="card-heading">
                <div className="icon-tile purple">↳</div>
                <div><h2>Start with a Jira issue</h2><p>Enter an issue key to retrieve its requirements.</p></div>
              </div>
              <form onSubmit={generatePlan}>
                <label htmlFor="issue-key">Jira issue key</label>
                <div className="issue-input">
                  <span className="jira-symbol">◆</span>
                  <input id="issue-key" value={issueKey} onChange={(event) => setIssueKey(event.target.value)} placeholder="e.g. QA-123" autoComplete="off" />
                  <button className="primary-button" disabled={loading || !issueKey.trim()}>{loading ? <><span className="spinner" /> Working</> : 'Generate plan'}<span aria-hidden="true">→</span></button>
                </div>
              </form>
              <div className="privacy-note"><span>◇</span> Jira is read-only. Secrets stay on the backend.</div>
            </section>

            <section className="card result-card">
              <div className="result-header">
                <div><div className="card-heading compact"><div className="icon-tile mint">✓</div><div><h2>Test plan</h2><p>{plan ? `${plan.issue.key} · ${plan.issue.summary}` : 'Your generated plan will appear here.'}</p></div></div></div>
                {plan && <span className="draft-badge">DRAFT</span>}
              </div>
              {loading ? (
                <div className="empty-state"><span className="large-spinner" /><h3>Building your test plan</h3><p>Retrieving Jira details and drafting against the supplied template…</p></div>
              ) : planError ? (
                <div className="message error-message" role="alert"><strong>Couldn’t generate the plan</strong><span>{planError}</span><button className="text-button" onClick={() => setPage('settings')}>Check settings →</button></div>
              ) : plan ? (
                <div className="plan-output"><div className="source-reference">Source issue <strong>{plan.issue.key}</strong></div><pre>{plan.plan}</pre></div>
              ) : (
                <div className="empty-state"><div className="empty-illustration"><span>✦</span><span>↗</span><span>✓</span></div><h3>Nothing here yet</h3><p>Enter a Jira issue above and we’ll prepare a traceable test plan.</p></div>
              )}
            </section>
          </div>
          <footer className="page-footer"><span>Built for thoughtful quality engineering</span><span>Human review required · No Jira changes are made</span></footer>
        </section>
      ) : (
        <section className="page settings-page">
          <div className="page-heading settings-heading">
            <div><p className="eyebrow">PREFERENCES</p><h1>Connection <span>settings.</span></h1><p className="subheading">Configure Jira and the language model used for drafts.</p></div>
            <div className="status-pill"><span className="status-dot" /> Credentials remain server-side</div>
          </div>

          <div className="settings-grid">
            <section className="card settings-card">
              <div className="section-title"><div className="icon-tile blue">◈</div><div><h2>Jira connection</h2><p>{settings.jira.configured ? 'Server-side Jira credentials are configured.' : 'Read access to issues in your workspace.'}</p></div></div>
              <form onSubmit={saveJira} className="settings-form">
                <label htmlFor="jira-url">Jira URL</label><input id="jira-url" type="url" placeholder="https://your-team.atlassian.net" value={jiraForm.baseUrl} onChange={(e) => setJiraForm({...jiraForm,baseUrl:e.target.value})} />
                <label htmlFor="jira-email">Email</label><input id="jira-email" type="email" placeholder="you@company.com" value={jiraForm.email} onChange={(e) => setJiraForm({...jiraForm,email:e.target.value})} />
                <label htmlFor="jira-token">API token</label><input id="jira-token" type="password" autoComplete="new-password" placeholder={settings.jira.tokenConfigured ? 'Configured on backend · leave blank to keep' : 'Enter Jira API token'} value={jiraForm.token} onChange={(e) => setJiraForm({...jiraForm,token:e.target.value})} />
                <div className="button-row"><button type="submit" className="secondary-button" disabled={settingsBusy}>Save settings</button><button type="button" className="primary-button" onClick={testJira} disabled={settingsBusy}>Test connection <span>→</span></button></div>
              </form>
              <p className="helper-text">Credentials are held in backend memory only and clear when the server restarts.</p>
            </section>

            <section className="card settings-card">
              <div className="section-title"><div className="icon-tile lavender">✳</div><div><h2>Language model</h2><p>{settings.ai.configured ? `${settings.ai.provider} model is configured.` : 'Choose the provider for test plan drafts.'}</p></div></div>
              <div className="provider-list">
                <label className={`provider-option ${provider === 'ollama' ? 'selected' : ''}`}><input type="radio" name="provider" value="ollama" checked={provider === 'ollama'} onChange={() => {setProvider('ollama');setModels([]);setModel('');}} /><span className="provider-icon ollama-icon">◉</span><span><strong>Ollama</strong><small>Local connection</small></span><span className="radio-mark" /></label>
                <label className={`provider-option ${provider === 'groq' ? 'selected' : ''}`}><input type="radio" name="provider" value="groq" checked={provider === 'groq'} onChange={() => {setProvider('groq');setModels([]);setModel('');}} /><span className="provider-icon groq-icon">ϟ</span><span><strong>Groq</strong><small>Cloud API</small></span><span className="radio-mark" /></label>
              </div>
              {provider === 'groq' && <div className="provider-secret"><label htmlFor="groq-key">Groq API key</label><input id="groq-key" type="password" autoComplete="new-password" placeholder="Enter Groq API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></div>}
              <div className="model-row">
                <label htmlFor="model-select">Model</label>
                <select id="model-select" value={model} onChange={(e) => setModel(e.target.value)} disabled={!models.length}>
                  <option value="">{models.length ? 'Select an available model' : 'Test connection to load models'}</option>
                  {models.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="button-row ai-buttons"><button className="secondary-button" onClick={testProvider} disabled={settingsBusy || !provider}>Test {provider === 'groq' ? 'Groq' : 'local LLM'}</button><button className="primary-button" onClick={saveAi} disabled={settingsBusy || !provider}>Save model <span>→</span></button></div>
              {provider === 'ollama' && <p className="helper-text">Set <code>OLLAMA_BASE_URL</code> in the repository `.env` file.</p>}
            </section>
          </div>
          {settingsMessage && <div className="message success-message" role="status">{settingsMessage}</div>}
          {settingsError && <div className="message error-message compact-error" role="alert">{settingsError}</div>}
          <footer className="page-footer"><span>Only connection metadata is shown here.</span><span>Changes made in settings are temporary for this server run.</span></footer>
        </section>
      )}
    </main>
  );
}

export default App;
