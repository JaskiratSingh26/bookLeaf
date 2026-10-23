// Run: node testing/test-ai.js
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.claude_api_key });

async function test() {
  console.log('API Key loaded:', process.env.claude_api_key ? 'YES' : 'NO - check .env');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "API working" and nothing else.' }],
    });
    console.log('AI Response:', response.content[0].text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
