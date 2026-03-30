export const passwordRegex = {
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  allowedChars: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/,

  // Contains at least one letter
  hasLetter: /[a-zA-Z]/,

  // Contains at least one number
  hasNumber: /\d/,

  // Contains at least one special character
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,

  // Strong password: at least 8 characters, containing uppercase and lowercase letters, numbers and special characters
  strongPassword:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/,
}

export const usernameRegex = {
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  allowedChars: /^[a-zA-Z0-9_]*$/,

  standard: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
}

export const emailRegex = {
  standard: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  noChinese:
    /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*@[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,
}

export const phoneRegex = {
  china: /^1[3-9]\d{9}$/,

  international: /^\+?[1-9]\d{1,14}$/,
}

export const ipRegex = {
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
}

export const urlRegex = {
  // HTTP/HTTPS URL
  http: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,

  // WebSocket URL
  websocket: /^wss?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?$/,
}

export const filenameRegex = {
  noChinese: /^[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*$/,

  safe: /^[a-zA-Z0-9._-]+$/,

  forbidden: /[<>:"/\\|?*\x00-\x1f]/,
}

// Number related rules
export const numberRegex = {
  // positive integer
  positiveInteger: /^[1-9]\d*$/,

  // non-negative integers (including 0)
  nonNegativeInteger: /^(?:0|[1-9]\d*)$/,

  // floating point number
  float: /^-?\d+(?:\.\d+)?$/,

  // Port number (1-65535)
  port: /^(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
}

// Verification function
export const validators = {
  // Verify whether the password contains Chinese characters
  isPasswordNoChinese: (password: string): boolean => {
    return passwordRegex.noChinese.test(password)
  },

  // Verify whether the password characters are legal
  isPasswordValidChars: (password: string): boolean => {
    return passwordRegex.allowedChars.test(password)
  },

  // Verify strong password
  isStrongPassword: (password: string): boolean => {
    return passwordRegex.strongPassword.test(password)
  },

  // Verify username format
  isValidUsername: (username: string): boolean => {
    return usernameRegex.standard.test(username)
  },

  // Verify email format
  isValidEmail: (email: string): boolean => {
    return emailRegex.standard.test(email)
  },

  // Verify IP address
  isValidIPv4: (ip: string): boolean => {
    return ipRegex.ipv4.test(ip)
  },
}

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
}
