import { SentimentData } from '@/types/chatAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const sentimentColors: Record<string, string> = {
  positive: 'text-success',
  neutral: 'text-muted-foreground',
  negative: 'text-destructive',
};

const toneBarColors: Record<string, string> = {
  joy: 'hsl(45, 93%, 55%)',
  sadness: 'hsl(220, 70%, 55%)',
  anger: 'hsl(0, 72%, 55%)',
  fear: 'hsl(270, 60%, 55%)',
  surprise: 'hsl(35, 90%, 55%)',
  disgust: 'hsl(150, 40%, 40%)',
  love: 'hsl(340, 75%, 55%)',
  trust: 'hsl(174, 62%, 38%)',
};

interface Props {
  sentiment: SentimentData;
}

export function SentimentTab({ sentiment }: Props) {
  const { aggregate, per_sender } = sentiment;

  const toneData = Object.entries(aggregate.tone_distribution || {}).map(([name, value]) => ({
    name,
    value,
    fill: toneBarColors[name] || 'hsl(210, 15%, 60%)',
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overall Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Badge className={sentimentColors[aggregate.overall_label]}>
              {aggregate.overall_label.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Score: <strong>{aggregate.avg_score_0_100}</strong>/100
            </span>
            <span className="text-sm text-muted-foreground">
              Volatility: <strong>{aggregate.sentiment_volatility?.toFixed(2) ?? 'N/A'}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-success">Positivity {(aggregate.positivity_ratio * 100).toFixed(0)}%</span>
              <span className="text-destructive">Negativity {(aggregate.negativity_ratio * 100).toFixed(0)}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="bg-success transition-all" style={{ width: `${aggregate.positivity_ratio * 100}%` }} />
              <div className="bg-destructive transition-all" style={{ width: `${aggregate.negativity_ratio * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {toneData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tone Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toneData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {toneData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {per_sender.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Per Person</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {per_sender.map((s) => (
              <div key={s.sender} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{s.sender}</span>
                <div className="flex items-center gap-3">
                  <Progress value={s.score_0_100} className="h-2 w-24" />
                  <Badge variant="outline">{s.score_0_100}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
