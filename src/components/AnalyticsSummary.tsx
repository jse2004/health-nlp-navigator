
import React from 'react';
import { BarChart, Activity, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsSummary as AnalyticsSummaryType } from '@/data/sampleData';

interface AnalyticsSummaryProps {
  data: AnalyticsSummaryType;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ data }) => {
  const stats = [
    {
      title: "Total Patients",
      value: data.totalPatients,
      icon: UserCheck,
      trend: "+3% from last month",
      color: "text-medical-primary"
    },
    {
      title: "Critical Cases",
      value: data.criticalCases,
      icon: AlertCircle,
      trend: "+1 since yesterday",
      color: "text-medical-critical"
    },
    {
      title: "Pending Reviews",
      value: data.pendingReviews,
      icon: Activity,
      trend: "-5 from last week",
      color: "text-medical-warning"
    },
    {
      title: "Recent Admissions",
      value: data.recentAdmissions,
      icon: BarChart,
      trend: "Today",
      color: "text-medical-success"
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
            <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
