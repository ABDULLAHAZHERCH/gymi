import {
  validateField,
  validateForm,
  hasErrors,
  type ValidationRule,
  type ValidationRules,
} from '../validation';

describe('validation.ts', () => {
  describe('validateField', () => {
    it('returns error when required field is empty', () => {
      const result = validateField('name', '', { required: true });
      expect(result).toBe('This field is required');
    });

    it('returns null when required field has value', () => {
      const result = validateField('name', 'John', { required: true });
      expect(result).toBeNull();
    });

    it('returns null when optional field is empty', () => {
      const result = validateField('name', '', { required: false });
      expect(result).toBeNull();
    });

    it('validates min value', () => {
      const result = validateField('age', 5, { min: 10 });
      expect(result).toBe('Must be at least 10');
    });

    it('passes when value meets min', () => {
      const result = validateField('age', 10, { min: 10 });
      expect(result).toBeNull();
    });

    it('validates max value', () => {
      const result = validateField('weight', 500, { max: 300 });
      expect(result).toBe('Must be at most 300');
    });

    it('passes when value meets max', () => {
      const result = validateField('weight', 300, { max: 300 });
      expect(result).toBeNull();
    });

    it('validates minLength', () => {
      const result = validateField('password', 'ab', { minLength: 6 });
      expect(result).toBe('Must be at least 6 characters');
    });

    it('validates maxLength', () => {
      const result = validateField('bio', 'a'.repeat(300), { maxLength: 200 });
      expect(result).toBe('Must be at most 200 characters');
    });

    it('validates regex pattern', () => {
      const result = validateField('email', 'invalid', {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      });
      expect(result).toBe('Invalid format');
    });

    it('passes valid pattern', () => {
      const result = validateField('email', 'test@example.com', {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      });
      expect(result).toBeNull();
    });

    it('runs custom validation', () => {
      const rule: ValidationRule = {
        custom: (value) => (value % 2 !== 0 ? 'Must be even' : null),
      };
      expect(validateField('num', 3, rule)).toBe('Must be even');
      expect(validateField('num', 4, rule)).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('returns errors for invalid fields', () => {
      const data = { name: '', age: 5 };
      const rules: ValidationRules = {
        name: { required: true },
        age: { min: 18 },
      };
      const errors = validateForm(data, rules);
      expect(errors.name).toBe('This field is required');
      expect(errors.age).toBe('Must be at least 18');
    });

    it('returns empty object when all fields are valid', () => {
      const data = { name: 'John', age: 25 };
      const rules: ValidationRules = {
        name: { required: true },
        age: { min: 18 },
      };
      const errors = validateForm(data, rules);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('hasErrors', () => {
    it('returns true when errors exist', () => {
      expect(hasErrors({ name: 'Required' })).toBe(true);
    });

    it('returns false when no errors', () => {
      expect(hasErrors({})).toBe(false);
    });
  });
});
