const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

// Initialize SQLite database file in the project root
const dbPath = path.join(__dirname, '..', 'asha_health.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys
db.exec('PRAGMA foreign_keys = ON;');

// 1. Create SQL Tables
db.exec(`
  -- Users Table (with cryptographic password hash)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('PATIENT', 'DOCTOR', 'WORKER', 'ADMIN')),
    phone TEXT,
    abha_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Patients Table
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    abha_id TEXT UNIQUE,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    village TEXT,
    risk_level TEXT CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
    primary_condition TEXT,
    contact_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Doctor Queue / Priority Triage Cases
  CREATE TABLE IF NOT EXISTS doctor_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    priority TEXT CHECK(priority IN ('ROUTINE', 'URGENT', 'EMERGENCY')) DEFAULT 'ROUTINE',
    symptoms TEXT,
    vitals_bp TEXT,
    vitals_pulse INTEGER,
    vitals_spo2 INTEGER,
    status TEXT CHECK(status IN ('WAITING', 'IN_CONSULTATION', 'COMPLETED')) DEFAULT 'WAITING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  -- Lab Samples / Collection Page
  CREATE TABLE IF NOT EXISTS lab_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    sample_code TEXT UNIQUE,
    collection_date DATE DEFAULT (DATE('now')),
    status TEXT CHECK(status IN ('PENDING', 'COLLECTED', 'PROCESSING', 'REPORT_GENERATED')) DEFAULT 'COLLECTED',
    result_data TEXT,
    synced_offline BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  -- Prescriptions / Medicine
  CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
`);

// 2. Seed Default Demo Users with Cryptographic Password Hashing (BCrypt)
const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
const userCount = userCountStmt.get().count;

if (userCount === 0) {
  console.log('Seeding initial healthcare demo users with BCrypt password hashing...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, abha_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const saltRounds = 10;
  const patientHash = bcrypt.hashSync('patient123', saltRounds);
  const doctorHash = bcrypt.hashSync('doctor123', saltRounds);
  const workerHash = bcrypt.hashSync('worker123', saltRounds);
  const adminHash = bcrypt.hashSync('admin123', saltRounds);

  insertUser.run('Priya Sharma', 'patient@asha.org', patientHash, 'PATIENT', '+91 9876543210', 'ABHA-9821-4321-0012');
  insertUser.run('Dr. Rajesh Verma', 'doctor@asha.org', doctorHash, 'DOCTOR', '+91 9876543211', null);
  insertUser.run('Anita Devi (ASHA)', 'worker@asha.org', workerHash, 'WORKER', '+91 9876543212', null);
  insertUser.run('District CMO Officer', 'admin@asha.org', adminHash, 'ADMIN', '+91 9876543213', null);

  // Seed sample patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (user_id, abha_id, name, age, gender, village, risk_level, primary_condition, contact_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPatient.run(1, 'ABHA-9821-4321-0012', 'Priya Sharma', 28, 'Female', 'Kalyanpur', 'MEDIUM', 'Maternal Health - 3rd Trimester', '+91 9876543210');
  insertPatient.run(null, 'ABHA-3341-8921-9988', 'Ramesh Kumar', 54, 'Male', 'Sector 4', 'HIGH', 'Severe Fever & Acute Bronchitis', '+91 9811223344');
  insertPatient.run(null, 'ABHA-7711-2244-1100', 'Sunita Devi', 31, 'Female', 'Sector 2', 'LOW', 'Routine ANC Checkup', '+91 9822334455');
  insertPatient.run(null, 'ABHA-5522-1144-8833', 'Aarav Patel', 8, 'Male', 'Rampur', 'CRITICAL', 'Severe Dehydration & SpO2 Drop', '+91 9833445566');

  // Seed Doctor Queue (Priority Triage Cases ⑪ ⑫)
  const insertQueue = db.prepare(`
    INSERT INTO doctor_queue (patient_id, priority, symptoms, vitals_bp, vitals_pulse, vitals_spo2, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertQueue.run(4, 'EMERGENCY', 'Persistent fever (4 days), dyspnea, lethargy', '90/60', 128, 88, 'WAITING');
  insertQueue.run(2, 'URGENT', 'High fever 102F, severe productive cough', '135/88', 96, 94, 'WAITING');
  insertQueue.run(1, 'ROUTINE', 'Third trimester maternal vitals and iron level check', '118/76', 78, 98, 'WAITING');
  insertQueue.run(3, 'ROUTINE', 'General ANC checkup and calcium replenishment', '120/80', 72, 99, 'WAITING');

  // Seed Lab Samples (⑬ ⑭)
  const insertSample = db.prepare(`
    INSERT INTO lab_samples (patient_id, test_type, sample_code, status, result_data)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSample.run(2, 'Malaria & Dengue Rapid Serology', 'SMPL-2026-0901', 'REPORT_GENERATED', 'Negative for Malaria; Dengue NS1 Positive (Mild)');
  insertSample.run(4, 'Electrolyte Panel & CBC', 'SMPL-2026-0902', 'PROCESSING', 'In transit to District Pathology Lab');
  insertSample.run(1, 'Hemoglobin & Gestational Glucose', 'SMPL-2026-0903', 'COLLECTED', 'Sample packaged with cold chain storage');

  // Seed Prescriptions (⑩)
  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (patient_id, medicine_name, dosage, frequency, duration, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPrescription.run(1, 'Iron Folic Acid (IFA)', '100mg', '1 tablet daily after food', '30 days', 'ACTIVE');
  insertPrescription.run(1, 'Calcium Carbonate', '500mg', '1 tablet twice daily', '30 days', 'ACTIVE');
  insertPrescription.run(2, 'Paracetamol', '650mg', 'SOS (Every 6 hours if fever > 100F)', '5 days', 'ACTIVE');

  console.log('Database initialized and demo data seeded successfully!');
}

module.exports = db;
