const axios = require('axios');
const { getConfig } = require('./config');

// Connectivity check only; the active provider is stored for test plan generation
async function testLLM() {
  const { llmProvider, ollamaUrl, groqApiKey } = getConfig();
  try {
    if (llmProvider === 'ollama') {
      const { data } = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 8000 });
      return `Ollama reachable (${(data.models || []).length} models installed)`;
    }
    if (!groqApiKey) throw new Error('Groq API key not configured');
    await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${groqApiKey}` },
      timeout: 8000,
    });
    return 'Groq API key is valid';
  } catch (error) {
    const status = error.response?.status;
    throw new Error(status === 401 ? 'Groq rejected the API key' : error.message);
  }
}

module.exports = { testLLM };
