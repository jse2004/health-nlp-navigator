import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Activity, 
  AlertTriangle, 
  FileText, 
  User, 
  Clock,
  Thermometer,
  Heart,
  Eye
} from 'lucide-react';
import { MedicalRecord, Patient } from '@/data/sampleData';
import { fetchMedicalRecords, fetchPatients } from '@/services/dataService';
import { supabase } from '@/integrations/supabase/client';

interface PatientDetailsModalProps {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ 
  record, 
  isOpen, 
  onClose 
}) => {
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (record && isOpen) {
      loadPatientDetails();
    }
  }, [record, isOpen]);

  // Real-time updates for medical records
  useEffect(() => {
    if (!record?.patient_id || !isOpen) return;

    const channel = supabase
      .channel('patient-details-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_records',
          filter: `patient_id=eq.${record.patient_id}`
        },
        (payload) => {
          console.log('Medical record change detected:', payload);
          // Reload patient details when any medical record for this patient changes
          loadPatientDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [record?.patient_id, isOpen]);

  // Also listen for patient updates
  useEffect(() => {
    if (!record?.patient_id || !isOpen) return;

    const channel = supabase
      .channel('patient-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${record.patient_id}`
        },
        (payload) => {
          console.log('Patient change detected:', payload);
          // Reload patient details when patient info changes
          loadPatientDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [record?.patient_id, isOpen]);

  const loadPatientDetails = async () => {
    if (!record?.patient_id) return;
    
    setIsLoading(true);
    try {
      // Load patient info
      const patients = await fetchPatients();
      const patient = patients.find(p => p.id === record.patient_id);
      setPatientInfo(patient || null);

      // Load patient's medical history
      const history = await fetchMedicalRecords('', record.patient_id, true);
      setPatientHistory(history.sort((a, b) => 
        new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
      ));
    } catch (error) {
      console.error('Error loading patient details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500';
    if (severity >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Patient Details - Medical Record
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading patient details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Information Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-semibold text-lg">{record.patient_name || 'Unknown Patient'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-mono text-sm">{record.patient_id || 'N/A'}</p>
                  </div>
                  {patientInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="font-semibold">{patientInfo.age} years old</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-semibold">{patientInfo.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Status</p>
                        <Badge variant={patientInfo.status === 'Active' ? 'default' : 'secondary'}>
                          {patientInfo.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Visit</p>
                        <p className="font-semibold">
                          {patientInfo.last_visit ? new Date(patientInfo.last_visit).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Visit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Current Visit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Visit Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-semibold">{formatDate(record.date || '')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Record ID</p>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{record.id}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Severity Level</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(record.severity || 0)}`}></div>
                      <span className="font-semibold">{getSeverityLabel(record.severity || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-bold">{record.severity || 0}/10</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-2">Diagnosis</p>
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-red-500 mt-1" />
                    <p className="font-semibold text-gray-900">{record.diagnosis || 'No diagnosis recorded'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Symptoms & Doctor's Notes</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-500 mt-1" />
                      <p className="text-gray-700 leading-relaxed">
                        {record.doctor_notes || record.notes || 'No notes recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                {record.recommended_actions && record.recommended_actions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Recommended Actions</p>
                    <ul className="space-y-1">
                      {record.recommended_actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visit History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Visit History ({patientHistory.length} visits)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientHistory.length > 0 ? (
                  <div className="space-y-3">
                    {patientHistory.map((visit, index) => (
                      <div 
                        key={visit.id} 
                        className={`p-3 rounded-lg border ${
                          visit.id === record.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-sm">
                              {new Date(visit.date || '').toLocaleDateString()}
                            </span>
                            {visit.id === record.id && (
                              <Badge variant="default" className="text-xs">Current Visit</Badge>
                            )}
                            <Badge 
                              variant={visit.status === 'active' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {visit.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(visit.severity || 0)}`}></div>
                            <span className="text-xs text-gray-500">{visit.severity || 0}/10</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{visit.diagnosis || 'No diagnosis'}</p>
                        {visit.doctor_notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {visit.doctor_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No visit history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModal;
