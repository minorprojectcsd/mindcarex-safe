import { RiskData } from '@/types/chatAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, ShieldAlert, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

const riskColors: Record<string, string> = {
  none: 'bg-success text-success-foreground',
  low: 'bg-warning/80 text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  high: 'bg-destructive text-destructive-foreground',
  critical: 'bg-destructive text-destructive-foreground animate-pulse',
};

const riskBorderColors: Record<string, string> = {
  none: 'border-success/30',
  low: 'border-warning/40',
  medium: 'border-accent/40',
  high: 'border-destructive/40',
  critical: 'border-destructive ring-2 ring-destructive/30',
};

interface Props {
  risk: RiskData;
}

export function RiskTab({ risk }: Props) {
  return (
    <div className="space-y-6">
      <Card className={cn('border-2', riskBorderColors[risk.overall_risk_level])}>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
          <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full', riskColors[risk.overall_risk_level])}>
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold uppercase tracking-wide">
              {risk.overall_risk_level} Risk — Score: {risk.overall_risk_score_0_to_100}/100
            </p>
            <p className="text-sm text-muted-foreground">{risk.overall_summary}</p>
            {risk.conversation_escalating && (
              <Badge variant="destructive" className="mt-2">
                ⚠️ Conversation is escalating
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {risk.per_person_risk.map((person) => (
        <Card key={person.person} className={cn(person.risk_is_escalating && 'border-destructive/40')}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{person.person}</CardTitle>
              {person.person_is_at_risk && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <UserX className="h-3 w-3" /> At risk
                </Badge>
              )}
              {person.person_poses_risk_to_others && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" /> Poses risk to others
                </Badge>
              )}
              {person.risk_is_escalating && (
                <Badge variant="outline" className="border-destructive text-destructive gap-1 text-xs">
                  Escalating
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{person.plain_english_summary}</p>

            {person.escalation_note && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Escalation Note</AlertTitle>
                <AlertDescription>{person.escalation_note}</AlertDescription>
              </Alert>
            )}

            {person.clinical_notes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Clinical Notes</p>
                {person.clinical_notes.map((note, i) => (
                  <Alert key={i} className="border-warning/40 bg-warning-light">
                    <AlertTitle className="text-sm font-semibold">
                      {note.category_label}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({note.direction})</span>
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-sm">
                      {note.clinical_note}
                      {note.phrases_found.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Phrases: {note.phrases_found.map((p) => `"${p}"`).join(', ')}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {person.flagged_messages.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                  Flagged Messages ({person.flagged_messages.length})
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                  {person.flagged_messages.map((msg, i) => (
                    <div key={i} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{msg.date}</span>
                        <Badge variant="outline" className="text-xs">{msg.this_message_severity}</Badge>
                      </div>
                      <p className="mt-1">{msg.message_text}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {msg.category_labels.map((l) => (
                          <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground text-center px-4">
        This analysis is an AI-assisted tool to support clinical judgment. It does not replace professional diagnosis. Always apply clinical discretion.
      </p>
    </div>
  );
}
