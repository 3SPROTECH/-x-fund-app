import { jsPDF } from 'jspdf';

const fmt = (v) =>
  v != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
    : '-';

const fmtCents = (v) => (v != null ? fmt(v / 100) : '-');

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const OPERATION_LABELS = {
  promotion_immobiliere: 'Promotion immobiliere',
  marchand_de_biens: 'Marchand de biens',
  rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere',
  immobilier_locatif: 'Immobilier locatif',
  transformation_usage: "Transformation d'usage",
  refinancement: 'Refinancement',
  amenagement_foncier: 'Amenagement foncier',
};

const EXIT_LABELS = {
  unit_sale: 'Vente a la decoupe',
  block_sale: 'Vente en bloc',
  refinance_exit: 'Sortie par refinancement',
};

const RISK_LABELS = {
  low: 'faible',
  moderate: 'modere',
  high: 'eleve',
  critical: 'tres eleve',
};

const GUARANTEE_TYPE_LABELS = {
  hypotheque: 'Hypotheque',
  fiducie: 'Fiducie',
  garantie_premiere_demande: 'Garantie a premiere demande',
  caution_personnelle: 'Caution personnelle',
  garantie_corporate: 'Garantie corporate',
  aucune: 'Aucune',
};

const LEGACY_GUARANTEE_LABELS = [
  { key: 'has_first_rank_mortgage', label: 'Hypotheque de 1er rang' },
  { key: 'has_share_pledge', label: 'Nantissement de parts' },
  { key: 'has_fiducie', label: 'Fiducie' },
  { key: 'has_interest_escrow', label: 'Sequestre des interets' },
  { key: 'has_works_escrow', label: 'Sequestre des travaux' },
  { key: 'has_personal_guarantee', label: 'Caution personnelle' },
  { key: 'has_gfa', label: "Garantie financiere d'achevement (GFA)" },
  { key: 'has_open_banking', label: 'Open Banking / suivi des flux' },
];

function normalize(attrs) {
  return attrs?.attributes || attrs || {};
}

function normalizeGuaranteeParagraphs(a) {
  const rows = Array.isArray(a.guarantee_type_summary) ? a.guarantee_type_summary : [];

  if (rows.length > 0) {
    return rows.map((g, i) => {
      const type = GUARANTEE_TYPE_LABELS[g?.type] || g?.type || 'Aucune';
      const rank = g?.rank ? `, rang ${String(g.rank).replace(/_/g, ' ')}` : '';
      const ltv = g?.ltv != null ? `${Number(g.ltv).toFixed(2)}%` : '-';
      const score = g?.protection_score != null ? `${Number(g.protection_score).toFixed(0)}%` : '-';
      const risk = RISK_LABELS[g?.risk_level] || g?.risk_level || '-';
      const assetLabel = g?.asset_label || `Actif ${i + 1}`;
      return `Pour l'actif "${assetLabel}", la surete retenue est ${type}${rank}. Le ratio LTV associe est de ${ltv}, pour un score de protection de ${score} et un niveau de risque qualifie de ${risk}.`;
    });
  }

  const active = LEGACY_GUARANTEE_LABELS.filter((item) => !!a[item.key]).map((item) => item.label);
  if (active.length === 0) {
    return [
      "Aucune surete specifique n'a ete renseignee dans les champs legacy. Les garanties detaillees restent celles prevues dans les pieces contractuelles complementaires.",
    ];
  }

  return [
    `Les suretes renseignees dans les champs legacy sont les suivantes : ${active.join(', ')}.`,
  ];
}

export function getContractNarrative(projectAttrs) {
  const a = normalize(projectAttrs);
  const operationType = OPERATION_LABELS[a.operation_type] || a.operation_type || '-';
  const exitScenario = EXIT_LABELS[a.exit_scenario] || a.exit_scenario || '-';
  const location = [a.property_title, a.property_city].filter(Boolean).join(', ') || '-';
  const gross = a.gross_yield_percent != null ? `${Number(a.gross_yield_percent).toFixed(2)}%` : '-';
  const net = a.net_yield_percent != null ? `${Number(a.net_yield_percent).toFixed(2)}%` : '-';
  const mgmtFee = a.management_fee_percent != null ? `${Number(a.management_fee_percent).toFixed(2)}%` : '-';
  const preCom = a.pre_commercialization_percent != null ? `${Number(a.pre_commercialization_percent).toFixed(2)}%` : '-';
  const overallProtection = a.overall_protection_score != null ? `${Number(a.overall_protection_score).toFixed(0)}%` : '-';
  const overallRisk = RISK_LABELS[a.overall_risk_level] || a.overall_risk_level || '-';
  const guarantees = normalizeGuaranteeParagraphs(a);

  return {
    title: "CONTRAT D'INVESTISSEMENT IMMOBILIER",
    reference: `Reference projet : ${a.title || '-'} | Date d'emission : ${fmtDate(new Date())} | Porteur : ${a.owner_name || '-'}`,
    intro:
      "Le present contrat est etabli sous forme de texte continu afin de decrire de facon exhaustive les engagements des parties, les parametres economiques de l'operation, les garanties associees et les conditions de suivi applicables pendant toute la duree de vie du projet.",
    sections: [
      {
        heading: 'ARTICLE 1 - IDENTIFICATION DES PARTIES',
        paragraphs: [
          `Entre la plateforme X-Fund, agissant en qualite d'operateur de la collecte, et le porteur de projet "${a.owner_name || '-'}", il est convenu ce qui suit.`,
          `Le present contrat est etabli pour le projet "${a.title || '-'}" et prend effet a compter de sa date de signature par les parties.`,
        ],
      },
      {
        heading: "ARTICLE 2 - OBJET ET PERIMETRE DE L'OPERATION",
        paragraphs: [
          `Le projet porte sur une operation de type "${operationType}", localisee a "${location}".`,
          a.description
            ? `Description declaree par le porteur : ${a.description}`
            : "Aucune description narrative n'a ete fournie dans les donnees transmises.",
        ],
      },
      {
        heading: 'ARTICLE 3 - DISPOSITIF FINANCIER ET ECONOMIQUE',
        paragraphs: [
          `Le montant total cible de l'operation est fixe a ${fmtCents(a.total_amount_cents)}, divise en ${a.total_shares ?? '-'} parts au prix unitaire de ${fmtCents(a.share_price_cents)}.`,
          `Le montant minimum de souscription est de ${fmtCents(a.min_investment_cents)} et le plafond individuel est de ${fmtCents(a.max_investment_cents)}.`,
          `La structure financiere previsionnelle declaree comprend ${fmtCents(a.equity_cents)} de fonds propres et ${fmtCents(a.bank_loan_cents)} de financement bancaire, avec des frais de notaire de ${fmtCents(a.notary_fees_cents)}, un budget travaux de ${fmtCents(a.works_budget_cents)} et des frais financiers de ${fmtCents(a.financial_fees_cents)}.`,
          `Le rendement brut previsionnel est de ${gross}, le rendement net previsionnel est de ${net}, et les frais de gestion contractuels sont fixes a ${mgmtFee}.`,
          `La periode de collecte est fixee du ${fmtDate(a.funding_start_date)} au ${fmtDate(a.funding_end_date)}. La duree operationnelle previsionnelle est de ${a.duration_months ? `${a.duration_months} mois` : '-'}.`,
        ],
      },
      {
        heading: 'ARTICLE 4 - GARANTIES, SURETES ET COUVERTURE DU RISQUE',
        paragraphs: [
          `Le niveau de protection global calcule est de ${overallProtection}, avec un niveau de risque global qualifie de ${overallRisk}.`,
          "Les garanties ci-dessous constituent un element substantiel de la decision d'investissement et de la surveillance du projet.",
          ...guarantees,
        ],
      },
      {
        heading: 'ARTICLE 5 - EXECUTION, CALENDRIER ET OBLIGATIONS DE REPORTING',
        paragraphs: [
          `Le scenario de sortie privilegie est : ${exitScenario}. Le taux de pre-commercialisation declare est de ${preCom}.`,
          `Les jalons previsionnels sont les suivants : acquisition au ${fmtDate(a.planned_acquisition_date)}, livraison au ${fmtDate(a.planned_delivery_date)} et remboursement au ${fmtDate(a.planned_repayment_date)}.`,
          "Le porteur s'oblige a informer sans delai la plateforme de tout evenement susceptible d'affecter le calendrier, le budget ou la rentabilite projetee.",
          "Le porteur garantit la sincerite, l'exactitude et le caractere complet des informations transmises dans le dossier.",
          "Le porteur autorise la plateforme et ses mandataires a verifier les pieces justificatives et a demander tout document complementaire necessaire au suivi du risque.",
          "En cas d'ecart significatif entre previsions et execution, le porteur s'engage a proposer des mesures correctives documentees et un plan d'action calendrier.",
          "La plateforme conserve un droit de suspension de communication publique en cas d'information incomplete, incoherente ou trompeuse.",
        ],
      },
      {
        heading: 'ARTICLE 6 - DECLARATIONS, RESPONSABILITES ET CLAUSES FINALES',
        paragraphs: [
          "Le present document constitue un cadre contractuel d'investissement et doit etre lu conjointement avec les conditions generales de la plateforme, les annexes financieres et les pieces juridiques du projet.",
          "Tout litige relatif a son interpretation ou a son execution releve des juridictions competentes du ressort convenu dans les conditions generales applicables.",
          "En cas de contradiction entre le present contrat et une annexe datee et signee ulterieurement, l'annexe expressement qualifiee de modificative prevale.",
          "Le porteur reconnait que les donnees utilisees dans ce contrat proviennent de la base de donnees projet et des declarations effectuees via la plateforme. Toute modification substantielle posterieure a la date d'emission impose la production d'un avenant ecrit et date.",
        ],
      },
      {
        heading: 'ARTICLE 7 - SIGNATURES',
        paragraphs: [
          `Fait pour valoir ce que de droit, entre X-Fund et ${a.owner_name || '-'}, pour le projet "${a.title || '-'}".`,
          'Date de signature porteur : ________________________________',
          'Signature porteur : ________________________________________',
          'Date de signature plateforme : ______________________________',
          'Signature representant X-Fund : _____________________________',
        ],
      },
    ],
  };
}

function ensureSpace(doc, state, neededHeight) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (state.y + neededHeight <= pageHeight - state.bottom) return;
  doc.addPage();
  state.page += 1;
  state.y = state.top;
}

function writeHeading(doc, state, text) {
  ensureSpace(doc, state, 12);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(text, state.left, state.y);
  state.y += 8;
}

function writeParagraph(doc, state, text, opts = {}) {
  const size = opts.size || 11;
  const lineHeight = opts.lineHeight || 5.5;
  const style = opts.bold ? 'bold' : 'normal';

  doc.setFont('times', style);
  doc.setFontSize(size);

  const lines = doc.splitTextToSize(String(text), state.width);
  const h = lines.length * lineHeight + 1;
  ensureSpace(doc, state, h);
  doc.text(lines, state.left, state.y);
  state.y += h;
}

function writeFooter(doc, page) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text(`Contrat d'investissement X-Fund - Page ${page}`, w / 2, h - 10, { align: 'center' });
}

export function generateContractPdf(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  const a = normalize(projectAttrs);
  const title = (a.title || 'projet').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`contrat_investissement_${title}_${date}.pdf`);
  return doc;
}

export function getContractDataUrl(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  return doc.output('datauristring');
}

function buildContractDoc(projectAttrs) {
  const narrative = getContractNarrative(projectAttrs);

  const doc = new jsPDF('p', 'mm', 'a4');
  const state = {
    left: 18,
    top: 22,
    bottom: 18,
    width: doc.internal.pageSize.getWidth() - 36,
    y: 22,
    page: 1,
  };

  writeHeading(doc, state, narrative.title);
  writeParagraph(doc, state, narrative.reference, { size: 10, lineHeight: 5.2 });
  writeParagraph(doc, state, narrative.intro, { size: 11, lineHeight: 5.6 });

  narrative.sections.forEach((section) => {
    writeHeading(doc, state, section.heading);
    section.paragraphs.forEach((paragraph) => {
      writeParagraph(doc, state, paragraph, { size: 11, lineHeight: 5.6 });
    });
  });

  for (let p = 1; p <= doc.getNumberOfPages(); p += 1) {
    doc.setPage(p);
    writeFooter(doc, p);
  }

  return doc;
}
