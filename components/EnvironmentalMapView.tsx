import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { EnvironmentalPOI, POIType } from '../types';
import { HomeIcon } from './icons/HomeIcon';

interface EnvironmentalMapViewProps {
  onNavigateHome: () => void;
}

const initialPoiData: EnvironmentalPOI[] = [
  {
    id: 'son-tra',
    type: 'NatureReserve',
    name: 'Khu bảo tồn thiên nhiên Sơn Trà',
    description: 'Được mệnh danh là "lá phổi xanh" của Đà Nẵng, là nơi sinh sống của loài Voọc chà vá chân nâu quý hiếm.',
    latitude: 16.1107,
    longitude: 108.3039,
  },
  {
    id: 'recycling-center',
    type: 'RecyclingCenter',
    name: 'Trung tâm Tái chế & Xử lý rác',
    description: 'Địa điểm tập trung xử lý và tái chế rác thải nhựa, giấy và kim loại, góp phần giảm thiểu rác thải chôn lấp.',
    latitude: 16.035,
    longitude: 108.21,
  },
  {
    id: 'han-river-station',
    type: 'WaterStation',
    name: 'Trạm quan trắc nước sông Hàn',
    description: 'Liên tục theo dõi các chỉ số chất lượng nước như độ pH, DO, và các chất ô nhiễm để đảm bảo an toàn nguồn nước.',
    latitude: 16.07,
    longitude: 108.225,
  },
  {
    id: 'my-khe-cleanup',
    type: 'CommunityCleanup',
    name: 'Điểm dọn dẹp cộng đồng bãi biển Mỹ Khê',
    description: 'Nơi thường xuyên diễn ra các hoạt động thu gom rác thải do các nhóm tình nguyện tổ chức vào cuối tuần.',
    latitude: 16.059,
    longitude: 108.248,
  },
];


const getIconSVGString = (type: POIType): string => {
  const commonProps = `xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" width="24" height="24"`;
  switch (type) {
    case 'NatureReserve':
      return `<svg ${commonProps}>
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 19.5h16.5m-16.5 0s1.875-3.75 5.625-3.75 5.625 3.75 5.625 3.75m-1.25-3.75L12 12.75l2.625 3M15 19.5s1.875-3.75 5.625-3.75" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3L3.75 15h16.5L12 3z" />
              </svg>`;
    case 'RecyclingCenter':
      return `<svg ${commonProps}>
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0-3.182 3.183a8.25 8.25 0 01-11.664 0l-3.181-3.183m11.664 0-3.181-3.183a8.25 8.25 0 0111.664 0l3.181 3.183" />
              </svg>`;
    case 'CommunityCleanup':
      return `<svg ${commonProps}>
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.226a3.75 3.75 0 00-4.242 0 3.75 3.75 0 000 5.303 3.75 3.75 0 005.304 0 3.75 3.75 0 000-5.303z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>`;
    case 'WaterStation':
      return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 01-9-9c0-4.968 4.032-9 9-9s9 4.032 9 9a9 9 0 01-9 9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 12.75a.75.75 0 000-1.5.75.75 0 000 1.5z" clip-rule="evenodd" fill="white" />
             </svg>`;
    default:
      return '';
  }
};


const poiDetails: Record<POIType, { color: string; label: string }> = {
  NatureReserve: {
    color: '#16a34a', // green-600
    label: 'Khu bảo tồn',
  },
  RecyclingCenter: {
    color: '#0284c7', // sky-600
    label: 'Trung tâm tái chế',
  },
  CommunityCleanup: {
    color: '#c026d3', // fuchsia-600
    label: 'Điểm dọn dẹp cộng đồng',
  },
  WaterStation: {
    color: '#2563eb', // blue-600
    label: 'Trạm quan trắc nước',
  },
};

const createCustomDivIcon = (type: POIType) => {
  const details = poiDetails[type];
  const iconSvg = getIconSVGString(type);
  
  const iconHtml = `
    <div style="
      background-color: ${details.color}; 
      width: 44px; height: 44px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.4); 
      border: 2px solid white;
    ">
      ${iconSvg}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  });
};


const EnvironmentalMapView: React.FC<EnvironmentalMapViewProps> = ({ onNavigateHome }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [pois, setPois] = useState<EnvironmentalPOI[]>(initialPoiData);
  const [activeFilters, setActiveFilters] = useState<POIType[]>([]);
  const [filteredPois, setFilteredPois] = useState<EnvironmentalPOI[]>([]);

  // Tự động làm mới dữ liệu POI
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Tự động làm mới dữ liệu POI...");
      setPois(prevPois => 
        prevPois.map(poi => {
          if (poi.id === 'han-river-station') {
            return {
              ...poi,
              description: `Liên tục theo dõi các chỉ số chất lượng nước. Cập nhật lần cuối lúc ${new Date().toLocaleTimeString('vi-VN')}.`
            };
          }
          return poi;
        })
      );
    }, 30000); // 30 giây

    return () => clearInterval(intervalId);
  }, []);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 108.2022], // Da Nang center
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

  // Lọc POI dựa trên các bộ lọc đang hoạt động
  useEffect(() => {
    if (activeFilters.length === 0) {
      setFilteredPois(pois); // Không có bộ lọc, hiển thị tất cả
    } else {
      setFilteredPois(pois.filter(poi => activeFilters.includes(poi.type)));
    }
  }, [pois, activeFilters]);

  // Cập nhật các marker khi dữ liệu POI đã lọc thay đổi
  useEffect(() => {
    if (!markersRef.current) return;

    markersRef.current.clearLayers();

    filteredPois.forEach(poi => {
      const marker = L.marker([poi.latitude, poi.longitude], {
        icon: createCustomDivIcon(poi.type),
      });

      marker.bindPopup(`<b>${poi.name}</b><br>${poi.description}`);
      markersRef.current?.addLayer(marker);
    });
  }, [filteredPois]);

  const handleFilterChange = (filter: POIType | null) => {
    if (filter === null) {
      setActiveFilters([]); // Xóa tất cả bộ lọc
      return;
    }
    // Chuyển đổi bộ lọc (bật/tắt)
    setActiveFilters(prevFilters => 
      prevFilters.includes(filter) 
        ? prevFilters.filter(f => f !== filter) 
        : [...prevFilters, filter]
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      <div className="absolute top-4 left-4 z-10">
         <button
            onClick={onNavigateHome}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Quay về trang chủ"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
      </div>

       <div className="absolute bottom-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md">
        <h4 className="font-bold text-sm mb-2 text-gray-700">Chú thích</h4>
        <div className="space-y-2">
            {Object.entries(poiDetails).map(([type, details]) => (
                <div key={type} className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: details.color }}></span>
                    <span className="text-xs text-gray-600 font-medium">{details.label}</span>
                </div>
            ))}
        </div>
      </div>

       {/* Filter Controls */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
        <button
          onClick={() => handleFilterChange(null)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${activeFilters.length === 0 ? 'bg-teal-600 text-white shadow' : 'bg-white/50 text-gray-700 hover:bg-white'}`}
        >
          Tất cả
        </button>
        {Object.entries(poiDetails).map(([type, details]) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type as POIType)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center space-x-2 ${activeFilters.includes(type as POIType) ? 'bg-teal-600 text-white shadow' : 'bg-white/50 text-gray-700 hover:bg-white'}`}
          >
            <span className="w-3 h-3 rounded-full hidden sm:inline-block" style={{ backgroundColor: details.color }}></span>
            <span>{details.label}</span>
          </button>
        ))}
      </div>


      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg text-center w-11/12 max-w-md">
        <h3 className="text-lg font-bold text-indigo-700">Bản đồ Môi trường Đà Nẵng</h3>
        <p className="text-sm text-gray-600">Khám phá các địa điểm quan trọng góp phần bảo vệ thành phố.</p>
      </div>
    </div>
  );
};

export default EnvironmentalMapView;
