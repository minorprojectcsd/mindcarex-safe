import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Stethoscope, Heart, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import mindcareLogo from '@/assets/mindcare-brain.png';
import api from '@/lib/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'];

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');

  // Doctor fields (Step 2)
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  // Patient fields (Step 2)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Patient emergency (Step 3)
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  const totalSteps = role === 'PATIENT' ? 3 : 2;
  const progress = (step / totalSteps) * 100;

  const stepLabels = role === 'PATIENT'
    ? ['Account', 'Personal Info', 'Emergency Contact']
    : ['Account', 'Professional Info'];

  const canProceedStep1 = name.trim() && email.trim() && password.length >= 6;
  const canProceedStep2Doctor = specialization.trim() && licenseNumber.trim() && experienceYears;
  const canProceedStep2Patient = phoneNumber.trim() && dateOfBirth && gender;

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        email, password, fullName: name, role,
      };

      if (role === 'DOCTOR') {
        Object.assign(body, {
          specialization, licenseNumber,
          experienceYears: experienceYears ? parseInt(experienceYears) : null,
          qualifications: qualifications || null,
          bio: bio || null,
          languages: languages || null,
          clinicAddress: clinicAddress || null,
          consultationFee: consultationFee || null,
        });
      } else {
        Object.assign(body, {
          phoneNumber,
          dateOfBirth: dateOfBirth || null,
          gender: gender ? gender.toUpperCase() : null,
          address: address || null,
          medicalHistory: medicalHistory || null,
          bloodGroup: bloodGroup || null,
          allergies: allergies || null,
          currentMedications: currentMedications || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          emergencyContactEmail: emergencyContactEmail || null,
          emergencyContactRelation: emergencyContactRelation || null,
          emergencyContactRelationship: emergencyContactRelation || null,
          relationship: emergencyContactRelation || null,
        });
      }

      const response = await api.post('/api/auth/register', body);
      const data = response.data;

      // Backend returns token on registration — auto-login
      if (data.token) {
        const userRole = data.role || role;
        const authUser = {
          id: data.userId || `user-${Date.now()}`,
          email: data.email || email,
          name: data.fullName || name,
          role: userRole,
          created_at: new Date().toISOString(),
        };

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', userRole);
        if (data.userId) localStorage.setItem('userId', data.userId);
        localStorage.setItem('mindcarex_auth_user', JSON.stringify(authUser));
        setUser(authUser as any);

        toast({ title: 'Welcome!', description: 'Your account has been created successfully.' });
        if (userRole === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        toast({ title: 'Account created', description: 'Please login with your credentials.' });
        navigate('/login');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data || 'Registration failed.';
      toast({ title: 'Registration failed', description: String(message), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !canProceedStep1) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    if (step === 2 && role === 'DOCTOR' && !canProceedStep2Doctor) {
      toast({ title: 'Missing fields', description: 'Specialization, License Number, and Experience are required.', variant: 'destructive' });
      return;
    }
    if (step === 2 && role === 'PATIENT' && !canProceedStep2Patient) {
      toast({ title: 'Missing fields', description: 'Phone, Date of Birth, and Gender are required.', variant: 'destructive' });
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src={mindcareLogo} alt="mindcarex Logo" className="mx-auto mb-4 h-14 w-14 rounded-xl object-contain shadow-glow" />
          <h1 className="font-orbitron text-2xl font-bold">mindcareX</h1>
          <p className="mt-1 text-muted-foreground">Mental Health Platform</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Step {step} of {totalSteps}: {stepLabels[step - 1]}</CardDescription>
          </CardHeader>

          {/* Progress bar */}
          <div className="px-6 pb-2">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i + 1 <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1 < step ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="space-y-4">
            {/* Step 1: Account Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password (min 6 chars)" className="pl-10" minLength={6} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant={role === 'PATIENT' ? 'default' : 'outline'} onClick={() => setRole('PATIENT')} className="w-full gap-2">
                      <Heart className="h-4 w-4" />
                      Patient
                    </Button>
                    <Button type="button" variant={role === 'DOCTOR' ? 'default' : 'outline'} onClick={() => setRole('DOCTOR')} className="w-full gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Doctor
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Doctor fields */}
            {step === 2 && role === 'DOCTOR' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Specialization *</label>
                  <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Psychiatry" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License Number *</label>
                  <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="License #" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Years of Experience *</label>
                  <Input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="e.g. 5" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consultation Fee</label>
                  <Input value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} placeholder="e.g. ₹500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qualifications</label>
                  <Textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="e.g. MD, PhD" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Languages</label>
                  <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. English, Hindi" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clinic Address</label>
                  <Textarea value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} placeholder="Your clinic address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief professional bio" />
                </div>
              </>
            )}

            {/* Step 2: Patient fields */}
            {step === 2 && role === 'PATIENT' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Your phone number" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Birth *</label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender *</label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blood Group</label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medical History</label>
                  <Textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} placeholder="Any relevant medical history" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Allergies</label>
                  <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Known allergies" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Medications</label>
                  <Input value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} placeholder="Current medications" />
                </div>
              </>
            )}

            {/* Step 3: Patient Emergency Contact */}
            {step === 3 && role === 'PATIENT' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact Name</label>
                  <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact Phone</label>
                  <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="Contact phone" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact Email</label>
                  <Input type="email" value={emergencyContactEmail} onChange={(e) => setEmergencyContactEmail(e.target.value)} placeholder="Contact email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relationship</label>
                  <Select value={emergencyContactRelation} onValueChange={setEmergencyContactRelation}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button type="button" onClick={handleNext} disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : step < totalSteps ? 'Next' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
