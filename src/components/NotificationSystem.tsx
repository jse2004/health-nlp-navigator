import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, Calendar, Pill, Phone, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'critical_alert' | 'appointment_reminder' | 'medication_adherence' | 'follow_up';
  title: string;
  message: string;
  patientName: string;
  patientId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  actions?: { label: string; action: string }[];
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    criticalAlerts: true,
    appointmentReminders: true,
    medicationAlerts: true,
    followUpReminders: true,
    emergencyContacts: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    // Sample notifications data
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'critical_alert',
        title: 'Critical Patient Alert',
        message: 'Patient showing severe symptoms requiring immediate attention',
        patientName: 'John Smith',
        patientId: 'PAT-001',
        priority: 'critical',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        acknowledged: false,
        actions: [{ label: 'View Patient', action: 'view' }, { label: 'Call Emergency', action: 'emergency' }]
      },
      {
        id: '2',
        type: 'appointment_reminder',
        title: 'Upcoming Appointment',
        message: 'Follow-up appointment scheduled in 1 hour',
        patientName: 'Sarah Johnson',
        patientId: 'PAT-002',
        priority: 'high',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        acknowledged: false,
        actions: [{ label: 'Confirm', action: 'confirm' }, { label: 'Reschedule', action: 'reschedule' }]
      },
      {
        id: '3',
        type: 'medication_adherence',
        title: 'Medication Adherence Alert',
        message: 'Patient has missed 2 consecutive doses of prescribed medication',
        patientName: 'Mike Chen',
        patientId: 'PAT-003',
        priority: 'medium',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        acknowledged: false,
        actions: [{ label: 'Contact Patient', action: 'contact' }, { label: 'Update Prescription', action: 'update' }]
      }
    ];

    setNotifications(sampleNotifications);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical_alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'appointment_reminder': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'medication_adherence': return <Pill className="h-4 w-4 text-orange-500" />;
      case 'follow_up': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, acknowledged: true } : notif
      )
    );
    toast({
      title: "Notification Acknowledged",
      description: "The notification has been marked as read",
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: "Notification Dismissed",
      description: "The notification has been removed",
    });
  };

  const handleAction = (action: string, notification: Notification) => {
    switch (action) {
      case 'emergency':
        toast({
          title: "Emergency Protocol Initiated",
          description: `Emergency services contacted for ${notification.patientName}`,
          variant: "destructive"
        });
        break;
      case 'contact':
        toast({
          title: "Contacting Patient",
          description: `Calling ${notification.patientName}...`,
        });
        break;
      default:
        toast({
          title: "Action Completed",
          description: `${action} action performed for ${notification.patientName}`,
        });
    }
    acknowledgeNotification(notification.id);
  };

  const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Notification System</h2>
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unacknowledgedCount} Unread
            </Badge>
          )}
        </div>
        <Button variant="outline">
          <Bell className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Notifications */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-gray-600">No pending notifications</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Alert
              key={notification.id}
              className={`${!notification.acknowledged ? 'border-l-4 border-l-red-500' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-3 flex-1">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <AlertDescription>
                      <p className="mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-600">
                        Patient: <strong>{notification.patientName}</strong> ({notification.patientId})
                      </p>
                      {notification.actions && !notification.acknowledged && (
                        <div className="flex gap-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.action === 'emergency' ? 'destructive' : 'outline'}
                              onClick={() => handleAction(action.action, notification)}
                            >
                              {action.action === 'emergency' && <Phone className="mr-1 h-3 w-3" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!notification.acknowledged && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledgeNotification(notification.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;