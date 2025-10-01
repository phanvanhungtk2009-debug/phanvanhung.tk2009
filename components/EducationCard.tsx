import React from 'react';

interface EducationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const EducationCard: React.FC<EducationCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-teal-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 bg-white rounded-full p-2 border border-slate-200">
            {icon}
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-slate-800 text-md">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
           <button className="text-sm font-semibold text-teal-600 hover:text-teal-800 mt-3">
            Tìm hiểu thêm &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationCard;
