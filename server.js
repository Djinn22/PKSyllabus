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
const USERS_FILE = path.join(__dirname, 'users.json');

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

// Backup functionality
const createBackup = (callback) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  const backupFile = path.join(backupDir, `syllabus-backup-${timestamp}.json`);
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    logger.info('Created backup directory', { dir: backupDir });
  }
  
  // Copy current syllabus to backup
  fs.copyFile(SYLLABUS_FILE, backupFile, (err) => {
    if (err) {
      logger.error('Failed to create backup', { error: err.message, backupFile });
      return callback(err);
    }
    logger.info('Backup created successfully', { backupFile });
    callback(null, backupFile);
  });
};

const SYLLABUS_FILE = path.join(__dirname, 'syllabus.json');

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
app.get('/api/admin/users', authenticateJWT, requireAdmin, (req, res) => {
  try {
    const users = loadUsers().map(user => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    }));
    res.json(users);
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
    
    const users = loadUsers();
    
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

app.delete('/api/admin/users/:id', authenticateJWT, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    let users = loadUsers();
    const initialLength = users.length;
    
    users = users.filter(user => user.id !== userId);
    
    if (users.length === initialLength) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    saveUsers(users);
    logger.info('User deleted', { userId, deletedBy: req.user.username });
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET syllabus.json
app.get('/api/syllabus', (req, res) => {
  logger.info('Fetching syllabus data', { ip: req.ip, userAgent: req.get('User-Agent') });
  
  fs.readFile(SYLLABUS_FILE, 'utf8', (err, data) => {
    if (err) {
      logger.error('Error reading syllabus.json', { error: err.message, file: SYLLABUS_FILE });
      return res.status(500).json({ error: 'Unable to read syllabus file.' });
    }
    try {
      const syllabusData = JSON.parse(data);
      logger.info('Syllabus data retrieved successfully', { belts: Object.keys(syllabusData).length });
      res.json(syllabusData);
    } catch (parseErr) {
      logger.error('Error parsing syllabus.json', { error: parseErr.message, file: SYLLABUS_FILE });
      res.status(500).json({ error: 'Syllabus file is not valid JSON.' });
    }
  });
});

// POST syllabus.json (overwrite with new content) - Protected with authentication
app.post('/api/syllabus', requireAuth, (req, res) => {
  const json = req.body;
  const user = basicAuth(req);
  
  logger.info('Syllabus update request received', { 
    user: user?.name, 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    dataSize: JSON.stringify(json).length 
  });
  
  // Basic input validation
  if (!json || typeof json !== 'object') {
    logger.warn('Invalid JSON body received', { user: user?.name, ip: req.ip });
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  
  // Validate syllabus structure
  const { error, value } = syllabusSchema.validate(json, { allowUnknown: true });
  if (error) {
    logger.warn('Syllabus validation failed', { 
      user: user?.name, 
      ip: req.ip, 
      validationError: error.details 
    });
    return res.status(400).json({ 
      error: 'Invalid syllabus structure', 
      details: error.details.map(d => d.message) 
    });
  }
  
  logger.info('Syllabus validation passed', { 
    user: user?.name, 
    belts: Object.keys(json).length 
  });
  
  // Create backup before overwriting
  createBackup((backupErr, backupFile) => {
    if (backupErr) {
      logger.error('Backup creation failed', { 
        user: user?.name, 
        error: backupErr.message 
      });
      return res.status(500).json({ error: 'Unable to create backup before saving.' });
    }
    
    // Write the validated data
    fs.writeFile(SYLLABUS_FILE, JSON.stringify(value, null, 2), 'utf8', (err) => {
      if (err) {
        logger.error('Error writing syllabus.json', { 
          user: user?.name, 
          error: err.message, 
          file: SYLLABUS_FILE,
          backupFile 
        });
        return res.status(500).json({ error: 'Unable to write syllabus file.' });
      }
      
      logger.info('Syllabus updated successfully', { 
        user: user?.name, 
        file: SYLLABUS_FILE,
        backupFile,
        belts: Object.keys(value).length 
      });
      
      res.json({ 
        success: true, 
        message: 'Syllabus updated successfully',
        backup: path.basename(backupFile)
      });
    });
  });
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
