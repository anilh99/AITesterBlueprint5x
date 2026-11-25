const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

function readTemplate() {
  const templatePath = path.resolve(__dirname, '../../../01_plan/test-case-template.md');
  return fs.readFileSync(templatePath, 'utf8');
}

async function generate(issue) {
  const template = readTemplate();
  if (!config.groqApiKey) {
    return template
      .replace('<JIRA-KEY>', issue.key)
      .replace('<title>', issue.summary)
      .replace('<Title>', issue.summary);
  }

  const prompt = `You are a senior QA test-case designer.
Create test cases only from the supplied Jira issue.
Follow the template exactly.
Do not invent requirements or acceptance criteria.
If information is missing, write "Insufficient information to determine."
If a detail is inferred, label it "Inference (low confidence)."
Return only the completed Markdown document.

JIRA ISSUE:
${JSON.stringify(issue)}

TEMPLATE:
${template}`;

  try {
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: { Authorization: `Bearer ${config.groqApiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    return data.choices?.[0]?.message?.content || template;
  } catch {
    return template
      .replace('<JIRA-KEY>', issue.key)
      .replace('<title>', issue.summary)
      .replace('<Title>', issue.summary);
  }
}

module.exports = { generate };
