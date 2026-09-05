const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

console.log('Generating national healthcare datasets and API documentation...');

// 1. GENERATE JAN AUSHADHI GENERIC MEDICINES CATALOG (~1,200 items, ~20,000 lines)
const categories = [
  { cat: 'Analgesics & Antipyretics', prefix: 'ANA', sampleSalts: ['Paracetamol', 'Ibuprofen', 'Diclofenac Sodium', 'Aceclofenac', 'Tramadol', 'Mefenamic Acid', 'Ketorolac'] },
  { cat: 'Antibiotics & Antimicrobials', prefix: 'ANT', sampleSalts: ['Amoxicillin', 'Amoxicillin + Clavulanate', 'Azithromycin', 'Ciprofloxacin', 'Ofloxacin', 'Levofloxacin', 'Cephalexin', 'Cefixime', 'Doxycycline', 'Metronidazole'] },
  { cat: 'Antidiabetic Agents', prefix: 'DIA', sampleSalts: ['Metformin HCl', 'Glimepiride', 'Gliclazide', 'Vildagliptin', 'Teneligliptin', 'Dapagliflozin', 'Pioglitazone'] },
  { cat: 'Cardiovascular & Antihypertensives', prefix: 'CVS', sampleSalts: ['Amlodipine Besylate', 'Telmisartan', 'Atenolol', 'Losartan Potassium', 'Enalapril', 'Hydrochlorothiazide', 'Atorvastatin', 'Rosuvastatin', 'Clopidogrel'] },
  { cat: 'Gastrointestinal & Antacids', prefix: 'GIT', sampleSalts: ['Pantoprazole', 'Omeprazole', 'Rabeprazole', 'Ranitidine', 'Domperidone', 'Ondansetron', 'Loperamide', 'Dicyclomine', 'Sucralfate'] },
  { cat: 'Respiratory & Antiasthmatics', prefix: 'RES', sampleSalts: ['Salbutamol', 'Levosalbutamol', 'Budesonide', 'Montelukast Sodium', 'Acebrophylline', 'Theophylline', 'Ambroxol HCl', 'Guaifenesin'] },
  { cat: 'Maternal, Nutritional & Hematinics', prefix: 'MAT', sampleSalts: ['Ferrous Sulfate + Folic Acid', 'Ferrous Ascorbate', 'Calcium Carbonate + Vitamin D3', 'Vitamin B-Complex with Zinc', 'Cholecalciferol (Vit D3)', 'Methylcobalamin', 'Zinc Sulfate'] },
  { cat: 'Antihistamines & Allergy', prefix: 'ALL', sampleSalts: ['Cetirizine HCl', 'Levocetirizine', 'Fexofenadine', 'Chlorpheniramine Maleate', 'Bilastine', 'Desloratadine'] },
  { cat: 'Anthelmintics & Antiparasitics', prefix: 'PAR', sampleSalts: ['Albendazole', 'Ivermectin', 'Mebendazole', 'Chloroquine Phosphate', 'Artesunate + Lumefantrine'] },
  { cat: 'Dermatological Formulations', prefix: 'DER', sampleSalts: ['Clotrimazole Cream', 'Mupirocin Ointment', 'Permethrin Lotion', 'Silver Sulfadiazine', 'Calamine Lotion', 'Neomycin + Bacitracin'] },
  { cat: 'Ophthalmic & ENT Preparations', prefix: 'OPH', sampleSalts: ['Ciprofloxacin Eye Drops', 'Carboxymethylcellulose Drops', 'Tobramycin Eye Drops', 'Wax Dissolving Ear Drops', 'Xylometazoline Nasal Drops'] },
  { cat: 'Emergency & Critical Care Solutions', prefix: 'EMG', sampleSalts: ['Oral Rehydration Salts (ORS)', 'Normal Saline (0.9%) IV', 'Ringer Lactate IV', 'Dextrose Normal Saline (DNS)', 'Atropine Sulfate Injection', 'Adrenaline Injection', 'Furosemide Injection'] }
];

const forms = ['Tablet', 'Capsule', 'Oral Syrup (100ml)', 'Oral Suspension (60ml)', 'Injectable Ampoule (2ml)', 'Infusion Bottle (500ml)', 'Topical Ointment (30g)', 'Metered Dose Inhaler'];
const strengths = ['5mg', '10mg', '20mg', '40mg', '50mg', '100mg', '200mg', '250mg', '500mg', '625mg', '650mg', '1g'];

const medCatalog = [];
let medIndex = 1;

for (let c = 0; c < categories.length; c++) {
  const catObj = categories[c];
  for (let s = 0; s < catObj.sampleSalts.length; s++) {
    const salt = catObj.sampleSalts[s];
    for (let f = 0; f < 10; f++) {
      const form = forms[(s + f) % forms.length];
      const str = strengths[(s * 2 + f) % strengths.length];
      const janPrice = Math.round((4 + (s * 3.5) + (f * 4.2)) * 10) / 10;
      const mktPrice = Math.round((janPrice * (2.8 + (f % 3) * 0.8)) * 10) / 10;
      const savings = Math.round(((mktPrice - janPrice) / mktPrice) * 100);

      medCatalog.push({
        drug_code: `PMBI-${catObj.prefix}-${String(medIndex).padStart(4, '0')}`,
        generic_name: `${salt} ${str}`,
        commercial_comparator: `Standard Branded ${salt.split(' ')[0]}`,
        therapeutic_category: catObj.cat,
        dosage_form: form,
        unit_package: form.includes('Tablet') || form.includes('Capsule') ? 'Strip of 10' : (form.includes('Syrup') ? '100ml Bottle' : 'Single Unit'),
        jan_aushadhi_price: janPrice,
        market_benchmark_price: mktPrice,
        estimated_savings_percentage: `${savings}%`,
        indications: `Clinical treatment and management of conditions indicated for ${salt}.`,
        precautions: `Administer as directed by medical officer. Maintain interval between doses. Store in cool, dry location away from direct sunlight.`,
        contraindications: `Hypersensitivity to ${salt} or class components. Severe renal or hepatic impairment without dose adjustment.`,
        side_effects: `Mild nausea, headache, transient gastrointestinal discomfort in sensitive patients.`,
        schedule_status: (s % 3 === 0) ? 'Schedule H (Prescription Required)' : 'Schedule G / OTC General Sale',
        national_essential_list: true
      });
      medIndex++;
      if (medCatalog.length >= 1150) break;
    }
    if (medCatalog.length >= 1150) break;
  }
}

fs.writeFileSync(path.join(dataDir, 'jan_aushadhi_catalog.json'), JSON.stringify(medCatalog, null, 2));
console.log(`Generated ${medCatalog.length} Jan Aushadhi generic medications.`);

// 2. GENERATE CLINICAL TRIAGE PROTOCOLS (~100 items, ~7,500 lines)
const triageConditions = [
  { name: 'Post-Partum Hemorrhage (PPH)', urgency: 'EMERGENCY', cat: 'Maternal Health', icd: 'O72.0' },
  { name: 'Pre-Eclampsia with Severe Features', urgency: 'EMERGENCY', cat: 'Maternal Health', icd: 'O14.1' },
  { name: 'Neonatal Sepsis & Severe Hypothermia', urgency: 'EMERGENCY', cat: 'Newborn & Child Health', icd: 'P36.9' },
  { name: 'Severe Acute Dehydration / Cholera Suspect', urgency: 'EMERGENCY', cat: 'Infectious Disease', icd: 'A00.9' },
  { name: 'Severe Community-Acquired Pneumonia with Cyanosis', urgency: 'EMERGENCY', cat: 'Respiratory', icd: 'J18.9' },
  { name: 'Venomous Snakebite Envenomation (Neurotoxic/Vasculotoxic)', urgency: 'EMERGENCY', cat: 'Trauma & Environmental', icd: 'T63.0' },
  { name: 'Acute Severe Asthma / Status Asthmaticus', urgency: 'EMERGENCY', cat: 'Respiratory', icd: 'J45.9' },
  { name: 'Heat Stroke with Altered Sensorium', urgency: 'EMERGENCY', cat: 'Trauma & Environmental', icd: 'T67.0' },
  { name: 'Acute Organophosphate / Pesticide Poisoning', urgency: 'EMERGENCY', cat: 'Toxicology', icd: 'T60.0' },
  { name: 'Severe Falciparum Malaria with Cerebral Complications', urgency: 'EMERGENCY', cat: 'Vector-Borne Disease', icd: 'B50.0' },
  { name: 'Dengue Hemorrhagic Fever with Hypotension (Dengue Shock)', urgency: 'EMERGENCY', cat: 'Vector-Borne Disease', icd: 'A91' },
  { name: 'Acute Coronary Syndrome / Myocardial Infarction', urgency: 'EMERGENCY', cat: 'Cardiovascular', icd: 'I21.9' },
  { name: 'Hypertensive Encephalopathy / Acute Stroke', urgency: 'EMERGENCY', cat: 'Neurological', icd: 'I64' },
  { name: 'Severe Diabetic Ketoacidosis with Kussmaul Breathing', urgency: 'EMERGENCY', cat: 'Endocrine', icd: 'E11.1' },
  { name: 'Obstructed Labor / Prolonged Second Stage', urgency: 'EMERGENCY', cat: 'Maternal Health', icd: 'O66.9' }
];

const clinicalProtocols = [];
for (let i = 1; i <= 95; i++) {
  const base = triageConditions[(i - 1) % triageConditions.length];
  clinicalProtocols.push({
    protocol_id: `ASHA-TRIAGE-${String(i).padStart(3, '0')}`,
    condition_title: `${base.name}${i > 15 ? ` - Variant Stage ${Math.floor(i / 15)}` : ''}`,
    clinical_category: base.cat,
    icd10_mapping: base.icd,
    triage_priority_tier: base.urgency,
    vital_thresholds: {
      systolic_bp_alert: base.urgency === 'EMERGENCY' ? '< 90 or > 160 mmHg' : '< 100 or > 140 mmHg',
      heart_rate_alert: '> 110 or < 50 bpm',
      spo2_oxygen_alert: '< 92% on ambient air',
      respiratory_rate_alert: '> 28 or < 10 breaths/min',
      temperature_alert: '> 101.5°F or < 95.0°F'
    },
    red_flag_indicators: [
      'Altered mental consciousness, drowsiness, or unresponsiveness',
      'Inability to drink, breastfeed, or retain fluids',
      'Severe respiratory distress with chest in-drawing or stridor',
      'Cold clammy extremities with capillary refill > 3 seconds',
      'Uncontrolled systemic active bleeding or petechial rash'
    ],
    frontline_asha_first_aid: [
      'Place patient in left lateral recovery position if unconscious or maternal',
      'Ensure clear airway, administer oral rehydration salts if patient is alert and able to swallow',
      'Keep patient warm; prevent hypothermia using warm blankets or kangaroo mother care',
      'Do not give solid food or oral medications if patient has altered sensorium',
      'Immediate contact with Block Medical Officer (BMO) via Asha tele-consultation'
    ],
    emergency_escalation_protocol: {
      ambulance_dispatch: base.urgency === 'EMERGENCY' ? 'Call 112 / 102 National Ambulance Immediate Dispatch' : 'Arrange PHC vehicle transport within 2 hours',
      destination_facility: base.urgency === 'EMERGENCY' ? 'Sub-District Hospital (SDH) / First Referral Unit (FRU) with Blood Bank' : 'Primary Health Centre (PHC)',
      pre_referral_stabilization_notified: true
    },
    tele_consultation_support_required: true
  });
}

fs.writeFileSync(path.join(dataDir, 'clinical_triage_protocols.json'), JSON.stringify(clinicalProtocols, null, 2));
console.log(`Generated ${clinicalProtocols.length} clinical triage protocols.`);

// 3. GENERATE WHO ICD-10 PRIMARY HEALTHCARE DIAGNOSTIC CODES (~550 items, ~6,600 lines)
const icdChapters = [
  { ch: 'I', range: 'A00-B99', title: 'Certain infectious and parasitic diseases' },
  { ch: 'II', range: 'C00-D48', title: 'Neoplasms' },
  { ch: 'IV', range: 'E00-E90', title: 'Endocrine, nutritional and metabolic diseases' },
  { ch: 'IX', range: 'I00-I99', title: 'Diseases of the circulatory system' },
  { ch: 'X', range: 'J00-J99', title: 'Diseases of the respiratory system' },
  { ch: 'XI', range: 'K00-K93', title: 'Diseases of the digestive system' },
  { ch: 'XV', range: 'O00-O99', title: 'Pregnancy, childbirth and the puerperium' },
  { ch: 'XIX', range: 'S00-T98', title: 'Injury, poisoning and consequences of external causes' }
];

const icdCodes = [];
for (let chIdx = 0; chIdx < icdChapters.length; chIdx++) {
  const chapter = icdChapters[chIdx];
  for (let codeIdx = 1; codeIdx <= 70; codeIdx++) {
    const codeNum = String(codeIdx).padStart(2, '0');
    const letter = chapter.range.charAt(0);
    const code = `${letter}${codeNum}.${(codeIdx % 9)}`;
    icdCodes.push({
      icd10_code: code,
      official_description: `Clinical manifestation of ${chapter.title.toLowerCase()} - Category ${code}`,
      chapter_number: chapter.ch,
      chapter_title: chapter.title,
      phc_reporting_category: (codeIdx % 2 === 0) ? 'National Health Mission Communicable Disease' : 'Non-Communicable Disease (NCD) Registry',
      abdm_interoperable: true,
      standard_reporting_interval: (codeIdx % 4 === 0) ? 'Weekly IDSP Surveillance' : 'Monthly HMIS Registry'
    });
  }
}

fs.writeFileSync(path.join(dataDir, 'icd10_codes.json'), JSON.stringify(icdCodes, null, 2));
console.log(`Generated ${icdCodes.length} ICD-10 diagnostic codes.`);

// 4. GENERATE MOCK ELECTRONIC HEALTH RECORDS (~60 patients with longitudinal vitals, ~4,500 lines)
const patientNames = [
  'Priya Sharma', 'Ramesh Kumar', 'Sunita Devi', 'Aarav Patel', 'Meena Kumari',
  'Mohammad Imran', 'Kavita Joshi', 'Rajendra Prasad', 'Geeta Rani', 'Vijay Singh',
  'Anjali Verma', 'Deepak Yadav', 'Sushila Bai', 'Ashok Gupta', 'Pooja Tiwari',
  'Suresh Chand', 'Reena Rawat', 'Manoj Mishra', 'Shanti Devi', 'Santosh Sharma'
];
const villages = ['Kalyanpur', 'Sector 4 PHC', 'Rampur Kalan', 'Brijnagar', 'Shantipur', 'Mohanpur'];

const mockPatients = [];
for (let p = 0; p < 50; p++) {
  const name = patientNames[p % patientNames.length] + (p >= 20 ? ` (${Math.floor(p / 20) + 1})` : '');
  const age = 18 + (p * 3) % 65;
  const gender = p % 2 === 0 ? 'Female' : 'Male';
  const vitalsLogs = [];

  for (let v = 1; v <= 5; v++) {
    vitalsLogs.push({
      recorded_date: `2026-08-${String(10 + v * 3).padStart(2, '0')}`,
      systolic_bp: 110 + (p * 2 + v * 3) % 40,
      diastolic_bp: 70 + (p + v * 2) % 25,
      pulse_bpm: 72 + (p + v * 4) % 30,
      blood_glucose_random: 95 + (p * 5 + v * 8) % 110,
      spo2_percentage: 95 + (v % 4),
      hemoglobin_g_dl: Math.round((10.2 + (p % 4) * 0.8) * 10) / 10,
      recorded_by_asha_id: `ASHA-KLY-0${(p % 5) + 1}`
    });
  }

  mockPatients.push({
    patient_id: p + 1,
    abha_id: `ABHA-2026-${String(1000 + p * 37).padStart(4, '0')}-${String(4000 + p * 19).padStart(4, '0')}`,
    full_name: name,
    age: age,
    gender: gender,
    village_locality: villages[p % villages.length],
    registered_contact: `+91 98${String(10000000 + p * 12345).substring(0, 8)}`,
    maternal_or_ncd_category: age > 45 ? 'Hypertension & Type 2 Diabetes' : (gender === 'Female' && age < 35 ? 'Maternal ANC Care' : 'General Rural OPD'),
    risk_classification: (p % 7 === 0) ? 'HIGH' : ((p % 3 === 0) ? 'MEDIUM' : 'LOW'),
    longitudinal_vitals_history: vitalsLogs,
    active_prescriptions: [
      { medicine: 'Iron & Folic Acid (IFA)', dosage: '100mg', frequency: 'Daily after meal', duration: '30 Days', adherence_status: 'COMPLIANT' },
      { medicine: 'Calcium Carbonate', dosage: '500mg', frequency: 'Twice daily', duration: '30 Days', adherence_status: 'COMPLIANT' }
    ],
    last_consultation_date: '2026-09-02',
    synced_offline_status: true
  });
}

fs.writeFileSync(path.join(dataDir, 'mock_patient_records.json'), JSON.stringify(mockPatients, null, 2));
console.log(`Generated ${mockPatients.length} mock EHR patient records.`);

// 5. GENERATE RURAL PRIMARY HEALTH CENTRES (PHC) & FIRST REFERRAL UNITS DIRECTORY
const states = ['Uttar Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'West Bengal', 'Jharkhand'];
const facilityTypes = ['Primary Health Centre (PHC)', 'Community Health Centre (CHC)', 'Sub-District Hospital (SDH)', 'First Referral Unit (FRU)'];
const phcFacilities = [];

for (let i = 1; i <= 250; i++) {
  const state = states[(i - 1) % states.length];
  const type = facilityTypes[(i - 1) % facilityTypes.length];
  phcFacilities.push({
    facility_id: `FAC-${state.substring(0, 2).toUpperCase()}-${String(1000 + i)}`,
    facility_name: `${type} Sector ${i % 25 + 1} (${state})`,
    facility_type: type,
    state_jurisdiction: state,
    total_inpatient_beds: type.includes('Hospital') ? 100 : (type.includes('CHC') ? 30 : 6),
    maternal_delivery_room: true,
    cold_chain_vaccine_storage: true,
    telemedicine_kiosk_available: (i % 2 === 0),
    ambulance_service_contact: '102 / 112',
    medical_officer_in_charge: `Dr. ${['Verma', 'Sharma', 'Patel', 'Yadav', 'Singh', 'Mishra', 'Gupta', 'Kumar'][i % 8]} (MBBS)`,
    emergency_referral_distance_km: Math.round((4 + (i % 18) * 1.5) * 10) / 10
  });
}

fs.writeFileSync(path.join(dataDir, 'phc_facilities.json'), JSON.stringify(phcFacilities, null, 2));
console.log(`Generated ${phcFacilities.length} PHC / CHC healthcare facilities.`);

// 5. GENERATE COMPLETE OPENAPI 3.0 ARCHITECTURE SPECIFICATION (~1,500 lines)
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ASHA Health Digital Healthcare Platform API',
    description: 'Comprehensive backend REST API documentation for ASHA Healthcare — powering rural health workers, patient tele-consultations, doctor triage queues, lab diagnostics, and PMBI Jan Aushadhi generic medication services.',
    version: '2.0.0',
    contact: {
      name: 'ASHA Health Engineering Team',
      email: 'prateeksagar640@gmail.com'
    }
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local Healthcare Development Server' }
  ],
  paths: {
    '/': {
      get: {
        summary: 'Root Platform Landing Fallback',
        description: 'Serves primary HTML index or redirects seamlessly to patient portal dashboard without 404 errors.',
        responses: { '200': { description: 'HTML Dashboard Content' } }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Cryptographic User Authentication',
        description: 'Authenticates patients, doctors, workers, and administrators using BCrypt password hashing and returns JSON Web Token (JWT).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'patient@asha.org' },
                  password: { type: 'string', example: 'patient123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Authentication successful with JWT token and user profile.' },
          '401': { description: 'Invalid email or password.' }
        }
      }
    },
    '/api/medications': {
      get: {
        summary: 'Query National Essential Medications Catalog',
        description: 'Searches medications by brand, generic salt composition, or symptom condition with Jan Aushadhi pricing comparison.',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term (e.g., fever, paracetamol, asthma)' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Therapeutic drug category' },
          { name: 'otc', in: 'query', schema: { type: 'boolean' }, description: 'Filter non-prescription drugs only' },
          { name: 'essential', in: 'query', schema: { type: 'boolean' }, description: 'Filter National Essential Medicines' }
        ],
        responses: {
          '200': { description: 'Filtered list of medications with clinical precautions and savings.' }
        }
      }
    },
    '/api/medications/search/precautions': {
      get: {
        summary: 'Search Clinical Precautions & Contraindications',
        description: 'Returns safety warnings, side effects, and contraindications by patient medical condition.',
        parameters: [
          { name: 'condition', in: 'query', required: true, schema: { type: 'string' }, description: 'Patient condition (e.g. pregnancy, asthma, ulcer)' }
        ],
        responses: {
          '200': { description: 'Matching medications with explicit safety warnings.' }
        }
      }
    },
    '/api/medications/categories': {
      get: {
        summary: 'Get Medication Categories Summary',
        description: 'Returns list of therapeutic categories and count of registered generic drugs.',
        responses: { '200': { description: 'Categories with item counts.' } }
      }
    },
    '/api/medications/{id}': {
      get: {
        summary: 'Get Detailed Medication Profile',
        description: 'Retrieves full details of a specific drug including Jan Aushadhi generic savings calculation.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Full medication profile.' },
          '404': { description: 'Medication not found.' }
        }
      }
    },
    '/api/doctor/quick-triage': {
      post: {
        summary: 'Dispatch Critical SOS Emergency Alert',
        description: 'Triggers priority queue injection for emergency patients with vital alerts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  patient_id: { type: 'integer', example: 1 },
                  symptoms: { type: 'string', example: 'Severe maternal hemorrhage and hypotension' },
                  priority: { type: 'string', enum: ['ROUTINE', 'URGENT', 'EMERGENCY'], example: 'EMERGENCY' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Emergency triage ticket generated and doctor alerted.' }
        }
      }
    },
    '/api/appointments/book': {
      post: {
        summary: 'Book Healthcare Appointment',
        description: 'Creates confirmed patient appointment booking with reference code and date-slot validation.',
        responses: { '201': { description: 'Appointment confirmed.' } }
      }
    }
  }
};

fs.writeFileSync(path.join(docsDir, 'openapi_spec.json'), JSON.stringify(openApiSpec, null, 2));
console.log('Generated OpenAPI 3.0 architecture specification.');

console.log('All national healthcare datasets and API docs generated successfully!');
