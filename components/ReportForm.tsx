import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './ImageUploader';
import Loader from './Loader';
import { RefreshIcon } from './icons/RefreshIcon';
import { ImageValidationStatus } from '../types';
import { isImageTrash } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';


interface ReportFormProps {
  onSubmit: (imageFile: File, userDescription: string, coords: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel, isLoading, error }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [imageValidationStatus, setImageValidationStatus] = useState<ImageValidationStatus>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [locationJustFetched, setLocationJustFetched] = useState(false);
  const highlightTimeoutRef = useRef<number | null>(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    setIsGettingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
        setLocationJustFetched(true);
        highlightTimeoutRef.current = window.setTimeout(() => {
          setLocationJustFetched(false);
        }, 2000); // Highlight for 2 seconds
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

  const handleImageChange = (file: File) => {
    setImageFile(file);
    setImageValidationStatus('idle');
    setAnalysisError(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(URL.createObjectURL(file));
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) return;

    setImageValidationStatus('analyzing');
    setAnalysisError(null);

    try {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const mimeType = imageFile.type;
            const isTrash = await isImageTrash(base64String, mimeType);
            setImageValidationStatus(isTrash ? 'valid' : 'invalid');
        };
        reader.onerror = () => {
            throw new Error('Không thể đọc tệp hình ảnh.');
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
        setAnalysisError(errorMessage);
        setImageValidationStatus('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFile && coords && !isLoading) {
      onSubmit(imageFile, description, coords);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Báo cáo vấn đề môi trường mới</h2>
          <p className="text-slate-500 mt-1">Cung cấp thông tin chi tiết để chúng tôi có thể xử lý nhanh chóng.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              1. Tải lên hình ảnh <span className="text-red-500">*</span>
            </label>
            <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              1.5. (Tùy chọn) Kiểm tra ảnh với AI
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    type="button"
                    onClick={handleImageAnalysis}
                    disabled={!imageFile || imageValidationStatus === 'analyzing'}
                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className={`w-5 h-5 ${imageValidationStatus === 'analyzing' ? 'animate-pulse' : ''}`} />
                    <span>
                        {imageValidationStatus === 'analyzing' ? 'Đang phân tích...' : 'Phân tích ảnh'}
                    </span>
                </button>
                <div className="w-full h-12 flex items-center justify-center sm:justify-start bg-slate-100 rounded-lg px-3 text-center sm:text-left">
                    {imageValidationStatus === 'idle' && <p className="text-sm text-slate-500">Nhấn nút để kiểm tra xem ảnh có chứa rác không.</p>}
                    {imageValidationStatus === 'analyzing' && <p className="text-sm text-slate-500">AI đang xem xét hình ảnh của bạn...</p>}
                    {imageValidationStatus === 'valid' && (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                            <p className="text-sm">Phân tích thành công: Hình ảnh có chứa rác.</p>
                        </div>
                    )}
                    {imageValidationStatus === 'invalid' && (
                        <div className="flex items-center gap-2 text-amber-600 font-semibold">
                            <XCircleIcon className="w-6 h-6 flex-shrink-0" />
                            <p className="text-sm">Cảnh báo: AI không phát hiện thấy rác trong ảnh.</p>
                        </div>
                    )}
                    {analysisError && <p className="text-sm text-red-600">{analysisError}</p>}
                </div>
            </div>
          </div>


          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              2. Mô tả thêm (không bắt buộc)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Ví dụ: Rác thải xây dựng bị đổ trộm tại góc đường này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Vị trí của bạn <span className="text-red-500">*</span>
            </label>
            <div className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-500 ${locationJustFetched ? 'bg-green-100' : 'bg-slate-100'}`}>
                {isGettingLocation ? (
                    <div className="flex items-center text-slate-600 text-sm">
                        <div className="w-4 h-4 border-2 border-t-teal-500 border-gray-300 rounded-full animate-spin mr-2"></div>
                        Đang lấy vị trí của bạn...
                    </div>
                ) : coords ? (
                    <div className="flex items-center text-sm text-slate-800">
                        <CheckCircleIcon className="w-6 h-6 mr-2 text-green-600 flex-shrink-0" />
                        <div>
                            <span className="font-semibold text-green-800">Vị trí đã xác định</span>
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
                disabled={!imageFile || !coords}
                className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Gửi Báo Cáo
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportForm;