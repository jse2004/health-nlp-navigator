import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, Users, Bed, Stethoscope, Pill, Calendar, Download, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResourceMetrics {
  staffUtilization: {
    doctors: { available: number; busy: number; utilization: number };
    nurses: { available: number; busy: number; utilization: number };
    support: { available: number; busy: number; utilization: number };
  };
  facilityUsage: {
    consultationRooms: { total: number; occupied: number; utilization: number };
    emergencyBeds: { total: number; occupied: number; utilization: number };
    equipment: { total: number; inUse: number; maintenance: number; utilization: number };
  };
  timeAnalysis: {
    avgWaitTime: number;
    avgConsultationTime: number;
    peakHours: { hour: number; visits: number }[];
    dailyCapacity: { day: string; capacity: number; used: number }[];
  };
  costAnalysis: {
    totalCost: number;
    costPerPatient: number;
    medicationCosts: number;
    staffCosts: number;
    facilityCosts: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ResourceUtilization: React.FC = () => {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadResourceMetrics();
  }, [timeRange]);

  const loadResourceMetrics = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would fetch from various tables
      // For now, we'll generate realistic sample data
      const sampleMetrics: ResourceMetrics = {
        staffUtilization: {
          doctors: { available: 8, busy: 6, utilization: 75 },
          nurses: { available: 12, busy: 9, utilization: 75 },
          support: { available: 6, busy: 3, utilization: 50 }
        },
        facilityUsage: {
          consultationRooms: { total: 10, occupied: 7, utilization: 70 },
          emergencyBeds: { total: 4, occupied: 2, utilization: 50 },
          equipment: { total: 25, inUse: 18, maintenance: 2, utilization: 72 }
        },
        timeAnalysis: {
          avgWaitTime: 15, // minutes
          avgConsultationTime: 25, // minutes
          peakHours: [
            { hour: 9, visits: 12 },
            { hour: 10, visits: 18 },
            { hour: 11, visits: 22 },
            { hour: 12, visits: 15 },
            { hour: 13, visits: 8 },
            { hour: 14, visits: 14 },
            { hour: 15, visits: 20 },
            { hour: 16, visits: 16 },
            { hour: 17, visits: 10 }
          ],
          dailyCapacity: [
            { day: 'Mon', capacity: 100, used: 85 },
            { day: 'Tue', capacity: 100, used: 92 },
            { day: 'Wed', capacity: 100, used: 78 },
            { day: 'Thu', capacity: 100, used: 88 },
            { day: 'Fri', capacity: 100, used: 95 },
            { day: 'Sat', capacity: 80, used: 45 },
            { day: 'Sun', capacity: 60, used: 32 }
          ]
        },
        costAnalysis: {
          totalCost: 125000,
          costPerPatient: 85,
          medicationCosts: 45000,
          staffCosts: 65000,
          facilityCosts: 15000
        }
      };

      setMetrics(sampleMetrics);
      
    } catch (error) {
      console.error('Error loading resource metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load resource utilization data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-yellow-600';
    if (utilization >= 50) return 'text-green-600';
    return 'text-blue-600';
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 90) return { status: 'Critical', color: 'bg-red-500' };
    if (utilization >= 75) return { status: 'High', color: 'bg-yellow-500' };
    if (utilization >= 50) return { status: 'Optimal', color: 'bg-green-500' };
    return { status: 'Low', color: 'bg-blue-500' };
  };

  const generateReport = async () => {
    try {
      toast({
        title: "Generating Report",
        description: "Resource utilization report is being prepared...",
      });

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Report Generated",
        description: "Resource utilization report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Resource Utilization</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resource Utilization</h2>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((metrics.staffUtilization.doctors.utilization + 
                          metrics.staffUtilization.nurses.utilization + 
                          metrics.staffUtilization.support.utilization) / 3)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all staff
            </p>
            <div className="mt-2">
              <Progress value={Math.round((metrics.staffUtilization.doctors.utilization + 
                                         metrics.staffUtilization.nurses.utilization + 
                                         metrics.staffUtilization.support.utilization) / 3)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facility Usage</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((metrics.facilityUsage.consultationRooms.utilization + 
                          metrics.facilityUsage.emergencyBeds.utilization + 
                          metrics.facilityUsage.equipment.utilization) / 3)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall facility utilization
            </p>
            <div className="mt-2">
              <Progress value={Math.round((metrics.facilityUsage.consultationRooms.utilization + 
                                         metrics.facilityUsage.emergencyBeds.utilization + 
                                         metrics.facilityUsage.equipment.utilization) / 3)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.timeAnalysis.avgWaitTime} min</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;20 minutes
            </p>
            <div className="mt-2">
              <Progress 
                value={Math.min((metrics.timeAnalysis.avgWaitTime / 20) * 100, 100)} 
                className={metrics.timeAnalysis.avgWaitTime > 20 ? 'bg-red-200' : 'bg-green-200'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Patient</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costAnalysis.costPerPatient}</div>
            <p className="text-xs text-muted-foreground">
              This {timeRange}
            </p>
            <div className="mt-2 text-sm">
              <span className="text-green-600">-5% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Utilization Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Staff Utilization Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.staffUtilization).map(([role, data]) => {
              const status = getUtilizationStatus(data.utilization);
              return (
                <div key={role} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium capitalize">{role}</h4>
                      <Badge className={status.color}>{status.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {data.busy}/{data.available} active • {data.utilization}% utilization
                    </p>
                  </div>
                  <div className="w-24">
                    <Progress value={data.utilization} className="h-2" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-green-600" />
              Facility & Equipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">Consultation Rooms</h4>
                <p className="text-sm text-gray-600">
                  {metrics.facilityUsage.consultationRooms.occupied}/{metrics.facilityUsage.consultationRooms.total} occupied
                </p>
              </div>
              <div className="w-24">
                <Progress value={metrics.facilityUsage.consultationRooms.utilization} className="h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">Emergency Beds</h4>
                <p className="text-sm text-gray-600">
                  {metrics.facilityUsage.emergencyBeds.occupied}/{metrics.facilityUsage.emergencyBeds.total} occupied
                </p>
              </div>
              <div className="w-24">
                <Progress value={metrics.facilityUsage.emergencyBeds.utilization} className="h-2" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">Medical Equipment</h4>
                <p className="text-sm text-gray-600">
                  {metrics.facilityUsage.equipment.inUse}/{metrics.facilityUsage.equipment.total} in use, {metrics.facilityUsage.equipment.maintenance} maintenance
                </p>
              </div>
              <div className="w-24">
                <Progress value={metrics.facilityUsage.equipment.utilization} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Analysis Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Peak Hours Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.timeAnalysis.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value) => [value, 'Visits']}
                />
                <Bar dataKey="visits" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Daily Capacity Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.timeAnalysis.dailyCapacity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="capacity" stroke="#8b5cf6" name="Capacity" />
                <Line type="monotone" dataKey="used" stroke="#3b82f6" name="Used" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            Cost Analysis Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${metrics.costAnalysis.totalCost.toLocaleString()}
                </div>
                <p className="text-gray-600">Total Operating Cost</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Staff Costs</span>
                  <span className="font-semibold">${metrics.costAnalysis.staffCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Medication Costs</span>
                  <span className="font-semibold">${metrics.costAnalysis.medicationCosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Facility Costs</span>
                  <span className="font-semibold">${metrics.costAnalysis.facilityCosts.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Staff', value: metrics.costAnalysis.staffCosts },
                      { name: 'Medication', value: metrics.costAnalysis.medicationCosts },
                      { name: 'Facility', value: metrics.costAnalysis.facilityCosts }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceUtilization;