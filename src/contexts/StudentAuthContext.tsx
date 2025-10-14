import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  patient_id: string;
  student_id: string;
  patient_name: string;
  age: number;
  gender: string;
}

interface StudentAuthContextType {
  student: StudentData | null;
  loading: boolean;
  login: (studentId: string, verificationName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const sessionToken = localStorage.getItem('student_session_token');
      if (sessionToken) {
        const { data, error } = await supabase.rpc('get_student_by_session', {
          _session_token: sessionToken
        });

        if (error) {
          console.error('Session fetch error:', error);
          localStorage.removeItem('student_session_token');
        } else {
          const row = Array.isArray(data) ? data[0] : data;
          if (row && row.patient_id) {
            setStudent(row as StudentData);
          } else {
            localStorage.removeItem('student_session_token');
          }
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (studentId: string, verificationName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Normalize inputs
      const _studentId = studentId.trim();
      const _verificationName = verificationName.trim().replace(/\s+/g, ' ');

      // Validate credentials
      const { data: validationData, error: validationError } = await supabase.rpc('validate_student_credentials', {
        _student_id: _studentId,
        _verification_name: _verificationName
      });

      if (validationError) {
        console.error('Validation error:', validationError);
        return { success: false, error: 'Unable to verify credentials. Please try again.' };
      }

      const patientData: any = Array.isArray(validationData) ? validationData[0] : validationData;
      if (!patientData || !patientData.patient_id) {
        return { success: false, error: 'Invalid Student ID or Name. Please check your credentials.' };
      }

      // Create session
      const { data: sessionToken, error: sessionError } = await supabase.rpc('create_student_session', {
        _patient_id: patientData.patient_id,
        _student_id: _studentId
      });

      if (sessionError || !sessionToken) {
        console.error('Session creation error:', sessionError);
        return { success: false, error: 'Failed to create session. Please try again.' };
      }

      // Store session token
      localStorage.setItem('student_session_token', String(sessionToken));

      // Fetch student data
      const { data: studentData, error: fetchError } = await supabase.rpc('get_student_by_session', {
        _session_token: String(sessionToken)
      });

      if (fetchError) {
        console.error('Fetch student by session error:', fetchError);
        return { success: false, error: 'Failed to fetch student data.' };
      }

      const studentRow: any = Array.isArray(studentData) ? studentData[0] : studentData;
      if (studentRow && studentRow.patient_id) {
        setStudent(studentRow as StudentData);
        return { success: true };
      }

      return { success: false, error: 'Failed to fetch student data.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('student_session_token');
    setStudent(null);
  };

  const value = {
    student,
    loading,
    login,
    logout,
  };

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
};
