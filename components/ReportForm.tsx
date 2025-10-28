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
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel, isLoading, error }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const locationJustFetched = useRef(false);
  const highlightTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // Ref for video frame extraction

  const fetchLocation = () => {
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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
        locationJustFetched.current = true;
        highlightTimeoutRef.current = window.setTimeout(() => {
          locationJustFetched.current = false;
        }, 2000); // Highlight trong 2 giây
      },
      (err) => {
        setLocationError(`Không thể lấy vị trí: ${err.message}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

  }, [mediaFile]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaFile && coords && aiAnalysis && !isLoading) {
      onSubmit(mediaFile, description, coords, aiAnalysis);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Báo cáo sự cố môi trường mới</h2>
          <p className="text-slate-500 mt-1">Tải ảnh hoặc video lên, AI sẽ tự động phân tích và xác thực giúp bạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              1. Tải lên hình ảnh hoặc video <span className="text-red-500">*</span>
            </label>
            <ImageUploader onImageChange={handleMediaChange} imageUrl={mediaUrl} mediaType={mediaType} />
          </div>
          
           {/* Vùng hiển thị kết quả phân tích */}
           <div className="min-h-[100px]">
                {isAnalyzing && <Loader />}
                {analysisMessage && (
                    <div className="flex items-start gap-3 text-amber-800 bg-amber-100 p-4 rounded-lg border border-amber-200">
                        <XCircleIcon className="w-8 h-8 flex-shrink-0 text-amber-600" />
                        <div>
                            <p className="font-semibold">Không thể báo cáo</p>
                            <p className="text-sm">{analysisMessage}</p>
                        </div>
                    </div>
                )}
                {aiAnalysis && (
                    <div className="space-y-4">
                         <div className="flex items-start gap-3 text-green-800 bg-green-100 p-4 rounded-lg border border-green-200">
                            <CheckCircleIcon className="w-8 h-8 flex-shrink-0 text-green-600" />
                            <div>
                                <p className="font-semibold">Xác thực thành công!</p>
                                <p className="text-sm">Media hợp lệ. AI đã phân tích sự cố bên dưới. Bạn có thể gửi báo cáo ngay bây giờ.</p>
                            </div>
                        </div>
                        <ReportCard analysis={aiAnalysis} />
                    </div>
                )}
            </div>


          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              2. Mô tả bổ sung (tùy chọn)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Ví dụ: Xà bần xây dựng bị đổ trộm ở góc đường này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Vị trí của bạn <span className="text-red-500">*</span>
            </label>
            <div className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-500 ${locationJustFetched.current ? 'bg-green-100' : 'bg-slate-100'}`}>
                {isGettingLocation ? (
                    <div className="flex items-center text-slate-600 text-sm">
                        <div className="w-4 h-4 border-2 border-t-teal-500 border-gray-300 rounded-full animate-spin mr-2"></div>
                        Đang lấy vị trí của bạn...
                    </div>
                ) : coords ? (
                    <div className="flex items-center text-sm text-slate-800">
                        <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600 flex-shrink-0" />
                        <div>
                            <span className="font-semibold text-green-800">Đã xác nhận vị trí</span>
                            <p className="font-mono text-xs text-slate-600">{`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}</p>
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
                    onClick={fetchLocation} 
                    className="text-teal-600 hover:text-teal-800 p-3 rounded-full hover:bg-teal-100 disabled:opacity-50"
                    disabled={isGettingLocation}
                    aria-label="Tải lại vị trí"
                >
                    <RefreshIcon className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                </button>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          
          {isLoading ? (
            <Loader />
          ) : (
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!mediaFile || !coords || !aiAnalysis || isLoading}
                className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Gửi báo cáo
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportForm;