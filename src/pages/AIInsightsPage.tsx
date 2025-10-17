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
        <DialogContent className="max-w-2xl">
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
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Details</h4>
                  <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(selectedInsight.details, null, 2)}</pre>
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
