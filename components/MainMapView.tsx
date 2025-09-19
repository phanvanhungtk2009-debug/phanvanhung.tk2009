import React from 'react';
import { EnvironmentalReport, ReportStatus } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import AddIcon from './icons/AddIcon';
// Fix: Use named import for HomeIcon as it is a named export.
import { HomeIcon } from './icons/HomeIcon';

interface MainMapViewProps {
  reports: EnvironmentalReport[];
  onSelectReport: (report: EnvironmentalReport) => void;
  onNavigateHome: () => void;
  onStartNewReport: () => void;
}

const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case 'Mới báo cáo':
      return 'text-red-500';
    case 'Đang xử lý':
      return 'text-yellow-500';
    case 'Đã xử lý':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

const MainMapView: React.FC<MainMapViewProps> = ({ reports, onSelectReport, onNavigateHome, onStartNewReport }) => {
  const latitudes = reports.map(r => r.latitude);
  const longitudes = reports.map(r => r.longitude);
  const minLat = Math.min(...latitudes, 16.0);
  const maxLat = Math.max(...latitudes, 16.1);
  const minLng = Math.min(...longitudes, 108.1);
  const maxLng = Math.max(...longitudes, 108.3);

  const latRange = maxLat - minLat || 0.1;
  const lngRange = maxLng - minLng || 0.2;

  const normalizePosition = (lat: number, lng: number) => {
    const top = 95 - ((lat - minLat) / latRange) * 90;
    const left = 5 + ((lng - minLng) / lngRange) * 90;
    return { top: `${Math.max(5, Math.min(95, top))}%`, left: `${Math.max(5, Math.min(95, left))}%` };
  };


  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="rgba(249, 250, 251, 0.5)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-400 text-4xl font-bold -rotate-12 opacity-50 select-none">Bản đồ Đà Nẵng (Mô phỏng)</p>
      </div>

      {reports.map((report) => {
        const { top, left } = normalizePosition(report.latitude, report.longitude);
        return (
           <button
            key={report.id}
            onClick={() => onSelectReport(report)}
            className="absolute transform -translate-x-1/2 -translate-y-full focus:outline-none z-10"
            style={{ top, left }}
            title={`Báo cáo: ${report.aiAnalysis.issueType}`}
          >
            <MapPinIcon className={`w-10 h-10 ${getStatusColor(report.status)} drop-shadow-lg transition-transform hover:scale-125`} />
          </button>
        )
      })}
      
      <div className="absolute top-4 left-4 z-10">
         <button
            onClick={onNavigateHome}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-3 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Quay về trang chủ"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md z-10">
        <h4 className="font-bold text-sm mb-2 text-gray-700">Chú thích</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-red-500" />
            <span className="text-xs text-gray-600">Mới báo cáo</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-600">Đang xử lý</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-600">Đã xử lý</span>
          </div>
        </div>
      </div>
       <button
          onClick={onStartNewReport}
          className="absolute bottom-6 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 z-10"
          aria-label="Báo cáo vấn đề mới"
        >
          <AddIcon className="w-8 h-8" />
        </button>
    </div>
  );
};

export default MainMapView;