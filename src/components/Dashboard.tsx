import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BrainCircuit, FileText, Heart, Save } from 'lucide-react';
import { patients, medicalRecords, analyticsSummary, insightData, MedicalRecord } from '@/data/sampleData';
import AnalyticsSummary from './AnalyticsSummary';
import PatientsList from './PatientsList';
import InsightCard from './InsightCard';
import MedicalRecordAnalysis from './MedicalRecordAnalysis';
import NewNLPAnalysis from './NewNLPAnalysis';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const Dashboard: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);

  useEffect(() => {
    // Load saved analyses from localStorage
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

    // Set up event listener to detect changes in localStorage
    const handleStorageChange = () => {
      loadSavedAnalyses();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener for same-tab updates
    window.addEventListener('savedAnalysesUpdated', loadSavedAnalyses);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedAnalysesUpdated', loadSavedAnalyses);
    };
  }, []);

  const handleViewPatientRecord = (patientId: string) => {
    const record = medicalRecords.find(record => record.patientId === patientId);
    if (record) {
      setSelectedRecord(record);
      setIsAnalysisOpen(true);
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

  const handleDeleteAnalysis = (id: string) => {
    try {
      const updatedAnalyses = savedAnalyses.filter(analysis => analysis.id !== id);
      localStorage.setItem('savedAnalyses', JSON.stringify(updatedAnalyses));
      setSavedAnalyses(updatedAnalyses);
      toast.success('Analysis deleted successfully');
      
      // Dispatch custom event to notify other tabs/components
      window.dispatchEvent(new Event('savedAnalysesUpdated'));
    } catch (error) {
      toast.error('Error deleting analysis');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Dashboard</h1>
          <p className="text-gray-500">Analyze patient records with AI assistance</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleNewAnalysis}>
          <FileText className="h-4 w-4" />
          <span>New Medical Record</span>
        </Button>
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
          
          <Button variant="ghost" size="sm" className="text-medical-primary flex items-center gap-1">
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="patients" className="mt-0">
          <PatientsList 
            patients={patients} 
            onSelectPatient={(patient) => handleViewPatientRecord(patient.id)}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insightData.map(insight => (
              <InsightCard 
                key={insight.id}
                title={insight.title}
                content={insight.content} 
                type={insight.type as any}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Medical Records</h2>
              <Button variant="outline" size="sm" onClick={handleNewAnalysis}>
                <FileText className="h-4 w-4 mr-1" />
                <span>New Record</span>
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Use optional chaining or provide a fallback for patientName */}
                        {record.patientName || "Student Record"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-16 bg-gray-200 rounded-full">
                            <div 
                              className={`h-full rounded-full ${
                                record.severity >= 8 ? 'bg-medical-critical' : 
                                record.severity >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                              }`}
                              style={{ width: `${(record.severity / 10) * 100}%` }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-500">{record.severity}/10</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-medical-primary"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsAnalysisOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="saved-analyses" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Saved Medical Records</h2>
              <Button variant="outline" size="sm" onClick={handleNewAnalysis}>
                <FileText className="h-4 w-4 mr-1" />
                <span>New Record</span>
              </Button>
            </div>
            
            {savedAnalyses.length === 0 ? (
              <div className="text-center py-10">
                <Save className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No saved records yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Create a new medical record using the "New Medical Record" button and save it to view it here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symptoms
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {savedAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(analysis.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.studentName || "Student"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {analysis.symptoms?.substring(0, 100) || analysis.text?.substring(0, 100)}{(analysis.symptoms?.length > 100 || analysis.text?.length > 100) ? '...' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(analysis.result?.severity || analysis.nlpResult?.severity) && (
                            <div className="flex items-center">
                              <div className="h-2 w-16 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-full rounded-full ${
                                    (analysis.result?.severity || analysis.nlpResult?.severity) >= 8 ? 'bg-medical-critical' : 
                                    (analysis.result?.severity || analysis.nlpResult?.severity) >= 5 ? 'bg-medical-warning' : 'bg-medical-success'
                                  }`}
                                  style={{ width: `${((analysis.result?.severity || analysis.nlpResult?.severity) / 10) * 100}%` }}
                                />
                              </div>
                              <span className="ml-2 text-xs text-gray-500">{analysis.result?.severity || analysis.nlpResult?.severity}/10</span>
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
                                patientId: analysis.studentId || '',
                                patientName: analysis.studentName || '',
                                date: analysis.date,
                                diagnosis: analysis.diagnosis || '',
                                severity: analysis.result?.severity || analysis.nlpResult?.severity || 5,
                                doctorNotes: analysis.symptoms || analysis.text || '',
                                recommendedActions: []
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
      />

      <NewNLPAnalysis
        isOpen={isNewAnalysisOpen}
        onClose={() => setIsNewAnalysisOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
