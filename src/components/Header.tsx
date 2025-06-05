
import React from 'react';
import { BellDot, Search, User, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of the system.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 py-4 px-6 flex justify-between items-center transition-colors shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-medical-primary to-blue-600 flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-medical-primary to-blue-600 bg-clip-text text-transparent">
            UDM CARE
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Healthcare Analytics Platform</p>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search patients, records, or insights..."
            className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm rounded-xl block w-full pl-12 pr-4 py-3 focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105">
          <BellDot className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-medical-primary to-blue-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-700 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
