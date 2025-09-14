import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BrainCircuit, FileText, Heart, Save, Search, Download, Eye, Info } from 'lucide-react';
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

const Dashboard: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<MedicalRecord | null>(null);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsSummary, setAnalyticsSummary] = useState({ totalPatients: 0, criticalCases: 0, pendingReviews: 0, recentAdmissions: 0, previousTotalPatients: 0, previousCriticalCases: 0, previousPendingReviews: 0 });

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
      insights.push({ title: "Condition Spotlight", content: `Most common patient condition: ${mostCommonCondition[0]} (${mostCommonCondition[1]} cases).`, type: "trend" });
    }
    const highSeverityRecords = records.filter(r => r.severity && r.severity >= 8).length;
    if (highSeverityRecords > 0) {
      insights.push({ title: "High-Severity Cases", content: `${highSeverityRecords} records with a severity rating of 8+ require immediate review.`, type: "clinical" });
    }
    const recentRecords = records.filter(r => r.date && new Date(r.date) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length;
    if (recentRecords > 0) {
      insights.push({ title: "Recent Activity", content: `${recentRecords} new medical records have been added in the last 72 hours.`, type: "care" });
    }
    const pendingDiagnosis = records.filter(r => !r.diagnosis || r.diagnosis.trim() === 'Pending evaluation').length;
    if (pendingDiagnosis > 0) {
      insights.push({ title: "Pending Diagnoses", content: `${pendingDiagnosis} records are awaiting a final diagnosis.`, type: "medication" });
    }
    return insights.slice(0, 4);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientsData, recordsData] = await Promise.all([fetchPatients(searchQuery), fetchMedicalRecords(searchQuery)]);
      setPatients(patientsData);
      setMedicalRecords(recordsData);
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

  const handleNewAnalysis = () => setIsNewAnalysisOpen(true);

  const handleDeleteAnalysis = async (id: string) => {
    if (confirm('Are you sure you want to delete this medical record?')) {
      try {
        await deleteMedicalRecord(id);
        await loadData();
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
    <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Dashboard</h1>
          <p className="text-muted-foreground mt-1">AI-powered patient record analysis and insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <SearchBar onSearch={setSearchQuery} placeholder="Search patients, records..." />
          <Button className="flex items-center gap-2" onClick={handleNewAnalysis}><FileText className="h-4 w-4" />New Medical Record</Button>
        </div>
      </div>

      <AnalyticsSummary data={analyticsSummary} />

      <Tabs defaultValue="patients" className="w-full mt-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="patients" className="flex items-center gap-1.5"><Heart className="h-4 w-4" />Patients</TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5"><BrainCircuit className="h-4 w-4" />AI Insights</TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-1.5"><FileText className="h-4 w-4" />Medical Records</TabsTrigger>
            <TabsTrigger value="saved-analyses" className="flex items-center gap-1.5"><Save className="h-4 w-4" />Saved Records</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1" onClick={() => setIsViewAllOpen(true)}>View All<ArrowUpRight className="h-4 w-4" /></Button>
        </div>

        <TabsContent value="patients"><PatientsList patients={patients} onSelectPatient={(patient) => handleViewPatientRecord(patient.id)} isLoading={isLoading} /></TabsContent>

        <TabsContent value="insights">
          {realInsights.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {realInsights.map((insight, i) => <InsightCard key={i} {...insight} type={insight.type as any} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border rounded-lg">
              <BrainCircuit className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">No AI Insights Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">Insights will be generated automatically as you add more patient data and medical records.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="records">
          <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border/50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Recent Medical Records</h2>
                <p className="text-muted-foreground mt-2">Latest patient records and analysis data</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {medicalRecords.length} Records
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mt-4">Loading records...</p>
              </div>
            ) : medicalRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border/50">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground tracking-wider">Record ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground tracking-wider">Student Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground tracking-wider">Severity</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-foreground tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {medicalRecords.slice(0, 5).map((record, index) => (
                        <tr key={record.id} className="hover:bg-muted/20 transition-colors duration-150">
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <span className="font-mono text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                {record.id.substring(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-medium text-foreground">
                              {new Date(record.date || '').toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(record.date || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-medium text-foreground">
                              {record.patient_name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Patient #{index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="h-2.5 w-20 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      record.severity >= 8 ? 'bg-destructive' : 
                                      record.severity >= 5 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} 
                                    style={{ width: `${(record.severity / 10) * 100}%` }}
                                  />
                                </div>
                              </div>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                record.severity >= 8 ? 'text-destructive bg-destructive/10' : 
                                record.severity >= 5 ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20' : 
                                'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                              }`}>
                                {record.severity}/10
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:text-primary/80 hover:bg-primary/10" 
                                onClick={() => { setSelectedRecordForDetails(record); setIsRecordDetailsOpen(true); }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-foreground hover:bg-muted/50" 
                                onClick={() => { setSelectedRecord(record); setIsAnalysisOpen(true); }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10" 
                                onClick={() => handleDeleteAnalysis(record.id)}
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
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <FileText className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-foreground mb-3">No Medical Records Found</h3>
                  <p className="text-muted-foreground mb-8">Create a new medical record to get started with patient management.</p>
                  <Button onClick={handleNewAnalysis} size="lg" className="gap-2">
                    <FileText className="h-5 w-5" />
                    Create First Record
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved-analyses">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Saved Preliminary Records</h2>
            {savedAnalyses.length === 0 ? (
              <div className="text-center py-16">
                <Save className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No Saved Records</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">Records you save from the "New Medical Record" form will appear here for later access.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="th-cell">Date</th>
                      <th className="th-cell">Student Name</th>
                      <th className="th-cell">Symptoms</th>
                      <th className="th-cell">Severity</th>
                      <th className="th-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {savedAnalyses.map(analysis => (
                      <tr key={analysis.id} className="hover:bg-muted/50">
                        <td className="td-cell">{new Date(analysis.date).toLocaleString()}</td>
                        <td className="td-cell">{analysis.studentName || "N/A"}</td>
                        <td className="td-cell max-w-xs truncate">{analysis.symptoms}</td>
                        <td className="td-cell">{analysis.result?.severity || analysis.nlpResult?.severity || "N/A"}</td>
                        <td className="td-cell">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedRecord(analysis); setIsAnalysisOpen(true); }}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAnalysis(analysis.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <MedicalRecordAnalysis record={selectedRecord} isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} onSaved={loadData} />
      <PatientDetailsModal record={selectedRecordForDetails} isOpen={isRecordDetailsOpen} onClose={() => setIsRecordDetailsOpen(false)} />
      <NewNLPAnalysis isOpen={isNewAnalysisOpen} onClose={() => setIsNewAnalysisOpen(false)} onSaved={loadData} />
      
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
                  <Info className="h-5 w-5" />
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
                               </span>
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
      
      <NewNLPAnalysis isOpen={isNewAnalysisOpen} onClose={() => setIsNewAnalysisOpen(false)} onSaved={handleAnalysisSaved} />
      <PatientDetailsModal record={selectedRecordForDetails} isOpen={isRecordDetailsOpen} onClose={() => setIsRecordDetailsOpen(false)} />
    </div>
  );
};

export default Dashboard;
