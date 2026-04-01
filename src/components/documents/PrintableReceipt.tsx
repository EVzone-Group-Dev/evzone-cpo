import { LOGO_PATHS } from '../../utils/assets';

interface ReceiptItem {
  description: string;
  amount: number;
}

interface PrintableReceiptProps {
  receiptNumber: string;
  timestamp: string;
  tenantName: string;
  customerName: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod?: string;
  transactionId?: string;
}

export function PrintableReceipt({
  receiptNumber,
  timestamp,
  tenantName,
  customerName,
  items,
  total,
  paymentMethod,
  transactionId,
}: PrintableReceiptProps) {
  return (
    <div
      id="receipt-content"
      className="max-w-sm mx-auto bg-white p-6 rounded-lg border border-gray-300 font-mono text-sm"
      style={{ width: '320px' }}
    >
      <div className="text-center mb-4 pb-4 border-b-2 border-gray-300">
        <img
          src={LOGO_PATHS.cpms}
          alt="EVzone CPO"
          className="h-10 mx-auto mb-2"
        />
        <h1 className="font-bold text-lg">RECEIPT</h1>
        <p className="text-xs text-gray-600 mt-1">{tenantName}</p>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-300">
        <div className="flex justify-between mb-1">
          <span className="font-semibold">Receipt #:</span>
          <span>{receiptNumber}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="font-semibold">Date & Time:</span>
          <span>{timestamp}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Customer:</span>
          <span>{customerName}</span>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-300">
        <div className="flex justify-between font-bold mb-2 pb-1 border-b border-gray-200">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between mb-1">
            <span className="flex-1">{item.description}</span>
            <span className="text-right min-w-fit ml-2">
              ${item.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4 pb-4 border-t-2 border-b border-gray-300">
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {paymentMethod && (
        <div className="mb-2">
          <p className="text-xs text-gray-600">
            Payment Method: {paymentMethod}
          </p>
        </div>
      )}

      {transactionId && (
        <div className="mb-4">
          <p className="text-xs text-gray-600">
            Transaction ID: {transactionId}
          </p>
        </div>
      )}

      <div className="text-center pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600 mb-1">
          Thank you for your business!
        </p>
        <p className="text-xs text-gray-600">
          {new Date().toLocaleDateString()}
        </p>
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          #receipt-content {
            border: none;
            box-shadow: none;
            width: 80mm;
          }
        }
      `}</style>
    </div>
  );
}
