
import { useResetLinkValidation } from '@/hooks/useResetLinkValidation';
import { usePasswordResetForm } from '@/hooks/usePasswordResetForm';
import { usePostResetCleanup } from '@/hooks/usePostResetCleanup';
import ResetPasswordLoading from '@/components/ResetPasswordLoading';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { isValidLink, linkValidated } = useResetLinkValidation();
  
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
