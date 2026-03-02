
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
import OfflineReportsModal from './components/OfflineReportsModal';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import { SOSIcon } from './components/icons/SOSIcon';
import { CloudIcon } from './components/icons/CloudIcon';

// Dữ liệu mẫu tĩnh (Static Data) - Chỉ dùng để hiển thị khi người dùng chưa nhập gì
const initialReports: EnvironmentalReport[] = []; // Clear static data, fetch from API

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
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [view, setView] = useState<'home' | 'map' | 'form' | 'thankYou' | 'environmentalMap' | 'sos' | 'login' | 'dashboard'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'map' | 'environmentalMap'>('home');
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [lastAwardedPoints, setLastAwardedPoints] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEducationTopic, setSelectedEducationTopic] = useState<EducationalTopic | null>(null);
  const [mapViewState, setMapViewState] = useState({
    center: [15.85, 108.3] as [number, number],
    zoom: 10,
  });
  
  // Auth State
  const [user, setUser] = useState<any>(null);

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
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  // Load user from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch reports from API
  const fetchReports = async () => {
    if (!isOnline) return;
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        const parsedData = data.map((report: any) => ({
          ...report,
          timestamp: new Date(report.timestamp)
        }));
        setReports(parsedData);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Setup WebSocket for real-time updates
    if (isOnline) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_REPORT') {
            addToast(`Có báo cáo mới tại ${data.report.area}`, 'success');
            const newReport = { ...data.report, timestamp: new Date(data.report.timestamp) };
            setReports(prev => [newReport, ...prev]);
          } else if (data.type === 'REPORT_UPDATED') {
            setReports(prev => prev.map(r => r.id === data.id ? { ...r, status: data.status } : r));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.warn('WebSocket error (this is normal in some preview environments):', error);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    }
  }, [isOnline]);

  // Effect to handle online/offline status and sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Đã kết nối lại Internet. Đang đồng bộ dữ liệu...', 'success');
      syncOfflineReports();
      fetchReports(); // Refresh data
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Mất kết nối Internet. Chế độ Offline đã được kích hoạt.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending reports
    updatePendingReportsCount();

    // Fetch approximate location via IP immediately on load (No permission needed)
    const fetchApproximateLocation = async () => {
      try {
        // Only fetch if we don't have a precise location yet
        if (!userLocation) {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    // Check if the location is within reasonable bounds of Vietnam to avoid VPN weirdness
                    if (data.latitude > 8 && data.latitude < 24 && data.longitude > 102 && data.longitude < 110) {
                        setUserLocation({ latitude: data.latitude, longitude: data.longitude });
                        // Don't show toast for IP location to keep it subtle, 
                        // or maybe a small info toast: "Đang hiển thị khu vực của bạn (theo IP)"
                    }
                }
            }
        }
      } catch (error) {
        console.warn("Could not fetch IP location:", error);
      }
    };
    
    fetchApproximateLocation();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingReportsCount = () => {
    getOfflineReports().then(reports => {
      setPendingReportsCount(reports.length);
      if (navigator.onLine && reports.length > 0) {
        syncOfflineReports();
      }
    });
  };

  const syncOfflineReports = async () => {
    try {
      const offlineReports = await getOfflineReports();
      if (offlineReports.length === 0) return;

      // Send to server
      for (const report of offlineReports) {
        try {
          const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
          });
          
          if (response.ok) {
            await deleteOfflineReport(report.id);
          } else {
            console.error(`Failed to sync report ${report.id}: ${response.statusText}`);
          }
        } catch (err) {
          console.error(`Error syncing report ${report.id}:`, err);
        }
      }

      setPendingReportsCount(0);
      addToast(`Đã đồng bộ ${offlineReports.length} báo cáo offline thành công!`, 'success');
      fetchReports();

    } catch (error) {
      console.error("Sync failed:", error);
      addToast('Đồng bộ thất bại. Vui lòng thử lại sau.', 'error');
    }
  };

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

  // Effect để theo dõi vị trí của người dùng liên tục với độ chính xác cao
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Trình duyệt không hỗ trợ định vị");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Vị trí cập nhật: ${latitude}, ${longitude} (Độ chính xác: ${accuracy}m)`);
        
        setUserLocation({ latitude, longitude });
        
        // Cập nhật tâm bản đồ nếu chưa có vị trí hoặc độ chính xác tốt
        setMapViewState(prev => {
          // Nếu chưa có tâm bản đồ thực sự (đang ở mặc định), thì cập nhật
          if (prev.center[0] === 15.85 && prev.center[1] === 108.3) {
            return { ...prev, center: [latitude, longitude] };
          }
          return prev;
        });
      },
      (error) => {
        let errorMsg = "";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Người dùng từ chối cấp quyền định vị.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Thông tin vị trí không khả dụng.";
            break;
          case error.TIMEOUT:
            errorMsg = "Hết thời gian chờ lấy vị trí.";
            break;
          default:
            errorMsg = "Lỗi định vị không xác định.";
        }
        console.warn("Lỗi định vị:", errorMsg);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 30000, 
        maximumAge: 0 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []); // Chạy một lần khi mount, watchPosition sẽ tự lo phần cập nhật

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

  const handleStartNewReport = (currentView: 'home' | 'map' | 'environmentalMap') => {
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
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mediaUrl: compressedMediaUrl,
        mediaType: mediaFile.type.startsWith('video') ? 'video' : 'image',
        latitude: coords.latitude,
        longitude: coords.longitude,
        userDescription,
        description: aiAnalysis.description,
        aiAnalysis, // Sử dụng trực tiếp kết quả phân tích
        status: 'Báo cáo mới',
        timestamp: new Date(),
      };

      if (!isOnline) {
        // Save to IndexedDB if offline
        await saveOfflineReport(newReport);
        setPendingReportsCount(prev => prev + 1);
        addToast('Đã lưu báo cáo vào bộ nhớ tạm. Sẽ tự động gửi khi có mạng.', 'success');
        
        // SMS Fallback Prompt
        if (window.confirm("Bạn đang offline. Bạn có muốn gửi tin nhắn SMS khẩn cấp kèm tọa độ GPS đến tổng đài không?")) {
            const smsBody = `SOS! Su co moi truong tai: ${coords.latitude},${coords.longitude}. Mo ta: ${userDescription}`;
            window.open(`sms:1022?body=${encodeURIComponent(smsBody)}`);
        }

      } else {
        // Online: Send to API
        // Check payload size for Vercel (approx 4.5MB limit)
        const payloadSize = JSON.stringify(newReport).length;
        if (payloadSize > 4 * 1024 * 1024) {
          addToast('Dữ liệu quá lớn (vượt quá 4MB). Vui lòng chọn ảnh/video nhỏ hơn hoặc nén lại.', 'error');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReport),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = response.status === 413 ? 'Dữ liệu quá lớn cho máy chủ.' : (errorData.message || `Lỗi máy chủ (${response.status})`);
          throw new Error(message);
        }
        
        // Tặng điểm cho báo cáo mới
        const pointsAwarded = 10;
        setUserPoints(prevPoints => prevPoints + pointsAwarded);
        setLastAwardedPoints(pointsAwarded);
        
        addToast('Báo cáo đã được gửi thành công!', 'success');
        fetchReports(); // Refresh list
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
  
  const handleUpdateReportStatus = async (reportId: string) => {
     const statusCycle: Record<ReportStatus, ReportStatus> = {
      'Báo cáo mới': 'Đang xử lý',
      'Đang xử lý': 'Đã xử lý',
      'Đã xử lý': 'Báo cáo mới',
    };
    
    const currentReport = reports.find(r => r.id === reportId);
    if (!currentReport) return;

    const newStatus = statusCycle[currentReport.status];

    try {
        const response = await fetch(`/api/reports/${reportId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            setReports(prevReports =>
                prevReports.map(report =>
                  report.id === reportId
                    ? { ...report, status: newStatus }
                    : report
                )
              );
              setSelectedReport(prev => prev ? {...prev, status: newStatus} : null);
              addToast('Cập nhật trạng thái báo cáo thành công!');
        }
    } catch (error) {
        addToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleExternalAnalysis = async (reportId: string, mediaUrl: string) => {
    try {
      const response = await fetch('/api/external-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, data: mediaUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi khi gọi mô hình ngoài');
      }

      return await response.json();
    } catch (error: any) {
      addToast(error.message || 'Lỗi kết nối mô hình ngoài', 'error');
      throw error;
    }
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

  const handleLogin = (userData: any) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('home');
  };

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
                  userLocation={userLocation}
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
                  initialCoords={userLocation}
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
                  userLocation={userLocation}
                  onNavigateHome={() => setView('home')}
                  onSelectReport={handleSelectReport}
                  onStartReport={() => handleStartNewReport('environmentalMap')}
                />;
      case 'sos':
        return <SOSView onClose={() => setView('home')} />;
      case 'login':
        return <LoginView onLogin={handleLogin} />;
      case 'dashboard':
        return <DashboardView user={user} />;
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
                <button 
                  onClick={() => setIsOfflineModalOpen(true)}
                  className="flex items-center space-x-1 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse hover:bg-amber-200 transition-colors"
                >
                  <CloudIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Offline ({pendingReportsCount})</span>
                </button>
              )}
              {isOnline && pendingReportsCount > 0 && (
                 <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-bold">
                  <CloudIcon className="w-4 h-4 animate-bounce" />
                  <span className="hidden sm:inline">Đang đồng bộ...</span>
                </div>
              )}
              <button
                onClick={() => setView('sos')}
                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center animate-pulse hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 transform hover:scale-105"
                title="SOS"
              >
                <SOSIcon className="w-6 h-6" />
              </button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="text-sm font-bold text-slate-700 hover:text-teal-600 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-slate-700 hover:text-teal-600 transition-colors bg-slate-100 px-3 py-1.5 rounded-full"
                >
                  Cán bộ
                </button>
              )}

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
            onExternalAnalysis={handleExternalAnalysis}
          />
        )}

        {selectedEducationTopic && (
          <EducationDetailModal
            topic={selectedEducationTopic}
            onClose={handleCloseEducationModal}
          />
        )}

        <OfflineReportsModal 
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
          onReportsChanged={updatePendingReportsCount}
        />
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
