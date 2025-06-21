
import { useEnhancedSecurity } from './useEnhancedSecurity';

export const useInputSanitization = () => {
  const { logHighRiskActivity } = useEnhancedSecurity();

  const sanitizeInput = (input: string, type: 'text' | 'email' | 'name' = 'text'): string => {
    if (!input) return '';

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /data:/gi, // Data URLs
      /vbscript:/gi, // VBScript
      /<iframe[^>]*>.*?<\/iframe>/gi, // Iframes
      /expression\s*\(/gi, // CSS expressions
      /import\s+/gi, // Import statements
      /eval\s*\(/gi, // Eval functions
      /document\./gi, // Document object access
      /window\./gi, // Window object access
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        logHighRiskActivity('suspicious_input_detected', {
          input: input.substring(0, 100), // Log first 100 chars only
          pattern: pattern.toString(),
          type
        });
        break;
      }
    }

    // Basic sanitization
    let sanitized = input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Type-specific sanitization
    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().trim();
        break;
      case 'name':
        sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '').trim();
        break;
      case 'text':
      default:
        sanitized = sanitized.trim();
    }

    return sanitized;
  };

  const validateInput = (input: string, type: 'text' | 'email' | 'name' = 'text'): boolean => {
    if (!input) return false;

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) && input.length <= 254;
      case 'name':
        return /^[a-zA-Z\s\-']{1,100}$/.test(input);
      case 'text':
      default:
        return input.length > 0 && input.length <= 1000;
    }
  };

  return {
    sanitizeInput,
    validateInput
  };
};
