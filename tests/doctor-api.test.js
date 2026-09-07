/**
 * Automated Verification Suite for Doctor Dashboard, Priority Queue & Doctor Management API
 * Run with: node tests/doctor-api.test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🩺 Starting Doctor Dashboard, Priority Queue & Admin Management Tests...\n');
  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${desc} -> ${e.message}`);
      failed++;
    }
  }

  // 1. GET /api/doctors returns full list and live stats
  await assert('GET /api/doctors returns doctors array and statistics', async () => {
    const res = await makeRequest('/api/doctors');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!res.data.doctors || !Array.isArray(res.data.doctors)) throw new Error('Expected doctors array');
    if (!res.data.stats || typeof res.data.stats.total !== 'number') throw new Error('Expected stats object');
    if (res.data.doctors.length === 0) throw new Error('Expected at least 1 doctor in directory');
  });

  // 2. Department filter
  await assert('GET /api/doctors?department=Cardiology filters properly', async () => {
    const res = await makeRequest('/api/doctors?department=Cardiology');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const nonCardio = res.data.doctors.find(d => d.department.toLowerCase() !== 'cardiology');
    if (nonCardio) throw new Error(`Found non-cardiology doctor: ${nonCardio.department}`);
  });

  // 3. Format=array backward compatibility
  await assert('GET /api/doctors?format=array returns pure array for booking dropdowns', async () => {
    const res = await makeRequest('/api/doctors?format=array');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected root array');
  });

  // 4. POST /api/doctors registers new specialist
  let createdDocId = '';
  await assert('POST /api/doctors creates a new doctor record', async () => {
    const res = await makeRequest('/api/doctors', 'POST', {
      name: 'Dr. Test Specialist',
      department: 'Pediatrics',
      specialty: 'Pediatric Cardiologist',
      qualifications: 'MBBS, MD',
      experience_years: 9,
      consultation_fee: 950
    });
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    if (!res.data.success || !res.data.doc_id) throw new Error('Missing doc_id');
    createdDocId = res.data.doc_id;
  });

  // 5. PATCH /api/doctors/:id/status updates status
  await assert('PATCH /api/doctors/:id/status updates doctor duty status', async () => {
    if (!createdDocId) throw new Error('No doctor created');
    const res = await makeRequest(`/api/doctors/${createdDocId}/status`, 'PATCH', { status: 'LEAVE' });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
  });

  // 6. GET /api/doctor/queue returns triage queue sorted by priority
  await assert('GET /api/doctor/queue returns triage queue with EMERGENCY/URGENT at top', async () => {
    const res = await makeRequest('/api/doctor/queue');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array of triage cases');
    if (res.data.length > 0 && res.data[0].priority !== 'EMERGENCY' && res.data[0].priority !== 'URGENT') {
      throw new Error(`Expected top priority case, got ${res.data[0].priority}`);
    }
  });

  // 7. POST /api/doctor/quick-triage registers emergency case
  await assert('POST /api/doctor/quick-triage registers instant emergency ticket', async () => {
    const res = await makeRequest('/api/doctor/quick-triage', 'POST', {
      patient_id: 1,
      symptoms: 'Sudden dyspnea, SpO2 86%, dizzy',
      priority: 'EMERGENCY'
    });
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    if (!res.data.ticketId) throw new Error('Missing ticketId');
  });

  // 8. PATCH /api/appointments/:id/status updates appointment state
  await assert('PATCH /api/appointments/:id/status updates appointment status', async () => {
    const res = await makeRequest('/api/appointments/1/status', 'PATCH', { status: 'COMPLETED' });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (res.data.status !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${res.data.status}`);
  });

  // 9. Shortcut routes redirect
  await assert('Friendly shortcut routes /doctor and /admin/doctors return 302 redirect', async () => {
    const doctorRedirect = await makeRequest('/doctor/dashboard');
    if (doctorRedirect.status !== 302) throw new Error(`/doctor/dashboard returned ${doctorRedirect.status}`);
    const adminDocRedirect = await makeRequest('/admin/doctors');
    if (adminDocRedirect.status !== 302) throw new Error(`/admin/doctors returned ${adminDocRedirect.status}`);
  });

  // 10. POST /api/doctor/admit-patient registers walk-in and enters queue
  await assert('POST /api/doctor/admit-patient admits walk-in patient into OPD queue', async () => {
    const res = await makeRequest('/api/doctor/admit-patient', 'POST', {
      name: 'Pooja Verma',
      age: 28,
      gender: 'Female',
      phone: '9876543210',
      village: 'Rampur',
      priority: 'URGENT',
      risk_level: 'MODERATE',
      symptoms: 'Persistent fever and acute migraine',
      vitals_bp: '135/88',
      vitals_pulse: 94,
      vitals_spo2: 97
    });
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    if (!res.data.patientId || !res.data.queueId) throw new Error('Missing patientId or queueId');
  });

  // 11. POST /api/doctor/schedule-slot creates doctor follow-up appointment
  await assert('POST /api/doctor/schedule-slot books clinical follow-up without payment gate', async () => {
    const res = await makeRequest('/api/doctor/schedule-slot', 'POST', {
      patient_name: 'Pooja Verma',
      doctor_name: 'Dr. Ananya Sharma',
      appointment_date: '2026-09-08',
      time_slot: '11:30 AM',
      consultation_type: 'clinic',
      reason: 'Post-migraine review'
    });
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    if (!res.data.appointmentId || !res.data.booking_reference) throw new Error('Missing appointmentId or booking reference');
  });

  // 12. Fix CANNOT GET on patient login variant route and doctor quick routes
  await assert('Patient login variant & doctor action routes return 302 redirect', async () => {
    const loginRedirect = await makeRequest('/auth/patient_login_variant_2/patient_login_v2.html');
    if (loginRedirect.status !== 302) throw new Error(`Expected 302 for patient_login_v2.html, got ${loginRedirect.status}`);
    const addPatientRedirect = await makeRequest('/doctor/add-patient');
    if (addPatientRedirect.status !== 302) throw new Error(`Expected 302 for /doctor/add-patient, got ${addPatientRedirect.status}`);
    const scheduleRedirect = await makeRequest('/doctor/schedule');
    if (scheduleRedirect.status !== 302) throw new Error(`Expected 302 for /doctor/schedule, got ${scheduleRedirect.status}`);
  });

  console.log('\n========================================');
  console.log(`Doctor Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
