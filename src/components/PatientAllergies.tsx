import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Edit3, Trash2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PatientAllergy {
  id: string;
  patient_id: string;
  allergen: string;
  severity: string;
  reaction_description?: string;
  onset_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

interface PatientAllergiesProps {
  patientId: string;
  patientName: string;
}

const PatientAllergies: React.FC<PatientAllergiesProps> = ({ patientId, patientName }) => {
  const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<PatientAllergy | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    allergen: '',
    severity: 'mild',
    reaction_description: '',
    onset_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllergies();
  }, [patientId]);

  const fetchAllergies = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_allergies')
        .select('*')
        .eq('patient_id', patientId)
        .order('severity', { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch allergies: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allergyData = {
        patient_id: patientId,
        allergen: formData.allergen,
        severity: formData.severity,
        reaction_description: formData.reaction_description || null,
        onset_date: formData.onset_date || null,
        notes: formData.notes || null,
        is_active: true
      };

      if (editingAllergy) {
        const { error } = await supabase
          .from('patient_allergies')
          .update(allergyData)
          .eq('id', editingAllergy.id);

        if (error) throw error;
        toast.success('Allergy updated successfully');
      } else {
        const { error } = await supabase
          .from('patient_allergies')
          .insert([allergyData]);

        if (error) throw error;
        toast.success('Allergy recorded successfully');
      }

      fetchAllergies();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to save allergy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (allergy: PatientAllergy) => {
    setFormData({
      allergen: allergy.allergen,
      severity: allergy.severity,
      reaction_description: allergy.reaction_description || '',
      onset_date: allergy.onset_date || '',
      notes: allergy.notes || ''
    });
    setEditingAllergy(allergy);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this allergy record?')) return;

    try {
      const { error } = await supabase
        .from('patient_allergies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Allergy deleted successfully');
      fetchAllergies();
    } catch (error: any) {
      toast.error(`Failed to delete allergy: ${error.message}`);
    }
  };

  const toggleActiveStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('patient_allergies')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Allergy ${!isActive ? 'activated' : 'deactivated'}`);
      fetchAllergies();
    } catch (error: any) {
      toast.error(`Failed to update allergy status: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      allergen: '',
      severity: 'mild',
      reaction_description: '',
      onset_date: '',
      notes: ''
    });
    setEditingAllergy(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'mild': return <Shield className="h-4 w-4 text-yellow-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const activeAllergies = allergies.filter(allergy => allergy.is_active);
  const inactiveAllergies = allergies.filter(allergy => !allergy.is_active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Allergies - {patientName}</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Allergy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAllergy ? 'Edit Allergy' : 'Add New Allergy'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allergen">Allergen</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                    value={formData.allergen}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergen: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reaction_description">Reaction Description</Label>
                <Textarea
                  placeholder="Describe the allergic reaction symptoms"
                  value={formData.reaction_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, reaction_description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onset_date">First Occurrence Date</Label>
                <Input
                  type="date"
                  value={formData.onset_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, onset_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  placeholder="Any additional information about this allergy"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingAllergy ? 'Update' : 'Add Allergy'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Critical Allergies Alert */}
      {activeAllergies.some(allergy => allergy.severity === 'severe') && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">
                Critical Allergies Present - Exercise Extreme Caution
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Allergies */}
      <Card>
        <CardHeader>
          <CardTitle>Active Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAllergies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No known allergies</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAllergies.map((allergy) => (
                <div key={allergy.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(allergy.severity)}
                        <h4 className="font-semibold text-lg">{allergy.allergen}</h4>
                        <Badge className={getSeverityColor(allergy.severity)}>
                          {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                        </Badge>
                      </div>
                      
                      {allergy.reaction_description && (
                        <div className="text-sm">
                          <strong>Reaction:</strong> {allergy.reaction_description}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {allergy.onset_date && (
                          <div>
                            <strong>First Occurrence:</strong> {new Date(allergy.onset_date).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <strong>Recorded:</strong> {new Date(allergy.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {allergy.notes && (
                        <div className="text-sm">
                          <strong>Notes:</strong> {allergy.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(allergy)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveStatus(allergy.id, allergy.is_active)}
                      >
                        Deactivate
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(allergy.id)}
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

      {/* Inactive Allergies */}
      {inactiveAllergies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Allergies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveAllergies.map((allergy) => (
                <div key={allergy.id} className="border rounded-lg p-4 space-y-3 opacity-60">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(allergy.severity)}
                        <h4 className="font-semibold text-lg">{allergy.allergen}</h4>
                        <Badge variant="secondary">Inactive</Badge>
                        <Badge className={getSeverityColor(allergy.severity)}>
                          {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                        </Badge>
                      </div>
                      
                      {allergy.reaction_description && (
                        <div className="text-sm">
                          <strong>Reaction:</strong> {allergy.reaction_description}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActiveStatus(allergy.id, allergy.is_active)}
                      >
                        Reactivate
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(allergy.id)}
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
    </div>
  );
};

export default PatientAllergies;