export const THEMES = {
  "Philosophie": ["Esthétique","Éthique","Épistémologie","Métaphysique","Philosophie politique","Philosophie du langage","Logique","Philosophie des sciences","Histoire de la philosophie","Phénoménologie","Philosophie morale","Philosophie orientale"],
  "Littérature": ["Roman","Nouvelle","Poésie","Théâtre","Essai littéraire","Autobiographie","Correspondance","Conte","Aphorisme"],
  "Histoire": ["Histoire ancienne","Histoire médiévale","Histoire moderne","Histoire contemporaine","Histoire de France","Biographie","Mémoires","Histoire des idées","Histoire de l'art"],
  "Sciences humaines & sociales": ["Sociologie","Anthropologie","Linguistique","Sémiologie","Géographie humaine","Ethnologie"],
  "Sciences & techniques": ["Mathématiques","Physique","Biologie","Informatique","Sciences cognitives","Médecine"],
  "Arts": ["Musique","Peinture","Sculpture","Architecture","Cinéma","Photographie","Design"],
  "Religion & spiritualité": ["Christianisme","Islam","Bouddhisme","Judaïsme","Mystique","Théologie","Mythologie"],
  "Droit & politique": ["Droit constitutionnel","Droit international","Science politique","Géopolitique","Théorie politique"],
  "Économie": ["Économie politique","Histoire économique","Économie comportementale","Finance"],
  "Psychologie": ["Psychanalyse","Psychologie sociale","Psychologie cognitive","Neuropsychologie"],
  "Autre": ["—"]
};

export const EXPECTED_PROPS = {
  'Auteur':                'rich_text',
  'Nationalité':           'rich_text',
  'Éditeur':               'rich_text',
  'Collection':            'rich_text',
  'ISBN':                  'rich_text',
  'Publication originale': 'rich_text',
  'Date édition':          'rich_text',
  'Date de lecture':       'rich_text',
  'Fiche de lecture':      'rich_text',
  'Commentaire':           'rich_text',
  'Pages':                 'number',
  'Thème':                 'select',
  'Sous-thème':            'select',
  'Statut':                'select',
  'Priorité':              'select',
  'Note':                  'select',
  'État':                  'select',
  'Collection (livre)':    'checkbox',
  'Citations':             'rich_text',
};

export function propSchema(type) {
  if (type === 'rich_text') return { rich_text: {} };
  if (type === 'number')    return { number: { format: 'number' } };
  if (type === 'select')    return { select: {} };
  if (type === 'checkbox')  return { checkbox: {} };
  return { rich_text: {} };
}
