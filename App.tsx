import React, { useState, useCallback, useEffect } from 'react';
import { analyzeEnvironmentalImage, askAIAboutEnvironment } from './services/geminiService';
import { EnvironmentalReport, AIAnalysis, ReportStatus, ChatMessage } from './types';
import MainMapView from './components/MainMapView';
import ReportForm from './components/ReportForm';
import ReportDetailModal from './components/ReportDetailModal';
import HomeView from './components/HomeView';
import ThankYouView from './components/ThankYouView';
import FloatingAIAssistant from './components/FloatingAIAssistant';

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
        // Important: Re-hydrate Date objects from ISO strings
        return parsedReports.map((report: EnvironmentalReport) => ({
          ...report,
          timestamp: new Date(report.timestamp),
        }));
      }
    } catch (error) {
      console.error("Lỗi khi tải báo cáo từ localStorage:", error);
    }
    // If nothing in localStorage or an error occurred, use the initial mock data
    return initialReports;
  });
  
  const [view, setView] = useState<'home' | 'map' | 'form' | 'thankYou'>('home');
  const [previousView, setPreviousView] = useState<'home' | 'map'>('home');
  const [selectedReport, setSelectedReport] = useState<EnvironmentalReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the Floating AI Assistant
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Xin chào! Tôi là Trợ lý AI Xanh. Bạn cần hỏi gì về môi trường hôm nay?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Effect to save reports to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('daNangXanhReports', JSON.stringify(reports));
    } catch (error) {
      console.error("Lỗi khi lưu báo cáo vào localStorage:", error);
    }
  }, [reports]);

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
                  onNavigateHome={() => setView('home')}
                  onNavigateToMap={() => setView('map')}
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
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm z-20 sticky top-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('home')}>
             <svg className="w-10 h-10 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.25 1.5c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S16.635 1.5 11.25 1.5zM11.25 21a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z"/>
                <path d="M12.913 6.328a.75.75 0 00-1.06 0l-4.5 4.5a.75.75 0 000 1.06l4.5 4.5a.75.75 0 001.06-1.06L9 12l3.913-3.912a.75.75 0 000-1.06z"/>
                <path d="M12.088 18.328a.75.75 0 001.06 0l4.5-4.5a.75.75 0 000-1.06l-4.5-4.5a.75.75 0 00-1.06 1.06L15 12l-3.912 3.912a.75.75 0 000 1.06z" />
             </svg>
            <h1 className="text-2xl font-bold text-gray-800">
              Đà Nẵng <span className="text-teal-600">Xanh</span>
            </h1>
          </div>
           <p className="text-sm text-gray-500 hidden md:block">Chung tay vì một môi trường đô thị sạch đẹp</p>
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
