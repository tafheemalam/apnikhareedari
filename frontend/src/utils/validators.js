export const PHONE_REGEX = /^(\+92|0092|0)3\d{9}$/;
export const PHONE_DIGITS_LENGTH = 11; // local 03XXXXXXXXX format

// Keeps digits only, capped to the fixed local-format length — stops the
// field from accepting more digits than a Pakistani mobile number can have.
export function sanitizePhoneDigits(value) {
  return value.replace(/\D/g, '').slice(0, PHONE_DIGITS_LENGTH);
}

// Groups digits as "XXXX XXXXXXX" (e.g. "0300 1234567") for display —
// the underlying stored value stays plain digits (see sanitizePhoneDigits).
export function formatPhoneDisplay(digits) {
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function isValidPhone(value, { required = false } = {}) {
  if (!value) return !required;
  return PHONE_REGEX.test(value.replace(/[\s-]/g, ''));
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function passwordChecks(value = '') {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

export function passwordScore(value = '') {
  if (!value) return 0;
  return Object.values(passwordChecks(value)).filter(Boolean).length;
}

export function isStrongPassword(value = '') {
  return passwordScore(value) === 5;
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.';
