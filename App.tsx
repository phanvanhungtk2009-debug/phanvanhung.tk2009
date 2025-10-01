import React, { useState, useCallback, useEffect } from 'react';
import { analyzeEnvironmentalImage, askAIAboutEnvironment } from './services/geminiService';
import { EnvironmentalReport, AIAnalysis, ReportStatus, ChatMessage } from './types';
import MainMapView from './components/MainMapView';
import ReportForm from './components/ReportForm';
import ReportDetailModal from './components/ReportDetailModal';
import HomeView from './components/HomeView';
import ThankYouView from './components/ThankYouView';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import { LogoIcon } from './components/icons/LogoIcon';
import { TrophyIcon } from './components/icons/TrophyIcon';

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
  },
];


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
  
  const [view, setView] = useState<'home' | 'map' | 'form' | 'thankYou'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'map'>('home');
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [lastAwardedPoints, setLastAwardedPoints] = useState<number>(0);
  
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
        const aiAnalysis: AIAnalysis = await analyzeEnvironmentalImage(base64String, mimeType);
        
        const newReport: EnvironmentalReport = {
          id: new Date().toISOString(),
          imageUrl: reader.result as string,
          latitude: coords.latitude,
          longitude: coords.longitude,
          userDescription,
          aiAnalysis,
          status: 'Mới báo cáo',
          timestamp: new Date(),
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

    setSelectedReport(prev => prev ? {...prev, status: statusCycle[prev.status]} : null);
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

  const renderContent = () => {
    switch(view) {
      case 'home':
        return <HomeView 
                  reports={reports} 
                  onNavigateToMap={() => setView('map')} 
                  onStartNewReport={() => handleStartNewReport('home')}
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
      default:
         return <HomeView 
                  reports={reports} 
                  onNavigateToMap={() => setView('map')} 
                  onStartNewReport={() => handleStartNewReport('home')}
                />;
    }
  }

  return (
    <div className="min-h-screen bg-teal-50 text-slate-800 flex flex-col">
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