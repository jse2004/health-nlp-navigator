import React, { useState, useEffect } from 'react';
import { CollegeDepartment } from '@/data/sampleData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Search, Download, Plus, Shield, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClearanceRecord {
  id: string;
  medical_record_id: string;
  patient_id: string;
  patient_name: string;
  person_type: 'professor' | 'employee' | 'guest';
  full_name: string;
  age: number;
  gender: string;
  position?: string;
  college_department?: CollegeDepartment;
  faculty?: string;
  clearance_status: 'pending' | 'approved' | 'denied';
  clearance_reason?: string;
  approved_by?: string;
  approved_at?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  severity: number;
  patient_name: string;
  date: string;
}

const ClearanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [clearanceRecords, setClearanceRecords] = useState<ClearanceRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('records');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClearanceRecord | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // New clearance form state
  const [newClearance, setNewClearance] = useState({
    medical_record_id: '',
    person_type: 'professor',
    full_name: '',
    age: '',
    gender: '',
    position: '',
    college_department: '',
    faculty: ''
  });

  // Update clearance form state
  const [updateData, setUpdateData] = useState({
    clearance_status: 'pending',
    clearance_reason: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchClearanceRecords();
    fetchMedicalRecords();
  }, []);

  const fetchClearanceRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clearance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClearanceRecords((data as ClearanceRecord[]) || []);
    } catch (error) {
      console.error('Error fetching clearance records:', error);
      toast.error('Failed to fetch clearance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, diagnosis, severity, patient_name, date')
        .order('date', { ascending: false });

      if (error) throw error;
      setMedicalRecords(data || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Failed to fetch medical records');
    }
  };

  const createClearanceRecord = async () => {
    if (!newClearance.medical_record_id || !newClearance.full_name || !newClearance.age || !newClearance.gender) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const selectedMedicalRecord = medicalRecords.find(r => r.id === newClearance.medical_record_id);
      if (!selectedMedicalRecord) {
        toast.error('Selected medical record not found');
        return;
      }

      // Determine clearance status based on severity
      const clearanceStatus = selectedMedicalRecord.severity >= 7 ? 'denied' : 
                             selectedMedicalRecord.severity >= 4 ? 'pending' : 'approved';
      
      const clearanceData = {
        medical_record_id: newClearance.medical_record_id,
        patient_id: selectedMedicalRecord.id, // Using medical record id as patient reference
        patient_name: selectedMedicalRecord.patient_name,
        person_type: newClearance.person_type,
        full_name: newClearance.full_name,
        age: parseInt(newClearance.age),
        gender: newClearance.gender,
        position: newClearance.position || null,
        college_department: newClearance.college_department as CollegeDepartment || null,
        faculty: newClearance.faculty || null,
        clearance_status: clearanceStatus,
        clearance_reason: clearanceStatus === 'denied' ? 'High severity medical condition' :
                         clearanceStatus === 'pending' ? 'Moderate severity - requires review' :
                         'Low severity - cleared for activities',
        approved_by: clearanceStatus === 'approved' ? user?.id : null,
        approved_at: clearanceStatus === 'approved' ? new Date().toISOString() : null,
        valid_until: clearanceStatus === 'approved' ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
      };

      const { error } = await supabase
        .from('clearance_records')
        .insert(clearanceData);

      if (error) throw error;

      toast.success('Clearance record created successfully');
      setIsCreateOpen(false);
      setNewClearance({
        medical_record_id: '',
        person_type: 'professor',
        full_name: '',
        age: '',
        gender: '',
        position: '',
        college_department: '',
        faculty: ''
      });
      fetchClearanceRecords();
    } catch (error) {
      console.error('Error creating clearance record:', error);
      toast.error('Failed to create clearance record');
    }
  };

  const updateClearanceStatus = async () => {
    if (!selectedRecord || !updateData.clearance_status) {
      toast.error('Please select status and provide reason');
      return;
    }

    try {
      const updatePayload: any = {
        clearance_status: updateData.clearance_status,
        clearance_reason: updateData.clearance_reason,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };

      if (updateData.clearance_status === 'approved' && updateData.valid_until) {
        updatePayload.valid_until = updateData.valid_until;
      }

      const { error } = await supabase
        .from('clearance_records')
        .update(updatePayload)
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast.success('Clearance status updated successfully');
      setIsUpdateOpen(false);
      setSelectedRecord(null);
      fetchClearanceRecords();
    } catch (error) {
      console.error('Error updating clearance status:', error);
      toast.error('Failed to update clearance status');
    }
  };

  const exportClearanceData = async () => {
    try {
      // Convert clearance data to CSV format
      const headers = [
        'ID', 'Medical Record ID', 'Full Name', 'Person Type', 'Age', 'Gender', 
        'Position', 'Department/Faculty', 'Status', 'Reason', 'Created At', 'Valid Until'
      ];

      const csvData = clearanceRecords.map(record => [
        record.id,
        record.medical_record_id,
        record.full_name,
        record.person_type,
        record.age,
        record.gender,
        record.position || '',
        record.college_department || record.faculty || '',
        record.clearance_status,
        record.clearance_reason || '',
        new Date(record.created_at).toLocaleDateString(),
        record.valid_until ? new Date(record.valid_until).toLocaleDateString() : ''
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearance-records-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Clearance data exported successfully');
    } catch (error) {
      console.error('Error exporting clearance data:', error);
      toast.error('Failed to export clearance data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'denied':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const filteredRecords = clearanceRecords.filter(record => {
    const matchesSearch = record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.clearance_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clearance Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage student and employee medical clearances</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportClearanceData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Clearance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Clearance Record</DialogTitle>
                <DialogDescription>
                  Create a new clearance record based on medical examination
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medical_record">Medical Record</Label>
                  <Select
                    value={newClearance.medical_record_id}
                    onValueChange={(value) => setNewClearance(prev => ({ ...prev, medical_record_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medical record" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicalRecords.map(record => (
                        <SelectItem key={record.id} value={record.id}>
                          {record.patient_name} - {record.diagnosis} (Severity: {record.severity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="person_type">Person Type</Label>
                  <Select
                    value={newClearance.person_type}
                    onValueChange={(value) => setNewClearance(prev => ({ ...prev, person_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newClearance.full_name}
                      onChange={(e) => setNewClearance(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newClearance.age}
                      onChange={(e) => setNewClearance(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Enter age"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={newClearance.gender}
                    onValueChange={(value) => setNewClearance(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newClearance.person_type === 'professor' || newClearance.person_type === 'employee') && (
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={newClearance.position}
                      onChange={(e) => setNewClearance(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Enter position"
                    />
                  </div>
                )}

                {newClearance.person_type === 'professor' && (
                  <div>
                    <Label htmlFor="college_department">College Department</Label>
                    <Select
                      value={newClearance.college_department}
                      onValueChange={(value) => setNewClearance(prev => ({ ...prev, college_department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CED">College of Education</SelectItem>
                        <SelectItem value="CCS">College of Computing Science</SelectItem>
                        <SelectItem value="CCJ">College of Criminal Justice</SelectItem>
                        <SelectItem value="CHS">College of Health Science</SelectItem>
                        <SelectItem value="CAS">College of Arts and Science</SelectItem>
                        <SelectItem value="CBA">College of Business Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newClearance.person_type === 'employee' && (
                  <div>
                    <Label htmlFor="faculty">Faculty</Label>
                    <Input
                      id="faculty"
                      value={newClearance.faculty}
                      onChange={(e) => setNewClearance(prev => ({ ...prev, faculty: e.target.value }))}
                      placeholder="Enter faculty"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createClearanceRecord}>
                    Create Clearance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Clearance Records
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading clearance records...</div>
                </CardContent>
              </Card>
            ) : filteredRecords.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-gray-500">No clearance records found</div>
                </CardContent>
              </Card>
            ) : (
              filteredRecords.map(record => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{record.full_name}</h3>
                          <Badge className={getStatusColor(record.clearance_status)}>
                            {getStatusIcon(record.clearance_status)}
                            <span className="ml-1 capitalize">{record.clearance_status}</span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Type:</span> {record.person_type}
                          </div>
                          <div>
                            <span className="font-medium">Age:</span> {record.age}
                          </div>
                          <div>
                            <span className="font-medium">Gender:</span> {record.gender}
                          </div>
                          {record.position && (
                            <div>
                              <span className="font-medium">Position:</span> {record.position}
                            </div>
                          )}
                        </div>
                        {record.clearance_reason && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Reason:</span> {record.clearance_reason}
                          </p>
                        )}
                        {record.valid_until && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Valid Until:</span> {new Date(record.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setUpdateData({
                              clearance_status: record.clearance_status,
                              clearance_reason: record.clearance_reason || '',
                              valid_until: record.valid_until || ''
                            });
                            setIsUpdateOpen(true);
                          }}
                        >
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clearanceRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {clearanceRecords.filter(r => r.clearance_status === 'approved').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {clearanceRecords.filter(r => r.clearance_status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Clearance Status</DialogTitle>
            <DialogDescription>
              Update the clearance status for {selectedRecord?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Clearance Status</Label>
              <Select
                value={updateData.clearance_status}
                onValueChange={(value) => setUpdateData(prev => ({ ...prev, clearance_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={updateData.clearance_reason}
                onChange={(e) => setUpdateData(prev => ({ ...prev, clearance_reason: e.target.value }))}
                placeholder="Enter reason for status change"
              />
            </div>

            {updateData.clearance_status === 'approved' && (
              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={updateData.valid_until}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateClearanceStatus}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClearanceManagement;