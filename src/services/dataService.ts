
import { supabase } from '@/integrations/supabase/client';
import { Patient, MedicalRecord } from '@/data/sampleData';

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

// Fetch patients from Supabase
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
    
    return data as Patient[] || [];
  } catch (error) {
    console.error('Error in fetchPatients:', error);
    throw error;
  }
};

// Fetch medical records from Supabase
export const fetchMedicalRecords = async (searchQuery?: string, patientId?: string): Promise<MedicalRecord[]> => {
  try {
    let query = supabase
      .from('medical_records')
      .select('*');

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

// Helper function to find or create a patient
const findOrCreatePatient = async (studentName: string): Promise<string | null> => {
  if (!studentName) return null;

  try {
    // First, try to find existing patient by name
    const { data: existingPatients, error: fetchError } = await supabase
      .from('patients')
      .select('id')
      .eq('name', studentName)
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing patient:', fetchError);
      return null;
    }

    // If patient exists, return their ID
    if (existingPatients && existingPatients.length > 0) {
      return existingPatients[0].id;
    }

    // If patient doesn't exist, create a new one
    const patientId = await generatePatientId();
    const newPatient = {
      id: patientId,
      name: studentName,
      age: 20, // Default age for student
      gender: 'Unknown', // Default gender
      condition: 'Student Health Check',
      status: 'Active',
      last_visit: new Date().toISOString().split('T')[0], // Today's date
      medical_history: []
    };

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
    console.error('Error in findOrCreatePatient:', error);
    return null;
  }
};

// Save or update a medical record
export const saveMedicalRecord = async (record: Partial<MedicalRecord>): Promise<MedicalRecord> => {
  try {
    const { id, ...recordData } = record;
    
    // Handle patient connection
    let patientId = recordData.patient_id;
    if (recordData.patient_name && !patientId) {
      patientId = await findOrCreatePatient(recordData.patient_name);
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

// Delete a medical record
export const deleteMedicalRecord = async (id: string): Promise<void> => {
  try {
    console.log('Deleting medical record with ID:', id);
    
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting medical record:', error);
      throw new Error(`Failed to delete record: ${error.message}`);
    }
    
    console.log('Medical record deleted successfully');
  } catch (error) {
    console.error('Error in deleteMedicalRecord:', error);
    throw error;
  }
};

// Get analytics data with historical comparison
export const getAnalyticsData = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all patients and records
    const [patientsResponse, recordsResponse] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('medical_records').select('*')
    ]);

    if (patientsResponse.error) throw patientsResponse.error;
    if (recordsResponse.error) throw recordsResponse.error;

    const patients = patientsResponse.data || [];
    const records = recordsResponse.data || [];

    // Current metrics
    const totalPatients = patients.length;
    const criticalCases = patients.filter(p => p.status === 'Critical').length;
    const pendingReviews = records.filter(r => !r.diagnosis || r.diagnosis.trim() === '').length;
    const recentAdmissions = records.filter(r => {
      if (!r.created_at) return false;
      const recordDate = new Date(r.created_at);
      return recordDate >= oneWeekAgo;
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
