import React, { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MedicalRecord } from '@/data/sampleData';

interface OverallCasesSummaryProps {
  medicalRecords: MedicalRecord[];
}

const OverallCasesSummary: React.FC<OverallCasesSummaryProps> = ({ medicalRecords }) => {
  const summaryData = useMemo(() => {
    // Filter active records
    const activeRecords = medicalRecords.filter(record => record.status === 'active');
    const totalActive = activeRecords.length;

    // Severity breakdown (1-4: mild, 5-7: moderate, 8-10: critical)
    const critical = activeRecords.filter(r => r.severity >= 8).length;
    const moderate = activeRecords.filter(r => r.severity >= 5 && r.severity < 8).length;
    const mild = activeRecords.filter(r => r.severity < 5).length;

    // Top diagnoses
    const diagnosisCounts: Record<string, number> = {};
    activeRecords.forEach(record => {
      const diagnosis = record.diagnosis || 'Unknown/Pending';
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });

    const topDiagnoses = Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Department distribution
    const departmentCounts: Record<string, number> = {};
    activeRecords.forEach(record => {
      const dept = record.faculty || 'Unknown Department';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const topDepartment = Object.entries(departmentCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // Recent trend (this week vs last week)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekCases = activeRecords.filter(r => 
      r.date && new Date(r.date) >= oneWeekAgo
    ).length;

    const lastWeekCases = activeRecords.filter(r => 
      r.date && new Date(r.date) >= twoWeeksAgo && new Date(r.date) < oneWeekAgo
    ).length;

    let trendPercentage = 0;
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    
    if (lastWeekCases > 0) {
      trendPercentage = Math.round(((thisWeekCases - lastWeekCases) / lastWeekCases) * 100);
      if (trendPercentage > 5) trendDirection = 'up';
      else if (trendPercentage < -5) trendDirection = 'down';
      else trendDirection = 'stable';
    } else if (thisWeekCases > 0) {
      trendDirection = 'up';
      trendPercentage = 100;
    }

    // Critical alerts (severity >= 9)
    const urgentCases = activeRecords.filter(r => r.severity >= 9).length;

    return {
      totalActive,
      critical,
      moderate,
      mild,
      topDiagnoses,
      topDepartment,
      trendPercentage,
      trendDirection,
      thisWeekCases,
      urgentCases
    };
  }, [medicalRecords]);

  // Generate plain language summary
  const generateSummary = () => {
    const { 
      totalActive, 
      critical, 
      moderate, 
      mild, 
      topDiagnoses, 
      topDepartment,
      trendPercentage,
      trendDirection,
      thisWeekCases,
      urgentCases
    } = summaryData;

    if (totalActive === 0) {
      return 'There are currently no active cases in the system.';
    }

    const parts: string[] = [];

    // Total cases
    parts.push(`There ${totalActive === 1 ? 'is' : 'are'} currently ${totalActive} active ${totalActive === 1 ? 'case' : 'cases'} in the database.`);

    // Top diagnoses
    if (topDiagnoses.length > 0) {
      const diagnosesText = topDiagnoses
        .map(({ diagnosis, count }) => `${diagnosis} (${count} ${count === 1 ? 'patient' : 'patients'})`)
        .join(', ');
      parts.push(`The most common conditions are ${diagnosesText}.`);
    }

    // Severity breakdown
    if (critical > 0 || moderate > 0 || mild > 0) {
      const severityParts: string[] = [];
      if (critical > 0) severityParts.push(`${critical} ${critical === 1 ? 'is' : 'are'} in critical condition`);
      if (moderate > 0) severityParts.push(`${moderate} ${moderate === 1 ? 'is' : 'are'} moderate`);
      if (mild > 0) severityParts.push(`${mild} ${mild === 1 ? 'is' : 'are'} mild`);
      parts.push(severityParts.join(', ') + '.');
    }

    // New admissions this week
    if (thisWeekCases > 0) {
      parts.push(`${thisWeekCases} ${thisWeekCases === 1 ? 'patient was' : 'patients were'} admitted this week.`);
    }

    // Department with highest load
    if (topDepartment && topDepartment[1] > 0) {
      parts.push(`${topDepartment[0]} currently manages the largest share of cases with ${topDepartment[1]} ${topDepartment[1] === 1 ? 'patient' : 'patients'}.`);
    }

    // Trend
    if (trendDirection === 'up' && trendPercentage > 0) {
      parts.push(`Active cases increased by ${Math.abs(trendPercentage)}% compared to last week.`);
    } else if (trendDirection === 'down' && trendPercentage < 0) {
      parts.push(`Active cases decreased by ${Math.abs(trendPercentage)}% compared to last week.`);
    } else if (trendDirection === 'stable') {
      parts.push(`Active cases remained stable compared to last week.`);
    }

    // Urgent alerts
    if (urgentCases > 0) {
      parts.push(`⚠️ ${urgentCases} ${urgentCases === 1 ? 'patient requires' : 'patients require'} immediate attention due to critical severity.`);
    }

    return parts.join(' ');
  };

  const { trendDirection } = summaryData;

  const TrendIcon = trendDirection === 'up' ? TrendingUp : 
                    trendDirection === 'down' ? TrendingDown : 
                    Minus;

  const trendColor = trendDirection === 'up' ? 'text-orange-500' : 
                     trendDirection === 'down' ? 'text-green-500' : 
                     'text-muted-foreground';

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <AlertTitle className="text-base font-semibold flex items-center gap-2">
            Overall Cases Summary
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          </AlertTitle>
          <AlertDescription className="text-sm mt-2 leading-relaxed">
            {generateSummary()}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default OverallCasesSummary;
