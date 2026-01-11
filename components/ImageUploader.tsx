
import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  imageUrl: string | null;
  mediaType: 'image' | 'video' | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl, mediaType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageChange(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageChange(event.dataTransfer.files[0]);
    }
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-teal-500', 'bg-teal-50');
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50');
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Delay setting srcObject slightly to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Lỗi truy cập camera:", err);
      setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            onImageChange(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  if (isCameraOpen) {
    return (
      <div className="w-full h-96 bg-black rounded-lg relative overflow-hidden flex flex-col items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-4 z-10 flex space-x-4">
           <button 
            onClick={stopCamera}
            className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            aria-label="Đóng camera"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={capturePhoto}
            className="bg-white rounded-full p-1 shadow-lg hover:scale-105 transition-transform"
            aria-label="Chụp ảnh"
          >
            <div className="w-14 h-14 border-4 border-teal-600 rounded-full bg-white"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-4 relative overflow-hidden bg-gray-50 hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 group"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp, video/mp4, video/webm, video/quicktime"
        />
        
        {imageUrl ? (
            <>
                {mediaType === 'image' && (
                    <img src={imageUrl} alt="Xem trước" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {mediaType === 'video' && (
                    <video src={imageUrl} controls className="absolute inset-0 w-full h-full object-cover" />
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm font-medium shadow hover:bg-white"
                >
                  Thay đổi
                </button>
            </>
        ) : (
          <div className="text-gray-500 z-10 flex flex-col items-center">
            <UploadIcon className="h-12 w-12 mb-2 text-gray-400 group-hover:text-teal-500 transition-colors" />
            <p className="font-semibold text-gray-700">Kéo thả hình ảnh/video vào đây</p>
            <p className="text-sm text-gray-400 mt-1">hoặc</p>
            
            <div className="flex items-center gap-3 mt-3">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Chọn tệp
              </button>
              
              <span className="text-gray-400 text-xs">|</span>
              
              <button 
                type="button"
                onClick={startCamera}
                className="flex items-center px-4 py-2 bg-teal-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Chụp ảnh
              </button>
            </div>
            
            {cameraError && (
              <p className="text-xs text-red-500 mt-3 max-w-xs">{cameraError}</p>
            )}
          </div>
        )}
      </div>
      {imageUrl && (
        <div className="flex justify-center">
           <button 
              type="button"
              onClick={startCamera}
              className="text-sm text-teal-600 hover:text-teal-800 flex items-center font-medium"
            >
              <CameraIcon className="w-4 h-4 mr-1" />
              Chụp lại ảnh mới
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
