import {
  kgToLbs,
  lbsToKg,
  displayWeight,
  getWeightInUnit,
  weightToKg,
  weightUnit,
  cmToFtIn,
  ftInToCm,
  displayHeight,
  heightUnit,
  displayWeightChange,
} from '../units';

describe('units.ts', () => {
  // ── Weight Conversions ──

  describe('kgToLbs', () => {
    it('converts 0 kg to 0 lbs', () => {
      expect(kgToLbs(0)).toBe(0);
    });

    it('converts 1 kg correctly', () => {
      expect(kgToLbs(1)).toBe(2.2);
    });

    it('converts 100 kg correctly', () => {
      expect(kgToLbs(100)).toBe(220.5);
    });
  });

  describe('lbsToKg', () => {
    it('converts 0 lbs to 0 kg', () => {
      expect(lbsToKg(0)).toBe(0);
    });

    it('converts 220 lbs approximately back to 100 kg', () => {
      const result = lbsToKg(220);
      expect(result).toBeCloseTo(99.8, 0);
    });
  });

  describe('displayWeight', () => {
    it('displays metric weight with "kg" suffix', () => {
      expect(displayWeight(75, 'metric')).toBe('75 kg');
    });

    it('displays imperial weight with "lbs" suffix', () => {
      expect(displayWeight(75, 'imperial')).toBe(`${kgToLbs(75)} lbs`);
    });
  });

  describe('getWeightInUnit', () => {
    it('returns kg value for metric', () => {
      expect(getWeightInUnit(80, 'metric')).toBe(80);
    });

    it('returns lbs value for imperial', () => {
      expect(getWeightInUnit(80, 'imperial')).toBe(kgToLbs(80));
    });
  });

  describe('weightToKg', () => {
    it('returns value as-is for metric', () => {
      expect(weightToKg(80, 'metric')).toBe(80);
    });

    it('converts lbs to kg for imperial', () => {
      expect(weightToKg(220, 'imperial')).toBe(lbsToKg(220));
    });
  });

  describe('weightUnit', () => {
    it('returns "kg" for metric', () => {
      expect(weightUnit('metric')).toBe('kg');
    });

    it('returns "lbs" for imperial', () => {
      expect(weightUnit('imperial')).toBe('lbs');
    });
  });

  // ── Height Conversions ──

  describe('cmToFtIn', () => {
    it('converts 180 cm to approximately 5\'11"', () => {
      const result = cmToFtIn(180);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(11);
    });

    it('converts 152.4 cm to exactly 5\'0"', () => {
      const result = cmToFtIn(152.4);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(0);
    });

    it('handles edge case where inches rounds to 12', () => {
      // 182.88 cm = exactly 6'0"
      const result = cmToFtIn(182.88);
      expect(result.feet).toBe(6);
      expect(result.inches).toBe(0);
    });
  });

  describe('ftInToCm', () => {
    it('converts 5\'11" to approximately 180.3 cm', () => {
      expect(ftInToCm(5, 11)).toBe(180.3);
    });

    it('converts 6\'0" to 182.9 cm', () => {
      expect(ftInToCm(6, 0)).toBe(182.9);
    });
  });

  describe('displayHeight', () => {
    it('displays metric height with "cm" suffix', () => {
      expect(displayHeight(175, 'metric')).toBe('175 cm');
    });

    it('displays imperial height in feet and inches', () => {
      const result = displayHeight(180, 'imperial');
      expect(result).toMatch(/^\d+'\d+"$/);
    });
  });

  describe('heightUnit', () => {
    it('returns "cm" for metric', () => {
      expect(heightUnit('metric')).toBe('cm');
    });

    it('returns "ft/in" for imperial', () => {
      expect(heightUnit('imperial')).toBe('ft/in');
    });
  });

  // ── Weight Change ──

  describe('displayWeightChange', () => {
    it('shows positive change with "+" sign', () => {
      const result = displayWeightChange(2, 'metric');
      expect(result).toBe('+2.0 kg');
    });

    it('shows negative change with "-" sign', () => {
      const result = displayWeightChange(-1.5, 'metric');
      expect(result).toBe('-1.5 kg');
    });

    it('shows zero change with no sign', () => {
      const result = displayWeightChange(0, 'metric');
      expect(result).toBe('0.0 kg');
    });

    it('converts units for imperial display', () => {
      const result = displayWeightChange(1, 'imperial');
      expect(result).toContain('lbs');
      expect(result).toMatch(/^\+/);
    });
  });
});
