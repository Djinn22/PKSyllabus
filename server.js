const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const winston = require('winston');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const basicAuth = require('basic-auth');
const app = express();

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions)); // Allow CORS requests with specific options
app.use(express.json()); // Parse JSON request bodies

// Handle preflight requests
app.options('*', cors(corsOptions));

// Serve React build files
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Serve legacy static files (for logo and other assets)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pkr_logo.webp', express.static(path.join(__dirname, 'pkr_logo.webp')));

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Authentication configuration
// Use a configurable data directory for environments with persistent volumes (e.g., Render)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Load users from file
const loadUsers = async () => {
  try {
    const data = await fsp.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data).users || [];
  } catch (error) {
    logger.error('Error loading users', { error: error.message });
    return [];
  }
};

// Save users to file
const saveUsers = async (users) => {
  try {
    await fsp.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf8');
  } catch (error) {
    logger.error('Error saving users', { error: error.message });
    throw error;
  }
};

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  const defaultAdmin = {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10), // Default password
    isAdmin: true,
    createdAt: new Date().toISOString()
  };
  saveUsers([defaultAdmin]);
}

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('Invalid JWT token', { error: err.message });
        return res.sendStatus(403);
      }
      
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Authentication middleware for admin functions
const requireAuth = (req, res, next) => {
  const user = basicAuth(req);
  
  if (!user || user.name !== ADMIN_USERNAME || user.pass !== ADMIN_PASSWORD) {
    logger.warn('Authentication failed', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      providedUsername: user?.name || 'none'
    });
    res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  logger.info('Authentication successful', { 
    user: user.name, 
    ip: req.ip, 
    url: req.url,
    method: req.method
  });
  
  next();
};

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pksyllabus' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Data validation schema for syllabus structure
const syllabusItemSchema = Joi.object({
  traditional: Joi.string().allow(''),
  english: Joi.string().allow('')
});

const applicationItemSchema = Joi.object({
  name: Joi.string().required(),
  requirements: Joi.array().items(Joi.string()),
  subCategory: Joi.string().optional()
});

const beltSchema = Joi.object({
  'Stances': Joi.array().items(syllabusItemSchema).optional(),
  'Punches and Strikes': Joi.array().items(syllabusItemSchema).optional(),
  'Blocks': Joi.array().items(syllabusItemSchema).optional(),
  'Kicks': Joi.array().items(syllabusItemSchema).optional(),
  'Kata': Joi.array().items(syllabusItemSchema).optional(),
  'Basic Drills': Joi.array().items(syllabusItemSchema).optional(),
  'Fighting Drills': Joi.array().items(syllabusItemSchema).optional(),
  'Application': Joi.array().items(applicationItemSchema).optional(),
  'Demonstration': Joi.array().items(applicationItemSchema).optional(),
  'Impact': Joi.array().items(applicationItemSchema).optional()
}).unknown(true); // Allow additional categories

const syllabusSchema = Joi.object().pattern(
  Joi.string(), // Belt name (e.g., "Red Belt", "Yellow Belt")
  beltSchema
);

// Backup functionality (Promise-based)
const createBackup = async (customName = '') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(DATA_DIR, 'backups');
  const safeName = customName && typeof customName === 'string'
    ? customName.replace(/[^a-zA-Z0-9-_]/g, '') + '-'
    : '';
  const backupFile = path.join(backupDir, `${safeName}syllabus-backup-${timestamp}.json`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    logger.info('Created backup directory', { dir: backupDir });
  }

  await fsp.copyFile(SYLLABUS_FILE, backupFile);
  return backupFile;
};

const JUNIOR_SYLLABUS_FILE = path.join(DATA_DIR, 'syllabus-junior.json');
const SENIOR_SYLLABUS_FILE = path.join(DATA_DIR, 'syllabus-senior.json');
const SYLLABUS_FILE = SENIOR_SYLLABUS_FILE; // Default to senior syllabus

// Ensure DATA_DIR exists and seed required files if missing (for first boot on Render)
const ensureDataFiles = async () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const defaults = [
      { src: path.join(__dirname, 'users.json'), dst: USERS_FILE, template: '{"users":[]}' },
      { src: path.join(__dirname, 'syllabus-junior.json'), dst: JUNIOR_SYLLABUS_FILE, template: '{}' },
      { src: path.join(__dirname, 'syllabus-senior.json'), dst: SENIOR_SYLLABUS_FILE, template: '{}' },
    ];
    for (const f of defaults) {
      if (!fs.existsSync(f.dst)) {
        if (fs.existsSync(f.src)) {
          fs.copyFileSync(f.src, f.dst);
        } else {
          fs.writeFileSync(f.dst, f.template, 'utf8');
        }
      }
    }
    const backupsDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
  } catch (e) {
    logger.error('ensureDataFiles failed', { error: e.message, DATA_DIR });
  }
};

// Kick off seeding (non-blocking)
ensureDataFiles();

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const usersData = await loadUsers();
    const users = Array.isArray(usersData) ? usersData : [];
    const user = users.find(u => u.username === username);

    if (!user) {
      logger.warn('Login failed: User not found', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login failed: Invalid password', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User logged in successfully', { username });
    res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    isAdmin: req.user.isAdmin
  });
});

// User Management Routes
app.get('/api/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const users = await loadUsers();
    const userList = users.map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    }));
    res.json(userList);
  } catch (error) {
    logger.error('Error fetching users', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const users = await loadUsers();
    
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password: hashedPassword,
      isAdmin: !!isAdmin,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    logger.info('New user created', { username, isAdmin: !!isAdmin, createdBy: req.user.username });
    
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      createdAt: newUser.createdAt
    });
    
  } catch (error) {
    logger.error('Error creating user', { error: error.message });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/admin/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    let users = await loadUsers();
    const initialLength = users.length;
    
    users = users.filter(user => user.id !== userId);
    
    if (users.length === initialLength) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await saveUsers(users);
    logger.info('User deleted', { userId, deletedBy: req.user.username });
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Backup Routes (RESTful plural)
app.get('/api/backups', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => fs.statSync(path.join(backupDir, b)).birthtime - fs.statSync(path.join(backupDir, a)).birthtime);
    // Return filenames only
    res.json({ backups: files });
  } catch (error) {
    logger.error('Error listing backups', { error: error.message });
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.post('/api/backups', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const name = (req.body && req.body.name) || '';
    const backupPath = await createBackup(name);
    logger.info('Backup created', { backupPath, user: req.user.username });
    res.status(201).json({ message: 'Backup created', filename: path.basename(backupPath) });
  } catch (error) {
    logger.error('Error creating backup', { error: error.message });
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.post('/api/backups/:filename/restore', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.body || {};
    const backupDir = path.join(__dirname, 'backups');
    const source = path.join(backupDir, filename);
    if (!fs.existsSync(source)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    const target = (type === 'junior') ? path.join(DATA_DIR, 'syllabus-junior.json') : path.join(DATA_DIR, 'syllabus-senior.json');
    await fsp.copyFile(source, target);
    logger.info('Backup restored', { filename, target, user: req.user.username });
    res.json({ message: 'Backup restored' });
  } catch (error) {
    logger.error('Error restoring backup', { error: error.message });
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

app.delete('/api/backups/:filename', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, 'backups');
    const target = path.join(backupDir, filename);
    if (!fs.existsSync(target)) {
      return res.status(404).json({ error: 'Backup not found' });
    }
    await fsp.unlink(target);
    logger.info('Backup deleted', { filename, user: req.user.username });
    res.json({ message: 'Backup deleted' });
  } catch (error) {
    logger.error('Error deleting backup', { error: error.message });
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// GET syllabus data - supports both /api/syllabus?type=junior and /api/syllabus/junior
app.get(['/api/syllabus', '/api/syllabus/:type'], (req, res) => {
  // Determine syllabus type from query param or route param
  let type = 'senior';
  if (req.query.type === 'junior' || req.params.type === 'junior') {
    type = 'junior';
  }
  const filePath = type === 'junior' ? JUNIOR_SYLLABUS_FILE : SENIOR_SYLLABUS_FILE;
  
  logger.info(`Fetching ${type} syllabus data`, { ip: req.ip, userAgent: req.get('User-Agent') });
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      logger.error(`Error reading ${type} syllabus file`, { error: err.message, file: filePath });
      return res.status(500).json({ error: `Unable to read ${type} syllabus file.` });
    }
    try {
      const syllabusData = JSON.parse(data);
      logger.info(`${type} syllabus data retrieved successfully`, { belts: Object.keys(syllabusData).length });
      res.json(syllabusData);
    } catch (parseErr) {
      logger.error(`Error parsing ${type} syllabus file`, { error: parseErr.message, file: filePath });
      res.status(500).json({ error: 'Syllabus file is not valid JSON.' });
    }
  });
});

// POST syllabus data (overwrite with new content) - Protected with JWT admin
app.post('/api/syllabus', authenticateJWT, requireAdmin, async (req, res) => {
  const json = req.body;
  const type = req.query.type === 'junior' ? 'junior' : 'senior';
  const filePath = type === 'junior' ? JUNIOR_SYLLABUS_FILE : SENIOR_SYLLABUS_FILE;
  
  logger.info(`${type} syllabus update request received`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    user: req.user.username,
    belts: Object.keys(json).length
  });

  // Validate syllabus structure
  const { error, value } = syllabusSchema.validate(json, { allowUnknown: true });
  
  if (error) {
    logger.warn(`${type} syllabus validation failed`, { 
      error: error.details[0].message,
      path: error.details[0].path,
      user: req.user.username
    });
    return res.status(400).json({ 
      error: `Invalid ${type} syllabus structure`, 
      details: error.details[0].message 
    });
  }
  
  logger.info(`${type} syllabus validation passed`, { 
    belts: Object.keys(value).length,
    user: req.user.username 
  });

  try {
    // Create backup before saving
    const backupPath = await createBackup();
    logger.info('Backup created before update', { backupPath, user: req.user.username });

    // Save the updated syllabus
    await fsp.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');

    logger.info(`${type} syllabus updated successfully`, { 
      belts: Object.keys(value).length, 
      file: filePath,
      user: req.user.username
    });

    res.json({ 
      success: true, 
      message: `${type} syllabus updated successfully`,
      backup: path.basename(backupPath)
    });
  } catch (err) {
    logger.error(`Error updating ${type} syllabus`, { error: err.message, file: filePath, user: req.user.username });
    return res.status(500).json({ error: `Unable to update ${type} syllabus file.` });
  }
});

// Optional: Handle 404s for unknown API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Protected admin routes
app.get('/admin.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve React admin interface (protected)
app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Legacy route for backwards compatibility
app.get('/editSyllabus.html', requireAuth, (req, res) => {
  res.redirect('/admin');
});

// Serve React admin static files (protected)
app.use('/admin/static', requireAuth, express.static(path.join(__dirname, 'client', 'build', 'static')));

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Start server
const port = process.env.PORT || 3010;
app.listen(port, () => {
  logger.info('PKSyllabus server started successfully', { 
    port, 
    environment: process.env.NODE_ENV || 'development',
    logLevel: logger.level
  });
  console.log(`PKSyllabus server running on port ${port}`);
});
