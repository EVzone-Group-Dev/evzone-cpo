import { PDFGenerator } from './pdfGenerator';

export interface ReportData {
  title: string;
  period: string;
  tenantName?: string;
  summary: Record<string, string | number>;
  details?: Record<string, unknown>;
}

/**
 * Generate Reports PDF
 */
export function generateReportPDF(data: ReportData): Blob {
  const pdf = new PDFGenerator({
    orientation: 'portrait',
    title: data.title,
  });

  pdf.addHeader(undefined, data.title);
  pdf.addSpacing(5);

  // Report metadata
  pdf.addSectionHeading('Report Details');
  pdf.addText(`Period: ${data.period}`, { size: 10 });
  if (data.tenantName) {
    pdf.addText(`Organization: ${data.tenantName}`, { size: 10 });
  }
  pdf.addText(`Generated: ${new Date().toLocaleString()}`, { size: 10 });

  pdf.addSpacing(10);
  pdf.checkPageBreak(40);

  // Summary section
  pdf.addSectionHeading('Summary');
  const summaryRows = Object.entries(data.summary).map(([key, value]) => [
    key,
    String(value),
  ]);
  pdf.addTable(['Metric', 'Value'], summaryRows);

  pdf.addSpacing(10);
  pdf.checkPageBreak();

  // Additional details if provided
  if (data.details) {
    pdf.addSectionHeading('Details');
    pdf.addText(JSON.stringify(data.details, null, 2), { size: 9 });
  }

  return pdf.getBlob();
}
