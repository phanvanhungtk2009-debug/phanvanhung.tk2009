import React from 'react';
import { EnvironmentalReport } from '../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapIcon } from './icons/MapIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import HeroBanner from './HeroBanner';
import EducationCard from './EducationCard';
import { RecycleIcon } from './icons/RecycleIcon';
import { PlasticBottleIcon } from './icons/PlasticBottleIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';


interface HomeViewProps {
  reports: EnvironmentalReport[];
  onNavigateToMap: () => void;
  onStartNewReport: () => void;
}

const educationalContent = [
  {
    icon: <RecycleIcon className="w-10 h-10 text-green-600" />,
    title: "Phân loại rác tại nguồn",
    description: "Phân loại rác hữu cơ, tái chế và rác còn lại giúp giảm gánh nặng cho các bãi chôn lấp và tận dụng tài nguyên."
  },
  {
    icon: <PlasticBottleIcon className="w-10 h-10 text-blue-600" />,
    title: "Giảm nhựa một lần",
    description: "Sử dụng túi vải, bình nước cá nhân và hộp đựng thức ăn để hạn chế rác thải nhựa gây hại cho đại dương."
  },
  {
    icon: <WaterDropIcon className="w-10 h-10 text-cyan-600" />,
    title: "Tiết kiệm nước sạch",
    description: "Tắt vòi nước khi không sử dụng, kiểm tra rò rỉ và tái sử dụng nước là những cách đơn giản để bảo vệ nguồn tài nguyên quý giá."
  }
]

const HomeView: React.FC<HomeViewProps> = ({ reports, onNavigateToMap, onStartNewReport }) => {
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Đã xử lý').length;

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="mb-8">
        <HeroBanner />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats and Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Thống Kê Cộng Đồng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-blue-50 p-4 rounded-xl">
                  <ClipboardListIcon className="w-8 h-8 text-blue-500 mr-4" />
                  <div>
                    <p className="font-semibold text-blue-800">Tổng số báo cáo</p>
                    <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-50 p-4 rounded-xl">
                  <CheckBadgeIcon className="w-8 h-8 text-green-500 mr-4"/>
                  <div>
                    <p className="font-semibold text-green-800">Vấn đề đã xử lý</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedReports}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4">
               <h3 className="text-xl font-bold text-slate-800">Hành động ngay</h3>
               <p className="text-sm text-slate-500 pb-2">Thấy một vấn đề? Đừng ngần ngại báo cáo để thành phố xử lý.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <button onClick={onStartNewReport} className="w-full sm:w-auto flex-1 text-lg bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <DocumentPlusIcon className="w-6 h-6" />
                  <span>Báo Cáo Mới</span>
                </button>
                <button onClick={onNavigateToMap} className="w-full sm:w-auto flex-1 text-lg bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-slate-800 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <MapIcon className="w-6 h-6" />
                  <span>Xem Bản Đồ</span>
                </button>
               </div>
            </div>
          </div>

          {/* Right Column: Education */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full">
                <h3 className="text-xl font-bold mb-4 text-slate-800">Nội dung Tuyên truyền & Giáo dục</h3>
                <div className="space-y-4">
                    {educationalContent.map((item, index) => (
                      <EducationCard 
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                      />
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;