import React, { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';
import InsightCard from '@/components/InsightCard';
import { fetchPatients, fetchMedicalRecords } from '@/services/dataService';
import { Patient, MedicalRecord } from '@/data/sampleData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const AIInsightsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInsightReviewOpen, setIsInsightReviewOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<{title: string, content: string, type: string, details?: any} | null>(null);

  const generateInsights = (patients: Patient[], records: MedicalRecord[]) => {
    const insights = [];
    const conditionCounts = patients.reduce((acc: Record<string, number>, patient) => {
      if (patient.condition) acc[patient.condition] = (acc[patient.condition] || 0) + 1;
      return acc;
    }, {});
    const mostCommonCondition = Object.entries(conditionCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommonCondition) {
      insights.push({ 
        title: "Condition Spotlight", 
        content: `Most common patient condition: ${mostCommonCondition[0]} (${mostCommonCondition[1]} cases).`, 
        type: "trend",
        details: { condition: mostCommonCondition[0], count: mostCommonCondition[1], relatedPatients: patients.filter(p => p.condition === mostCommonCondition[0]) }
      });
    }
    const highSeverityRecords = records.filter(r => r.severity && r.severity >= 8);
    if (highSeverityRecords.length > 0) {
      insights.push({ 
        title: "High-Severity Cases", 
        content: `${highSeverityRecords.length} records with a severity rating of 8+ require immediate review.`, 
        type: "clinical",
        details: { count: highSeverityRecords.length, records: highSeverityRecords }
      });
    }
    const recentRecords = records.filter(r => r.date && new Date(r.date) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    if (recentRecords.length > 0) {
      insights.push({ 
        title: "Recent Activity", 
        content: `${recentRecords.length} new medical records have been added in the last 72 hours.`, 
        type: "care",
        details: { count: recentRecords.length, records: recentRecords }
      });
    }
    const pendingDiagnosis = records.filter(r => !r.diagnosis || r.diagnosis.trim() === 'Pending evaluation');
    if (pendingDiagnosis.length > 0) {
      insights.push({ 
        title: "Pending Diagnoses", 
        content: `${pendingDiagnosis.length} records are awaiting a final diagnosis.`, 
        type: "medication",
        details: { count: pendingDiagnosis.length, records: pendingDiagnosis }
      });
    }
    return insights;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [patientsData, recordsData] = await Promise.all([fetchPatients(''), fetchMedicalRecords('')]);
        setPatients(patientsData);
        setMedicalRecords(recordsData);
      } catch (error) {
        toast.error('Failed to load AI insights data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInsightReview = (insight: any) => {
    setSelectedInsight(insight);
    setIsInsightReviewOpen(true);
  };

  const insights = generateInsights(patients, medicalRecords);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">AI-powered analysis and recommendations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Generating insights...</p>
        </div>
      ) : insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {insights.map((insight, i) => 
            <InsightCard 
              key={i} 
              {...insight} 
              type={insight.type as any} 
              onReview={() => handleInsightReview(insight)}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border rounded-lg">
          <BrainCircuit className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No AI Insights Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Insights will be generated automatically as you add more patient data and medical records.
          </p>
        </div>
      )}

      {/* Insight Review Dialog */}
      <Dialog open={isInsightReviewOpen} onOpenChange={setIsInsightReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              {selectedInsight?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div>
                <Badge variant="outline">{selectedInsight.type}</Badge>
                <p className="mt-3 text-muted-foreground">{selectedInsight.content}</p>
              </div>
              {selectedInsight.details && (
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <h4 className="font-semibold">Details</h4>
                  
                  {/* Condition Spotlight Details */}
                  {selectedInsight.details.condition && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <span className="font-medium">Condition</span>
                        <span className="text-muted-foreground">{selectedInsight.details.condition}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <span className="font-medium">Total Cases</span>
                        <Badge variant="secondary">{selectedInsight.details.count}</Badge>
                      </div>
                      {selectedInsight.details.relatedPatients && selectedInsight.details.relatedPatients.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-medium text-sm">Affected Patients</span>
                          <div className="max-h-[200px] overflow-y-auto space-y-2">
                            {selectedInsight.details.relatedPatients.map((patient: Patient, idx: number) => (
                              <div key={idx} className="p-3 bg-background rounded-lg flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{patient.name}</p>
                                  <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                                </div>
                                <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                                  {patient.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* High-Severity or Recent Activity or Pending Diagnoses Details */}
                  {selectedInsight.details.records && selectedInsight.details.records.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <span className="font-medium">Total Records</span>
                        <Badge variant="secondary">{selectedInsight.details.count}</Badge>
                      </div>
                      <div className="space-y-2">
                        <span className="font-medium text-sm">Records</span>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {selectedInsight.details.records.map((record: MedicalRecord, idx: number) => (
                            <div key={idx} className="p-3 bg-background rounded-lg space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Record #{record.id}</p>
                                  <p className="text-sm text-muted-foreground">Patient ID: {record.patient_id}</p>
                                </div>
                                {record.severity && (
                                  <Badge variant={record.severity >= 8 ? 'destructive' : 'secondary'}>
                                    Severity: {record.severity}
                                  </Badge>
                                )}
                              </div>
                              {record.diagnosis && (
                                <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                              )}
                              {record.date && (
                                <p className="text-xs text-muted-foreground">
                                  Date: {new Date(record.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIInsightsPage;
