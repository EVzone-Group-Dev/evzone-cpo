import { PDFGenerator } from './pdfGenerator';
import type { WhiteLabelConfigV1 } from '@/core/types/branding';

export interface ReceiptData {
  receiptNumber: string;
  timestamp: string;
  tenantName: string;
  customerName: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  total: number;
  paymentMethod?: string;
  transactionId?: string;
  brandingConfig?: WhiteLabelConfigV1;
}

/**
 * Generate Receipt PDF (compact format)
 */
export function generateReceiptPDF(data: ReceiptData): Blob {
  const pdf = new PDFGenerator({
    orientation: 'portrait',
    format: 'a4',
    brandingConfig: data.brandingConfig,
  });

  pdf.addHeader(
    undefined,
    data.brandingConfig?.branding.shortName
      ? `${data.brandingConfig.branding.shortName} RECEIPT`
      : 'RECEIPT',
  );
  pdf.addSpacing(3);

  // Receipt info
  pdf.addText(`Receipt #: ${data.receiptNumber}`, { bold: true });
  pdf.addText(`Date & Time: ${data.timestamp}`);
  pdf.addText(`Organization: ${data.tenantName}`);
  pdf.addText(`Customer: ${data.customerName}`);

  pdf.addSpacing(8);

  // Items
  const itemRows = data.items.map((item) => [
    item.description,
    `$${item.amount.toFixed(2)}`,
  ]);

  pdf.addTable(['Item', 'Amount'], itemRows);

  pdf.addSpacing(8);

  // Total
  const doc = pdf.getDocument();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total: $${data.total.toFixed(2)}`, 10, pdf.getCurrentY());

  if (data.paymentMethod) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Payment: ${data.paymentMethod}`, 10, pdf.getCurrentY() + 8);
  }

  if (data.transactionId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Transaction ID: ${data.transactionId}`, 10, pdf.getCurrentY() + 4);
  }

  if (data.brandingConfig?.support.email) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Support: ${data.brandingConfig.support.email}`, 10, pdf.getCurrentY() + 12);
  }

  return pdf.getBlob();
}
