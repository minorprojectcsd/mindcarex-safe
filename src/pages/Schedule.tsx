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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Schedule</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Manage your appointments and availability
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  {format(currentWeekStart, 'MMM d')} -{' '}
                  {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="w-full sm:w-auto"
            >
              Today
            </Button>
          </CardHeader>

          <CardContent className="p-2 sm:p-6">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Loading schedule...</p>
              </div>
            ) : (
              <>
                {/* Mobile: List view */}
                <div className="block md:hidden space-y-3">
                  {weekDays.map((day) => {
                    const daySchedules = getSchedulesForDay(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'rounded-lg border p-3',
                          isToday && 'border-primary bg-primary-light/30'
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className={cn('font-medium', isToday && 'text-primary')}>
                            {format(day, 'EEE, MMM d')}
                          </p>
                          {isToday && <Badge>Today</Badge>}
                        </div>
                        {daySchedules.length > 0 ? (
                          <div className="space-y-2">
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="rounded-md bg-primary p-2 text-xs text-primary-foreground"
                              >
                                <p className="font-medium truncate">
                                  {schedule.patientName || 'Unknown'}
                                </p>
                                <p className="opacity-80">
                                  {format(new Date(schedule.scheduled_time), 'h:mm a')} • {schedule.duration || 50} min
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No appointments</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Grid view */}
                <div className="hidden md:block overflow-x-auto">
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming appointments list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {schedules
                .filter((s) => s.status === 'scheduled')
                .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
                .slice(0, 5)
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light sm:h-10 sm:w-10">
                        <span className="text-xs font-semibold text-primary sm:text-sm">
                          {schedule.patientName?.split(' ').map((n) => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm sm:text-base">{schedule.patientName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          {format(new Date(schedule.scheduled_time), 'EEE, MMM d')} at{' '}
                          {format(new Date(schedule.scheduled_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="scheduled" className="w-fit text-xs">{schedule.duration || 50} min</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
