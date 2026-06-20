// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { detectCollection, setField, toggleLu } from '../../src/ui.js';

// ─── detectCollection ─────────────────────────────────────────────────────────

describe('detectCollection', () => {
  test("détecte 'pléiade' dans le champ collection", () => {
    const r = detectCollection({ collection: 'Bibliothèque de la Pléiade', editeur: '' });
    expect(r.detected).toBe(true);
    expect(r.reason).toMatch(/pléiade/i);
  });

  test("détecte 'bouquins' dans le champ collection", () => {
    const r = detectCollection({ collection: 'Bouquins', editeur: '' });
    expect(r.detected).toBe(true);
  });

  test("détecte 'quarto' dans le titre", () => {
    const r = detectCollection({ collection: '', titre: 'Quarto Gallimard', editeur: '' });
    expect(r.detected).toBe(true);
  });

  test("détecte 'folio classique' mais PAS 'folio' seul", () => {
    expect(detectCollection({ collection: 'Folio classique', editeur: '' }).detected).toBe(true);
    expect(detectCollection({ collection: 'Folio', editeur: '' }).detected).toBe(false);
  });

  test("détecte 'édition originale' dans le champ collection", () => {
    const r = detectCollection({ collection: 'Édition originale numérotée', editeur: '' });
    expect(r.detected).toBe(true);
  });

  test('détecte Gallimard avec date < 1900 (via datepub)', () => {
    const r = detectCollection({ collection: '', editeur: 'Gallimard', datepub: '1890' });
    expect(r.detected).toBe(true);
    expect(r.reason).toContain('1890');
  });

  test('détecte Gallimard avec date < 1900 (via dateed quand datepub absent)', () => {
    const r = detectCollection({ collection: '', editeur: 'Gallimard', dateed: '1885' });
    expect(r.detected).toBe(true);
  });

  test('ne détecte PAS Gallimard post-1900', () => {
    const r = detectCollection({ collection: '', editeur: 'Gallimard', dateed: '1955' });
    expect(r.detected).toBe(false);
  });

  test('retourne { detected: false } pour un livre moderne ordinaire', () => {
    const r = detectCollection({ titre: 'Guerre et Paix', collection: 'Folio', editeur: 'Gallimard', dateed: '2010' });
    expect(r.detected).toBe(false);
    expect(r.reason).toBe('');
  });

  test("détecte 'classiques garnier' dans la collection", () => {
    const r = detectCollection({ collection: 'Classiques Garnier', editeur: '' });
    expect(r.detected).toBe(true);
  });
});

// ─── setField ────────────────────────────────────────────────────────────────

describe('setField', () => {
  beforeEach(() => {
    document.body.innerHTML = '<input id="f-titre" />';
  });

  test('définit la valeur et ajoute la classe prefilled quand la valeur est truthy', () => {
    setField('f-titre', 'Guerre et Paix');
    const el = document.getElementById('f-titre');
    expect(el.value).toBe('Guerre et Paix');
    expect(el.classList.contains('prefilled')).toBe(true);
  });

  test('vide la valeur et retire la classe prefilled quand la valeur est falsy', () => {
    document.getElementById('f-titre').classList.add('prefilled');
    document.getElementById('f-titre').value = 'old';
    setField('f-titre', '');
    const el = document.getElementById('f-titre');
    expect(el.value).toBe('');
    expect(el.classList.contains('prefilled')).toBe(false);
  });

  test('gère null sans erreur (positionne value à chaîne vide)', () => {
    setField('f-titre', null);
    expect(document.getElementById('f-titre').value).toBe('');
  });

  test('gère undefined sans erreur', () => {
    setField('f-titre', undefined);
    expect(document.getElementById('f-titre').value).toBe('');
  });
});

// ─── toggleLu ────────────────────────────────────────────────────────────────

describe('toggleLu', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="f-statut">
        <option value="À lire">À lire</option>
        <option value="En cours">En cours</option>
        <option value="Lu">Lu</option>
        <option value="Étude">Étude</option>
        <option value="Collection">Collection</option>
        <option value="Néant">Néant</option>
      </select>
      <div id="datelu-block" class="hidden"></div>
      <div id="note-block" class="hidden"></div>
      <div id="priorite-block" class="hidden"></div>
    `;
  });

  test("statut 'Lu' → date/note visibles, priorité cachée", () => {
    document.getElementById('f-statut').value = 'Lu';
    toggleLu();
    expect(document.getElementById('datelu-block').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('note-block').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(true);
  });

  test("statut 'Étude' → même comportement que Lu", () => {
    document.getElementById('f-statut').value = 'Étude';
    toggleLu();
    expect(document.getElementById('datelu-block').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('note-block').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(true);
  });

  test("statut 'À lire' → priorité visible, date/note cachées", () => {
    document.getElementById('f-statut').value = 'À lire';
    toggleLu();
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('datelu-block').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('note-block').classList.contains('hidden')).toBe(true);
  });

  test("statut 'En cours' → priorité visible", () => {
    document.getElementById('f-statut').value = 'En cours';
    toggleLu();
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(false);
  });

  test("statut 'Collection' → tout caché", () => {
    document.getElementById('f-statut').value = 'Collection';
    toggleLu();
    expect(document.getElementById('datelu-block').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('note-block').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(true);
  });

  test("statut 'Néant' → tout caché", () => {
    document.getElementById('f-statut').value = 'Néant';
    toggleLu();
    expect(document.getElementById('datelu-block').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('priorite-block').classList.contains('hidden')).toBe(true);
  });
});
