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

  -- Appointments Table (Online & In-Clinic Bookings)
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref TEXT UNIQUE NOT NULL,
    patient_id INTEGER,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_age INTEGER,
    patient_gender TEXT,
    patient_email TEXT,
    doctor_name TEXT NOT NULL,
    doctor_specialty TEXT,
    appointment_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    consultation_type TEXT NOT NULL,
    reason TEXT,
    allergies TEXT,
    total_fee REAL DEFAULT 520,
    status TEXT DEFAULT 'CONFIRMED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL
  );

  -- Medications & Clinical Precautions Catalog
  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    category TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    strength TEXT NOT NULL,
    indications TEXT NOT NULL,
    precautions TEXT NOT NULL,
    side_effects TEXT,
    contraindications TEXT,
    jan_aushadhi_price REAL,
    market_price REAL,
    is_essential BOOLEAN DEFAULT 1,
    prescription_required BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  console.log('Database users & clinical queues initialized.');
}

// Seed Essential Medications & Precautions Catalog if empty
const medCountStmt = db.prepare('SELECT COUNT(*) as count FROM medications');
if (medCountStmt.get().count === 0) {
  console.log('Seeding Essential Generic Medications & Clinical Precautions Catalog...');
  const insertMed = db.prepare(`
    INSERT INTO medications (
      name, generic_name, category, dosage_form, strength,
      indications, precautions, side_effects, contraindications,
      jan_aushadhi_price, market_price, is_essential, prescription_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const essentialMedicines = [
    {
      name: 'Paracetamol (Dolo / Crocin Generic)',
      generic_name: 'Paracetamol / Acetaminophen',
      category: 'Analgesic & Antipyretic',
      dosage_form: 'Tablet',
      strength: '650mg',
      indications: 'Fever, mild to moderate body pain, headache, post-vaccination fever',
      precautions: 'Do not exceed 4000mg in 24 hours. Avoid alcohol consumption. Maintain minimum 4-6 hours interval between doses.',
      side_effects: 'Nausea, allergic skin rash, liver toxicity in case of severe overdose.',
      contraindications: 'Severe hepatic impairment, acute liver failure, hypersensitivity to paracetamol.',
      jan_price: 12.50,
      mkt_price: 34.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Amoxicillin + Potassium Clavulanate (Augmentin Generic)',
      generic_name: 'Amoxicillin + Clavulanic Acid',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '625mg',
      indications: 'Bacterial respiratory infections, pneumonia, acute otitis media, skin and soft tissue infections',
      precautions: 'Complete the entire 5 to 7 day course even if symptoms resolve. Take at the start of a meal to minimize GI upset.',
      side_effects: 'Diarrhea, nausea, vomiting, candidiasis (fungal infection).',
      contraindications: 'History of penicillin or beta-lactam anaphylaxis, past amoxicillin-associated jaundice.',
      jan_price: 52.00,
      mkt_price: 210.00,
      essential: 1,
      rx_req: 1
    },
    {
      name: 'Azithromycin (Azee Generic)',
      generic_name: 'Azithromycin',
      category: 'Macrolide Antibiotic',
      dosage_form: 'Tablet',
      strength: '500mg',
      indications: 'Community-acquired pneumonia, acute bacterial sinusitis, tonsillitis, typhoid fever',
      precautions: 'Take 1 hour before or 2 hours after meals. Do not take antacids containing aluminum or magnesium simultaneously.',
      side_effects: 'Abdominal cramping, loose stools, temporary taste disturbance, dizziness.',
      contraindications: 'Known macrolide allergy, severe hepatic disease, QT interval prolongation.',
      jan_price: 42.00,
      mkt_price: 135.00,
      essential: 1,
      rx_req: 1
    },
    {
      name: 'Oral Rehydration Salts (WHO Formula ORS)',
      generic_name: 'Sodium Chloride, Potassium Chloride, Sodium Citrate, Dextrose',
      category: 'Electrolytes & Rehydration',
      dosage_form: 'Powder Sachet',
      strength: '20.5g for 1 Liter',
      indications: 'Acute diarrhea, dehydration, heat stroke, cholera, gastroenteritis in children and adults',
      precautions: 'Mix exactly with 1 Liter of clean drinking water. Do not boil prepared solution. Discard leftover solution after 24 hours.',
      side_effects: 'Mild nausea if consumed too rapidly.',
      contraindications: 'Intestinal perforation, persistent severe vomiting with inability to swallow, acute renal anuria.',
      jan_price: 5.50,
      mkt_price: 24.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Metformin Hydrochloride (Glycomet Generic)',
      generic_name: 'Metformin HCl',
      category: 'Antidiabetic',
      dosage_form: 'Sustained Release Tablet',
      strength: '500mg',
      indications: 'Type 2 Diabetes Mellitus glycemic control, insulin resistance management',
      precautions: 'Take with or immediately after meals to prevent gastric irritation. Monitor renal function and HbA1c periodically.',
      side_effects: 'Metallic taste, flatulence, nausea, diarrhea in early weeks.',
      contraindications: 'Severe renal failure (eGFR < 30 mL/min), metabolic or lactic acidosis, severe hypoxemia.',
      jan_price: 8.00,
      mkt_price: 48.00,
      essential: 1,
      rx_req: 1
    },
    {
      name: 'Amlodipine Besylate (Norvasc Generic)',
      generic_name: 'Amlodipine',
      category: 'Antihypertensive',
      dosage_form: 'Tablet',
      strength: '5mg',
      indications: 'Essential hypertension, chronic stable angina, coronary artery disease',
      precautions: 'Take regularly at the same time each day. Do not discontinue abruptly. Monitor blood pressure weekly.',
      side_effects: 'Peripheral edema (ankle swelling), flushing, dizziness, fatigue.',
      contraindications: 'Severe hypotension, cardiogenic shock, severe aortic stenosis.',
      jan_price: 6.50,
      mkt_price: 36.00,
      essential: 1,
      rx_req: 1
    },
    {
      name: 'Pantoprazole Gastro-Resistant (Pan-40 Generic)',
      generic_name: 'Pantoprazole Sodium',
      category: 'Gastrointestinal / Antacid',
      dosage_form: 'Enteric Coated Tablet',
      strength: '40mg',
      indications: 'Gastroesophageal Reflux Disease (GERD), peptic ulcers, acid reflux, gastritis, NSAID-induced gastric prophylaxis',
      precautions: 'Swallow whole with water 30-60 minutes before breakfast. Do not crush or chew tablets.',
      side_effects: 'Headache, dry mouth, mild abdominal pain, long-term B12/magnesium deficiency.',
      contraindications: 'Hypersensitivity to substituted benzimidazoles.',
      jan_price: 14.00,
      mkt_price: 85.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Cetirizine Hydrochloride (Cetzine Generic)',
      generic_name: 'Cetirizine HCl',
      category: 'Antihistamine / Anti-Allergy',
      dosage_form: 'Tablet',
      strength: '10mg',
      indications: 'Allergic rhinitis, seasonal allergies, urticaria (hives), pruritus, insect bite itching',
      precautions: 'May cause mild drowsiness; avoid driving or operating heavy machinery. Take preferably at bedtime.',
      side_effects: 'Somnolence, dry mouth, fatigue, pharyngitis.',
      contraindications: 'Severe end-stage renal disease, allergy to hydroxyzine/cetirizine.',
      jan_price: 4.80,
      mkt_price: 26.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Iron & Folic Acid (National Anaemia Mukt Bharat Formula)',
      generic_name: 'Ferrous Sulfate + Folic Acid',
      category: 'Maternal & Nutritional',
      dosage_form: 'Sugar Coated Tablet',
      strength: '100mg Elemental Iron + 500mcg Folic Acid',
      indications: 'Prophylaxis and treatment of nutritional anemia in pregnancy, lactation, and adolescent girls',
      precautions: 'Do not take with tea, coffee, or milk (reduces absorption). Stools may turn black (normal and harmless).',
      side_effects: 'Constipation, dark stools, gastric irritation, mild metallic taste.',
      contraindications: 'Hemochromatosis, hemosiderosis, active peptic ulceration, hemolytic anemia.',
      jan_price: 9.50,
      mkt_price: 65.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Albendazole (Zentel Generic)',
      generic_name: 'Albendazole',
      category: 'Anthelmintic / Deworming',
      dosage_form: 'Chewable Tablet',
      strength: '400mg',
      indications: 'Intestinal worm infections, roundworm, hookworm, whipworm, tapeworm infestations',
      precautions: 'Chew thoroughly before swallowing. Best taken with fatty food to enhance absorption. Routine bi-annual deworming.',
      side_effects: 'Transient stomach ache, headache, mild nausea.',
      contraindications: 'Pregnancy (especially 1st trimester), known albendazole allergy.',
      jan_price: 5.00,
      mkt_price: 25.00,
      essential: 1,
      rx_req: 0
    },
    {
      name: 'Salbutamol Metered Dose Inhaler (Asthalin Generic)',
      generic_name: 'Salbutamol / Albuterol Sulfate',
      category: 'Respiratory / Bronchodilator',
      dosage_form: 'Inhalation Aerosol',
      strength: '100mcg per puff (200 doses)',
      indications: 'Acute bronchospasm, asthma attacks, Chronic Obstructive Pulmonary Disease (COPD) wheezing',
      precautions: 'Rinse mouth after use. Shake canister well. If symptoms persist after 2-4 puffs, seek emergency care immediately.',
      side_effects: 'Fine tremors in hands, palpitations, mild tachycardia, headache.',
      contraindications: 'Known hypersensitivity to salbutamol.',
      jan_price: 68.00,
      mkt_price: 185.00,
      essential: 1,
      rx_req: 1
    },
    {
      name: 'Ibuprofen + Paracetamol (Combiflam Generic)',
      generic_name: 'Ibuprofen 400mg + Paracetamol 325mg',
      category: 'NSAID / Analgesic',
      dosage_form: 'Tablet',
      strength: '400mg / 325mg',
      indications: 'Dental pain, joint arthritis flare-up, muscular pain, postoperative inflammation',
      precautions: 'Always take after food. Do not use in patients with active stomach ulcers or severe asthma.',
      side_effects: 'Heartburn, nausea, epigastric distress, fluid retention.',
      contraindications: 'Active gastrointestinal ulceration/bleeding, severe renal impairment, 3rd trimester pregnancy.',
      jan_price: 11.00,
      mkt_price: 45.00,
      essential: 1,
      rx_req: 0
    }
  ];

  for (const med of essentialMedicines) {
    insertMed.run(
      med.name, med.generic_name, med.category, med.dosage_form, med.strength,
      med.indications, med.precautions, med.side_effects, med.contraindications,
      med.jan_price, med.mkt_price, med.essential, med.rx_req
    );
  }
  console.log(`Successfully seeded ${essentialMedicines.length} essential generic medicines into catalog!`);
}

module.exports = db;

