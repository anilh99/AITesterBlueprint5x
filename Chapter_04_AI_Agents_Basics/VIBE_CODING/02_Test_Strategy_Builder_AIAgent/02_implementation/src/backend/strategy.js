const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

function readTemplate() {
  const templatePath = path.resolve(__dirname, '../../../01_plan/test-strategy-template.md');
  return fs.readFileSync(templatePath, 'utf8');
}

function fallbackStrategy(issue) {
  return readTemplate()
    .replace('<PROJECT / EPIC / RELEASE NAME>', `${issue.key}: ${issue.summary}`)
    .replace('Why this testing effort exists.', `Define and validate the test strategy for ${issue.key}.`)
    .replace('**Product / Release under test:**', `**Product / Release under test:** ${issue.summary || 'Insufficient information to determine.'}`)
    .replace('The delivered Jira issue: ' + issue.key, '');
}

async function generate(issue) {
  const template = readTemplate();
  if (!config.groqApiKey) return fallbackStrategy(issue);

  const prompt = `You are a senior QA test architect.
Use only the supplied Jira issue information and the template.
If information is missing, write exactly "Insufficient information to determine."
Do not invent facts. If an assertion is inferred, label it "Inference (low confidence)."
Return only the completed Markdown test strategy.

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
        timeout: 15000
      }
    );
    return data.choices?.[0]?.message?.content || fallbackStrategy(issue);
  } catch {
    return fallbackStrategy(issue);
  }
}

module.exports = { generate };
