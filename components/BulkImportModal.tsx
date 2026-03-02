import React, { useState } from 'react';
import { XMarkIcon as XIcon } from './icons/XMarkIcon';
import { CheckCircleIcon as CheckIcon } from './icons/CheckCircleIcon';
import { XCircleIcon as AlertCircleIcon } from './icons/XCircleIcon';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');

  if (!isOpen) return null;

  const handleParse = () => {
    setError(null);
    if (!pastedData.trim()) {
      setError('Vui lòng dán dữ liệu từ bảng tính.');
      return;
    }

    const rows = pastedData.trim().split('\n').map(row => row.split('\t'));
    if (rows.length < 2) {
      setError('Dữ liệu phải bao gồm ít nhất một hàng tiêu đề và một hàng dữ liệu.');
      return;
    }

    const rawHeaders = rows[0].map(h => h.trim());
    
    // Validate headers
    const invalidHeaders = rawHeaders.filter(h => !/^[a-zA-Z0-9_-]+$/.test(h));
    if (invalidHeaders.length > 0) {
      setError(`Tiêu đề chứa ký tự không hợp lệ: ${invalidHeaders.join(', ')}. Chỉ chấp nhận chữ cái, số, dấu gạch ngang (-) và gạch dưới (_).`);
      return;
    }

    const data = rows.slice(1).map(row => {
      const obj: any = {};
      rawHeaders.forEach((header, index) => {
        obj[header] = row[index]?.trim() || '';
      });
      return obj;
    });

    setHeaders(rawHeaders);
    setParsedData(data);
    setStep('preview');
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // In a real app, we'd send this to a bulk import endpoint
      // For this demo, we'll iterate and send to the existing create report endpoint
      // or create a new bulk endpoint if we want to be efficient.
      
      const reportsToImport = parsedData.map(item => ({
        id: `bulk-${Math.random().toString(36).substr(2, 9)}`,
        mediaUrl: item.mediaUrl || 'https://picsum.photos/seed/env/800/600',
        mediaType: item.mediaType || 'image',
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        userDescription: item.description || '',
        status: item.status || 'Báo cáo mới',
        aiAnalysis: {
          issueType: item.issueType || 'Sự cố môi trường',
          description: item.description || '',
          priority: item.priority || 'Trung bình',
          solution: item.solution || 'Đang chờ xử lý',
          isIssuePresent: true
        }
      }));

      // Validate coordinates
      const invalidCoords = reportsToImport.filter(r => isNaN(r.latitude) || isNaN(r.longitude));
      if (invalidCoords.length > 0) {
        throw new Error('Một số hàng có tọa độ (latitude/longitude) không hợp lệ.');
      }

      const response = await fetch('/api/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: reportsToImport }),
      });

      if (response.ok) {
        onImportSuccess();
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Lỗi khi nhập dữ liệu.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nhập dữ liệu hàng loạt</h2>
            <p className="text-sm text-slate-500">Dán dữ liệu từ Google Sheets hoặc Excel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700">
              <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 'paste' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2">Hướng dẫn:</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Hàng đầu tiên phải là tiêu đề (latitude, longitude, issueType, description, priority).</li>
                  <li>Tiêu đề không được chứa ký tự đặc biệt (chỉ dùng a-z, 0-9, -, _).</li>
                  <li>Cột ngày giờ (nếu có) định dạng: YYYY-MM-DD HH:mm:ss.</li>
                  <li>Sao chép vùng dữ liệu từ Excel/Sheets và dán vào ô bên dưới.</li>
                </ul>
              </div>
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Dán dữ liệu tại đây..."
                className="w-full h-64 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none font-mono text-sm resize-none bg-slate-50"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">Xem trước dữ liệu ({parsedData.length} hàng)</h4>
                <button onClick={() => setStep('paste')} className="text-sm text-teal-600 font-bold hover:underline">
                  Quay lại dán dữ liệu
                </button>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="px-4 py-3 border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {parsedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {headers.map(h => (
                          <td key={h} className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50/30">
                    Và {parsedData.length - 10} hàng khác...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
          {step === 'paste' ? (
            <button
              onClick={handleParse}
              className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>Xác nhận nhập dữ liệu</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
