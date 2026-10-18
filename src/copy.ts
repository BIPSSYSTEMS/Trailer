/**
 * Tous les textes du trailer. Modifie-les ici sans toucher aux scènes.
 * Les mots courts claquent mieux : une ligne = un temps.
 */
export const COPY = {
  hook: ['LES MARCHÉS.', 'EN JEU.'],
  logo: { word: 'BIPS' },
  path: {
    title: 'APPRENDS.',
    boss: 'BOSS',
    chapter: 'FIN DE CHAPITRE',
  },
  app: ['TAPE.', 'GLISSE.', 'JOUE.'],
  career: {
    grades: ['STAGIAIRE', 'ANALYSTE', 'ASSOCIATE', 'VP', 'MD'],
    title: 'MONTE EN GRADE.',
  },
  dialogues: [
    { who: 'buddy', name: 'Kenji', text: 'T’as vu le marché ce matin ?!', mood: 'surprise' },
    { who: 'me', name: 'Toi', text: 'Je suis déjà couvert', mood: 'confident' },
    { who: 'director', name: 'Le directeur', text: 'Dans mon bureau. Maintenant.', mood: 'serious' },
    { who: 'client', name: 'La cliente', text: 'Mon portefeuille… ça va aller ?', mood: 'worried' },
    { who: 'me', name: 'Toi', text: 'On a un plan.', mood: 'smile' },
    { who: 'buddy', name: 'Kenji', text: 'Légende.', mood: 'laugh' },
  ],
  scenarios: {
    briefing: 'BRIEFING',
    year: '2008',
    question: 'QUE FAIT LE MARCHÉ ?',
    choices: ['IL REBONDIT', 'IL S’EFFONDRE', 'RIEN NE BOUGE'],
    correct: 1,
    reveal: 'BIEN VU !',
    flashes: ['SVB', 'COVID', 'PÉTROLE & UKRAINE', 'DROITS DE DOUANE'],
    title: 'REJOUE L’HISTOIRE.',
  },
  markets: {
    greeks: ['DELTA', 'GAMMA', 'VÉGA', 'THÊTA'],
    collar: 'COLLAR',
    title: ['TRADE.', 'COUVRE.', 'COMPRENDS.'],
  },
  bonus: {
    xp: 'XP',
    levelUp: 'NIVEAU SUPÉRIEUR',
    unlocked: 'DÉBLOQUÉE',
    interview: 'QUESTION D’ENTRETIEN',
    question: 'Combien de fois les aiguilles se superposent-elles en 24 h ?',
    answer: '22',
    day: 'JOUR',
    night: 'NUIT',
  },
  finale: {
    tagline: ['LES MARCHÉS N’ATTENDENT PAS.', 'TOI NON PLUS.'],
    soon: 'Bientôt sur iOS et Android',
  },
} as const;
