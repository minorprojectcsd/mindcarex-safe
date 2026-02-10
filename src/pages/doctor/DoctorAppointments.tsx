import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appointmentService, DoctorAppointment } from '@/services/appointmentService';
import { sessionService } from '@/services/sessionService';
import { useToast } from '@/hooks/use-toast';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: appointmentService.getDoctorAppointments,
  });

  const startSessionMutation = useMutation({
    mutationFn: (appointmentId: string) => sessionService.startSession(appointmentId),
    onSuccess: (data) => {
      navigate(`/video/${data.sessionId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start session',
        description: error?.response?.data?.message || 'Could not start the session.',
        variant: 'destructive',
      });
    },
  });

  const scheduled = appointments?.filter(a => a.status === 'SCHEDULED') || [];
  const completed = appointments?.filter(a => a.status === 'COMPLETED') || [];
  const cancelled = appointments?.filter(a => a.status === 'CANCELLED') || [];

  const AppointmentCard = ({ appointment }: { appointment: DoctorAppointment }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">{appointment.patient?.fullName || 'Patient'}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy · h:mm a')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant={
            appointment.status === 'SCHEDULED' ? 'default' : 
            appointment.status === 'COMPLETED' ? 'secondary' : 
            'destructive'
          }
        >
          {appointment.status}
        </Badge>
        {appointment.status === 'SCHEDULED' && (
          <Button
            size="sm"
            disabled={startSessionMutation.isPending}
            onClick={() => startSessionMutation.mutate(appointment.id)}
          >
            <Video className="mr-2 h-4 w-4" />
            Start Session
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout requireRole="DOCTOR">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Manage your patient appointments</p>
          </div>
        </div>

        <Tabs defaultValue="scheduled">
          <TabsList>
            <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
          </TabsList>

          {(['scheduled', 'completed', 'cancelled'] as const).map((tab) => {
            const list = tab === 'scheduled' ? scheduled : tab === 'completed' ? completed : cancelled;
            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : list.length === 0 ? (
                      <div className="py-8 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">No {tab} appointments</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {list.map(apt => (
                          <AppointmentCard key={apt.id} appointment={apt} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
