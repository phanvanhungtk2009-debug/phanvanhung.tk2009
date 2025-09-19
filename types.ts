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
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}