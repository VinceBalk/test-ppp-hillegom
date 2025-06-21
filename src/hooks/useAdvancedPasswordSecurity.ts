
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PasswordStrength {
  score: number;
  feedback: string[];
  isStrong: boolean;
}

export const useAdvancedPasswordSecurity = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Gebruik minimaal 8 karakters');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Voeg kleine letters toe');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Voeg hoofdletters toe');
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Voeg cijfers toe');
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Voeg speciale tekens toe (!@#$%^&*)');
    } else {
      score += 2;
    }

    // Common patterns check
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|234|345|456|567|678|789|890/, // Sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
      /password|wachtwoord|admin|user|login|inloggen/i // Common words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        feedback.push('Vermijd voorspelbare patronen');
        score -= 1;
        break;
      }
    }

    const isStrong = score >= 5 && feedback.length === 0;

    return {
      score: Math.max(0, Math.min(6, score)),
      feedback,
      isStrong
    };
  };

  const validatePasswordSecurity = (password: string, confirmPassword?: string) => {
    const strength = analyzePasswordStrength(password);
    const errors: string[] = [];

    if (!strength.isStrong) {
      errors.push(...strength.feedback);
    }

    if (confirmPassword && password !== confirmPassword) {
      errors.push('Wachtwoorden komen niet overeen');
    }

    return {
      isValid: errors.length === 0 && strength.isStrong,
      errors,
      strength
    };
  };

  return {
    loading,
    analyzePasswordStrength,
    validatePasswordSecurity
  };
};
