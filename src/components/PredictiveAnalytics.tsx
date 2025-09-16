import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Users, Calendar, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrendData {
  month: string;
  visits: number;
  criticalCases: number;
  admissions: number;
  predicted?: number;
}

interface RiskPatient {
  id: string;
  name: string;
  riskScore: number;
  riskFactors: string[];
  lastVisit: string;
  department: string;
}

interface OutbreakAlert {
  id: string;
  disease: string;
  department: string;
  caseCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendedActions: string[];
}

const PredictiveAnalytics: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [riskPatients, setRiskPatients] = useState<RiskPatient[]>([]);
  const [outbreakAlerts, setOutbreakAlerts] = useState<OutbreakAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load monthly visit analytics
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_visit_analytics')
        .select('*')
        .order('month', { ascending: true })
        .limit(12);

      if (monthlyError) throw monthlyError;

      // Transform data for charts
      const transformedData = monthlyData?.map(item => ({
        month: new Date(item.month || '').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        visits: item.total_visits || 0,
        criticalCases: item.critical_cases || 0,
        admissions: item.total_visits || 0
      })) || [];

      setTrendData(transformedData);

      // Generate sample risk patients and outbreak alerts
      generateRiskAnalysis();
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRiskAnalysis = () => {
    // Sample risk patients data
    const sampleRiskPatients: RiskPatient[] = [
      {
        id: '1',
        name: 'John Smith',
        riskScore: 85,
        riskFactors: ['Chronic condition', 'Missed appointments', 'High BMI'],
        lastVisit: '2024-01-10',
        department: 'Computer Science'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        riskScore: 72,
        riskFactors: ['Medication non-adherence', 'Multiple conditions'],
        lastVisit: '2024-01-08',
        department: 'Business Administration'
      },
      {
        id: '3',
        name: 'Mike Chen',
        riskScore: 68,
        riskFactors: ['Frequent visits', 'Emergency visits'],
        lastVisit: '2024-01-12',
        department: 'Engineering'
      }
    ];

    // Sample outbreak alerts
    const sampleOutbreaks: OutbreakAlert[] = [
      {
        id: '1',
        disease: 'Respiratory Infection',
        department: 'Computer Science',
        caseCount: 12,
        riskLevel: 'high',
        trend: 'increasing',
        recommendedActions: [
          'Increase sanitization measures',
          'Monitor symptoms closely',
          'Consider temporary remote classes'
        ]
      },
      {
        id: '2',
        disease: 'Gastroenteritis',
        department: 'Business Administration',
        caseCount: 5,
        riskLevel: 'medium',
        trend: 'stable',
        recommendedActions: [
          'Review food safety protocols',
          'Monitor dining facilities',
          'Increase awareness campaigns'
        ]
      }
    ];

    setRiskPatients(sampleRiskPatients);
    setOutbreakAlerts(sampleOutbreaks);
  };

  const runPredictiveAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Simulate AI-powered predictive analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add predicted values to trend data
      const updatedTrendData = trendData.map((item, index) => ({
        ...item,
        predicted: item.visits + Math.floor(Math.random() * 20 - 10)
      }));
      
      setTrendData(updatedTrendData);
      
      toast({
        title: "Analysis Complete",
        description: "Predictive analysis has been updated with latest trends",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not complete predictive analysis",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Predictive Analytics</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
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
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
        <Button onClick={runPredictiveAnalysis} disabled={analyzing}>
          {analyzing ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {/* Trend Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Visit Trends & Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Actual Visits"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Cases Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="criticalCases" 
                  stroke="#ef4444" 
                  fill="#fecaca" 
                  name="Critical Cases"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* High-Risk Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            High-Risk Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskPatients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{patient.name}</h3>
                    <Badge variant="outline">{patient.department}</Badge>
                    <span className={`font-bold ${getRiskScoreColor(patient.riskScore)}`}>
                      Risk Score: {patient.riskScore}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {patient.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outbreak Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Disease Outbreak Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {outbreakAlerts.map((alert) => (
              <Alert key={alert.id} className="border-l-4 border-l-red-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{alert.disease}</h4>
                        <Badge variant="outline">{alert.department}</Badge>
                        <Badge className={getRiskLevelColor(alert.riskLevel)}>
                          {alert.riskLevel.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {alert.trend === 'increasing' ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : alert.trend === 'decreasing' ? (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
                          )}
                          <span className="text-sm">{alert.trend}</span>
                        </div>
                      </div>
                      <p className="text-sm mt-1">
                        <strong>{alert.caseCount} cases</strong> detected in the last 7 days
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {alert.recommendedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Monitor
                      </Button>
                      <Button size="sm" variant="destructive">
                        Alert Staff
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalytics;