import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pill, Plus, Edit3, Trash2, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MedicationPrescription {
  id: string;
  patient_id: string;
  medical_record_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  start_date: string;
  end_date?: string;
  instructions?: string;
  status: string;
  created_at: string;
}

interface MedicationPrescriptionsProps {
  patientId: string;
  patientName: string;
  medicalRecordId?: string;
}

const MedicationPrescriptions: React.FC<MedicationPrescriptionsProps> = ({ 
  patientId, 
  patientName, 
  medicalRecordId 
}) => {
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<MedicationPrescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration_days: '',
    start_date: new Date().toISOString().split('T')[0],
    instructions: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch prescriptions: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endDate = formData.duration_days 
        ? new Date(formData.start_date) 
        : null;
      
      if (endDate && formData.duration_days) {
        endDate.setDate(endDate.getDate() + parseInt(formData.duration_days));
      }

      const prescriptionData = {
        patient_id: patientId,
        medical_record_id: medicalRecordId || null,
        medication_name: formData.medication_name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        start_date: formData.start_date,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        instructions: formData.instructions || null,
        status: 'active'
      };

      if (editingPrescription) {
        const { error } = await supabase
          .from('medication_prescriptions')
          .update(prescriptionData)
          .eq('id', editingPrescription.id);

        if (error) throw error;
        toast.success('Prescription updated successfully');
      } else {
        const { error } = await supabase
          .from('medication_prescriptions')
          .insert([prescriptionData]);

        if (error) throw error;
        toast.success('Prescription added successfully');
      }

      fetchPrescriptions();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to save prescription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prescription: MedicationPrescription) => {
    setFormData({
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration_days: prescription.duration_days?.toString() || '',
      start_date: prescription.start_date,
      instructions: prescription.instructions || ''
    });
    setEditingPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const { error } = await supabase
        .from('medication_prescriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Prescription deleted successfully');
      fetchPrescriptions();
    } catch (error: any) {
      toast.error(`Failed to delete prescription: ${error.message}`);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('medication_prescriptions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Prescription ${status}`);
      fetchPrescriptions();
    } catch (error: any) {
      toast.error(`Failed to update prescription: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      duration_days: '',
      start_date: new Date().toISOString().split('T')[0],
      instructions: ''
    });
    setEditingPrescription(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (prescription: MedicationPrescription) => {
    if (!prescription.end_date) return false;
    return new Date(prescription.end_date) < new Date();
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'active' && !isExpired(p));
  const expiredPrescriptions = prescriptions.filter(p => p.status === 'active' && isExpired(p));
  const inactivePrescriptions = prescriptions.filter(p => p.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Medications - {patientName}</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Prescribe Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrescription ? 'Edit Prescription' : 'New Prescription'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Amoxicillin, Ibuprofen"
                    value={formData.medication_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 500mg, 200mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once daily">Once daily</SelectItem>
                      <SelectItem value="twice daily">Twice daily</SelectItem>
                      <SelectItem value="three times daily">Three times daily</SelectItem>
                      <SelectItem value="four times daily">Four times daily</SelectItem>
                      <SelectItem value="every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="every 12 hours">Every 12 hours</SelectItem>
                      <SelectItem value="as needed">As needed</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_days">Duration (days)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 7, 14, 30"
                    value={formData.duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_days: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  placeholder="Special instructions (e.g., take with food, avoid alcohol)"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingPrescription ? 'Update' : 'Prescribe'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active prescriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePrescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Pill className="h-5 w-5 text-blue-500" />
                        <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Dosage:</strong> {prescription.dosage}</div>
                        <div><strong>Frequency:</strong> {prescription.frequency}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <strong>Start:</strong> {new Date(prescription.start_date).toLocaleDateString()}
                        </div>
                        {prescription.end_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <strong>End:</strong> {new Date(prescription.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {prescription.instructions && (
                        <div className="text-sm">
                          <strong>Instructions:</strong> {prescription.instructions}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(prescription)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(prescription.id, 'completed')}
                      >
                        Complete
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(prescription.id, 'discontinued')}
                      >
                        Discontinue
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(prescription.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Prescriptions */}
      {expiredPrescriptions.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">Expired Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="border border-orange-200 rounded-lg p-4 space-y-3 bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Pill className="h-5 w-5 text-orange-500" />
                        <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
                        <Badge className="bg-orange-100 text-orange-800">Expired</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Dosage:</strong> {prescription.dosage}</div>
                        <div><strong>Frequency:</strong> {prescription.frequency}</div>
                        <div><strong>Expired:</strong> {new Date(prescription.end_date!).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(prescription.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(prescription.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Prescriptions */}
      {inactivePrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactivePrescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 space-y-3 opacity-60">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Pill className="h-5 w-5 text-gray-500" />
                        <h4 className="font-semibold text-lg">{prescription.medication_name}</h4>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Dosage:</strong> {prescription.dosage}</div>
                        <div><strong>Frequency:</strong> {prescription.frequency}</div>
                        <div><strong>Period:</strong> {new Date(prescription.start_date).toLocaleDateString()} - 
                          {prescription.end_date ? new Date(prescription.end_date).toLocaleDateString() : 'Ongoing'}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(prescription.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicationPrescriptions;