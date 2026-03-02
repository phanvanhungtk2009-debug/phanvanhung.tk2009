import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { EnvironmentalReport } from '../types';
import { TrophyIcon } from './icons/TrophyIcon';
import { UsersIcon } from './icons/UsersIcon';
import { FileUpIcon } from './icons/FileUpIcon';
import { XCircleIcon as AlertCircleIcon } from './icons/XCircleIcon';
import BulkImportModal from './BulkImportModal';

interface DashboardStats {
  total: number;
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byArea: { area: string; count: number }[];
  recentActivity: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface DashboardViewProps {
  user?: any;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<EnvironmentalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Mock Leaderboard Data
  const leaderboard = [
      { name: 'Nguyễn Văn A', points: 1250, rank: 'Chiến binh Xanh', avatar: 'https://i.pravatar.cc/150?u=a' },
      { name: 'Trần Thị B', points: 980, rank: 'Người bảo vệ', avatar: 'https://i.pravatar.cc/150?u=b' },
      { name: 'Lê Văn C', points: 850, rank: 'Tình nguyện viên', avatar: 'https://i.pravatar.cc/150?u=c' },
      { name: 'Phạm Thị D', points: 720, rank: 'Tình nguyện viên', avatar: 'https://i.pravatar.cc/150?u=d' },
      { name: 'Hoàng Văn E', points: 600, rank: 'Thành viên mới', avatar: 'https://i.pravatar.cc/150?u=e' },
  ];

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes, healthRes] = await Promise.all([
        fetch('/api/stats').then(res => res.json()),
        fetch('/api/reports').then(res => res.json()),
        fetch('/api/health').then(res => res.json())
      ]);
      
      setHealthStatus(healthRes);
      let filteredReports = reportsRes;
      let filteredStats = statsRes;

      // Filter by area if user is not admin/environment_department and has an area assigned
      const isGlobalUser = user && (user.role === 'admin' || user.role === 'environment_department');
      if (user && !isGlobalUser && user.area && user.area !== 'All') {
        filteredReports = reportsRes.filter((r: any) => r.area === user.area);
      }

      // Calculate stats by Region (Da Nang vs Quang Nam)
      const daNangDistricts = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang', 'Hoàng Sa'];
      
      const regionCounts = filteredReports.reduce((acc: any, curr: any) => {
        const region = daNangDistricts.includes(curr.area) ? 'Đà Nẵng' : 'Quảng Nam';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});
      
      const byRegion = Object.keys(regionCounts).map(region => ({ region, count: regionCounts[region] }));

      const total = filteredReports.length;
      
      const statusCounts = filteredReports.reduce((acc: any, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
      }, {});
      const byStatus = Object.keys(statusCounts).map(status => ({ status, count: statusCounts[status] }));

      const priorityCounts = filteredReports.reduce((acc: any, curr: any) => {
          acc[curr.priority] = (acc[curr.priority] || 0) + 1;
          return acc;
      }, {});
      const byPriority = Object.keys(priorityCounts).map(priority => ({ priority, count: priorityCounts[priority] }));

      filteredStats = {
          ...statsRes,
          total,
          byStatus,
          byPriority,
          byRegion,
          byArea: statsRes.byArea // Keep original byArea for other uses if needed
      };

      setStats(filteredStats);
      setReports(filteredReports);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Setup WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_REPORT' || data.type === 'REPORT_UPDATED') {
        fetchData(); // Refresh data on update
      }
    };

    return () => ws.close();
  }, []);

  if (isLoading) return <div className="p-8 text-center">Đang tải dữ liệu Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center">Không có dữ liệu.</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Trung tâm Điều hành Thông minh (IOC)</h2>
          {user && (
            <p className="text-slate-500 text-sm font-medium mt-1">
              Đơn vị: <span className="text-teal-600">{user.organizationName || user.username}</span> | 
              Khu vực: <span className="text-teal-600">{user.area}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-2">
           <button 
             onClick={() => setIsImportModalOpen(true)}
             className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold flex items-center hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
           >
              <FileUpIcon className="w-4 h-4 mr-2" />
              Nhập dữ liệu Excel
           </button>
           <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Hệ thống Online
           </span>
        </div>
      </div>

      {healthStatus?.supabase === 'error' && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-700 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
             <AlertCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Lỗi kết nối Supabase</h4>
            <p className="text-xs mt-1 opacity-80">{healthStatus.supabaseError}</p>
            <div className="mt-3 flex space-x-2">
              <button 
                onClick={() => {
                  const sql = `-- 1. Xóa bảng cũ\nDROP TABLE IF EXISTS reports;\nDROP TABLE IF EXISTS users;\n\n-- 2. Tạo bảng users\nCREATE TABLE users (\n  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n  username TEXT UNIQUE NOT NULL,\n  password TEXT NOT NULL,\n  role TEXT NOT NULL,\n  area TEXT,\n  "organizationName" TEXT,\n  status TEXT DEFAULT 'active',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 3. Tạo bảng reports\nCREATE TABLE reports (\n  id TEXT PRIMARY KEY,\n  "mediaUrl" TEXT,\n  "mediaType" TEXT,\n  latitude DOUBLE PRECISION,\n  longitude DOUBLE PRECISION,\n  "userDescription" TEXT,\n  "issueType" TEXT,\n  description TEXT,\n  priority TEXT,\n  "solution" TEXT,\n  "isIssuePresent" INTEGER,\n  status TEXT,\n  timestamp TEXT,\n  area TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 4. Tắt bảo mật\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\nALTER TABLE reports DISABLE ROW LEVEL SECURITY;`;
                  navigator.clipboard.writeText(sql);
                  alert('Đã sao chép mã SQL! Hãy dán vào Supabase SQL Editor và nhấn Run.');
                }}
                className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Sao chép mã SQL tạo bảng
              </button>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 transition-colors"
              >
                Mở Supabase Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={() => fetchData()} 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Tổng số sự cố</p>
          <p className="text-4xl font-extrabold text-slate-800 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Đang xử lý</p>
          <p className="text-4xl font-extrabold text-amber-500 mt-2">
            {stats.byStatus.find(s => s.status === 'Đang xử lý')?.count || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Mức độ Cao</p>
          <p className="text-4xl font-extrabold text-red-500 mt-2">
            {stats.byPriority.find(p => p.priority === 'Cao')?.count || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Đã xử lý</p>
          <p className="text-4xl font-extrabold text-green-500 mt-2">
            {stats.byStatus.find(s => s.status === 'Đã xử lý')?.count || 0}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="font-bold text-slate-700 mb-4">Phân bố theo Khu vực (ĐN - QN)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(stats as any).byRegion}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="font-bold text-slate-700 mb-4">Trạng thái Xử lý</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.byStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {stats.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW SECTION: Leaderboard & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center">
                      <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                      Bảng Xếp Hạng Xanh
                  </h3>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Tháng này</span>
              </div>
              <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {index + 1}
                              </div>
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                              <div>
                                  <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.rank}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-teal-600">{user.points}</p>
                              <p className="text-[10px] text-slate-400">điểm</p>
                          </div>
                      </div>
                  ))}
              </div>
              <button className="w-full mt-6 py-2 text-sm font-bold text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                  Xem tất cả
              </button>
          </div>

          {/* Recent Activity (Taking up 2 columns) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                  <UsersIcon className="w-5 h-5 text-blue-500 mr-2" />
                  Hoạt động Gần đây
               </h3>
               <div className="space-y-0">
                  {reports.slice(0, 5).map((report, index) => (
                      <div key={report.id} className="flex items-start space-x-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <div className="relative flex-shrink-0">
                              <img 
                                src={report.mediaUrl} 
                                alt="Report" 
                                className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm"
                                onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'}}
                              />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold ${
                                  report.status === 'Báo cáo mới' ? 'bg-red-500' : 
                                  report.status === 'Đang xử lý' ? 'bg-amber-500' : 'bg-green-500'
                              }`}>
                                  {report.status === 'Báo cáo mới' ? '!' : report.status === 'Đang xử lý' ? '...' : '✓'}
                              </div>
                          </div>
                          <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{report.aiAnalysis.issueType}</h4>
                                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(report.timestamp).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.description}</p>
                              <div className="flex items-center mt-2 space-x-2">
                                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                                      {report.area || 'Chưa xác định'}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                      report.aiAnalysis.priority === 'Cao' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                  }`}>
                                      {report.aiAnalysis.priority}
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))}
                  {reports.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-sm">Chưa có hoạt động nào.</div>
                  )}
               </div>
          </div>
      </div>

      {/* Heatmap / Risk Map */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
        <h3 className="font-bold text-slate-700 mb-4">Bản đồ Rủi ro Môi trường (Heatmap)</h3>
        <div className="flex-grow rounded-xl overflow-hidden relative z-0">
           <MapContainer center={[15.85, 108.3]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {reports.map((report) => (
              <CircleMarker 
                key={report.id}
                center={[report.latitude, report.longitude]}
                radius={report.aiAnalysis.priority === 'Cao' ? 15 : 8}
                pathOptions={{ 
                    color: report.aiAnalysis.priority === 'Cao' ? 'red' : (report.aiAnalysis.priority === 'Trung bình' ? 'orange' : 'green'),
                    fillColor: report.aiAnalysis.priority === 'Cao' ? 'red' : (report.aiAnalysis.priority === 'Trung bình' ? 'orange' : 'green'),
                    fillOpacity: 0.6
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{report.aiAnalysis.issueType}</p>
                    <p>Mức độ: {report.aiAnalysis.priority}</p>
                    <p>{new Date(report.timestamp).toLocaleString()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
