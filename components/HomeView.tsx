import React from 'react';
import { EnvironmentalReport } from '../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapIcon } from './icons/MapIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';


interface HomeViewProps {
  reports: EnvironmentalReport[];
  onNavigateToMap: () => void;
  onStartNewReport: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ reports, onNavigateToMap, onStartNewReport }) => {
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Đã xử lý').length;

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden mb-8 shadow-lg bg-cover bg-center h-64" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590372728483-3594411a5474?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 flex flex-col items-center justify-center text-center text-white p-4">
            <h2 className="text-4xl font-bold mb-2">Chào mừng đến với Đà Nẵng Xanh</h2>
            <p className="max-w-2xl text-lg opacity-90">Nền tảng cộng đồng chung tay hành động vì một thành phố sạch đẹp và bền vững hơn.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats and Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Thống Kê Cộng Đồng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-blue-50 p-4 rounded-lg">
                  <ClipboardListIcon className="w-8 h-8 text-blue-500 mr-4" />
                  <div>
                    <p className="font-semibold text-blue-800">Tổng số báo cáo</p>
                    <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-50 p-4 rounded-lg">
                  <CheckBadgeIcon className="w-8 h-8 text-green-500 mr-4"/>
                  <div>
                    <p className="font-semibold text-green-800">Vấn đề đã xử lý</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedReports}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-xl shadow-md text-center space-y-4">
               <h3 className="text-xl font-bold text-gray-800">Hành động ngay</h3>
               <p className="text-sm text-gray-500 pb-2">Thấy một vấn đề? Đừng ngần ngại báo cáo để thành phố xử lý.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <button onClick={onStartNewReport} className="w-full sm:w-auto flex-1 text-lg bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2">
                  <DocumentPlusIcon className="w-6 h-6" />
                  <span>Báo Cáo Mới</span>
                </button>
                <button onClick={onNavigateToMap} className="w-full sm:w-auto flex-1 text-lg bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 flex items-center justify-center space-x-2">
                  <MapIcon className="w-6 h-6" />
                  <span>Xem Bản Đồ</span>
                </button>
               </div>
            </div>
          </div>

          {/* Right Column: Education */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-xl shadow-md h-full">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Góc Giáo Dục</h3>
                <div className="space-y-4">
                    <div className="aspect-w-16 aspect-h-9">
                         <iframe className="rounded-lg w-full h-full" src="https://www.youtube.com/embed/O-yIk-iA2-g" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                     <p className="text-sm text-gray-600 text-center">Video: Chiến dịch làm sạch bờ biển.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
