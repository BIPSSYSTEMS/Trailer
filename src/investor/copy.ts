/**
 * Textes de la vidéo investisseurs. Ton sobre, phrases courtes, chiffres issus du code de l'app.
 * Modifie-les ici sans toucher aux scènes.
 */
export const ICOPY = {
  intro: { subtitle: 'La finance de marché, apprise en pratiquant.' },
  problem: ['La finance de marché s’apprend sur un desk.', 'Pas dans un manuel.'],
  solution: {
    eyebrow: 'La solution',
    title: 'BIPS met un desk de marché dans la poche.',
    pillars: ['Apprendre', 'Pratiquer', 'Rejouer', 'Comprendre'],
  },
  learn: {
    eyebrow: '01 · Apprendre',
    title: 'Un parcours structuré, des bases aux dérivés.',
    bullets: [
      '13 thèmes : actions, obligations, devises, futures, options, swaps, géopolitique',
      'Leçons courtes : concepts, quiz, formules et calculs',
      'Examens de promotion et examens blancs',
    ],
  },
  trade: {
    eyebrow: '02 · Pratiquer',
    title: 'Un simulateur de trading sur données réelles.',
    bullets: [
      'Crypto en direct, actions, ETF, devises, matières premières',
      'Ordres marché, limite, stop, OCO, stop suiveur, levier',
      'Compte fictif de 100 000 $ et statistiques de performance',
    ],
    callouts: { live: 'Prix en direct', oco: 'Ordre OCO' },
  },
  sim: {
    eyebrow: '03 · Anticiper',
    title: '1 000 futurs simulés pour chaque position.',
    bullets: ['Monte Carlo calibré sur l’historique de l’actif', 'Probabilité d’atteindre l’objectif avant le stop'],
    callout: 'Sur 1 000 futurs : objectif atteint 206 fois, stop touché 508 fois',
  },
  replay: {
    eyebrow: '04 · Rejouer l’histoire',
    title: 'Cinq crises réelles, jouées à l’aveugle.',
    steps: [
      {
        title: 'Un dossier, sans le nom de l’événement',
        body: 'Le brief décrit la situation de la veille. Le joueur ne sait pas de quelle crise il s’agit.',
      },
      {
        title: 'Quatre partis pris, datés',
        body: 'À J+1, J+5 et en fin de dossier : le joueur s’engage sur le Nasdaq, les taux, le pétrole.',
      },
      {
        title: 'La vraie courbe se déroule',
        body: 'Les données historiques défilent jour après jour. Chaque pronostic est tranché en direct.',
      },
      { title: 'La révélation, sources à l’appui', body: 'L’événement est nommé, les faits sont datés et sourcés (SEC, Fed, FRED).' },
    ],
    callouts: ['4 partis pris datés', 'Tranché sur les données réelles', 'L’événement révélé'],
  },
  hedge: {
    eyebrow: '05 · Couvrir',
    title: 'Hedge Lab : protéger un portefeuille.',
    bullets: [
      'Mesurer l’exposition, puis couvrir : futures, put, collar',
      'Comprendre quand la corrélation actions-obligations change de signe',
    ],
  },
  world: {
    eyebrow: '06 · Comprendre le monde',
    title: 'Une carte interactive des rapports de force.',
    bullets: [
      'Taux directeurs, poids des économies, exportations',
      'Touchez un pays : ses partenaires commerciaux s’allument',
      'Fiche pays sourcée : banque centrale, PIB, principaux clients',
    ],
    partnersTitle: 'France · principaux clients',
    partnersNote: 'Part des exportations de biens, 2024 · source CEPII BACI, telle qu’affichée dans l’app',
  },
  progress: {
    eyebrow: '07 · Progresser',
    title: 'De stagiaire à Managing Director.',
    bullets: ['Six grades, débloqués par l’expérience', 'Révision ciblée et examens blancs'],
  },
  outro: { tagline: ['Les marchés n’attendent pas.', 'Toi non plus.'], soon: 'Bientôt sur iOS et Android' },
} as const;
