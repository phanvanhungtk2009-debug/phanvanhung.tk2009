import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import Loader from './Loader';
import { LocationIcon } from './icons/LocationIcon';
import { RefreshIcon } from './icons/RefreshIcon';

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

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị.');
      return;
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
  }, []);

  const handleImageChange = (file: File) => {
    setImageFile(file);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFile && coords && !isLoading) {
      onSubmit(imageFile, description, coords);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Báo cáo vấn đề môi trường mới</h2>
          <p className="text-gray-500 mt-1">Cung cấp thông tin chi tiết để chúng tôi có thể xử lý nhanh chóng.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Tải lên hình ảnh <span className="text-red-500">*</span>
            </label>
            <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              2. Mô tả thêm (không bắt buộc)
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Ví dụ: Rác thải xây dựng bị đổ trộm tại góc đường này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Vị trí của bạn <span className="text-red-500">*</span>
            </label>
            <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
                {isGettingLocation ? (
                    <p className="text-gray-600 text-sm">Đang lấy vị trí của bạn...</p>
                ) : coords ? (
                    <div className="flex items-center text-sm text-gray-800">
                        <LocationIcon className="w-5 h-5 mr-2 text-teal-600" />
                        <span className="font-mono">{`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}</span>
                    </div>
                ) : (
                    <p className="text-sm text-red-500">{locationError || 'Vui lòng cấp quyền truy cập vị trí.'}</p>
                )}
                <button 
                    type="button" 
                    onClick={fetchLocation} 
                    className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-100 disabled:opacity-50"
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
                className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
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
