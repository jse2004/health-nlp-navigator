import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicalRecord } from '@/data/sampleData';
import { fetchMedicalRecords, deleteMedicalRecord, downloadEnhancedRecordsCSV } from '@/services/dataService';
import { toast } from 'sonner';
import MedicalRecordAnalysis from '@/components/MedicalRecordAnalysis';
import SearchBar from '@/components/SearchBar';
import NewNLPAnalysis from '@/components/NewNLPAnalysis';

const MedicalRecordsPage = () => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | undefined>(undefined);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<MedicalRecord | null>(null);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);
  const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const recordsData = await fetchMedicalRecords(searchQuery);
      setMedicalRecords(recordsData);
    } catch (error) {
      toast.error('Failed to load medical records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debouncedLoad = setTimeout(() => { loadData(); }, 300);
    return () => clearTimeout(debouncedLoad);
  }, [searchQuery]);

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

  return (
    <div className="space-y-6">
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border/50">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
                <p className="text-muted-foreground">Patient records and medical analysis data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar onSearch={setSearchQuery} placeholder="Search records..." />
              <Badge variant="secondary" className="px-3 py-1.5 font-medium whitespace-nowrap">
                {medicalRecords.length} Total
              </Badge>
              <Button variant="outline" size="sm" onClick={downloadAllRecords} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setIsNewAnalysisOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                New Record
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading medical records...</p>
            </div>
          ) : medicalRecords.length > 0 ? (
            <div className="space-y-4">
              {medicalRecords.map((record, index) => (
                <div key={record.id} className="group bg-background border border-border/50 rounded-lg p-5 hover:shadow-md hover:border-border transition-all duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm text-foreground bg-muted/50 px-2 py-1 rounded-md inline-block">
                          ID: {record.id.split('-')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(record.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-foreground">{record.patient_name || "Unknown Patient"}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.diagnosis ? record.diagnosis.substring(0, 30) + (record.diagnosis.length > 30 ? '...' : '') : 'No diagnosis'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Severity</span>
                          <span className="text-xs font-semibold text-foreground">{record.severity}/10</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              record.severity >= 9 ? 'bg-destructive' : 
                              record.severity >= 7 ? 'bg-orange-500' : 
                              record.severity >= 5 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`} 
                            style={{ width: `${(record.severity / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant={record.severity >= 8 ? "destructive" : record.severity >= 6 ? "secondary" : "outline"} className="ml-2">
                        {record.severity >= 8 ? 'Critical' : record.severity >= 6 ? 'High' : record.severity >= 4 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => { setSelectedRecordForDetails(record); setIsRecordDetailsOpen(true); }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => handleDeleteAnalysis(record.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No Medical Records</h3>
                <p className="text-muted-foreground mb-6">Start by creating your first medical record to track patient data and analysis.</p>
                <Button onClick={() => setIsNewAnalysisOpen(true)} size="lg" className="gap-2">
                  <FileText className="h-5 w-5" />
                  Create First Record
                </Button>
              </div>
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
      <NewNLPAnalysis 
        isOpen={isNewAnalysisOpen}
        onClose={() => { setIsNewAnalysisOpen(false); loadData(); }} 
      />
    </div>
  );
};

export default MedicalRecordsPage;
