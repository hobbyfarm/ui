// src/app/pdf/pdf.service.ts
import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface CertificateData {
  fileName?: string;
  title: string;
  description: string;
  personName: string;
  date: Date;
  issuer?: string;
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  generateCertificate(d: CertificateData) {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
      orientation: 'landscape',
    });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const margin = 36;
    const primary = { r: 30, g: 64, b: 175 }; // Blue
    const accent = { r: 234, g: 179, b: 8 }; // Yellow

    //Borders
    doc.setDrawColor(primary.r, primary.g, primary.b);
    doc.setLineWidth(2);
    doc.roundedRect(
      margin,
      margin,
      W - margin * 2,
      H - margin * 2,
      10,
      10,
      'S',
    );
    doc.setLineWidth(0.6);
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.roundedRect(
      margin + 10,
      margin + 10,
      W - (margin + 10) * 2,
      H - (margin + 10) * 2,
      8,
      8,
      'S',
    );

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(34);
    doc.text('CERTIFICATE OF ATTENDANCE', W / 2, 110, { align: 'center' });

    // Titel
    doc.setTextColor(0);
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(d.title, W - 220);
    doc.text(titleLines, W / 2, 160, { align: 'center' });

    // Calculate Y position for description dynamically
    const titleHeight = titleLines.length * doc.getLineHeight();
    let descY = 160 + titleHeight + 20; // 20pt spacing after title

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const descLines = doc.splitTextToSize(d.description, W - 260);
    doc.text(descLines, W / 2, descY, { align: 'center' });

    // robust description height + spacing
    const lineHeight = doc.getLineHeight(); // pts
    const descHeight = descLines.length * lineHeight;
    const gapAfterDesc = 36; // increase gap (pts)

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    const proposedNameY = descY + descHeight + gapAfterDesc;
    const maxNameY = H - margin - 90; // keep clear of footer
    const nameY = Math.min(Math.max(280, proposedNameY), maxNameY);
    doc.text(d.personName, W / 2, nameY, { align: 'center' });

    // underline under the name
    const nameLineW = Math.min(doc.getTextWidth(d.personName) + 40, W - 300);
    doc.setDrawColor(150);
    const underlineY = nameY + 8;
    doc.line((W - nameLineW) / 2, underlineY, (W + nameLineW) / 2, underlineY);

    // Date and issuer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(80);
    const footerY = H - margin - 30;
    const dateText = formatDate(d.date, 'dd.MM.yyyy', 'en-US');
    doc.text(`${dateText}`, margin + 50, footerY);

    const issuer = d.issuer ?? '—';
    doc.text(issuer, W - margin - 50, footerY, { align: 'right' });

    doc.save(d.fileName ?? 'certificate.pdf');
  }
}
