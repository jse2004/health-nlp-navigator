
import React from 'react';
import { Patient } from '@/data/sampleData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { User } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick?: (patient: Patient) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  // Function to get badge color based on status
  const getStatusBadgeClass = () => {
    switch (patient.status) {
      case 'Critical':
        return 'badge-critical';
      case 'Warning':
        return 'badge-warning';
      case 'Normal':
        return 'badge-normal';
      case 'Active':
        return 'badge-success';
      case 'Inactive':
        return 'badge-muted';
      default:
        return 'badge-normal';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick?.(patient)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 rounded-full p-3">
            <User className="h-6 w-6 text-medical-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
              <span className={`${getStatusBadgeClass()}`}>
                {patient.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {patient.age} years, {patient.gender}
            </p>
            <p className="text-sm font-medium mt-1">
              {patient.condition}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-3 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Last visit: {patient.last_visit}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-medical-primary hover:text-medical-accent"
        >
          View Records
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;
