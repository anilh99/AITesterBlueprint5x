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
const SETTINGS_FILE = path.join(__dirname, 'settings.local.json');

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Settings saved from the UI (server-side file) override .env values
function getConfig() {
  const s = readSettings();
  return {
    jiraEmail: s.jiraEmail ?? env.JIRA_EMAIL ?? '',
    jiraToken: s.jiraToken ?? env.JIRA_TOKEN ?? '',
    jiraUrl: (s.jiraUrl ?? env.JIRA_BASE_URL ?? env.JIRA_URL ?? '').replace(/\/+$/, ''),
    llmProvider: s.llmProvider || 'groq',
    ollamaUrl: (s.ollamaUrl ?? 'http://localhost:11434').replace(/\/+$/, ''),
    groqApiKey: s.groqApiKey ?? env.GROQ_API_KEY ?? '',
  };
}

function saveSettings(updates) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...readSettings(), ...updates }, null, 2));
}

module.exports = { getConfig, saveSettings, port: env.PORT || 3000 };
