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
    doc.text('ZERTIFIKAT', W / 2, 110, { align: 'center' });

    // Titel
    doc.setTextColor(0);
    doc.setFontSize(22);
    doc.text(d.title, W / 2, 160, { align: 'center', maxWidth: W - 220 });

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const desc = doc.splitTextToSize(d.description, W - 260);
    doc.text(desc, W / 2, 190, { align: 'center' });

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(d.personName, W / 2, 280, { align: 'center' });

    const nameLineW = Math.min(doc.getTextWidth(d.personName) + 40, W - 300);
    doc.setDrawColor(150);
    doc.line((W - nameLineW) / 2, 288, (W + nameLineW) / 2, 288);

    // Date and issuer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(80);
    const footerY = H - margin - 30;
    const dateText = formatDate(d.date, 'dd.MM.yyyy', 'en-US');
    doc.text(`${dateText}`, margin + 50, footerY);

    const issuer = d.issuer ?? '—';
    doc.text(issuer, W - margin - 50, footerY, { align: 'right' });

    doc.save(d.fileName ?? 'zertifikat.pdf');
  }
}
