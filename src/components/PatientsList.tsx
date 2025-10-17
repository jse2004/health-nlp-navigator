
import React, { useState } from 'react';
import { Patient, MedicalRecord } from '@/data/sampleData';
import PatientCard from './PatientCard';
import PatientDetailsModal from './PatientDetailsModal';
import { Button } from '@/components/ui/button';
import { UserPlus, Info } from 'lucide-react';
import { fetchMedicalRecords } from '@/services/dataService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  isLoading?: boolean;
}

const PatientsList: React.FC<PatientsListProps> = ({ patients, onSelectPatient, isLoading = false }) => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleDetailsClick = async (patient: Patient) => {
    console.log('Details clicked for patient:', patient);
    try {
      const records = await fetchMedicalRecords('', patient.id, true);
      console.log('Fetched records:', records);
      
      if (records.length > 0) {
        const sortedRecords = records.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
        setSelectedRecord(sortedRecords[0]);
        setIsDetailsOpen(true);
        console.log('Opening modal with record:', sortedRecords[0]);
      } else {
        const dummyRecord: MedicalRecord = {
          id: `temp-${patient.id}`,
          patient_id: patient.id,
          patient_name: patient.name,
          diagnosis: 'No diagnosis available',
          doctor_notes: 'No medical records found for this patient.',
          notes: '',
          severity: 0,
          date: new Date().toISOString(),
          recommended_actions: [],
          status: 'active'
        };
        setSelectedRecord(dummyRecord);
        setIsDetailsOpen(true);
        console.log('Opening modal with dummy record (no records found)');
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Patients</h2>
        </div>
        <p className="text-center py-8 text-muted-foreground">Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Patients</h2>
      </div>
      
      {patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onClick={onSelectPatient}
              onDetailsClick={handleDetailsClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <UserPlus className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No Patients Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Your patient list is currently empty. Start by adding a new patient record.
          </p>
          <Alert className="max-w-md mx-auto mt-6 text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Did you know?</AlertTitle>
            <AlertDescription>
              You can also create new patients directly from the "New Medical Record" form. The system will automatically create a new patient if the name does not exist.
            </AlertDescription>
          </Alert>
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
