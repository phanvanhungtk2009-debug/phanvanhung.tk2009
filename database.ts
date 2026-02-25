import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('danang_green.db');

export const initDb = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT, -- 'admin', 'district_manager', 'ward_manager', 'school_manager', 'department_manager', 'environment_department'
      area TEXT, -- e.g., 'Hai Chau', 'Son Tra', 'Hoa Vang'
      organizationName TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  // Migration: Add columns if they don't exist
  try {
    db.exec("ALTER TABLE users ADD COLUMN organizationName TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  } catch (e) {}

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      mediaUrl TEXT,
      mediaType TEXT,
      latitude REAL,
      longitude REAL,
      userDescription TEXT,
      issueType TEXT,
      description TEXT,
      priority TEXT,
      solution TEXT,
      isIssuePresent INTEGER, -- boolean stored as 0/1
      status TEXT,
      timestamp TEXT,
      area TEXT
    )
  `);

  // Seed users if empty
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get() as { count: number };
  
  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO users (username, password, role, area) VALUES (?, ?, ?, ?)');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    insert.run('admin', hashedPassword, 'admin', 'All');
    insert.run('quantrivien', hashedPassword, 'admin', 'All');
    insert.run('quản trị viên', hashedPassword, 'admin', 'All');
    insert.run('haichau_manager', hashedPassword, 'district_manager', 'Hải Châu');
    insert.run('sontra_manager', hashedPassword, 'district_manager', 'Sơn Trà');
    insert.run('thanhkhe_manager', hashedPassword, 'district_manager', 'Thanh Khê');
    console.log('Database seeded with initial users.');
  } else {
    // Ensure 'quản trị viên' exists for users who already have a database
    const checkUser = db.prepare('SELECT count(*) as count FROM users WHERE username = ?');
    const adminExists = checkUser.get('quản trị viên') as { count: number };
    if (adminExists.count === 0) {
      const insert = db.prepare('INSERT INTO users (username, password, role, area) VALUES (?, ?, ?, ?)');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      insert.run('quantrivien', hashedPassword, 'admin', 'All');
      insert.run('quản trị viên', hashedPassword, 'admin', 'All');
      console.log('Added Vietnamese admin aliases to existing database.');
    }
  }
};

export default db;
