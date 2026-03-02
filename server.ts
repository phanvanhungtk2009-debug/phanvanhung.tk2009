import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDb } from './database';
import { EnvironmentalReport } from './types';
import { supabase } from './services/supabaseClient';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-me';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Initialize Database
  initDb();

  app.use(cors());
  app.use(express.json({ limit: '100mb' })); // Increase limit for base64 images and videos

  // Performance Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // WebSocket handling
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => console.log('Client disconnected'));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // --- API Routes ---

  // Health check for Vercel and Supabase
  app.get('/api/health', async (req, res) => {
    const status: any = {
      server: 'ok',
      sqlite: 'connected',
      supabase: 'not_configured'
    };

    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { error } = await supabase.from('reports').select('id').limit(1);
        if (error) {
          status.supabase = 'error';
          status.supabaseError = error.message;
          if (error.message.includes('Could not find the table')) {
            status.supabaseAdvice = 'Bạn cần chạy lệnh SQL để tạo bảng "reports" trên Supabase.';
          }
        } else {
          status.supabase = 'connected';
        }
      } catch (err: any) {
        status.supabase = 'exception';
        status.supabaseError = err.message;
      }
    }

    res.json(status);
  });

  // Auth Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for username: ${username}`);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
      }
      
      let user: any = null;

      // Try Supabase first
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        
        if (!error && data) {
          user = data;
        } else if (error && !(error.code === '42P01' || error.message?.includes('Could not find the table'))) {
          console.warn('Supabase login check failed:', error.message);
        }
      }

      // Fallback to SQLite
      if (!user) {
        user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      }

      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        console.log(`Invalid password for user: ${username}`);
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, area: user.area }, JWT_SECRET, { expiresIn: '24h' });
      console.log(`Login successful for user: ${username}`);
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, area: user.area, organizationName: user.organizationName } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập' });
    }
  });

  // Auth Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, role, area, organizationName } = req.body;
      
      // Validate input
      if (!username || !password || !role) {
          return res.status(400).json({ 
              message: 'Thiếu thông tin bắt buộc: username, password, role' 
          });
      }

      if (password.length < 8) {
          return res.status(400).json({ 
              message: 'Mật khẩu phải có ít nhất 8 ký tự' 
          });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      // Try Supabase first
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        try {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();
          
          if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại (Supabase)' });
          }

          const { error } = await supabase
            .from('users')
            .insert([{
              username,
              password: hashedPassword,
              role,
              area,
              organizationName,
              status: 'active'
            }]);
          
          if (!error) {
            return res.status(201).json({ message: 'Đăng ký tài khoản thành công (Supabase). Bạn có thể đăng nhập ngay.' });
          }
          
          const isTableNotFound = error.code === '42P01' || error.message?.includes('Could not find the table');
          if (!isTableNotFound) {
            console.warn('Supabase register failed, falling back to SQLite:', error.message || error);
          }
        } catch (err: any) {
          if (!err.message?.includes('Could not find the table')) {
            console.error('Supabase error during registration:', err.message || err);
          }
        }
      }

      // Check if user exists in SQLite
      const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại (SQLite)' });
      }

      const stmt = db.prepare(`
        INSERT INTO users (username, password, role, area, organizationName, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(username, hashedPassword, role, area, organizationName, 'active');

      res.status(201).json({ message: 'Đăng ký tài khoản thành công (SQLite). Bạn có thể đăng nhập ngay.' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký' });
    }
  });

let supabaseTableErrorLogged = false;

  // Get Reports
  app.get('/api/reports', async (req, res) => {
    try {
      // Try Supabase first if configured
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('timestamp', { ascending: false });
        
        if (!error && data) {
          const parsedReports = data.map((r: any) => ({
            ...r,
            isIssuePresent: !!r.isIssuePresent,
            aiAnalysis: {
              issueType: r.issueType,
              description: r.description,
              priority: r.priority,
              solution: r.solution,
              isIssuePresent: !!r.isIssuePresent
            }
          }));
          return res.json(parsedReports);
        }
        
        // Silence "Table not found" errors as they are expected before initial setup
        const isTableNotFound = error?.code === '42P01' || (error?.message && error.message.includes('Could not find the table'));
        if (!isTableNotFound) {
          console.warn('Supabase fetch failed:', error?.message || error);
        }
      }

      const reports = db.prepare('SELECT * FROM reports ORDER BY timestamp DESC').all();
      // Parse JSON fields if necessary or boolean conversion
      const parsedReports = reports.map((r: any) => ({
        ...r,
        isIssuePresent: !!r.isIssuePresent,
        aiAnalysis: {
          issueType: r.issueType,
          description: r.description,
          priority: r.priority,
          solution: r.solution,
          isIssuePresent: !!r.isIssuePresent
        }
      }));
      res.json(parsedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      res.status(500).json({ message: 'Lỗi khi tải danh sách báo cáo' });
    }
  });

  // Create Report
  app.post('/api/reports', async (req, res) => {
    const report = req.body;
    console.log(`Received report at Lat: ${report.latitude}, Lng: ${report.longitude}`);
    
    // Determine area based on lat/lng using distance-based matching
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
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let area = 'Hải Châu';
    let minDistance = Infinity;

    Object.entries(districtCoords).forEach(([name, coords]) => {
      const dist = calculateDistance(report.latitude, report.longitude, coords.lat, coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        area = name;
      }
    });

    const timestamp = new Date().toISOString();

    // Try Supabase first
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { error } = await supabase
          .from('reports')
          .insert([{
            id: report.id,
            mediaUrl: report.mediaUrl,
            mediaType: report.mediaType,
            latitude: report.latitude,
            longitude: report.longitude,
            userDescription: report.userDescription,
            issueType: report.aiAnalysis.issueType,
            description: report.aiAnalysis.description,
            priority: report.aiAnalysis.priority,
            solution: report.aiAnalysis.solution,
            isIssuePresent: report.aiAnalysis.isIssuePresent ? 1 : 0,
            status: report.status,
            timestamp: timestamp,
            area: area
          }]);
        
        if (!error) {
          broadcast({ type: 'NEW_REPORT', report: { ...report, area, timestamp } });
          return res.status(201).json({ message: 'Report created successfully (Supabase)' });
        }
        
        const isTableNotFound = error.code === '42P01' || error.message?.includes('Could not find the table');
        if (!isTableNotFound) {
          console.warn('Supabase insert failed, falling back to SQLite:', error.message || error);
        }
      } catch (err: any) {
        if (!err.message?.includes('Could not find the table')) {
          console.error('Supabase error:', err.message || err);
        }
      }
    }

    const stmt = db.prepare(`
      INSERT INTO reports (id, mediaUrl, mediaType, latitude, longitude, userDescription, issueType, description, priority, solution, isIssuePresent, status, timestamp, area)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        report.id,
        report.mediaUrl,
        report.mediaType,
        report.latitude,
        report.longitude,
        report.userDescription,
        report.aiAnalysis.issueType,
        report.aiAnalysis.description,
        report.aiAnalysis.priority,
        report.aiAnalysis.solution,
        report.aiAnalysis.isIssuePresent ? 1 : 0,
        report.status,
        timestamp,
        area
      );

      // Broadcast new report via WebSocket
      broadcast({ type: 'NEW_REPORT', report: { ...report, area, timestamp } });

      res.status(201).json({ message: 'Report created successfully (SQLite)' });
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ message: 'Failed to save report' });
    }
  });

  // Bulk Create Reports
  app.post('/api/reports/bulk', async (req, res) => {
    const { reports } = req.body;
    if (!Array.isArray(reports)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Phải là một mảng báo cáo.' });
    }

    console.log(`Bulk importing ${reports.length} reports...`);
    const timestamp = new Date().toISOString();
    const results = { success: 0, failed: 0 };

    // District coordinates for area matching
    const districtCoords: Record<string, { lat: number, lng: number }> = {
      'Hải Châu': { lat: 16.0474, lng: 108.2197 },
      'Thanh Khê': { lat: 16.0614, lng: 108.1801 },
      'Sơn Trà': { lat: 16.0911, lng: 108.2616 },
      'Ngũ Hành Sơn': { lat: 16.0025, lng: 108.2492 },
      'Liên Chiểu': { lat: 16.0592, lng: 108.1384 },
      'Cẩm Lệ': { lat: 15.9988, lng: 108.1916 },
      'Hòa Vang': { lat: 15.9867, lng: 108.0671 },
      'Tam Kỳ': { lat: 15.5647, lng: 108.4811 },
      'Hội An': { lat: 15.8801, lng: 108.3380 }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    for (const report of reports) {
      let area = 'Hải Châu';
      let minDistance = Infinity;
      Object.entries(districtCoords).forEach(([name, coords]) => {
        const dist = calculateDistance(report.latitude, report.longitude, coords.lat, coords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          area = name;
        }
      });

      const reportTimestamp = report.timestamp || timestamp;

      // Try Supabase
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        try {
          const { error } = await supabase.from('reports').insert([{
            id: report.id,
            mediaUrl: report.mediaUrl,
            mediaType: report.mediaType,
            latitude: report.latitude,
            longitude: report.longitude,
            userDescription: report.userDescription,
            issueType: report.aiAnalysis.issueType,
            description: report.aiAnalysis.description,
            priority: report.aiAnalysis.priority,
            solution: report.aiAnalysis.solution,
            isIssuePresent: report.aiAnalysis.isIssuePresent ? 1 : 0,
            status: report.status,
            timestamp: reportTimestamp,
            area: area
          }]);
          if (!error) {
            results.success++;
            continue;
          }
          const isTableNotFound = error.code === '42P01' || error.message?.includes('Could not find the table');
          if (!isTableNotFound) {
             console.warn('Supabase bulk insert failed:', error.message);
          }
        } catch (err: any) {
          if (!err.message?.includes('Could not find the table')) {
            console.error('Supabase bulk insert error:', err);
          }
        }
      }

      // Fallback to SQLite
      try {
        const stmt = db.prepare(`
          INSERT INTO reports (id, mediaUrl, mediaType, latitude, longitude, userDescription, issueType, description, priority, solution, isIssuePresent, status, timestamp, area)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          report.id, report.mediaUrl, report.mediaType, report.latitude, report.longitude,
          report.userDescription, report.aiAnalysis.issueType, report.aiAnalysis.description,
          report.aiAnalysis.priority, report.aiAnalysis.solution, report.aiAnalysis.isIssuePresent ? 1 : 0,
          report.status, reportTimestamp, area
        );
        results.success++;
      } catch (err) {
        console.error('SQLite bulk insert error:', err);
        results.failed++;
      }
    }

    broadcast({ type: 'NEW_REPORT' }); // Notify clients to refresh
    res.json({ message: `Đã nhập thành công ${results.success} báo cáo. Thất bại: ${results.failed}`, results });
  });

  // Update Report Status
  app.patch('/api/reports/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // Try Supabase first
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { error } = await supabase
          .from('reports')
          .update({ status })
          .eq('id', id);
        
        if (!error) {
          broadcast({ type: 'REPORT_UPDATED', id, status });
          return res.json({ message: 'Status updated (Supabase)' });
        }
        
        const isTableNotFound = error.code === '42P01' || error.message?.includes('Could not find the table');
        if (!isTableNotFound) {
          console.warn('Supabase update failed, falling back to SQLite:', error.message || error);
        }
      } catch (err: any) {
        if (!err.message?.includes('Could not find the table')) {
          console.error('Supabase error during update:', err.message || err);
        }
      }
    }

    const stmt = db.prepare('UPDATE reports SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes > 0) {
      broadcast({ type: 'REPORT_UPDATED', id, status });
      res.json({ message: 'Status updated (SQLite)' });
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  });

  // External Model Analysis Proxy
  app.post('/api/external-analysis', async (req, res) => {
    const { reportId, data } = req.body;
    const apiUrl = process.env.EXTERNAL_MODEL_API_URL;
    const apiKey = process.env.EXTERNAL_MODEL_API_KEY;

    if (!apiUrl) {
      return res.status(500).json({ message: 'Chưa cấu hình URL cho mô hình bên ngoài' });
    }

    try {
      console.log(`Sending report ${reportId} to external model for analysis...`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ reportId, image_data: data, timestamp: new Date().toISOString() })
      });

      if (!response.ok) throw new Error(`Mô hình ngoài trả về lỗi: ${response.status}`);
      const result = await response.json();
      res.json({ success: true, analysis: result });
    } catch (error: any) {
      console.error('External Model Error:', error);
      res.status(500).json({ message: 'Lỗi khi kết nối với mô hình bên ngoài', error: error.message });
    }
  });

  // Get Stats for Dashboard
  app.get('/api/stats', async (req, res) => {
    try {
      // Try Supabase first
      if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        const { data: reports, error } = await supabase
          .from('reports')
          .select('priority, status, area, id, issueType, timestamp');
        
        if (!error && reports) {
          const total = reports.length;
          
          const byPriorityMap: Record<string, number> = {};
          const byStatusMap: Record<string, number> = {};
          const byAreaMap: Record<string, number> = {};
          
          reports.forEach(r => {
            byPriorityMap[r.priority] = (byPriorityMap[r.priority] || 0) + 1;
            byStatusMap[r.status] = (byStatusMap[r.status] || 0) + 1;
            byAreaMap[r.area] = (byAreaMap[r.area] || 0) + 1;
          });

          const byPriority = Object.entries(byPriorityMap).map(([priority, count]) => ({ priority, count }));
          const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));
          const byArea = Object.entries(byAreaMap).map(([area, count]) => ({ area, count }));
          const recentActivity = [...reports]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(r => ({ id: r.id, issueType: r.issueType, timestamp: r.timestamp, status: r.status }));

          return res.json({
            total,
            byPriority,
            byStatus,
            byArea,
            recentActivity
          });
        }
        
        const isTableNotFound = error?.code === '42P01' || (error?.message && error.message.includes('Could not find the table'));
        if (!isTableNotFound) {
          console.warn('Supabase stats failed:', error.message || error);
        }
      }

      const totalReports = db.prepare('SELECT count(*) as count FROM reports').get() as any;
      const byPriority = db.prepare('SELECT priority, count(*) as count FROM reports GROUP BY priority').all();
      const byStatus = db.prepare('SELECT status, count(*) as count FROM reports GROUP BY status').all();
      const byArea = db.prepare('SELECT area, count(*) as count FROM reports GROUP BY area').all();
      const recentActivity = db.prepare('SELECT id, issueType, timestamp, status FROM reports ORDER BY timestamp DESC LIMIT 5').all();

      res.json({
        total: totalReports.count,
        byPriority,
        byStatus,
        byArea,
        recentActivity
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ message: 'Lỗi khi tải thống kê' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if needed)
    app.use(express.static('dist'));
    
    // SPA fallback for production
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
