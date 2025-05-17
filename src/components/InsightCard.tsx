
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Activity, FileText, Pill, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightCardProps {
  title: string;
  content: string;
  type: 'clinical' | 'medication' | 'care' | 'trend';
}

const InsightCard: React.FC<InsightCardProps> = ({ title, content, type }) => {
  // Define icon based on insight type
  const getIcon = () => {
    switch(type) {
      case 'clinical':
        return <FileText className="h-5 w-5 text-medical-primary" />;
      case 'medication':
        return <Pill className="h-5 w-5 text-medical-warning" />;
      case 'care':
        return <Activity className="h-5 w-5 text-medical-success" />;
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-medical-accent" />;
      default:
        return <FileText className="h-5 w-5 text-medical-primary" />;
    }
  };

  // Define card border color based on insight type
  const getBorderColor = () => {
    switch(type) {
      case 'clinical':
        return 'border-l-4 border-l-medical-primary';
      case 'medication':
        return 'border-l-4 border-l-medical-warning';
      case 'care':
        return 'border-l-4 border-l-medical-success';
      case 'trend':
        return 'border-l-4 border-l-medical-accent';
      default:
        return 'border-l-4 border-l-medical-primary';
    }
  };

  return (
    <Card className={`${getBorderColor()} hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3 mb-2">
          <div className="bg-gray-50 p-1.5 rounded-md">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        <Button variant="ghost" size="sm" className="text-medical-primary">
          Review
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InsightCard;
