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


interface HomeViewProps {
  reports: EnvironmentalReport[];
  onNavigateToMap: () => void;
  onStartNewReport: () => void;
  onSelectReportAndNavigateToMap: (report: EnvironmentalReport) => void;
  onSelectEducationTopic: (topic: EducationalTopic) => void;
  onNavigateToEnvironmentalMap: () => void;
}

const educationalContent: EducationalTopic[] = [
  {
    id: 'waste-sorting',
    icon: <RecycleIcon className="w-10 h-10 text-green-600" />,
    title: "Phân loại rác tại nguồn",
    description: "Phân loại rác hữu cơ, tái chế và rác còn lại giúp giảm gánh nặng cho các bãi chôn lấp và tận dụng tài nguyên.",
    details: {
      importance: "Phân loại rác đúng cách giúp tối đa hóa lượng rác được tái chế, giảm thiểu ô nhiễm đất và nước, và tiết kiệm tài nguyên thiên nhiên.",
      solutions: [
        { title: "Rác hữu cơ (Thùng xanh)", description: "Bao gồm thức ăn thừa, vỏ rau củ quả. Loại rác này có thể được ủ thành phân compost bón cho cây trồng." },
        { title: "Rác tái chế (Thùng vàng/trắng)", description: "Giấy, nhựa, kim loại, thủy tinh. Hãy làm sạch chúng trước khi bỏ vào thùng để tăng hiệu quả tái chế." },
        { title: "Rác còn lại (Thùng xám)", description: "Tã bỉm, túi nilon bẩn, các vật dụng không thể tái chế. Đây là loại rác sẽ được mang đi chôn lấp." },
      ],
      tip: "Hãy đặt ba thùng rác nhỏ trong nhà bếp của bạn để hình thành thói quen phân loại rác ngay từ đầu."
    }
  },
  {
    id: 'plastic-reduction',
    icon: <PlasticBottleIcon className="w-10 h-10 text-blue-600" />,
    title: "Giảm nhựa một lần",
    description: "Sử dụng túi vải, bình nước cá nhân và hộp đựng thức ăn để hạn chế rác thải nhựa gây hại cho đại dương.",
    details: {
      importance: "Rác thải nhựa mất hàng trăm năm để phân hủy, vỡ ra thành các vi nhựa độc hại, gây ô nhiễm nghiêm trọng cho hệ sinh thái biển và ảnh hưởng đến sức khỏe con người.",
      solutions: [
        { title: "Mang theo đồ dùng cá nhân", description: "Luôn có sẵn túi vải khi đi chợ, bình nước và ly cá nhân để mua đồ uống mang đi." },
        { title: "Từ chối ống hút nhựa", description: "Yêu cầu không dùng ống hút nhựa hoặc sử dụng các loại ống hút tái sử dụng như inox, tre, thủy tinh." },
        { title: "Chọn sản phẩm không có bao bì nhựa", description: "Ưu tiên mua các sản phẩm được đóng gói bằng vật liệu thân thiện với môi trường như giấy, thủy tinh." },
      ],
      tip: "Bắt đầu bằng một thử thách nhỏ: 'Một ngày không sử dụng đồ nhựa dùng một lần' để thấy sự khác biệt bạn có thể tạo ra."
    }
  },
  {
    id: 'water-saving',
    icon: <WaterDropIcon className="w-10 h-10 text-cyan-600" />,
    title: "Tiết kiệm nước sạch",
    description: "Tắt vòi nước khi không sử dụng, kiểm tra rò rỉ và tái sử dụng nước là những cách đơn giản để bảo vệ nguồn tài nguyên quý giá.",
    details: {
      importance: "Nước sạch là một nguồn tài nguyên hữu hạn và thiết yếu cho sự sống. Tiết kiệm nước giúp bảo tồn hệ sinh thái, giảm chi phí năng lượng và đảm bảo an ninh nguồn nước cho tương lai.",
      solutions: [
        { title: "Tắt vòi nước", description: "Khóa vòi nước khi bạn đang đánh răng, cạo râu hoặc rửa tay với xà phòng. Một hành động nhỏ có thể tiết kiệm hàng chục lít nước mỗi ngày." },
        { title: "Kiểm tra và sửa chữa rò rỉ", description: "Một vòi nước rò rỉ có thể lãng phí hàng ngàn lít nước mỗi năm. Thường xuyên kiểm tra toilet và các đường ống để khắc phục sự cố." },
        { title: "Tái sử dụng nước", description: "Sử dụng nước vo gạo hoặc nước rửa rau củ để tưới cây. Đây là cách tuyệt vời để tiết kiệm và cung cấp dinh dưỡng cho cây." },
      ],
      tip: "Lắp đặt các thiết bị tiết kiệm nước như vòi hoa sen hoặc vòi rửa có lưu lượng thấp có thể giảm lượng nước tiêu thụ lên đến 30%."
    }
  }
];

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " năm trước";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " tháng trước";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " ngày trước";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " giờ trước";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " phút trước";
  }
  return "Vừa xong";
};

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Mới báo cáo':
      return { label: 'Mới báo cáo', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    default:
      return { label: 'Không xác định', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};


const HomeView: React.FC<HomeViewProps> = ({ reports, onNavigateToMap, onStartNewReport, onSelectReportAndNavigateToMap, onSelectEducationTopic, onNavigateToEnvironmentalMap }) => {
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

            {/* Recent Reports */}
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

            {/* Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4">
               <h3 className="text-xl font-bold text-slate-800">Hành động ngay</h3>
               <p className="text-sm text-slate-500 pb-2">Chung tay vì một Đà Nẵng xanh sạch đẹp hơn.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={onStartNewReport} className="text-lg bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <DocumentPlusIcon className="w-6 h-6" />
                  <span>Báo Cáo Mới</span>
                </button>
                <button onClick={onNavigateToMap} className="text-lg bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-slate-800 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <MapIcon className="w-6 h-6" />
                  <span>Xem Bản Đồ</span>
                </button>
                <button onClick={onNavigateToEnvironmentalMap} className="md:col-span-2 text-lg bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105">
                  <GlobeIcon className="w-6 h-6" />
                  <span>Khám phá Bản đồ Môi trường</span>
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