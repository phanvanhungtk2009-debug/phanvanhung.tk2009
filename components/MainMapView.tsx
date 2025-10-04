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
}

const statusColors: Record<ReportStatus, string> = {
  'Mới báo cáo': '#ef4444', // red-500 from Tailwind
  'Đang xử lý': '#f59e0b', // amber-500 from Tailwind (yellow was too light)
  'Đã xử lý': '#22c55e', // green-500 from Tailwind
};

// Function to generate an SVG string for the map pin with dynamic color
const getIconSVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="48px" height="48px" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 004.6-5.462c.983-1.627 1.83-3.368 2.388-5.142.558-1.773.83-3.647.83-5.542 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.895.272 3.77.83 5.542.558 1.773 1.405 3.515 2.388 5.142a16.975 16.975 0 004.6 5.462zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
  </svg>
`;

// Function to create a custom Leaflet icon
const createCustomIcon = (status: ReportStatus) => {
  const color = statusColors[status] || '#6b7280'; // Default gray
  return L.divIcon({
    html: getIconSVG(color),
    className: '', // Important to override default leaflet styles
    iconSize: [48, 48],
    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -50] // Point from which the popup should open relative to the iconAnchor
  });
};


const MainMapView: React.FC<MainMapViewProps> = ({ reports, onSelectReport, onNavigateHome, onStartNewReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 108.2022], // Da Nang center
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    if (reports.length > 0) {
      reports.forEach(report => {
        const marker = L.marker([report.latitude, report.longitude], {
          icon: createCustomIcon(report.status),
        });

        marker.bindPopup(`<b>${report.aiAnalysis.issueType}</b><br>${report.status}`);
        
        // Use onSelectReport to open the full modal
        marker.on('click', () => {
          onSelectReport(report);
        });

        markersRef.current?.addLayer(marker);
      });

      // Adjust map view to fit all markers
      const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
      if (bounds.isValid()) {
         mapRef.current.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else {
        // If no reports, reset to default view of Da Nang
        mapRef.current.flyTo([16.0544, 108.2022], 13);
    }
  }, [reports, onSelectReport]);

  const handleSearch = (latLng: L.LatLng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(latLng, 16); // Zoom level 16 is good for addresses
    }
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
      
      <MapSearch onSearch={handleSearch} />

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md z-10">
        <h4 className="font-bold text-sm mb-2 text-gray-700">Chú thích</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Mới báo cáo']}} />
            <span className="text-xs text-gray-600">Mới báo cáo</span>
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
          aria-label="Báo cáo vấn đề mới"
        >
          <AddIcon className="w-8 h-8" />
        </button>
    </div>
  );
};

export default MainMapView;
