/**
 * Textes de la vidéo keynote Base Point. Peu de mots : un titre, parfois une ligne grise.
 * Tous les chiffres viennent du code de l'app (BIPS-SYSTEME, version du 21/10/2026).
 */
export const KC = {
  intro: { value: '0,01 %', meaning: 'Un point de base.', name: 'Base Point' },
  promise: ['La finance de marché,', 'apprise en la pratiquant.'],
  reveal: { eyebrow: 'Base Point', title: ['Le desk de marché,', 'dans la poche.'], sub: 'Pour les étudiants et les débutants.' },
  overview: {
    title: 'Huit espaces. Une seule app.',
    tiles: [
      { name: 'Parcours', stat: '13 thèmes', src: 'parcours' },
      { name: 'Marchés', stat: 'Prix en direct', src: 'btc' },
      { name: 'Options', stat: 'Calls, puts, grecques', src: 'options-chaine' },
      { name: 'Hedge Lab', stat: '4 chapitres', src: 'hedge' },
      { name: 'Scénarios', stat: '5 crises réelles', src: 'scn-brief' },
      { name: 'Carte', stat: 'Rapports de force', src: 'carte-fra' },
      { name: 'Entretien', stat: '30 questions', src: 'entretien' },
      { name: 'Carrière', stat: '6 grades', src: 'carriere' },
    ],
  },
  parcours: {
    eyebrow: 'Parcours',
    title: ['Des bases', 'aux produits dérivés.'],
    stats: [
      { value: '13', label: 'thèmes, des actions à la géopolitique' },
      { value: '5 min', label: 'par leçon' },
    ],
    source: 'Chaque fait est sourcé',
    sourceSub: 'Régulateurs, banques centrales, Bourses',
    quiz: 'Quiz corrigé et expliqué',
    bips: { title: ['1 point de base', '= 0,01 %.'], sub: 'Même notre nom s’apprend.' },
  },
  marches: {
    eyebrow: 'Marchés',
    title: ['Un vrai desk.', 'De l’argent fictif.'],
    stat: { value: '100 000 $', label: 'sur un compte fictif' },
    callouts: { live: 'Prix en direct', frames: '6 unités de temps', oco: 'Marché, limite, stop, OCO', lev: 'Levier jusqu’à ×50' },
  },
  simulation: {
    eyebrow: 'Simulation',
    title: ['1 000 futurs,', 'avant de cliquer.'],
    callout: 'Objectif ou stop ?',
    calloutSub: 'Qui arrive en premier, sur 1 000 futurs',
  },
  options: {
    eyebrow: 'Options',
    title: ['Les options,', 'enfin lisibles.'],
    callouts: {
      chain: 'Calls et puts, 4 échéances',
      premium: 'Prime théorique Black–Scholes',
      payoff: 'Gain ou perte à l’échéance',
      greeks: 'Delta, gamma, vega, theta',
    },
  },
  hedge: {
    eyebrow: 'Hedge Lab',
    title: ['Apprendre', 'à se couvrir.'],
    stats: [
      { value: '4', label: 'chapitres, 10 leçons' },
      { value: '2 000', label: 'futurs simulés par labo' },
    ],
    callout: 'Avec ou sans couverture',
  },
  scenarios: {
    eyebrow: 'Scénarios',
    title: ['Rejouez l’histoire.', 'À l’aveugle.'],
    steps: ['Un dossier, sans le nom', 'Vos partis pris, datés', 'La vraie courbe', 'La révélation'],
    sub: 'Séries de la Réserve fédérale et de l’EIA.',
  },
  carte: {
    eyebrow: 'Carte',
    title: ['Le monde,', 'en rapports de force.'],
    sub: 'Touchez un pays : ses partenaires s’affichent.',
    partnersTitle: 'France · principaux clients',
    partnersNote: 'Part des exportations de biens, 2024 · CEPII BACI, telle qu’affichée dans l’app',
  },
  entretien: {
    eyebrow: 'Entretien',
    title: ['Prêt pour', 'l’entretien.'],
    stat: { value: '30', label: 'questions de calcul et de logique' },
    cats: ['Calcul', 'Probabilités', 'Espérance', 'Logique'],
    callout: 'Entretien blanc chronométré',
  },
  carriere: {
    eyebrow: 'Carrière',
    title: ['De stagiaire', 'à Managing Director.'],
    callout: '6 grades, débloqués par l’expérience',
    dark: 'Clair ou sombre.',
  },
  sources: {
    title: 'Chaque chiffre a sa source.',
    items: ['Réserve fédérale', 'BCE', 'BRI', 'AMF', 'SEC', 'ESMA', 'FINRA', 'CME Group', 'Euronext', 'EIA', 'CEPII'],
  },
  outro: { name: 'Base Point', tagline: ['Les marchés n’attendent pas.', 'Toi non plus.'], soon: 'Bientôt sur iOS et Android' },
} as const;
