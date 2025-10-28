import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { EnvironmentalReport, ReportStatus } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import AddIcon from './icons/AddIcon';
import { HomeIcon } from './icons/HomeIcon';
import MapSearch from './MapSearch';

interface MainMapViewProps {
  reports: EnvironmentalReport[];
  onSelectReport: (report: EnvironmentalReport) => void;
  onNavigateHome: () => void;
  onStartNewReport: () => void;
  selectedReport: EnvironmentalReport | null;
  initialViewState: { center: [number, number]; zoom: number };
  onViewChange: (center: L.LatLng, zoom: number) => void;
}

const statusColors: Record<ReportStatus, string> = {
  'Báo cáo mới': '#ef4444', // red-500 from Tailwind
  'Đang xử lý': '#f59e0b', // amber-500 from Tailwind (yellow was too light)
  'Đã xử lý': '#22c55e', // green-500 from Tailwind
};

// Hàm tạo chuỗi SVG cho ghim bản đồ với màu động
const getIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="48px" height="48px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 004.6-5.462c.983-1.627 1.83-3.368 2.388-5.142.558-1.773.83-3.647.83-5.542 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.895.272 3.77.83 5.542.558 1.773 1.405 3.515 2.388 5.142a16.975 16.975 0 004.6 5.462zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
  </svg>
`;

// Hàm tạo icon Leaflet tùy chỉnh
const createCustomIcon = (status: ReportStatus) => {
  const color = statusColors[status] || '#6b7280'; // Mặc định màu xám
  return L.divIcon({
    html: getIconSVG(color),
    className: '', // Quan trọng để ghi đè các kiểu mặc định của leaflet
    iconSize: [48, 48],
    iconAnchor: [24, 48], // Điểm của icon sẽ tương ứng với vị trí của marker
    popupAnchor: [0, -50] // Điểm mà popup sẽ mở ra so với iconAnchor
  });
};


const MainMapView: React.FC<MainMapViewProps> = ({ reports, onSelectReport, onNavigateHome, onStartNewReport, selectedReport, initialViewState, onViewChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const isInitialLoadRef = useRef(true); // Cờ để khớp với các giới hạn ban đầu

  // Khởi tạo bản đồ
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialViewState.center, // Sử dụng state ban đầu từ props
        zoom: initialViewState.zoom,     // Sử dụng state ban đầu từ props
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Lắng nghe các chuyển động của bản đồ để lưu state
      map.on('moveend', () => {
        if (mapRef.current) { // Đảm bảo bản đồ tồn tại
          onViewChange(mapRef.current.getCenter(), mapRef.current.getZoom());
        }
      });

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    // Dọn dẹp khi unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Mảng phụ thuộc rỗng đảm bảo điều này chỉ chạy một lần khi mount

  // Cập nhật markers khi danh sách báo cáo thay đổi
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    reports.forEach(report => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: createCustomIcon(report.status),
      });

      marker.bindPopup(`<b>${report.aiAnalysis.issueType}</b><br>${report.status}`);
      
      marker.on('click', () => {
        onSelectReport(report);
      });

      markersRef.current?.addLayer(marker);
    });
  }, [reports, onSelectReport]);

  // Điều chỉnh chế độ xem bản đồ
  useEffect(() => {
    if (!mapRef.current) return;

    // Nếu một báo cáo cụ thể được chọn, hãy bay đến đó. Điều này được ưu tiên.
    if (selectedReport) {
      mapRef.current.flyTo(
        [selectedReport.latitude, selectedReport.longitude],
        16, // Một mức zoom tốt cho một vị trí cụ thể
        { animate: true, duration: 1 }
      );
      isInitialLoadRef.current = false; // Bất kỳ tương tác nào cũng được tính là không phải tải ban đầu
    } 
    // Trong lần tải đầu tiên của phiên bản component này, nếu không có báo cáo nào được chọn trước,
    // hãy điều chỉnh bản đồ để hiển thị tất cả các báo cáo có sẵn.
    else if (isInitialLoadRef.current && reports.length > 0) {
      const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
      isInitialLoadRef.current = false; // Chỉ thực hiện điều này một lần
    }
  }, [selectedReport, reports]);

  const handleSearch = (latLng: L.LatLng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(latLng, 16); // Mức zoom 16 là tốt cho các địa chỉ
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      <div className="absolute top-4 left-4 z-10">
         <button
            onClick={onNavigateHome}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Về trang chủ"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
      </div>
      
      <MapSearch onSearch={handleSearch} />

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
       <button
          onClick={onStartNewReport}
          className="absolute bottom-6 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 z-10"
          aria-label="Báo cáo sự cố mới"
        >
          <AddIcon className="w-8 h-8" />
        </button>
    </div>
  );
};

export default MainMapView;