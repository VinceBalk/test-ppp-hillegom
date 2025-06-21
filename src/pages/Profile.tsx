
import { useAuth } from '@/contexts/AuthContext';
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SecuritySection } from '@/components/profile/SecuritySection';

export default function Profile() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Profiel laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mijn Profiel</h1>
        <p className="text-muted-foreground mt-2">
          Beheer je account instellingen en beveiliging
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ProfileHeader email={user.email || ''} role={profile.role} />
          <SecuritySection />
        </div>
        
        <div>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
}
