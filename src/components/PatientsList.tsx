
import React from 'react';
import { Patient } from '@/data/sampleData';
import PatientCard from './PatientCard';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  isLoading?: boolean;
}

const PatientsList: React.FC<PatientsListProps> = ({ patients, onSelectPatient, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
        </div>
        <p className="text-center py-8">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>New Patient</span>
        </Button>
      </div>
      
      {patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((patient, index) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onClick={onSelectPatient}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No patients found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            Add new patients to start building your database.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
