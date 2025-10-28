import React from 'react';
import { EnvironmentalReport, ReportStatus } from '../types';
import ReportCard from './ReportCard';
import { LocationIcon } from './icons/LocationIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ReportDetailModalProps {
  report: EnvironmentalReport;
  onClose: () => void;
  onUpdateStatus: (reportId: string) => void;
}

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Báo cáo mới':
      return { label: 'Báo cáo mới', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    default:
      return { label: 'Không xác định', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose, onUpdateStatus }) => {
  const statusDetails = getStatusDetails(report.status);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-30 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-details-title"
    >
      <div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
           <div className={`px-3 py-1 text-sm font-bold rounded-full ${statusDetails.bgColor} ${statusDetails.textColor}`}>
              {statusDetails.label}
            </div>
          <h2 id="report-details-title" className="text-xl font-bold text-gray-800">
            Chi tiết báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Cột media */}
            <div className="w-full max-h-[70vh] flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
                {report.mediaType === 'image' ? (
                    <img
                        src={report.mediaUrl}
                        alt="Hình ảnh báo cáo"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <video
                        src={report.mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                    />
                )}
            </div>

            {/* Cột chi tiết */}
            <div className="flex flex-col space-y-6">
              {/* Thông tin người dùng */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Thông tin đã gửi
                </h3>
                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
                  {report.userDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Mô tả của người dùng
                      </p>
                      <p className="text-gray-700">{report.userDescription}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <LocationIcon className="w-4 h-4 mr-1.5" /> Tọa độ GPS
                    </p>
                    <p className="text-gray-700 font-mono text-sm">{`${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Thời gian báo cáo
                    </p>
                    <p className="text-gray-700 text-sm">
                      {report.timestamp.toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phân tích của AI */}
              <div>
                <ReportCard analysis={report.aiAnalysis} />
              </div>
            </div>
          </div>
        </div>

        <footer className="p-4 mt-auto border-t border-gray-200 sticky bottom-0 bg-gray-50/80 backdrop-blur-sm">
            <button
                onClick={() => onUpdateStatus(report.id)}
                className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
                Cập nhật trạng thái (Mô phỏng Admin)
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ReportDetailModal;