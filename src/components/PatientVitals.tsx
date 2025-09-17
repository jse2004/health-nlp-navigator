import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Heart, Thermometer, Scale, Ruler, Droplets, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PatientVital {
  id: string;
  patient_id: string;
  recorded_at: string;
  weight_kg?: number;
  height_cm?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature_celsius?: number;
  oxygen_saturation?: number;
  blood_glucose?: number;
  respiratory_rate?: number;
  notes?: string;
}

interface PatientVitalsProps {
  patientId: string;
  patientName: string;
}

const PatientVitals: React.FC<PatientVitalsProps> = ({ patientId, patientName }) => {
  const [vitals, setVitals] = useState<PatientVital[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('weight_kg');
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature_celsius: '',
    oxygen_saturation: '',
    blood_glucose: '',
    respiratory_rate: '',
    notes: ''
  });

  useEffect(() => {
    fetchVitals();
  }, [patientId]);

  const fetchVitals = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setVitals(data || []);
    } catch (error: any) {
      toast.error(`Failed to fetch vitals: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vitalData: any = {
        patient_id: patientId,
        recorded_at: new Date().toISOString(),
        notes: formData.notes || null
      };

      // Only include non-empty numeric values
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'notes' && value.trim() !== '') {
          vitalData[key] = parseFloat(value);
        }
      });

      const { error } = await supabase
        .from('patient_vitals')
        .insert([vitalData]);

      if (error) throw error;

      toast.success('Vitals recorded successfully');
      fetchVitals();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to record vitals: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      weight_kg: '',
      height_cm: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature_celsius: '',
      oxygen_saturation: '',
      blood_glucose: '',
      respiratory_rate: '',
      notes: ''
    });
  };

  const getLatestVital = () => {
    return vitals.length > 0 ? vitals[0] : null;
  };

  const getChartData = () => {
    return vitals
      .filter(vital => vital[selectedMetric as keyof PatientVital] != null)
      .reverse()
      .map(vital => ({
        date: new Date(vital.recorded_at).toLocaleDateString(),
        value: vital[selectedMetric as keyof PatientVital] as number,
        fullDate: vital.recorded_at
      }))
      .slice(-10); // Last 10 readings
  };

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'weight_kg': return 'kg';
      case 'height_cm': return 'cm';
      case 'temperature_celsius': return '°C';
      case 'heart_rate': return 'bpm';
      case 'blood_pressure_systolic': return 'mmHg';
      case 'blood_pressure_diastolic': return 'mmHg';
      case 'oxygen_saturation': return '%';
      case 'blood_glucose': return 'mg/dL';
      case 'respiratory_rate': return '/min';
      default: return '';
    }
  };

  const latestVital = getLatestVital();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Vital Signs - {patientName}</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record Vitals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Vital Signs</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="175"
                    value={formData.height_cm}
                    onChange={(e) => setFormData(prev => ({ ...prev, height_cm: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bp_systolic">Blood Pressure (Systolic)</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={formData.blood_pressure_systolic}
                    onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bp_diastolic">Blood Pressure (Diastolic)</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={formData.blood_pressure_diastolic}
                    onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="75"
                    value={formData.heart_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, heart_rate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={formData.temperature_celsius}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature_celsius: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={formData.oxygen_saturation}
                    onChange={(e) => setFormData(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood_glucose">Blood Glucose (mg/dL)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="100"
                    value={formData.blood_glucose}
                    onChange={(e) => setFormData(prev => ({ ...prev, blood_glucose: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="respiratory_rate">Respiratory Rate (/min)</Label>
                  <Input
                    type="number"
                    placeholder="16"
                    value={formData.respiratory_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, respiratory_rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  placeholder="Additional observations or notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Vitals'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Latest Vitals Overview */}
      {latestVital && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Scale className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weight</p>
                  <p className="text-xl font-bold">{latestVital.weight_kg || 'N/A'} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                  <p className="text-xl font-bold">{latestVital.heart_rate || 'N/A'} bpm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                  <p className="text-xl font-bold">{latestVital.temperature_celsius || 'N/A'}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
                  <p className="text-xl font-bold">
                    {latestVital.blood_pressure_systolic && latestVital.blood_pressure_diastolic
                      ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vitals Chart */}
      {vitals.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vitals Trend
              </CardTitle>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border rounded-md bg-background"
              >
                <option value="weight_kg">Weight</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="temperature_celsius">Temperature</option>
                <option value="blood_pressure_systolic">BP Systolic</option>
                <option value="oxygen_saturation">Oxygen Saturation</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value: number) => [
                      `${value} ${getMetricUnit(selectedMetric)}`, 
                      selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vitals History */}
      <Card>
        <CardHeader>
          <CardTitle>Vitals History</CardTitle>
        </CardHeader>
        <CardContent>
          {vitals.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vital signs recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vitals.map((vital) => (
                <div key={vital.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      {new Date(vital.recorded_at).toLocaleDateString()} - {new Date(vital.recorded_at).toLocaleTimeString()}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {vital.weight_kg && <div><strong>Weight:</strong> {vital.weight_kg} kg</div>}
                    {vital.height_cm && <div><strong>Height:</strong> {vital.height_cm} cm</div>}
                    {vital.heart_rate && <div><strong>Heart Rate:</strong> {vital.heart_rate} bpm</div>}
                    {vital.temperature_celsius && <div><strong>Temperature:</strong> {vital.temperature_celsius}°C</div>}
                    {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                      <div><strong>BP:</strong> {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</div>
                    )}
                    {vital.oxygen_saturation && <div><strong>O2 Sat:</strong> {vital.oxygen_saturation}%</div>}
                    {vital.blood_glucose && <div><strong>Glucose:</strong> {vital.blood_glucose} mg/dL</div>}
                    {vital.respiratory_rate && <div><strong>Resp Rate:</strong> {vital.respiratory_rate}/min</div>}
                  </div>
                  {vital.notes && (
                    <div className="text-sm">
                      <strong>Notes:</strong> {vital.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientVitals;