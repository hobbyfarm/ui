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
    const descY = 160 + titleHeight + 20; // 20pt spacing after title

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const descLines = doc.splitTextToSize(d.description, W - 260);
    doc.text(descLines, W / 2, descY, { align: 'center' });

    // robust description height + spacing
    const lineHeight = doc.getLineHeight(); // pts
    const descHeight = descLines.length * lineHeight;
    const gapAfterDesc = 36; // increase gap (pts)

    // Name (smart shrink up to -20%, else up to 2 controlled breaks)
    doc.setFont('helvetica', 'bold');
    const baseNameFont = 28;
    const nameMaxWidth = W - 260;

    const layout = this.layoutNameSmart(
      doc,
      d.personName,
      baseNameFont,
      nameMaxWidth,
    );

    // place name below description, but keep old 280 floor and avoid footer
    const proposedNameY = descY + descHeight + gapAfterDesc;
    const maxNameY = H - margin - 90;
    const nameY = Math.min(Math.max(280, proposedNameY), maxNameY);

    doc.setFontSize(layout.fontSize);
    doc.text(layout.lines, W / 2, nameY, { align: 'center' });

    // underline under the last rendered line
    const lineH = doc.getLineHeight();
    const lastLine = layout.lines[layout.lines.length - 1];
    const underlineY =
      nameY + (layout.lines.length - 1) * lineH + layout.fontSize * 0.3;
    const underlineW = Math.min(doc.getTextWidth(lastLine) + 40, W - 300);
    doc.setDrawColor(150);
    doc.line(
      (W - underlineW) / 2,
      underlineY,
      (W + underlineW) / 2,
      underlineY,
    );

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

  private layoutNameSmart(
    doc: jsPDF,
    text: string,
    baseFontSize: number,
    maxWidth: number,
  ): { lines: string[]; fontSize: number } {
    // Allow breaks at '@', '.', '-', '_', or space
    const allowedBreak = /[@.\-_ ]/;

    // 1) Try single line with slight shrink (down to 80%)
    doc.setFontSize(baseFontSize);
    const w = doc.getTextWidth(text);
    if (w <= maxWidth) return { lines: [text], fontSize: baseFontSize };

    const requiredScale = maxWidth / w; // < 1 if overflow
    const minScale = 0.8;
    if (requiredScale >= minScale) {
      const scaled = baseFontSize * requiredScale;
      doc.setFontSize(scaled);
      return { lines: [text], fontSize: scaled };
    }

    // 2) Back to base size; insert up to two breaks (max three lines)
    doc.setFontSize(baseFontSize);

    const rtrim = (s: string) => s.replace(/\s+$/, '');
    const ltrim = (s: string) => s.replace(/^\s+/, '');

    // Greedy break: choose the last allowed break that keeps line within width
    const breakOnce = (s: string): { first: string; rest: string | null } => {
      const idx: number[] = [];
      for (let i = 0; i < s.length; i++) {
        if (allowedBreak.test(s[i])) idx.push(i + 1); // break AFTER the char
      }
      if (idx.length === 0) return { first: s, rest: null };

      let chosen = -1;
      for (const pos of idx) {
        const part = rtrim(s.slice(0, pos));
        if (doc.getTextWidth(part) <= maxWidth) chosen = pos;
        else break; // monotonic; later positions will only be wider
      }

      if (chosen === -1) return { first: s, rest: null }; // no usable break before overflow

      const first = rtrim(s.slice(0, chosen));
      const restRaw = s.slice(chosen);
      const rest = restRaw.length ? ltrim(restRaw) : null;
      return { first, rest };
    };

    // First break
    const b1 = breakOnce(text);
    if (!b1.rest) return { lines: [b1.first], fontSize: baseFontSize };

    // If remainder fits, done
    if (doc.getTextWidth(b1.rest) <= maxWidth) {
      return { lines: [b1.first, b1.rest], fontSize: baseFontSize };
    }

    // Second break (third line max)
    const b2 = breakOnce(b1.rest);
    if (!b2.rest)
      return { lines: [b1.first, b2.first], fontSize: baseFontSize };

    return { lines: [b1.first, b2.first, b2.rest], fontSize: baseFontSize };
  }
}
