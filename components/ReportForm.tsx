
import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './ImageUploader';
import Loader from './Loader';
import { RefreshIcon } from './icons/RefreshIcon';
import { AIAnalysis } from '../types';
import { analyzeEnvironmentalImage } from '../services/geminiService';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import ReportCard from './ReportCard';

interface ReportFormProps {
  onSubmit: (mediaFile: File, userDescription: string, coords: { latitude: number; longitude: number }, aiAnalysis: AIAnalysis) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel, isLoading, error, isOnline }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const locationJustFetched = useRef(false);
  const highlightTimeoutRef = useRef<number | null>(null);

  const fetchLocation = (retryWithLowAccuracy = true) => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    locationJustFetched.current = false;

    setIsGettingLocation(true);
    setLocationError(null);

    const options = { 
      enableHighAccuracy: retryWithLowAccuracy, 
      timeout: retryWithLowAccuracy ? 15000 : 10000, 
      maximumAge: 0 
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });
        setAccuracy(accuracy);
        setIsGettingLocation(false);
        locationJustFetched.current = true;
        highlightTimeoutRef.current = window.setTimeout(() => {
          locationJustFetched.current = false;
        }, 2000); // Highlight trong 2 giây
      },
      (err) => {
        if (retryWithLowAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
          console.warn("High accuracy GPS failed, retrying with low accuracy...");
          fetchLocation(false);
        } else {
          let msg = err.message;
          if (err.code === err.TIMEOUT) msg = "Hết thời gian chờ (Timeout). Hãy đảm bảo bạn đang ở nơi thoáng đãng và đã bật GPS.";
          if (err.code === err.PERMISSION_DENIED) msg = "Bạn đã từ chối quyền truy cập vị trí. Hãy kiểm tra cài đặt trình duyệt.";
          
          setLocationError(`Lỗi: ${msg}`);
          setIsGettingLocation(false);
        }
      },
      options
    );
  };
  
  useEffect(() => {
    fetchLocation();
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    }
  }, []);

  const handleMediaChange = (file: File) => {
    setMediaFile(file);
    setAiAnalysis(null);
    setAnalysisMessage(null);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
  };
  
  // Tự động phân tích khi có file media
  useEffect(() => {
    const handleMediaAnalysis = async () => {
      if (!mediaFile) return;

      setIsAnalyzing(true);
      setAiAnalysis(null);
      setAnalysisMessage(null);

      // Nếu offline, bỏ qua phân tích AI và cho phép nhập thủ công (hoặc giả lập)
      // Tuy nhiên, yêu cầu là "Ảnh và dữ liệu... được lưu tạm thời".
      // Nếu không có mạng, không thể gọi Gemini API.
      // Chúng ta sẽ cho phép người dùng nhập mô tả và lưu lại, AI Analysis sẽ là null hoặc placeholder.
      // Nhưng ReportForm yêu cầu aiAnalysis để submit.
      // Ta sẽ xử lý logic này: Nếu offline, tạo một aiAnalysis giả định hoặc cho phép null.
      // Nhưng để đơn giản và tuân thủ type, ta sẽ mock AI response nếu offline.
      
      if (!isOnline) {
          // Mock AI Analysis for Offline Mode
          const mockAnalysis: AIAnalysis = {
              isIssuePresent: true,
              issueType: "Đang chờ phân tích",
              description: "Báo cáo được tạo khi offline. AI sẽ phân tích lại sau (nếu cần).",
              priority: "Trung bình",
              solution: "Đang chờ xử lý",
          };
          setAiAnalysis(mockAnalysis);
          return;
      }

      try {
        let base64String: string;
        let mimeType: string;

        if (mediaFile.type.startsWith('image')) {
          base64String = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(mediaFile);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (error) => reject(error);
          });
          mimeType = mediaFile.type;
        } else if (mediaFile.type.startsWith('video')) {
          base64String = await new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(mediaFile);
            video.onloadeddata = () => {
              video.currentTime = 1; // Lấy frame ở giây thứ 1
            };
            video.onseeked = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject('Không thể tạo canvas context');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
              URL.revokeObjectURL(video.src);
            };
            video.onerror = (error) => {
              reject(error);
              URL.revokeObjectURL(video.src);
            }
          });
          mimeType = 'image/jpeg';
        } else {
            throw new Error("Định dạng tệp không được hỗ trợ.");
        }
        
        const result = await analyzeEnvironmentalImage(base64String, mimeType);
              
        if (result.isIssuePresent) {
          setAiAnalysis(result);
        } else {
          setAnalysisMessage("AI không phát hiện thấy sự cố môi trường trong tệp này. Vui lòng chọn một tệp khác để báo cáo.");
        }

      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
          setAnalysisMessage(`Lỗi phân tích: ${errorMessage}`);
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    handleMediaAnalysis();

  }, [mediaFile, isOnline]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaFile && coords && aiAnalysis && !isLoading) {
      onSubmit(mediaFile, description, coords, aiAnalysis);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Gửi báo cáo sự cố</h2>
                <p className="text-slate-500 mt-2">Đóng góp của bạn giúp thành phố xanh và sạch hơn.</p>
            </div>
            {!isOnline && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200">
                    Chế độ Offline
                </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Step 1 */}
          <div className="space-y-4">
             <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">1</span>
                <label className="text-lg font-bold text-slate-700">Hình ảnh / Video sự cố <span className="text-red-500">*</span></label>
             </div>
            <ImageUploader onImageChange={handleMediaChange} imageUrl={mediaUrl} mediaType={mediaType} />
          </div>
          
           {/* Analysis Result Area */}
           <div className="min-h-[60px] transition-all duration-500">
                {isAnalyzing && (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                         <Loader />
                    </div>
                )}
                
                {analysisMessage && (
                    <div className="flex items-start gap-4 text-amber-800 bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm animate-fade-in">
                        <XCircleIcon className="w-6 h-6 flex-shrink-0 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-900">Không thể xử lý</p>
                            <p className="text-sm mt-1">{analysisMessage}</p>
                        </div>
                    </div>
                )}
                
                {aiAnalysis && (
                    <div className="space-y-4 animate-fade-in-up">
                         <div className={`flex items-center gap-3 p-4 rounded-xl border ${isOnline ? 'text-green-800 bg-green-50 border-green-100' : 'text-amber-800 bg-amber-50 border-amber-100'}`}>
                            {isOnline ? <CheckCircleIcon className="w-6 h-6 flex-shrink-0 text-green-600" /> : <div className="w-6 h-6 flex-shrink-0 text-amber-600 font-bold">!</div>}
                            <div>
                                <p className={`font-bold ${isOnline ? 'text-green-900' : 'text-amber-900'}`}>
                                    {isOnline ? 'Xác thực thành công' : 'Đang ở chế độ Offline - AI tạm thời không khả dụng'}
                                </p>
                            </div>
                        </div>
                        <ReportCard analysis={aiAnalysis} />
                    </div>
                )}
            </div>


          {/* Step 2 */}
          <div className="space-y-4">
             <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">2</span>
                <label htmlFor="description" className="text-lg font-bold text-slate-700">Mô tả bổ sung</label>
             </div>
            <textarea
              id="description"
              rows={3}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none placeholder-slate-400"
              placeholder="Ví dụ: Đống rác này đã ở đây 3 ngày..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">3</span>
                <label className="text-lg font-bold text-slate-700">Vị trí sự cố <span className="text-red-500">*</span></label>
             </div>
            
            <div className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-500 border ${locationJustFetched.current ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                {isGettingLocation ? (
                    <div className="flex items-center text-slate-600 text-sm">
                        <div className="w-5 h-5 border-2 border-t-teal-500 border-gray-300 rounded-full animate-spin mr-3"></div>
                        Đang lấy tọa độ GPS...
                    </div>
                ) : coords ? (
                    <div className="flex items-center text-sm text-slate-800">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                             <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <span className="font-bold text-green-800 block">Đã xác định vị trí</span>
                            <p className="font-mono text-xs text-slate-500 mt-0.5">
                              {`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`}
                              {accuracy && ` (±${accuracy.toFixed(0)}m)`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center text-sm text-red-600">
                        <XCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                        <span>{locationError || 'Vui lòng cấp quyền truy cập vị trí.'}</span>
                    </div>
                )}
                <button 
                    type="button" 
                    onClick={() => fetchLocation()} 
                    className="text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
                    disabled={isGettingLocation}
                    title="Lấy lại vị trí"
                >
                    <RefreshIcon className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                </button>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}
          
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!mediaFile || !coords || !aiAnalysis || isLoading}
                className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:bg-none disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ${isOnline ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 hover:shadow-teal-300' : 'bg-amber-500 text-white shadow-amber-200 hover:shadow-amber-300'}`}
              >
                {isLoading ? 'Đang xử lý...' : (isOnline ? 'Gửi Báo Cáo' : 'Lưu Offline')}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
