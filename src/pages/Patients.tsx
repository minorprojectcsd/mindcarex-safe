import { useEffect, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientCard } from '@/components/patients/PatientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { patientApi, scheduleApi } from '@/services/api';
import { Patient, Schedule } from '@/types';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [patientsData, schedulesData] = await Promise.all([
          patientApi.getPatients(user.id),
          scheduleApi.getDoctorSchedules(user.id),
        ]);

        setPatients(patientsData);
        setSchedules(schedulesData);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getNextSession = (patientId: string): Date | undefined => {
    const patientSchedules = schedules
      .filter((s) => s.patient_id === patientId && s.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
    
    return patientSchedules[0] ? new Date(patientSchedules[0].scheduled_time) : undefined;
  };

  return (
    <DashboardLayout requireRole="DOCTOR">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Patients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {patients.length} patients under your care
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Loading patients...</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredPatients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                nextSession={getNextSession(patient.id)}
                riskLevel={index === 0 ? 'medium' : index === 2 ? 'high' : 'low'}
                lastImprovement={index === 1 ? 8 : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No patients match your search'
                : 'No patients found'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
