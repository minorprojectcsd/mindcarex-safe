import { format } from 'date-fns';
import { User, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatientCardProps {
  patient: Patient;
  nextSession?: Date;
  riskLevel?: 'low' | 'medium' | 'high';
  lastImprovement?: number;
}

export function PatientCard({ patient, nextSession, riskLevel, lastImprovement }: PatientCardProps) {
  const navigate = useNavigate();

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      default: return 'risk-low';
    }
  };

  return (
    <Card variant="interactive" className="animate-slide-up">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light">
            <span className="text-sm font-semibold text-primary">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{patient.name}</h3>
                <p className="text-sm text-muted-foreground">{patient.email}</p>
              </div>
              {riskLevel && (
                <Badge variant={getRiskVariant()}>
                  {riskLevel === 'high' && <AlertTriangle className="mr-1 h-3 w-3" />}
                  {riskLevel === 'low' && <TrendingUp className="mr-1 h-3 w-3" />}
                  {riskLevel} risk
                </Badge>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {nextSession && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Next: {format(nextSession, 'MMM d, h:mm a')}</span>
                </div>
              )}
              {lastImprovement !== undefined && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success">+{lastImprovement}% improvement</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${patient.id}`)}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
