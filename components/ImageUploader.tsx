import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  imageUrl: string | null;
  mediaType: 'image' | 'video' | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl, mediaType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Add visual feedback for dropping
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Add visual feedback for dragging over
    event.currentTarget.classList.add('border-teal-500', 'bg-teal-50');
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50');
  };


  return (
    <div
        className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 relative overflow-hidden bg-gray-100"
        onClick={() => fileInputRef.current?.click()}
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
            </>
        ) : (
          <div className="text-gray-500 z-10">
            <UploadIcon className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">Nhấn để chọn hoặc kéo thả ảnh/video</p>
            <p className="text-sm">Hỗ trợ PNG, JPG, MP4, WEBM...</p>
          </div>
        )}
      </div>
  );
};

export default ImageUploader;