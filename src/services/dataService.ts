
import { supabase } from '@/integrations/supabase/client';
import { Patient, MedicalRecord, CollegeDepartment, collegeDepartmentNames } from '@/data/sampleData';

export interface MedicalCertificate {
  id: string;
  medical_record_id: string;
  patient_name: string;
  issue_date: string;
  valid_until?: string;
  certificate_type: string;
  reason: string;
  recommendations?: string;
  doctor_name: string;
  certificate_number: string;
  created_at: string;
  updated_at: string;
}

// Generate UDM-formatted ID
const generateUDMId = async (): Promise<string> => {
  try {
    // Get the count of existing records to generate the next ID
    const { count, error } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting record count:', error);
      // Fallback to random number if count fails
      return `UDM${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
    }
    
    const nextNumber = (count || 0) + 1;
    return `UDM${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating UDM ID:', error);
    return `UDM${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
  }
};

// Generate patient ID
const generatePatientId = async (): Promise<string> => {
  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting patient count:', error);
      return `PAT${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
    }
    
    const nextNumber = (count || 0) + 1;
    return `PAT${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating patient ID:', error);
    return `PAT${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`;
  }
};

// Fetch patients from Supabase and update status based on active medical records
export const fetchPatients = async (searchQuery?: string): Promise<Patient[]> => {
  try {
    let query = supabase
      .from('patients')
      .select('*');

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,condition.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
    
    const patients = data as Patient[] || [];
    
    // Update patient status based on active medical records
    const updatedPatients = await Promise.all(patients.map(async (patient) => {
      try {
        // Check if patient has any active medical records
        const { data: activeRecords, error: recordsError } = await supabase
          .from('medical_records')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('status', 'active')
          .limit(1);
        
        if (recordsError) {
          console.error('Error checking active records for patient:', patient.id, recordsError);
          return patient; // Return original patient if there's an error
        }
        
        // Determine if patient should be active or inactive
        const hasActiveRecords = activeRecords && activeRecords.length > 0;
        const newStatus: Patient['status'] = hasActiveRecords ? 'Active' : 'Inactive';
        
        // Update patient status if it has changed
        if (patient.status !== newStatus) {
          const { error: updateError } = await supabase
            .from('patients')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', patient.id);
          
          if (updateError) {
            console.error('Error updating patient status:', updateError);
          }
          
          return { ...patient, status: newStatus };
        }
        
        return patient;
      } catch (error) {
        console.error('Error processing patient status:', error);
        return patient;
      }
    }));
    
    return updatedPatients;
  } catch (error) {
    console.error('Error in fetchPatients:', error);
    throw error;
  }
};

// Fetch medical records from Supabase (only active records by default)
export const fetchMedicalRecords = async (searchQuery?: string, patientId?: string, includeInactive = false): Promise<MedicalRecord[]> => {
  try {
    let query = supabase
      .from('medical_records')
      .select('*');

    // Only show active records by default
    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (searchQuery) {
      query = query.or(`patient_name.ilike.%${searchQuery}%,diagnosis.ilike.%${searchQuery}%,doctor_notes.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
    
    return data as MedicalRecord[] || [];
  } catch (error) {
    console.error('Error in fetchMedicalRecords:', error);
    throw error;
  }
};

// Interface for patient data in medical record
interface PatientDataForRecord {
  name: string;
  person_type?: 'student' | 'professor' | 'employee' | 'guest';
  student_id?: string;
  course_year?: string;
  college_department?: CollegeDepartment;
  position?: string;
  faculty?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
}

// Enhanced helper function to find or create a patient with more complete data
const findOrCreatePatientWithData = async (patientData: PatientDataForRecord): Promise<string | null> => {
  if (!patientData.name) return null;

  try {
    // For students, try to find by student_id first if provided
    if (patientData.person_type === 'student' && patientData.student_id) {
      const { data: existingByStudentId, error: studentIdError } = await supabase
        .from('patients')
        .select('id, college_department')
        .eq('student_id', patientData.student_id)
        .limit(1);
      
      if (!studentIdError && existingByStudentId && existingByStudentId.length > 0) {
        const existingPatient = existingByStudentId[0];
        
        // Update patient with new information if provided and different
        const updateData: any = {
          last_visit: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
        
        if (patientData.college_department && existingPatient.college_department !== patientData.college_department) {
          updateData.college_department = patientData.college_department;
        }
        
        if (patientData.age) updateData.age = patientData.age;
        if (patientData.gender) updateData.gender = patientData.gender;
        if (patientData.name) updateData.name = patientData.name;
        
        const { error: updateError } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', existingPatient.id);
        
        if (updateError) {
          console.error('Error updating existing patient:', updateError);
        }
        
        return existingPatient.id;
      }
    }
    
    // Try to find existing patient by name
    const { data: existingPatients, error: fetchError } = await supabase
      .from('patients')
      .select('id, college_department, student_id')
      .eq('name', patientData.name)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing patient:', fetchError);
      return null;
    }

    // If patient exists, update them with any new information
    if (existingPatients && existingPatients.length > 0) {
      const existingPatient = existingPatients[0];
      
      // Update patient with any new information if provided and different
      const updateData: any = {
        last_visit: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };
      
      if (patientData.college_department && existingPatient.college_department !== patientData.college_department) {
        updateData.college_department = patientData.college_department;
      }
      
      if (patientData.student_id && !existingPatient.student_id) {
        updateData.student_id = patientData.student_id;
      }
      
      if (patientData.age) updateData.age = patientData.age;
      if (patientData.gender) updateData.gender = patientData.gender;
      
      const { error: updateError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', existingPatient.id);
      
      if (updateError) {
        console.error('Error updating existing patient:', updateError);
      } else {
        console.log('Updated existing patient with new information');
      }
      
      return existingPatient.id;
    }

    // If patient doesn't exist, create a new one with complete data
    const patientId = await generatePatientId();
    const newPatient: any = {
      id: patientId,
      name: patientData.name,
      age: patientData.age || 20,
      gender: patientData.gender || 'Other',
      condition: patientData.person_type === 'student' ? 'Student Health Check' : 'General Check-up',
      status: 'Active',
      last_visit: new Date().toISOString().split('T')[0],
      medical_history: [],
      college_department: patientData.college_department || null
    };
    
    // Add student_id if person_type is student
    if (patientData.person_type === 'student' && patientData.student_id) {
      newPatient.student_id = patientData.student_id;
    }

    const { data: createdPatient, error: createError } = await supabase
      .from('patients')
      .insert([newPatient])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating new patient:', createError);
      return null;
    }

    return createdPatient.id;
  } catch (error) {
    console.error('Error in findOrCreatePatientWithData:', error);
    return null;
  }
};

// Legacy helper function to find or create a patient (for backward compatibility)
const findOrCreatePatient = async (studentName: string): Promise<string | null> => {
  return findOrCreatePatientWithData({ name: studentName });
};

// Reactivate a medical record when a patient visits again
const reactivateMedicalRecordsByPatient = async (patientId: string): Promise<void> => {
  try {
    console.log('Reactivating medical records for patient ID:', patientId);
    
    const { error } = await supabase
      .from('medical_records')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)
      .eq('status', 'inactive');
    
    if (error) {
      console.error('Error reactivating medical records:', error);
      throw new Error(`Failed to reactivate records: ${error.message}`);
    }
    
    console.log('Medical records reactivated successfully');
  } catch (error) {
    console.error('Error in reactivateMedicalRecordsByPatient:', error);
    throw error;
  }
};

// Save or update a medical record with enhanced patient data support
export const saveMedicalRecord = async (record: Partial<MedicalRecord> & { patient_data?: PatientDataForRecord }): Promise<MedicalRecord> => {
  try {
    const { id, patient_data, ...recordData } = record;
    
    // Handle patient connection with enhanced data
    let patientId = recordData.patient_id;
    
    // Use enhanced patient data if provided
    if (patient_data && !patientId) {
      patientId = await findOrCreatePatientWithData(patient_data);
    } else if (recordData.patient_name && !patientId) {
      // Fallback to legacy method
      patientId = await findOrCreatePatient(recordData.patient_name);
    }

    // For new records, check if the same patient already has an active record
    if (patientId && !id) { // Only for new records
      // First, check if there's already an active record for this patient
      const { data: existingActiveRecords, error: fetchError } = await supabase
        .from('medical_records')
        .select('id')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .limit(1);

      if (fetchError) {
        console.error('Error checking for existing active records:', fetchError);
        throw new Error(`Failed to check existing records: ${fetchError.message}`);
      }

      // If there's an existing active record, update it instead of creating a new one
      if (existingActiveRecords && existingActiveRecords.length > 0) {
        const existingRecordId = existingActiveRecords[0].id;
        console.log('Found existing active record for patient, updating instead of creating new:', existingRecordId);
        
        // Update the existing record
        const dataToUpdate = {
          ...recordData,
          patient_id: patientId,
          status: 'active',
          updated_at: new Date().toISOString()
        };
        
        // Handle date conversion
        if (recordData.date) {
          dataToUpdate.date = new Date(recordData.date).toISOString();
        } else {
          dataToUpdate.date = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('medical_records')
          .update(dataToUpdate)
          .eq('id', existingRecordId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating existing medical record:', error);
          throw new Error(`Failed to update existing record: ${error.message}`);
        }
        
        console.log('Successfully updated existing medical record:', data);
        return data as MedicalRecord;
      }

      // If no active record exists, reactivate any inactive records for this patient
      await reactivateMedicalRecordsByPatient(patientId);
    }

    // Generate UDM ID for new records
    let recordId = id;
    if (!recordId) {
      recordId = await generateUDMId();
    }

    // Prepare data for save
    const dataToSave = {
      ...recordData,
      id: recordId,
      patient_id: patientId,
      status: 'active', // Ensure new/updated records are active
      updated_at: new Date().toISOString()
    };
    
    // Handle date conversion
    if (recordData.date) {
      dataToSave.date = new Date(recordData.date).toISOString();
    } else {
      dataToSave.date = new Date().toISOString();
    }

    let result;

    if (id) {
      // Update existing record
      const { data, error } = await supabase
        .from('medical_records')
        .update(dataToSave)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating medical record:', error);
        throw new Error(`Failed to update record: ${error.message}`);
      }
      
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('medical_records')
        .insert([dataToSave])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting medical record:', error);
        throw new Error(`Failed to save record: ${error.message}`);
      }
      
      result = data;
    }
    
    console.log('Medical record saved successfully:', result);
    return result as MedicalRecord;
  } catch (error) {
    console.error('Error in saveMedicalRecord:', error);
    throw error;
  }
};

// Save or update a patient
export const savePatient = async (patient: Partial<Patient>): Promise<Patient> => {
  try {
    const { id, ...patientData } = patient;
    
    let result;
    let patientId = id;

    // Generate patient ID for new patients
    if (!patientId) {
      patientId = await generatePatientId();
    }

    const dataToSave = {
      ...patientData,
      id: patientId,
      updated_at: new Date().toISOString()
    };

    if (id) {
      // Update existing patient
      const { data, error } = await supabase
        .from('patients')
        .update(dataToSave)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating patient:', error);
        throw new Error(`Failed to update patient: ${error.message}`);
      }
      
      result = data;
    } else {
      // Validate required fields for new patients
      if (!dataToSave.name || !dataToSave.age || !dataToSave.gender) {
        throw new Error('Missing required fields: name, age, and gender are required');
      }

      // Ensure required fields have proper types
      const newPatientData = {
        id: patientId,
        name: dataToSave.name,
        age: Number(dataToSave.age),
        gender: dataToSave.gender,
        condition: dataToSave.condition || 'General Check-up',
        status: dataToSave.status || 'Active',
        last_visit: dataToSave.last_visit || new Date().toISOString().split('T')[0],
        medical_history: dataToSave.medical_history || [],
        updated_at: new Date().toISOString()
      };
      
      // Insert new patient
      const { data, error } = await supabase
        .from('patients')
        .insert(newPatientData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting patient:', error);
        throw new Error(`Failed to create patient: ${error.message}`);
      }
      
      result = data;
    }
    
    console.log('Patient saved successfully:', result);
    return result as Patient;
  } catch (error) {
    console.error('Error in savePatient:', error);
    throw error;
  }
};

// Deactivate a medical record (soft delete)
export const deactivateMedicalRecord = async (id: string): Promise<void> => {
  try {
    console.log('Deactivating medical record with ID:', id);
    
    const { error } = await supabase
      .from('medical_records')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error deactivating medical record:', error);
      throw new Error(`Failed to deactivate record: ${error.message}`);
    }
    
    console.log('Medical record deactivated successfully');
  } catch (error) {
    console.error('Error in deactivateMedicalRecord:', error);
    throw error;
  }
};

// Keep the old deleteMedicalRecord for backward compatibility (now calls deactivate)
export const deleteMedicalRecord = async (id: string): Promise<void> => {
  return deactivateMedicalRecord(id);
};

// Get analytics data with historical comparison
export const getAnalyticsData = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all patients and only active records
    const [patientsResponse, recordsResponse] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('medical_records').select('*').eq('status', 'active')
    ]);

    if (patientsResponse.error) throw patientsResponse.error;
    if (recordsResponse.error) throw recordsResponse.error;

    const patients = patientsResponse.data || [];
    const records = recordsResponse.data || [];

    // Current metrics (only counting active records)
    const totalPatients = patients.length;
    
    // Critical cases: Look for high-priority conditions or urgent keywords in diagnosis, notes, or doctor notes
    const criticalCases = records.filter(r => {
      const diagnosis = r.diagnosis?.toLowerCase() || '';
      const notes = r.notes?.toLowerCase() || '';
      const doctorNotes = r.doctor_notes?.toLowerCase() || '';
      
      const criticalKeywords = [
        'critical', 'urgent', 'emergency', 'severe', 'acute', 'chest pain',
        'difficulty breathing', 'unconscious', 'trauma', 'bleeding', 'fracture',
        'high fever', 'seizure', 'stroke', 'heart attack', 'overdose', 'allergic reaction'
      ];
      
      return criticalKeywords.some(keyword => 
        diagnosis.includes(keyword) || 
        notes.includes(keyword) || 
        doctorNotes.includes(keyword)
      ) || r.severity >= 8; // Also consider high severity scores as critical
    }).length;
    
    // Pending reviews: medical records without proper diagnosis or marked as incomplete
    const pendingReviews = records.filter(r => 
      !r.diagnosis || 
      r.diagnosis.trim() === '' || 
      r.diagnosis.toLowerCase().includes('pending') ||
      r.diagnosis.toLowerCase().includes('to be reviewed') ||
      r.diagnosis.toLowerCase().includes('tbd') ||
      r.diagnosis === 'TBD'
    ).length;
    
    // Recent admissions: records created in last 7 days (more robust date handling)
    const recentAdmissions = records.filter(r => {
      if (!r.created_at) return false;
      const recordDate = new Date(r.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;

    // Historical metrics for comparison
    const previousMonthPatients = patients.filter(p => {
      if (!p.created_at) return false;
      const createdDate = new Date(p.created_at);
      return createdDate <= oneMonthAgo && createdDate >= twoMonthsAgo;
    }).length;

    const previousWeekCritical = records.filter(r => {
      if (!r.created_at) return false;
      const recordDate = new Date(r.created_at);
      return recordDate <= oneWeekAgo && recordDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).filter(r => {
      const patient = patients.find(p => p.id === r.patient_id);
      return patient?.status === 'Critical';
    }).length;

    const previousWeekPending = records.filter(r => {
      if (!r.created_at) return false;
      const recordDate = new Date(r.created_at);
      return recordDate <= oneWeekAgo && recordDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).filter(r => !r.diagnosis || r.diagnosis.trim() === '').length;

    return {
      totalPatients,
      criticalCases,
      pendingReviews,
      recentAdmissions,
      previousTotalPatients: previousMonthPatients,
      previousCriticalCases: previousWeekCritical,
      previousPendingReviews: previousWeekPending
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

// Delete a patient
export const deletePatient = async (id: string): Promise<void> => {
  try {
    console.log('Deleting patient with ID:', id);
    
    // First delete all medical records for this patient
    const { error: recordsError } = await supabase
      .from('medical_records')
      .delete()
      .eq('patient_id', id);
    
    if (recordsError) {
      console.error('Error deleting patient medical records:', recordsError);
      throw new Error(`Failed to delete patient records: ${recordsError.message}`);
    }
    
    // Then delete the patient
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting patient:', error);
      throw new Error(`Failed to delete patient: ${error.message}`);
    }
    
    console.log('Patient deleted successfully');
  } catch (error) {
    console.error('Error in deletePatient:', error);
    throw error;
  }
};

// Medical Certificate functions
export const createMedicalCertificate = async (certificateData: {
  medical_record_id: string;
  patient_name: string;
  reason: string;
  recommendations?: string;
  valid_until?: string;
  doctor_name?: string;
}): Promise<MedicalCertificate> => {
  const { data, error } = await supabase
    .from('medical_certificates')
    .insert([{
      ...certificateData,
      doctor_name: certificateData.doctor_name || 'Dr. Medical Officer'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating medical certificate:', error);
    throw error;
  }

  return data;
};

export const fetchMedicalCertificatesByRecord = async (medicalRecordId: string): Promise<MedicalCertificate[]> => {
  const { data, error } = await supabase
    .from('medical_certificates')
    .select('*')
    .eq('medical_record_id', medicalRecordId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching medical certificates:', error);
    throw error;
  }

  return data || [];
};

// New Analytics Functions for College Departments

export interface MonthlyVisitAnalytics {
  month: string;
  college_department: CollegeDepartment;
  total_visits: number;
  unique_patients: number;
  critical_cases: number;
  moderate_cases: number;
  mild_cases: number;
}

export interface CaseAnalyticsByDepartment {
  month: string;
  college_department: CollegeDepartment;
  diagnosis: string;
  case_count: number;
}

// Fetch monthly visit analytics by department
export const fetchMonthlyVisitAnalytics = async (): Promise<MonthlyVisitAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('monthly_visit_analytics')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching monthly visit analytics:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchMonthlyVisitAnalytics:', error);
    throw error;
  }
};

// Fetch case analytics by department
export const fetchCaseAnalyticsByDepartment = async (): Promise<CaseAnalyticsByDepartment[]> => {
  try {
    const { data, error } = await supabase
      .from('case_analytics_by_department')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching case analytics by department:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCaseAnalyticsByDepartment:', error);
    throw error;
  }
};

import * as XLSX from 'xlsx';

// Enhanced Excel Export with College Department and Visit History
export const downloadEnhancedRecordsCSV = async () => {
  try {
    // Fetch all patients with their college departments
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (patientsError) {
      console.error('Error fetching patients for Excel:', patientsError);
      throw patientsError;
    }

    // Fetch all medical records (including inactive ones for complete history)
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .order('date', { ascending: false });

    if (recordsError) {
      console.error('Error fetching medical records for Excel:', recordsError);
      throw recordsError;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Enhanced headers including college department and visit history
    const headers = [
      "Patient ID",
      "Patient Name", 
      "College Department",
      "Age",
      "Gender",
      "Record ID",
      "Visit Date",
      "Status (Active/Inactive)",
      "Severity",
      "Diagnosis",
      "Symptoms/Notes",
      "Doctor Notes",
      "Recommended Actions",
      "Visit Number",
      "Total Visits for Patient",
      "Days Since Last Visit",
      "Created Date",
      "Updated Date"
    ];

    // Group records by patient to track visit history
    const recordsByPatient = records?.reduce((acc, record) => {
      if (!acc[record.patient_id]) {
        acc[record.patient_id] = [];
      }
      acc[record.patient_id].push(record);
      return acc;
    }, {} as Record<string, typeof records>) || {};

    // Process each record with enhanced information
    const data = records?.map((record) => {
      const patient = patients?.find(p => p.id === record.patient_id);
      const patientRecords = recordsByPatient[record.patient_id] || [];
      const visitNumber = patientRecords.length - patientRecords.findIndex(r => r.id === record.id);
      const totalVisits = patientRecords.length;
      
      // Calculate days since last visit
      let daysSinceLastVisit = 0;
      const sortedPatientRecords = patientRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const currentRecordIndex = sortedPatientRecords.findIndex(r => r.id === record.id);
      if (currentRecordIndex > 0) {
        const previousVisit = sortedPatientRecords[currentRecordIndex - 1];
        const currentDate = new Date(record.date);
        const previousDate = new Date(previousVisit.date);
        daysSinceLastVisit = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return [
        patient?.id || "Unknown",
        patient?.name || "Unknown",
        patient?.college_department ? collegeDepartmentNames[patient.college_department] : "Not Specified",
        patient?.age || "Unknown",
        patient?.gender || "Unknown",
        record.id || "Unknown",
        record.date ? new Date(record.date).toLocaleDateString() : "Unknown",
        record.status || "active",
        record.severity || 0,
        record.diagnosis || "No diagnosis",
        record.notes || record.doctor_notes || "",
        record.doctor_notes || "",
        Array.isArray(record.recommended_actions) 
          ? record.recommended_actions.join("; ") 
          : String(record.recommended_actions || ""),
        visitNumber,
        totalVisits,
        daysSinceLastVisit,
        record.created_at ? new Date(record.created_at).toLocaleDateString() : "Unknown",
        record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "Unknown"
      ];
    }) || [];

    // Create the main worksheet with headers and data
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Patient ID
      { wch: 20 }, // Patient Name
      { wch: 25 }, // College Department
      { wch: 8 },  // Age
      { wch: 10 }, // Gender
      { wch: 15 }, // Record ID
      { wch: 12 }, // Visit Date
      { wch: 18 }, // Status
      { wch: 10 }, // Severity
      { wch: 30 }, // Diagnosis
      { wch: 40 }, // Symptoms/Notes
      { wch: 40 }, // Doctor Notes
      { wch: 30 }, // Recommended Actions
      { wch: 12 }, // Visit Number
      { wch: 15 }, // Total Visits
      { wch: 18 }, // Days Since Last Visit
      { wch: 15 }, // Created Date
      { wch: 15 }  // Updated Date
    ];
    ws['!cols'] = columnWidths;

    // Style the header row - make it bold and add background color
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Apply header styling
    for (let i = 0; i < headers.length; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = headerStyle;
    }

    // Add the main worksheet
    XLSX.utils.book_append_sheet(wb, ws, "Medical Records");

    // Create Department Summary worksheet
    const departmentStats = patients?.reduce((acc, patient) => {
      const dept = patient.college_department || 'Not Specified';
      if (!acc[dept]) {
        acc[dept] = {
          totalPatients: 0,
          activePatients: 0,
          totalVisits: 0,
          totalAge: 0
        };
      }
      acc[dept].totalPatients++;
      if (patient.status === 'Active') acc[dept].activePatients++;
      acc[dept].totalVisits += recordsByPatient[patient.id]?.length || 0;
      acc[dept].totalAge += patient.age || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    // Add summary header and data with proper formatting
    const deptSummaryData = [
      ["--- DEPARTMENT SUMMARY ---", "", "", "", ""],
      ["College Department", "Total Patients", "Active Patients", "Total Visits", "Average Age"],
      ...Object.entries(departmentStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dept, stats]) => {
          const avgAge = stats.totalPatients > 0 ? Math.round(stats.totalAge / stats.totalPatients) : 0;
          const deptName = dept !== 'Not Specified' ? collegeDepartmentNames[dept as CollegeDepartment] || dept : dept;
          return [deptName, stats.totalPatients, stats.activePatients, stats.totalVisits, avgAge];
        })
    ];

    // Add empty rows and monthly summary to same sheet
    const combinedSummaryData = [
      ...deptSummaryData,
      [""], // Empty row separator
      ["--- MONTHLY VISIT SUMMARY ---", "", "", "", "", ""],
      ["Month", "Total Visits", "Unique Patients", "Critical Cases", "Moderate Cases", "Mild Cases"]
    ];

    const deptWs = XLSX.utils.aoa_to_sheet(combinedSummaryData);
    
    // Style the section headers (row 0 and monthly header row)
    const sectionHeaderStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const dataHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Style department summary section header
    const deptSectionCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!deptWs[deptSectionCell]) deptWs[deptSectionCell] = {};
    deptWs[deptSectionCell].s = sectionHeaderStyle;

    // Style department data headers (row 1)
    for (let i = 0; i < 5; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: i });
      if (!deptWs[cellAddress]) deptWs[cellAddress] = {};
      deptWs[cellAddress].s = dataHeaderStyle;
    }

    deptWs['!cols'] = [
      { wch: 30 }, // College Department / Month
      { wch: 15 }, // Total Patients / Total Visits
      { wch: 15 }, // Active Patients / Unique Patients
      { wch: 15 }, // Total Visits / Critical Cases
      { wch: 15 }, // Average Age / Moderate Cases
      { wch: 15 }  // Mild Cases
    ];

    // Fetch monthly visit analytics from the database
    const { data: monthlyAnalytics, error: monthlyError } = await supabase
      .from('monthly_visit_analytics')
      .select('*')
      .order('month', { ascending: false });

    if (monthlyError) {
      console.error('Error fetching monthly analytics for Excel:', monthlyError);
      // Fallback to empty data if there's an error
    }

    // Process monthly analytics data for Excel export with fallback to medical_records
    const monthlyDataFromAnalytics = monthlyAnalytics?.map((stat: any) => [
      new Date(stat.month).toISOString().substring(0, 7), // YYYY-MM
      Number(stat.total_visits) || 0,
      Number(stat.unique_patients) || 0,
      Number(stat.critical_cases) || 0,
      Number(stat.moderate_cases) || 0,
      Number(stat.mild_cases) || 0
    ]) || [];

    // Fallback: compute monthly summary from medical_records when analytics is empty
    const monthlyData = (monthlyDataFromAnalytics.length > 0)
      ? monthlyDataFromAnalytics
      : (records || []).reduce((acc: Record<string, any>, record: any) => {
          const month = record?.date ? new Date(record.date).toISOString().substring(0, 7) : 'Unknown';
          if (!acc[month]) {
            acc[month] = {
              totalVisits: 0,
              uniquePatients: new Set<string>(),
              critical: 0,
              moderate: 0,
              mild: 0
            };
          }
          acc[month].totalVisits += 1;
          if (record?.patient_id) acc[month].uniquePatients.add(record.patient_id);
          const sev = Number(record?.severity) || 0;
          if (sev >= 7) acc[month].critical += 1;
          else if (sev >= 4) acc[month].moderate += 1;
          else acc[month].mild += 1;
          return acc;
        }, {} as Record<string, any>);

    const monthlyRows = Array.isArray(monthlyData)
      ? monthlyData
      : Object.entries(monthlyData)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, stats]: any) => [
            month,
            stats.totalVisits,
            stats.uniquePatients instanceof Set ? stats.uniquePatients.size : (stats.uniquePatients || 0),
            stats.critical,
            stats.moderate,
            stats.mild
          ]);

    // Calculate where to start adding monthly data
    const monthlyStartRow = combinedSummaryData.length;

    // Add monthly data using SheetJS helper to update ranges automatically
    XLSX.utils.sheet_add_aoa(deptWs, monthlyRows, { origin: { r: monthlyStartRow, c: 0 } });

    // Style monthly section header
    const monthlySectionRow = combinedSummaryData.length - 2; // The "--- MONTHLY VISIT SUMMARY ---" row
    const monthlySectionCell = XLSX.utils.encode_cell({ r: monthlySectionRow, c: 0 });
    if (!deptWs[monthlySectionCell]) deptWs[monthlySectionCell] = {};
    deptWs[monthlySectionCell].s = sectionHeaderStyle;

    // Style monthly data headers
    const monthlyHeaderRow = combinedSummaryData.length - 1;
    for (let i = 0; i < 6; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: monthlyHeaderRow, c: i });
      if (!deptWs[cellAddress]) deptWs[cellAddress] = {};
      deptWs[cellAddress].s = dataHeaderStyle;
    }

    XLSX.utils.book_append_sheet(wb, deptWs, "Summary Report");

    // Add clearance records export
    try {
      const { data: clearanceData } = await supabase
        .from('clearance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (clearanceData && clearanceData.length > 0) {
        const clearanceHeaders = [
          'ID', 'Medical Record ID', 'Full Name', 'Person Type', 'Age', 'Gender',
          'Position', 'Department/Faculty', 'Status', 'Reason', 'Approved By',
          'Created At', 'Valid Until'
        ];

        const clearanceRows = clearanceData.map((record: any) => [
          record.id,
          record.medical_record_id,
          record.full_name,
          record.person_type,
          record.age,
          record.gender,
          record.position || '',
          record.college_department || record.faculty || '',
          record.clearance_status,
          record.clearance_reason || '',
          record.approved_by || '',
          record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
          record.valid_until ? new Date(record.valid_until).toLocaleDateString() : ''
        ]);

        const clearanceWs = XLSX.utils.aoa_to_sheet([clearanceHeaders, ...clearanceRows]);
        XLSX.utils.book_append_sheet(wb, clearanceWs, 'Clearance Records');
      }
    } catch (error) {
      console.error('Error fetching clearance data:', error);
    }

    // Generate and download the Excel file
    const fileName = `UDM-MEDICAL-RECORD${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return true;
  } catch (error) {
    console.error('Error downloading enhanced Excel:', error);
    throw error;
  }
};
