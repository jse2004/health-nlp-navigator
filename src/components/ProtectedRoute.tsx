
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Heart, TrendingUp } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-medical-primary to-blue-600 flex items-center justify-center mx-auto shadow-2xl animate-pulse-gentle">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-ping"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">UDM CARE</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Loading your healthcare dashboard...</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 border-4 border-medical-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Initializing platform...</span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-8 text-gray-400 dark:text-gray-600">
            <div className="flex flex-col items-center space-y-2">
              <Heart className="w-6 h-6 animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="text-xs">Patient Care</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <TrendingUp className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-xs">Analytics</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Activity className="w-6 h-6 animate-pulse" style={{ animationDelay: '1s' }} />
              <span className="text-xs">Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
