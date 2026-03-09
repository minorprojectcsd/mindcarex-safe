import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, MessageSquare, ShieldAlert, Brain, Heart, Activity, Languages, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { chatAnalysisService } from '@/services/chatAnalysisService';
import type { ChatAnalysisResult } from '@/types/chatAnalysis';
import { OverviewTab } from '@/components/chat-analysis/OverviewTab';
import { RiskTab } from '@/components/chat-analysis/RiskTab';
import { MentalHealthTab } from '@/components/chat-analysis/MentalHealthTab';
import { SentimentTab } from '@/components/chat-analysis/SentimentTab';
import { ActivityTab } from '@/components/chat-analysis/ActivityTab';
import { LanguageTab } from '@/components/chat-analysis/LanguageTab';

export default function ChatAnalysis() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ChatAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await chatAnalysisService.analyze(file);
      setResult(data);
      toast({ title: 'Analysis complete', description: 'Chat has been analyzed successfully.' });
    } catch (err: any) {
      const msg = err?.message?.includes('parse')
        ? 'Could not read this file. Please make sure you exported the chat from WhatsApp.'
        : err?.message || 'Analysis failed. Please try again.';
      setError(msg);
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, toast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Chat Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload a patient's WhatsApp chat export to get AI-powered mental health insights.</p>
        </div>
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Upload WhatsApp Export</CardTitle>
              <CardDescription>Ask the patient to export their chat: Open chat → ⋮ → More → Export Chat → Without Media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input type="file" accept=".txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="flex-1" />
                <Button onClick={handleAnalyze} disabled={!file || isAnalyzing} className="gap-2">
                  {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : 'Analyze'}
                </Button>
              </div>
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {isAnalyzing && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing conversation… this may take a moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {result && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Session: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{result.session_id}</code></p>
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setFile(null); setError(null); }}>New Analysis</Button>
            </div>
            <Tabs defaultValue="risk" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Overview</TabsTrigger>
                <TabsTrigger value="risk" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Risk</TabsTrigger>
                <TabsTrigger value="mental-health" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Mental Health</TabsTrigger>
                <TabsTrigger value="sentiment" className="gap-1.5"><Heart className="h-3.5 w-3.5" /> Sentiment</TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Activity</TabsTrigger>
                <TabsTrigger value="language" className="gap-1.5"><Languages className="h-3.5 w-3.5" /> Language</TabsTrigger>
              </TabsList>
              <TabsContent value="overview"><OverviewTab stats={result.stats} /></TabsContent>
              <TabsContent value="risk"><RiskTab risk={result.risk} /></TabsContent>
              <TabsContent value="mental-health"><MentalHealthTab mentalHealth={result.mental_health} /></TabsContent>
              <TabsContent value="sentiment"><SentimentTab sentiment={result.sentiment} /></TabsContent>
              <TabsContent value="activity"><ActivityTab hourActivity={result.hour_activity} weekActivity={result.week_activity} monthlyTimeline={result.monthly_timeline} lateNightStats={result.late_night_stats} /></TabsContent>
              <TabsContent value="language"><LanguageTab topWords={result.top_words} topEmojis={result.top_emojis} vocabularyRichness={result.vocabulary_richness} responseTime={result.response_time} initiatorStats={result.initiator_stats} silentPeriods={result.silent_periods} /></TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
