
import React, { useState, useCallback, useEffect } from 'react';
import * as L from 'leaflet';
import { analyzeEnvironmentalImage, askAIAboutEnvironment } from './services/geminiService';
import { saveOfflineReport, getOfflineReports, deleteOfflineReport, compressImage } from './services/offlineService';
import { EnvironmentalReport, AIAnalysis, ReportStatus, ChatMessage, ToastMessage, EducationalTopic, EnvironmentalPOI } from './types';
import MainMapView from './components/MainMapView';
import ReportForm from './components/ReportForm';
import ReportDetailModal from './components/ReportDetailModal';
import HomeView from './components/HomeView';
import ThankYouView from './components/ThankYouView';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import ToastContainer from './components/ToastContainer';
import { LogoIcon } from './components/icons/LogoIcon';
import { TrophyIcon } from './components/icons/TrophyIcon';
import EducationDetailModal from './components/EducationDetailModal';
import EnvironmentalMapView from './components/EnvironmentalMapView';
import SOSView from './components/SOSView';
import { SOSIcon } from './components/icons/SOSIcon';
import { CloudIcon } from './components/icons/CloudIcon'; // Assuming you might have this or use a generic icon

// Dữ liệu mẫu tĩnh (Static Data) - Chỉ dùng để hiển thị khi người dùng chưa nhập gì
// Đã xóa hàm tự động random dữ liệu để đảm bảo tính nghiêm túc.
const initialReports: EnvironmentalReport[] = [
  {
    id: '1',
    mediaUrl: 'https://images.unsplash.com/photo-1598692294285-649a6f18638b?q=80&w=2070&auto=format&fit=crop',
    mediaType: 'image',
    latitude: 16.0748,
    longitude: 108.2236,
    userDescription: 'Rác thải sinh hoạt vứt bừa bãi gần Cầu Rồng.',
    aiAnalysis: {
      issueType: 'Xả rác không đúng nơi quy định',
      description: 'Một lượng lớn rác thải sinh hoạt, bao gồm túi ni lông và hộp, đã tích tụ ở khu vực công cộng.',
      priority: 'Cao',
      solution: 'Cần đội vệ sinh môi trường đến thu gom và lắp đặt thêm thùng rác tại khu vực này.',
      isIssuePresent: true,
    },
    status: 'Báo cáo mới',
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 ngày trước
  },
  {
    id: '4',
    mediaUrl: 'https://storage.googleapis.com/static-ai-apps/media/Da_Nang_Flooding.mp4',
    mediaType: 'video',
    latitude: 16.0601,
    longitude: 108.2225,
    userDescription: "Đường ngập sâu sau trận mưa lớn, xe cộ không đi lại được.",
    aiAnalysis: {
      issueType: 'Ngập lụt',
      description: 'Khu vực đường Nguyễn Văn Linh bị ngập sâu, cản trở giao thông nghiêm trọng.',
      priority: 'Cao',
      solution: 'Cảnh báo người dân, điều tiết giao thông và huy động đội thoát nước khơi thông hệ thống cống.',
      isIssuePresent: true,
      recommendedSupplies: ["Nước sạch đóng chai", "Thực phẩm khô (lương khô, mì gói)", "Áo phao", "Đèn pin"]
    },
    status: 'Đang xử lý',
    timestamp: new Date(Date.now() - 86400000), // 1 ngày trước
  },
   {
    id: '3',
    mediaUrl: 'https://images.unsplash.com/photo-1523348835941-8d5a77ecaf2a?q=80&w=1974&auto=format&fit=crop',
    mediaType: 'image',
    latitude: 16.0544,
    longitude: 108.2022,
    userDescription: 'Cây cối ở đây có vẻ đã được cắt tỉa gọn gàng.',
    aiAnalysis: {
      issueType: 'Không có sự cố',
      description: 'Cây xanh đã được dọn dẹp và không còn gây cản trở.',
      priority: 'Thấp',
      solution: 'Không cần hành động thêm, cây xanh đã được chăm sóc.',
      isIssuePresent: false,
    },
    status: 'Đã xử lý',
    timestamp: new Date(Date.now() - 86400000 * 5), // 5 ngày trước
  },
  {
    id: '5',
    mediaUrl: 'https://storage.googleapis.com/static-ai-apps/media/Da_Nang_Landslide.mp4',
    mediaType: 'video',
    latitude: 16.115, // Bán đảo Sơn Trà
    longitude: 108.27,
    userDescription: 'Sạt lở đất đá trên đường lên Sơn Trà, rất nguy hiểm.',
    aiAnalysis: {
      issueType: 'Sạt lở đất',
      description: 'Một lượng lớn đất đá đã sạt lở xuống lòng đường, chặn một phần lối đi và có nguy cơ tiếp tục sạt lở.',
      priority: 'Cao',
      solution: 'Cần phong tỏa khu vực, đặt biển báo nguy hiểm và cử đội công trình đến khắc phục ngay lập tức.',
      isIssuePresent: true,
      recommendedSupplies: ["Dụng cụ sơ cứu y tế", "Nước uống", "Xẻng/Cuốc (hỗ trợ cứu nạn)", "Thực phẩm dự trữ"]
    },
    status: 'Báo cáo mới',
    timestamp: new Date(Date.now() - 3600000 * 3), // 3 giờ trước
  },
];

// Dữ liệu các điểm môi trường quan trọng (POIs)
const environmentalPOIs: EnvironmentalPOI[] = [
  {
    id: 'poi-1',
    type: 'NatureReserve',
    name: 'Khu bảo tồn thiên nhiên Sơn Trà',
    description: 'Một công viên quốc gia đa dạng sinh học, là nơi sinh sống của loài Voọc chà vá chân nâu quý hiếm. Nơi tuyệt vời để đi bộ đường dài và tìm hiểu về thiên nhiên.',
    latitude: 16.1333,
    longitude: 108.2833,
  },
  {
    id: 'poi-2',
    type: 'RecyclingCenter',
    name: 'Trung tâm Tái chế Đà Nẵng Xanh',
    description: 'Tiếp nhận các vật liệu có thể tái chế như nhựa, giấy, kim loại và thủy tinh. Giúp giảm thiểu rác thải và bảo vệ tài nguyên.',
    latitude: 16.031,
    longitude: 108.182,
  },
  {
    id: 'poi-3',
    type: 'CommunityCleanup',
    name: 'Điểm tập kết dọn dẹp Bãi biển Mỹ Khê',
    description: 'Điểm hẹn hàng tuần cho các tình nguyện viên tham gia các hoạt động làm sạch bãi biển, giữ gìn vẻ đẹp cho một trong những bãi biển đẹp nhất hành tinh.',
    latitude: 16.0585,
    longitude: 108.248,
  },
  {
    id: 'poi-4',
    type: 'WaterStation',
    name: 'Trạm nước uống công cộng Cầu Rồng',
    description: 'Trạm nạp nước miễn phí giúp giảm thiểu việc sử dụng chai nhựa dùng một lần. Hãy mang theo chai cá nhân của bạn!',
    latitude: 16.0615,
    longitude: 108.2275,
  },
];

const App: React.FC = () => {
  const [reports, setReports] = useState<EnvironmentalReport[]>(() => {
    try {
      const savedReportsJSON = localStorage.getItem('daNangGreenReports');
      if (savedReportsJSON) {
        const parsedReports = JSON.parse(savedReportsJSON);
        return parsedReports.map((report: EnvironmentalReport) => ({
          ...report,
          timestamp: new Date(report.timestamp),
        }));
      }
    } catch (error) {
      console.error("Lỗi khi tải báo cáo từ localStorage:", error);
    }
    return initialReports;
  });
  
  const [view, setView] = useState<'home' | 'map' | 'form' | 'thankYou' | 'environmentalMap' | 'sos'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'map'>('home');
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [lastAwardedPoints, setLastAwardedPoints] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEducationTopic, setSelectedEducationTopic] = useState<EducationalTopic | null>(null);
  const [mapViewState, setMapViewState] = useState({
    center: [16.0544, 108.2022] as [number, number],
    zoom: 13,
  });
  
  // State cho Trợ lý AI nổi
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: 'Xin chào! Tôi là Trợ lý AI của DA NANG GREEN. Tôi có thể giúp gì cho bạn hôm nay?',
      suggestions: [
        "Cách phân loại rác đúng cách?",
        "Báo cáo một điểm xả rác trái phép.",
        "Một số mẹo tiết kiệm nước là gì?",
      ]
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Offline Mode State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  // Effect to handle online/offline status and sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Đã kết nối lại Internet. Đang đồng bộ dữ liệu...', 'success');
      syncOfflineReports();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Mất kết nối Internet. Chế độ Offline đã được kích hoạt.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending reports
    getOfflineReports().then(reports => {
      setPendingReportsCount(reports.length);
      if (navigator.onLine && reports.length > 0) {
        syncOfflineReports();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineReports = async () => {
    try {
      const offlineReports = await getOfflineReports();
      if (offlineReports.length === 0) return;

      // Simulate sending to server by adding to local state
      // In a real app, you would POST to an API here
      setReports(prev => [...offlineReports, ...prev]);
      
      // Delete from IndexedDB after successful sync
      for (const report of offlineReports) {
        await deleteOfflineReport(report.id);
      }

      setPendingReportsCount(0);
      addToast(`Đã đồng bộ ${offlineReports.length} báo cáo offline thành công!`, 'success');
      
      // Trigger background sync registration if supported (optional, for robustness)
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          // @ts-ignore
          registration.sync.register('sync-reports');
      }

    } catch (error) {
      console.error("Sync failed:", error);
      addToast('Đồng bộ thất bại. Vui lòng thử lại sau.', 'error');
    }
  };
  
  // Effect để tải và lưu báo cáo vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daNangGreenReports', JSON.stringify(reports));
    } catch (error) {
      console.error("Lỗi khi lưu báo cáo vào localStorage:", error);
    }
  }, [reports]);

  // Effect để tải điểm từ localStorage khi render lần đầu
  useEffect(() => {
    try {
      const savedPoints = localStorage.getItem('daNangGreenUserPoints');
      if (savedPoints) {
        setUserPoints(parseInt(savedPoints, 10) || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải điểm từ localStorage:", error);
    }
  }, []);

    // Effect để lấy vị trí của người dùng một lần
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Không thể lấy vị trí người dùng:", error.message);
        }
      );
    }
  }, []);

  // Effect để lưu điểm vào localStorage mỗi khi chúng thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('daNangGreenUserPoints', userPoints.toString());
    } catch (error) {
      console.error("Lỗi khi lưu điểm vào localStorage:", error);
    }
  }, [userPoints]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  // ĐÃ XÓA: useEffect tạo báo cáo giả tự động

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const handleStartNewReport = (currentView: 'home' | 'map') => {
    setPreviousView(currentView);
    setView('form');
  };

  const handleAddNewReport = async (
    mediaFile: File,
    userDescription: string,
    coords: { latitude: number; longitude: number },
    aiAnalysis: AIAnalysis // Nhận kết quả phân tích đã được xác thực
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Compress image first (for both online and offline)
      const compressedMediaUrl = await compressImage(mediaFile);
      
      const newReport: EnvironmentalReport = {
        id: new Date().toISOString(),
        mediaUrl: compressedMediaUrl,
        mediaType: mediaFile.type.startsWith('video') ? 'video' : 'image',
        latitude: coords.latitude,
        longitude: coords.longitude,
        userDescription,
        aiAnalysis, // Sử dụng trực tiếp kết quả phân tích
        status: 'Báo cáo mới',
        timestamp: new Date(),
      };

      if (!isOnline) {
        // Save to IndexedDB if offline
        await saveOfflineReport(newReport);
        setPendingReportsCount(prev => prev + 1);
        addToast('Đã lưu báo cáo vào bộ nhớ tạm. Sẽ tự động gửi khi có mạng.', 'success');
        
        // Register background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            // @ts-ignore
            registration.sync.register('sync-reports');
        }
      } else {
        // Online: Add directly to state
        setReports(prevReports => [newReport, ...prevReports]);
        
        // Tặng điểm cho báo cáo mới
        const pointsAwarded = 10;
        setUserPoints(prevPoints => prevPoints + pointsAwarded);
        setLastAwardedPoints(pointsAwarded);
        
        addToast('Báo cáo đã được gửi thành công!', 'success');
      }
      
      setView('thankYou');
      setIsLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Lỗi khi tạo báo cáo: ${errorMessage}`);
      setIsLoading(false);
      console.error(err);
    }
  };
  
  const handleUpdateReportStatus = (reportId: string) => {
     const statusCycle: Record<ReportStatus, ReportStatus> = {
      'Báo cáo mới': 'Đang xử lý',
      'Đang xử lý': 'Đã xử lý',
      'Đã xử lý': 'Báo cáo mới',
    };
    
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId
          ? { ...report, status: statusCycle[report.status] }
          : report
      )
    );

    const newStatus = statusCycle[selectedReport!.status];
    setSelectedReport(prev => prev ? {...prev, status: newStatus} : null);
    addToast('Cập nhật trạng thái báo cáo thành công!');
  };

  const handleSelectReport = (report: EnvironmentalReport | null) => {
    setSelectedReport(report);
  };

  const handleChatSubmit = async (userMessage: string) => {
    if (!userMessage.trim() || isChatLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const aiResponse = await askAIAboutEnvironment(userMessage, userLocation);
      const newAiMessage: ChatMessage = {
        role: 'model',
        content: aiResponse.text,
        groundingChunks: aiResponse.groundingChunks,
      };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      { 
        role: 'model', 
        content: 'Xin chào! Tôi là Trợ lý AI của DA NANG GREEN. Tôi có thể giúp gì cho bạn hôm nay?',
        suggestions: [
          "Cách phân loại rác đúng cách?",
          "Báo cáo một điểm xả rác trái phép.",
          "Một số mẹo tiết kiệm nước là gì?",
        ]
      }
    ]);
  };

  const handleNavigateFromThankYou = (destination: 'home' | 'map') => {
    setView(destination);
    setLastAwardedPoints(0); // Đặt lại điểm để thông báo không hiển thị lại
  };

  const handleSelectReportAndNavigateToMap = (report: EnvironmentalReport) => {
    setView('map');
    // Đặt báo cáo được chọn sẽ làm cho modal xuất hiện trên chế độ xem bản đồ
    setSelectedReport(report);
  };

  const handleSelectEducationTopic = (topic: EducationalTopic) => {
    setSelectedEducationTopic(topic);
  };

  const handleCloseEducationModal = () => {
    setSelectedEducationTopic(null);
  };

  const handleMapViewChange = useCallback((center: L.LatLng, zoom: number) => {
    setMapViewState({ center: [center.lat, center.lng], zoom });
  }, []);

  const renderContent = () => {
    switch(view) {
      case 'home':
        return <HomeView 
                  reports={reports} 
                  onNavigateToMap={() => setView('map')} 
                  onStartNewReport={() => handleStartNewReport('home')}
                  onSelectReportAndNavigateToMap={handleSelectReportAndNavigateToMap}
                  onSelectEducationTopic={handleSelectEducationTopic}
                  onNavigateToEnvironmentalMap={() => setView('environmentalMap')}
                  onNavigateToSOS={() => setView('sos')}
                />;
      case 'map':
        return <MainMapView 
                  reports={reports} 
                  onSelectReport={handleSelectReport} 
                  onNavigateHome={() => setView('home')}
                  onStartNewReport={() => handleStartNewReport('map')}
                  selectedReport={selectedReport}
                  initialViewState={mapViewState}
                  onViewChange={handleMapViewChange}
                />;
      case 'form':
        return <ReportForm
                  onSubmit={handleAddNewReport}
                  onCancel={() => { setView(previousView); setError(null); }}
                  isLoading={isLoading}
                  error={error}
                  isOnline={isOnline}
                />;
      case 'thankYou':
        return <ThankYouView
                  awardedPoints={lastAwardedPoints}
                  onNavigateHome={() => handleNavigateFromThankYou('home')}
                  onNavigateToMap={() => handleNavigateFromThankYou('map')}
                />;
      case 'environmentalMap':
        return <EnvironmentalMapView
                  reports={reports}
                  pois={environmentalPOIs}
                  onNavigateHome={() => setView('home')}
                  onSelectReport={handleSelectReport}
                />;
      case 'sos':
        return <SOSView onClose={() => setView('home')} />;
      default:
         return <HomeView 
                  reports={reports} 
                  onNavigateToMap={() => setView('map')} 
                  onStartNewReport={() => handleStartNewReport('home')}
                  onSelectReportAndNavigateToMap={handleSelectReportAndNavigateToMap}
                  onSelectEducationTopic={handleSelectEducationTopic}
                   onNavigateToEnvironmentalMap={() => setView('environmentalMap')}
                   onNavigateToSOS={() => setView('sos')}
                />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-white selection:bg-teal-100 selection:text-teal-900">
       <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <header className="bg-white/80 backdrop-blur-md shadow-sm z-20 sticky top-0 border-b border-slate-100 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('home')}>
             <div className="transform transition-transform group-hover:scale-105 duration-300">
                <LogoIcon className="w-10 h-10 drop-shadow-sm" />
             </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-teal-700 hidden sm:block">
              DA NANG <span className="text-teal-600">GREEN</span>
            </h1>
          </div>
          
           <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Offline Indicator */}
              {!isOnline && (
                <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                  <CloudIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline ({pendingReportsCount})</span>
                </div>
              )}
              {isOnline && pendingReportsCount > 0 && (
                 <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-bold">
                  <CloudIcon className="w-4 h-4 animate-bounce" />
                  <span className="hidden sm:inline">Đang đồng bộ...</span>
                </div>
              )}
              <button
                onClick={() => setView('sos')}
                className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center space-x-2 animate-pulse hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 transform hover:scale-105"
              >
                <SOSIcon className="w-5 h-5" />
                <span className="hidden xs:inline">SOS</span>
              </button>

               <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 text-amber-900 font-bold px-4 py-1.5 rounded-full text-sm shadow-sm">
                  <TrophyIcon className="w-5 h-5 text-amber-500" />
                  <span className="hidden sm:inline">Điểm:</span>
                  <span>{userPoints}</span>
              </div>
           </div>
        </div>
      </header>
      
      <main className="flex-grow relative flex flex-col">
         {renderContent()}
        
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => handleSelectReport(null)}
            onUpdateStatus={handleUpdateReportStatus}
          />
        )}

        {selectedEducationTopic && (
          <EducationDetailModal
            topic={selectedEducationTopic}
            onClose={handleCloseEducationModal}
          />
        )}
      </main>

      {/* Trợ lý AI nổi */}
      <FloatingAIAssistant
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(prev => !prev)}
        messages={chatMessages}
        isLoading={isChatLoading}
        onSubmit={handleChatSubmit}
        onClearChat={handleClearChat}
      />
    </div>
  );
};

export default App;
