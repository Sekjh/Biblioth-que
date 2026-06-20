# Changelog

Toutes les modifications notables de GEBIBLIPE sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
Versioning : [SemVer](https://semver.org/lang/fr/)

## [Unreleased]

---

## [0.51.0] — 2026-06-20

### Added
- Badge source par champ : le badge "ISBN" dans chaque label affiche désormais la source exacte du champ (ex. "BnF 13", "OL 13", "Google") plutôt que le texte générique "ISBN"
- Popover sources : cliquer sur le badge source du bandeau ouvre un panneau détaillant chaque source consultée (✓ Importé · champs, — Aucun résultat, ✗ Erreur, · Non consulté)
- Couverture agrandie (90 px) avec badge source conditionnel (visible uniquement si la couverture a été importée)
- `searchLog` et `fieldSources` dans le modèle de données de `lookup()` pour tracer l'origine de chaque champ et le résultat par source
- Indicateurs visuels d'origine des champs : badge `ISBN` (bleu) sur les champs auto-remplis par lookup, badge `IA` (violet) sur les champs pouvant être générés par IA (thème, sous-thème, fiche)
- Classe CSS `ai-filled` (fond violacé) appliquée aux champs remplis par IA après génération de fiche ou suggestion de thème ; retirée à chaque nouveau lookup
- Enrichissement multi-sources : si des champs restent vides après la source principale, les sources suivantes sont interrogées pour les compléter (sans écraser les valeurs existantes)
- Source détaillée dans le badge : distingue désormais `BnF ISBN-13`, `BnF ISBN-10`, `OpenLibrary ISBN-13`, etc. ; affiche toutes les sources ayant contribué (ex. `BnF ISBN-13 • OpenLibrary ISBN-13`)

### Changed
- Fiche de lecture générée avec `claude-sonnet-4-6` (au lieu de Haiku) pour une meilleure qualité d'analyse littéraire ; `max_tokens` porté à 600
- Prompt de la fiche enrichi : l'éditeur et la collection sont passés en contexte pour calibrer le registre (Pléiade, collection académique, etc.)
- `callClaude()` accepte désormais `{ model, maxTokens }` en second paramètre (défauts : Haiku, 400) — la suggestion de thème continue d'utiliser Haiku
- Reset complet du formulaire à chaque nouveau lookup (thème, statut, note, état, commentaire inclus) ; bouton "Rechercher" grisé tant que l'ISBN saisi correspond au dernier ISBN recherché

---

## [0.50.3] — 2026-06-20

### Added
- Suite de tests automatisés avec Vitest + jsdom : 107 tests couvrant les 7 modules (`isbn`, `themes`, `config`, `claude`, `fetchers`, `ui`, `notion`) et 2 flows d'intégration (lookup fallback BnF→OL→Google, détection de doublons Notion)
- `package.json` avec scripts `npm test`, `npm run test:watch`, `npm run test:coverage`
- `vitest.config.js`, `.gitignore`, `tests/fixtures/` (9 fichiers XML/JSON de bouchonnage), `tests/helpers/localStorage.js`
- Section **Tests** dans `CLAUDE.md` : règles, commandes, stratégie de stub

---

## [0.50.2] — 2026-06-19

### Changed
- Sélecteur de moteur de recherche (BnF / OpenLibrary / Google Books) déplacé dans le panneau ⚙ configuration, persisté en `localStorage`
- Saisie manuelle d'ISBN conservée (input + bouton "Rechercher") ; lance un nouveau lookup et réinitialise le formulaire si une fiche était déjà affichée

---

## [0.50.1] — 2026-06-19

### Changed
- Modularisation de l'application en 8 modules ES (`src/main.js`, `src/ui.js`, `src/notion.js`, `src/fetchers.js`, `src/isbn.js`, `src/claude.js`, `src/themes.js`, `src/config.js`)

### Fixed
- Renommage de l'UI de configuration et sécurisation de l'affichage des champs secrets

---

## [0.50.0] — 2026-06-13

### Added
- Validation ISBN par checksum (algorithme de Luhn) — erreur affichée avant toute recherche si le numéro est invalide
- Raccourci Cmd+Entrée / Ctrl+Entrée pour envoyer dans Notion depuis n'importe quel champ du formulaire

### Changed
- Timeout 5 s par source (BnF, OpenLibrary, Google Books) via AbortController — plus de blocage en cas d'API silencieuse
- `max_tokens` IA 256 → 400 pour éviter les fiches tronquées

### Fixed
- Champs pré-remplis par l'API mis en évidence visuellement (fond légèrement contrasté)

---

## [0.49.0] — 2026-06-13

### Added
- Bloc "Citations" — saisie libre des extraits marquants, synchronisé dans Notion (propriété rich_text "Citations"), créé automatiquement dans la base si absent

### Changed
- Nouveau prompt universel pour la fiche de lecture — 3 points structurés (propos, enjeux, singularité), adapté à tout type d'œuvre (roman, essai, poésie, traité…)
- Prompt contextualise le thème et sous-thème sélectionnés
- Format bullet homogène, plus court et plus lisible

---

## [0.48.0] — 2026-05-31

### Added
- Saisie manuelle ISBN-13 ou ISBN-10
- Moteur préférentiel configurable (BnF par défaut) — fallback automatique sur OpenLibrary puis Google Books
- BnF via API SRU UNIMARC — meilleure couverture livres français
- Conversion ISBN-13 → ISBN-10 automatique pour les livres anciens
- Couverture récupérée depuis OpenLibrary Covers en fallback
- Détection du paramètre `?isbn=` dans l'URL — lookup automatique (compatible Raccourcis iOS)
- 11 thèmes et sous-thèmes contextuels avec cases vides par défaut
- Bouton "Suggérer via IA" pour le thème/sous-thème (Claude Haiku)
- Statuts : À lire, En cours, Lu, Étude, Collection, Néant
- Priorité de lecture, date de lecture (mois/année), note ★
- Fiche de lecture avec génération IA (Claude Haiku) et prompt adapté selon le thème
- État physique du livre (Neuf / Très bon / Bon / Correct / Abîmé)
- Livre de collection (checkbox) avec détection automatique (Pléiade, Bouquins, Quarto…)
- Commentaire libre
- Sync automatique des propriétés Notion avant chaque envoi — création des champs manquants, détection des conflits de type
- Couverture envoyée comme image de couverture de la page Notion
- Contrôle doublon sur ISBN — trois options (Ajouter / Mettre à jour / Annuler)
- Token, Database ID, proxy Cloudflare et clé API Anthropic stockés en localStorage (jamais dans le code)
- Mode clair / sombre automatique (préférences système)

---

[Unreleased]: https://github.com/Sekjh/Biblioth-que/compare/v0.51.0...HEAD
[0.51.0]: https://github.com/Sekjh/Biblioth-que/compare/v0.50.3...v0.51.0
[0.50.3]: https://github.com/Sekjh/Biblioth-que/compare/v0.50.2...v0.50.3
[0.50.2]: https://github.com/Sekjh/Biblioth-que/compare/v0.50.1...v0.50.2
[0.50.1]: https://github.com/Sekjh/Biblioth-que/compare/v0.50.0...v0.50.1
[0.50.0]: https://github.com/Sekjh/Biblioth-que/compare/v0.49.0...v0.50.0
[0.49.0]: https://github.com/Sekjh/Biblioth-que/compare/v0.48.0...v0.49.0
[0.48.0]: https://github.com/Sekjh/Biblioth-que/releases/tag/v0.48.0
