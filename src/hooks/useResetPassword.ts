
import { useNavigate } from 'react-router-dom';
import { useResetLinkValidation } from '@/hooks/useResetLinkValidation';
import { usePasswordResetForm } from '@/hooks/usePasswordResetForm';
import { usePostResetCleanup } from '@/hooks/usePostResetCleanup';

export const useResetPassword = () => {
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
    handleResetPassword
  } = usePasswordResetForm(isValidLink);

  usePostResetCleanup(resetCompleted);

  return {
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
  };
};
