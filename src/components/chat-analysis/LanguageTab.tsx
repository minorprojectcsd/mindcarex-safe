import { TopWord, TopEmoji, VocabularyRichness, ResponseTime, InitiatorStat, SilentPeriod } from '@/types/chatAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  topWords: TopWord[];
  topEmojis: TopEmoji[];
  vocabularyRichness: VocabularyRichness[];
  responseTime: ResponseTime[];
  initiatorStats: InitiatorStat[];
  silentPeriods: SilentPeriod[];
}

export function LanguageTab({ topWords, topEmojis, vocabularyRichness, responseTime, initiatorStats, silentPeriods }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Top Words</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWords.slice(0, 20)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="word" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(174, 62%, 38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topEmojis.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Emojis</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {topEmojis.map((e) => (
                <div key={e.emoji} className="flex items-center gap-1 rounded-full border px-3 py-1.5">
                  <span className="text-xl">{e.emoji}</span>
                  <span className="text-sm font-medium">{e.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {vocabularyRichness.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Vocabulary Richness</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vocabularyRichness.map((v) => (
                <div key={v.sender} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="font-medium">{v.sender}</span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>Diversity: <strong>{(v.lexical_diversity * 100).toFixed(1)}%</strong></span>
                    <span>Unique: <strong>{v.unique_words}</strong></span>
                    <span>Total: <strong>{v.total_words}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {responseTime.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Response Time</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {responseTime.map((r) => (
                <div key={r.sender} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="font-medium">{r.sender}</span>
                  <span className="text-muted-foreground">
                    Avg: <strong>{r.avg_response_min.toFixed(0)} min</strong> · Median: <strong>{r.median_response_min.toFixed(0)} min</strong>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {initiatorStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Conversation Initiators</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {initiatorStats.map((s) => (
                <Badge key={s.sender} variant="secondary" className="text-sm py-1.5 px-3">
                  {s.sender}: {s.initiations} ({s.percent.toFixed(0)}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {silentPeriods.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Silent Periods</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {silentPeriods.slice(0, 15).map((sp, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">{sp.from} → {sp.to}</span>
                  <Badge variant="outline">{sp.gap_hours.toFixed(0)}h gap</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
