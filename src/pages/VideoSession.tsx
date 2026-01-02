import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VideoRoom } from '@/components/video/VideoRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { consentApi } from '@/services/api';
import { ConsentSettings } from '@/types';

export default function VideoSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [hasConfirmedConsent, setHasConfirmedConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConsent = async () => {
      if (!user) return;
      
      try {
        const settings = await consentApi.getConsent(user.id);
        setConsent(settings);
      } catch (error) {
        console.error('Failed to load consent settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, [user]);

  const handleConsentChange = (key: keyof ConsentSettings) => {
    if (!consent) return;
    setConsent({ ...consent, [key]: !consent[key] });
  };

  const handleConfirm = async () => {
    if (!user || !consent) return;
    
    await consentApi.updateConsent(user.id, consent);
    setHasConfirmedConsent(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Show consent confirmation before joining
  if (!hasConfirmedConsent && consent) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl animate-slide-up">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Before You Join</CardTitle>
              <CardDescription>
                Please review and confirm your privacy settings for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-warning-light p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
                  <div className="text-sm">
                    <p className="font-medium text-warning-foreground">
                      Privacy Notice
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Your session may be analyzed to provide better mental health insights.
                      You can control what data is collected below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Camera</p>
                    <p className="text-sm text-muted-foreground">
                      Enable video during the session
                    </p>
                  </div>
                  <Switch
                    checked={consent.cameraEnabled}
                    onCheckedChange={() => handleConsentChange('cameraEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Microphone</p>
                    <p className="text-sm text-muted-foreground">
                      Enable audio during the session
                    </p>
                  </div>
                  <Switch
                    checked={consent.micEnabled}
                    onCheckedChange={() => handleConsentChange('micEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Emotion Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to analyze facial expressions
                    </p>
                  </div>
                  <Switch
                    checked={consent.emotionTrackingEnabled}
                    onCheckedChange={() => handleConsentChange('emotionTrackingEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Chat Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to analyze chat messages
                    </p>
                  </div>
                  <Switch
                    checked={consent.chatAnalysisEnabled}
                    onCheckedChange={() => handleConsentChange('chatAnalysisEnabled')}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  Join Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)]">
        <VideoRoom
          sessionId={sessionId || 'demo-session'}
          consent={consent!}
        />
      </div>
    </DashboardLayout>
  );
}
