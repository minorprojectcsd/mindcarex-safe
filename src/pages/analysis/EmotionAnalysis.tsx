import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

export default function EmotionAnalysis() {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Emotion Analysis</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Live facial emotion detection will be available here once the analysis backend is integrated.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
