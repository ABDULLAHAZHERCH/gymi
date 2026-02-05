export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateField(
  name: string,
  value: any,
  rules: ValidationRule
): string | null {
  // Required validation
  if (rules.required && !value) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return null;
  }

  // Min value validation
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `Must be at least ${rules.min}`;
  }

  // Max value validation
  if (rules.max !== undefined && Number(value) > rules.max) {
    return `Must be at most ${rules.max}`;
  }

  // Min length validation
  if (rules.minLength !== undefined && String(value).length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
    return `Must be at most ${rules.maxLength} characters`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return 'Invalid format';
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

export function validateForm(
  data: Record<string, any>,
  rules: ValidationRules
): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((fieldName) => {
    const error = validateField(fieldName, data[fieldName], rules[fieldName]);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
