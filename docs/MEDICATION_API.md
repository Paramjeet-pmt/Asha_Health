# ASHA Healthcare — Medications & Clinical Precautions API Reference

This document outlines the REST API endpoints available for the **Find Medication / Precautions** service. These endpoints connect directly to the SQLite clinical database (`asha_health.db`) and provide generic drug lookups, safety precautions, contraindications, and Pradhan Mantri Jan Aushadhi Kendra pricing.

---

## 1. List & Search Medications
Search the national essential medicine catalog by brand name, generic salt, or therapeutic indications.

- **Endpoint:** `GET /api/medications`
- **Query Parameters:**
  - `q` *(string, optional)*: Search query matching drug brand name, generic salt composition, or medical condition (e.g., `fever`, `paracetamol`, `asthma`, `infection`).
  - `category` *(string, optional)*: Filter by clinical category (e.g., `Analgesic & Antipyretic`, `Antibiotics`, `Antidiabetic`, `Antihypertensive`, `Electrolytes & Rehydration`).
  - `otc` *(boolean, optional)*: Set `true` to filter only over-the-counter (non-prescription) drugs.
  - `essential` *(boolean, optional)*: Set `true` to show WHO/NLEM National Essential Medicines.

### Example Request
```http
GET /api/medications?q=fever
```

### Example Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Paracetamol (Dolo / Crocin Generic)",
      "generic_name": "Paracetamol / Acetaminophen",
      "category": "Analgesic & Antipyretic",
      "dosage_form": "Tablet",
      "strength": "650mg",
      "indications": "Fever, mild to moderate body pain, headache, post-vaccination fever",
      "precautions": "Do not exceed 4000mg in 24 hours. Avoid alcohol consumption. Maintain minimum 4-6 hours interval between doses.",
      "side_effects": "Nausea, allergic skin rash, liver toxicity in case of severe overdose.",
      "contraindications": "Severe hepatic impairment, acute liver failure, hypersensitivity to paracetamol.",
      "jan_aushadhi_price": 12.50,
      "market_price": 34.00,
      "is_essential": 1,
      "prescription_required": 0
    }
  ]
}
```

---

## 2. Search Clinical Precautions & Contraindications
Quick lookup specifically for warnings, contraindications, and usage guidance based on patient conditions.

- **Endpoint:** `GET /api/medications/search/precautions`
- **Query Parameters:**
  - `condition` *(string, required)*: Medical condition, symptom, or allergy to check (e.g., `diarrhea`, `pregnancy`, `asthma`, `ulcer`).

### Example Request
```http
GET /api/medications/search/precautions?condition=pregnancy
```

### Example Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 10,
      "name": "Albendazole (Zentel Generic)",
      "generic_name": "Albendazole",
      "indications": "Intestinal worm infections, roundworm, hookworm infestations",
      "precautions": "Chew thoroughly before swallowing. Best taken with fatty food.",
      "contraindications": "Pregnancy (especially 1st trimester), known albendazole allergy.",
      "side_effects": "Transient stomach ache, headache, mild nausea.",
      "jan_aushadhi_price": 5.00
    }
  ]
}
```

---

## 3. Get Medication Details & Savings Calculator
Returns a single medicine profile with Jan Aushadhi generic savings calculation.

- **Endpoint:** `GET /api/medications/:id`

### Example Request
```http
GET /api/medications/2
```

### Example Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Amoxicillin + Potassium Clavulanate (Augmentin Generic)",
    "generic_name": "Amoxicillin + Clavulanic Acid",
    "category": "Antibiotics",
    "dosage_form": "Tablet",
    "strength": "625mg",
    "indications": "Bacterial respiratory infections, pneumonia, acute otitis media",
    "precautions": "Complete the entire 5 to 7 day course even if symptoms resolve.",
    "side_effects": "Diarrhea, nausea, vomiting, candidiasis.",
    "contraindications": "History of penicillin or beta-lactam anaphylaxis.",
    "jan_aushadhi_price": 52.00,
    "market_price": 210.00,
    "savings_percentage": "75%"
  }
}
```

---

## 4. Medication Categories Summary
Returns distinct categories and available medicine counts for building category navigation chips.

- **Endpoint:** `GET /api/medications/categories`

### Example Response (`200 OK`)
```json
{
  "success": true,
  "categories": [
    { "category": "Analgesic & Antipyretic", "count": 2 },
    { "category": "Antibiotics", "count": 2 },
    { "category": "Electrolytes & Rehydration", "count": 1 },
    { "category": "Antidiabetic", "count": 1 },
    { "category": "Antihypertensive", "count": 1 },
    { "category": "Gastrointestinal / Antacid", "count": 1 },
    { "category": "Maternal & Nutritional", "count": 1 }
  ]
}
```

---

## 5. Add New Medication (Pharmacist / Admin)
- **Endpoint:** `POST /api/medications`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Cough Syrup Relief Generic",
  "generic_name": "Dextromethorphan HBr 10mg / 5ml",
  "category": "Respiratory",
  "dosage_form": "Syrup (100ml)",
  "strength": "10mg/5ml",
  "indications": "Dry non-productive cough, bronchial irritation",
  "precautions": "Do not combine with MAO inhibitors or sedatives. Avoid in productive cough.",
  "side_effects": "Mild drowsiness, nausea",
  "contraindications": "Chronic bronchitis with excessive phlegm",
  "jan_aushadhi_price": 22.00,
  "market_price": 95.00,
  "is_essential": 1,
  "prescription_required": 0
}
```
