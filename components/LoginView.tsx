import React, { useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState('district_manager');
  const [area, setArea] = useState('Hải Châu');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const districts = [
    // Đà Nẵng
    'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang', 'Hoàng Sa',
    // Quảng Nam
    'Tam Kỳ', 'Hội An', 'Điện Bàn', 'Đại Lộc', 'Duy Xuyên', 'Thăng Bình', 'Quế Sơn', 'Núi Thành', 'Phú Ninh', 'Tiên Phước', 'Bắc Trà My', 'Nam Trà My', 'Phước Sơn', 'Hiệp Đức', 'Nông Sơn', 'Đông Giang', 'Nam Giang', 'Tây Giang'
  ];

  const roles = [
    { id: 'district_manager', label: 'Ban bộ địa phương (Quận/Huyện)' },
    { id: 'ward_manager', label: 'Cán bộ Xã/Phường' },
    { id: 'school_manager', label: 'Đại diện Trường học' },
    { id: 'department_manager', label: 'Sở/Ban ngành Thành phố' },
    { id: 'environment_department', label: 'Ban Môi trường (Giám sát Tổng thể)' },
  ];

  const districtCoords: Record<string, { lat: number, lng: number }> = {
    // Đà Nẵng
    'Hải Châu': { lat: 16.0474, lng: 108.2197 },
    'Thanh Khê': { lat: 16.0614, lng: 108.1801 },
    'Sơn Trà': { lat: 16.0911, lng: 108.2616 },
    'Ngũ Hành Sơn': { lat: 16.0025, lng: 108.2492 },
    'Liên Chiểu': { lat: 16.0592, lng: 108.1384 },
    'Cẩm Lệ': { lat: 15.9988, lng: 108.1916 },
    'Hòa Vang': { lat: 15.9867, lng: 108.0671 },
    // Quảng Nam
    'Tam Kỳ': { lat: 15.5647, lng: 108.4811 },
    'Hội An': { lat: 15.8801, lng: 108.3380 },
    'Điện Bàn': { lat: 15.8912, lng: 108.2415 },
    'Đại Lộc': { lat: 15.8854, lng: 108.0054 },
    'Duy Xuyên': { lat: 15.8197, lng: 108.2492 },
    'Thăng Bình': { lat: 15.7412, lng: 108.3715 },
    'Quế Sơn': { lat: 15.6812, lng: 108.1512 },
    'Núi Thành': { lat: 15.4212, lng: 108.6512 },
    'Phú Ninh': { lat: 15.5112, lng: 108.4512 },
    'Tiên Phước': { lat: 15.4812, lng: 108.3112 },
    'Bắc Trà My': { lat: 15.28, lng: 108.23 },
    'Nam Trà My': { lat: 15.05, lng: 108.08 },
    'Phước Sơn': { lat: 15.35, lng: 107.85 },
    'Hiệp Đức': { lat: 15.55, lng: 108.05 },
    'Nông Sơn': { lat: 15.65, lng: 107.95 },
    'Đông Giang': { lat: 15.95, lng: 107.85 },
    'Nam Giang': { lat: 15.65, lng: 107.65 },
    'Tây Giang': { lat: 15.9, lng: 107.45 }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGetLocation = (retryWithLowAccuracy = true) => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsLoading(true);
    setError('');

    const options = { 
      enableHighAccuracy: retryWithLowAccuracy, 
      timeout: retryWithLowAccuracy ? 10000 : 30000, 
      maximumAge: retryWithLowAccuracy ? 0 : 300000 
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        let minDistance = Infinity;
        let detectedArea = 'Hải Châu';

        Object.entries(districtCoords).forEach(([name, coords]) => {
          const dist = calculateDistance(latitude, longitude, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            detectedArea = name;
          }
        });
        
        setArea(detectedArea);
        setIsLoading(false);
        setSuccess(`Đã xác định vị trí: ${detectedArea} (Độ chính xác: ${position.coords.accuracy.toFixed(0)}m)`);
      },
      (err) => {
        if (retryWithLowAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
          console.warn("High accuracy GPS failed in Login, retrying with low accuracy...");
          handleGetLocation(false);
        } else {
          let msg = err.message;
          if (err.code === err.TIMEOUT) msg = "Hết thời gian chờ. Hãy bật GPS và thử lại.";
          setError(`Lỗi định vị: ${msg}`);
          setIsLoading(false);
        }
      },
      options
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering 
      ? { username, password, role, area, organizationName }
      : { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setSuccess(data.message);
          setIsRegistering(false);
          // Clear sensitive fields
          setPassword('');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
        }
      } else {
        setError(data.message || 'Thao tác thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-br from-teal-500 to-teal-700 text-white">
          <div className="inline-block bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
             <LogoIcon className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight uppercase">DA NANG GREEN</h2>
          <p className="text-teal-100 mt-2">Hệ thống Quản lý Môi trường Thông minh</p>
        </div>
        
        <div className="p-8">
          <div className="flex mb-8 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Đơn vị / Tổ chức</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                  placeholder="Ví dụ: UBND Phường Hòa Cường Bắc"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa bàn quản lý</label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      <option value="All">Toàn vùng (ĐN - QN)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGetLocation()}
                    className="p-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Xác định vị trí qua GPS"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm border border-red-100 flex items-center animate-shake">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100 flex items-center">
                <div className="bg-green-500 text-white rounded-full p-1 mr-3 flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200 hover:bg-teal-700 hover:shadow-teal-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : (isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập Hệ thống')}
            </button>

            {!isRegistering && (
              <button
                type="button"
                onClick={() => onLogin({ username: 'guest', role: 'citizen', area: 'All', organizationName: 'Người dân' })}
                className="w-full mt-4 bg-white text-teal-600 font-bold py-3 rounded-xl border-2 border-teal-100 hover:bg-teal-50 transition-all duration-300"
              >
                Tiếp tục với vai trò Người dân
              </button>
            )}
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Hệ thống dành cho cán bộ quản lý, trường học và ban ngành.</p>
            <p>Mọi đăng ký sẽ được giám sát bởi quản trị viên hệ thống.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
