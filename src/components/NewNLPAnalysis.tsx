
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { FileText, Save, User, Stethoscope, Pill, AlertTriangle, AlertCircle, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { saveMedicalRecord } from '@/services/dataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollegeDepartment, collegeDepartmentNames } from '@/data/sampleData';

interface NewNLPAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface PersonRecord {
  personType: 'student' | 'professor' | 'employee' | 'guest' | '';
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  // Student specific
  studentId: string;
  courseYear: string;
  collegeDepartment: CollegeDepartment | '';
  // Professor/Employee specific
  position: string;
  faculty: string;
  symptoms: string;
  diagnosis: string;
  medication: string;
}

// Helper to render text with highlighted entities
const renderHighlightedText = (text: string, entities: any[]) => {
  if (!entities || entities.length === 0) {
    return <span>{text}</span>;
  }

  const sortedEntities = [...entities].sort((a, b) => a.startIndex - b.startIndex);

  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  sortedEntities.forEach((entity, i) => {
    if (entity.startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, entity.startIndex));
    }
    parts.push(
      <span key={i} className="entity-highlight" data-entity-type={entity.type}>
        {entity.text}
      </span>
    );
    lastIndex = entity.endIndex;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{parts}</p>;
};

const NewNLPAnalysis: React.FC<NewNLPAnalysisProps> = ({ isOpen, onClose, onSaved }) => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHospitalDialog, setShowHospitalDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  const form = useForm<PersonRecord>({
    defaultValues: {
      personType: '',
      name: '',
      age: '',
      gender: '',
      studentId: '',
      courseYear: '',
      collegeDepartment: '',
      position: '',
      faculty: '',
      symptoms: '',
      diagnosis: '',
      medication: ''
    }
  });

  const handleAnalyze = () => {
    const symptoms = form.getValues('symptoms');
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms to analyze');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const result = analyzeMedicalText(symptoms);
        setAnalysisResult(result);
        if (result.suggestedDiagnosis?.length > 0) {
          form.setValue('diagnosis', result.suggestedDiagnosis.join(', '));
        }
        toast.success('Symptoms analyzed successfully');
      } catch (error) {
        toast.error('Error analyzing symptoms');
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  const generateRecommendedActions = (analysisResult: any): string[] => {
    const actions: string[] = [];
    if (analysisResult.severity >= 8) {
      actions.push('Seek immediate medical attention');
    } else if (analysisResult.severity >= 6) {
      actions.push('Schedule appointment with a healthcare provider');
    } else {
      actions.push('Rest and stay hydrated');
    }
    if (analysisResult.entities?.some((e: any) => e.type === 'symptom')) {
      actions.push('Monitor symptoms for any changes');
    }
    return actions;
  };

  const handleSaveAnalysis = async (data: PersonRecord) => {
    if (!data.name || !data.symptoms || !data.age || !data.personType) {
      toast.error('Please enter name, age, person type, and symptoms');
      return;
    }
    
    const recommendedActions = analysisResult ? generateRecommendedActions(analysisResult) : [];
    const severity = analysisResult?.severity || 5;
    
    const newRecord = {
      patient_name: data.name,
      diagnosis: data.diagnosis || 'Pending evaluation',
      doctor_notes: data.symptoms,
      notes: data.medication || 'N/A',
      severity: severity,
      date: new Date().toISOString(),
      recommended_actions: recommendedActions,
      person_type: data.personType,
      full_name: data.name,
      gender: data.gender || 'Other',
      age: parseInt(data.age) || 0,
      position: data.position || null,
      faculty: data.faculty || null,
      patient_data: {
        name: data.name,
        person_type: data.personType as 'student' | 'professor' | 'employee' | 'guest',
        student_id: data.studentId || undefined,
        course_year: data.courseYear || undefined,
        college_department: (data.collegeDepartment as any) || undefined,
        position: data.position || undefined,
        faculty: data.faculty || undefined,
        age: parseInt(data.age) || 0,
        gender: data.gender || 'Other'
      }
    };
    
    // Check if severity is critical (8 or higher)
    if (severity >= 8) {
      setPendingSaveData(newRecord);
      setShowHospitalDialog(true);
      return;
    }

    // Save directly if not critical
    await saveRecord(newRecord);
  };

  const saveRecord = async (record: any) => {
    setIsSaving(true);
    try {
      const savedRecord = await saveMedicalRecord(record);
      toast.success(`Medical record saved: ${savedRecord.id}`);
      window.dispatchEvent(new Event('savedAnalysesUpdated'));
      if (onSaved) onSaved();
      handleClose();
    } catch (error) {
      toast.error('Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHospitalAcknowledgment = async () => {
    setShowHospitalDialog(false);
    if (pendingSaveData) {
      await saveRecord(pendingSaveData);
      setPendingSaveData(null);
    }
  };

  const handleClose = () => {
    form.reset();
    setAnalysisResult(null);
    setShowHospitalDialog(false);
    setPendingSaveData(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full md:max-w-[700px] overflow-y-auto p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2"><FileText />New Medical Record</SheetTitle>
        </SheetHeader>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveAnalysis)} className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User />Person Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="personType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select person type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Full name" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="Enter age" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    
                    {/* Student specific fields */}
                    {form.watch('personType') === 'student' && (
                      <>
                        <FormField control={form.control} name="studentId" render={({ field }) => (<FormItem><FormLabel>Student ID</FormLabel><FormControl><Input placeholder="ID number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="courseYear" render={({ field }) => (<FormItem><FormLabel>Course & Year</FormLabel><FormControl><Input placeholder="e.g., BSN-3" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="collegeDepartment" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>College Department</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select college department" /></SelectTrigger></FormControl><SelectContent>{Object.entries(collegeDepartmentNames).map(([code, name]) => (<SelectItem key={code} value={code}>{name} ({code})</SelectItem>))}</SelectContent></Select></FormItem>)} />
                      </>
                    )}
                    
                    {/* Professor specific fields */}
                    {form.watch('personType') === 'professor' && (
                      <>
                        <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Associate Professor" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="collegeDepartment" render={({ field }) => (<FormItem><FormLabel>College Department</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select college department" /></SelectTrigger></FormControl><SelectContent>{Object.entries(collegeDepartmentNames).map(([code, name]) => (<SelectItem key={code} value={code}>{name} ({code})</SelectItem>))}</SelectContent></Select></FormItem>)} />
                      </>
                    )}
                    
                    {/* Employee specific fields */}
                    {form.watch('personType') === 'employee' && (
                      <>
                        <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., Administrative Officer" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="faculty" render={({ field }) => (<FormItem><FormLabel>Faculty</FormLabel><FormControl><Input placeholder="e.g., College of Nursing" {...field} /></FormControl></FormItem>)} />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText />Symptoms & Analysis</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="symptoms" render={({ field }) => (<FormItem><FormLabel>Patient Symptoms</FormLabel><FormControl><Textarea placeholder="Describe symptoms..." className="min-h-[140px]" {...field}/></FormControl></FormItem>)} />
                  <div className="mt-4 flex justify-end">
                    <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing || !form.getValues('symptoms').trim()} className="w-full md:w-auto">
                      {isAnalyzing ? "Analyzing..." : "Analyze Symptoms"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {analysisResult && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Stethoscope />AI Analysis Results</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Alert variant="default" className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      <AlertDescription>This AI analysis is a preliminary assessment and not a substitute for professional medical advice.</AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormLabel>Severity Assessment</FormLabel>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-2.5 w-full bg-muted rounded-full">
                            <div className={`h-full rounded-full ${analysisResult.severity >= 8 ? 'bg-destructive' : analysisResult.severity >= 5 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${(analysisResult.severity / 10) * 100}%` }} />
                          </div>
                          <Badge variant="secondary">{analysisResult.severity}/10</Badge>
                        </div>
                      </div>
                      {analysisResult.suggestedDiagnosis?.length > 0 && <div><FormLabel>Possible Conditions</FormLabel><div className="flex flex-wrap gap-2 mt-2">{analysisResult.suggestedDiagnosis.map((diag: string) => (<Badge key={diag} variant="outline" className="cursor-pointer" onClick={() => form.setValue('diagnosis', diag)}>{diag}</Badge>))}</div></div>}
                    </div>
                    {analysisResult.entities?.length > 0 && <div><FormLabel>Highlighted Medical Terms</FormLabel><div className="p-3 mt-2 rounded-md border bg-background">{renderHighlightedText(form.getValues('symptoms'), analysisResult.entities)}</div></div>}
                    {analysisResult && <div><FormLabel>Recommended Actions</FormLabel><ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">{generateRecommendedActions(analysisResult).map((action: string) => (<li key={action}>{action}</li>))}</ul></div>}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Pill />Final Diagnosis & Medication</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="diagnosis" render={({ field }) => (<FormItem><FormLabel>Final Diagnosis</FormLabel><FormControl><Textarea placeholder="Enter final diagnosis..." {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="medication" render={({ field }) => (<FormItem><FormLabel>Prescribed Medication</FormLabel><FormControl><Textarea placeholder="Enter medication..." {...field} /></FormControl></FormItem>)} />
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={isSaving || !form.getValues('name')} className="w-full md:w-auto">
                  {isSaving ? "Saving..." : "Save Medical Record"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>

      <AlertDialog open={showHospitalDialog} onOpenChange={setShowHospitalDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Nearest Hospital Recommendation - Critical Case
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Based on the severity of symptoms, immediate hospital care is strongly recommended. 
              Please contact one of the following hospitals:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 my-4">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-base">1. Philippine General Hospital</h4>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Taft Avenue, Ermita, Manila</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>24/7 Emergency Services Available</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">2. Our Lady of Lourdes Hospital</h4>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>46 P. Sanchez St., Sta. Mesa, Manila</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>24/7 Emergency Services Available</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">3. University of Santo Tomas Hospital</h4>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>España Blvd., Sampaloc, Manila</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>24/7 Emergency Services Available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowHospitalDialog(false);
              setPendingSaveData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleHospitalAcknowledgment}>
              I Acknowledge - Proceed to Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};

export default NewNLPAnalysis;
