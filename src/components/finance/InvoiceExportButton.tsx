import { Download, Loader } from 'lucide-react';
import { useState } from 'react';
import { generateInvoicePDF } from '../../utils/pdf/invoicePDFTemplate';

interface InvoiceExportButtonProps {
  invoice: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    tenantName: string;
    billTo: {
      name: string;
      email?: string;
      address?: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
  };
}

export function InvoiceExportButton({ invoice }: InvoiceExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = generateInvoicePDF(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export invoice');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300 transition-colors"
    >
      {isExporting ? (
        <>
          <Loader size={14} className="animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download size={14} />
          Export PDF
        </>
      )}
    </button>
  );
}
