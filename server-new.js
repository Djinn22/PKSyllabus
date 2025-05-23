const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYLLABUS_FILE = path.join(__dirname, 'syllabus.json');

app.get('/api/syllabus', (req, res) => {
  fs.readFile(SYLLABUS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading syllabus');
    res.json(JSON.parse(data));
  });
});

app.post('/api/syllabus', (req, res) => {
  fs.writeFile(SYLLABUS_FILE, JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).send('Error writing syllabus');
    res.json(req.body);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
