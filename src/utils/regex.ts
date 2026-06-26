/**
 * @Purpose: Regular expression utilities
 * @Description: Centralized management of regular expressions used in the project
 * @version: 1.0.0
 * @Author: zhanglei
 * @Date: 2025-10-31
 */

// Password-related regex patterns
export const passwordRegex = {
  // Disallow Chinese characters (including Chinese punctuation)
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  // Allow only letters, numbers, and common symbols
  allowedChars: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/,

  // Must contain at least one letter
  hasLetter: /[a-zA-Z]/,

  // Must contain at least one number
  hasNumber: /\d/,

  // Must contain at least one special character
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,

  // Strong password: at least 8 chars, includes upper/lowercase letters, numbers, and special characters
  strongPassword:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/,
};

// Username-related regex patterns
export const usernameRegex = {
  // Disallow Chinese characters
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  // Allow only letters, numbers, and underscores
  allowedChars: /^[a-zA-Z0-9_]*$/,

  // Username format: 3-20 chars, starts with a letter, allows letters/numbers/underscores
  standard: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
};

// Email regex patterns
export const emailRegex = {
  // Standard email format
  standard: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Email that disallows Chinese characters
  noChinese:
    /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*@[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,
};

// Phone number regex patterns
export const phoneRegex = {
  // Mainland China phone number
  china: /^1[3-9]\d{9}$/,

  // International phone number format
  international: /^\+?[1-9]\d{1,14}$/,
};

// IP address regex patterns
export const ipRegex = {
  // IPv4 address
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  // IPv6 address
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
};

// URL regex patterns
export const urlRegex = {
  // HTTP/HTTPS URL
  http: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_\.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,

  // WebSocket URL
  websocket: /^wss?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_\.])*)?$/,
};

// Filename regex patterns
export const filenameRegex = {
  // Filename that disallows Chinese characters
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  // Safe filename (letters, numbers, dots, underscores, hyphens only)
  safe: /^[a-zA-Z0-9._-]+$/,

  // Forbidden filename characters
  forbidden: /[<>:"/\\|?*\x00-\x1f]/,
};

// Number-related regex patterns
export const numberRegex = {
  // Positive integer
  positiveInteger: /^[1-9]\d*$/,

  // Non-negative integer (including 0)
  nonNegativeInteger: /^(?:0|[1-9]\d*)$/,

  // Floating-point number
  float: /^-?\d+(?:\.\d+)?$/,

  // Port number (1-65535)
  port: /^(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
};

// Validation helpers
export const validators = {
  // Check whether password contains no Chinese characters
  isPasswordNoChinese: (password: string): boolean => {
    return passwordRegex.noChinese.test(password);
  },

  // Check whether password characters are valid
  isPasswordValidChars: (password: string): boolean => {
    return passwordRegex.allowedChars.test(password);
  },

  // Check whether password is strong
  isStrongPassword: (password: string): boolean => {
    return passwordRegex.strongPassword.test(password);
  },

  // Validate username format
  isValidUsername: (username: string): boolean => {
    return usernameRegex.standard.test(username);
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    return emailRegex.standard.test(email);
  },

  // Validate IPv4 address
  isValidIPv4: (ip: string): boolean => {
    return ipRegex.ipv4.test(ip);
  },
};

export default {
  passwordRegex,
  usernameRegex,
  emailRegex,
  phoneRegex,
  ipRegex,
  urlRegex,
  filenameRegex,
  numberRegex,
  validators,
};
