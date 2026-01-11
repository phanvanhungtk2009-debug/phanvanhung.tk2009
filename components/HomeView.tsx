
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
    icon: <RecycleIcon className="w-10 h-10 text-green-600" />,
    title: "Phân loại rác tại nguồn",
    description: "Tách riêng rác hữu cơ, tái chế và rác khác giúp giảm gánh nặng cho bãi chôn lấp và bảo tồn tài nguyên.",
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
    icon: <PlasticBottleIcon className="w-10 h-10 text-blue-600" />,
    title: "Giảm thiểu nhựa dùng một lần",
    description: "Sử dụng túi vải, chai nước cá nhân và hộp đựng thức ăn để hạn chế rác thải nhựa gây hại cho đại dương.",
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
    icon: <WaterDropIcon className="w-10 h-10 text-cyan-600" />,
    title: "Tiết kiệm nước sạch",
    description: "Tắt vòi nước, kiểm tra rò rỉ và tái sử dụng nước là những cách đơn giản để bảo vệ nguồn tài nguyên quý giá này.",
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

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // năm
  if (interval > 1) {
    return `${Math.floor(interval)} năm trước`;
  }
  interval = seconds / 2592000; // tháng
  if (interval > 1) {
    return `${Math.floor(interval)} tháng trước`;
  }
  interval = seconds / 86400; // ngày
  if (interval > 1) {
    return `${Math.floor(interval)} ngày trước`;
  }
  interval = seconds / 3600; // giờ
  if (interval > 1) {
    return `${Math.floor(interval)} giờ trước`;
  }
  interval = seconds / 60; // phút
  if (interval > 1) {
    return `${Math.floor(interval)} phút trước`;
  }
  return "Vừa xong";
};

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Báo cáo mới':
      return { label: 'Mới', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    default:
      return { label: 'Không rõ', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};


const HomeView: React.FC<HomeViewProps> = ({ reports, onNavigateToMap, onStartNewReport, onSelectReportAndNavigateToMap, onSelectEducationTopic, onNavigateToEnvironmentalMap, onNavigateToSOS }) => {
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Đã xử lý').length;

  return (
    <div className="w-full">
      {/* Phần Hero */}
      <div className="mb-8">
        <HeroBanner />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Lưới chính */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Thống kê và Hành động */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thống kê */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Thống kê cộng đồng</h3>
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
                    <p className="font-semibold text-green-800">Sự cố đã xử lý</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedReports}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Báo cáo gần đây */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Báo cáo gần đây</h3>
              <div className="space-y-2">
                {reports.slice(0, 4).map((report) => {
                  const statusDetails = getStatusDetails(report.status);
                  return (
                    <button
                      key={report.id}
                      onClick={() => onSelectReportAndNavigateToMap(report)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      aria-label={`Xem chi tiết báo cáo về ${report.aiAnalysis.issueType}`}
                    >
                      <div className="flex-grow pr-4">
                        <p className="font-semibold text-slate-800 group-hover:text-teal-700 truncate">{report.aiAnalysis.issueType}</p>
                        <p className="text-sm text-slate-500">{formatTimeAgo(report.timestamp)}</p>
                      </div>
                      <div className="flex-shrink-0 ml-auto">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusDetails.bgColor} ${statusDetails.textColor}`}>
                          {statusDetails.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
                 {reports.length === 0 && (
                    <p className="text-slate-500 text-center py-4">Chưa có báo cáo nào được gửi.</p>
                )}
              </div>
            </div>

            {/* Hành động */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4">
               <h3 className="text-xl font-bold text-slate-800">Hành động ngay</h3>
               <p className="text-sm text-slate-500 pb-2">Chung tay vì một Đà Nẵng xanh, sạch hơn.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={onStartNewReport} className="text-lg bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <DocumentPlusIcon className="w-6 h-6" />
                  <span>Báo cáo mới</span>
                </button>
                <button onClick={onNavigateToMap} className="text-lg bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-slate-800 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <MapIcon className="w-6 h-6" />
                  <span>Xem bản đồ</span>
                </button>
                <button onClick={onNavigateToEnvironmentalMap} className="md:col-span-2 text-lg bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <GlobeIcon className="w-6 h-6" />
                  <span>Khám phá bản đồ môi trường</span>
                </button>
                <button onClick={onNavigateToSOS} className="md:col-span-2 text-lg bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 animate-pulse">
                  <SOSIcon className="w-6 h-6" />
                  <span>KHẨN CẤP / SOS</span>
                </button>
               </div>
            </div>
          </div>

          {/* Cột phải: Giáo dục */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full">
                <h3 className="text-xl font-bold mb-4 text-slate-800">Nội dung giáo dục</h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
