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

        if (data && data.length > 0) {
          setStudent(data[0]);
        } else {
          localStorage.removeItem('student_session_token');
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
      const _verificationName = verificationName.trim();

      // Validate credentials
      const { data: validationData, error: validationError } = await supabase.rpc('validate_student_credentials', {
        _student_id: _studentId,
        _verification_name: _verificationName
      });

      if (validationError || !validationData || validationData.length === 0) {
        return { success: false, error: 'Invalid Student ID or Name. Please check your credentials.' };
      }

      const patientData = validationData[0];

      // Create session
      const { data: sessionToken, error: sessionError } = await supabase.rpc('create_student_session', {
        _patient_id: patientData.patient_id,
        _student_id: studentId
      });

      if (sessionError || !sessionToken) {
        return { success: false, error: 'Failed to create session. Please try again.' };
      }

      // Store session token
      localStorage.setItem('student_session_token', sessionToken);

      // Fetch student data
      const { data: studentData } = await supabase.rpc('get_student_by_session', {
        _session_token: sessionToken
      });

      if (studentData && studentData.length > 0) {
        setStudent(studentData[0]);
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
