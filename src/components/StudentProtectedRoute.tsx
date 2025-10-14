import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '@/contexts/StudentAuthContext';

interface StudentProtectedRouteProps {
  children: React.ReactNode;
}

const StudentProtectedRoute: React.FC<StudentProtectedRouteProps> = ({ children }) => {
  const { student, loading } = useStudentAuth();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('student_session_token');

  // Show loader while either provider is loading OR we have a token but context
  // hasn't populated yet (prevents redirect bounce immediately after login)
  if (loading || (hasToken && !student)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

export default StudentProtectedRoute;
