// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

const dbFull          = JSON.parse(readFileSync(join(fixturesDir, 'notion-db-full.json'), 'utf8'));
const dbMissingAuteur = JSON.parse(readFileSync(join(fixturesDir, 'notion-db-missing-auteur.json'), 'utf8'));
const dbConflictPages = JSON.parse(readFileSync(join(fixturesDir, 'notion-db-conflict-pages.json'), 'utf8'));
const queryEmpty      = JSON.parse(readFileSync(join(fixturesDir, 'notion-query-empty.json'), 'utf8'));
const queryDuplicate  = JSON.parse(readFileSync(join(fixturesDir, 'notion-query-duplicate.json'), 'utf8'));

import { checkDuplicate, syncDatabaseProps, doSend } from '../../src/notion.js';

const CFG = { token: 'ntn_x', dbId: 'abcdef1234567890abcdef1234567890', proxy: '' };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

// ─── checkDuplicate ───────────────────────────────────────────────────────────

describe('checkDuplicate', () => {
  test('retourne isDuplicate: false sans appeler fetch quand token est vide', async () => {
    const result = await checkDuplicate('9782070360024', { token: '', dbId: 'db123', proxy: '' });
    expect(result.isDuplicate).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('retourne isDuplicate: false sans appeler fetch quand dbId est vide', async () => {
    const result = await checkDuplicate('9782070360024', { token: 'ntn_x', dbId: '', proxy: '' });
    expect(result.isDuplicate).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('retourne isDuplicate: true avec title et pageId quand doublon trouvé', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => queryDuplicate });
    const result = await checkDuplicate('9782070360024', CFG);
    expect(result.isDuplicate).toBe(true);
    expect(result.title).toBe('Le Capital');
    expect(result.pageId).toBe('page-abc-123');
  });

  test('retourne isDuplicate: false quand résultats vides', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => queryEmpty });
    const result = await checkDuplicate('9999999999999', CFG);
    expect(result.isDuplicate).toBe(false);
  });

  test('retourne isDuplicate: false sur erreur réseau (ne lève pas)', async () => {
    fetch.mockRejectedValueOnce(new Error('DNS failure'));
    const result = await checkDuplicate('9782070360024', CFG);
    expect(result.isDuplicate).toBe(false);
  });

  test('retourne isDuplicate: false sur réponse HTTP non-ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await checkDuplicate('9782070360024', CFG);
    expect(result.isDuplicate).toBe(false);
  });
});

// ─── syncDatabaseProps ────────────────────────────────────────────────────────

describe('syncDatabaseProps', () => {
  test("retourne ok: false avec 'introuvable' sur 404", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('introuvable');
  });

  test("retourne ok: false avec 'invalide' sur 401", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('invalide');
  });

  test('retourne ok: false avec le message sur erreur réseau', async () => {
    fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });

  test('retourne ok: true, created: [], conflicts: [] quand toutes les props sont correctes', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => dbFull });
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(true);
    expect(result.created).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  test("crée la propriété manquante 'Auteur' via PATCH", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbMissingAuteur })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(true);
    expect(result.created).toContain('Auteur');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].method).toBe('PATCH');
  });

  test("signale un conflit de type pour 'Pages' sans le modifier", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => dbConflictPages });
    const result = await syncDatabaseProps(CFG.token, CFG.dbId, { proxy: '' });
    expect(result.ok).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].name).toBe('Pages');
    expect(result.conflicts[0].expected).toBe('number');
    expect(result.conflicts[0].actual).toBe('rich_text');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ─── doSend ──────────────────────────────────────────────────────────────────

const DOM_FORM = `
  <input id="f-titre" value="Le Capital" />
  <input id="f-auteur" value="Karl Marx" />
  <input id="f-nationalite" value="Allemand" />
  <input id="f-editeur" value="Éditions Sociales" />
  <input id="f-collection-ed" value="" />
  <input id="f-isbn" value="9782070360024" />
  <input id="f-datepub" value="1867" />
  <input id="f-dateed" value="1969" />
  <input id="f-pages" value="900" />
  <select id="f-theme"><option value="Histoire" selected>Histoire</option></select>
  <select id="f-soustheme"><option value="Histoire économique" selected>Histoire économique</option></select>
  <select id="f-statut"><option value="Lu" selected>Lu</option></select>
  <select id="f-priorite"><option value="" selected></option></select>
  <select id="f-datelu-mois"><option value="Juin" selected>Juin</option></select>
  <select id="f-datelu-annee"><option value="2024" selected>2024</option></select>
  <select id="f-note"><option value="★★★★★" selected>★★★★★</option></select>
  <select id="f-etat"><option value="" selected></option></select>
  <input type="checkbox" id="f-collection" />
  <textarea id="f-fiche">Ma note de lecture.</textarea>
  <textarea id="f-citations"></textarea>
  <textarea id="f-comment"></textarea>
  <img id="cover-img" src="" style="display:none" />
  <p id="notion-status"></p>
`;

describe('doSend', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM_FORM;
  });

  test('envoie le bon payload shape à Notion', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [] });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.parent.database_id).toBe(CFG.dbId);
    expect(body.properties['Nom'].title[0].text.content).toBe('Le Capital');
    expect(body.properties['Auteur'].rich_text[0].text.content).toBe('Karl Marx');
    expect(body.properties['Pages'].number).toBe(900);
    expect(body.properties['Date de lecture'].rich_text[0].text.content).toBe('Juin 2024');
    expect(body.properties['Collection (livre)'].checkbox).toBe(false);
  });

  test("omet les props dont le nom est dans sync.conflicts", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [{ name: 'Pages' }] });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.properties['Pages']).toBeUndefined();
  });

  test('inclut la couverture quand cover-img est visible avec un src', async () => {
    document.getElementById('cover-img').src = 'https://covers.example.com/img.jpg';
    document.getElementById('cover-img').style.display = 'block';
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [] });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.cover).toEqual({ type: 'external', external: { url: 'https://covers.example.com/img.jpg' } });
  });

  test("omet 'Priorité' quand le champ est vide", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [] });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.properties['Priorité']).toBeUndefined();
  });

  test("coche 'Collection (livre)' quand la case est cochée", async () => {
    document.getElementById('f-collection').checked = true;
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [] });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.properties['Collection (livre)'].checkbox).toBe(true);
  });

  test('affiche le message de succès dans notion-status', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await doSend(CFG, { created: [], conflicts: [] });
    expect(document.getElementById('notion-status').textContent).toContain('Ajouté dans Notion');
  });

  test('affiche une erreur Notion dans notion-status sur réponse non-ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Propriété inconnue' }),
    });
    await doSend(CFG, { created: [], conflicts: [] });
    expect(document.getElementById('notion-status').textContent).toContain('Propriété inconnue');
  });
});
