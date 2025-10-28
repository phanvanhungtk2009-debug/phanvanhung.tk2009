import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { EnvironmentalReport, ReportStatus } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { MapPinIcon } from './icons/MapPinIcon';

// Định nghĩa màu sắc cho các trạng thái báo cáo
const statusColors: Record<ReportStatus, string> = {
  'Báo cáo mới': '#ef4444', // red-500
  'Đang xử lý': '#f59e0b', // amber-500
  'Đã xử lý': '#22c55e', // green-500
};

// Hàm tạo SVG cho biểu tượng ghim bản đồ với màu động
const getIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="48px" height="48px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 004.6-5.462c.983-1.627 1.83-3.368 2.388-5.142.558-1.773.83-3.647.83-5.542 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.895.272 3.77.83 5.542.558 1.773 1.405 3.515 2.388 5.142a16.975 16.975 0 004.6 5.462zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
  </svg>
`;

// Hàm tạo biểu tượng Leaflet tùy chỉnh
const createCustomIcon = (status: ReportStatus) => {
  const color = statusColors[status] || '#6b7280'; // Mặc định màu xám
  return L.divIcon({
    html: getIconSVG(color),
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -50],
  });
};

interface EnvironmentalMapViewProps {
  reports: EnvironmentalReport[];
  onNavigateHome: () => void;
  onSelectReport: (report: EnvironmentalReport) => void;
}

const EnvironmentalMapView: React.FC<EnvironmentalMapViewProps> = ({ reports, onNavigateHome, onSelectReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 108.2022], // Trung tâm Đà Nẵng
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Cập nhật các ghim đánh dấu
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Một khoảng trễ ngắn để đảm bảo vùng chứa bản đồ có kích thước trước khi làm mới.
    // Điều này buộc bản đồ phải tính toán lại kích thước của nó, khắc phục các sự cố render
    // khi kích thước của vùng chứa thay đổi (ví dụ: khi chuyển đổi chế độ xem).
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();

      markersRef.current!.clearLayers();

      reports.forEach(report => {
        const marker = L.marker([report.latitude, report.longitude], {
          icon: createCustomIcon(report.status),
        });

        marker.bindPopup(`<b>${report.aiAnalysis.issueType}</b><br>${report.status}`);
        
        marker.on('click', () => {
          onSelectReport(report);
          mapRef.current?.flyTo([report.latitude, report.longitude], 16);
        });

        markersRef.current!.addLayer(marker);
      });
      
      // Điều chỉnh chế độ xem bản đồ để vừa với tất cả các báo cáo
      if (reports.length > 0) {
        const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
        if (bounds.isValid()) {
          mapRef.current!.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } else {
        mapRef.current!.flyTo([16.0544, 108.2022], 13);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [reports, onSelectReport]);

  return (
    // SỬA LỖI: Chuyển sang định vị tuyệt đối để đảm bảo vùng chứa bản đồ lấp đầy thành phần cha.
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Nút điều hướng */}
      <div className="absolute top-4 left-4 z-10">
         <button
            onClick={onNavigateHome}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Về trang chủ"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
      </div>

      {/* Chú giải */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md z-10">
        <h4 className="font-bold text-sm mb-2 text-gray-700">Chú giải</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Báo cáo mới']}} />
            <span className="text-xs text-gray-600">Báo cáo mới</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Đang xử lý']}} />
            <span className="text-xs text-gray-600">Đang xử lý</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Đã xử lý']}} />
            <span className="text-xs text-gray-600">Đã xử lý</span>
          </div>
        </div>
      </div>
      
      {/* Lớp phủ tiêu đề */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg text-center w-11/12 max-w-md pointer-events-none">
        <h3 className="text-lg font-bold text-indigo-700">Bản đồ Môi trường</h3>
        <p className="text-sm text-gray-600">Khám phá các điểm nóng môi trường do cộng đồng báo cáo.</p>
      </div>
    </div>
  );
};

export default EnvironmentalMapView;