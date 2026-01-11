
import React from 'react';
import { AIAnalysis } from '../types';
import { LocationIcon } from './icons/LocationIcon';
import { SeverityIcon } from './icons/SeverityIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LifebuoyIcon } from './icons/LifebuoyIcon';

interface ReportCardProps {
  analysis: AIAnalysis;
}

const getPriorityDetails = (priority: 'Cao' | 'Trung bình' | 'Thấp') => {
  switch (priority) {
    case 'Cao':
      return {
        label: 'Cao',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        meterColor: 'bg-red-500',
        level: 3,
      };
    case 'Trung bình':
      return {
        label: 'Trung bình',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        meterColor: 'bg-yellow-500',
        level: 2,
      };
    case 'Thấp':
      return {
        label: 'Thấp',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        meterColor: 'bg-green-500',
        level: 1,
      };
    default:
      return {
        label: 'Không rõ',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        meterColor: 'bg-gray-400',
        level: 0,
      };
  }
};


const ReportCard: React.FC<ReportCardProps> = ({ analysis }) => {
  const priorityDetails = getPriorityDetails(analysis.priority);

  return (
    <div className="w-full bg-white rounded-xl overflow-hidden border border-slate-200">
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Phân tích tự động của AI</h3>
        
        <div className="space-y-4">
            {/* Phần Mức độ ưu tiên nâng cao */}
            <div className={`p-3 rounded-lg ${priorityDetails.bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SeverityIcon priority={analysis.priority} className={`w-7 h-7 ${priorityDetails.textColor}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Mức độ ưu tiên</p>
                    <p className={`text-lg font-bold ${priorityDetails.textColor}`}>{priorityDetails.label}</p>
                  </div>
                </div>
                {/* Thước đo trực quan */}
                <div className="flex items-center gap-1.5" aria-label={`Mức độ ưu tiên: ${priorityDetails.label}`}>
                  <div title="Thấp" className={`h-2 w-6 rounded-full transition-colors duration-300 ${priorityDetails.level >= 1 ? priorityDetails.meterColor : 'bg-gray-300/70'}`} />
                  <div title="Trung bình" className={`h-2 w-6 rounded-full transition-colors duration-300 ${priorityDetails.level >= 2 ? priorityDetails.meterColor : 'bg-gray-300/70'}`} />
                  <div title="Cao" className={`h-2 w-6 rounded-full transition-colors duration-300 ${priorityDetails.level >= 3 ? priorityDetails.meterColor : 'bg-gray-300/70'}`} />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Loại sự cố</p>
              <p className="text-gray-900 font-semibold bg-gray-100 p-2 rounded-md text-base">{analysis.issueType}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Mô tả chi tiết</p>
              <p className="text-gray-700 bg-gray-100 p-2 rounded-md text-sm leading-relaxed">{analysis.description}</p>
            </div>

             {analysis.solution && (
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-md font-bold text-indigo-800">Giải pháp đề xuất</h4>
                    <p className="text-sm text-indigo-700 mt-1">{analysis.solution}</p>
                  </div>
                </div>
              </div>
            )}

            {analysis.recommendedSupplies && analysis.recommendedSupplies.length > 0 && (
               <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <LifebuoyIcon className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-md font-bold text-orange-800">Nhu yếu phẩm cần thiết</h4>
                    <ul className="list-disc list-inside text-sm text-orange-700 mt-1">
                      {analysis.recommendedSupplies.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
