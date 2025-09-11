import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BrainCircuit, FileText, Heart, Save, Search, Download, Eye } from 'lucide-react';
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
import { fetchPatients, fetchMedicalRecords, deleteMedicalRecord, deletePatient, getAnalyticsData, downloadEnhancedRecordsCSV } from '@/services/dataService';

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsSummary, setAnalyticsSummary] = useState({
    totalPatients: 0,
    criticalCases: 0,
    pendingReviews: 0,
    recentAdmissions: 0,
    previousTotalPatients: 0,
    previousCriticalCases: 0,
    previousPendingReviews: 0
  });

  // Load analytics data from database
  const loadAnalyticsData = async () => {
    try {
      const analyticsData = await getAnalyticsData();
      console.log('Analytics calculated:', analyticsData);
      setAnalyticsSummary(analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error loading analytics:', error);
      return {
        totalPatients: 0,
        criticalCases: 0,
        pendingReviews: 0,
        recentAdmissions: 0,
        previousTotalPatients: 0,
        previousCriticalCases: 0,
        previousPendingReviews: 0
      };
    }
  };

  // Generate real insights from actual data
  const generateRealInsights = (patients: Patient[], records: MedicalRecord[]) => {
    const insights = [];
    
    // Analyze condition patterns
    const conditionCounts = patients.reduce((acc: Record<string, number>, patient) => {
      if (patient.condition) {
        acc[patient.condition] = (acc[patient.condition] || 0) + 1;
      }
      return acc;
    }, {});
    
    const mostCommonCondition = Object.entries(conditionCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostCommonCondition) {
      insights.push({
        title: "Pattern Recognition",
        content: `Most common condition: ${mostCommonCondition[0]} (${mostCommonCondition[1]} cases)`,
        type: "trend"
      });
    }
    
    // Analyze severity patterns
    const highSeverityRecords = records.filter(r => r.severity && r.severity >= 8).length;
    if (highSeverityRecords > 0) {
      insights.push({
        title: "High Severity Alert",
        content: `${highSeverityRecords} records with severity 8+ require immediate attention`,
        type: "clinical"
      });
    }
    
    // Analyze recent activity
    const recentRecords = records.filter(r => {
      if (!r.date) return false;
      const recordDate = new Date(r.date);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return recordDate >= threeDaysAgo;
    }).length;
    
    if (recentRecords > 0) {
      insights.push({
        title: "Recent Activity",
        content: `${recentRecords} new medical records added in the last 3 days`,
        type: "care"
      });
    }
    
    // Analyze pending reviews
    const pendingDiagnosis = records.filter(r => !r.diagnosis || r.diagnosis.trim() === '').length;
    if (pendingDiagnosis > 0) {
      insights.push({
        title: "Care Gap Identified",
        content: `${pendingDiagnosis} records awaiting diagnosis confirmation`,
        type: "medication"
      });
    }
    
    return insights.slice(0, 4); // Return top 4 insights
  };

  // Fetch patients and records from Supabase
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading data from database...');
      
      const [patientsData, recordsData, analyticsData] = await Promise.all([
        fetchPatients(searchQuery),
        fetchMedicalRecords(searchQuery),
        loadAnalyticsData()
      ]);
      
      setPatients(patientsData);
      setMedicalRecords(recordsData);
      
      console.log('Patients loaded:', patientsData.length);
      console.log('Medical records loaded:', recordsData.length);
      
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load and event listeners setup
  useEffect(() => {
    loadData();
    
    // Load saved analyses from localStorage (legacy support)
    const loadSavedAnalyses = () => {
      try {
        const saved = localStorage.getItem('savedAnalyses');
        if (saved) {
          setSavedAnalyses(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved analyses:', error);
      }
    };
    
    loadSavedAnalyses();

    // Set up event listener to detect changes
    const handleStorageChange = () => {
      loadSavedAnalyses();
      loadData(); // Refresh data when changes occur
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedAnalysesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedAnalysesUpdated', handleStorageChange);
    };
  }, []);

  // Handle search with real-time data refresh
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleViewPatientRecord = (patientId: string) => {
    const record = medicalRecords.find(record => record.patient_id === patientId);
    if (record) {
      setSelectedRecord(record);
      setIsAnalysisOpen(true);
    } else {
      toast.error('No medical record found for this patient');
    }
  };

  const handleNewAnalysis = () => {
    setIsNewAnalysisOpen(true);
    toast.info("Creating new medical record");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      if (confirm('Are you sure you want to delete this record?')) {
        console.log('Attempting to delete record:', id);
        await deleteMedicalRecord(id);
        console.log('Record deleted, refreshing data...');
        
        // Force refresh the data immediately
        await loadData();
        
        toast.success('Record deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Error deleting record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Function to download all records as enhanced CSV with college departments and visit history
  const downloadAllRecords = async () => {
    try {
      await downloadEnhancedRecordsCSV();
      toast.success("Enhanced records with department analytics downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download records");
    }
  };

  const handleViewAll = () => {
    setIsViewAllOpen(true);
  };

  // Generate real insights
  const realInsights = generateRealInsights(patients, medicalRecords);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Analyze patient records with AI assistance</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar onSearch={handleSearch} placeholder="Search patients or records..." />
          <Button className="flex items-center gap-2" onClick={handleNewAnalysis}>
            <FileText className="h-4 w-4" />
            <span>New Medical Record</span>
          </Button>
        </div>
      </div>

      <AnalyticsSummary data={analyticsSummary} />

      <Tabs defaultValue="patients" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="patients" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>Patients</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <BrainCircuit className="h-4 w-4" />
              <span>AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Medical Records</span>
            </TabsTrigger>
            <TabsTrigger value="saved-analyses" className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              <span>Saved Records</span>
            </TabsTrigger>
          </TabsList>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-medical-primary flex items-center gap-1"
            onClick={handleViewAll}
          >
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="patients" className="mt-0">
          <PatientsList 
            patients={patients}
            onSelectPatient={(patient) => handleViewPatientRecord(patient.id)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {realInsights.length > 0 ? (
              realInsights.map((insight, index) => (
                <InsightCard 
                  key={index}
                  title={insight.title}
                  content={insight.content}
                  type={insight.type as any}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <BrainCircuit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No insights available</h3>
                <p className="text-gray-500 dark:text-gray-400">Add more patient data to generate AI insights</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Medical Records</h2>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="text-center py-8">Loading records...</p>
              ) : medicalRecords.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Record ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Severity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {medicalRecords.slice(0, 5).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(record.date || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {record.patient_name || "Student Record"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full">
                              <div 
                                className={`h-full rounded-full ${
                                  (record.severity || 0) >= 8 ? 'bg-medical-critical' : 
                                  (record.severity || 0) >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                                }`}
                                style={{ width: `${((record.severity || 0) / 10) * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">{record.severity || 0}/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDetailsOpen(true);
                            }}
                          >
                            Details
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-medical-primary mr-2"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsAnalysisOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteAnalysis(record.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No medical records found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                    Create a new medical record using the "New Medical Record" button above.
                  </p>
                  <Button onClick={handleNewAnalysis}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Medical Record
                  </Button>
                </div>
              )}
              
              {medicalRecords.length > 5 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleViewAll}
                  >
                    View All Records
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="saved-analyses" className="mt-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Saved Medical Records</h2>
            </div>
            
            {savedAnalyses.length === 0 ? (
              <div className="text-center py-10">
                <Save className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No saved records yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Create a new medical record using the "New Medical Record" button and save it to view it here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Severity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {savedAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(analysis.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {analysis.studentName || "Student"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {analysis.symptoms?.substring(0, 100) || analysis.text?.substring(0, 100)}{(analysis.symptoms?.length > 100 || analysis.text?.length > 100) ? '...' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(analysis.result?.severity || analysis.nlpResult?.severity) && (
                            <div className="flex items-center">
                              <div className="h-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full">
                                <div 
                                  className={`h-full rounded-full ${
                                    (analysis.result?.severity || analysis.nlpResult?.severity) >= 8 ? 'bg-medical-critical' : 
                                    (analysis.result?.severity || analysis.nlpResult?.severity) >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                                  }`}
                                  style={{ width: `${((analysis.result?.severity || analysis.nlpResult?.severity) / 10) * 100}%` }}
                                />
                              </div>
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">{analysis.result?.severity || analysis.nlpResult?.severity}/10</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-medical-primary mr-2"
                            onClick={() => {
                              // Convert saved analysis to medical record format for editing
                              const recordToEdit = {
                                id: analysis.id,
                                patient_id: analysis.studentId || '',
                                patient_name: analysis.studentName || '',
                                date: analysis.date,
                                diagnosis: analysis.diagnosis || '',
                                severity: analysis.result?.severity || analysis.nlpResult?.severity || 5,
                                doctor_notes: analysis.symptoms || analysis.text || '',
                                recommended_actions: []
                              };
                              setSelectedRecord(recordToEdit as MedicalRecord);
                              setIsAnalysisOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="text-destructive"
                          >
                            Delete
                          </Button>
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

      <MedicalRecordAnalysis 
        record={selectedRecord}
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        onSaved={loadData}
      />

      <PatientDetailsModal 
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <NewNLPAnalysis
        isOpen={isNewAnalysisOpen}
        onClose={() => setIsNewAnalysisOpen(false)}
        onSaved={loadData}
      />
      
      {/* View All Records Modal */}
      {isViewAllOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-11/12 max-w-6xl h-5/6 rounded-lg p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">All Medical Records</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadAllRecords}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download All</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsViewAllOpen(false)}
                  className="text-destructive"
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="overflow-auto flex-grow">
              {medicalRecords.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Record ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Diagnosis
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Severity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {medicalRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.id?.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(record.date || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {record.patient_name || "Student Record"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {record.diagnosis || "No diagnosis"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full">
                              <div 
                                className={`h-full rounded-full ${
                                  (record.severity || 0) >= 8 ? 'bg-medical-critical' : 
                                  (record.severity || 0) >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                                }`}
                                style={{ width: `${((record.severity || 0) / 10) * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">{record.severity || 0}/10</span>
                          </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setSelectedRecordForDetails(record);
                                setIsRecordDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-medical-primary"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsAnalysisOpen(true);
                                setIsViewAllOpen(false);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                handleDeleteAnalysis(record.id);
                                if (medicalRecords.length === 1) {
                                  setIsViewAllOpen(false);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No medical records found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Create a new medical record to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Patient Details Modal for Records */}
      <PatientDetailsModal
        record={selectedRecordForDetails}
        isOpen={isRecordDetailsOpen}
        onClose={() => setIsRecordDetailsOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
