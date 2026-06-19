import { getConfig } from './config.js';

export async function callClaude(prompt) {
  const cfg = getConfig();
  if (!cfg.anthropicKey) throw new Error('Clé API Anthropic non configurée (voir ⚙ configuration).');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Erreur API ' + res.status);
  }
  const data = await res.json();
  return data.content[0].text;
}
