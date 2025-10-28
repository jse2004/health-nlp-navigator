import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BrainCircuit, FileText, Heart, Save, Search, Download, Eye, Info, AlertTriangle, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Patient, MedicalRecord } from '@/data/sampleData';
import AnalyticsSummary from './AnalyticsSummary';
import PatientsList from './PatientsList';
import InsightCard from './InsightCard';
import MedicalRecordAnalysis from './MedicalRecordAnalysis';
import PatientDetailsModal from './PatientDetailsModal';
import NewNLPAnalysis from './NewNLPAnalysis';
import SearchBar from './SearchBar';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { fetchPatients, fetchMedicalRecords, deleteMedicalRecord, getAnalyticsData, downloadEnhancedRecordsCSV } from '@/services/dataService';
import AppointmentScheduler from './AppointmentScheduler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardCharts from './DashboardCharts';
import CasesComparisonChart from './CasesComparisonChart';

const Dashboard: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [isSevereCasesModalOpen, setIsSevereCasesModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<MedicalRecord | null>(null);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);
  const [isInsightReviewOpen, setIsInsightReviewOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<{title: string, content: string, type: string, details?: any} | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [severeCases, setSevereCases] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsSummary, setAnalyticsSummary] = useState({ totalPatients: 0, criticalCases: 0, pendingReviews: 0, recentAdmissions: 0, previousTotalPatients: 0, previousCriticalCases: 0, previousPendingReviews: 0 });
  const [totalActiveCases, setTotalActiveCases] = useState(0);

  const loadAnalyticsData = async () => {
    try {
      const analyticsData = await getAnalyticsData();
      setAnalyticsSummary(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const generateRealInsights = (patients: Patient[], records: MedicalRecord[]) => {
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
        details: {
          condition: mostCommonCondition[0],
          count: mostCommonCondition[1],
          relatedPatients: patients.filter(p => p.condition === mostCommonCondition[0])
        }
      });
    }
    const highSeverityRecords = records.filter(r => r.severity && r.severity >= 8);
    if (highSeverityRecords.length > 0) {
      insights.push({ 
        title: "High-Severity Cases", 
        content: `${highSeverityRecords.length} records with a severity rating of 8+ require immediate review.`, 
        type: "clinical",
        details: {
          count: highSeverityRecords.length,
          records: highSeverityRecords
        }
      });
    }
    const recentRecords = records.filter(r => r.date && new Date(r.date) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    if (recentRecords.length > 0) {
      insights.push({ 
        title: "Recent Activity", 
        content: `${recentRecords.length} new medical records have been added in the last 72 hours.`, 
        type: "care",
        details: {
          count: recentRecords.length,
          records: recentRecords
        }
      });
    }
    const pendingDiagnosis = records.filter(r => !r.diagnosis || r.diagnosis.trim() === 'Pending evaluation');
    if (pendingDiagnosis.length > 0) {
      insights.push({ 
        title: "Pending Diagnoses", 
        content: `${pendingDiagnosis.length} records are awaiting a final diagnosis.`, 
        type: "medication",
        details: {
          count: pendingDiagnosis.length,
          records: pendingDiagnosis
        }
      });
    }
    return insights.slice(0, 4);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientsData, recordsData] = await Promise.all([fetchPatients(searchQuery), fetchMedicalRecords(searchQuery)]);
      setPatients(patientsData);
      setMedicalRecords(recordsData);
      
      // Load severe cases
      const severe = recordsData.filter(record => record.severity >= 8);
      setSevereCases(severe);
      
      await loadAnalyticsData();
      toast.success('Dashboard data loaded successfully.');
    } catch (error) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const loadSaved = () => {
      try {
        const saved = localStorage.getItem('savedAnalyses');
        if (saved) {
          setSavedAnalyses(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved analyses:', error);
        // If parsing fails, clear the corrupted data
        localStorage.removeItem('savedAnalyses');
      }
    };
    loadSaved();
    const handleStorageChange = () => { loadSaved(); loadData(); };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedAnalysesUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedAnalysesUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const debouncedLoad = setTimeout(() => { loadData(); }, 300);
    return () => clearTimeout(debouncedLoad);
  }, [searchQuery]);

  const handleViewPatientRecord = (patientId: string) => {
    const record = medicalRecords.find(r => r.patient_id === patientId);
    if (record) {
      setSelectedRecord(record);
      setIsAnalysisOpen(true);
    } else {
      toast.error('No medical record found for this patient.');
    }
  };

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

  const handleNewAnalysis = () => setIsNewAnalysisOpen(true);

  const handleInsightReview = (insight: any) => {
    setSelectedInsight(insight);
    setIsInsightReviewOpen(true);
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (confirm('Are you sure you want to delete this medical record?')) {
      try {
        await deleteMedicalRecord(id);
        await loadData(); // This will reload both medical records and severe cases
        toast.success('Medical record deleted successfully.');
      } catch (error) {
        toast.error('Failed to delete medical record.');
      }
    }
  };

  const downloadAllRecords = async () => {
    try {
      await downloadEnhancedRecordsCSV();
      toast.success("All records have been downloaded successfully.");
    } catch (error) {
      toast.error("Failed to download records.");
    }
  };

  const realInsights = generateRealInsights(patients, medicalRecords);

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of patient records and key metrics</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleNewAnalysis}>
          <FileText className="h-4 w-4" />
          New Medical Record
        </Button>
      </div>

      <AnalyticsSummary data={analyticsSummary} />

      {/* Overall Cases Summary */}
      <Alert className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-base font-semibold">Overall Cases Summary</AlertTitle>
        <AlertDescription className="text-sm mt-2">
          {totalActiveCases === 0 ? (
            'There are currently no active cases in the system.'
          ) : totalActiveCases === 1 ? (
            'There is currently 1 active case in the database.'
          ) : (
            `There are currently ${totalActiveCases} active cases in the database.`
          )}
          {' '}
          This includes all patients who are currently being treated or monitored by medical staff.
        </AlertDescription>
      </Alert>

      {/* Visualization Charts */}
      <DashboardCharts patients={patients} medicalRecords={medicalRecords} />

      {/* Cases Comparison Chart */}
      <CasesComparisonChart 
        medicalRecords={medicalRecords} 
        onDataProcessed={setTotalActiveCases}
      />

      {/* Modals */}
      <NewNLPAnalysis 
        isOpen={isNewAnalysisOpen} 
        onClose={() => { setIsNewAnalysisOpen(false); loadData(); }} 
      />
      <MedicalRecordAnalysis 
        record={selectedRecord} 
        isOpen={isAnalysisOpen} 
        onClose={() => setIsAnalysisOpen(false)} 
        onSaved={loadData} 
      />
      <PatientDetailsModal 
        record={selectedRecordForDetails} 
        isOpen={isRecordDetailsOpen} 
        onClose={() => setIsRecordDetailsOpen(false)} 
      />
      
      {isViewAllOpen && 
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 w-full max-w-7xl h-full max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-8 pb-6 border-b border-border/50 bg-card/50 backdrop-blur-sm">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-card-foreground">All Medical Records</h2>
                <p className="text-muted-foreground mt-2">Complete overview of all patient medical records</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                  {medicalRecords.length} Total Records
                </Badge>
                <Button variant="outline" size="sm" onClick={downloadAllRecords} className="flex items-center gap-2 hover:bg-accent/50">
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsViewAllOpen(false)} className="hover:bg-accent/50">
                  X
                </Button>
              </div>
            </div>
            
            <div className="overflow-auto flex-grow bg-card">
              {medicalRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
                      <tr className="border-b border-border/30">
                        <th className="px-8 py-5 text-left text-sm font-semibold text-card-foreground tracking-wider uppercase">Record ID</th>
                        <th className="px-8 py-5 text-left text-sm font-semibold text-card-foreground tracking-wider uppercase">Date</th>
                        <th className="px-8 py-5 text-left text-sm font-semibold text-card-foreground tracking-wider uppercase">Student Name</th>
                        <th className="px-8 py-5 text-left text-sm font-semibold text-card-foreground tracking-wider uppercase">Diagnosis</th>
                        <th className="px-8 py-5 text-left text-sm font-semibold text-card-foreground tracking-wider uppercase">Severity</th>
                        <th className="px-8 py-5 text-center text-sm font-semibold text-card-foreground tracking-wider uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border/20">
                      {medicalRecords.map((record, index) => (
                        <tr key={record.id} className="hover:bg-muted/20 transition-all duration-200">
                          <td className="px-8 py-6">
                            <div className="flex items-center">
                              <span className="font-mono text-sm text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border border-border/30">
                                {record.id.substring(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-card-foreground">
                                {new Date(record.date || "").toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(record.date || "").toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-card-foreground">
                                {record.patient_name || "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Patient #{index + 1}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-card-foreground truncate" title={record.diagnosis || "No diagnosis"}>
                                {record.diagnosis || "No diagnosis"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {record.diagnosis ? "Confirmed" : "Pending evaluation"}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="h-3 w-24 bg-muted/50 rounded-full overflow-hidden border border-border/30">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      record.severity >= 8 ? "bg-destructive" : 
                                      record.severity >= 5 ? "bg-yellow-500" : "bg-green-500"
                                    }`} 
                                    style={{ width: `${(record.severity / 10) * 100}%` }}
                                  />
                                </div>
                              </div>
                               <span className={`text-sm font-semibold px-2.5 py-1 rounded-full border ${
                                 record.severity >= 8 ? "text-destructive bg-destructive/10 border-destructive/20" : 
                                 record.severity >= 5 ? "text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800/30" : 
                                 "text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800/30"
                               }`}>
                                 {record.severity}/10
                               </span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:text-primary/80 hover:bg-primary/10 border border-transparent hover:border-primary/20" 
                                onClick={() => { setSelectedRecordForDetails(record); setIsRecordDetailsOpen(true); }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-card-foreground hover:bg-muted/30 border border-transparent hover:border-border/50" 
                                onClick={() => { setSelectedRecord(record); setIsAnalysisOpen(true); setIsViewAllOpen(false); }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 border border-transparent hover:border-destructive/20" 
                                onClick={() => { handleDeleteAnalysis(record.id); if (medicalRecords.length === 1) setIsViewAllOpen(false); }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-16 max-w-md">
                    <FileText className="h-24 w-24 text-muted-foreground/30 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-card-foreground mb-4">No Medical Records Found</h3>
                    <p className="text-muted-foreground mb-8">There are currently no medical records in the system. Create your first record to get started.</p>
                    <Button onClick={() => { setIsViewAllOpen(false); handleNewAnalysis(); }} size="lg" className="gap-2">
                      <FileText className="h-5 w-5" />
                      Create First Record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      }
      
      {/* Insight Review Modal */}
      <Dialog open={isInsightReviewOpen} onOpenChange={setIsInsightReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              {selectedInsight?.title} - Detailed Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedInsight && (
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Summary</h4>
                <p className="text-muted-foreground">{selectedInsight.content}</p>
              </div>

              {selectedInsight.details && (
                <div className="space-y-4">
                  {selectedInsight.type === 'trend' && selectedInsight.details.relatedPatients && (
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Related Patients ({selectedInsight.details.count})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedInsight.details.relatedPatients.slice(0, 6).map((patient: Patient, i: number) => (
                          <div key={i} className="p-3 bg-background border rounded-lg">
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">Age: {patient.age} • {patient.condition}</div>
                          </div>
                        ))}
                      </div>
                      {selectedInsight.details.relatedPatients.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          And {selectedInsight.details.relatedPatients.length - 6} more patients...
                        </p>
                      )}
                    </div>
                  )}

                  {(selectedInsight.type === 'clinical' || selectedInsight.type === 'care' || selectedInsight.type === 'medication') && selectedInsight.details.records && (
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        {selectedInsight.type === 'clinical' ? 'High-Severity Records' : 
                         selectedInsight.type === 'care' ? 'Recent Records' : 'Pending Diagnosis Records'} 
                        ({selectedInsight.details.count})
                      </h4>
                      <div className="space-y-3">
                        {selectedInsight.details.records.slice(0, 5).map((record: MedicalRecord, i: number) => (
                          <div key={i} className="p-4 bg-background border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{record.patient_name || 'Unknown Patient'}</div>
                              <div className="flex items-center gap-2">
                                {selectedInsight.type === 'clinical' && (
                                  <Badge variant={record.severity >= 9 ? "destructive" : "secondary"}>
                                    Severity: {record.severity}/10
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(record.date || '').toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.diagnosis || 'Pending evaluation'}
                            </div>
                            {record.doctor_notes && (
                              <div className="text-sm text-muted-foreground mt-1 truncate">
                                Notes: {record.doctor_notes.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        ))}
                        {selectedInsight.details.records.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            And {selectedInsight.details.records.length - 5} more records...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      This insight was generated automatically based on current data patterns.
                    </div>
                    <Button variant="outline" onClick={() => setIsInsightReviewOpen(false)}>
                      Close Review
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <NewNLPAnalysis isOpen={isNewAnalysisOpen} onClose={() => setIsNewAnalysisOpen(false)} onSaved={loadData} />
      <PatientDetailsModal record={selectedRecordForDetails} isOpen={isRecordDetailsOpen} onClose={() => setIsRecordDetailsOpen(false)} />
    </div>
  );
};

export default Dashboard;
