import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConsentForm } from '@/components/settings/ConsentForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light sm:h-10 sm:w-10">
                  <User className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input defaultValue={user?.email} className="pl-10" disabled />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button className="w-full sm:w-auto">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light sm:h-10 sm:w-10">
                  <Bell className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Manage how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div>
                    <p className="text-sm font-medium sm:text-base">Email Notifications</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Receive session reminders via email
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Configure
                  </Button>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div>
                    <p className="text-sm font-medium sm:text-base">Session Reminders</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Get reminded 15 minutes before sessions
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy & Consent (Patient only) */}
        {user?.role === 'PATIENT' && <ConsentForm />}

        {/* Security */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light sm:h-10 sm:w-10">
                <Shield className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Security</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your account security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div>
                  <p className="text-sm font-medium sm:text-base">Password</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Last changed 30 days ago
                  </p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">Change Password</Button>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div>
                  <p className="text-sm font-medium sm:text-base">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">Enable</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
