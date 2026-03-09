import { MentalHealthData } from '@/types/chatAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Moon, MessageSquare, Trash2, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';

const interpretationColors: Record<string, string> = {
  Positive: 'text-success',
  'Moderate concern': 'text-warning-foreground',
  'Elevated concern': 'text-destructive',
};

interface Props {
  mentalHealth: MentalHealthData;
}

export function MentalHealthTab({ mentalHealth }: Props) {
  return (
    <div className="space-y-6">
      {mentalHealth.per_person.map((p) => (
        <Card key={p.person}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-primary" />
                {p.person}
              </CardTitle>
              <Badge variant="outline" className={interpretationColors[p.mh_score_interpretation] || ''}>
                {p.mh_score_interpretation}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mental Health Score</span>
                <span className="font-semibold">{p.mental_health_score}/100</span>
              </div>
              <Progress value={p.mental_health_score} className="h-2.5" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatMini icon={Moon} label="Late-Night Msgs" value={p.late_night_messages} sub={`${p.late_night_percent.toFixed(1)}%`} />
              <StatMini icon={MessageSquare} label="Avg Words/Msg" value={p.avg_words_per_message.toFixed(1)} />
              <StatMini icon={Trash2} label="Deleted Msgs" value={p.deleted_messages} />
            </div>

            {p.clinical_flags.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-sm font-medium"><Flag className="h-4 w-4 text-warning" /> Clinical Flags</p>
                {p.clinical_flags.map((f, i) => (
                  <Alert key={i} className="border-warning/40 bg-warning-light">
                    <AlertDescription className="text-sm">⚑ {f}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {p.positive_language_signals.length > 0 && (
                <div className="rounded-lg border border-success/30 bg-success-light p-3">
                  <p className="mb-1 flex items-center gap-1 text-sm font-medium"><ThumbsUp className="h-4 w-4 text-success" /> Positive Signals</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {p.positive_language_signals.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {p.negative_language_signals.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive-light p-3">
                  <p className="mb-1 flex items-center gap-1 text-sm font-medium"><ThumbsDown className="h-4 w-4 text-destructive" /> Negative Signals</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {p.negative_language_signals.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatMini({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">({sub})</p>}
    </div>
  );
}
