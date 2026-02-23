import { jsPDF } from 'jspdf';

const PLATFORM_NAME = 'X-Fund';
const PLATFORM_LEGAL_FORM = 'SAS';
const PAYMENT_PROVIDER = 'Lemonway';
const SIGN_PROVIDER = 'Yousign';

const OPERATION_LABELS = {
  promotion_immobiliere: 'promotion immobiliere',
  marchand_de_biens: 'marchand de biens',
  rehabilitation_lourde: 'rehabilitation lourde',
  division_fonciere: 'division fonciere',
  immobilier_locatif: 'immobilier locatif',
  transformation_usage: "transformation d'usage",
  refinancement: 'refinancement',
  amenagement_foncier: 'amenagement foncier',
};

const LEGACY_GUARANTEE_LABELS = [
  { key: 'has_first_rank_mortgage', label: 'Hypotheque de 1er rang' },
  { key: 'has_share_pledge', label: 'Nantissement de parts' },
  { key: 'has_fiducie', label: 'Fiducie' },
  { key: 'has_interest_escrow', label: 'Sequestre des interets' },
  { key: 'has_works_escrow', label: 'Sequestre des travaux' },
  { key: 'has_personal_guarantee', label: 'Caution personnelle' },
  { key: 'has_gfa', label: "Garantie financiere d'achevement" },
  { key: 'has_open_banking', label: 'Open Banking / suivi des flux' },
];

const GUARANTEE_TYPE_LABELS = {
  hypotheque: 'Hypotheque',
  fiducie: 'Fiducie',
  garantie_premiere_demande: 'Garantie a premiere demande',
  caution_personnelle: 'Caution personnelle',
  garantie_corporate: 'Garantie corporate',
  aucune: 'Aucune',
};

const e = (text, bold = false) => ({ text: String(text ?? '-'), bold });

const fmtEur = (cents) => {
  if (cents == null) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
};

const fmtPct = (v) => (v == null ? '-' : `${Number(v).toFixed(2)} %`);

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const normalize = (attrs) => attrs?.attributes || attrs || {};

const collectDurationDays = (start, end) => {
  if (!start || !end) return '-';
  const s = new Date(start);
  const eDate = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(eDate.getTime())) return '-';
  const ms = eDate.getTime() - s.getTime();
  if (ms < 0) return '-';
  return String(Math.round(ms / (24 * 3600 * 1000)));
};

const computeGuaranteeData = (a) => {
  const summary = Array.isArray(a.guarantee_type_summary) ? a.guarantee_type_summary : [];
  if (summary.length > 0) {
    const types = [...new Set(summary.map((g) => GUARANTEE_TYPE_LABELS[g?.type] || g?.type).filter(Boolean))];
    const descParts = summary.map((g) => {
      const label = g?.asset_label || 'Actif';
      const type = GUARANTEE_TYPE_LABELS[g?.type] || g?.type || 'Aucune';
      const ltv = g?.ltv != null ? `${Number(g.ltv).toFixed(1)}%` : '-';
      const score = g?.protection_score != null ? `${Number(g.protection_score).toFixed(0)}%` : '-';
      return `${label}: ${type} (LTV ${ltv}, score ${score})`;
    });
    return {
      type: types.join(', ') || '-',
      description: descParts.join(' ; ') || '-',
    };
  }

  const active = LEGACY_GUARANTEE_LABELS.filter((it) => a[it.key]).map((it) => it.label);
  return {
    type: active.join(', ') || 'Aucune',
    description: active.length > 0 ? `Garanties legacy actives: ${active.join(', ')}` : 'Aucune surete renseignee dans les champs legacy.',
  };
};

const buildDynamic = (projectAttrs) => {
  const a = normalize(projectAttrs);
  const guarantee = computeGuaranteeData(a);

  return {
    platformName: PLATFORM_NAME,
    platformForm: PLATFORM_LEGAL_FORM,
    platformCapital: '-',
    platformRcsCity: a.property_city || '-',
    platformRcsNumber: '-',
    platformAddress: a.property_address || a.property_title || '-',
    platformRepresentative: '-',

    ownerName: a.owner_name || '-',
    ownerForm: a.owner_legal_form || '-',
    ownerRcsCity: a.property_city || '-',
    ownerRcsNumber: '-',
    ownerAddress: a.owner_address || a.property_address || a.property_title || '-',
    ownerRepresentative: a.owner_name || '-',
    ownerFunction: '-',

    projectName: a.title || '-',
    projectNature: OPERATION_LABELS[a.operation_type] || a.operation_type || '-',
    targetAmount: fmtEur(a.total_amount_cents),
    collectDurationDays: collectDurationDays(a.funding_start_date, a.funding_end_date),

    commissionPercent: fmtPct(a.management_fee_percent),
    fixedFees: fmtEur(a.platform_fixed_fee_cents),

    guaranteeType: guarantee.type,
    guaranteeDescription: guarantee.description,

    city: a.property_city || '-',
    date: fmtDate(new Date()),
    paymentProvider: PAYMENT_PROVIDER,
    signatureProvider: SIGN_PROVIDER,
  };
};

export function getContractBlocks(projectAttrs) {
  const d = buildDynamic(projectAttrs);

  return [
    { type: 'h1', text: 'CONVENTION DE PARTENARIAT' },
    { type: 'h2', text: '(Mise en ligne d\'un projet de financement participatif)' },
    { type: 'hr' },

    { type: 'h3', text: 'ENTRE LES SOUSSIGNES' },

    { type: 'p', segments: [e('La societe '), e(d.platformName, true), e(',')] },
    { type: 'p', segments: [e('Societe '), e(d.platformForm, true), e(' au capital de '), e(d.platformCapital, true), e(' EUR,')] },
    { type: 'p', segments: [e('Immatriculee au RCS de '), e(d.platformRcsCity, true), e(' sous le numero '), e(d.platformRcsNumber, true), e(',')] },
    { type: 'p', segments: [e('Dont le siege social est situe '), e(d.platformAddress, true), e(',')] },
    { type: 'p', segments: [e('Dument representee par '), e(d.platformRepresentative, true), e(',')] },
    { type: 'p', segments: [e('Ci-apres denommee '), e('"la Plateforme"', true), e(',')] },

    { type: 'hr' },
    { type: 'p', segments: [e('ET')] },

    { type: 'p', segments: [e('La societe / personne physique '), e(d.ownerName, true), e(',')] },
    { type: 'p', segments: [e(d.ownerForm, true), e(',')] },
    { type: 'p', segments: [e('Immatriculee au RCS de '), e(d.ownerRcsCity, true), e(' sous le numero '), e(d.ownerRcsNumber, true), e(' (le cas echeant),')] },
    { type: 'p', segments: [e('Dont le siege social est situe '), e(d.ownerAddress, true), e(',')] },
    { type: 'p', segments: [e('Representee par '), e(d.ownerRepresentative, true), e(', '), e(d.ownerFunction, true), e(',')] },
    { type: 'p', segments: [e('Ci-apres denommee '), e('"le Porteur de Projet"', true), e(',')] },

    { type: 'hr' },
    { type: 'p', segments: [e('Ci-apres ensemble denommes '), e('"les Parties"', true)] },
    { type: 'hr' },

    { type: 'article', text: 'ARTICLE 1 - OBJET' },
    { type: 'p', segments: [e('La presente convention a pour objet de definir les conditions dans lesquelles la Plateforme autorise la mise en ligne du projet suivant :')] },
    { type: 'li', segments: [e('Nom du projet : '), e(d.projectName, true)] },
    { type: 'li', segments: [e('Nature du projet : '), e(d.projectNature, true)] },
    { type: 'li', segments: [e('Montant cible de financement : '), e(d.targetAmount, true)] },
    { type: 'li', segments: [e('Duree de la collecte : '), e(d.collectDurationDays, true), e(' jours')] },
    { type: 'p', segments: [e('La Plateforme met a disposition une interface permettant la collecte de fonds aupres d\'investisseurs.')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 2 - SELECTION ET VALIDATION DU PROJET' },
    { type: 'p', segments: [e('La Plateforme declare avoir procede a une analyse prealable du projet sur la base des informations fournies par le Porteur de Projet.')] },
    { type: 'p', segments: [e('Le Porteur de Projet reconnait que :')] },
    { type: 'li', segments: [e('La validation du projet ne constitue en aucun cas une garantie de succes de la collecte')] },
    { type: 'li', segments: [e('La Plateforme n\'assume aucune responsabilite quant a la rentabilite du projet')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 3 - OBLIGATIONS DU PORTEUR DE PROJET' },
    { type: 'p', segments: [e('Le Porteur de Projet s\'engage a :')] },
    { type: 'li', segments: [e('Fournir des informations '), e('exactes, completes et sinceres', true)] },
    { type: 'li', segments: [e('Informer la Plateforme de tout changement significatif')] },
    { type: 'li', segments: [e('Utiliser les fonds conformement a l\'objet du projet')] },
    { type: 'li', segments: [e('Respecter l\'ensemble des obligations legales et reglementaires applicables')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 4 - COLLECTE DES FONDS' },
    { type: 'p', segments: [e('La collecte est realisee via un prestataire de services de paiement agree, notamment '), e(d.paymentProvider, true), e('.')] },
    { type: 'p', segments: [e('Les fonds collectes :')] },
    { type: 'li', segments: [e('Sont conserves sur des comptes de paiement au nom des investisseurs')] },
    { type: 'li', segments: [e('Sont bloques jusqu\'a la realisation des conditions de succes de la collecte')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 5 - CONDITIONS DE REALISATION' },
    { type: 'p', segments: [e('La collecte est reputee reussie si :')] },
    { type: 'li', segments: [e('Le montant cible est atteint dans le delai imparti')] },
    { type: 'p', segments: [e('A defaut :')] },
    { type: 'li', segments: [e('Les fonds sont restitues aux investisseurs')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 6 - REMUNERATION DE LA PLATEFORME' },
    { type: 'p', segments: [e('En contrepartie des services fournis, la Plateforme percevra :')] },
    { type: 'li', segments: [e('Une commission de '), e(d.commissionPercent, true), e(' du montant collecte')] },
    { type: 'li', segments: [e('Eventuellement des frais fixes de '), e(d.fixedFees, true)] },
    { type: 'p', segments: [e('Les modalites de paiement sont detaillees en annexe.')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 7 - GARANTIES ET SURETES' },
    { type: 'p', segments: [e('Le Porteur de Projet declare mettre en place les garanties suivantes :')] },
    { type: 'li', segments: [e('Type de garantie : '), e(d.guaranteeType, true)] },
    { type: 'li', segments: [e('Description : '), e(d.guaranteeDescription, true)] },
    { type: 'p', segments: [e('Le Porteur de Projet s\'engage a constituer ces garanties prealablement au deblocage des fonds.')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 8 - SIGNATURE ELECTRONIQUE' },
    { type: 'p', segments: [e('Les documents contractuels lies a l\'investissement seront signes electroniquement via un prestataire tel que '), e(d.signatureProvider, true), e('.')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 9 - RESPONSABILITE' },
    { type: 'p', segments: [e('La Plateforme agit en qualite d\'intermediaire technique.')] },
    { type: 'p', segments: [e('Elle ne saurait etre tenue responsable :')] },
    { type: 'li', segments: [e('De la defaillance du Porteur de Projet')] },
    { type: 'li', segments: [e('Des pertes subies par les investisseurs')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 10 - DUREE' },
    { type: 'p', segments: [e('La presente convention entre en vigueur a compter de sa signature et prend fin a l\'issue complete du projet.')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 11 - RESILIATION' },
    { type: 'p', segments: [e('La Plateforme pourra suspendre ou resilier la convention en cas de :')] },
    { type: 'li', segments: [e('Informations trompeuses')] },
    { type: 'li', segments: [e('Non-respect des obligations contractuelles')] },
    { type: 'li', segments: [e('Risque reglementaire')] },

    { type: 'hr' },
    { type: 'article', text: 'ARTICLE 12 - DROIT APPLICABLE' },
    { type: 'p', segments: [e('La presente convention est soumise au droit francais.')] },
    { type: 'p', segments: [e('Tout litige sera soumis aux juridictions competentes.')] },

    { type: 'hr' },
    { type: 'p', segments: [e('Fait a '), e(d.city, true), e(', le '), e(d.date, true)] },
    { type: 'p', segments: [e('En deux exemplaires originaux')] },

    { type: 'hr' },
    { type: 'p', segments: [e('La Plateforme', true)] },
    { type: 'p', segments: [e('Nom : '), e(d.platformName, true)] },
    { type: 'p', segments: [e('Signature : __________________________')] },

    { type: 'hr' },
    { type: 'p', segments: [e('Le Porteur de Projet', true)] },
    { type: 'p', segments: [e('Nom : '), e(d.ownerName, true)] },
    { type: 'p', segments: [e('Signature : ')] },
    { type: 'anchor', text: '{{s1|signature|180|60}}' },
  ];
}

function wrapSegments(doc, segments, maxWidth, size) {
  doc.setFontSize(size);
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  const words = [];
  segments.forEach((seg) => {
    const parts = String(seg.text).split(/(\s+)/).filter((p) => p.length > 0);
    parts.forEach((p) => words.push({ text: p, bold: !!seg.bold }));
  });

  words.forEach((word) => {
    doc.setFont('helvetica', word.bold ? 'bold' : 'normal');
    const w = doc.getTextWidth(word.text);
    if (currentWidth + w > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [word];
      currentWidth = w;
    } else {
      currentLine.push(word);
      currentWidth += w;
    }
  });

  if (currentLine.length > 0) lines.push(currentLine);
  if (lines.length === 0) lines.push([]);
  return lines;
}

function drawRichLine(doc, x, y, tokens, size) {
  doc.setFontSize(size);
  let cursor = x;
  tokens.forEach((tok) => {
    doc.setFont('helvetica', tok.bold ? 'bold' : 'normal');
    doc.text(tok.text, cursor, y);
    cursor += doc.getTextWidth(tok.text);
  });
}

function ensureSpace(doc, state, neededHeight) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (state.y + neededHeight <= pageHeight - state.bottom) return;
  doc.addPage();
  state.page += 1;
  state.y = state.top;
}

export function generateContractPdf(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  const a = normalize(projectAttrs);
  const title = (a.title || 'projet').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`convention_partenariat_${title}_${date}.pdf`);
  return doc;
}

export function getContractDataUrl(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  return doc.output('datauristring');
}

export function getContractBlob(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  return doc.output('blob');
}

export function getContractBase64(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  // output('datauristring') gives 'data:application/pdf;base64,...'
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

function buildContractDoc(projectAttrs) {
  const blocks = getContractBlocks(projectAttrs);

  const doc = new jsPDF('p', 'mm', 'a4');
  const state = {
    left: 18,
    top: 20,
    bottom: 16,
    width: doc.internal.pageSize.getWidth() - 36,
    y: 20,
    page: 1,
  };

  blocks.forEach((block) => {
    if (block.type === 'hr') {
      ensureSpace(doc, state, 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(state.left, state.y, state.left + state.width, state.y);
      state.y += 4;
      return;
    }

    if (block.type === 'anchor') {
      // Smart anchor for YouSign - rendered in white so it's invisible but detectable
      ensureSpace(doc, state, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(block.text, state.left, state.y);
      doc.setTextColor(0, 0, 0);
      state.y += 10;
      return;
    }

    if (block.type === 'h1') {
      ensureSpace(doc, state, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(block.text, state.left, state.y);
      state.y += 7;
      return;
    }

    if (block.type === 'h2') {
      ensureSpace(doc, state, 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(block.text, state.left, state.y);
      state.y += 7;
      return;
    }

    if (block.type === 'h3') {
      ensureSpace(doc, state, 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(block.text, state.left, state.y);
      state.y += 6;
      return;
    }

    if (block.type === 'article') {
      ensureSpace(doc, state, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(block.text, state.left, state.y);
      state.y += 6;
      return;
    }

    const isBullet = block.type === 'li';
    const baseX = isBullet ? state.left + 5 : state.left;
    const bulletWidth = isBullet ? 5 : 0;
    const size = 10.5;
    const lineHeight = 5.1;

    const lines = wrapSegments(doc, block.segments || [e(block.text || '')], state.width - bulletWidth, size);
    ensureSpace(doc, state, lines.length * lineHeight + 1);

    lines.forEach((line, idx) => {
      if (isBullet && idx === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(size);
        doc.text('*', state.left, state.y);
      }
      drawRichLine(doc, baseX, state.y, line, size);
      state.y += lineHeight;
    });

    state.y += 0.6;
  });

  for (let p = 1; p <= doc.getNumberOfPages(); p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Convention de partenariat - ${PLATFORM_NAME} - Page ${p}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  return doc;
}
