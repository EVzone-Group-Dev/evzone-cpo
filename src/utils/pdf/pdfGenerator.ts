import jsPDF from 'jspdf';

export interface PDFOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

/**
 * Base PDF generator with branding
 */
export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;

  constructor(options: PDFOptions = {}) {
    const { orientation = 'portrait', format = 'a4' } = options;
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = 15; // Start below header
  }

  /**
   * Add header with logo and company name
   */
  addHeader(_logoPath?: string, title?: string): this {
    const marginLeft = 10;
    const marginRight = 10;
    const headerHeight = 20;

    // Add subtle background line
    this.doc.setDrawColor(63, 185, 80); // EVzone green (#3fb950)
    this.doc.line(
      marginLeft,
      headerHeight,
      this.pageWidth - marginRight,
      headerHeight
    );

    // Add title or company name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(title || 'EVzone CPO', marginLeft, 12);

    this.currentY = headerHeight + 5;
    return this;
  }

  /**
   * Add footer with page number and date
   */
  addFooter(): this {
    const marginLeft = 10;
    const marginRight = 10;
    const pageCount = this.doc.getNumberOfPages();

    const footerY = this.pageHeight - 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);

    // Page number
    this.doc.text(
      `Page ${pageCount}`,
      this.pageWidth - marginRight,
      footerY,
      { align: 'right' }
    );

    // Generated date
    const generatedDate = new Date().toLocaleDateString();
    this.doc.text(
      `Generated: ${generatedDate}`,
      marginLeft,
      footerY
    );

    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    return this;
  }

  /**
   * Add a section heading
   */
  addSectionHeading(text: string, spacing = 5): this {
    this.currentY += spacing;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(text, 10, this.currentY);
    this.currentY += 8;
    return this;
  }

  /**
   * Add body text with automatic wrapping
   */
  addText(text: string, options: { bold?: boolean; size?: number } = {}): this {
    const { bold = false, size = 10 } = options;
    const marginLeft = 10;
    const marginRight = 10;
    const width = this.pageWidth - marginLeft - marginRight;

    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);

    const lines = this.doc.splitTextToSize(text, width);
    this.doc.text(lines, marginLeft, this.currentY);

    this.currentY += lines.length * 5 + 3;
    return this;
  }

  /**
   * Add a table
   */
  addTable(
    columns: string[],
    rows: (string | number)[][],
    options: { columnWidths?: number[] } = {}
  ): this {
    const marginLeft = 10;
    const colWidth = (this.pageWidth - 20) / columns.length;
    const actualColWidths = options.columnWidths || Array(columns.length).fill(colWidth);

    // Header row
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setFillColor(63, 185, 80); // EVzone green
    this.doc.setTextColor(255, 255, 255);

    let x = marginLeft;
    columns.forEach((col, idx) => {
      this.doc.rect(x, this.currentY - 4, actualColWidths[idx], 6, 'F');
      this.doc.text(col, x + 2, this.currentY);
      x += actualColWidths[idx];
    });

    this.currentY += 8;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');

    // Data rows
    rows.forEach((row) => {
      x = marginLeft;
      row.forEach((cell, idx) => {
        this.doc.text(String(cell), x + 2, this.currentY);
        x += actualColWidths[idx];
      });
      this.currentY += 6;
    });

    return this;
  }

  /**
   * Add spacing
   */
  addSpacing(amount = 5): this {
    this.currentY += amount;
    return this;
  }

  /**
   * Check if we need a new page
   */
  checkPageBreak(minHeight = 30): this {
    if (this.currentY + minHeight > this.pageHeight - 10) {
      this.doc.addPage();
      this.currentY = 15;
    }
    return this;
  }

  /**
   * Get the current Y position
   */
  getCurrentY(): number {
    return this.currentY;
  }

  /**
   * Finalize and download PDF
   */
  download(filename = 'document.pdf'): void {
    this.addFooter();
    this.doc.save(filename);
  }

  /**
   * Get PDF as blob for upload or preview
   */
  getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }

  /**
   * Get the jsPDF instance for advanced customization
   */
  getDocument(): jsPDF {
    return this.doc;
  }
}
