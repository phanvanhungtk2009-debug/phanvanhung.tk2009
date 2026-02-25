
import React from 'react';
import { EnvironmentalReport, ReportStatus, EducationalTopic } from '../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapIcon } from './icons/MapIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import HeroBanner from './HeroBanner';
import EducationCard from './EducationCard';
import { RecycleIcon } from './icons/RecycleIcon';
import { PlasticBottleIcon } from './icons/PlasticBottleIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { SOSIcon } from './icons/SOSIcon';


interface HomeViewProps {
  reports: EnvironmentalReport[];
  onNavigateToMap: () => void;
  onStartNewReport: () => void;
  onSelectReportAndNavigateToMap: (report: EnvironmentalReport) => void;
  onSelectEducationTopic: (topic: EducationalTopic) => void;
  onNavigateToEnvironmentalMap: () => void;
  onNavigateToSOS: () => void;
}

const educationalContent: EducationalTopic[] = [
  {
    id: 'waste-sorting',
    icon: <RecycleIcon className="w-8 h-8 text-green-600" />,
    title: "Phân loại rác tại nguồn",
    description: "Tách riêng rác hữu cơ, tái chế và rác khác.",
    details: {
      importance: "Phân loại rác đúng cách giúp tối đa hóa tỷ lệ tái chế, giảm thiểu ô nhiễm đất và nước, và tiết kiệm tài nguyên thiên nhiên.",
      solutions: [
        { title: "Rác hữu cơ (Thùng xanh lá)", description: "Bao gồm thức ăn thừa, vỏ rau củ. Có thể ủ thành phân compost để bón cho cây." },
        { title: "Rác tái chế (Thùng vàng/trắng)", description: "Giấy, nhựa, kim loại, thủy tinh. Hãy làm sạch chúng trước khi bỏ đi để nâng cao hiệu quả tái chế." },
        { title: "Rác còn lại (Thùng xám)", description: "Tã lót, túi ni lông bẩn, các vật dụng không thể tái chế. Loại rác này sẽ được đưa đến bãi chôn lấp." },
      ],
      tip: "Đặt ba thùng rác nhỏ trong bếp để xây dựng thói quen phân loại rác ngay từ đầu."
    }
  },
  {
    id: 'plastic-reduction',
    icon: <PlasticBottleIcon className="w-8 h-8 text-blue-600" />,
    title: "Giảm thiểu nhựa",
    description: "Hạn chế rác thải nhựa gây hại cho đại dương.",
    details: {
      importance: "Rác thải nhựa mất hàng trăm năm để phân hủy, vỡ ra thành các hạt vi nhựa độc hại, gây ô nhiễm nghiêm trọng hệ sinh thái biển và ảnh hưởng đến sức khỏe con người.",
      solutions: [
        { title: "Mang theo đồ dùng cá nhân", description: "Luôn có túi vải khi đi mua sắm, chai và ly cá nhân khi mua đồ uống mang đi." },
        { title: "Từ chối ống hút nhựa", description: "Yêu cầu không dùng ống hút nhựa hoặc sử dụng các giải pháp thay thế tái sử dụng như inox, tre, thủy tinh." },
        { title: "Chọn sản phẩm không có bao bì nhựa", description: "Ưu tiên mua các sản phẩm được đóng gói bằng vật liệu thân thiện với môi trường như giấy, thủy tinh." },
      ],
      tip: "Bắt đầu với thử thách nhỏ: 'Một ngày không dùng đồ nhựa một lần' để thấy sự khác biệt bạn có thể tạo ra."
    }
  },
  {
    id: 'water-saving',
    icon: <WaterDropIcon className="w-8 h-8 text-cyan-600" />,
    title: "Tiết kiệm nước sạch",
    description: "Tắt vòi nước và kiểm tra rò rỉ thường xuyên.",
    details: {
      importance: "Nước sạch là tài nguyên hữu hạn và thiết yếu cho sự sống. Tiết kiệm nước giúp bảo tồn hệ sinh thái, giảm chi phí năng lượng và đảm bảo an ninh nguồn nước cho tương lai.",
      solutions: [
        { title: "Tắt vòi nước", description: "Tắt nước khi đánh răng, cạo râu hoặc xoa xà phòng. Hành động nhỏ này có thể tiết kiệm hàng chục lít nước mỗi ngày." },
        { title: "Kiểm tra và sửa chữa rò rỉ", description: "Một vòi nước nhỏ giọt có thể lãng phí hàng ngàn lít nước mỗi năm. Thường xuyên kiểm tra bồn cầu và đường ống để phát hiện rò rỉ." },
        { title: "Tái sử dụng nước", description: "Dùng nước vo gạo, rửa rau để tưới cây. Đây là cách tuyệt vời để tiết kiệm nước và cung cấp dinh dưỡng cho cây." },
      ],
      tip: "Lắp đặt các thiết bị tiết kiệm nước như vòi hoa sen hoặc vòi nước lưu lượng thấp có thể giảm tới 30% lượng nước tiêu thụ."
    }
  }
];

const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const pastDate = new Date(date);
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  let interval = seconds / 31536000; // năm
  if (interval > 1) {
    return `${Math.floor(interval)} năm`;
  }
  interval = seconds / 2592000; // tháng
  if (interval > 1) {
    return `${Math.floor(interval)} tháng`;
  }
  interval = seconds / 86400; // ngày
  if (interval > 1) {
    return `${Math.floor(interval)} ngày`;
  }
  interval = seconds / 3600; // giờ
  if (interval > 1) {
    return `${Math.floor(interval)} giờ`;
  }
  interval = seconds / 60; // phút
  if (interval > 1) {
    return `${Math.floor(interval)} phút`;
  }
  return "Vừa xong";
};

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Báo cáo mới':
      return { label: 'Mới', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-100' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-100' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-100' };
    default:
      return { label: 'Không rõ', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-100' };
  }
};


const HomeView: React.FC<HomeViewProps> = ({ reports, onNavigateToMap, onStartNewReport, onSelectReportAndNavigateToMap, onSelectEducationTopic, onNavigateToEnvironmentalMap, onNavigateToSOS }) => {
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Đã xử lý').length;

  return (
    <div className="w-full">
      {/* Phần Hero */}
      <div className="relative mb-8 overflow-hidden rounded-b-[2.5rem] bg-white shadow-sm border-b border-gray-100">
        <HeroBanner />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Lưới chính */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột trái: Nội dung chính */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hành động chính (Buttons) */}
            <section aria-label="Các hành động chính">
               <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Truy cập nhanh</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button onClick={onStartNewReport} className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all duration-300 hover:-translate-y-1">
                  <div className="p-3 bg-white/20 rounded-full mb-3 text-white group-hover:scale-110 transition-transform">
                    <DocumentPlusIcon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-white text-sm">Báo cáo mới</span>
                </button>

                <button onClick={onNavigateToMap} className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="p-3 bg-slate-50 rounded-full mb-3 text-slate-600 group-hover:bg-slate-100 transition-colors">
                     <MapIcon className="w-8 h-8" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Bản đồ Sự cố</span>
                </button>

                <button onClick={onNavigateToEnvironmentalMap} className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="p-3 bg-indigo-50 rounded-full mb-3 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                     <GlobeIcon className="w-8 h-8" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm text-center">Bản đồ Xanh</span>
                </button>

                <button onClick={onNavigateToSOS} className="group flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-2xl shadow-sm hover:shadow-red-100 transition-all duration-300 hover:-translate-y-1">
                  <div className="p-3 bg-red-100 rounded-full mb-3 text-red-600 group-hover:bg-red-200 transition-colors animate-pulse">
                     <SOSIcon className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-red-700 text-sm">SOS</span>
                </button>
               </div>
            </section>

             {/* Thống kê */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                 <span className="w-1.5 h-6 bg-teal-500 rounded-full mr-3"></span>
                 Tổng quan cộng đồng
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-blue-50 p-6 transition-all hover:bg-blue-100/80">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-blue-800 mb-1">Tổng báo cáo</p>
                    <p className="text-4xl font-extrabold text-blue-600 tracking-tight">{totalReports}</p>
                  </div>
                   <ClipboardListIcon className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-200 opacity-50 rotate-12" />
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-green-50 p-6 transition-all hover:bg-green-100/80">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-green-800 mb-1">Đã xử lý</p>
                    <p className="text-4xl font-extrabold text-green-600 tracking-tight">{resolvedReports}</p>
                  </div>
                  <CheckBadgeIcon className="absolute -right-4 -bottom-4 w-24 h-24 text-green-200 opacity-50 rotate-12"/>
                </div>
              </div>
            </section>

            {/* Báo cáo gần đây */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center">
                   <span className="w-1.5 h-6 bg-amber-500 rounded-full mr-3"></span>
                   Báo cáo mới nhất
                </h3>
                <button onClick={onNavigateToMap} className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline">Xem tất cả</button>
              </div>
              
              <div className="space-y-4">
                {reports.slice(0, 4).map((report) => {
                  const statusDetails = getStatusDetails(report.status);
                  return (
                    <button
                      key={report.id}
                      onClick={() => onSelectReportAndNavigateToMap(report)}
                      className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-200 flex items-start gap-4 group"
                    >
                      {/* Media Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 relative">
                         {report.mediaType === 'image' ? (
                            <img src={report.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         ) : (
                            <video src={report.mediaUrl} className="w-full h-full object-cover" />
                         )}
                         {report.mediaType === 'video' && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                                     <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-slate-800 border-b-4 border-b-transparent ml-0.5"></div>
                                 </div>
                             </div>
                         )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-slate-800 text-sm truncate pr-2 group-hover:text-teal-700 transition-colors">
                                {report.aiAnalysis.issueType}
                            </h4>
                            <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{formatTimeAgo(report.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{report.aiAnalysis.description}</p>
                        
                        <div className="mt-2 flex items-center gap-2">
                             <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border ${statusDetails.bgColor} ${statusDetails.textColor} ${statusDetails.borderColor}`}>
                                {statusDetails.label}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {report.aiAnalysis.priority}
                            </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                 {reports.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-slate-400">Chưa có báo cáo nào.</p>
                    </div>
                )}
              </div>
            </section>
          </div>

          {/* Cột phải: Giáo dục */}
          <div className="lg:col-span-4 space-y-8">
             <section className="bg-gradient-to-b from-white to-slate-50 p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                    Kiến thức xanh
                </h3>
                <div className="space-y-4">
                    {educationalContent.map((item, index) => (
                      <EducationCard 
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        onSelect={() => onSelectEducationTopic(item)}
                      />
                    ))}
                </div>
                
                <div className="mt-8 p-4 bg-teal-50 rounded-2xl border border-teal-100">
                    <p className="text-sm text-teal-800 font-medium text-center">
                        "Hành động nhỏ, ý nghĩa lớn. Hãy cùng nhau bảo vệ Đà Nẵng!"
                    </p>
                </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
