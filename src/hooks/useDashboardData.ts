import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  primary_doctor_id: string | null;
}

interface Schedule {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_time: string;
  status: string;
  duration: number | null;
  notes: string | null;
  patient_profile?: Profile | null;
}

interface Session {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  notes: string | null;
}

export function useDoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch schedules for this doctor
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('doctor_id', user.id)
          .order('scheduled_time', { ascending: true });

        if (schedulesError) throw schedulesError;

        // Get unique patient IDs from schedules
        const patientIds = [...new Set((schedulesData || []).map(s => s.patient_id))];

        // Fetch patient profiles
        let patientsData: Profile[] = [];
        if (patientIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', patientIds);

          if (profilesError) throw profilesError;
          patientsData = (profiles || []) as Profile[];
        }

        // Also fetch patients where this doctor is their primary doctor
        const { data: assignedPatients, error: assignedError } = await supabase
          .from('profiles')
          .select('*')
          .eq('primary_doctor_id', user.id);

        if (assignedError) throw assignedError;

        // Merge unique patients
        const allPatients = [...patientsData];
        (assignedPatients || []).forEach(p => {
          if (!allPatients.find(existing => existing.id === p.id)) {
            allPatients.push(p as Profile);
          }
        });

        // Fetch recent sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('doctor_id', user.id)
          .order('start_time', { ascending: false })
          .limit(10);

        if (sessionsError) throw sessionsError;

        // Enrich schedules with patient names
        const enrichedSchedules = (schedulesData || []).map(schedule => ({
          ...schedule,
          patient_profile: allPatients.find(p => p.id === schedule.patient_id) || null,
        }));

        setSchedules(enrichedSchedules);
        setPatients(allPatients);
        setSessions((sessionsData || []) as Session[]);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return { patients, schedules, sessions, isLoading, error };
}

export function usePatientDashboard() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [doctor, setDoctor] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch patient's own profile to get primary doctor
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Fetch doctor profile if assigned
        if (profile?.primary_doctor_id) {
          const { data: doctorProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.primary_doctor_id)
            .maybeSingle();
          
          setDoctor(doctorProfile as Profile | null);
        }

        // Fetch schedules for this patient
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('patient_id', user.id)
          .order('scheduled_time', { ascending: true });

        if (schedulesError) throw schedulesError;

        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', user.id)
          .order('start_time', { ascending: false });

        if (sessionsError) throw sessionsError;

        setSchedules((schedulesData || []) as Schedule[]);
        setSessions((sessionsData || []) as Session[]);
      } catch (err) {
        console.error('Patient dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return { schedules, sessions, doctor, isLoading, error };
}
