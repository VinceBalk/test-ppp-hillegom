
import { useResetPassword } from '@/hooks/useResetPassword';
import ResetPasswordLoading from '@/components/ResetPasswordLoading';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default function ResetPassword() {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isValidLink,
    linkValidated,
    isResetting,
    loading,
    handleResetPassword,
    navigate
  } = useResetPassword();

  // Show loading state while validating the link
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
