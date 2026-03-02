
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
    { name: 'Mới/Chờ', icon: <MapPinIcon className="w-5 h-5" />, filterType: 'Đang chờ phân tích' },
    { name: 'Cứu trợ', icon: <LifebuoyIcon className="w-5 h-5" />, filterType: 'Nhu yếu phẩm' },
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

// Hàm tạo SVG cho biểu tượng Khu bảo tồn (Cây)
const getNatureReserveIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <path d="M12 2L15 8H9L12 2Z" />
    <path d="M12 6L17 14H7L12 6Z" />
    <path d="M12 11L19 20H5L12 11Z" />
    <rect x="10.5" y="20" width="3" height="4" fill="#5D4037" />
  </svg>
`;

// Actual Recycle Icon
const getTrueRecycleIconSVG = (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)); background: white; border-radius: 50%; border: 2px solid ${color}; padding: 4px;">
        <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.108-1.139 3.418-1.304-2.512-1.302-3.34-3.322-2.812-4.787l1.018-2.823c.528-1.465 2.13-2.22 3.579-1.685l.361.133L10.856 2.23a1.5 1.5 0 0 0-2.121.707l-2.829 7.07a1.5 1.5 0 0 0 .707 2.121l.327.108zM12.652 16.326c1.265.577 2.396.656 3.295.32 1.25-.468 2.314-2.134 2.768-4.665l2.783 1.114c1.385.554 2.067 2.134 1.523 3.528l-.128.327 3.121 1.249a1.5 1.5 0 0 0 1.927-2.008l-2.828-7.07a1.5 1.5 0 0 0-2.008-1.927l-.309.103c-.544-1.394-2.124-2.076-3.528-1.523l-2.783 1.114c.468 2.535-.468 4.665-2.768 4.665-.9 0-1.7-.1-2.3-.32l.235.793zM5.564 7.414l1.868 1.868c1.302.308 2.535.936 3.579 1.868-2.22.528-4.24.22-5.705-1.245l-2.121 2.121c-1.06 1.06-1.06 2.778 0 3.839l.235.235-3.121 1.249a1.5 1.5 0 0 0 1.249 2.768l7.07-2.828a1.5 1.5 0 0 0 2.768-1.249l-.103-.309c1.394.544 2.076 2.124 1.523 3.528l-1.868 1.868c-2.535-.468-4.665.468-4.665 2.768 0 .9.1 1.7.32 2.3l-.793-.235z"></path>
        <path d="M12 22c5.514 0 10-4.486 10-10S17.514 2 12 2 2 6.486 2 12s4.486 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"></path>
    </svg>
`;

// Hàm tạo SVG cho biểu tượng Dọn dẹp (Chổi/Người)
const getCleanupIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)); background: white; border-radius: 50%; border: 2px solid ${color}; padding: 4px;">
    <path d="M16 11h-1V3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v8H8c-2.76 0-5 2.24-5 5v2h18v-2c0-2.76-2.24-5-5-5zm-5-8h2v8h-2V3zm-6.8 16c.4-1.6 1.7-2.9 3.3-3.6V19H4.2v-2zm15.6 2H4.2c-.1-.6-.2-1.3-.2-2 0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6 0 .7-.1 1.4-.2 2z" />
  </svg>
`;

// Hàm tạo SVG cho biểu tượng Trạm nước
const getWaterIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)); background: white; border-radius: 50%; border: 2px solid ${color}; padding: 4px;">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.31 0-6-2.63-6-6.2 0-2.42 1.72-5.35 6-9.15 4.28 3.8 6 6.73 6 9.15 0 3.57-2.69 6.2-6 6.2z" />
    <path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" opacity=".3" />
  </svg>
`;


// Hàm tạo biểu tượng Leaflet tùy chỉnh
const createCustomIcon = (type: 'pin' | 'lifebuoy' | POIType, color?: string) => {
  if (type === 'lifebuoy') {
    return L.divIcon({
      html: getLifebuoyIconSVG(),
      className: 'animate-pulse', // Thêm hiệu ứng pulse cho icon khẩn cấp
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -25],
    });
  }

  if (type === 'NatureReserve') {
      return L.divIcon({
          html: getNatureReserveIconSVG(color || '#16a34a'),
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
      });
  }

  if (type === 'RecyclingCenter') {
      return L.divIcon({
          html: getTrueRecycleIconSVG(color || '#2563eb'),
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
      });
  }

  if (type === 'CommunityCleanup') {
      return L.divIcon({
          html: getCleanupIconSVG(color || '#ea580c'),
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
      });
  }

  if (type === 'WaterStation') {
      return L.divIcon({
          html: getWaterIconSVG(color || '#0891b2'),
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
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
  userLocation: { latitude: number; longitude: number } | null;
  onNavigateHome: () => void;
  onSelectReport: (report: EnvironmentalReport) => void;
  onStartReport: () => void;
}

const EnvironmentalMapView: React.FC<EnvironmentalMapViewProps> = ({ reports, pois, userLocation, onNavigateHome, onSelectReport, onStartReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const sovereigntyLayerRef = useRef<L.LayerGroup | null>(null);

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
        center: [15.85, 108.3], // Trung tâm Đà Nẵng - Quảng Nam
        zoom: 10,
        zoomControl: false,
      });
      mapRef.current = map;

      // SỬ DỤNG CartoDB Voyager để có tên địa danh trung lập và chính xác hơn cho Hoàng Sa/Trường Sa
      const baseLayers = {
        "Bản đồ mặc định": L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }),
        "Bản đồ vệ tinh": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
        })
      };

      reportsLayerRef.current = L.layerGroup();
      poisLayerRef.current = L.layerGroup();
      userLayerRef.current = L.layerGroup();
      sovereigntyLayerRef.current = L.layerGroup();
      
      const overlayMaps = {
        "Báo cáo của người dân": reportsLayerRef.current,
        "Địa điểm môi trường": poisLayerRef.current,
      };

      baseLayers["Bản đồ mặc định"].addTo(map);
      reportsLayerRef.current.addTo(map);
      poisLayerRef.current.addTo(map);
      userLayerRef.current.addTo(map);
      sovereigntyLayerRef.current.addTo(map);

      // --- THÊM NHÃN CHỦ QUYỀN VIỆT NAM ---
      const sovereigntyLabels = [
        { lat: 16.4, lng: 112.0, name: "Quần đảo Hoàng Sa (Việt Nam)" },
        { lat: 10.0, lng: 114.0, name: "Quần đảo Trường Sa (Việt Nam)" }
      ];

      sovereigntyLabels.forEach(label => {
          const icon = L.divIcon({
              html: `<div class="flex flex-col items-center justify-center">
                        <div class="text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-widest text-center drop-shadow-sm whitespace-nowrap bg-white/60 backdrop-blur-[1px] px-2 py-0.5 rounded border border-white/20">
                           ${label.name}
                        </div>
                        <div class="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 shadow-sm"></div>
                     </div>`,
              className: 'bg-transparent',
              iconSize: [200, 40],
              iconAnchor: [100, 20]
          });
          L.marker([label.lat, label.lng], { icon, interactive: false, zIndexOffset: -500 }).addTo(sovereigntyLayerRef.current!);
      });

      // L.control.layers(baseLayers, overlayMaps).addTo(map); // Custom UI used instead
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Cập nhật vị trí người dùng
  useEffect(() => {
    if (!userLayerRef.current || !userLocation) return;
    userLayerRef.current.clearLayers();

    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      `,
      className: 'bg-transparent',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([userLocation.latitude, userLocation.longitude], { 
      icon: userIcon,
      zIndexOffset: 2000 
    });
    
    marker.bindPopup("<div class='text-xs font-bold text-blue-700'>Vị trí của bạn</div>");
    userLayerRef.current.addLayer(marker);
  }, [userLocation]);

  // Cập nhật các ghim báo cáo khi bộ lọc thay đổi
  useEffect(() => {
    if (!reportsLayerRef.current) return;
    reportsLayerRef.current.clearLayers();

    filteredReports.forEach(report => {
      // Logic xác định icon: Nếu có nhu yếu phẩm -> Dùng icon Phao cứu sinh, ngược lại dùng Pin
      const hasSupplies = report.aiAnalysis.recommendedSupplies && report.aiAnalysis.recommendedSupplies.length > 0;
      const isHighPriority = report.aiAnalysis.priority === 'Cao';
      
      let icon;
      if (hasSupplies) {
        icon = createCustomIcon('lifebuoy');
      } else {
        // Fallback color if status is unknown
        const color = statusColors[report.status] || '#6b7280';
        
        // Nếu là ưu tiên cao, thêm hiệu ứng đặc biệt
        if (isHighPriority) {
            icon = L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center">
                        <div class="absolute w-10 h-10 bg-red-500/40 rounded-full animate-ping"></div>
                        ${getPinIconSVG('#ef4444')}
                    </div>
                `,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -42],
            });
        } else {
            icon = createCustomIcon('pin', color);
        }
      }

      const marker = L.marker([report.latitude, report.longitude], { 
        icon,
        zIndexOffset: hasSupplies || isHighPriority ? 1000 : 0 // Ưu tiên hiển thị marker cứu trợ hoặc ưu tiên cao lên trên
      });

      const issueType = report.aiAnalysis.issueType || 'Sự cố môi trường';
      let popupContent = `<b>${issueType}</b><br>${report.status}`;
      if (hasSupplies) {
          popupContent += `<br><span style="color: #ea580c; font-weight: bold;">⚠️ Cần/Có nhu yếu phẩm</span>`;
      }
      if (isHighPriority) {
          popupContent += `<br><span style="color: #ef4444; font-weight: bold;">🚨 Ưu tiên: CAO</span>`;
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
      // Use the specific POI type for the icon
      const icon = createCustomIcon(poi.type, poiInfo.color);
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
      
      {/* Top Left - Home */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
         <button
            onClick={onNavigateHome}
            className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Về trang chủ"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={onStartReport}
            className="bg-teal-600 text-white rounded-full p-3 shadow-lg hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 animate-bounce flex items-center space-x-2 pr-4"
            title="Báo cáo nhanh tại đây"
            aria-label="Báo cáo nhanh tại đây"
          >
            <MapPinIcon className="w-6 h-6" />
            <span className="text-xs font-bold">Báo cáo nhanh</span>
          </button>
      </div>

       {/* Top Center - Title Badge */}
       <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-auto">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-100 flex flex-col items-center">
          <h3 className="text-sm font-bold text-indigo-700 whitespace-nowrap">Bản đồ Môi trường</h3>
        </div>
      </div>

       {/* Top Right - Filter Controls (Moved from Bottom Right) */}
       <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2">
         {/* Bảng điều khiển bộ lọc */}
        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-lg flex flex-col space-y-1">
            {filterCategories.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setActiveFilter(cat.filterType)}
                    className={`flex items-center space-x-2 w-full text-left p-2 rounded-xl transition-all duration-200 ${activeFilter === cat.filterType ? 'bg-teal-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    title={cat.name}
                    aria-label={`Lọc theo ${cat.name}`}
                >
                    <div className="w-6 flex justify-center">{cat.icon}</div>
                     {/* On mobile, show labels only for active or maybe hide labels to save space? Let's keep icons mostly but small label if active */}
                </button>
            ))}
        </div>
      </div>

      {/* Bottom Left - Legend */}
      <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg z-10 max-w-[200px] border border-gray-100 hidden sm:block">
        <h4 className="font-bold text-xs mb-2 text-gray-500 uppercase tracking-wider">Chú giải</h4>
        <div className="space-y-2">
          <div>
             <div className="flex items-center space-x-2 bg-orange-50 p-1 rounded-lg">
                 <div className="w-5 h-5 flex items-center justify-center">
                    <LifebuoyIcon className="w-4 h-4 text-orange-600" />
                 </div>
                 <span className="text-xs font-bold text-orange-700">Cứu trợ / Nhu yếu phẩm</span>
             </div>
          </div>
          <div className="grid grid-cols-1 gap-1">
              {Object.entries(statusColors).map(([status, color]) => (
                 <div key={status} className="flex items-center space-x-2">
                   <MapPinIcon className="w-4 h-4 flex-shrink-0" style={{color: color}} />
                   <span className="text-xs text-gray-600 truncate">{status}</span>
                 </div>
              ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Right is now clear for Floating AI Assistant */}
    </div>
  );
};

export default EnvironmentalMapView;
