import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Activity, 
  AlertTriangle, 
  FileText, 
  User, 
  Clock,
  Thermometer,
  Heart,
  Eye,
  Edit,
  Save,
  X,
  Download,
  Printer
} from 'lucide-react';
import { MedicalRecord, Patient } from '@/data/sampleData';
import { fetchMedicalRecords, fetchPatients, saveMedicalRecord, savePatient } from '@/services/dataService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Edit form state
  const [editedRecord, setEditedRecord] = useState<Partial<MedicalRecord>>({});
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});

  useEffect(() => {
    if (record && isOpen) {
      loadPatientDetails();
      setEditedRecord(record);
    }
  }, [record, isOpen]);

  useEffect(() => {
    if (patientInfo) {
      setEditedPatient(patientInfo);
    }
  }, [patientInfo]);

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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Save patient info
      if (patientInfo && editedPatient) {
        await savePatient({
          ...patientInfo,
          ...editedPatient
        });
      }

      // Save medical record
      if (record && editedRecord) {
        await saveMedicalRecord({
          ...record,
          ...editedRecord
        });
      }

      toast({
        title: "Changes saved",
        description: "Patient details updated successfully",
      });

      setIsEditMode(false);
      await loadPatientDetails();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedRecord(record || {});
    setEditedPatient(patientInfo || {});
    setIsEditMode(false);
  };

  const generateIndividualRecordPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Record', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Record ID: ${record?.id}`, pageWidth / 2, 28, { align: 'center' });
    pdf.text(`Date: ${record?.date ? formatDate(record.date) : 'N/A'}`, pageWidth / 2, 34, { align: 'center' });
    
    // Patient Information
    let yPos = 45;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Information', 15, yPos);
    
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${record?.patient_name || 'N/A'}`, 15, yPos);
    yPos += 6;
    pdf.text(`Patient ID: ${record?.patient_id || 'N/A'}`, 15, yPos);
    yPos += 6;
    if (patientInfo?.student_id) {
      pdf.text(`Student ID: ${patientInfo.student_id}`, 15, yPos);
      yPos += 6;
    }
    pdf.text(`Age: ${patientInfo?.age || 'N/A'} | Gender: ${patientInfo?.gender || 'N/A'}`, 15, yPos);
    
    // Medical Details
    yPos += 12;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Details', 15, yPos);
    
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Severity Level: ${getSeverityLabel(record?.severity || 0)} (${record?.severity || 0}/10)`, 15, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Diagnosis:', 15, yPos);
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    const diagnosisLines = pdf.splitTextToSize(record?.diagnosis || 'No diagnosis recorded', pageWidth - 30);
    pdf.text(diagnosisLines, 15, yPos);
    yPos += diagnosisLines.length * 6 + 4;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Doctor\'s Notes:', 15, yPos);
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    const notesLines = pdf.splitTextToSize(record?.doctor_notes || 'No notes recorded', pageWidth - 30);
    pdf.text(notesLines, 15, yPos);
    yPos += notesLines.length * 6 + 4;
    
    if (record?.recommended_actions && record.recommended_actions.length > 0) {
      yPos += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommended Actions:', 15, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      record.recommended_actions.forEach((action) => {
        const actionLines = pdf.splitTextToSize(`• ${action}`, pageWidth - 30);
        pdf.text(actionLines, 15, yPos);
        yPos += actionLines.length * 6;
      });
    }
    
    pdf.save(`Medical_Record_${record?.id}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Individual medical record has been downloaded",
    });
  };

  const generateMedicalCertificatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const lineSpacing = 14; // 2.0 line spacing in mm (approximately)
    const leftMargin = 25;
    const rightMargin = 25;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Header - UNIVERSIDAD DE MANILA
    let yPos = 40;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNIVERSIDAD DE MANILA', pageWidth / 2, yPos, { align: 'center' });
    
    // Certificate Number
    yPos += lineSpacing * 1.5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`CERTIFICATE NO: CERT-${record?.id}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Date
    yPos += lineSpacing;
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(`Date: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    
    // TO WHOM IT MAY CONCERN
    yPos += lineSpacing * 2;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TO WHOM IT MAY CONCERN:', leftMargin, yPos);
    
    // Main certification text
    yPos += lineSpacing * 2;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    
    const visitDate = record?.date ? new Date(record.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : currentDate;
    
    const certificationText = `This is to certify that ${record?.patient_name || 'N/A'}, ${patientInfo?.age || 'N/A'}, has been seen, examined, and/or treated on ${visitDate} with the following findings: ${record?.diagnosis || 'N/A'}.`;
    
    const certLines = pdf.splitTextToSize(certificationText, contentWidth);
    certLines.forEach((line: string) => {
      pdf.text(line, leftMargin, yPos);
      yPos += lineSpacing;
    });
    
    // Disclaimer text
    yPos += lineSpacing;
    const disclaimerText = 'This certificate is issued upon his/her request for whatever purpose it may serve, except for Medico-Legal cases.';
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth);
    disclaimerLines.forEach((line: string) => {
      pdf.text(line, leftMargin, yPos);
      yPos += lineSpacing;
    });
    
    // Recommendation section
    yPos += lineSpacing * 2;
    pdf.text('Recommendation: ___________________________', leftMargin, yPos);
    
    // University Physician section at bottom
    const bottomMargin = 40;
    yPos = pageHeight - bottomMargin;
    pdf.text('University Physician: ________________________', leftMargin, yPos);
    
    pdf.save(`Medical_Certificate_${record?.patient_name}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Certificate Downloaded",
      description: "Medical certificate has been downloaded",
    });
  };

  const handlePrintIndividualRecord = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Individual medical record ready to print",
    });
  };

  const handlePrintCertificate = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Medical certificate ready to print",
    });
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Patient Details - Medical Record
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={generateIndividualRecordPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Record PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateMedicalCertificatePDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Certificate PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintIndividualRecord}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setIsEditMode(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and edit patient information and medical records
          </DialogDescription>
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
                    <Label className="text-sm text-muted-foreground">Patient Name</Label>
                    {isEditMode ? (
                      <Input 
                        value={editedPatient.name || ''} 
                        onChange={(e) => setEditedPatient({...editedPatient, name: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-semibold text-lg mt-1">{record.patient_name || 'Unknown Patient'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Patient ID</Label>
                    <p className="font-mono text-sm mt-1">{record.patient_id || 'N/A'}</p>
                  </div>
                  {patientInfo && (
                    <>
                      {patientInfo.student_id && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Student ID</Label>
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1">{patientInfo.student_id}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm text-muted-foreground">Age</Label>
                        {isEditMode ? (
                          <Input 
                            type="number"
                            value={editedPatient.age || ''} 
                            onChange={(e) => setEditedPatient({...editedPatient, age: parseInt(e.target.value)})}
                            className="mt-1"
                          />
                        ) : (
                          <p className="font-semibold mt-1">{patientInfo.age} years old</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Gender</Label>
                        {isEditMode ? (
                          <Select 
                            value={editedPatient.gender || patientInfo.gender} 
                            onValueChange={(value) => setEditedPatient({...editedPatient, gender: value as 'Male' | 'Female' | 'Other'})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold mt-1">{patientInfo.gender}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Current Status</Label>
                        <div className="mt-1">
                          <Badge variant={patientInfo.status === 'Active' ? 'default' : 'secondary'}>
                            {patientInfo.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Last Visit</Label>
                        <p className="font-semibold mt-1">
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
                  <Label className="text-sm text-muted-foreground mb-1">Severity Level</Label>
                  {isEditMode ? (
                    <div className="mt-2">
                      <Input 
                        type="number"
                        min="0"
                        max="10"
                        value={editedRecord.severity || 0} 
                        onChange={(e) => setEditedRecord({...editedRecord, severity: parseInt(e.target.value)})}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(record.severity || 0)}`}></div>
                        <span className="font-semibold">{getSeverityLabel(record.severity || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">{record.severity || 0}/10</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="text-sm text-muted-foreground mb-2">Diagnosis</Label>
                  {isEditMode ? (
                    <Textarea 
                      value={editedRecord.diagnosis || ''} 
                      onChange={(e) => setEditedRecord({...editedRecord, diagnosis: e.target.value})}
                      className="mt-2"
                      rows={3}
                    />
                  ) : (
                    <div className="flex items-start gap-2 mt-2">
                      <Heart className="h-4 w-4 text-red-500 mt-1" />
                      <p className="font-semibold">{record.diagnosis || 'No diagnosis recorded'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2">Symptoms & Doctor's Notes</Label>
                  {isEditMode ? (
                    <Textarea 
                      value={editedRecord.doctor_notes || ''} 
                      onChange={(e) => setEditedRecord({...editedRecord, doctor_notes: e.target.value})}
                      className="mt-2"
                      rows={4}
                    />
                  ) : (
                    <div className="bg-muted p-4 rounded-lg mt-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-1" />
                        <p className="leading-relaxed">
                          {record.doctor_notes || record.notes || 'No notes recorded'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {record.recommended_actions && record.recommended_actions.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2">Recommended Actions</Label>
                    <ul className="space-y-1">
                      {record.recommended_actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <span>{action}</span>
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
                            ? 'bg-primary/10 border-primary/20' 
                            : 'bg-muted border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
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
                            <span className="text-xs text-muted-foreground">{visit.severity || 0}/10</span>
                          </div>
                        </div>
                        <p className="text-sm">{visit.diagnosis || 'No diagnosis'}</p>
                        {visit.doctor_notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {visit.doctor_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">No visit history available</p>
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
