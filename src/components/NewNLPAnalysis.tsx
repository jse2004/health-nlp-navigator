
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { BrainCircuit, FileText, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

interface NewNLPAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewNLPAnalysis: React.FC<NewNLPAnalysisProps> = ({ isOpen, onClose }) => {
  const [medicalText, setMedicalText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = () => {
    if (!medicalText.trim()) {
      toast.error('Please enter medical text to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    // Small timeout to simulate processing
    setTimeout(() => {
      try {
        const result = analyzeMedicalText(medicalText);
        setAnalysisResult(result);
        toast.success('Analysis completed successfully');
      } catch (error) {
        toast.error('Error analyzing text');
        console.error('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  const handleSaveAnalysis = () => {
    if (!analysisResult) {
      toast.error('No analysis to save');
      return;
    }

    setIsSaving(true);

    // Simulate saving to database
    setTimeout(() => {
      // In a real app, this would be an API call to save the data
      try {
        // Create a saved analysis object
        const savedAnalysis = {
          id: `analysis-${Date.now()}`,
          date: new Date().toISOString(),
          text: medicalText,
          result: analysisResult,
        };

        // In a real app, we would save this to a database
        // For now, let's save it to localStorage to simulate persistence
        const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
        savedAnalyses.push(savedAnalysis);
        localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));

        toast.success('Analysis saved successfully');
        
        // Close the modal after saving
        handleClose();
      } catch (error) {
        toast.error('Error saving analysis');
        console.error('Save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleClose = () => {
    setMedicalText('');
    setAnalysisResult(null);
    onClose();
  };

  // Calculate severity level label
  const getSeverityLabel = (value?: number) => {
    if (!value) return { label: "Unknown", color: "text-gray-500" };
    if (value >= 8) return { label: "High", color: "text-medical-critical" };
    if (value >= 5) return { label: "Medium", color: "text-medical-warning" };
    return { label: "Low", color: "text-medical-success" };
  };
  
  const severityInfo = getSeverityLabel(analysisResult?.severity);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full md:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            New NLP Analysis
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="medical-text" className="block text-sm font-medium mb-2">
              Enter Medical Text to Analyze
            </label>
            <Textarea
              id="medical-text"
              placeholder="Enter doctor's notes, symptoms, or medical record text..."
              className="min-h-[150px]"
              value={medicalText}
              onChange={(e) => setMedicalText(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !medicalText.trim()}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>Analyzing<span className="animate-pulse">...</span></>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    <span>Analyze Text</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {analysisResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Analysis Results
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
                          className={`${severityInfo.color} bg-opacity-10`}
                          variant="outline"
                        >
                          {severityInfo.label} ({analysisResult.severity}/10)
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm mb-1">Suggested Diagnoses:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.suggestedDiagnosis.map((diagnosis: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-medical-primary/5">
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
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button 
                  onClick={handleSaveAnalysis} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>Saving<span className="animate-pulse">...</span></>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Analysis</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewNLPAnalysis;
