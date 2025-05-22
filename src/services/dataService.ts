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

// Save or update a medical record
export const saveMedicalRecord = async (record: Partial<MedicalRecord>): Promise<MedicalRecord> => {
  const { id, ...recordData } = record;
  let result;

  // Convert Date objects to ISO strings
  const dataToSave = {
    ...recordData,
    updated_at: new Date().toISOString()
  };
  
  // Make sure date is an ISO string with proper null checks
  if (recordData.date) {
    // Check if it's a Date object by testing for the toISOString method
    if (typeof recordData.date === 'object' && recordData.date !== null && 
        typeof (recordData.date as Date).toISOString === 'function') {
      dataToSave.date = (recordData.date as Date).toISOString();
    }
    // If it's already a string, keep it as is
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
