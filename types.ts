
// FIX: Add import for React to resolve 'Cannot find namespace React' error.
import React from 'react';

export type ReportStatus = 'Báo cáo mới' | 'Đang xử lý' | 'Đã xử lý';

export interface AIAnalysis {
  issueType: 'Xả rác không đúng nơi quy định' | 'Ngập lụt' | 'Sạt lở đất' | 'Cần chăm sóc cây xanh' | 'Khác' | 'Không có sự cố';
  description: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  solution: string; // Giải pháp do AI đề xuất
  isIssuePresent: boolean; // Cờ để xác thực hình ảnh/video có sự cố môi trường
  recommendedSupplies?: string[]; // Danh sách nhu yếu phẩm (cho thiên tai)
}

export interface EnvironmentalReport {
  id: string;
  mediaUrl: string; // Renamed from imageUrl
  mediaType: 'image' | 'video';
  latitude: number;
  longitude: number;
  userDescription?: string;
  aiAnalysis: AIAnalysis;
  status: ReportStatus;
  timestamp: Date;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestions?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface EducationalTopic {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: {
    importance: string;
    solutions: { title: string; description: string }[];
    tip: string;
  };
}

export type POIType = 'NatureReserve' | 'RecyclingCenter' | 'CommunityCleanup' | 'WaterStation';

export interface EnvironmentalPOI {
  id: string;
  type: POIType;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export type ImageValidationStatus = 'idle' | 'analyzing' | 'valid' | 'invalid';
