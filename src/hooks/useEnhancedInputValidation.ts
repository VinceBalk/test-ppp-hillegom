
import { useComprehensiveSecurityMonitoring } from './useComprehensiveSecurityMonitoring';

export const useEnhancedInputValidation = () => {
  const { logSecurityEvent } = useComprehensiveSecurityMonitoring();

  const sanitizeInput = (input: string, type: 'text' | 'email' | 'name' | 'password' = 'text'): string => {
    if (!input) return '';

    // Enhanced suspicious pattern detection
    const suspiciousPatterns = [
      // Script injection patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /expression\s*\(/gi,
      
      // SQL injection patterns
      /('|(\\\')|(\-\-)|(%27)|(%2D%2D))/gi,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
      
      // Command injection patterns
      /(\||;|&|`|\$\(|\${)/gi,
      
      // Path traversal
      /(\.\.\/|\.\.\%2F|\.\.\%5C)/gi,
      
      // Advanced patterns
      /import\s+/gi,
      /eval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /location\./gi,
      /\bfetch\b/gi,
      /\bXMLHttpRequest\b/gi,
    ];

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const detectedPatterns: string[] = [];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.toString());
        
        // Determine risk level based on pattern type
        if (pattern.toString().includes('script|iframe|eval')) {
          riskLevel = 'critical';
        } else if (pattern.toString().includes('union|select|insert')) {
          riskLevel = 'high';
        } else if (pattern.toString().includes('javascript|vbscript')) {
          riskLevel = 'high';
        } else {
          riskLevel = 'medium';
        }
      }
    }

    if (detectedPatterns.length > 0) {
      logSecurityEvent('suspicious_activity', 'malicious_input_detected', 'input_validation', null, {
        input_type: type,
        input_preview: input.substring(0, 50),
        detected_patterns: detectedPatterns,
        input_length: input.length
      }, riskLevel);
    }

    // Enhanced sanitization based on type
    let sanitized = input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/`/g, '&#x60;');

    // Type-specific sanitization
    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().trim();
        // Remove any non-email characters
        sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
        break;
      case 'name':
        // Allow only letters, spaces, hyphens, and apostrophes
        sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '').trim();
        break;
      case 'password':
        // Don't sanitize passwords, just validate length and character set
        if (input.length > 128) {
          logSecurityEvent('suspicious_activity', 'excessive_password_length', 'input_validation', null, {
            length: input.length
          }, 'high');
          return input.substring(0, 128);
        }
        return input; // Return original for passwords
      case 'text':
      default:
        sanitized = sanitized.trim();
        // Remove null bytes and control characters
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }

    return sanitized;
  };

  const validateInput = (input: string, type: 'text' | 'email' | 'name' | 'password' = 'text'): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!input) {
      errors.push('Input is required');
      return { isValid: false, errors };
    }

    // Enhanced validation based on type
    switch (type) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(input)) {
          errors.push('Invalid email format');
        }
        if (input.length > 254) {
          errors.push('Email too long');
        }
        if (input.length < 5) {
          errors.push('Email too short');
        }
        break;
        
      case 'name':
        if (!/^[a-zA-Z\s\-']{1,100}$/.test(input)) {
          errors.push('Name contains invalid characters or is too long');
        }
        if (input.length < 1) {
          errors.push('Name is required');
        }
        break;
        
      case 'password':
        if (input.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        if (input.length > 128) {
          errors.push('Password is too long');
        }
        if (!/(?=.*[a-z])/.test(input)) {
          errors.push('Password must contain lowercase letters');
        }
        if (!/(?=.*[A-Z])/.test(input)) {
          errors.push('Password must contain uppercase letters');
        }
        if (!/(?=.*\d)/.test(input)) {
          errors.push('Password must contain numbers');
        }
        if (!/(?=.*[@$!%*?&])/.test(input)) {
          errors.push('Password must contain special characters');
        }
        break;
        
      case 'text':
      default:
        if (input.length > 1000) {
          errors.push('Text is too long');
        }
        if (input.length < 1) {
          errors.push('Text is required');
        }
    }

    return { isValid: errors.length === 0, errors };
  };

  const validateAndSanitize = (input: string, type: 'text' | 'email' | 'name' | 'password' = 'text') => {
    const sanitized = sanitizeInput(input, type);
    const validation = validateInput(sanitized, type);
    
    return {
      sanitized,
      ...validation
    };
  };

  return {
    sanitizeInput,
    validateInput,
    validateAndSanitize
  };
};
