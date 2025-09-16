import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Building2, Users, TrendingUp, Activity, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DepartmentStats {
  department: string;
  totalStudents: number;
  totalVisits: number;
  criticalCases: number;
  commonDiseases: { disease: string; count: number; percentage: number }[];
  healthScore: number;
  trend: 'improving' | 'stable' | 'declining';
  vaccinationRate: number;
  averageVisitsPerStudent: number;
}

interface ComparisonData {
  department: string;
  visits: number;
  criticalCases: number;
  healthScore: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

const DepartmentHealthStats: React.FC = () => {
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const { toast } = useToast();

  useEffect(() => {
    loadDepartmentStats();
  }, [timeRange]);

  const loadDepartmentStats = async () => {
    try {
      setLoading(true);
      
      // Load department analytics
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_visit_analytics')
        .select('*')
        .order('month', { ascending: false });

      if (monthlyError) throw monthlyError;

      // Load case analytics by department
      const { data: caseData, error: caseError } = await supabase
        .from('case_analytics_by_department')
        .select('*')
        .order('case_count', { ascending: false });

      if (caseError) throw caseError;

      // Process and generate department statistics
      const processedStats = generateDepartmentStats(monthlyData, caseData);
      setDepartmentStats(processedStats);
      
    } catch (error) {
      console.error('Error loading department stats:', error);
      toast({
        title: "Error",
        description: "Failed to load department statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDepartmentStats = (monthlyData: any[], caseData: any[]): DepartmentStats[] => {
    const departments = [
      'Computer Science',
      'Business Administration', 
      'Engineering',
      'Medicine',
      'Liberal Arts',
      'Natural Sciences'
    ];

    return departments.map(dept => {
      const deptMonthlyData = monthlyData?.filter(d => d.college_department === dept.toLowerCase().replace(' ', '_')) || [];
      const deptCaseData = caseData?.filter(d => d.college_department === dept.toLowerCase().replace(' ', '_')) || [];
      
      const totalVisits = deptMonthlyData.reduce((sum, d) => sum + (d.total_visits || 0), 0);
      const criticalCases = deptMonthlyData.reduce((sum, d) => sum + (d.critical_cases || 0), 0);
      
      // Generate common diseases from case data
      const diseaseMap = new Map();
      deptCaseData.forEach(d => {
        if (d.diagnosis) {
          diseaseMap.set(d.diagnosis, (diseaseMap.get(d.diagnosis) || 0) + (d.case_count || 0));
        }
      });

      const commonDiseases = Array.from(diseaseMap.entries())
        .map(([disease, count]) => ({
          disease,
          count,
          percentage: Math.round((count / Math.max(totalVisits, 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate health metrics
      const totalStudents = Math.floor(Math.random() * 2000) + 500; // Simulated
      const healthScore = Math.max(100 - (criticalCases / Math.max(totalVisits, 1)) * 100, 0);
      const vaccinationRate = Math.floor(Math.random() * 30) + 70; // 70-100%
      
      return {
        department: dept,
        totalStudents,
        totalVisits,
        criticalCases,
        commonDiseases,
        healthScore: Math.round(healthScore),
        trend: healthScore > 80 ? 'improving' : healthScore > 60 ? 'stable' : 'declining',
        vaccinationRate,
        averageVisitsPerStudent: Number((totalVisits / totalStudents).toFixed(2))
      };
    });
  };

  const getComparisonData = (): ComparisonData[] => {
    return departmentStats.map(dept => ({
      department: dept.department.replace(' ', '\n'),
      visits: dept.totalVisits,
      criticalCases: dept.criticalCases,
      healthScore: dept.healthScore
    }));
  };

  const getRadarData = () => {
    if (selectedDepartment === 'all') return [];
    
    const dept = departmentStats.find(d => d.department === selectedDepartment);
    if (!dept) return [];

    return [
      {
        metric: 'Health Score',
        value: dept.healthScore,
        max: 100
      },
      {
        metric: 'Vaccination Rate',
        value: dept.vaccinationRate,
        max: 100
      },
      {
        metric: 'Visit Frequency',
        value: Math.min(dept.averageVisitsPerStudent * 20, 100),
        max: 100
      },
      {
        metric: 'Critical Care',
        value: Math.max(100 - (dept.criticalCases / Math.max(dept.totalVisits, 1)) * 100, 0),
        max: 100
      },
      {
        metric: 'Prevention Score',
        value: (dept.vaccinationRate + dept.healthScore) / 2,
        max: 100
      }
    ];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <Activity className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Department Health Statistics</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
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
        <h2 className="text-2xl font-bold">Department Health Statistics</h2>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentStats.map(dept => (
                <SelectItem key={dept.department} value={dept.department}>
                  {dept.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Department Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departmentStats.map((dept) => (
          <Card key={dept.department} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {dept.department}
                </div>
                {getTrendIcon(dept.trend)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Students</p>
                  <p className="font-semibold">{dept.totalStudents.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Visits</p>
                  <p className="font-semibold">{dept.totalVisits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Critical Cases</p>
                  <p className="font-semibold text-red-600">{dept.criticalCases}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Visits/Student</p>
                  <p className="font-semibold">{dept.averageVisitsPerStudent}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health Score</span>
                  <span className={`font-semibold ${getHealthScoreColor(dept.healthScore)}`}>
                    {dept.healthScore}%
                  </span>
                </div>
                <Progress value={dept.healthScore} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Vaccination Rate</span>
                  <span className="font-semibold text-green-600">{dept.vaccinationRate}%</span>
                </div>
                <Progress value={dept.vaccinationRate} className="h-2" />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Common Issues:</p>
                <div className="space-y-1">
                  {dept.commonDiseases.slice(0, 3).map((disease, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="truncate">{disease.disease}</span>
                      <Badge variant="secondary" className="text-xs">
                        {disease.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Department Comparison - Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}  
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="#3b82f6" name="Total Visits" />
                <Bar dataKey="criticalCases" fill="#ef4444" name="Critical Cases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Health Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentStats.map(dept => ({
                    name: dept.department,
                    value: dept.healthScore
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Department Analysis */}
      {selectedDepartment !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              {selectedDepartment} - Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-4">Health Metrics Radar</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" fontSize={12} />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      fontSize={10}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Common Health Issues</h4>
                {departmentStats
                  .find(d => d.department === selectedDepartment)
                  ?.commonDiseases.map((disease, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{disease.disease}</p>
                        <p className="text-sm text-gray-600">
                          {disease.count} cases ({disease.percentage}% of visits)
                        </p>
                      </div>
                      <div className="w-16">
                        <Progress value={disease.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentHealthStats;