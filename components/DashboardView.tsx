import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { EnvironmentalReport } from '../types';
import { apiFetch, getApiBaseUrl } from '../services/apiClient';

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

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        apiFetch('/api/stats').then(res => res.json()),
        apiFetch('/api/reports').then(res => res.json())
      ]);
      
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
    const wsBase = getApiBaseUrl() || window.location.origin;
    const wsEndpoint = wsBase.replace(/^http/, 'ws');
    const ws = new WebSocket(wsEndpoint);
    
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
           <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Hệ thống Online
           </span>
        </div>
      </div>

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
