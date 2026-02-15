/**
 * Unit conversion utilities
 * Internal storage is always metric (kg, cm).
 * Display converts to user's preferred unit system.
 */

export type UnitSystem = 'metric' | 'imperial';

// ── Weight Conversions ──

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

/** Convert kg to lbs */
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

/** Convert lbs to kg */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
}

/** Display weight in user's unit system */
export function displayWeight(kg: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

/** Get weight value in user's unit system (number only) */
export function getWeightInUnit(kg: number, unit: UnitSystem): number {
  return unit === 'imperial' ? kgToLbs(kg) : kg;
}

/** Convert user input weight to kg for storage */
export function weightToKg(value: number, unit: UnitSystem): number {
  return unit === 'imperial' ? lbsToKg(value) : value;
}

/** Get the weight unit label */
export function weightUnit(unit: UnitSystem): string {
  return unit === 'imperial' ? 'lbs' : 'kg';
}

// ── Height Conversions ──

/** Convert cm to { feet, inches } */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  // If inches rounds to 12, bump feet
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/** Convert feet + inches to cm */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54 * 10) / 10;
}

/** Display height in user's unit system */
export function displayHeight(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
}

/** Get the height unit label */
export function heightUnit(unit: UnitSystem): string {
  return unit === 'imperial' ? 'ft/in' : 'cm';
}

// ── Change / Difference Display ──

/** Display a weight change with sign */
export function displayWeightChange(kgChange: number, unit: UnitSystem): string {
  const val = getWeightInUnit(Math.abs(kgChange), unit);
  const sign = kgChange > 0 ? '+' : kgChange < 0 ? '-' : '';
  return `${sign}${val.toFixed(1)} ${weightUnit(unit)}`;
}
