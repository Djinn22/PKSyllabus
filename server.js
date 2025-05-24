const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middlewares
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.json()); // Parse JSON request bodies

const SYLLABUS_FILE = path.join(__dirname, 'syllabus.json');

// GET syllabus.json
app.get('/api/syllabus', (req, res) => {
  fs.readFile(SYLLABUS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading syllabus.json:', err);
      return res.status(500).json({ error: 'Unable to read syllabus file.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error('Error parsing syllabus.json:', parseErr);
      res.status(500).json({ error: 'Syllabus file is not valid JSON.' });
    }
  });
});

// POST syllabus.json (overwrite with new content)
app.post('/api/syllabus', (req, res) => {
  const json = req.body;
  if (!json || typeof json !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  fs.writeFile(SYLLABUS_FILE, JSON.stringify(json, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing syllabus.json:', err);
      return res.status(500).json({ error: 'Unable to write syllabus file.' });
    }
    res.json({ success: true });
  });
});

// Optional: Handle 404s for unknown API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Serve index.html for root (already handled by static middleware)
// Optionally, handle SPA routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
