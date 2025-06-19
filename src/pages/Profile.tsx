
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Mail } from 'lucide-react';

export default function Profile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Profile form state
  const [email, setEmail] = useState(user?.email || '');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) {
        toast({
          title: 'Fout',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Succes',
          description: 'Profiel succesvol bijgewerkt'
        });
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van je profiel',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Fout',
        description: 'Nieuwe wachtwoorden komen niet overeen',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Fout',
        description: 'Wachtwoord moet minimaal 6 karakters lang zijn',
        variant: 'destructive'
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: 'Fout',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Succes',
          description: 'Wachtwoord succesvol gewijzigd'
        });
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het wijzigen van je wachtwoord',
        variant: 'destructive'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profiel Beheren</h1>
        <p className="text-muted-foreground">
          Beheer je account instellingen en wijzig je wachtwoord
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profiel Informatie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Huidige Rol</Label>
                <Input
                  value={profile?.role || 'Geen rol'}
                  disabled
                  className="capitalize"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Bezig met opslaan...' : 'Profiel Bijwerken'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Wachtwoord Wijzigen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Voer nieuw wachtwoord in"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig Nieuw Wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Bevestig nieuw wachtwoord"
                    required
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Wachtwoord vereisten:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Minimaal 6 karakters lang</li>
                  <li>Wordt automatisch opgeslagen in Supabase</li>
                </ul>
              </div>

              <Button type="submit" disabled={passwordLoading} className="w-full">
                {passwordLoading ? 'Bezig met wijzigen...' : 'Wachtwoord Wijzigen'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
