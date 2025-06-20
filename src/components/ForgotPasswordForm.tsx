
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail } from '@/utils/inputSanitization';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast({
        title: "Email vereist",
        description: "Voer een geldig email adres in om je wachtwoord te resetten.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Reset mislukt",
          description: error.message || "Er is een fout opgetreden bij het resetten van je wachtwoord.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset link verzonden!",
          description: "Controleer je email voor een link om je wachtwoord te resetten. Let op: de link is 1 uur geldig.",
        });
        onBack();
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Wachtwoord vergeten?</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Voer je email adres in om een reset link te ontvangen.
        </p>
      </div>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="je@email.com"
            required
            className="h-12"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-12 text-base font-medium gradient-primary"
          disabled={resetLoading}
        >
          {resetLoading ? 'Bezig met verzenden...' : 'Reset link verzenden'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Terug naar inloggen
        </Button>
      </form>
    </div>
  );
}
