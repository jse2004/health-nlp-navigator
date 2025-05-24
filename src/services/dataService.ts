import { supabase } from '@/integrations/supabase/client';
import { Patient, MedicalRecord } from '@/data/sampleData';

// Fetch patients from Supabase
export const fetchPatients = async (searchQuery?: string): Promise<Patient[]> => {
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
};

// Fetch medical records from Supabase
export const fetchMedicalRecords = async (searchQuery?: string, patientId?: string): Promise<MedicalRecord[]> => {
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
};

// Helper function to find or create a patient
const findOrCreatePatient = async (studentName: string, studentId?: string): Promise<string | null> => {
  if (!studentName) return null;

  try {
    // First, try to find existing patient by name
    let query = supabase
      .from('patients')
      .select('id')
      .eq('name', studentName);

    const { data: existingPatients, error: fetchError } = await query.limit(1);
    
    if (fetchError) {
      console.error('Error fetching existing patient:', fetchError);
      return null;
    }

    // If patient exists, return their ID
    if (existingPatients && existingPatients.length > 0) {
      return existingPatients[0].id;
    }

    // If patient doesn't exist, create a new one
    const newPatient = {
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
  const { id, ...recordData } = record;
  let result;

  // Handle patient connection
  let patientId = null;
  if (recordData.patient_name) {
    patientId = await findOrCreatePatient(recordData.patient_name);
  }

  // Convert Date objects to ISO strings
  const dataToSave = {
    ...recordData,
    patient_id: patientId, // Use the found/created patient ID
    updated_at: new Date().toISOString()
  };
  
  // Handle date conversion with proper type checking
  if (recordData.date) {
    if (recordData.date instanceof Date) {
      dataToSave.date = recordData.date.toISOString();
    } else if (typeof recordData.date === 'string') {
      dataToSave.date = recordData.date;
    } else {
      // For any other type, convert to string
      dataToSave.date = String(recordData.date);
    }
  }

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
      throw error;
    }
    
    result = data;
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('medical_records')
      .insert([{ ...dataToSave }])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting medical record:', error);
      throw error;
    }
    
    result = data;
  }
  
  return result as MedicalRecord;
};

// Save or update a patient
export const savePatient = async (patient: Partial<Patient>): Promise<Patient> => {
  const { id, ...patientData } = patient;
  
  // Map frontend property names to database column names
  const dbPatient: any = {
    ...patientData,
    // Handle specific field mappings if needed
    last_visit: patientData.last_visit,
    medical_history: patientData.medical_history
  };
  
  let result;

  if (id) {
    // Update existing patient
    const { data, error } = await supabase
      .from('patients')
      .update({ ...dbPatient, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
    
    result = data;
  } else {
    // Make sure required fields are present
    if (!dbPatient.name || !dbPatient.age || !dbPatient.gender) {
      throw new Error('Missing required fields for patient');
    }
    
    // Insert new patient
    const { data, error } = await supabase
      .from('patients')
      .insert([dbPatient])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting patient:', error);
      throw error;
    }
    
    result = data;
  }
  
  return result as Patient;
};

// Delete a medical record
export const deleteMedicalRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting medical record:', error);
    throw error;
  }
};

// Delete a patient
export const deletePatient = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};
