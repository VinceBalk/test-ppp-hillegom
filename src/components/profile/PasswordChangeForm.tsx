
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { useInputSanitization } from '@/hooks/useInputSanitization';
import { Lock } from 'lucide-react';

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const { updatePassword, validatePassword, loading } = usePasswordSecurity();
  const { sanitizeInput } = useInputSanitization();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedNewPassword = sanitizeInput(newPassword);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

    if (sanitizedNewPassword !== sanitizedConfirmPassword) {
      return;
    }

    const validation = validatePassword(sanitizedNewPassword);
    if (!validation.isValid) {
      return;
    }

    await updatePassword(sanitizedNewPassword, true);
    
    // Reset form on success
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Wachtwoord Wijzigen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Huidig Wachtwoord</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                maxLength={128}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="new-password">Nieuw Wachtwoord</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                maxLength={128}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password">Bevestig Nieuw Wachtwoord</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                maxLength={128}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-passwords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="show-passwords" className="text-sm">
              Wachtwoorden tonen
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Wijzigen...' : 'Wachtwoord Wijzigen'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
