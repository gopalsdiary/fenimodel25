require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/api/saidul_database', upload.single('studentPhoto'), async (req, res) => {
  try {
    const f = req.file;
    const photoUrl = f ? `/uploads/${f.filename}` : null;

    // Map incoming fields; provide defaults when absent
    const {
      student_name_en = null,
      student_dateofbirth = null,
      father_name_en = null,
      father_mobile = null,
      mother_name_en = null,
      full_address = null,
      class_2025 = null,
      roll_2025 = null,
      student_gender = null,
      session = null
    } = req.body;

    const insertQuery = `
      INSERT INTO saidul_database(
        student_name_en, student_dateofbirth, father_name_en, father_mobile,
        mother_name_en, full_address, class_2025, roll_2025, student_gender, student_photo_url, session
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *;
    `;

    const values = [
      student_name_en,
      student_dateofbirth,
      father_name_en,
      father_mobile || null,
      mother_name_en,
      full_address,
      class_2025,
      roll_2025 ? (isNaN(Number(roll_2025)) ? null : Number(roll_2025)) : null,
      student_gender,
      photoUrl,
      session ? (isNaN(Number(session)) ? null : Number(session)) : null
    ];

    const { rows } = await pool.query(insertQuery, values);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
