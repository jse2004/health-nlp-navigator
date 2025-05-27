
import React from 'react';
import { BarChart, Activity, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsSummaryProps {
  data: {
    totalPatients: number;
    criticalCases: number;
    pendingReviews: number;
    recentAdmissions: number;
    previousTotalPatients?: number;
    previousCriticalCases?: number;
    previousPendingReviews?: number;
  };
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  // Calculate actual percentage changes and trends
  const calculateTrend = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    const change = current - previous;
    const percentage = Math.round((change / previous) * 100);
    return { change, percentage };
  };

  const patientsTrend = calculateTrend(data.totalPatients, data.previousTotalPatients);
  const criticalTrend = calculateTrend(data.criticalCases, data.previousCriticalCases);
  const pendingTrend = calculateTrend(data.pendingReviews, data.previousPendingReviews);

  const stats = [
    {
      title: "Total Patients",
      value: data.totalPatients,
      icon: UserCheck,
      trend: patientsTrend 
        ? `${patientsTrend.change >= 0 ? '+' : ''}${patientsTrend.percentage}% from last month`
        : "No previous data",
      color: "text-medical-primary",
      trendColor: patientsTrend?.change >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Critical Cases",
      value: data.criticalCases,
      icon: AlertCircle,
      trend: criticalTrend 
        ? `${criticalTrend.change >= 0 ? '+' : ''}${criticalTrend.change} since last week`
        : data.criticalCases > 0 ? "Requires attention" : "No critical cases",
      color: "text-medical-critical",
      trendColor: criticalTrend?.change > 0 ? "text-red-600" : "text-green-600"
    },
    {
      title: "Pending Reviews",
      value: data.pendingReviews,
      icon: Activity,
      trend: pendingTrend 
        ? `${pendingTrend.change >= 0 ? '+' : ''}${pendingTrend.change} from last week`
        : data.pendingReviews > 0 ? "Needs review" : "All up to date",
      color: "text-medical-warning",
      trendColor: pendingTrend?.change > 0 ? "text-red-600" : "text-green-600"
    },
    {
      title: "Recent Admissions",
      value: data.recentAdmissions,
      icon: BarChart,
      trend: data.recentAdmissions > 0 
        ? `${data.recentAdmissions} in the last 7 days`
        : "No recent admissions",
      color: "text-medical-success",
      trendColor: "text-gray-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs mt-1 ${stat.trendColor || 'text-muted-foreground'}`}>
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
