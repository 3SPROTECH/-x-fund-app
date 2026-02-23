import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
    primary: [26, 26, 46],       // Deep navy
    accent: [218, 165, 32],      // Gold
    success: [16, 185, 129],     // Emerald
    warning: [245, 158, 11],     // Amber
    danger: [239, 68, 68],       // Red
    dark: [30, 30, 50],
    medium: [100, 100, 120],
    light: [240, 240, 245],
    white: [255, 255, 255],
    bg: [248, 249, 252],
};

const fmt = (v) => v != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v) : '—';
const pct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '—';
const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export function generatePdfReport(reportData, projectAttrs) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = W - margin * 2;
    let y = 0;

    const rd = reportData?.attributes || reportData;
    const report = rd.report_data || {};
    const summary = report.project_summary || {};
    const scores = report.scores || {};
    const fin = rd.financial_metrics || {};
    const risks = rd.risk_factors || {};

    // ====== COVER PAGE ======
    // Background
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, W, H, 'F');

    // Gold accent strip
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 82, W, 3, 'F');

    // Top logo area
    doc.setFillColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('X-FUND', margin, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 200);
    doc.text('PLATEFORME D\'INVESTISSEMENT IMMOBILIER', margin, 38);

    // Title block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('RAPPORT D\'ANALYSE', margin, 105);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.accent);
    doc.text(summary.title || projectAttrs?.title || 'Projet', margin, 118);

    // Info table on cover
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 220);
    const coverInfo = [
        ['Porteur', summary.owner_name || '—'],
        ['Localisation', summary.property_city || '—'],
        ['Type d\'opération', summary.operation_type?.replace(/_/g, ' ') || '—'],
        ['Montant total', fmt(summary.total_amount)],
        ['Durée', summary.duration_months ? `${summary.duration_months} mois` : '—'],
        ['Date du rapport', new Date().toLocaleDateString('fr-FR')],
        ['Analyste', report.analyst_name || '—'],
    ];
    let cy = 140;
    coverInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 180);
        doc.text(label, margin, cy);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(String(value), margin + 60, cy);
        cy += 9;
    });

    // Score gauges on cover
    cy += 15;
    const successScore = toNumber(rd.success_score, 0);
    const riskScore = toNumber(rd.risk_score, 0);

    // Success gauge
    drawGaugeOnPdf(doc, margin + 30, cy + 15, 22, successScore, 'Score de succès', COLORS.success);
    // Risk gauge
    drawGaugeOnPdf(doc, W - margin - 30, cy + 15, 22, riskScore, 'Score de risque', COLORS.danger);

    // Recommendation
    cy += 55;
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, cy, contentW, 14, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Recommandation: ${rd.recommendation || '—'}`, W / 2, cy + 9, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 130);
    doc.text('Document confidentiel — X-Fund © ' + new Date().getFullYear(), W / 2, H - 10, { align: 'center' });

    // ====== PAGE 2: FINANCIAL ANALYSIS ======
    doc.addPage();
    y = addPageHeader(doc, 'ANALYSE FINANCIÈRE', margin);

    // Key metrics cards
    const metrics = [
        { label: 'Montant total', value: fmt(fin.total_amount), color: COLORS.primary },
        { label: 'Rendement brut', value: pct(fin.gross_yield), color: COLORS.success },
        { label: 'Rendement net', value: pct(fin.net_yield), color: COLORS.success },
        { label: 'Fonds propres', value: fmt(fin.equity_amount), color: COLORS.accent },
        { label: 'Prêt bancaire', value: fmt(fin.bank_loan_amount), color: COLORS.warning },
        { label: 'Marge projetée', value: pct(fin.margin_ratio), color: COLORS.primary },
    ];

    const cardW = (contentW - 8) / 3;
    const cardH = 22;
    metrics.forEach((m, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = margin + col * (cardW + 4);
        const ccy = y + row * (cardH + 4);

        doc.setFillColor(...COLORS.bg);
        doc.roundedRect(cx, ccy, cardW, cardH, 2, 2, 'F');
        doc.setDrawColor(230, 230, 235);
        doc.roundedRect(cx, ccy, cardW, cardH, 2, 2, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.medium);
        doc.text(m.label, cx + 4, ccy + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...m.color);
        doc.text(String(m.value), cx + 4, ccy + 17);
    });

    y += Math.ceil(metrics.length / 3) * (cardH + 4) + 10;

    // Cost breakdown table
    y = addSectionTitle(doc, 'Répartition des coûts', y, margin);
    const costData = fin.cost_breakdown || {};
    const costRows = [
        ['Fonds propres', fmt(costData.equity)],
        ['Prêt bancaire', fmt(costData.bank_loan)],
        ['Frais de notaire', fmt(costData.notary_fees)],
        ['Budget travaux', fmt(costData.works_budget)],
        ['Frais financiers', fmt(costData.financial_fees)],
    ];

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Poste', 'Montant']],
        body: costRows,
        theme: 'grid',
        headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 9, font: 'helvetica', fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: COLORS.dark, font: 'helvetica' },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    y = doc.lastAutoTable.finalY + 12;

    // Cost breakdown bar chart
    y = addSectionTitle(doc, 'Répartition visuelle', y, margin);
    const costEntries = Object.entries(costData).filter(([, v]) => v > 0);
    const totalCost = costEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const barColors = [COLORS.accent, COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger];

    costEntries.forEach(([label, value], i) => {
        const barW = (value / totalCost) * (contentW - 55);
        const barY = y + i * 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.medium);
        const labelText = label.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
        doc.text(labelText, margin, barY + 5);

        doc.setFillColor(...(barColors[i % barColors.length]));
        doc.roundedRect(margin + 45, barY, Math.max(barW, 2), 7, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.dark);
        doc.text(fmt(value), margin + 48 + Math.max(barW, 2), barY + 5);
    });

    y += costEntries.length * 10 + 8;
    addPageFooter(doc, 2);

    // ====== PAGE 3: RISK ANALYSIS ======
    doc.addPage();
    y = addPageHeader(doc, 'ANALYSE DES RISQUES', margin);

    const factors = risks.factors || [];
    if (factors.length > 0) {
        y = addSectionTitle(doc, 'Facteurs de risque identifiés', y, margin);

        factors.forEach((factor) => {
            const barY = y;
            const riskLevel = factor.value || 0;
            const barColor = riskLevel > 70 ? COLORS.danger : riskLevel > 40 ? COLORS.warning : COLORS.success;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.dark);
            doc.text(factor.name, margin, barY + 5);

            // Background bar
            doc.setFillColor(230, 230, 235);
            doc.roundedRect(margin + 55, barY, contentW - 90, 7, 1, 1, 'F');

            // Risk bar
            const fillW = (riskLevel / 100) * (contentW - 90);
            doc.setFillColor(...barColor);
            doc.roundedRect(margin + 55, barY, Math.max(fillW, 2), 7, 1, 1, 'F');

            // Value text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...barColor);
            doc.text(`${riskLevel}%`, margin + contentW - 30, barY + 5);

            // Detail
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...COLORS.medium);
            doc.text(String(factor.detail || ''), margin + 55, barY + 14);

            y += 18;
        });

        y += 5;
    }

    // Risk summary box
    doc.setFillColor(255, 245, 245);
    doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentW, 20, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.danger);
    doc.text('Risque moyen:', margin + 5, y + 8);
    doc.setFontSize(14);
    doc.text(pct(risks.average_risk), margin + 5, y + 16);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.success);
    doc.text('Résilience:', margin + contentW / 2, y + 8);
    doc.setFontSize(14);
    doc.text(pct(risks.resilience_score), margin + contentW / 2, y + 16);

    y += 28;

    // ====== GUARANTEE SECTION ======
    const guar = report.guarantee_analysis || {};
    if (guar.details) {
        y = addSectionTitle(doc, 'Garanties', y, margin);

        const guarRows = guar.details.map((g) => [
            g.name,
            g.present ? '✓ Oui' : '✗ Non',
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

        y = doc.lastAutoTable.finalY + 10;
    }

    addPageFooter(doc, 3);

    // ====== PAGE 4: SCORING SUMMARY ======
    doc.addPage();
    y = addPageHeader(doc, 'SYNTHÈSE DES SCORES', margin);

    // Score categories
    const scoreCategories = [
        { label: 'Garanties', value: scores.guarantee || 0, weight: '20%', color: COLORS.accent },
        { label: 'Financier', value: scores.financial || 0, weight: '25%', color: COLORS.success },
        { label: 'Documentation', value: scores.documentation || 0, weight: '15%', color: COLORS.primary },
        { label: 'Marché', value: scores.market || 0, weight: '15%', color: COLORS.warning },
        { label: 'Résilience', value: scores.risk_resilience || 0, weight: '25%', color: COLORS.danger },
    ];

    scoreCategories.forEach((cat) => {
        const barY = y;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text(cat.label, margin, barY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.medium);
        doc.text(`(${cat.weight})`, margin + 35, barY + 5);

        // Background bar
        const barX = margin + 50;
        const barMaxW = contentW - 75;
        doc.setFillColor(230, 230, 235);
        doc.roundedRect(barX, barY, barMaxW, 8, 2, 2, 'F');

        // Fill bar
        const scoreValue = toNumber(cat.value, 0);
        const fillW = (scoreValue / 100) * barMaxW;
        doc.setFillColor(...cat.color);
        doc.roundedRect(barX, barY, Math.max(fillW, 2), 8, 2, 2, 'F');

        // Score text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...cat.color);
        doc.text(`${scoreValue.toFixed(1)}%`, margin + contentW - 18, barY + 6);

        y += 14;
    });

    y += 10;

    // Final score section
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, contentW, 36, 4, 4, 'F');

    // Gold top line
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin + 2, y, contentW - 4, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('SCORE FINAL', W / 2, y + 12, { align: 'center' });

    // Success Score
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text('Succès', margin + 30, y + 22);
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.success);
    doc.text(`${Number(rd.success_score || 0).toFixed(1)}%`, margin + 30, y + 32);

    // Risk Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.accent);
    doc.text('Risque', W - margin - 50, y + 22);
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.danger);
    doc.text(`${Number(rd.risk_score || 0).toFixed(1)}%`, W - margin - 50, y + 32);

    // Recommendation
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(rd.recommendation || '', W / 2, y + 28, { align: 'center' });

    y += 45;

    // Comment section
    if (rd.comment) {
        y = addSectionTitle(doc, 'Commentaire de l\'analyste', y, margin);
        doc.setFillColor(...COLORS.bg);
        doc.roundedRect(margin, y, contentW, 30, 3, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        const lines = doc.splitTextToSize(rd.comment, contentW - 10);
        doc.text(lines, margin + 5, y + 8);
    }

    addPageFooter(doc, 4);

    // Generate file name
    const fileName = `rapport_analyse_${(summary.title || 'projet').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    return doc;
}

// ====== HELPERS ======
function addPageHeader(doc, title, margin) {
    const W = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, W, 22, 'F');

    // Gold accent
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

    // Underline
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

function drawGaugeOnPdf(doc, cx, cy, radius, value, label, color) {
    const safeValue = toNumber(value, 0);
    // Background circle
    doc.setDrawColor(60, 60, 80);
    doc.setLineWidth(3);
    doc.circle(cx, cy, radius, 'S');

    // Value arc (simplified as colored arc)
    const angle = (safeValue / 100) * 360;
    doc.setDrawColor(...color);
    doc.setLineWidth(3.5);

    // Draw arc segments
    const steps = Math.ceil(angle / 5);
    for (let i = 0; i < steps; i++) {
        const a1 = (-90 + (i * angle / steps)) * Math.PI / 180;
        const a2 = (-90 + ((i + 1) * angle / steps)) * Math.PI / 180;
        const x1 = cx + radius * Math.cos(a1);
        const y1 = cy + radius * Math.sin(a1);
        const x2 = cx + radius * Math.cos(a2);
        const y2 = cy + radius * Math.sin(a2);
        doc.line(x1, y1, x2, y2);
    }

    // Center value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...color);
    doc.text(`${safeValue.toFixed(0)}%`, cx, cy + 2, { align: 'center' });

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 220);
    doc.text(label, cx, cy + radius + 8, { align: 'center' });
}
