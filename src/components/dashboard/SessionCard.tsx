import { format } from 'date-fns';
import { Calendar, Clock, User, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Session, Schedule } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  session?: Session;
  schedule?: Schedule;
  showPatientName?: boolean;
  onJoin?: () => void;
}

// Helper to get scheduled time from either Session or Schedule
const getScheduledTime = (data: Session | Schedule): string => {
  if ('scheduled_time' in data && data.scheduled_time) {
    return data.scheduled_time;
  }
  if ('start_time' in data && data.start_time) {
    return data.start_time;
  }
  return new Date().toISOString();
};

export function SessionCard({ session, schedule, showPatientName = false, onJoin }: SessionCardProps) {
  const navigate = useNavigate();
  
  const data = session || schedule;
  if (!data) return null;

  const scheduledDate = new Date(getScheduledTime(data));
  const status = data.status || 'scheduled';
  const isUpcoming = scheduledDate > new Date() && status === 'scheduled';
  const isToday = format(scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const statusVariant: Record<string, 'scheduled' | 'in-progress' | 'completed' | 'cancelled'> = {
    scheduled: 'scheduled',
    'in-progress': 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  const handleJoin = () => {
    if (onJoin) {
      onJoin();
    } else {
      navigate(`/video/${data.id}`);
    }
  };

  return (
    <Card variant="interactive" className="group animate-slide-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[status]}>
                {status.replace('-', ' ')}
              </Badge>
              {isToday && isUpcoming && (
                <Badge variant="success">Today</Badge>
              )}
            </div>

            <div className="space-y-2">
              {showPatientName && 'patientName' in data && data.patientName && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.patientName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(scheduledDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(scheduledDate, 'h:mm a')} • {data.duration || 50} minutes
                </span>
              </div>
            </div>

            {data.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.notes}
              </p>
            )}

            {'summary' in data && data.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                "{data.summary}"
              </p>
            )}
          </div>

          {isUpcoming && (
            <Button
              onClick={handleJoin}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Video className="mr-2 h-4 w-4" />
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
