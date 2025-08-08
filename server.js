const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('basic-auth');
const winston = require('winston');
const Joi = require('joi');
const app = express();

// Middlewares
app.use(express.json()); // Parse JSON request bodies

// Serve React build files
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Serve legacy static files (for logo and other assets)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pkr_logo.webp', express.static(path.join(__dirname, 'pkr_logo.webp')));

// Authentication configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'karate123';

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
      
      // Add isCurrentBelt flag to all items
      Object.entries(syllabusData).forEach(([belt, categories]) => {
        Object.entries(categories).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            syllabusData[belt][category] = items.map(item => ({
              ...item,
              isCurrentBelt: true
            }));
          }
        });
      });
      
      logger.info('Syllabus data retrieved successfully', { 
        belts: Object.keys(syllabusData).length,
        withIsCurrentFlag: true 
      });
      
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
    logLevel: logger.level,
    adminUsername: ADMIN_USERNAME
  });
  console.log(`PKSyllabus server running on port ${port}`);
});
