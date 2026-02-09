import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { appointmentService, Doctor } from '@/services/appointmentService';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: appointmentService.getDoctors,
  });

  const bookMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      toast({
        title: 'Appointment Booked',
        description: 'Your appointment has been successfully scheduled.',
      });
      navigate('/patient/appointments');
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error?.response?.data?.message || 'Failed to book appointment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor || !scheduledAt) {
      toast({
        title: 'Missing Information',
        description: 'Please select a doctor and time.',
        variant: 'destructive',
      });
      return;
    }

    bookMutation.mutate({
      doctorId: selectedDoctor,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes: notes || undefined,
    });
  };

  return (
    <DashboardLayout requireRole="PATIENT">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Book Appointment</h1>
            <p className="text-muted-foreground">Schedule a session with a doctor</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select a Doctor
            </CardTitle>
            <CardDescription>Choose from our available mental health professionals</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDoctors ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : doctors && doctors.length > 0 ? (
              <div className="space-y-3">
                {doctors.map((doctor: Doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedDoctor === doctor.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {doctor.fullName || doctor.name || doctor.email || 'Doctor'}
                        </p>
                        {doctor.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialization}
                          </p>
                        )}
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 ${
                        selectedDoctor === doctor.id 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No doctors available at the moment.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
            <CardDescription>Choose your preferred appointment time</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Appointment Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe how you're feeling..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={bookMutation.isPending || !selectedDoctor}
              >
                {bookMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
