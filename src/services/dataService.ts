
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

  if (id) {
    // Update existing record
    const { data, error } = await supabase
      .from('medical_records')
      .update({ ...recordData, updated_at: new Date().toISOString() })
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
      .insert([{ ...recordData }])
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
  
  // Map from frontend property names to database column names if needed
  const dbPatient: any = {
    ...patientData
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
