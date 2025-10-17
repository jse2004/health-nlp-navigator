import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicalRecord } from '@/data/sampleData';
import { fetchMedicalRecords } from '@/services/dataService';
import { toast } from 'sonner';
import MedicalRecordAnalysis from '@/components/MedicalRecordAnalysis';

const SevereCasesPage = () => {
  const [severeCases, setSevereCases] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<MedicalRecord | null>(null);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);

  const getSeverityColor = (severity: number) => {
    if (severity >= 9) return "destructive";
    if (severity === 8) return "secondary";
    return "outline";
  };

  const getSeverityBg = (severity: number) => {
    if (severity >= 9) return "bg-destructive/10 border-destructive/20";
    if (severity === 8) return "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800";
    return "bg-muted/30";
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const recordsData = await fetchMedicalRecords('');
      const severe = recordsData.filter(record => record.severity >= 8);
      setSevereCases(severe);
    } catch (error) {
      toast.error('Failed to load severe cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-card text-card-foreground rounded-lg shadow-sm border">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Severe Cases</h1>
                <p className="text-muted-foreground">High-priority cases requiring immediate attention</p>
              </div>
            </div>
            <Badge variant="destructive" className="px-3 py-1.5 font-medium">
              {severeCases.length} Active
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading severe cases...</p>
            </div>
          ) : severeCases.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Severe Cases</h3>
              <p className="text-sm text-muted-foreground/80 max-w-md mx-auto mt-2">
                Currently no high-priority cases (severity 8-10) require immediate attention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {severeCases.map(record => (
                <div 
                  key={record.id} 
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${getSeverityBg(record.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={getSeverityColor(record.severity)} className="font-bold">
                          SEVERITY {record.severity}/10
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Patient</h4>
                          <p className="font-medium">{record.patient_name || "Unknown"}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Diagnosis</h4>
                          <p className="text-sm">{record.diagnosis || "Not diagnosed"}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Notes</h4>
                          <p className="text-sm line-clamp-2">{record.doctor_notes || "No notes"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSelectedRecord(record); setIsAnalysisOpen(true); }}
                        className="h-8"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setSelectedRecordForDetails(record); setIsRecordDetailsOpen(true); }}
                        className="h-8"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MedicalRecordAnalysis 
        isOpen={isAnalysisOpen}
        record={selectedRecord} 
        onClose={() => { setIsAnalysisOpen(false); setSelectedRecord(undefined); loadData(); }} 
      />
      <MedicalRecordAnalysis 
        isOpen={isRecordDetailsOpen}
        record={selectedRecordForDetails || undefined} 
        onClose={() => { setIsRecordDetailsOpen(false); setSelectedRecordForDetails(null); }} 
      />
    </div>
  );
};

export default SevereCasesPage;
