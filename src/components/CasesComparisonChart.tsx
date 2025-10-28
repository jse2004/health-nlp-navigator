import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { MedicalRecord } from '@/data/sampleData';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CasesComparisonChartProps {
  medicalRecords: MedicalRecord[];
  onDataProcessed?: (totalActiveCases: number) => void;
}

const CHART_COLOR = 'hsl(var(--chart-1))';

const CasesComparisonChart: React.FC<CasesComparisonChartProps> = ({ medicalRecords, onDataProcessed }) => {
  // Process data: group active medical records by diagnosis
  const { chartData, totalActiveCases, chartSummary } = useMemo(() => {
    // Filter only active records
    const activeRecords = medicalRecords.filter(record => record.status === 'active');
    
    // Group by diagnosis
    const diagnosisCounts: Record<string, number> = {};
    activeRecords.forEach(record => {
      const diagnosis = record.diagnosis || 'Unknown/Pending';
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });

    // Convert to chart data and sort by count
    const data = Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 diagnoses

    // Generate chart summary in plain language
    let summary = '';
    if (data.length === 0) {
      summary = 'There are currently no active cases in the system.';
    } else if (data.length === 1) {
      summary = `All active cases (${data[0].count} patient${data[0].count > 1 ? 's' : ''}) are for ${data[0].diagnosis}.`;
    } else {
      const topCase = data[0];
      const secondCase = data[1];
      summary = `${topCase.diagnosis} has the highest number of cases with ${topCase.count} patient${topCase.count > 1 ? 's' : ''}, followed by ${secondCase.diagnosis} with ${secondCase.count} patient${secondCase.count > 1 ? 's' : ''}.`;
      
      if (data.length > 2) {
        const thirdCase = data[2];
        summary += ` ${thirdCase.diagnosis} is third with ${thirdCase.count} patient${thirdCase.count > 1 ? 's' : ''}.`;
      }
    }

    return {
      chartData: data,
      totalActiveCases: activeRecords.length,
      chartSummary: summary,
    };
  }, [medicalRecords]);

  // Notify parent of processed data
  React.useEffect(() => {
    if (onDataProcessed) {
      onDataProcessed(totalActiveCases);
    }
  }, [totalActiveCases, onDataProcessed]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-card-foreground">{payload[0].payload.diagnosis}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} patient{payload[0].value > 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Comparison of Active Cases by Type
          </CardTitle>
          <CardDescription>
            Number of patients currently being treated for each diagnosis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="diagnosis" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    interval={0}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Number of Patients', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={() => 'Number of Patients'}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill={CHART_COLOR} />
                </BarChart>
              </ResponsiveContainer>

              {/* Chart Summary */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <h4 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Chart Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {chartSummary}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No active cases to display</p>
            </div>
          )}
        </CardContent>
      </Card>
  );
};

export default CasesComparisonChart;
