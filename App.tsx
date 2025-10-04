import React, { useState, useCallback, useEffect } from 'react';
import { analyzeEnvironmentalImage, askAIAboutEnvironment, isImageTrash } from './services/geminiService';
import { EnvironmentalReport, AIAnalysis, ReportStatus, ChatMessage, ToastMessage, EducationalTopic } from './types';
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

// Mock data to simulate existing reports in a database
const initialReports: EnvironmentalReport[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1598692294285-649a6f18638b?q=80&w=2070&auto=format&fit=crop',
    latitude: 16.0748,
    longitude: 108.2236,
    userDescription: 'Rác thải sinh hoạt bị vứt bừa bãi gần cầu Rồng.',
    aiAnalysis: {
      issueType: 'Rác thải sai quy định',
      description: 'Một lượng lớn rác thải sinh hoạt, bao gồm túi nilon và hộp nhựa, tích tụ tại khu vực công cộng.',
      priority: 'Cao',
    },
    status: 'Mới báo cáo',
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isTrashLikely: true,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-676dbe130c0b?q=80&w=2070&auto=format&fit=crop',
    latitude: 16.0601,
    longitude: 108.2225,
    userDescription: 'Nước ngập sau cơn mưa lớn hôm qua, chưa rút.',
    aiAnalysis: {
      issueType: 'Ngập úng',
      description: 'Khu vực đường trũng bị ngập nước, cản trở giao thông và có nguy cơ ô nhiễm.',
      priority: 'Trung bình',
    },
    status: 'Đang xử lý',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    isTrashLikely: false,
  },
   {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1523348835941-8d5a77ecaf2a?q=80&w=1974&auto=format&fit=crop',
    latitude: 16.0544,
    longitude: 108.2022,
    userDescription: 'Cây xanh ở đây có vẻ đã được cắt tỉa gọn gàng.',
    aiAnalysis: {
      issueType: 'Cây xanh cần chăm sóc',
      description: 'Cành cây đã được dọn dẹp, không còn gây cản trở.',
      priority: 'Thấp',
    },
    status: 'Đã xử lý',
    timestamp: new Date(Date.now() - 86400000 * 5), // 5 days ago
    isTrashLikely: false,
  },
];

// Hàm tạo báo cáo giả để mô phỏng dữ liệu mới
const createMockReport = (): EnvironmentalReport => {
  const types: AIAnalysis['issueType'][] = ['Rác thải sai quy định', 'Ngập úng', 'Cây xanh cần chăm sóc'];
  const statuses: ReportStatus[] = ['Mới báo cáo', 'Đang xử lý', 'Đã xử lý'];
  const priorities: AIAnalysis['priority'][] = ['Cao', 'Trung bình', 'Thấp'];
  
  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

  // Trung tâm Đà Nẵng: 16.0544, 108.2022. Tạo ngẫu nhiên xung quanh.
  const lat = 16.0544 + (Math.random() - 0.5) * 0.1; // ~ +/- 5.5 km
  const lon = 108.2022 + (Math.random() - 0.5) * 0.1;

  return {
    id: new Date().toISOString() + Math.random(),
    imageUrl: 'https://images.unsplash.com/photo-1567693122312-de549acb2a58?q=80&w=2070&auto=format&fit=crop', // Ảnh rác chung
    latitude: lat,
    longitude: lon,
    userDescription: 'Báo cáo mới được tạo tự động.',
    aiAnalysis: {
      issueType: randomType,
      description: `Một vấn đề ${randomType.toLowerCase()} đã được phát hiện tại vị trí này.`,
      priority: randomPriority,
    },
    status: 'Mới báo cáo', // Báo cáo mới luôn có trạng thái này
    timestamp: new Date(),
    isTrashLikely: randomType === 'Rác thải sai quy định',
  };
};


const App: React.FC = () => {
  const [reports, setReports] = useState<EnvironmentalReport[]>(() => {
    try {
      const savedReportsJSON = localStorage.getItem('daNangXanhReports');
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
  
  const [view, setView] = useState<'home' | 'map' | 'form' | 'thankYou' | 'environmentalMap'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'map'>('home');
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [lastAwardedPoints, setLastAwardedPoints] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedEducationTopic, setSelectedEducationTopic] = useState<EducationalTopic | null>(null);
  
  // State for the Floating AI Assistant
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: 'Xin chào! Tôi là Trợ lý AI Môi trường Đà Nẵng. Tôi có thể giúp gì cho bạn hôm nay?',
      suggestions: [
        "Làm thế nào để phân loại rác đúng cách?",
        "Báo cáo một điểm xả rác trái phép.",
        "Các mẹo tiết kiệm nước là gì?",
      ]
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Effect to load and save reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daNangXanhReports', JSON.stringify(reports));
    } catch (error) {
      console.error("Lỗi khi lưu báo cáo vào localStorage:", error);
    }
  }, [reports]);

  // Effect to load points from localStorage on initial render
  useEffect(() => {
    try {
      const savedPoints = localStorage.getItem('daNangXanhUserPoints');
      if (savedPoints) {
        setUserPoints(parseInt(savedPoints, 10) || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải điểm từ localStorage:", error);
    }
  }, []);

  // Effect to save points to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('daNangXanhUserPoints', userPoints.toString());
    } catch (error) {
      console.error("Lỗi khi lưu điểm vào localStorage:", error);
    }
  }, [userPoints]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  // Effect để tự động làm mới dữ liệu báo cáo
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Tự động làm mới dữ liệu báo cáo...");
      const newReport = createMockReport();
      setReports(prevReports => [newReport, ...prevReports]);
      addToast('Đã nhận được báo cáo mới!');
    }, 30000); // 30 giây

    return () => clearInterval(intervalId); // Dọn dẹp khi component unmount
  }, [addToast]);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const handleStartNewReport = (currentView: 'home' | 'map') => {
    setPreviousView(currentView);
    setView('form');
  };

  const handleAddNewReport = async (
    imageFile: File,
    userDescription: string,
    coords: { latitude: number; longitude: number }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = imageFile.type;

        // Perform both analyses concurrently for better performance
        const [aiAnalysis, isTrash] = await Promise.all([
          analyzeEnvironmentalImage(base64String, mimeType),
          isImageTrash(base64String, mimeType)
        ]);
        
        const newReport: EnvironmentalReport = {
          id: new Date().toISOString(),
          imageUrl: reader.result as string,
          latitude: coords.latitude,
          longitude: coords.longitude,
          userDescription,
          aiAnalysis,
          status: 'Mới báo cáo',
          timestamp: new Date(),
          isTrashLikely: isTrash,
        };
        
        setReports(prevReports => [newReport, ...prevReports]);
        
        // Award points for new report
        const pointsAwarded = 10;
        setUserPoints(prevPoints => prevPoints + pointsAwarded);
        setLastAwardedPoints(pointsAwarded);

        setView('thankYou');
        setIsLoading(false);
      };
       reader.onerror = () => {
         throw new Error('Không thể đọc tệp hình ảnh.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi không xác định xảy ra.';
      setError(`Lỗi tạo báo cáo: ${errorMessage}`);
      setIsLoading(false);
      console.error(err);
    }
  };
  
  const handleUpdateReportStatus = (reportId: string) => {
     const statusCycle: Record<ReportStatus, ReportStatus> = {
      'Mới báo cáo': 'Đang xử lý',
      'Đang xử lý': 'Đã xử lý',
      'Đã xử lý': 'Mới báo cáo',
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
    addToast('Trạng thái báo cáo đã được cập nhật thành công!');
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
      const aiResponse = await askAIAboutEnvironment(userMessage);
      const newAiMessage: ChatMessage = { role: 'model', content: aiResponse };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau." };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNavigateFromThankYou = (destination: 'home' | 'map') => {
    setView(destination);
    setLastAwardedPoints(0); // Reset points so message doesn't show again
  };

  const handleSelectReportAndNavigateToMap = (report: EnvironmentalReport) => {
    setView('map');
    // Setting the selected report will cause the modal to appear on the map view
    setSelectedReport(report);
  };

  const handleSelectEducationTopic = (topic: EducationalTopic) => {
    setSelectedEducationTopic(topic);
  };

  const handleCloseEducationModal = () => {
    setSelectedEducationTopic(null);
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
                />;
      case 'map':
        return <MainMapView 
                  reports={reports} 
                  onSelectReport={handleSelectReport} 
                  onNavigateHome={() => setView('home')}
                  onStartNewReport={() => handleStartNewReport('map')}
                />;
      case 'form':
        return <ReportForm
                  onSubmit={handleAddNewReport}
                  onCancel={() => { setView(previousView); setError(null); }}
                  isLoading={isLoading}
                  error={error}
                />;
      case 'thankYou':
        return <ThankYouView
                  awardedPoints={lastAwardedPoints}
                  onNavigateHome={() => handleNavigateFromThankYou('home')}
                  onNavigateToMap={() => handleNavigateFromThankYou('map')}
                />;
      case 'environmentalMap':
        return <EnvironmentalMapView onNavigateHome={() => setView('home')} />;
      default:
         return <HomeView 
                  reports={reports} 
                  onNavigateToMap={() => setView('map')} 
                  onStartNewReport={() => handleStartNewReport('home')}
                  onSelectReportAndNavigateToMap={handleSelectReportAndNavigateToMap}
                  onSelectEducationTopic={handleSelectEducationTopic}
                   onNavigateToEnvironmentalMap={() => setView('environmentalMap')}
                />;
    }
  }

  return (
    <div className="min-h-screen bg-teal-50 text-slate-800 flex flex-col">
       <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <header className="bg-white/90 backdrop-blur-sm shadow-md z-20 sticky top-0 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('home')}>
             <LogoIcon className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-slate-800">
              Đà Nẵng <span className="text-teal-600">Xanh</span>
            </h1>
          </div>
           <div className="flex items-center space-x-2 bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-full text-sm">
                <TrophyIcon className="w-6 h-6 text-amber-500" />
                <span className="hidden sm:inline">Điểm:</span>
                <span>{userPoints}</span>
            </div>
        </div>
      </header>
      
      <main className="flex-grow relative">
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

      {/* Floating AI Assistant */}
      <FloatingAIAssistant
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(prev => !prev)}
        messages={chatMessages}
        isLoading={isChatLoading}
        onSubmit={handleChatSubmit}
      />
    </div>
  );
};

export default App;