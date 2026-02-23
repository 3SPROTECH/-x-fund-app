import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: [26, 26, 46],
  accent: [218, 165, 32],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  dark: [30, 30, 50],
  medium: [100, 100, 120],
  light: [240, 240, 245],
  white: [255, 255, 255],
  bg: [248, 249, 252],
};

const fmt = (v) =>
  v != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)
    : '—';

const fmtCents = (v) =>
  v != null ? fmt(v / 100) : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return '—';
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

const GUARANTEE_LABELS = [
  { key: 'has_first_rank_mortgage', label: 'Hypotheque de 1er rang' },
  { key: 'has_share_pledge', label: 'Nantissement de parts' },
  { key: 'has_fiducie', label: 'Fiducie' },
  { key: 'has_interest_escrow', label: 'Sequestre interets' },
  { key: 'has_works_escrow', label: 'Sequestre travaux' },
  { key: 'has_personal_guarantee', label: 'Caution personnelle' },
  { key: 'has_gfa', label: 'GFA' },
  { key: 'has_open_banking', label: 'Open Banking' },
];

// ====== PDF GENERATION ======

export function generateContractPdf(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  const title = (projectAttrs.title || 'projet').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`contrat_investissement_${title}_${date}.pdf`);
  return doc;
}

export function getContractDataUrl(projectAttrs) {
  const doc = buildContractDoc(projectAttrs);
  return doc.output('datauristring');
}

function buildContractDoc(attrs) {
  const a = attrs.attributes || attrs;
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = W - margin * 2;

  // ====== COVER PAGE ======
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, W, H, 'F');

  // Gold accent strip
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 82, W, 3, 'F');

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('X-FUND', margin, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text("PLATEFORME D'INVESTISSEMENT IMMOBILIER", margin, 38);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("CONTRAT D'INVESTISSEMENT", margin, 105);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.accent);
  doc.text(a.title || 'Projet', margin, 118);

  // Cover info
  const coverInfo = [
    ['Porteur de projet', a.owner_name || '—'],
    ['Localisation', [a.property_title, a.property_city].filter(Boolean).join(' — ') || '—'],
    ["Type d'operation", OPERATION_LABELS[a.operation_type] || a.operation_type || '—'],
    ['Montant total', fmtCents(a.total_amount_cents)],
    ['Duree', a.duration_months ? `${a.duration_months} mois` : '—'],
    ['Date du contrat', new Date().toLocaleDateString('fr-FR')],
  ];

  let cy = 140;
  coverInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 180);
    doc.text(label, margin, cy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(String(value), margin + 60, cy);
    cy += 9;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 130);
  doc.text('Document confidentiel — X-Fund © ' + new Date().getFullYear(), W / 2, H - 10, { align: 'center' });

  // ====== PAGE 2: PARTIES & OBJET ======
  doc.addPage();
  let y = addPageHeader(doc, 'PARTIES & OBJET DU CONTRAT', margin);

  y = addSectionTitle(doc, 'Article 1 — Les Parties', y, margin);

  // Platform
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text('La Plateforme :', margin, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text('X-Fund, plateforme de financement participatif en immobilier,', margin + 35, y + 4);
  doc.text('immatriculee aupres de l\'AMF sous le numero XXXXX.', margin + 35, y + 10);
  y += 18;

  // Owner
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Le Porteur :', margin, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.medium);
  doc.text(a.owner_name || '—', margin + 35, y + 4);
  y += 14;

  // Separator
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  y = addSectionTitle(doc, 'Article 2 — Objet du Projet', y, margin);

  const projectInfo = [
    ['Titre du projet', a.title || '—'],
    ["Type d'operation", OPERATION_LABELS[a.operation_type] || a.operation_type || '—'],
    ['Localisation', [a.property_title, a.property_city].filter(Boolean).join(', ') || '—'],
  ];

  projectInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text(label, margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    doc.text(String(value), margin + 55, y + 4);
    y += 8;
  });

  if (a.description) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('Description :', margin, y + 4);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.medium);
    const lines = doc.splitTextToSize(a.description, contentW);
    doc.text(lines, margin, y + 4);
    y += lines.length * 5 + 4;
  }

  addPageFooter(doc, 2);

  // ====== PAGE 3: CONDITIONS FINANCIERES ======
  doc.addPage();
  y = addPageHeader(doc, 'CONDITIONS FINANCIERES', margin);

  y = addSectionTitle(doc, 'Article 3 — Conditions Financieres', y, margin);

  const finRows = [
    ['Montant total de l\'operation', fmtCents(a.total_amount_cents)],
    ['Prix par part', fmtCents(a.share_price_cents)],
    ['Nombre total de parts', a.total_shares != null ? String(a.total_shares) : '—'],
    ['Fonds propres', fmtCents(a.equity_cents)],
    ['Pret bancaire', fmtCents(a.bank_loan_cents)],
    ['Duree de l\'operation', a.duration_months ? `${a.duration_months} mois` : '—'],
    ['Rendement brut projete', a.gross_yield_percent != null ? `${Number(a.gross_yield_percent).toFixed(2)}%` : '—'],
    ['Rendement net projete', a.net_yield_percent != null ? `${Number(a.net_yield_percent).toFixed(2)}%` : '—'],
    ['Frais de gestion', a.management_fee_percent != null ? `${Number(a.management_fee_percent).toFixed(2)}%` : '—'],
    ['Investissement minimum', fmtCents(a.min_investment_cents)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Element', 'Valeur']],
    body: finRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, font: 'helvetica' },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  y = doc.lastAutoTable.finalY + 12;

  // Guarantees
  y = addSectionTitle(doc, 'Article 4 — Garanties', y, margin);

  const guarRows = GUARANTEE_LABELS.map((g) => [
    g.label,
    a[g.key] ? '✓ Oui' : '✗ Non',
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Garantie', 'Statut']],
    body: guarRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, font: 'helvetica' },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.textColor = data.cell.raw.startsWith('✓') ? COLORS.success : COLORS.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addPageFooter(doc, 3);

  // ====== PAGE 4: CALENDRIER & SIGNATURES ======
  doc.addPage();
  y = addPageHeader(doc, 'CALENDRIER & SIGNATURES', margin);

  y = addSectionTitle(doc, 'Article 5 — Calendrier', y, margin);

  const calRows = [
    ['Date d\'acquisition prevue', fmtDate(a.planned_acquisition_date)],
    ['Date de livraison prevue', fmtDate(a.planned_delivery_date)],
    ['Date de remboursement prevue', fmtDate(a.planned_repayment_date)],
    ['Debut de la collecte', fmtDate(a.funding_start_date)],
    ['Fin de la collecte', fmtDate(a.funding_end_date)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Echeance', 'Date']],
    body: calRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: COLORS.dark, font: 'helvetica' },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  y = doc.lastAutoTable.finalY + 16;

  // Signatures
  y = addSectionTitle(doc, 'Article 6 — Signatures', y, margin);

  const sigBoxW = (contentW - 10) / 2;
  const sigBoxH = 45;

  // Porteur signature box
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 3, 3, 'F');
  doc.setDrawColor(200, 200, 210);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('Le Porteur de Projet', margin + sigBoxW / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text(a.owner_name || '—', margin + sigBoxW / 2, y + 15, { align: 'center' });
  doc.text('Date : _______________', margin + 6, y + 28);
  doc.text('Signature :', margin + 6, y + 36);

  // Platform signature box
  const x2 = margin + sigBoxW + 10;
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(x2, y, sigBoxW, sigBoxH, 3, 3, 'F');
  doc.setDrawColor(200, 200, 210);
  doc.roundedRect(x2, y, sigBoxW, sigBoxH, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('X-Fund', x2 + sigBoxW / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.medium);
  doc.text('Representant habilite', x2 + sigBoxW / 2, y + 15, { align: 'center' });
  doc.text('Date : _______________', x2 + 6, y + 28);
  doc.text('Signature :', x2 + 6, y + 36);

  y += sigBoxH + 15;

  // Legal disclaimer
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.medium);
  const disclaimer = 'Ce contrat est etabli sous reserve de la realisation effective de la collecte de fonds. En cas de non-atteinte du montant minimum de collecte, les fonds seront restitues aux investisseurs. Le porteur de projet s\'engage a respecter l\'ensemble des conditions definies dans le present contrat.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW - 10);
  doc.text(disclaimerLines, margin + 5, y + 6);

  addPageFooter(doc, 4);

  return doc;
}

// ====== HELPERS ======
function addPageHeader(doc, title, margin) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 22, W, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('X-FUND', margin, 10);
  doc.setFontSize(12);
  doc.text(title, W / 2, 14, { align: 'center' });
  return 32;
}

function addSectionTitle(doc, title, y, margin) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, margin, y + 5);
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 7, margin + doc.getTextWidth(title), y + 7);
  return y + 14;
}

function addPageFooter(doc, pageNum) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(18, H - 12, W - 18, H - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.medium);
  doc.text('Document confidentiel — X-Fund', 18, H - 7);
  doc.text(`Page ${pageNum}`, W - 18, H - 7, { align: 'right' });
}
