import PDFDocument from "pdfkit";

/** Escape a CSV field (RFC 4180-ish). */
export function escapeCsvField(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** Build a CSV string from headers + row objects (or arrays). */
export function rowsToCsv(
  headers: string[],
  rows: Array<Record<string, unknown> | unknown[]>,
): string {
  const lines: string[] = [headers.map(escapeCsvField).join(",")];

  for (const row of rows) {
    if (Array.isArray(row)) {
      lines.push(row.map(escapeCsvField).join(","));
    } else {
      lines.push(headers.map((h) => escapeCsvField(row[h])).join(","));
    }
  }

  return lines.join("\n");
}

export type ReportColumn = { key: string; label: string };

/** Generate a simple multi-row report PDF. */
export function generateReportPdf(
  title: string,
  columns: ReportColumn[],
  rows: Array<Record<string, unknown>>,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555")
      .text(`Generated ${new Date().toISOString()} · ${rows.length} row(s)`);
    doc.moveDown(1);
    doc.fillColor("#000");

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = Math.max(60, pageWidth / Math.max(columns.length, 1));

    const drawHeader = () => {
      let x = doc.page.margins.left;
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(9);
      for (const col of columns) {
        doc.text(col.label, x, y, { width: colWidth - 4, continued: false });
        x += colWidth;
      }
      doc.moveDown(0.8);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke("#ccc");
      doc.moveDown(0.4);
    };

    drawHeader();
    doc.font("Helvetica").fontSize(8);

    for (const row of rows) {
      if (doc.y > doc.page.height - 50) {
        doc.addPage();
        drawHeader();
        doc.font("Helvetica").fontSize(8);
      }

      let x = doc.page.margins.left;
      const y = doc.y;
      let maxHeight = 12;

      for (const col of columns) {
        const text = row[col.key] == null ? "" : String(row[col.key]);
        const h = doc.heightOfString(text, { width: colWidth - 4 });
        maxHeight = Math.max(maxHeight, h);
        doc.text(text, x, y, { width: colWidth - 4 });
        x += colWidth;
      }
      doc.y = y + maxHeight + 4;
    }

    doc.end();
  });
}
