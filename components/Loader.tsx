
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700">AI đang phân tích hình ảnh...</p>
      <p className="text-sm text-gray-500">Quá trình này có thể mất vài giây.</p>
    </div>
  );
};

export default Loader;