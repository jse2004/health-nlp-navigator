
import React, { useState, useEffect } from 'react';
import { MedicalRecord } from '@/data/sampleData';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clipboard, FileText, BarChart, Award, Stethoscope, Download, Save, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { saveMedicalRecord, createMedicalCertificate, fetchMedicalCertificatesByRecord, type MedicalCertificate } from '@/services/dataService';
import MedicalCertificateComponent from './MedicalCertificate';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, TextRun, BorderStyle } from 'docx';

interface MedicalRecordAnalysisProps {
  record?: MedicalRecord;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const MedicalRecordAnalysis: React.FC<MedicalRecordAnalysisProps> = ({ 
  record, 
  isOpen,
  onClose,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [editedRecord, setEditedRecord] = useState<Partial<MedicalRecord>>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<MedicalCertificate | null>(null);
  
  // Initialize edited record when the record changes
  useEffect(() => {
    if (record) {
      setEditedRecord({ 
        ...record,
        // Initialize person type fields if not present
        person_type: record.person_type || 'professor',
        full_name: record.full_name || record.patient_name || '',
        age: record.age || 20,
        gender: record.gender || 'Male',
        position: record.position || '',
        faculty: record.faculty || '',
        college_department: record.college_department || 'CED'
      });
      
      // Analyze the doctor's notes using our NLP utility
      const doctorNotes = record.doctor_notes || record.notes || '';
      const result = analyzeMedicalText(doctorNotes);
      setAnalysisResult(result);
      
      // Load existing certificates
      loadCertificates();
    }
  }, [record]);

  // Load certificates for this record
  const loadCertificates = async () => {
    if (!record?.id) return;
    
    try {
      const certificatesData = await fetchMedicalCertificatesByRecord(record.id);
      setCertificates(certificatesData);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };
  
  // If no record is selected, don't render anything
  if (!record) {
    return null;
  }

  // Handle save
  const handleSave = async () => {
    if (!editedRecord) return;
    
    setIsSaving(true);
    try {
      await saveMedicalRecord(editedRecord);
      toast.success("Medical record saved successfully");
      if (onSaved) onSaved();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error("Failed to save medical record");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle input change
  const handleInputChange = (field: keyof MedicalRecord, value: any) => {
    setEditedRecord(prev => ({ ...prev, [field]: value }));
  };

  // Handle recommended action change
  const handleActionChange = (index: number, value: string) => {
    const updatedActions = [...(editedRecord.recommended_actions || [])];
    updatedActions[index] = value;
    handleInputChange('recommended_actions', updatedActions);
  };

  // Add a new recommended action
  const addRecommendedAction = () => {
    const updatedActions = [...(editedRecord.recommended_actions || []), ''];
    handleInputChange('recommended_actions', updatedActions);
  };

  // Remove a recommended action
  const removeRecommendedAction = (index: number) => {
    const updatedActions = [...(editedRecord.recommended_actions || [])];
    updatedActions.splice(index, 1);
    handleInputChange('recommended_actions', updatedActions);
  };

  // Calculate severity level label
  const getSeverityLabel = (value: number) => {
    if (value >= 8) return { label: "High", color: "text-medical-critical" };
    if (value >= 5) return { label: "Medium", color: "text-medical-warning" };
    return { label: "Low", color: "text-medical-success" };
  };
  
  const severityInfo = getSeverityLabel(editedRecord.severity || 0);

  // Download record as Word document
  const downloadRecord = async () => {
    try {
      const formattedDate = editedRecord.date 
        ? new Date(editedRecord.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'N/A';

      const recommendedActionsText = (editedRecord.recommended_actions || [])
        .map((action, i) => `${i + 1}. ${action}`)
        .join('\n');

      // Create Word document with table
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Personal Health Record",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Medical Record", bold: true, size: 28 })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Divider row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ text: "--------------" })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Record ID
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Record ID: ", bold: true }),
                            new TextRun({ text: editedRecord.id || 'N/A' })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Date
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Date: ", bold: true }),
                            new TextRun({ text: formattedDate })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Patient
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Patient: ", bold: true }),
                            new TextRun({ text: `"${editedRecord.patient_name || 'Unknown'}"` })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Empty row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Diagnosis
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Diagnosis: ", bold: true }),
                            new TextRun({ text: editedRecord.diagnosis || 'N/A' })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Empty row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Doctor's Notes
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Doctor's Notes:", bold: true })]
                        }),
                        new Paragraph({
                          text: editedRecord.doctor_notes || editedRecord.notes || 'N/A'
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Empty row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Severity
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Severity: ", bold: true }),
                            new TextRun({ text: `${editedRecord.severity || 0}/10` })
                          ]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Empty row
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                }),
                // Recommended Actions
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Recommended Actions:", bold: true })]
                        }),
                        new Paragraph({
                          text: recommendedActionsText || 'None'
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }]
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-record-${editedRecord.id}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Medical record downloaded as Word document');
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast.error('Failed to generate Word document');
    }
  };

  // Create medical certificate
  const handleCreateCertificate = async () => {
    if (!editedRecord || !editedRecord.id) {
      toast.error('Please save the record first');
      return;
    }

    try {
      const certificateData = {
        medical_record_id: editedRecord.id,
        patient_name: editedRecord.patient_name || 'Unknown Patient',
        reason: editedRecord.diagnosis || 'Medical consultation',
        recommendations: editedRecord.recommended_actions?.join('; '),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        doctor_name: 'Dr. Medical Officer'
      };

      const certificate = await createMedicalCertificate(certificateData);
      
      // Refresh certificates list
      await loadCertificates();
      
      // Show the certificate
      setSelectedCertificate(certificate);
      setIsCertificateOpen(true);
      
      toast.success('Medical certificate created successfully');
    } catch (error) {
      console.error('Error creating certificate:', error);
      toast.error('Failed to create medical certificate');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full md:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl">Medical Record And Analysis</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              {isEditing ? (
                <Input
                  value={editedRecord.diagnosis || ''}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className="font-semibold text-lg"
                  placeholder="Diagnosis"
                />
              ) : (
                <h2 className="text-lg font-semibold">{editedRecord.diagnosis}</h2>
              )}
              <p className="text-sm text-gray-500">Record ID: {editedRecord.id} • {new Date(editedRecord.date || '').toLocaleDateString()}</p>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={editedRecord.severity || 5} 
                  onChange={(e) => handleInputChange('severity', parseInt(e.target.value))}
                  className="w-16" 
                />
                <span className="text-sm self-center">/10</span>
              </div>
            ) : (
              <Badge 
                className={`${severityInfo.color} bg-opacity-10`}
                variant="outline"
              >
                Severity: {severityInfo.label}
              </Badge>
            )}
          </div>
          
          {/* Person Type Selection - only show when editing */}
          {isEditing && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Person Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="person_type">Person Type</Label>
                    <Select
                      value={editedRecord.person_type || 'professor'}
                      onValueChange={(value) => handleInputChange('person_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editedRecord.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={editedRecord.age || ''}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                      placeholder="Enter age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editedRecord.gender || 'Male'}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(editedRecord.person_type === 'professor' || editedRecord.person_type === 'employee') && (
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={editedRecord.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Enter position"
                    />
                  </div>
                )}

                {editedRecord.person_type === 'professor' && (
                  <div>
                    <Label htmlFor="college_department">College Department</Label>
                    <Select
                      value={editedRecord.college_department || 'CED'}
                      onValueChange={(value) => handleInputChange('college_department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CED">College of Education</SelectItem>
                        <SelectItem value="CCS">College of Computing Science</SelectItem>
                        <SelectItem value="CCJ">College of Criminal Justice</SelectItem>
                        <SelectItem value="CHS">College of Health Science</SelectItem>
                        <SelectItem value="CAS">College of Arts and Science</SelectItem>
                        <SelectItem value="CBA">College of Business Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editedRecord.person_type === 'employee' && (
                  <div>
                    <Label htmlFor="faculty">Faculty</Label>
                    <Input
                      id="faculty"
                      value={editedRecord.faculty || ''}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      placeholder="Enter faculty"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mb-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadRecord}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateCertificate}
              className="flex items-center gap-1 text-primary hover:text-primary"
              disabled={!editedRecord?.id}
            >
              <FileCheck className="h-4 w-4" />
              <span>Medical Certificate</span>
            </Button>
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditedRecord({ ...record });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
              <TabsTrigger value="entities" className="text-xs">Entities</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Doctor's Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {isEditing ? (
                    <Textarea
                      value={editedRecord.doctor_notes || editedRecord.notes || ''}
                      onChange={(e) => {
                        const notes = e.target.value;
                        handleInputChange('doctor_notes', notes);
                        // Re-analyze the text
                        const result = analyzeMedicalText(notes);
                        setAnalysisResult(result);
                      }}
                      className="min-h-[150px]"
                      placeholder="Enter doctor's notes"
                    />
                  ) : (
                    <p>{editedRecord.doctor_notes || editedRecord.notes || ''}</p>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(editedRecord.doctor_notes || editedRecord.notes || '');
                        toast.success('Copied to clipboard');
                      }}
                    >
                      <Clipboard className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editedRecord.diagnosis || ''}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Enter diagnosis"
                    />
                  ) : (
                    <p className="text-sm font-medium">{editedRecord.diagnosis}</p>
                  )}
                  
                  {analysisResult?.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">AI-Suggested Diagnoses:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.suggestedDiagnosis.map((diagnosis: string, i: number) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="bg-medical-primary/5 cursor-pointer"
                            onClick={() => isEditing && handleInputChange('diagnosis', diagnosis)}
                          >
                            {diagnosis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="entities" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Extracted Medical Entities</CardTitle>
                  <CardDescription className="text-xs">
                    NLP analysis has identified the following entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult?.entities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(
                        analysisResult.entities.reduce((acc: Record<string, any[]>, entity: any) => {
                          if (!acc[entity.type]) acc[entity.type] = [];
                          acc[entity.type].push(entity);
                          return acc;
                        }, {})
                      ).map(([type, entities]) => (
                        <div key={type} className="mb-3">
                          <h4 className="text-xs uppercase text-gray-500 mb-1">{type}</h4>
                          <div className="flex flex-wrap gap-1">
                            {(entities as any[]).map((entity, i) => (
                              <Badge 
                                key={i}
                                variant="outline" 
                                className="bg-gray-50"
                              >
                                {entity.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No entities found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="text-xs uppercase text-gray-500 mb-1">Key Phrases</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {analysisResult?.keyPhrases.map((phrase: string, i: number) => (
                        <li key={i} className="mb-1">{phrase}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs uppercase text-gray-500 mb-1">Clinical Sentiment</h4>
                    <div className="bg-gray-100 rounded-full h-2 w-full mt-2">
                      <div 
                        className={`h-full rounded-full ${
                          analysisResult?.sentiment.score < 0 
                            ? 'bg-medical-critical' 
                            : 'bg-medical-success'
                        }`}
                        style={{ 
                          width: `${Math.abs((analysisResult?.sentiment.score || 0) * 50) + 50}%`,
                          marginLeft: (analysisResult?.sentiment.score || 0) < 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Concerning</span>
                      <span>Neutral</span>
                      <span>Positive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-3">
                      {(editedRecord.recommended_actions || []).map((action, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-medical-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-medical-primary">{index + 1}</span>
                          </div>
                          <Input
                            value={action}
                            onChange={(e) => handleActionChange(index, e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeRecommendedAction(index)}
                            className="h-8 w-8 text-destructive"
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={addRecommendedAction}
                        className="w-full mt-2"
                      >
                        + Add Action
                      </Button>
                    </div>
                  ) : (
                    editedRecord.recommended_actions && editedRecord.recommended_actions.length > 0 ? (
                      <ul className="space-y-2">
                        {editedRecord.recommended_actions.map((action, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-medical-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-medical-primary">{index + 1}</span>
                            </div>
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No recommended actions</p>
                    )
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Close
                    </Button>
                    {!isEditing && (
                      <Button size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
      
      {/* Medical Certificate Dialog */}
      {selectedCertificate && (
        <MedicalCertificateComponent
          isOpen={isCertificateOpen}
          onClose={() => {
            setIsCertificateOpen(false);
            setSelectedCertificate(null);
          }}
          certificateData={selectedCertificate}
        />
      )}
    </Sheet>
  );
};

export default MedicalRecordAnalysis;
