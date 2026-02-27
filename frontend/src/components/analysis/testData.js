/**
 * Test data generator for analysis form autofill.
 * Produces realistic French real-estate analysis data with randomized variations.
 */

import { CRITERIA } from './steps/StepScoring';
import { getGradeInfo } from './steps/StepScoring';

// ─── Helpers ───

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randBetween(min, max, step = 0.5) {
  const steps = Math.round((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

// ─── Rich Text Pools (Presentation) ───

const INVESTISSEMENT_POOL = [
  `<p>L'operation consiste en l'acquisition et la revente d'un immeuble de rapport situe en centre-ville de Lyon (69003). Le projet s'inscrit dans une logique de marchand de biens avec une strategie de division en lots et de revente a l'unite.</p><p>Le permis d'amenager a ete obtenu et les diagnostics techniques sont favorables. La creation de valeur repose sur la division du bien en 6 lots residentiels et 1 local commercial en rez-de-chaussee.</p><p>L'avancement administratif est solide : le permis de construire est purge de tout recours, et l'ensemble des autorisations d'urbanisme ont ete delivrees par la mairie.</p>`,

  `<p>Ce projet de promotion immobiliere porte sur la construction d'une residence de 12 logements neufs a Bordeaux-Bastide (33100). L'operation vise la creation d'un ensemble immobilier mixte comprenant des T2, T3 et T4 avec terrasses.</p><p>Le permis de construire a ete delivre en septembre 2025 et est desormais purge de tout recours. Les etudes de sol et les diagnostics environnementaux sont finalises. La strategie de creation de valeur repose sur la qualite des prestations et le positionnement en eco-quartier.</p>`,

  `<p>Operation de rehabilitation lourde d'un hotel particulier du XVIIIe siecle situe dans le Marais (Paris 3e). Le projet prevoit la transformation en 4 appartements haut de gamme avec preservation des elements patrimoniaux.</p><p>Les autorisations ABF (Architectes des Batiments de France) ont ete obtenues. Le projet beneficie d'un dispositif Malraux pour les investisseurs. La strategie repose sur la valorisation du patrimoine historique dans un marche premium a tres forte demande.</p>`,

  `<p>Acquisition d'un ensemble de 3 maisons mitoyennes a Nantes (44000) pour division fonciere et revente en lots individuels. Le projet s'appuie sur la forte tension du marche nantais et le deficit d'offre en maisons individuelles.</p><p>Le certificat d'urbanisme operationnel est positif. Les geometres ont finalise le bornage et le plan de division. La strategie de sortie privilegiee est la revente des lots viabilises avec permis de construire.</p>`,
];

const PORTEUR_POOL = [
  `<p>La societe porteuse est la SAS IMMO INVEST LYON, creee en 2019, au capital de 150 000 EUR. L'actionnariat est compose de M. Dupont Pierre (60%) et Mme Martin Claire (40%), tous deux actifs dans le secteur immobilier depuis plus de 15 ans.</p><p>Le track-record des dirigeants comprend 8 operations de marchand de biens realisees avec succes, pour un volume cumule de 12 M EUR. Le taux de defaut est nul et le delai moyen de revente est de 14 mois.</p><p>La structure financiere de la societe est saine, avec un ratio d'endettement de 45% et une tresorerie disponible de 280 000 EUR.</p>`,

  `<p>La societe SCI PROMO SUD, immatriculee en 2017, est dirigee par M. Lefevre Jean, promoteur immobilier avec plus de 20 ans d'experience dans la region bordelaise. Capital social : 500 000 EUR.</p><p>Le dirigeant a realise 15 programmes immobiliers representant plus de 200 logements livres, pour un chiffre d'affaires cumule de 45 M EUR. Les bilans des 3 derniers exercices montrent une rentabilite nette moyenne de 8%.</p>`,

  `<p>La SARL PATRIMOINE ET RENOVATION est une societe specialisee dans la rehabilitation d'immeubles anciens en Ile-de-France. Creee en 2015 par Mme Durand Sophie, architecte DPLG de formation.</p><p>Le track-record inclut 5 operations de rehabilitation pour un montant total de 8 M EUR, avec un taux de marge brut moyen de 22%. La dirigeante dispose d'un reseau solide d'artisans qualifies et de relations privilegiees avec les ABF.</p>`,

  `<p>Porteur : SAS ATLANTIC FONCIER, fondee en 2020 par MM. Moreau et Girard, anciens cadres de Nexity. Capital : 200 000 EUR. Les fondateurs cumulent 25 ans d'experience en promotion et amenagement foncier.</p><p>Trois operations de division fonciere realisees a ce jour pour un CA de 3,5 M EUR. Taux de rotation moyen : 10 mois. Les references bancaires aupres du Credit Mutuel et de la Caisse d'Epargne sont excellentes.</p>`,
];

const LOCALISATION_POOL = [
  `<p>Le bien est situe au 45 rue de la Republique, Lyon 3e, a proximite immediate de la place Guichard et de la ligne B du metro. Le quartier de la Part-Dieu, en pleine mutation urbaine, beneficie d'investissements publics massifs (reamenagement de la gare, nouveau centre commercial).</p><p>Le marche immobilier lyonnais affiche une hausse constante des prix (+4,2% sur 12 mois). Le prix median au m2 dans le 3e arrondissement s'eleve a 4 800 EUR, en forte progression. La demande locative est soutenue par la presence de nombreuses entreprises et universites.</p><p>L'avis de valeur realise par le cabinet Deloitte estime le bien post-travaux entre 5 200 et 5 600 EUR/m2, soit une decote d'acquisition de 18%.</p>`,

  `<p>Localisation : quartier Bastide-Niel, Bordeaux rive droite (33100). Ce secteur fait l'objet d'un projet d'amenagement urbain majeur (ZAC Bastide-Niel) avec creation de 3 500 logements, espaces verts et equipements publics.</p><p>Le tramway (ligne A) dessert directement le quartier. Les prix au m2 dans le neuf oscillent entre 4 200 et 5 000 EUR. La dynamique demographique bordelaise (+1,2% par an) soutient la demande. Le taux de vacance locative est inferieur a 3%.</p>`,

  `<p>Adresse : 12 rue des Archives, Paris 3e (Le Marais). Emplacement premium dans l'un des quartiers les plus recherches de la capitale. Proximite du Centre Pompidou, du Musee Picasso et de la Place des Vosges.</p><p>Le marche du Marais est l'un des plus resilients de Paris avec des prix au m2 depassant 13 000 EUR dans l'ancien renove. La clientele ciblee (CSP+, investisseurs patrimoniaux, expatries) garantit une forte liquidite. Le taux de rotation des biens est inferieur a 45 jours.</p>`,

  `<p>Situation : secteur Erdre-Porterie, Nantes (44300). Quartier residentiel recherche, a 15 minutes du centre-ville par tramway (ligne 1). Proximite de l'ecole des Mines, du CHU, et du parc de la Beaujoire.</p><p>Le marche nantais est le plus dynamique de l'Ouest avec une hausse des prix de 6,1% en 2025. Le prix median des maisons individuelles atteint 385 000 EUR dans ce secteur. Le ratio offre/demande est de 1 pour 4 acheteurs potentiels.</p>`,
];

const STRUCTURE_FIN_POOL = [
  `<p><strong>Emplois :</strong></p><ul><li>Prix d'acquisition : 1 200 000 EUR</li><li>Frais de notaire : 96 000 EUR (8%)</li><li>Budget travaux : 380 000 EUR</li><li>Frais financiers : 65 000 EUR</li><li>Honoraires et divers : 45 000 EUR</li></ul><p><strong>Total des emplois : 1 786 000 EUR</strong></p><p><strong>Ressources :</strong></p><ul><li>Apport personnel du porteur : 360 000 EUR (20%)</li><li>Levee de fonds participative : 900 000 EUR (50%)</li><li>Pret bancaire : 526 000 EUR (30%)</li></ul><p>La marge previsionnelle s'eleve a 420 000 EUR, soit un taux de marge brut de 19%. Le scenario de revente est base sur un prix de sortie de 5 200 EUR/m2, conforme aux comparables du marche.</p>`,

  `<p><strong>Budget previsionnel de l'operation :</strong></p><ul><li>Charge fonciere : 850 000 EUR</li><li>Cout de construction : 1 800 000 EUR (1 500 EUR/m2)</li><li>Frais techniques et honoraires : 220 000 EUR</li><li>Frais financiers et intercalaires : 95 000 EUR</li><li>Commercialisation : 75 000 EUR</li></ul><p><strong>Total : 3 040 000 EUR</strong></p><p><strong>Plan de financement :</strong></p><ul><li>Fonds propres promoteur : 610 000 EUR (20%)</li><li>Financement participatif : 1 200 000 EUR (40%)</li><li>Credit promoteur bancaire : 1 230 000 EUR (40%)</li></ul><p>CA previsionnel : 3 850 000 EUR. Marge nette previsionnelle : 810 000 EUR (21%). Le point mort se situe a 73% des ventes.</p>`,

  `<p><strong>Plan de financement :</strong></p><ul><li>Acquisition : 2 100 000 EUR</li><li>Travaux de rehabilitation : 950 000 EUR</li><li>Frais annexes (notaire, architecte, ABF) : 280 000 EUR</li><li>Frais de portage : 120 000 EUR</li></ul><p><strong>Total : 3 450 000 EUR</strong></p><p>Financement : apport porteur 690 000 EUR (20%), levee crowdfunding 1 380 000 EUR (40%), pret bancaire 1 380 000 EUR (40%).</p><p>Hypothese de revente a 15 500 EUR/m2 pour 280 m2 habitables = 4 340 000 EUR. Marge brute : 890 000 EUR (20,5%).</p>`,

  `<p><strong>Emplois :</strong></p><ul><li>Acquisitions foncieres : 620 000 EUR</li><li>Frais de geometre et division : 35 000 EUR</li><li>Viabilisation des lots : 180 000 EUR</li><li>Frais divers : 45 000 EUR</li></ul><p><strong>Total : 880 000 EUR</strong></p><p><strong>Ressources :</strong></p><ul><li>Apport : 180 000 EUR (20%)</li><li>Financement participatif : 440 000 EUR (50%)</li><li>Pret relais : 260 000 EUR (30%)</li></ul><p>Prix de revente des 3 lots viabilises : entre 350 000 et 420 000 EUR chacun. CA previsionnel : 1 150 000 EUR. Marge : 270 000 EUR (23%).</p>`,
];

const GARANTIES_POOL = [
  `<p><strong>Garanties reelles :</strong></p><ul><li>Hypotheque de 1er rang sur l'ensemble immobilier, inscrite pour 1 400 000 EUR aupres du service de la publicite fonciere.</li><li>Nantissement des parts sociales de la SAS porteuse au profit des investisseurs.</li></ul><p><strong>Garanties personnelles :</strong></p><ul><li>Caution personnelle solidaire du dirigeant M. Dupont a hauteur de 500 000 EUR.</li></ul><p><strong>Mecanismes de controle :</strong></p><ul><li>Compte sequestre aupres de Me Bertrand, notaire, pour les fonds des investisseurs.</li><li>Open banking actif permettant un suivi en temps reel des flux financiers de l'operation.</li><li>Sequestre d'interets couvrant 12 mois de service de dette.</li></ul>`,

  `<p>Le dispositif de garanties est structure comme suit :</p><ul><li><strong>Fiducie-surete</strong> portant sur l'ensemble des lots, inscrite au benefice des preteurs. Le fiduciaire designe est la societe AARPI Garanties Immobilieres.</li><li><strong>Garantie a premiere demande</strong> delivree par la banque partenaire (Credit Mutuel) a hauteur de 600 000 EUR.</li><li><strong>GFA (Garantie Financiere d'Achevement)</strong> delivree par la Compagnie Europeenne de Garanties, couvrant l'integralite du programme.</li></ul><p>Sequestre de travaux : 250 000 EUR bloques sur un compte dedie chez le notaire. Open banking actif via la plateforme Bankin'.</p>`,

  `<p><strong>Suretes mises en place :</strong></p><ul><li>Hypotheque conventionnelle de 1er rang inscrite pour 2 500 000 EUR.</li><li>Promesse d'affectation hypothecaire sur un bien personnel du dirigeant (appartement Paris 16e, valeur estimee 800 000 EUR).</li></ul><p><strong>Garanties complementaires :</strong></p><ul><li>Caution personnelle et solidaire des deux associes, limitee a 1 000 000 EUR chacun.</li><li>Police d'assurance Dommages-Ouvrage souscrite aupres de la SMABTP.</li><li>Sequestre interets : 150 000 EUR (18 mois de couverture).</li></ul>`,

  `<p><strong>Garanties structurees :</strong></p><ul><li>Privilege de preteur de deniers sur les trois lots fonciers.</li><li>Nantissement du compte sequestre de l'operation.</li><li>Caution solidaire du gerant a hauteur de 250 000 EUR.</li></ul><p>Le montage juridique prevoit un sequestre notarie pour l'integralite des fonds leves, avec liberation progressive sur justificatifs d'avancement des travaux de viabilisation.</p>`,
];

// ─── SWOT Pools ───

const FORCES_POOL = [
  { title: 'Emplacement premium en centre-ville', description: "Le bien est situe dans un quartier tres recherche avec une forte densite de commerces, transports et services. La proximite du metro et du tramway assure une accessibilite optimale." },
  { title: 'Decote d\'acquisition significative', description: "Le prix d'acquisition represente une decote de 15 a 20% par rapport aux prix du marche, offrant une marge de securite confortable pour les investisseurs." },
  { title: 'Porteur experimente avec track-record solide', description: "Le dirigeant cumule plus de 15 ans d'experience et un historique de 8 operations reussies sans aucun defaut. Les references bancaires sont excellentes." },
  { title: 'Garanties robustes et diversifiees', description: "Combinaison hypotheque de 1er rang, caution personnelle et sequestre couvrant les interets. Le ratio garantie/emprunt depasse 120%." },
  { title: 'Marche porteur a forte demande', description: "La zone geographique affiche une hausse des prix de +4% sur 12 mois avec un ratio offre/demande favorable. Le taux de vacance est inferieur a 3%." },
  { title: 'Pre-commercialisation avancee', description: "40% des lots sont deja reserves via des compromis signes, securisant une part significative du chiffre d'affaires previsionnel." },
  { title: 'Duree d\'operation courte', description: "Le cycle d'investissement prevu est de 18 mois, limitant l'exposition aux aleas de marche et accelerant le retour sur investissement." },
  { title: 'Structure financiere equilibree', description: "Repartition saine entre fonds propres (20%), financement participatif (40%) et dette bancaire (40%). Le ratio d'endettement reste maitrise." },
  { title: 'Autorisations administratives obtenues', description: "Le permis de construire est purge de tout recours et l'ensemble des autorisations d'urbanisme sont en place, eliminant le risque reglementaire." },
  { title: 'Potentiel de valorisation patrimoniale', description: "Les elements architecturaux historiques du bien permettent une valorisation premium aupres d'une clientele haut de gamme." },
];

const FAIBLESSES_POOL = [
  { title: 'Budget travaux eleve', description: "Le poste travaux represente 25% du cout total de l'operation, exposant le projet a des risques de depassement budgetaire en cas d'aleas techniques." },
  { title: 'Dependance a un seul porteur', description: "L'operation repose sur une structure mono-dirigeant, ce qui constitue un risque de personne-cle en cas d'incapacite ou d'indisponibilite." },
  { title: 'Levier financier significatif', description: "Le ratio d'endettement global atteint 80%, ce qui reduit la marge de manoeuvre en cas de retard dans la commercialisation." },
  { title: 'Duree des travaux incertaine', description: "Les travaux de rehabilitation sur un immeuble ancien comportent un risque de decouverte d'aleas (amiante, structure) pouvant allonger le calendrier." },
  { title: 'Concentration sur un actif unique', description: "L'integralite de l'investissement porte sur un seul bien immobilier, sans diversification geographique ou typologique." },
  { title: 'Marche local en ralentissement', description: "Les dernieres donnees montrent un leger tassement des volumes de transactions dans le secteur (-8% sur le dernier trimestre)." },
  { title: 'Apport limite du porteur', description: "La part de fonds propres injectes par le porteur (15%) est inferieure au standard du marche (20%), ce qui limite son engagement financier direct." },
  { title: 'Risque de vacance locative temporaire', description: "La livraison de plusieurs programmes concurrents dans le quartier pourrait generer une pression sur les prix et les delais de commercialisation." },
];

const OPPORTUNITES_POOL = [
  { title: 'Projet d\'infrastructure majeur a proximite', description: "L'extension de la ligne de tramway, prevue pour 2027, desservira directement le quartier et devrait generer une hausse des prix de 8 a 12%." },
  { title: 'Dynamique demographique favorable', description: "La metropole enregistre une croissance demographique de +1,5% par an, soutenue par l'attractivite economique et universitaire de la ville." },
  { title: 'Dispositif fiscal avantageux', description: "Le bien est eligible au dispositif Denormandie/Malraux, offrant aux acquereurs finaux des avantages fiscaux significatifs et stimulant la demande." },
  { title: 'Tension du marche locatif', description: "Le taux de vacance dans le secteur est inferieur a 2%, garantissant une absorption rapide des biens mis en location ou en vente." },
  { title: 'Requalification urbaine du quartier', description: "Le programme de renovation urbaine ANRU prevoit 50 M EUR d'investissements publics dans le quartier sur les 5 prochaines annees." },
  { title: 'Hausse tendancielle des prix', description: "Les projections des notaires anticipent une poursuite de la hausse des prix (+3 a 5% par an) dans ce micro-marche, confortant le scenario de sortie." },
  { title: 'Emergence du teletravail', description: "La demande pour des logements plus spacieux avec espace bureau integre est en forte croissance, correspondant exactement au positionnement du projet." },
];

const MENACES_POOL = [
  { title: 'Hausse des taux d\'interet', description: "Une remontee significative des taux directeurs pourrait reduire le pouvoir d'achat des acquereurs finaux et allonger les delais de commercialisation." },
  { title: 'Concurrence de programmes neufs', description: "Plusieurs promoteurs ont depose des permis dans le meme secteur, ce qui pourrait saturer l'offre locale et exercer une pression a la baisse sur les prix." },
  { title: 'Evolution reglementaire defavorable', description: "Le renforcement des normes environnementales (RE2020, DPE) pourrait imposer des travaux supplementaires non budgetes initialement." },
  { title: 'Risque de retournement du marche', description: "Les indicateurs macro-economiques (inflation, chomage) pourraient deteriorer la confiance des acquereurs et impacter les volumes de transactions." },
  { title: 'Aleas de chantier', description: "Sur un batiment ancien, le risque de decouverte d'aleas techniques (amiante, plomb, structure) reste present malgre les diagnostics realises." },
  { title: 'Pression fiscale sur l\'immobilier', description: "L'eventualite d'une reforme de la fiscalite immobiliere (plus-values, IFI) pourrait affecter l'attractivite de l'investissement." },
  { title: 'Delais administratifs', description: "Les procedures d'urbanisme et les recours de tiers peuvent generer des retards significatifs, impactant la rentabilite de l'operation." },
];

// ─── Highlights Pool ───

const HIGHLIGHTS_POOL = [
  { icon: 'mdi:map-marker', title: 'Emplacement strategique', description: 'Centre-ville, proximite transports et commerces' },
  { icon: 'mdi:shield-check', title: 'Garanties solides', description: 'Hypotheque 1er rang + caution personnelle' },
  { icon: 'mdi:trending-up', title: 'Rendement attractif', description: 'Marge brute previsionnelle superieure a 18%' },
  { icon: 'mdi:account-tie', title: 'Porteur experimente', description: 'Plus de 15 ans et 8 operations reussies' },
  { icon: 'mdi:clock-fast', title: 'Cycle court', description: 'Duree previsionnelle de 18 mois' },
  { icon: 'mdi:home-city', title: 'Marche porteur', description: 'Demande soutenue, taux de vacance < 3%' },
  { icon: 'mdi:file-document-check', title: 'Autorisations obtenues', description: 'Permis purge, aucun recours en cours' },
  { icon: 'mdi:cash-multiple', title: 'Apport significatif', description: 'Fonds propres du porteur a 20% du total' },
  { icon: 'mdi:chart-bar', title: 'Pre-commercialisation', description: '40% des lots deja reserves' },
  { icon: 'mdi:office-building', title: 'Actif de qualite', description: 'Immeuble en excellent etat structurel' },
  { icon: 'mdi:bank', title: 'Partenaire bancaire', description: 'Ligne de credit confirmee par le Credit Mutuel' },
  { icon: 'mdi:leaf', title: 'Conformite RE2020', description: 'Performance energetique exemplaire' },
  { icon: 'mdi:scale-balance', title: 'Structure equilibree', description: 'Repartition saine fonds propres / dette' },
  { icon: 'mdi:train', title: 'Transports', description: 'Metro et tramway a moins de 5 minutes a pied' },
];

// ─── Elements Cles Pool ───

const ELEMENTS_CLES_POOL = [
  { title: 'Rentabilite nette superieure au marche', description: "Le taux de marge brut de 19% se situe dans la fourchette haute des operations comparables du marche, offrant un rendement attractif aux investisseurs." },
  { title: 'Ratio garantie/emprunt rassurant', description: "Le LTV (Loan-to-Value) de 65% et la presence d'une hypotheque de 1er rang offrent un niveau de protection eleve pour le capital investi." },
  { title: 'Calendrier maitrise', description: "Le cycle previsionnel de 18 mois est coherent avec le track-record du porteur et les delais observes sur des operations similaires dans le secteur." },
  { title: 'Risque de marche modere', description: "Les fondamentaux du marche local (demande soutenue, faible vacance, hausse des prix) reduisent significativement le risque de commercialisation." },
  { title: 'Porteur solide et engage', description: "L'engagement financier personnel du dirigeant (apport + caution) aligne ses interets avec ceux des investisseurs." },
  { title: 'Point de vigilance : budget travaux', description: "Le poste travaux represente un risque residuel. Le suivi par un maitre d'oeuvre independant et le sequestre de travaux attenuernt ce risque." },
  { title: 'Sortie securisee par la pre-commercialisation', description: "Les compromis deja signes sur 40% des lots offrent une visibilite rassurante sur le chiffre d'affaires de sortie." },
  { title: 'Conformite juridique verifiee', description: "L'ensemble du montage juridique a ete valide par le cabinet Lexence Avocats. Les statuts, contrats et garanties sont conformes aux standards du marche." },
  { title: 'Risque residuel identifie : taux d\'interet', description: "Une hausse des taux pourrait impacter le prix de sortie. Ce risque est attenue par le cycle court de l'operation et la decote d'acquisition." },
  { title: 'Analyse de sensibilite favorable', description: "Meme en degradant le prix de vente de 10%, la marge brute reste positive (9%), demontrant la resilience du montage financier." },
];

// ─── Scoring Comments Pool ───

const SCORING_COMMENTS = [
  [
    'Hypotheque de 1er rang couvrant 120% de l\'emprunt.',
    'Combinaison hypotheque + fiducie offrant une double protection.',
    'LTV eleve a 75%, couverture limite mais acceptable.',
  ],
  [
    'Hypotheque conventionnelle solide, bien structuree.',
    'Fiducie-surete au profit des investisseurs, mecanisme robuste.',
    'Privilege de preteur de deniers, protection standard.',
  ],
  [
    'Apport de 20%, conforme aux standards du marche.',
    'Apport de 15%, leger mais compense par les garanties.',
    'Apport significatif de 25%, engagement fort du porteur.',
  ],
  [
    'Sequestre couvrant 12 mois d\'interets, tres confortable.',
    'Pas de sequestre d\'interets dedie, point de vigilance.',
    'Sequestre de 6 mois, couverture standard.',
  ],
  [
    '40% de pre-commercialisation, niveau rassurant.',
    'Pas de pre-commercialisation a ce stade, risque a suivre.',
    '25% reserves, niveau intermediaire.',
  ],
  [
    'Loyers previsionnels couvrent 1,5x l\'annuite.',
    'Operation de revente, critere non applicable.',
    'Couverture de 1,1x, juste suffisante.',
  ],
  [
    'Decote de 18% par rapport au marche, marge de securite.',
    'Prix conforme au marche, pas de decote notable.',
    'Leger premium de 5%, justifie par la qualite des prestations.',
  ],
  [
    '15 ans d\'experience, 8 operations reussies sans defaut.',
    'Premiere operation du porteur, risque personne-cle.',
    '5 ans d\'experience, 3 operations, profil correct.',
  ],
  [
    'Marge brute de 19%, dans la fourchette haute du marche.',
    'Marge de 12%, correcte mais limitee.',
    'Marge de 23%, excellente rentabilite previsionnelle.',
  ],
  [
    'Duree de 18 mois, cycle court limitant l\'exposition.',
    'Duree de 30 mois, cycle long necessitant vigilance.',
    'Duree de 24 mois, standard pour ce type d\'operation.',
  ],
];

// ─── Profile Presets ───

const PROFILES = {
  strong: { gradeRange: [7, 10], label: 'Projet solide' },
  average: { gradeRange: [4.5, 7.5], label: 'Projet moyen' },
  weak: { gradeRange: [2, 5.5], label: 'Projet risque' },
};

// ─── Main Generator ───

export function generateTestData(profileKey) {
  const profile = PROFILES[profileKey] || PROFILES[pick(Object.keys(PROFILES))];
  const [minGrade, maxGrade] = profile.gradeRange;

  // Rich text fields
  const investissement = pick(INVESTISSEMENT_POOL);
  const porteur_du_projet = pick(PORTEUR_POOL);
  const localisation = pick(LOCALISATION_POOL);
  const structure_financiere = pick(STRUCTURE_FIN_POOL);
  const garanties = pick(GARANTIES_POOL);

  // SWOT
  const forces = pickN(FORCES_POOL, 2, 4);
  const faiblesses = pickN(FAIBLESSES_POOL, 1, 3);
  const opportunites = pickN(OPPORTUNITES_POOL, 2, 3);
  const menaces = pickN(MENACES_POOL, 1, 3);

  // Highlights (min 4, max 6)
  const highlights = pickN(HIGHLIGHTS_POOL, 4, 6);

  // Elements cles (3-5)
  const elements_cles = pickN(ELEMENTS_CLES_POOL, 3, 5);

  // Scoring
  const criteria = CRITERIA.map((_, i) => {
    const grade = randBetween(minGrade, maxGrade);
    const comments = SCORING_COMMENTS[i] || [];
    return {
      grade,
      comment: comments.length > 0 ? pick(comments) : '',
    };
  });

  const weightedSum = criteria.reduce(
    (sum, c, i) => sum + (c.grade ?? 0) * CRITERIA[i].coeff,
    0,
  );
  const finalScore = Math.round(weightedSum * 10) / 10;
  const gradeInfo = getGradeInfo(finalScore);

  return {
    investissement,
    porteur_du_projet,
    localisation,
    structure_financiere,
    garanties,
    forces,
    faiblesses,
    opportunites,
    menaces,
    highlights,
    elements_cles,
    scoring: {
      criteria,
      finalScore,
      grade: gradeInfo.grade,
    },
  };
}

export const PROFILE_OPTIONS = Object.entries(PROFILES).map(([key, val]) => ({
  key,
  label: val.label,
}));
