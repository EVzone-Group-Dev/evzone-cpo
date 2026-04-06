import { PDFGenerator } from './pdfGenerator';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  tenantName: string;
  billTo: {
    name: string;
    email?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(data: InvoiceData): Blob {
  const pdf = new PDFGenerator({
    orientation: 'portrait',
    title: `Invoice ${data.invoiceNumber}`,
  });

  pdf.addHeader(undefined, 'INVOICE');
  pdf.addSpacing(3);

  // Invoice header info
  pdf.addText(`Invoice #: ${data.invoiceNumber}`, { bold: true });
  pdf.addText(`Organization: ${data.tenantName}`);
  pdf.addText(`Issue Date: ${data.issueDate}`);
  pdf.addText(`Due Date: ${data.dueDate}`);

  pdf.addSpacing(8);
  pdf.checkPageBreak(50);

  // Bill To section
  pdf.addSectionHeading('Bill To');
  pdf.addText(data.billTo.name, { bold: true });
  if (data.billTo.email) {
    pdf.addText(data.billTo.email);
  }
  if (data.billTo.address) {
    pdf.addText(data.billTo.address);
  }

  pdf.addSpacing(8);
  pdf.checkPageBreak(60);

  // Line items table
  const itemRows = data.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.amount.toFixed(2)}`,
  ]);

  pdf.addTable(
    ['Description', 'Qty', 'Unit Price', 'Amount'],
    itemRows,
    { columnWidths: [80, 25, 35, 35] }
  );

  pdf.addSpacing(10);

  // Totals section
  const doc = pdf.getDocument();
  const marginLeft = 10;
  let totalY = pdf.getCurrentY();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, marginLeft, totalY);
  totalY += 8;

  if (data.tax) {
    doc.text(`Tax: $${data.tax.toFixed(2)}`, marginLeft, totalY);
    totalY += 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total: $${data.total.toFixed(2)}`, marginLeft, totalY);

  pdf.addSpacing(15);

  // Notes
  if (data.notes) {
    pdf.checkPageBreak(20);
    pdf.addSectionHeading('Notes');
    pdf.addText(data.notes);
  }

  return pdf.getBlob();
}
