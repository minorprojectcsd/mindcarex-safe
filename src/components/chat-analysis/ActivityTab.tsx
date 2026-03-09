import { HourActivity, WeekActivity, MonthlyTimeline, LateNightStats } from '@/types/chatAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Moon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  hourActivity: HourActivity[];
  weekActivity: WeekActivity[];
  monthlyTimeline: MonthlyTimeline[];
  lateNightStats: LateNightStats;
}

export function ActivityTab({ hourActivity, weekActivity, monthlyTimeline, lateNightStats }: Props) {
  return (
    <div className="space-y-6">
      {lateNightStats.total_late_night_msgs > 0 && (
        <Alert className="border-warning/40 bg-warning-light">
          <Moon className="h-4 w-4" />
          <AlertDescription>
            <strong>{lateNightStats.total_late_night_msgs}</strong> messages sent between 12 AM – 5 AM.
            {lateNightStats.per_sender.map((s) => (
              <span key={s.sender} className="ml-2 text-xs">
                {s.sender}: {s.count} ({s.percent.toFixed(1)}%)
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Hourly Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourActivity}>
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(174, 62%, 38%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Weekly Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekActivity}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(12, 80%, 62%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {monthlyTimeline.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTimeline}>
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(174, 62%, 38%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
