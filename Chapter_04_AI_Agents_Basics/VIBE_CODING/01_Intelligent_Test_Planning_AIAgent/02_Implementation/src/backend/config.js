const fs = require('fs');
const path = require('path');

// Walk up from this folder and parse the first .env found (KEY=VALUE lines)
function loadEnvFile() {
  let dir = __dirname;
  while (true) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) {
      const env = {};
      fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
      });
      return env;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return {};
    dir = parent;
  }
}

const env = { ...loadEnvFile(), ...process.env };
// Serverless deployments do not have persistent writable files.
// Per-request settings override environment variables and are never stored by the server.
function getConfig(overrides = {}) {
  const s = overrides && typeof overrides === 'object' ? overrides : {};
  return {
    jiraEmail: s.jiraEmail || env.JIRA_EMAIL || '',
    jiraToken: s.jiraToken || env.JIRA_TOKEN || '',
    jiraUrl: (s.jiraUrl || env.JIRA_BASE_URL || env.JIRA_URL || '').replace(/\/+$/, ''),
    llmProvider: s.llmProvider || env.LLM_PROVIDER || 'groq',
    ollamaUrl: (s.ollamaUrl || env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, ''),
    groqApiKey: s.groqApiKey || env.GROQ_API_KEY || '',
  };
}

function saveSettings(updates) {
  return getConfig(updates);
}

module.exports = { getConfig, saveSettings, port: env.PORT || 3000 };
