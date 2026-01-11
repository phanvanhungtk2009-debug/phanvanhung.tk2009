
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as L from 'leaflet';
import { EnvironmentalReport, ReportStatus, EnvironmentalPOI, POIType, AIAnalysis } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { AllIssuesIcon } from './icons/AllIssuesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LandslideIcon } from './icons/LandslideIcon';
import { FloodIcon } from './icons/FloodIcon';
import { LifebuoyIcon } from './icons/LifebuoyIcon';

// Định nghĩa màu sắc cho các trạng thái báo cáo
const statusColors: Record<ReportStatus, string> = {
  'Báo cáo mới': '#ef4444', // red-500
  'Đang xử lý': '#f59e0b', // amber-500
  'Đã xử lý': '#22c55e', // green-500
};

// Định nghĩa chi tiết cho các loại POI
const poiDetails: Record<POIType, { name: string; color: string }> = {
  NatureReserve: { name: 'Khu bảo tồn', color: '#16a34a' }, // green-600
  RecyclingCenter: { name: 'Điểm tái chế', color: '#2563eb' }, // blue-600
  CommunityCleanup: { name: 'Điểm dọn dẹp', color: '#ea580c' }, // orange-600
  WaterStation: { name: 'Trạm nước', color: '#0891b2' }, // cyan-600
};

// Các danh mục bộ lọc
// FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const filterCategories: { name: string; icon: React.ReactElement; filterType: AIAnalysis['issueType'] | 'Tất cả' | 'Nhu yếu phẩm' }[] = [
    { name: 'Tất cả', icon: <AllIssuesIcon className="w-5 h-5" />, filterType: 'Tất cả' },
    { name: 'Cứu trợ', icon: <LifebuoyIcon className="w-5 h-5" />, filterType: 'Nhu yếu phẩm' }, // New filter
    { name: 'Rác thải', icon: <TrashIcon className="w-5 h-5" />, filterType: 'Xả rác không đúng nơi quy định' },
    { name: 'Sạt lở', icon: <LandslideIcon className="w-5 h-5" />, filterType: 'Sạt lở đất' },
    { name: 'Ngập lụt', icon: <FloodIcon className="w-5 h-5" />, filterType: 'Ngập lụt' },
];

// Hàm tạo SVG cho biểu tượng ghim bản đồ với màu động
const getPinIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 004.6-5.462c.983-1.627 1.83-3.368 2.388-5.142.558-1.773.83-3.647.83-5.542 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.895.272 3.77.83 5.542.558 1.773 1.405 3.515 2.388 5.142a16.975 16.975 0 004.6 5.462zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
  </svg>
`;

// Hàm tạo SVG cho biểu tượng Phao cứu sinh (Ưu tiên)
const getLifebuoyIconSVG = () => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" width="40px" height="40px" style="filter: drop-shadow(0 2px 5px rgba(234, 88, 12, 0.5)); background: white; border-radius: 50%;">
     <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
`;

// Hàm tạo biểu tượng Leaflet tùy chỉnh
const createCustomIcon = (type: 'pin' | 'lifebuoy', color?: string) => {
  if (type === 'lifebuoy') {
    return L.divIcon({
      html: getLifebuoyIconSVG(),
      className: 'animate-pulse', // Thêm hiệu ứng pulse cho icon khẩn cấp
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -25],
    });
  }
  
  return L.divIcon({
    html: getPinIconSVG(color || '#6b7280'),
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
};

interface EnvironmentalMapViewProps {
  reports: EnvironmentalReport[];
  pois: EnvironmentalPOI[];
  onNavigateHome: () => void;
  onSelectReport: (report: EnvironmentalReport) => void;
}

const EnvironmentalMapView: React.FC<EnvironmentalMapViewProps> = ({ reports, pois, onNavigateHome, onSelectReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('Tất cả');

  const filteredReports = useMemo(() => {
    if (activeFilter === 'Tất cả') {
        return reports;
    }
    if (activeFilter === 'Nhu yếu phẩm') {
        // Lọc các báo cáo có danh sách nhu yếu phẩm (ưu tiên)
        return reports.filter(r => r.aiAnalysis.recommendedSupplies && r.aiAnalysis.recommendedSupplies.length > 0);
    }
    return reports.filter(r => r.aiAnalysis.issueType === activeFilter);
  }, [reports, activeFilter]);


  // Khởi tạo bản đồ
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 108.2022], // Trung tâm Đà Nẵng
        zoom: 13,
      });
      mapRef.current = map;

      const baseLayers = {
        "Bản đồ mặc định": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }),
        "Bản đồ vệ tinh": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
        })
      };

      reportsLayerRef.current = L.layerGroup();
      poisLayerRef.current = L.layerGroup();
      
      const overlayMaps = {
        "Báo cáo của người dân": reportsLayerRef.current,
        "Địa điểm môi trường": poisLayerRef.current,
      };

      baseLayers["Bản đồ mặc định"].addTo(map);
      reportsLayerRef.current.addTo(map);
      poisLayerRef.current.addTo(map);

      L.control.layers(baseLayers, overlayMaps).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Cập nhật các ghim báo cáo khi bộ lọc thay đổi
  useEffect(() => {
    if (!reportsLayerRef.current) return;
    reportsLayerRef.current.clearLayers();

    filteredReports.forEach(report => {
      // Logic xác định icon: Nếu có nhu yếu phẩm -> Dùng icon Phao cứu sinh, ngược lại dùng Pin
      const hasSupplies = report.aiAnalysis.recommendedSupplies && report.aiAnalysis.recommendedSupplies.length > 0;
      
      let icon;
      if (hasSupplies) {
        icon = createCustomIcon('lifebuoy');
      } else {
        icon = createCustomIcon('pin', statusColors[report.status]);
      }

      const marker = L.marker([report.latitude, report.longitude], { 
        icon,
        zIndexOffset: hasSupplies ? 1000 : 0 // Ưu tiên hiển thị marker cứu trợ lên trên
      });

      let popupContent = `<b>${report.aiAnalysis.issueType}</b><br>${report.status}`;
      if (hasSupplies) {
          popupContent += `<br><span style="color: #ea580c; font-weight: bold;">⚠️ Cần/Có nhu yếu phẩm</span>`;
      }
      
      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectReport(report));
      reportsLayerRef.current?.addLayer(marker);
    });
  }, [filteredReports, onSelectReport]);

  // Cập nhật các ghim POI
  useEffect(() => {
    if (!poisLayerRef.current) return;
    poisLayerRef.current.clearLayers();

    pois.forEach(poi => {
      const poiInfo = poiDetails[poi.type];
      const icon = createCustomIcon('pin', poiInfo.color);
      const marker = L.marker([poi.latitude, poi.longitude], { icon });

      marker.bindPopup(`<b>${poi.name}</b><br><p style="margin: 4px 0;">${poi.description}</p>`);
      poisLayerRef.current?.addLayer(marker);
    });
  }, [pois]);

  // Điều chỉnh view để vừa tất cả các điểm khi bộ lọc thay đổi
  useEffect(() => {
    if (!mapRef.current) return;

    const timer = setTimeout(() => {
        if (!mapRef.current) return;
        
        const allPoints: L.LatLngExpression[] = [
            ...filteredReports.map(r => [r.latitude, r.longitude] as L.LatLngExpression),
            ...pois.map(p => [p.latitude, p.longitude] as L.LatLngExpression)
        ];

        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints);
            if (bounds.isValid()) {
                mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }
        }
    }, 150);

    return () => clearTimeout(timer);

  }, [filteredReports, pois]);


  return (
    <div className="absolute inset-0 w-full h-full">
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

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md z-10 max-w-xs">
        <h4 className="font-bold text-sm mb-2 text-gray-700">Chú giải</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Loại điểm</p>
             <div className="flex items-center space-x-2">
                 {/* Render static SVG for legend */}
                 <div className="w-6 h-6 flex items-center justify-center">
                    <LifebuoyIcon className="w-5 h-5 text-orange-600" />
                 </div>
                 <span className="text-xs font-bold text-orange-700">Điểm Cứu trợ / Nhu yếu phẩm</span>
             </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Trạng thái báo cáo</p>
            <div className="space-y-1">
              {Object.entries(statusColors).map(([status, color]) => (
                 <div key={status} className="flex items-center space-x-2">
                   <MapPinIcon className="w-5 h-5 flex-shrink-0" style={{color: color}} />
                   <span className="text-xs text-gray-600">{status}</span>
                 </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1 border-t border-gray-200 pt-2 mt-2">Địa điểm môi trường</p>
            <div className="space-y-1">
              {Object.values(poiDetails).map((details) => (
                <div key={details.name} className="flex items-center space-x-2">
                  <MapPinIcon className="w-5 h-5 flex-shrink-0" style={{color: details.color}} />
                  <span className="text-xs text-gray-600">{details.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
       <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end space-y-4">
        {/* Bảng điều khiển bộ lọc */}
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg flex flex-col space-y-1">
            {filterCategories.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setActiveFilter(cat.filterType)}
                    className={`flex items-center space-x-2 w-full text-left p-2 rounded-full transition-all duration-200 ${activeFilter === cat.filterType ? 'bg-teal-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200/50'}`}
                    title={cat.name}
                    aria-label={`Lọc theo ${cat.name}`}
                >
                    <div className="w-6 text-center">{cat.icon}</div>
                </button>
            ))}
        </div>
        
        {/* Hộp tiêu đề */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg text-center w-11/12 max-w-md pointer-events-none">
          <h3 className="text-lg font-bold text-indigo-700">Bản đồ Môi trường Đà Nẵng</h3>
          <p className="text-sm text-gray-600">Khám phá các báo cáo và điểm quan trọng do cộng đồng đóng góp.</p>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalMapView;
