import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ResetPasswordLoading from '@/components/ResetPasswordLoading';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { useToast } from '@/hooks/use-toast';
import { usePasswordResetForm } from '@/hooks/usePasswordResetForm';
import { usePostResetCleanup } from '@/hooks/usePostResetCleanup';

export default function ResetPassword() {
  const [isValidLink, setIsValidLink] = useState(false);
  const [linkValidated, setLinkValidated] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isResetting,
    resetCompleted,
    loading,
    handleResetPassword,
  } = usePasswordResetForm(isValidLink);

  usePostResetCleanup(resetCompleted);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (type !== 'recovery' || !accessToken || !refreshToken) {
      setIsValidLink(false);
      setLinkValidated(true);
      toast({
        title: 'Ongeldige link',
        description: 'De reset link is ongeldig of verlopen.',
        variant: 'destructive',
      });
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setIsValidLink(false);
          toast({
            title: 'Fout bij inloggen',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setIsValidLink(true);
        }
      })
      .finally(() => setLinkValidated(true));
  }, [searchParams]);

  if (!linkValidated) {
    return <ResetPasswordLoading />;
  }

  return (
    <ResetPasswordForm
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      isValidLink={isValidLink}
      loading={loading}
      isResetting={isResetting}
      onSubmit={handleResetPassword}
      onBackToLogin={() => navigate('/login')}
    />
  );
}
