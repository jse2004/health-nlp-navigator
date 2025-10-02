import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, FileText, Activity, Pill, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  severity: number;
  doctor_notes: string;
  status: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_type: string;
  issue_date: string;
  reason: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  reaction_description: string;
}

const StudentDashboard = () => {
  const { student, logout, loading } = useStudentAuth();
  const navigate = useNavigate();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !student) {
      navigate('/student');
    }
  }, [student, loading, navigate]);

  useEffect(() => {
    if (student) {
      fetchStudentData();
    }
  }, [student]);

  const fetchStudentData = async () => {
    if (!student) return;

    try {
      // Fetch medical records
      const { data: recordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', student.patient_id)
        .order('date', { ascending: false });

      if (recordsData) setMedicalRecords(recordsData);

      // Fetch certificates
      if (recordsData && recordsData.length > 0) {
        const recordIds = recordsData.map(r => r.id);
        const { data: certsData } = await supabase
          .from('medical_certificates')
          .select('*')
          .in('medical_record_id', recordIds)
          .order('issue_date', { ascending: false });

        if (certsData) setCertificates(certsData);
      }

      // Fetch allergies
      const { data: allergiesData } = await supabase
        .from('patient_allergies')
        .select('*')
        .eq('patient_id', student.patient_id)
        .eq('is_active', true);

      if (allergiesData) setAllergies(allergiesData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/student');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) return null;

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'destructive';
    if (severity >= 4) return 'default';
    return 'secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Student Medical Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {student.patient_name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Student Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{student.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{student.age}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allergies Alert */}
        {allergies.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Active Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allergies.map((allergy) => (
                  <div key={allergy.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium">{allergy.allergen}</p>
                      {allergy.reaction_description && (
                        <p className="text-sm text-muted-foreground">{allergy.reaction_description}</p>
                      )}
                    </div>
                    <Badge variant={allergy.severity === 'severe' ? 'destructive' : 'secondary'}>
                      {allergy.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Medical Records
              </CardTitle>
              <CardDescription>Your clinic visit history</CardDescription>
            </CardHeader>
            <CardContent>
              {medicalRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No medical records found</p>
              ) : (
                <div className="space-y-3">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {record.severity && (
                          <Badge variant={getSeverityColor(record.severity)}>
                            Severity: {record.severity}/10
                          </Badge>
                        )}
                      </div>
                      {record.diagnosis && (
                        <p className="text-sm mb-1">
                          <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                        </p>
                      )}
                      {record.doctor_notes && (
                        <p className="text-sm text-muted-foreground">{record.doctor_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Certificates
              </CardTitle>
              <CardDescription>Issued certificates and clearances</CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No certificates found</p>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{cert.certificate_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(cert.issue_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">{cert.certificate_type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{cert.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
