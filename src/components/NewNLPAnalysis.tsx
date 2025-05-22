
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { FileText, Save, User, Stethoscope, Pill, Download } from 'lucide-react';
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

interface NewNLPAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface StudentRecord {
  studentName: string;
  studentId: string;
  courseYear: string;
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

  const handleSaveAnalysis = async (data: StudentRecord) => {
    if (!data.studentName || !data.symptoms) {
      toast.error('Please enter student name and symptoms');
      return;
    }

    setIsSaving(true);

    try {
      // Create a new medical record
      const newRecord = {
        patient_name: data.studentName,
        diagnosis: data.diagnosis,
        doctor_notes: data.symptoms,
        notes: data.medication,
        severity: analysisResult?.severity || 5,
        recommended_actions: []
      };

      // Save to Supabase
      await saveMedicalRecord(newRecord);
      
      // Also save to localStorage for compatibility with the saved analyses tab
      const savedRecord = {
        id: `record-${Date.now()}`,
        date: new Date().toISOString(),
        ...data,
        // Store analysis result if available
        result: analysisResult,
      };

      const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
      savedAnalyses.push(savedRecord);
      localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));

      toast.success('Medical record saved successfully');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('savedAnalysesUpdated'));
      
      if (onSaved) onSaved();
      
      // Close the modal after saving
      handleClose();
    } catch (error) {
      toast.error('Error saving record');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadAnalysis = () => {
    const data = form.getValues();
    
    if (!data.symptoms.trim()) {
      toast.error('Please enter symptoms to download');
      return;
    }
    
    // Create content for download
    const content = `
Student Medical Record
----------------------
Name: ${data.studentName}
ID: ${data.studentId}
Course/Year: ${data.courseYear}
Date: ${new Date().toLocaleString()}

Symptoms:
${data.symptoms}

Diagnosis:
${data.diagnosis}

Prescribed Medication:
${data.medication}

${analysisResult?.severity ? `Severity Assessment: ${analysisResult.severity}/10` : ''}

${analysisResult?.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 ? 
  `AI-Suggested Diagnoses:
${analysisResult.suggestedDiagnosis.join(', ')}` : ''}
    `;
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${data.studentName || 'student'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Record downloaded successfully');
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
                            placeholder="Enter diagnosis here..."
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
              
              {analysisResult && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      AI Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.severity !== undefined && (
                      <div className="mb-4">
                        <p className="text-sm mb-1">Severity Assessment:</p>
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
                    
                    {analysisResult.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm mb-1">Suggested Diagnoses:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.suggestedDiagnosis.map((diagnosis: string, i: number) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="bg-medical-primary/5 cursor-pointer"
                              onClick={() => form.setValue('diagnosis', diagnosis)}
                            >
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.entities && analysisResult.entities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm mb-1">Detected Entities:</p>
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
                                    className="bg-gray-50"
                                  >
                                    {entity.text}
                                  </Badge>
                                ))}
                                {entities.length > 3 && (
                                  <Badge variant="outline" className="bg-gray-50">
                                    +{entities.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.keyPhrases && analysisResult.keyPhrases.length > 0 && (
                      <div>
                        <p className="text-sm mb-1">Key Phrases:</p>
                        <ul className="list-disc pl-5 text-sm">
                          {analysisResult.keyPhrases.map((phrase: string, i: number) => (
                            <li key={i} className="mb-1">{phrase}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
                <Button 
                  variant="outline"
                  type="button"
                  onClick={handleDownloadAnalysis}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
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
