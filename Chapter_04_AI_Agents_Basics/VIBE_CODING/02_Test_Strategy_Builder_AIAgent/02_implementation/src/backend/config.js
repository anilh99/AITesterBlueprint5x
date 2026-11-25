const fs = require('fs');
const path = require('path');

function loadParentEnv() {
  let dir = path.resolve(__dirname, '../../../');
  for (let i = 0; i < 8; i++) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) return require('dotenv').config({ path: file }).parsed || {};
    dir = path.dirname(dir);
  }
  return {};
}

loadParentEnv();

module.exports = {
  jiraBaseUrl: (process.env.JIRA_BASE_URL || '').replace(/\/+$/, ''),
  jiraEmail: process.env.JIRA_EMAIL || '',
  jiraToken: process.env.JIRA_TOKEN || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  port: process.env.PORT || 3001
};
