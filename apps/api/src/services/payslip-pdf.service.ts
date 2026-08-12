import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";

type Money = Prisma.Decimal | number | string;

function fmt(value: Money, currency: string): string {
  const n = typeof value === "object" ? Number(value.toString()) : Number(value);
  return `${currency} ${n.toFixed(2)}`;
}

export type PayslipPdfInput = {
  companyName: string;
  employeeName: string;
  employeeCode: string;
  designation?: string | null;
  department?: string | null;
  month: number;
  year: number;
  currency: string;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  earnings: { label: string; amount: Money }[];
  deductions: { label: string; amount: Money }[];
  grossSalary: Money;
  totalDeductions: Money;
  netSalary: Money;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Renders a single-page payslip PDF and returns it as a Buffer. Runs entirely server-side. */
export function generatePayslipPdf(input: PayslipPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text(input.companyName, { align: "left" });
    doc.fontSize(12).font("Helvetica").fillColor("#555").text(
      `Payslip for ${MONTH_NAMES[input.month - 1]} ${input.year}`,
    );
    doc.moveDown(1);
    doc.fillColor("#000");

    doc.fontSize(10).font("Helvetica-Bold").text("Employee Details");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Name: ${input.employeeName}`);
    doc.text(`Employee Code: ${input.employeeCode}`);
    if (input.department) doc.text(`Department: ${input.department}`);
    if (input.designation) doc.text(`Designation: ${input.designation}`);
    doc.text(`Working Days: ${input.workingDays}   Paid Days: ${input.paidDays}   LOP Days: ${input.lopDays}`);
    doc.moveDown(1);

    const colStartX = doc.x;
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2;
    const startY = doc.y;

    doc.font("Helvetica-Bold").fontSize(11).text("Earnings", colStartX, startY);
    doc.font("Helvetica-Bold").fontSize(11).text("Deductions", colStartX + colWidth, startY);
    doc.moveDown(0.5);

    let earningsY = doc.y;
    doc.font("Helvetica").fontSize(10);
    for (const item of input.earnings) {
      doc.text(item.label, colStartX, earningsY, { width: colWidth - 80, continued: false });
      doc.text(fmt(item.amount, input.currency), colStartX + colWidth - 90, earningsY, {
        width: 90,
        align: "right",
      });
      earningsY += 18;
    }

    let deductionsY = startY + 18;
    for (const item of input.deductions) {
      doc.text(item.label, colStartX + colWidth, deductionsY, { width: colWidth - 80 });
      doc.text(fmt(item.amount, input.currency), colStartX + 2 * colWidth - 90, deductionsY, {
        width: 90,
        align: "right",
      });
      deductionsY += 18;
    }

    const afterColumnsY = Math.max(earningsY, deductionsY) + 10;
    doc.moveTo(colStartX, afterColumnsY).lineTo(doc.page.width - doc.page.margins.right, afterColumnsY).stroke();

    let summaryY = afterColumnsY + 10;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Gross Salary", colStartX, summaryY, { width: colWidth - 80 });
    doc.text(fmt(input.grossSalary, input.currency), colStartX + colWidth - 90, summaryY, {
      width: 90,
      align: "right",
    });
    doc.text("Total Deductions", colStartX + colWidth, summaryY, { width: colWidth - 80 });
    doc.text(fmt(input.totalDeductions, input.currency), colStartX + 2 * colWidth - 90, summaryY, {
      width: 90,
      align: "right",
    });

    summaryY += 30;
    doc.fontSize(13).fillColor("#0a5").text(
      `Net Salary Payable: ${fmt(input.netSalary, input.currency)}`,
      colStartX,
      summaryY,
    );
    doc.fillColor("#000");

    doc.moveDown(3);
    doc.fontSize(8).fillColor("#888").text(
      "This is a system-generated payslip and does not require a signature.",
      { align: "center" },
    );

    doc.end();
  });
}
