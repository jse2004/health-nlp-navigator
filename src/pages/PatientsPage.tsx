import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import PatientsList from '@/components/PatientsList';
import SearchBar from '@/components/SearchBar';
import { fetchPatients } from '@/services/dataService';
import { Patient } from '@/data/sampleData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PatientsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const patientsData = await fetchPatients(searchQuery);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [searchQuery]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('patients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        loadPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
            <p className="text-muted-foreground">Manage and view all patient records</p>
          </div>
        </div>
        <SearchBar 
          onSearch={setSearchQuery}
          placeholder="Search patients by name, condition, or status..."
        />
      </div>
      <PatientsList 
        patients={patients} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default PatientsPage;
