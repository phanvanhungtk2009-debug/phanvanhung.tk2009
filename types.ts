// FIX: Add import for React to resolve 'Cannot find namespace React' error.
import React from 'react';

export type ReportStatus = 'Mới báo cáo' | 'Đang xử lý' | 'Đã xử lý';

export interface AIAnalysis {
  issueType: 'Rác thải sai quy định' | 'Ngập úng' | 'Cây xanh cần chăm sóc' | 'Khác';
  description: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
}

export interface EnvironmentalReport {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  userDescription?: string;
  aiAnalysis: AIAnalysis;
  status: ReportStatus;
  timestamp: Date;
  isTrashLikely: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestions?: string[];
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