import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, ProfileResponse, DoctorProfile, PatientProfile } from '@/services/profileService';
import { User, Mail, Stethoscope, Heart, Save, Loader2, Shield } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  useEffect(() => {
    if (profile) {
      const initial: Record<string, any> = { fullName: profile.fullName };
      if (profile.profile) {
        Object.entries(profile.profile).forEach(([k, v]) => {
          if (k !== 'id') initial[k] = v ?? '';
        });
      }
      setFormData(initial);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => profileService.updateProfile(data),
    onSuccess: () => toast({ title: 'Profile updated', description: 'Your changes have been saved.' }),
    onError: () => toast({ title: 'Update failed', description: 'Could not save changes.', variant: 'destructive' }),
  });

  const handleSave = () => {
    const updates: Record<string, any> = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) updates[k] = v;
    });
    updateMutation.mutate(updates);
  };

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const isDoctor = profile?.role === 'DOCTOR';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal and professional details</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            {isDoctor ? <Stethoscope className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
            {profile?.role}
          </Badge>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.fullName || ''} onChange={(e) => set('fullName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={profile?.email || ''} disabled className="pl-10" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Profile */}
        {isDoctor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4" /> Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input value={formData.specialization || ''} onChange={(e) => set('specialization', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input value={formData.licenseNumber || ''} disabled className="bg-muted" />
                  <p className="text-[10px] text-muted-foreground">Cannot be changed</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input type="number" value={formData.experienceYears || ''} onChange={(e) => set('experienceYears', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Consultation Fee</Label>
                  <Input value={formData.consultationFee || ''} onChange={(e) => set('consultationFee', e.target.value)} placeholder="e.g. ₹500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Qualifications</Label>
                <Textarea value={formData.qualifications || ''} onChange={(e) => set('qualifications', e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={formData.bio || ''} onChange={(e) => set('bio', e.target.value.slice(0, 500))} rows={3} maxLength={500} />
                <p className="text-[10px] text-muted-foreground text-right">{(formData.bio || '').length}/500</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <Input value={formData.languages || ''} onChange={(e) => set('languages', e.target.value)} placeholder="English, Hindi..." />
                </div>
                <div className="space-y-2">
                  <Label>Clinic Address</Label>
                  <Input value={formData.clinicAddress || ''} onChange={(e) => set('clinicAddress', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Profile */}
        {!isDoctor && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4" /> Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={formData.phoneNumber || ''} onChange={(e) => set('phoneNumber', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={formData.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender || ''} onValueChange={(v) => set('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={formData.bloodGroup || ''} onValueChange={(v) => set('bloodGroup', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Input value={formData.allergies || ''} onChange={(e) => set('allergies', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={formData.address || ''} onChange={(e) => set('address', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Textarea value={formData.currentMedications || ''} onChange={(e) => set('currentMedications', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Medical History</Label>
                  <Textarea value={formData.medicalHistory || ''} onChange={(e) => set('medicalHistory', e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Emergency Contact</CardTitle>
                <CardDescription>Guardian email will receive session summaries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input value={formData.emergencyContactName || ''} onChange={(e) => set('emergencyContactName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={formData.emergencyContactPhone || ''} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" value={formData.emergencyContactEmail || ''} onChange={(e) => set('emergencyContactEmail', e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">⚡ Guardian will receive session summary emails</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={formData.emergencyContactRelation || ''} onValueChange={(v) => set('emergencyContactRelation', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
