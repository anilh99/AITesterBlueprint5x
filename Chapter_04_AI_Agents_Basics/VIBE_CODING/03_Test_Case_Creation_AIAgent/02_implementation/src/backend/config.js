const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadParentEnv() {
  let dir = __dirname;
  for (let i = 0; i < 12; i++) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    dir = path.dirname(dir);
  }
}

loadParentEnv();

module.exports = {
  jiraBaseUrl: (process.env.JIRA_BASE_URL || '').replace(/\/+$/, ''),
  jiraEmail: process.env.JIRA_EMAIL || '',
  jiraToken: process.env.JIRA_TOKEN || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  port: process.env.PORT || 3002
};
