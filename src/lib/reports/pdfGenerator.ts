/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { AnalysisRecord } from '../../types/api';

export function generatePdfReport(record: AnalysisRecord): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(108, 77, 255); // Primary purple #6C4DFF
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Intelligent API Compatibility Report', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date(record.createdAt).toLocaleString()} | Automated Architecture Audit`, 14, 20);

  y = 38;

  // Overview box
  doc.setFillColor(247, 245, 255); // #F7F5FF
  doc.setDrawColor(218, 210, 254);
  doc.roundedRect(14, y, pageWidth - 28, 36, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42); // Dark navy text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Specification Versions', 20, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Older Version (Baseline):`, 20, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(record.v1Name, 65, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(`Newer Version (Target):`, 20, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.text(record.v2Name, 65, y + 23);

  // Score badge on right side
  const scoreX = pageWidth - 60;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(scoreX, y + 5, 40, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Compatibility Score', scoreX + 5, y + 11);

  doc.setFontSize(16);
  if (record.summary.overallScore >= 80) doc.setTextColor(16, 185, 129); // green
  else if (record.summary.overallScore >= 50) doc.setTextColor(245, 158, 11); // orange
  else doc.setTextColor(239, 68, 68); // red

  doc.setFont('helvetica', 'bold');
  doc.text(`${record.summary.overallScore} / 100`, scoreX + 8, y + 22);

  y += 44;

  // Executive summary counts
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Summary of Detected Changes', 14, y);

  y += 6;
  const colW = (pageWidth - 28) / 4;

  const cards = [
    { label: 'Breaking Changes', count: record.summary.totalBreaking, color: [239, 68, 68] },
    { label: 'Potentially Breaking', count: record.summary.totalPotentiallyBreaking, color: [245, 158, 11] },
    { label: 'Compatible Additions', count: record.summary.totalNonBreaking, color: [16, 185, 129] },
    { label: 'Informational', count: record.summary.totalInformational, color: [54, 133, 255] }
  ];

  cards.forEach((c, idx) => {
    const cx = 14 + idx * colW;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, colW - 3, 16, 1.5, 1.5, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(String(c.count), cx + 4, y + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(c.label, cx + 4, y + 12);
  });

  y += 24;

  // Findings list
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Detailed Findings (${record.findings.length} detected)`, 14, y);

  y += 6;

  record.findings.forEach((finding, index) => {
    // Check if new page needed
    if (y > 255) {
      doc.addPage();
      y = 18;
    }

    const isBreaking = finding.severity === 'BREAKING';
    const isWarning = finding.severity === 'POTENTIALLY_BREAKING';
    const borderColor = isBreaking ? [239, 68, 68] : isWarning ? [245, 158, 11] : [16, 185, 129];

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(14, y, pageWidth - 28, 32, 1.5, 1.5, 'FD');

    // Severity pill
    doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(18, y + 3, 30, 5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(finding.severity.replace('_', ' '), 20, y + 6.5);

    // Finding title and path
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const pathText = `${finding.method ? `[${finding.method}] ` : ''}${finding.path}`;
    doc.text(pathText, 52, y + 6.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const descLines = doc.splitTextToSize(finding.title || finding.description, pageWidth - 42);
    doc.text(descLines.slice(0, 2), 18, y + 13);

    // Impact
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    const impactText = `Impact: ${finding.impact}`;
    const impactLines = doc.splitTextToSize(impactText, pageWidth - 42);
    doc.text(impactLines.slice(0, 1), 18, y + 21);

    // Recommendation
    doc.setTextColor(16, 185, 129);
    const recText = `Fix: ${finding.recommendation}`;
    const recLines = doc.splitTextToSize(recText, pageWidth - 42);
    doc.text(recLines.slice(0, 1), 18, y + 27);

    y += 35;
  });

  // Footer on current page
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Intelligent API Compatibility Analyzer - Confidential Architecture Audit Report', 14, 290);

  // Trigger download
  const filename = `api-compatibility-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function downloadJsonReport(record: AnalysisRecord): void {
  const exportData = {
    reportTitle: 'Intelligent API Compatibility Report',
    exportDate: new Date().toISOString(),
    versions: {
      olderVersion: record.v1Name,
      newerVersion: record.v2Name
    },
    compatibilitySummary: record.summary,
    findings: record.findings,
    aiExplanations: record.aiExplanations || {}
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-compatibility-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
