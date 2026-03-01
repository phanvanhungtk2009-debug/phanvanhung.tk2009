import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDb } from './database';
import { EnvironmentalReport } from './types';

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

  // Auth Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for username: ${username}`);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
      }
      
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

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
  app.post('/api/auth/register', (req, res) => {
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

      // Check if user exists
      const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare(`
        INSERT INTO users (username, password, role, area, organizationName, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // New registrations are 'pending' by default for security, but for this demo let's make them 'active'
      // so the user can test immediately.
      stmt.run(username, hashedPassword, role, area, organizationName, 'active');

      res.status(201).json({ message: 'Đăng ký tài khoản thành công. Bạn có thể đăng nhập ngay.' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký' });
    }
  });

  // Get Reports
  app.get('/api/reports', (req, res) => {
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
  });

  // Create Report
  app.post('/api/reports', (req, res) => {
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
        new Date().toISOString(),
        area
      );

      // Broadcast new report via WebSocket
      broadcast({ type: 'NEW_REPORT', report: { ...report, area, timestamp: new Date().toISOString() } });

      res.status(201).json({ message: 'Report created successfully' });
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ message: 'Failed to save report' });
    }
  });

  // Update Report Status
  app.patch('/api/reports/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const stmt = db.prepare('UPDATE reports SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes > 0) {
      broadcast({ type: 'REPORT_UPDATED', id, status });
      res.json({ message: 'Status updated' });
    } else {
      res.status(404).json({ message: 'Report not found' });
    }
  });

  // Get Stats for Dashboard
  app.get('/api/stats', (req, res) => {
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
