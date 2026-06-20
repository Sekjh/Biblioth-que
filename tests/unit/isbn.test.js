import { describe, test, expect } from 'vitest';
import { validateIsbn, isbn13to10 } from '../../src/isbn.js';

describe('validateIsbn', () => {
  test('ISBN-13 valide (Proust Pléiade)', () => {
    expect(validateIsbn('9782070360024')).toBe(true);
  });

  test('ISBN-13 valide (check digit = 0)', () => {
    expect(validateIsbn('9780306406157')).toBe(true);
  });

  test('ISBN-13 chiffre de contrôle incorrect', () => {
    expect(validateIsbn('9782070360025')).toBe(false);
  });

  test('ISBN-13 longueur incorrecte (12 chiffres)', () => {
    expect(validateIsbn('978207036002')).toBe(false);
  });

  test('ISBN-13 longueur incorrecte (14 chiffres)', () => {
    expect(validateIsbn('97820703600244')).toBe(false);
  });

  test('ISBN-10 valide', () => {
    expect(validateIsbn('2070360024')).toBe(true);
  });

  test('ISBN-10 chiffre de contrôle incorrect', () => {
    expect(validateIsbn('2070360025')).toBe(false);
  });

  test('Chaîne vide', () => {
    expect(validateIsbn('')).toBe(false);
  });
});

describe('isbn13to10', () => {
  test('conversion standard 978 → ISBN-10', () => {
    expect(isbn13to10('9782070360024')).toBe('2070360024');
  });

  test('résultat réel de la conversion (vérification checksum)', () => {
    const result = isbn13to10('9780306406157');
    expect(result).toHaveLength(10);
    expect(validateIsbn(result)).toBe(true);
  });

  test('préfixe 979 non convertible → null', () => {
    expect(isbn13to10('9791032343487')).toBe(null);
  });

  test('longueur incorrecte → null', () => {
    expect(isbn13to10('97820703600')).toBe(null);
  });

  test('chaîne vide → null', () => {
    expect(isbn13to10('')).toBe(null);
  });
});
