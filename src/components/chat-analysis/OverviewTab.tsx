import { ChatStats } from '@/types/chatAnalysis';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Type, Image, Link2, Trash2, CalendarDays } from 'lucide-react';

const metrics = [
  { key: 'total_messages', label: 'Total Messages', icon: MessageSquare },
  { key: 'total_words', label: 'Total Words', icon: Type },
  { key: 'media_shared', label: 'Media Shared', icon: Image },
  { key: 'links_shared', label: 'Links Shared', icon: Link2 },
  { key: 'deleted_messages', label: 'Deleted Messages', icon: Trash2 },
  { key: 'total_days', label: 'Days Span', icon: CalendarDays },
] as const;

interface Props {
  stats: ChatStats;
}

export function OverviewTab({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{(stats as any)[key] ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
