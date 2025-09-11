
import React, { useState } from 'react';
import { Patient, MedicalRecord } from '@/data/sampleData';
import PatientCard from './PatientCard';
import PatientDetailsModal from './PatientDetailsModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { fetchMedicalRecords } from '@/services/dataService';

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  isLoading?: boolean;
}

const PatientsList: React.FC<PatientsListProps> = ({ patients, onSelectPatient, isLoading = false }) => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleDetailsClick = async (patient: Patient) => {
    try {
      // Fetch the most recent medical record for this patient
      const records = await fetchMedicalRecords('', patient.id, true);
      if (records.length > 0) {
        // Sort by date to get the most recent record
        const sortedRecords = records.sort((a, b) => 
          new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
        );
        setSelectedRecord(sortedRecords[0]);
        setIsDetailsOpen(true);
      } else {
        // Create a dummy record if none exists
        const dummyRecord: MedicalRecord = {
          id: `temp-${patient.id}`,
          patient_id: patient.id,
          patient_name: patient.name,
          diagnosis: 'No diagnosis available',
          doctor_notes: 'No medical records found for this patient',
          notes: '',
          severity: 0,
          date: new Date().toISOString(),
          recommended_actions: []
        };
        setSelectedRecord(dummyRecord);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
    }
  };
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
              onDetailsClick={handleDetailsClick}
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
      
      <PatientDetailsModal
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default PatientsList;
