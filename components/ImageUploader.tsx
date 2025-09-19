import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl }) => {
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
        className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center p-4 cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 relative overflow-hidden"
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
          accept="image/png, image/jpeg, image/webp"
        />
        {imageUrl ? (
          <img src={imageUrl} alt="Xem trước" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="text-gray-500 z-10">
            <UploadIcon className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">Nhấn để chọn hoặc kéo thả ảnh vào đây</p>
            <p className="text-sm">Hỗ trợ PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
  );
};

export default ImageUploader;
