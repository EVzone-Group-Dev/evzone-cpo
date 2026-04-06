import { Download, Loader } from 'lucide-react';
import { useState } from 'react';
import { generateReportPDF } from '../../utils/pdf/reportPDFTemplate';

interface ExportButtonProps {
  reportData: {
    title: string;
    period: string;
    tenantName?: string;
    summary: Record<string, string | number>;
    details?: Record<string, unknown>;
  };
  format: 'pdf' | 'csv';
}

export function ExportButton({ reportData, format }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        const blob = generateReportPDF(reportData);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        let csv = `Report: ${reportData.title}\n`;
        csv += `Period: ${reportData.period}\n`;
        if (reportData.tenantName) csv += `Organization: ${reportData.tenantName}\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        csv += 'Metric,Value\n';
        Object.entries(reportData.summary).forEach(([key, value]) => {
          csv += `"${key}","${value}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        format === 'pdf'
          ? 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300'
          : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
      }`}
    >
      {isExporting ? (
        <>
          <Loader size={16} className="animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download size={16} />
          Export as {format.toUpperCase()}
        </>
      )}
    </button>
  );
}
