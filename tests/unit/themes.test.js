import { describe, test, expect } from 'vitest';
import { THEMES, EXPECTED_PROPS, propSchema } from '../../src/themes.js';

describe('THEMES', () => {
  test('contient exactement 11 thèmes', () => {
    expect(Object.keys(THEMES).length).toBe(11);
  });

  test('contient les thèmes attendus', () => {
    expect(THEMES).toHaveProperty('Philosophie');
    expect(THEMES).toHaveProperty('Littérature');
    expect(THEMES).toHaveProperty('Histoire');
    expect(THEMES).toHaveProperty('Autre');
  });

  test('chaque valeur est un tableau de strings non vide', () => {
    for (const [, subs] of Object.entries(THEMES)) {
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBeGreaterThan(0);
      for (const s of subs) expect(typeof s).toBe('string');
    }
  });

  test("THEMES['Autre'] contient exactement ['—']", () => {
    expect(THEMES['Autre']).toEqual(['—']);
  });
});

describe('EXPECTED_PROPS', () => {
  const ALLOWED_TYPES = ['rich_text', 'number', 'select', 'checkbox'];

  test('contient exactement 19 propriétés', () => {
    expect(Object.keys(EXPECTED_PROPS).length).toBe(19);
  });

  test('tous les types sont parmi les 4 types Notion autorisés', () => {
    for (const type of Object.values(EXPECTED_PROPS)) {
      expect(ALLOWED_TYPES).toContain(type);
    }
  });

  test("'Pages' est de type 'number'", () => {
    expect(EXPECTED_PROPS['Pages']).toBe('number');
  });

  test("'Collection (livre)' est de type 'checkbox'", () => {
    expect(EXPECTED_PROPS['Collection (livre)']).toBe('checkbox');
  });

  test("'Auteur' est de type 'rich_text'", () => {
    expect(EXPECTED_PROPS['Auteur']).toBe('rich_text');
  });

  test("'Statut' est de type 'select'", () => {
    expect(EXPECTED_PROPS['Statut']).toBe('select');
  });
});

describe('propSchema', () => {
  test("rich_text → { rich_text: {} }", () => {
    expect(propSchema('rich_text')).toEqual({ rich_text: {} });
  });

  test("number → { number: { format: 'number' } }", () => {
    expect(propSchema('number')).toEqual({ number: { format: 'number' } });
  });

  test("select → { select: {} }", () => {
    expect(propSchema('select')).toEqual({ select: {} });
  });

  test("checkbox → { checkbox: {} }", () => {
    expect(propSchema('checkbox')).toEqual({ checkbox: {} });
  });

  test("type inconnu → fallback { rich_text: {} }", () => {
    expect(propSchema('unknown')).toEqual({ rich_text: {} });
  });
});
