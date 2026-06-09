const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { processCsv } = require('./csvProcessor');

const app    = express();
const upload = multer({ dest: 'uploads/' });

// Serve frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// POST /analyze — receives the uploaded CSV, runs analysis, returns JSON
app.post('/analyze', upload.single('csvfile'), async (req, res) => {
  try {
    const results = await processCsv(req.file.path);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
