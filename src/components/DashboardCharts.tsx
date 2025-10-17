import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Patient, MedicalRecord } from '@/data/sampleData';
import { Users, Building2, Calendar } from 'lucide-react';

interface DashboardChartsProps {
  patients: Patient[];
  medicalRecords: MedicalRecord[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ patients, medicalRecords }) => {
  // Gender Distribution Data
  const genderData = useMemo(() => {
    const genderCount = patients.reduce((acc, patient) => {
      const gender = patient.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(genderCount).map(([name, value]) => ({ name, value }));
  }, [patients]);

  // College Department Distribution Data
  const departmentData = useMemo(() => {
    const deptCount = patients.reduce((acc, patient) => {
      const dept = patient.college_department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deptCount).map(([name, value]) => ({ name, value }));
  }, [patients]);

  // Weekly Visits Data (last 7 days)
  const weeklyVisitsData = useMemo(() => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toDateString();
      
      const visitsCount = medicalRecords.filter(record => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === dateStr;
      }).length;

      weekData.push({
        day: dayName,
        visits: visitsCount,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return weekData;
  }, [medicalRecords]);

  // Color schemes using HSL
  const GENDER_COLORS = ['hsl(221.2, 83.2%, 53.3%)', 'hsl(280, 70%, 60%)', 'hsl(210, 40%, 70%)'];
  const DEPT_COLORS = [
    'hsl(221.2, 83.2%, 53.3%)',
    'hsl(217.2, 91.2%, 59.8%)',
    'hsl(280, 70%, 60%)',
    'hsl(340, 75%, 55%)',
    'hsl(160, 60%, 45%)',
    'hsl(45, 93%, 47%)',
    'hsl(25, 95%, 53%)',
    'hsl(190, 90%, 50%)'
  ];

  const genderChartConfig = {
    value: {
      label: "Students",
    }
  };

  const departmentChartConfig = {
    value: {
      label: "Students",
    }
  };

  const weeklyChartConfig = {
    visits: {
      label: "Visits",
      color: "hsl(var(--primary))",
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-popover-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-popover-foreground">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">
            Visits: <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Row 1: Gender and Department Distribution side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution Pie Chart */}
        <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Gender Distribution</CardTitle>
          </div>
          <CardDescription>Patient distribution by gender</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={genderChartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, percent }) => (percent * 100).toFixed(0) + '%'}
                  outerRadius={90}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

        {/* College Department Distribution Pie Chart */}
        <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Department Distribution</CardTitle>
          </div>
          <CardDescription>Student distribution by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={departmentChartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={90}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      </div>

      {/* Row 2: Weekly Visits Bar Graph (full width) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Weekly Visits</CardTitle>
          </div>
          <CardDescription>Consultations in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={weeklyChartConfig} className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVisitsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<CustomBarTooltip />} />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
