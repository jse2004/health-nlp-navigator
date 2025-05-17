
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BrainCircuit, FileText, Heart, MessageSquare } from 'lucide-react';
import { patients, medicalRecords, analyticsSummary, insightData, MedicalRecord } from '@/data/sampleData';
import AnalyticsSummary from './AnalyticsSummary';
import PatientsList from './PatientsList';
import InsightCard from './InsightCard';
import MedicalRecordAnalysis from './MedicalRecordAnalysis';
import NewNLPAnalysis from './NewNLPAnalysis';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);

  const handleViewPatientRecord = (patientId: string) => {
    const record = medicalRecords.find(record => record.patientId === patientId);
    if (record) {
      setSelectedRecord(record);
      setIsAnalysisOpen(true);
    }
  };

  const handleNewAnalysis = () => {
    setIsNewAnalysisOpen(true);
    toast.info("Starting new NLP analysis session");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Dashboard</h1>
          <p className="text-gray-500">Analyze patient records with AI assistance</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleNewAnalysis}>
          <BrainCircuit className="h-4 w-4" />
          <span>New NLP Analysis</span>
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
            <TabsTrigger value="messages" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Messages</span>
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
              <Button variant="outline" size="sm">
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
                      Diagnosis
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
                        {record.diagnosis}
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
                          Analyze
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center h-64">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No new messages</h3>
              <p className="text-gray-500 max-w-sm">You're all caught up! New messages from healthcare providers will appear here.</p>
            </div>
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
