import { describe, test, expect, beforeEach, vi } from 'vitest';
import { localStorageStub } from '../helpers/localStorage.js';

beforeEach(() => {
  localStorageStub.clear();
  vi.stubGlobal('localStorage', localStorageStub);
  vi.stubGlobal('fetch', vi.fn());
});

// Import dynamique après le stub (nécessaire car claude.js appelle getConfig() au runtime)
async function getClaude() {
  const mod = await import('../../src/claude.js?t=' + Date.now());
  return mod.callClaude;
}

describe('callClaude', () => {
  test("lève une erreur quand anthropicKey n'est pas configurée", async () => {
    const callClaude = await getClaude();
    await expect(callClaude('test')).rejects.toThrow('Clé API Anthropic non configurée');
  });

  test('retourne le texte de la première réponse sur succès', async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-abc');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'Claude dit bonjour' }] }),
    });
    const callClaude = await getClaude();
    const result = await callClaude('bonjour');
    expect(result).toBe('Claude dit bonjour');
  });

  test('envoie le bon modèle et max_tokens par défaut (Haiku, 400)', async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-abc');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    const callClaude = await getClaude();
    await callClaude('mon prompt');
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.model).toBe('claude-haiku-4-5-20251001');
    expect(body.max_tokens).toBe(400);
    expect(body.messages[0].content).toBe('mon prompt');
  });

  test('envoie le modèle et max_tokens personnalisés quand fournis', async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-abc');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    const callClaude = await getClaude();
    await callClaude('mon prompt', { model: 'claude-sonnet-4-6', maxTokens: 600 });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.model).toBe('claude-sonnet-4-6');
    expect(body.max_tokens).toBe(600);
  });

  test("envoie les en-têtes API corrects", async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-testkey');
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    const callClaude = await getClaude();
    await callClaude('test');
    const headers = fetch.mock.calls[0][1].headers;
    expect(headers['x-api-key']).toBe('sk-ant-testkey');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
  });

  test("lève le message d'erreur de l'API sur réponse non-ok", async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-abc');
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Clé API invalide' } }),
    });
    const callClaude = await getClaude();
    await expect(callClaude('test')).rejects.toThrow('Clé API invalide');
  });

  test("lève 'Erreur API 500' quand pas de message d'erreur", async () => {
    localStorage.setItem('anthropic_key', 'sk-ant-abc');
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const callClaude = await getClaude();
    await expect(callClaude('test')).rejects.toThrow('Erreur API 500');
  });
});
