import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';

export default function VoiceAnalysis() {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Voice Analysis</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" /> Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Voice stress analysis will be available here once the analysis backend is integrated.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
