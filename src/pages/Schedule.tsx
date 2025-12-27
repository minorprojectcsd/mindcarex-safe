import { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleApi } from '@/services/api';
import { Schedule as ScheduleType } from '@/types';
import { cn } from '@/lib/utils';

export default function Schedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!user) return;

      try {
        const data = await scheduleApi.getDoctorSchedules(user.id);
        setSchedules(data);
      } catch (error) {
        console.error('Failed to load schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, [user]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getSchedulesForDay = (date: Date) =>
    schedules.filter((s) => isSameDay(new Date(s.scheduled_time), date));

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) =>
      addDays(prev, direction === 'next' ? 7 : -7)
    );
  };

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <DashboardLayout requireRole="DOCTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your appointments and availability
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {format(currentWeekStart, 'MMMM d')} -{' '}
                {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Today
            </Button>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Loading schedule...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Day headers */}
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-3 text-sm font-medium text-muted-foreground">
                      Time
                    </div>
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'p-3 text-center',
                            isToday && 'bg-primary-light rounded-t-lg'
                          )}
                        >
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isToday ? 'text-primary' : 'text-muted-foreground'
                            )}
                          >
                            {format(day, 'EEE')}
                          </p>
                          <p
                            className={cn(
                              'text-lg font-semibold',
                              isToday && 'text-primary'
                            )}
                          >
                            {format(day, 'd')}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time slots */}
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b last:border-0">
                      <div className="flex items-start p-3 text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </div>
                      {weekDays.map((day) => {
                        const daySchedules = getSchedulesForDay(day).filter(
                          (s) => format(new Date(s.scheduled_time), 'HH:00') === time
                        );
                        const isToday = isSameDay(day, new Date());

                        return (
                          <div
                            key={`${day.toISOString()}-${time}`}
                            className={cn(
                              'min-h-[80px] border-l p-2',
                              isToday && 'bg-primary-light/30'
                            )}
                          >
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="mb-1 rounded-md bg-primary p-2 text-xs text-primary-foreground"
                              >
                                <p className="font-medium truncate">
                                  {schedule.patientName || 'Unknown'}
                                </p>
                                <p className="opacity-80">
                                  {format(new Date(schedule.scheduled_time), 'h:mm a')}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments list */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules
                .filter((s) => s.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                .slice(0, 5)
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                        <span className="text-sm font-semibold text-primary">
                          {schedule.patientName?.split(' ').map((n) => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{schedule.patientName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(schedule.scheduled_time), 'EEEE, MMMM d')} at{' '}
                          {format(new Date(schedule.scheduled_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="scheduled">{schedule.duration || 50} min</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
