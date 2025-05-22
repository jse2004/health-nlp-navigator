
import React, { useState } from 'react';
import { MedicalRecord } from '@/data/sampleData';
import { analyzeMedicalText } from '@/utils/nlpProcessing';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Clipboard, FileText, BarChart, Award, Stethoscope } from 'lucide-react';

interface MedicalRecordAnalysisProps {
  record?: MedicalRecord;
  isOpen: boolean;
  onClose: () => void;
}

const MedicalRecordAnalysis: React.FC<MedicalRecordAnalysisProps> = ({ 
  record, 
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  // If no record is selected, don't render anything
  if (!record) {
    return null;
  }
  
  // Safely get doctor's notes ensuring we have a string
  const doctorNotes = record.doctorNotes || record.notes || '';
  
  // Analyze the doctor's notes using our NLP utility
  const analysisResult = analyzeMedicalText(doctorNotes);
  
  // Calculate severity level label
  const getSeverityLabel = (value: number) => {
    if (value >= 8) return { label: "High", color: "text-medical-critical" };
    if (value >= 5) return { label: "Medium", color: "text-medical-warning" };
    return { label: "Low", color: "text-medical-success" };
  };
  
  const severityInfo = getSeverityLabel(record.severity);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full md:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl">Medical Record Analysis</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{record.diagnosis}</h2>
              <p className="text-sm text-gray-500">Record ID: {record.id} • {record.date}</p>
            </div>
            <Badge 
              className={`${severityInfo.color} bg-opacity-10`}
              variant="outline"
            >
              Severity: {severityInfo.label}
            </Badge>
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
                  <p>{doctorNotes}</p>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
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
                  <p className="text-sm font-medium">{record.diagnosis}</p>
                  
                  {analysisResult.suggestedDiagnosis && analysisResult.suggestedDiagnosis.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">AI-Suggested Diagnoses:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.suggestedDiagnosis.map((diagnosis, i) => (
                          <Badge key={i} variant="outline" className="bg-medical-primary/5">
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
                  {analysisResult.entities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(
                        analysisResult.entities.reduce((acc: Record<string, any[]>, entity) => {
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
                      {analysisResult.keyPhrases.map((phrase, i) => (
                        <li key={i} className="mb-1">{phrase}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs uppercase text-gray-500 mb-1">Clinical Sentiment</h4>
                    <div className="bg-gray-100 rounded-full h-2 w-full mt-2">
                      <div 
                        className={`h-full rounded-full ${
                          analysisResult.sentiment.score < 0 
                            ? 'bg-medical-critical' 
                            : 'bg-medical-success'
                        }`}
                        style={{ 
                          width: `${Math.abs(analysisResult.sentiment.score * 50) + 50}%`,
                          marginLeft: analysisResult.sentiment.score < 0 ? 'auto' : '0'
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
                  {record.recommendedActions && record.recommendedActions.length > 0 ? (
                    <ul className="space-y-2">
                      {record.recommendedActions.map((action, index) => (
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
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Close
                    </Button>
                    <Button size="sm">Create Treatment Plan</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MedicalRecordAnalysis;
