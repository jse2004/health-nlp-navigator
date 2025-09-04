
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { FileText, Save, User, Stethoscope, Pill, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
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

interface StudentRecord {
  studentName: string;
  studentId: string;
  courseYear: string;
  collegeDepartment: CollegeDepartment | '';
  symptoms: string;
  diagnosis: string;
  medication: string;
}

const NewNLPAnalysis: React.FC<NewNLPAnalysisProps> = ({ isOpen, onClose, onSaved }) => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<StudentRecord>({
    defaultValues: {
      studentName: '',
      studentId: '',
      courseYear: '',
      collegeDepartment: '',
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
    
    // Small timeout to simulate processing
    setTimeout(() => {
      try {
        const result = analyzeMedicalText(symptoms);
        setAnalysisResult(result);
        
        // Auto-fill diagnosis based on NLP analysis
        if (result.suggestedDiagnosis && result.suggestedDiagnosis.length > 0) {
          form.setValue('diagnosis', result.suggestedDiagnosis.join(', '));
        }
        
        toast.success('Symptoms analyzed successfully');
      } catch (error) {
        toast.error('Error analyzing symptoms');
        console.error('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  const generateRecommendedActions = (analysisResult: any): string[] => {
    const actions: string[] = [];
    
    if (analysisResult.severity >= 8) {
      actions.push('Seek immediate medical attention');
      actions.push('Monitor vital signs closely');
    } else if (analysisResult.severity >= 6) {
      actions.push('Schedule appointment with healthcare provider within 24-48 hours');
      actions.push('Monitor symptoms for changes');
    } else {
      actions.push('Rest and stay hydrated');
      actions.push('Monitor symptoms and seek care if worsening');
    }
    
    // Add specific actions based on detected entities
    if (analysisResult.entities) {
      const symptoms = analysisResult.entities.filter((e: any) => e.type === 'symptom');
      const medications = analysisResult.entities.filter((e: any) => e.type === 'medication');
      
      if (symptoms.some((s: any) => s.text.toLowerCase().includes('fever'))) {
        actions.push('Take temperature regularly and maintain fever log');
      }
      
      if (symptoms.some((s: any) => s.text.toLowerCase().includes('pain'))) {
        actions.push('Apply appropriate pain management techniques');
      }
      
      if (medications.length > 0) {
        actions.push('Review current medications with healthcare provider');
      }
    }
    
    actions.push('Follow up as needed or if symptoms persist');
    
    return actions;
  };

  const handleSaveAnalysis = async (data: StudentRecord) => {
    if (!data.studentName || !data.symptoms) {
      toast.error('Please enter student name and symptoms');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving medical record with data:', data);
      
      // Generate recommended actions based on analysis
      const recommendedActions = analysisResult ? generateRecommendedActions(analysisResult) : [];
      
      // Create a new medical record with proper fields to match the database schema
      const newRecord = {
        patient_name: data.studentName,
        diagnosis: data.diagnosis || 'Pending further evaluation',
        doctor_notes: data.symptoms,
        notes: data.medication || 'No medication prescribed',
        severity: analysisResult?.severity || 5,
        date: new Date().toISOString(),
        recommended_actions: recommendedActions,
        // Include patient data with college department
        patient_data: {
          name: data.studentName,
          student_id: data.studentId,
          course_year: data.courseYear,
          college_department: data.collegeDepartment || undefined,
          age: 20, // Default age for students
          gender: 'Other' as const // Default gender
        }
      };

      console.log('Prepared record for saving:', newRecord);

      // Save to Supabase
      const savedRecord = await saveMedicalRecord(newRecord);
      
      console.log('Record saved successfully:', savedRecord);
      
      toast.success(`Medical record ${savedRecord.id} saved successfully to database`);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('savedAnalysesUpdated'));
      
      if (onSaved) onSaved();
      
      // Close the modal after saving
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Error saving record to database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setAnalysisResult(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full md:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Medical Record
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveAnalysis)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Student ID number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="courseYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course & Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BSN-3" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="collegeDepartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select college department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(collegeDepartmentNames).map(([code, name]) => (
                                <SelectItem key={code} value={code}>
                                  {name} ({code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              
                {/* Symptoms */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Symptoms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe symptoms here..."
                              className="min-h-[120px]" 
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-2 flex justify-end">
                      <Button 
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !form.getValues('symptoms').trim()}
                        className="flex items-center gap-2"
                      >
                        {isAnalyzing ? (
                          <>Analyzing<span className="animate-pulse">...</span></>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>Analyze Symptoms</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* AI Analysis Results with Medical Disclaimer */}
              {analysisResult && (
                <Card className="border-2 border-medical-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      AI Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Medical Disclaimer */}
                    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Medical Disclaimer:</strong> This AI analysis is for preliminary assessment only and is not a substitute for professional medical diagnosis. Please consult with a qualified healthcare provider or doctor for accurate diagnosis and treatment.
                      </AlertDescription>
                    </Alert>

                    {/* Severity Assessment */}
                    {analysisResult.severity !== undefined && (
                      <div className="mb-4">
                        <p className="text-sm mb-1 font-medium">Severity Assessment:</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-200 rounded-full">
                            <div 
                              className={`h-full rounded-full ${
                                analysisResult.severity >= 8 ? 'bg-medical-critical' : 
                                analysisResult.severity >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                              }`}
                              style={{ width: `${(analysisResult.severity / 10) * 100}%` }}
                            />
                          </div>
                          <Badge 
                            className={`${analysisResult.severity >= 8 ? 'text-medical-critical' : 
                              analysisResult.severity >= 5 ? 'text-medical-warning' : 'text-medical-success'} 
                              bg-opacity-10`}
                            variant="outline"
                          >
                            {analysisResult.severity >= 8 ? 'High' : 
                             analysisResult.severity >= 5 ? 'Medium' : 'Low'} 
                             ({analysisResult.severity}/10)
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Suggested Diagnoses */}
                    {analysisResult.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm mb-1 font-medium">Possible Conditions (Preliminary):</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.suggestedDiagnosis.map((diagnosis: string, i: number) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="bg-medical-primary/5 cursor-pointer hover:bg-medical-primary/10"
                              onClick={() => form.setValue('diagnosis', diagnosis)}
                            >
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {analysisResult && (
                      <div className="mb-4">
                        <p className="text-sm mb-1 font-medium">Recommended Actions:</p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {generateRecommendedActions(analysisResult).map((action: string, i: number) => (
                            <li key={i} className="text-gray-700 dark:text-gray-300">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Detected Entities */}
                    {analysisResult.entities && analysisResult.entities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm mb-1 font-medium">Detected Medical Terms:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(
                            analysisResult.entities.reduce((acc: Record<string, any[]>, entity: any) => {
                              if (!acc[entity.type]) acc[entity.type] = [];
                              acc[entity.type].push(entity);
                              return acc;
                            }, {})
                          ).slice(0, 4).map(([type, entities]: [string, any]) => (
                            <div key={type} className="mb-2">
                              <h4 className="text-xs uppercase text-gray-500 mb-1">{type}</h4>
                              <div className="flex flex-wrap gap-1">
                                {(entities as any[]).slice(0, 3).map((entity, i) => (
                                  <Badge 
                                    key={i}
                                    variant="outline" 
                                    className="bg-gray-50 dark:bg-gray-800"
                                  >
                                    {entity.text}
                                  </Badge>
                                ))}
                                {entities.length > 3 && (
                                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                                    +{entities.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Diagnosis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter final diagnosis here..."
                            className="min-h-[80px]" 
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {/* Medication */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Prescribed Medication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="medication"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter prescribed medication here..."
                            className="min-h-[80px]" 
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
                <Button 
                  type="submit"
                  disabled={isSaving || !form.getValues('studentName')}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>Saving<span className="animate-pulse">...</span></>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Record</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewNLPAnalysis;
