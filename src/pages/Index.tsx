import React, { useState, useEffect } from 'react';
import { BarChart3, Users } from 'lucide-react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import PatientsList from '@/components/PatientsList';
import SearchBar from '@/components/SearchBar';
import { fetchPatients } from '@/services/dataService';
import { Patient } from '@/data/sampleData';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Load patients when the patients section is active
  useEffect(() => {
    if (activeSection === 'patients') {
      loadPatients();
    }
  }, [activeSection, searchQuery]);

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const patientsData = await fetchPatients(searchQuery);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handlePatientSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
              <SearchBar 
                onSearch={handlePatientSearch}
                placeholder="Search patients by name, condition, or status..."
              />
            </div>
            <PatientsList 
              patients={patients} 
              isLoading={isLoadingPatients}
            />
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <Header />
      
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Navigation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a section</p>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all ${
                  activeSection === 'dashboard'
                    ? 'bg-medical-primary text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveSection('patients')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all ${
                  activeSection === 'patients'
                    ? 'bg-medical-primary text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Patients</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;