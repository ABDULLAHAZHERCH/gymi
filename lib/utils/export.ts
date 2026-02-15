import { Workout, Meal, UserProfile } from '@/lib/types/firestore';
import { Goal } from '@/lib/types/firestore';
import { WeightLog } from '@/lib/types/firestore';
import { UnitSystem, weightUnit, getWeightInUnit } from '@/lib/utils/units';

/**
 * Export data types
 */
export interface ExportData {
  version: string;
  exportDate: string;
  user: {
    name: string;
    goal: string;
  };
  workouts: Workout[];
  meals: Meal[];
  goals?: Goal[];
  weightLogs?: WeightLog[];
}

/**
 * Convert data to CSV format
 */
export function convertWorkoutsToCSV(workouts: Workout[], unitSystem: UnitSystem = 'metric'): string {
  const wu = weightUnit(unitSystem);
  const headers = ['Date', 'Exercise', 'Sets', 'Reps', `Weight (${wu})`, 'Duration (min)', 'Notes'];
  const rows = workouts.map((w) => [
    new Date(w.date).toLocaleString(),
    w.exercise,
    w.sets.toString(),
    w.reps.toString(),
    getWeightInUnit(w.weight, unitSystem).toString(),
    w.duration?.toString() || '',
    w.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Convert meals to CSV format
 */
export function convertMealsToCSV(meals: Meal[]): string {
  const headers = [
    'Date',
    'Meal Name',
    'Type',
    'Items',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Notes',
  ];
  const rows = meals.map((m) => [
    new Date(m.date).toLocaleString(),
    m.mealName,
    m.mealType,
    m.items,
    m.calories.toString(),
    m.protein?.toString() || '',
    m.carbs?.toString() || '',
    m.fat?.toString() || '',
    m.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Convert weight logs to CSV format
 */
export function convertWeightLogsToCSV(logs: WeightLog[], unitSystem: UnitSystem = 'metric'): string {
  const wu = weightUnit(unitSystem);
  const headers = ['Date', `Weight (${wu})`, 'Notes'];
  const rows = logs.map((log) => [
    new Date(log.date).toLocaleString(),
    getWeightInUnit(log.weight, unitSystem).toString(),
    log.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export all data as JSON
 */
export function exportDataAsJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download file to user's device
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export workouts as CSV
 */
export function exportWorkoutsCSV(workouts: Workout[], unitSystem: UnitSystem = 'metric'): void {
  const csv = convertWorkoutsToCSV(workouts, unitSystem);
  const filename = `gymi-workouts-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export meals as CSV
 */
export function exportMealsCSV(meals: Meal[]): void {
  const csv = convertMealsToCSV(meals);
  const filename = `gymi-meals-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export weight logs as CSV
 */
export function exportWeightLogsCSV(logs: WeightLog[], unitSystem: UnitSystem = 'metric'): void {
  const csv = convertWeightLogsToCSV(logs, unitSystem);
  const filename = `gymi-weight-logs-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export all data as JSON backup
 */
export function exportAllDataJSON(data: ExportData): void {
  const json = exportDataAsJSON(data);
  const filename = `gymi-backup-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Parse CSV file
 */
export async function parseCSVFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const data = lines.map((line) => {
        // Handle quoted fields
        const regex = /"([^"]*)"|([^,]+)/g;
        const fields: string[] = [];
        let match;

        while ((match = regex.exec(line)) !== null) {
          fields.push(match[1] || match[2] || '');
        }

        return fields;
      });

      resolve(data);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse JSON file
 */
export async function parseJSONFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ExportData;

        // Validate structure
        if (!data.version || !data.workouts || !data.meals) {
          reject(new Error('Invalid backup file format'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validate workout CSV data
 */
export function validateWorkoutCSV(data: string[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const headers = data[0];

  // Check required headers
  const requiredHeaders = ['Date', 'Exercise', 'Sets', 'Reps', 'Weight (kg)'];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Missing required column: ${header}`);
    }
  }

  // Validate data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 5) {
      errors.push(`Row ${i + 1}: Insufficient data`);
      continue;
    }

    // Validate date
    if (!row[0] || isNaN(new Date(row[0]).getTime())) {
      errors.push(`Row ${i + 1}: Invalid date`);
    }

    // Validate exercise name
    if (!row[1] || row[1].trim().length === 0) {
      errors.push(`Row ${i + 1}: Missing exercise name`);
    }

    // Validate numbers
    if (isNaN(parseInt(row[2])) || parseInt(row[2]) <= 0) {
      errors.push(`Row ${i + 1}: Invalid sets value`);
    }
    if (isNaN(parseInt(row[3])) || parseInt(row[3]) <= 0) {
      errors.push(`Row ${i + 1}: Invalid reps value`);
    }
    if (isNaN(parseFloat(row[4])) || parseFloat(row[4]) < 0) {
      errors.push(`Row ${i + 1}: Invalid weight value`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate meal CSV data
 */
export function validateMealCSV(data: string[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const headers = data[0];

  // Check required headers
  const requiredHeaders = ['Date', 'Meal Name', 'Type', 'Items', 'Calories'];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      errors.push(`Missing required column: ${header}`);
    }
  }

  // Validate data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 5) {
      errors.push(`Row ${i + 1}: Insufficient data`);
      continue;
    }

    // Validate date
    if (!row[0] || isNaN(new Date(row[0]).getTime())) {
      errors.push(`Row ${i + 1}: Invalid date`);
    }

    // Validate calories
    if (isNaN(parseInt(row[4])) || parseInt(row[4]) <= 0) {
      errors.push(`Row ${i + 1}: Invalid calories value`);
    }
  }

  return { valid: errors.length === 0, errors };
}
