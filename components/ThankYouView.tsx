import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { HomeIcon } from './icons/HomeIcon';
import { MapIcon } from './icons/MapIcon';

interface ThankYouViewProps {
  onNavigateHome: () => void;
  onNavigateToMap: () => void;
}

const ThankYouView: React.FC<ThankYouViewProps> = ({ onNavigateHome, onNavigateToMap }) => {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg max-w-lg w-full">
        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Cảm ơn bạn đã báo cáo!
        </h2>
        <p className="text-gray-600 mb-8">
          Đóng góp của bạn rất quan trọng. Chúng tôi sẽ xem xét và xử lý vấn đề này sớm nhất có thể.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto text-lg bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <HomeIcon className="w-6 h-6" />
            <span>Về Trang Chủ</span>
          </button>
          <button
            onClick={onNavigateToMap}
            className="w-full sm:w-auto text-lg bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
             <MapIcon className="w-6 h-6" />
            <span>Xem Lại Bản Đồ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouView;
