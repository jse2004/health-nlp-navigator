// Types for our data
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: string;
  status: 'Critical' | 'Warning' | 'Normal' | 'Active' | 'Inactive';
  last_visit: string; // Using snake_case for DB compatibility
  medical_history: string[]; // Using snake_case for DB compatibility
}

export interface MedicalRecord {
  id: string;
  patient_id: string; // Using snake_case for DB compatibility
  date: string;
  doctor_notes: string; // Using snake_case for DB compatibility
  diagnosis: string;
  recommended_actions: string[]; // Using snake_case for DB compatibility
  severity: number;
  patient_name?: string; // Using snake_case for DB compatibility
  notes?: string;
  status?: 'active' | 'inactive'; // Status for soft delete functionality
}

export interface AnalyticsSummary {
  totalPatients: number;
  criticalCases: number;
  pendingReviews: number;
  recentAdmissions: number;
}

// Sample patients data
export const patients: Patient[] = [
  {
    id: "P001",
    name: "John Smith",
    age: 45,
    gender: "Male",
    condition: "Hypertension",
    status: "Warning",
    last_visit: "2023-04-15",
    medical_history: ["Diabetes Type 2", "Appendectomy (2015)"]
  },
  {
    id: "P002",
    name: "Emma Johnson",
    age: 32,
    gender: "Female",
    condition: "Pregnancy - 3rd Trimester",
    status: "Normal",
    last_visit: "2023-05-02",
    medical_history: ["Asthma", "Tonsillectomy (2010)"]
  },
  {
    id: "P003",
    name: "Robert Davis",
    age: 67,
    gender: "Male",
    condition: "Post-Stroke Recovery",
    status: "Critical",
    last_visit: "2023-05-10",
    medical_history: ["Stroke (2023)", "Heart Arrhythmia", "Hypertension"]
  },
  {
    id: "P004",
    name: "Sophia Chen",
    age: 28,
    gender: "Female",
    condition: "Migraine",
    status: "Normal",
    last_visit: "2023-04-28",
    medical_history: ["Vitamin D Deficiency"]
  },
  {
    id: "P005",
    name: "Michael Brown",
    age: 52,
    gender: "Male",
    condition: "Coronary Artery Disease",
    status: "Warning",
    last_visit: "2023-05-05",
    medical_history: ["Myocardial Infarction (2020)", "Hypercholesterolemia", "Obesity"]
  }
];

// Sample medical records
export const medicalRecords: MedicalRecord[] = [
  {
    id: "MR001",
    patient_id: "P001",
    date: "2023-04-15",
    doctor_notes: "Patient presents with elevated blood pressure (150/95 mmHg). Reports occasional headaches and dizziness. Current medication appears to be insufficiently managing hypertension. Recommended adjustment to dosage and follow-up in two weeks.",
    diagnosis: "Uncontrolled Hypertension",
    recommended_actions: [
      "Increase lisinopril to 20mg daily",
      "Daily blood pressure monitoring",
      "Reduce sodium intake",
      "Follow up in 2 weeks"
    ],
    severity: 7
  },
  {
    id: "MR002",
    patient_id: "P002",
    date: "2023-05-02",
    doctor_notes: "Routine prenatal checkup at 34 weeks. Fetal heartbeat normal at 140 bpm. Mother reports mild lower back pain but no contractions. Blood pressure within normal range at 118/75 mmHg. Fetal position is head down, preparing for birth.",
    diagnosis: "Normal Pregnancy Progression",
    recommended_actions: [
      "Continue prenatal vitamins",
      "Mild exercise recommended",
      "Next appointment in 1 week"
    ],
    severity: 3
  },
  {
    id: "MR003",
    patient_id: "P003",
    date: "2023-05-10",
    doctor_notes: "Patient recovering from ischemic stroke 3 weeks ago. Presenting with right-sided weakness, particularly in the upper extremity. Speech is slightly slurred but comprehension intact. Patient reports difficulty with fine motor tasks. Blood pressure elevated at 160/95 mmHg despite medication.",
    diagnosis: "Post-stroke Recovery with Residual Hemiparesis",
    recommended_actions: [
      "Urgent adjustment to anti-hypertensive medication",
      "Physical therapy 3x weekly",
      "Speech therapy evaluation",
      "Follow up with neurologist in 1 week"
    ],
    severity: 9
  },
  {
    id: "MR004",
    patient_id: "P004",
    date: "2023-04-28",
    doctor_notes: "Patient with recurring migraines, 2-3 episodes per week. Reports visual aura preceding headaches. Pain primarily on right side of head with nausea. Current prophylactic treatment showing minimal effectiveness. Sleep pattern irregular due to work schedule.",
    diagnosis: "Chronic Migraine with Aura",
    recommended_actions: [
      "Start topiramate 25mg daily, increasing to 50mg after 1 week",
      "Keep migraine diary",
      "Improve sleep hygiene",
      "Follow up in 3 weeks"
    ],
    severity: 6
  },
  {
    id: "MR005",
    patient_id: "P005",
    date: "2023-05-05",
    doctor_notes: "Follow-up after recent abnormal stress test. Patient reports chest discomfort with moderate exertion. ECG shows ST-segment depression in leads V3-V5. Recent lipid panel indicates LDL at 145 mg/dL despite statin therapy. BMI currently at 31.5.",
    diagnosis: "Worsening Coronary Artery Disease",
    recommended_actions: [
      "Increase atorvastatin to 40mg daily",
      "Cardiology referral for possible angiography",
      "Dietary consultation for weight management",
      "Low-intensity exercise program"
    ],
    severity: 8
  }
];

// Sample analytics summary
export const analyticsSummary: AnalyticsSummary = {
  totalPatients: 157,
  criticalCases: 12,
  pendingReviews: 24,
  recentAdmissions: 8
};

// Sample insight data for dashboard
export const insightData = [
  {
    id: 1,
    title: "Potential Diagnosis",
    content: "NLP analysis of patient P003's symptoms suggests possible comorbid depression. Consider psychological evaluation.",
    type: "clinical"
  },
  {
    id: 2,
    title: "Medication Alert",
    content: "3 patients on Lisinopril reporting persistent dry cough - potential ACE inhibitor adverse effect.",
    type: "medication"
  },
  {
    id: 3,
    title: "Care Gap Identified",
    content: "5 diabetic patients due for annual eye examination. Automatic reminders suggested.",
    type: "care"
  },
  {
    id: 4,
    title: "Pattern Recognition",
    content: "Increase in respiratory complaints among patients in the North District over the past week.",
    type: "trend"
  }
];
