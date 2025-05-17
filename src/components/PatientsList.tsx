
import React from 'react';
import { Patient } from '@/data/sampleData';
import PatientCard from './PatientCard';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
}

const PatientsList: React.FC<PatientsListProps> = ({ patients, onSelectPatient }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>New Patient</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {patients.map((patient, index) => (
          <PatientCard 
            key={patient.id} 
            patient={patient} 
            onClick={onSelectPatient}
          />
        ))}
      </div>
    </div>
  );
};

export default PatientsList;
