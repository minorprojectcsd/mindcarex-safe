import api from '@/lib/api';

export interface DoctorProfile {
  id: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number | null;
  qualifications: string | null;
  bio: string | null;
  languages: string | null;
  clinicAddress: string | null;
  consultationFee: string | null;
  availabilityStatus: string;
}

export interface PatientProfile {
  id: string;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  gender: string | null;
  age: number | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
  emergencyContactRelation: string | null;
  medicalHistory: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  currentMedications: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
}

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  profile: DoctorProfile | PatientProfile | null;
}

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/api/profile');
    return response.data;
  },

  async updateProfile(updates: Record<string, any>): Promise<string> {
    const response = await api.put<string>('/api/profile', updates);
    return response.data;
  },
};
