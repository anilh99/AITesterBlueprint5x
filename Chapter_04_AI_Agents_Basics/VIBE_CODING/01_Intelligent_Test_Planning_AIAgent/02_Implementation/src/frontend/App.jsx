import { useState } from 'react';
import { generateTestPlan } from './api';
import Settings from './Settings';
import './styles.css';

export default function App() {
  const [page, setPage] = useState('main');
  return (
    <div className="container">
      <nav>
        <button className={page === 'main' ? 'active' : ''} onClick={() => setPage('main')}>Main</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
      </nav>
      {page === 'main' ? <Main /> : <Settings />}
    </div>
  );
}

function Main() {
  const [issueId, setIssueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    if (!issueId.trim()) {
      setError('Please enter a Jira issue ID');
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const result = await generateTestPlan(issueId);
      setPlan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header>
        <h1>Test Plan Generator</h1>
        <p>Generate test plans from Jira issues</p>
      </header>

      <div className="input-section">
        <input
          type="text"
          value={issueId}
          onChange={(e) => setIssueId(e.target.value)}
          placeholder="Enter Jira issue ID (e.g., QA-123)"
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {plan && (
        <div className="plan-output">
          <h2>{plan.issueKey}</h2>
          <pre>{plan.testPlan}</pre>
          <button onClick={() => navigator.clipboard.writeText(plan.testPlan)}>
            Copy to Clipboard
          </button>
        </div>
      )}

      {!plan && !error && !loading && (
        <div className="empty">
          <p>Enter a Jira issue ID to generate a test plan</p>
        </div>
      )}
    </>
  );
}
