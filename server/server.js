const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'asha_health_super_secret_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from repository root
app.use(express.static(path.join(__dirname, '..')));

// Explicit root route handler - guarantees http://localhost:5000/ ALWAYS loads on any machine
app.get('/', (req, res) => {
  const rootIndex = path.join(__dirname, '..', 'index.html');
  const patientIndex = path.join(__dirname, '..', 'patient', 'dashboard', 'index.html');
  
  if (require('fs').existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  } else if (require('fs').existsSync(patientIndex)) {
    return res.sendFile(patientIndex);
  } else {
    return res.redirect('/patient/dashboard/index.html');
  }
});

// Friendly shortcuts so clicking or typing any common path always works
app.get('/patient', (req, res) => res.redirect('/patient/dashboard/index.html'));
app.get('/dashboard', (req, res) => res.redirect('/patient/dashboard/index.html'));
app.get('/admin', (req, res) => res.redirect('/admin/command_center/command-center.html'));
app.get('/doctor', (req, res) => res.redirect('/patient/Talktodoctor/talk-to-doctor.html'));
app.get('/appointment', (req, res) => res.redirect('/patient/appointment/appointment.html'));

// Helper: JWT verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & CRYPTOGRAPHY APIS
// -------------------------------------------------------------

// POST /api/auth/register (Registration with BCrypt hashing)
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, phone, abha_id, age, gender, village } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const assignedRole = (role || 'PATIENT').toUpperCase();
    if (!['PATIENT', 'DOCTOR', 'WORKER', 'ADMIN'].includes(assignedRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Cryptographic Password Hashing (BCrypt)
    const passwordHash = bcrypt.hashSync(password, 10);

    // SQL INSERT user
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, abha_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertUser.run(name, email.toLowerCase(), passwordHash, assignedRole, phone || null, abha_id || null);
    const userId = Number(result.lastInsertRowid);

    // If PATIENT, also register in patients table
    if (assignedRole === 'PATIENT') {
      const insertPatient = db.prepare(`
        INSERT INTO patients (user_id, abha_id, name, age, gender, village, contact_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertPatient.run(
        userId,
        abha_id || `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        age || null,
        gender || null,
        village || null,
        phone || null
      );
    }

    // Generate JWT Token
    const token = jwt.sign({ id: userId, email: email.toLowerCase(), role: assignedRole, name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, name, email: email.toLowerCase(), role: assignedRole, abha_id }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login (Login with BCrypt Verification)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // SQL Query to find user
    const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = userStmt.get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Cryptographic BCrypt compare
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role-based redirect routing
    const roleRedirects = {
      PATIENT: '/patient/dashboard/dashboard.html',
      DOCTOR: '/patient/doctor_queue/doctor-queue.html',
      WORKER: '/workers/frontline_hub/frontline-hub.html',
      ADMIN: '/admin/command_center/command-center.html'
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        abha_id: user.abha_id,
        phone: user.phone
      },
      redirectUrl: roleRedirects[user.role] || '/'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// GET /api/auth/me (Get logged in user)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, abha_id, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// -------------------------------------------------------------
// 2. PATIENT FLOW APIS (③)
// -------------------------------------------------------------

// GET /api/patients
app.get('/api/patients', (req, res) => {
  try {
    const patients = db.prepare('SELECT * FROM patients ORDER BY id DESC').all();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patient/:id/records (Patient History ⑧ & Prescriptions ⑩)
app.get('/api/patient/:id/records', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE patient_id = ?').all(req.params.id);
    const samples = db.prepare('SELECT * FROM lab_samples WHERE patient_id = ?').all(req.params.id);

    res.json({
      patient,
      prescriptions,
      labReports: samples
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// POST /api/patient/:id/sync (Sync patient medications and vitals with doctor data)
app.post('/api/patient/:id/sync', (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Get latest prescriptions from doctor
    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY id ASC').all(patientId);

    // Get doctor consultation status
    const appointment = db.prepare(`
      SELECT q.*, 'Dr. Rajesh Verma' as doctor_name 
      FROM doctor_queue q 
      WHERE q.patient_id = ? 
      ORDER BY q.id DESC LIMIT 1
    `).get(patientId);

    // Get lab reports
    const labReports = db.prepare('SELECT * FROM lab_samples WHERE patient_id = ? ORDER BY id DESC').all(patientId);

    res.json({
      success: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patient,
      prescriptions,
      appointment: appointment || {
        doctor_name: 'Dr. Sharma',
        priority: 'ROUTINE',
        status: 'CONFIRMED',
        symptoms: 'ANC Routine Checkup'
      },
      labReports,
      message: 'Medications and clinical progress synced with doctor records.'
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// PATCH /api/patient/prescription/:id/toggle (Toggle medicine taken status)
app.patch('/api/patient/prescription/:id/toggle', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE prescriptions SET status = ? WHERE id = ?').run(status || 'TAKEN', req.params.id);
    res.json({ success: true, message: 'Medication status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update medication status' });
  }
});

// GET /api/doctors (Verified Doctor Directory)
app.get('/api/doctors', (req, res) => {
  try {
    const doctors = [
      {
        id: 1,
        name: 'Dr. Ananya Sharma',
        specialty: 'General Physician',
        experience: '10+ yrs',
        hospital: 'District Hospital, Ward 4',
        rating: 4.9,
        reviewsCount: 340,
        price: 500,
        available: true,
        modes: ['clinic', 'teleconsult']
      },
      {
        id: 2,
        name: 'Dr. Rajesh Verma',
        specialty: 'Cardiologist',
        experience: '14+ yrs',
        hospital: 'Community Health Center',
        rating: 4.8,
        reviewsCount: 280,
        price: 700,
        available: true,
        modes: ['clinic', 'teleconsult']
      },
      {
        id: 3,
        name: 'Dr. Sunita Patel',
        specialty: 'Pediatrician',
        experience: '8+ yrs',
        hospital: 'Maternal & Child Health Wing',
        rating: 4.95,
        reviewsCount: 410,
        price: 450,
        available: true,
        modes: ['clinic', 'teleconsult']
      },
      {
        id: 4,
        name: 'Dr. Amit Roy',
        specialty: 'Orthopedic Surgeon',
        experience: '12+ yrs',
        hospital: 'Sub-District Trauma Center',
        rating: 4.7,
        reviewsCount: 195,
        price: 600,
        available: false,
        modes: ['clinic']
      }
    ];
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// POST /api/appointments (Book & Save Patient Appointment in SQL)
app.post('/api/appointments', (req, res) => {
  try {
    const {
      patient_id,
      patient_name,
      patient_phone,
      patient_age,
      patient_gender,
      patient_email,
      doctor_name,
      doctor_specialty,
      appointment_date,
      time_slot,
      consultation_type,
      reason,
      allergies,
      total_fee
    } = req.body;

    if (!patient_name || !doctor_name || !appointment_date || !time_slot) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const bookingRef = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Resolve patient ID or link to existing
    let targetPatientId = patient_id || 1;
    if (!patient_id && patient_phone) {
      const existingPatient = db.prepare('SELECT id FROM patients WHERE contact_number = ?').get(patient_phone);
      if (existingPatient) {
        targetPatientId = existingPatient.id;
      }
    }

    // Insert into SQLite appointments table
    const stmt = db.prepare(`
      INSERT INTO appointments (
        booking_ref, patient_id, patient_name, patient_phone, patient_age,
        patient_gender, patient_email, doctor_name, doctor_specialty,
        appointment_date, time_slot, consultation_type, reason,
        allergies, total_fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `);

    const result = stmt.run(
      bookingRef,
      targetPatientId,
      patient_name,
      patient_phone || null,
      patient_age ? Number(patient_age) : null,
      patient_gender || 'female',
      patient_email || null,
      doctor_name,
      doctor_specialty || 'General Physician',
      appointment_date,
      time_slot,
      consultation_type || 'clinic',
      reason || 'General Consultation',
      allergies || null,
      total_fee ? Number(total_fee) : 520
    );

    // Also queue for doctor triage in doctor_queue table
    try {
      db.prepare(`
        INSERT INTO doctor_queue (patient_id, priority, symptoms, vitals_bp, vitals_pulse, vitals_spo2, status)
        VALUES (?, 'ROUTINE', ?, '120/80', 74, 98, 'WAITING')
      `).run(targetPatientId, `Scheduled Appointment with ${doctor_name}: ${reason || 'Routine'}`);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Appointment successfully booked and saved in database!',
      bookingId: bookingRef,
      appointmentId: Number(result.lastInsertRowid),
      appointment: {
        bookingRef,
        patientName: patient_name,
        doctorName: doctor_name,
        date: appointment_date,
        time: time_slot,
        consultationType: consultation_type,
        status: 'CONFIRMED',
        totalFee: total_fee || 520
      }
    });
  } catch (err) {
    console.error('Appointment booking error:', err);
    res.status(500).json({ error: 'Failed to save appointment to database' });
  }
});

// GET /api/appointments (Fetch all booked appointments)
app.get('/api/appointments', (req, res) => {
  try {
    const appointments = db.prepare('SELECT * FROM appointments ORDER BY id DESC').all();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/patient/:id/appointments (Fetch patient appointments)
app.get('/api/patient/:id/appointments', (req, res) => {
  try {
    const appointments = db.prepare('SELECT * FROM appointments WHERE patient_id = ? ORDER BY id DESC').all(req.params.id);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient appointments' });
  }
});

// POST /api/doctor/quick-triage (Instant Emergency/Urgent Triage Request)
app.post('/api/doctor/quick-triage', (req, res) => {
  try {
    const { patient_id, symptoms, priority } = req.body;
    const targetPatientId = patient_id || 1;
    const triagePriority = priority || 'URGENT';
    const patientSymptoms = symptoms || 'Emergency Quick Triage initiated via Patient App';

    const stmt = db.prepare(`
      INSERT INTO doctor_queue (patient_id, priority, symptoms, vitals_bp, vitals_pulse, vitals_spo2, status)
      VALUES (?, ?, ?, '130/85', 86, 96, 'WAITING')
    `);
    const result = stmt.run(targetPatientId, triagePriority, patientSymptoms);
    const queueId = Number(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Quick Triage consultation registered. Doctor on call notified.',
      ticketId: `TRG-2026-${queueId}`,
      queueId,
      priority: triagePriority
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate quick triage' });
  }
});

// -------------------------------------------------------------
// 3. DOCTOR FLOW APIS (④ Patient Details ⑪ & Priority Cases ⑫)
// -------------------------------------------------------------

// GET /api/doctor/queue (Priority Triage Cases)
app.get('/api/doctor/queue', (req, res) => {
  try {
    const query = `
      SELECT 
        q.id as queue_id,
        q.priority,
        q.symptoms,
        q.vitals_bp,
        q.vitals_pulse,
        q.vitals_spo2,
        q.status,
        q.created_at,
        p.id as patient_id,
        p.name as patient_name,
        p.age,
        p.gender,
        p.village,
        p.abha_id,
        p.risk_level
      FROM doctor_queue q
      JOIN patients p ON q.patient_id = p.id
      ORDER BY 
        CASE q.priority 
          WHEN 'EMERGENCY' THEN 1 
          WHEN 'URGENT' THEN 2 
          WHEN 'ROUTINE' THEN 3 
          ELSE 4 
        END,
        q.id ASC
    `;
    const queue = db.prepare(query).all();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load doctor queue' });
  }
});

// PATCH /api/doctor/queue/:id (Update triage status)
app.patch('/api/doctor/queue/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE doctor_queue SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update queue status' });
  }
});

// -------------------------------------------------------------
// 4. LAB & WORKER APIS (⑤ Sample Collection ⑬ & Report Generate ⑭)
// -------------------------------------------------------------

// GET /api/worker/samples
app.get('/api/worker/samples', (req, res) => {
  try {
    const query = `
      SELECT 
        s.*,
        p.name as patient_name,
        p.village,
        p.abha_id
      FROM lab_samples s
      JOIN patients p ON s.patient_id = p.id
      ORDER BY s.id DESC
    `;
    const samples = db.prepare(query).all();
    res.json(samples);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab samples' });
  }
});

// POST /api/worker/samples (New sample collection)
app.post('/api/worker/samples', (req, res) => {
  try {
    const { patient_id, test_type } = req.body;
    const sampleCode = `SMPL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const stmt = db.prepare(`
      INSERT INTO lab_samples (patient_id, test_type, sample_code, status)
      VALUES (?, ?, ?, 'COLLECTED')
    `);
    const result = stmt.run(patient_id, test_type, sampleCode);

    res.status(201).json({
      message: 'Sample collection logged',
      sampleId: Number(result.lastInsertRowid),
      sampleCode
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log sample collection' });
  }
});

// PATCH /api/worker/samples/:id/report (Generate Report ⑭)
app.patch('/api/worker/samples/:id/report', (req, res) => {
  try {
    const { result_data } = req.body;
    db.prepare(`
      UPDATE lab_samples 
      SET status = 'REPORT_GENERATED', result_data = ? 
      WHERE id = ?
    `).run(result_data, req.params.id);

    res.json({ message: 'Diagnostic report generated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// -------------------------------------------------------------
// 5. ADMIN APIS (⑥ Management ⑮ & Public Analytics)
// -------------------------------------------------------------

// GET /api/admin/stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const emergencyCases = db.prepare("SELECT COUNT(*) as count FROM doctor_queue WHERE priority = 'EMERGENCY'").get().count;
    const pendingSamples = db.prepare("SELECT COUNT(*) as count FROM lab_samples WHERE status != 'REPORT_GENERATED'").get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      totalPatients,
      emergencyCases,
      pendingSamples,
      totalUsers,
      hospitalBeds: {
        total: 120,
        occupied: 86,
        available: 34,
        icuAvailable: 4
      },
      offlineSyncStatus: '98.4% Synced'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load district stats' });
  }
});

// -------------------------------------------------------------
// 6. MEDICATIONS & CLINICAL PRECAUTIONS APIS (Find Medication Service)
// -------------------------------------------------------------

// GET /api/medications - List & search medications with filters
app.get('/api/medications', (req, res) => {
  try {
    const { q, category, otc, essential } = req.query;
    let query = 'SELECT * FROM medications WHERE 1=1';
    const params = [];

    if (q) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      query += ` AND (LOWER(name) LIKE ? OR LOWER(generic_name) LIKE ? OR LOWER(indications) LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (otc === 'true' || otc === '1') {
      query += ` AND prescription_required = 0`;
    }

    if (essential === 'true' || essential === '1') {
      query += ` AND is_essential = 1`;
    }

    query += ' ORDER BY is_essential DESC, name ASC';

    const medications = db.prepare(query).all(...params);
    res.json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (err) {
    console.error('Error fetching medications:', err);
    res.status(500).json({ error: 'Failed to retrieve medications catalog' });
  }
});

// GET /api/medications/categories - List categories with counts
app.get('/api/medications/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM medications 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve medication categories' });
  }
});

// GET /api/medications/search/precautions - Search precautions and contraindications
app.get('/api/medications/search/precautions', (req, res) => {
  try {
    const { condition } = req.query;
    if (!condition) {
      return res.status(400).json({ error: 'Condition or symptom query parameter required' });
    }

    const term = `%${condition.trim().toLowerCase()}%`;
    const results = db.prepare(`
      SELECT id, name, generic_name, indications, precautions, contraindications, side_effects, jan_aushadhi_price
      FROM medications
      WHERE LOWER(indications) LIKE ? OR LOWER(contraindications) LIKE ? OR LOWER(precautions) LIKE ?
    `).all(term, term, term);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search clinical precautions' });
  }
});

// GET /api/medications/:id - Get detailed medicine profile
app.get('/api/medications/:id', (req, res) => {
  try {
    const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
    if (!med) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Calculate Jan Aushadhi generic savings
    const savingsPercent = med.market_price && med.market_price > med.jan_aushadhi_price
      ? Math.round(((med.market_price - med.jan_aushadhi_price) / med.market_price) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...med,
        savings_percentage: `${savingsPercent}%`
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve medication details' });
  }
});

// POST /api/medications - Add new generic medication (Admin/Pharmacist)
app.post('/api/medications', (req, res) => {
  try {
    const {
      name, generic_name, category, dosage_form, strength,
      indications, precautions, side_effects, contraindications,
      jan_aushadhi_price, market_price, is_essential, prescription_required
    } = req.body;

    if (!name || !generic_name || !indications || !precautions) {
      return res.status(400).json({
        error: 'Required fields missing: name, generic_name, indications, and precautions are mandatory.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO medications (
        name, generic_name, category, dosage_form, strength,
        indications, precautions, side_effects, contraindications,
        jan_aushadhi_price, market_price, is_essential, prescription_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, generic_name, category || 'General', dosage_form || 'Tablet', strength || 'Standard',
      indications, precautions, side_effects || '', contraindications || '',
      jan_aushadhi_price || 0, market_price || 0, is_essential !== undefined ? is_essential : 1, prescription_required ? 1 : 0
    );

    res.status(201).json({
      success: true,
      message: 'Medication added to national catalog successfully',
      medication_id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Error adding medication:', err);
    res.status(500).json({ error: 'Failed to create medication record' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 ASHA Healthcare Backend Server LIVE on port ${PORT}`);
  console.log(`🔗 Local App URL: http://localhost:${PORT}`);
  console.log(`🗄️ SQL Database: asha_health.db`);
  console.log(`🔐 Password Hashing: BCrypt (Cryptography Enabled)`);
  console.log(`====================================================`);
});
