import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getErrorMessage } from './utils/errorMessages';

export interface MealTemplate {
  name: string;
  items: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add a new meal template
 */
export async function addMealTemplate(
  uid: string,
  data: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const templatesRef = collection(db, 'users', uid, 'mealTemplates');
    const docRef = await addDoc(templatesRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding meal template:', error);
    throw new Error(getErrorMessage(error, 'Failed to add meal template'));
  }
}

/**
 * Get all meal templates for a user
 */
export async function getMealTemplates(uid: string): Promise<MealTemplate[]> {
  try {
    const templatesRef = collection(db, 'users', uid, 'mealTemplates');
    const q = query(templatesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        items: data.items,
        mealType: data.mealType,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (error: any) {
    console.error('Error fetching meal templates:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch meal templates'));
  }
}

/**
 * Get meal templates by type
 */
export async function getMealTemplatesByType(
  uid: string,
  mealType: MealTemplate['mealType']
): Promise<MealTemplate[]> {
  const templates = await getMealTemplates(uid);
  return templates.filter((t) => t.mealType === mealType);
}

/**
 * Get a single meal template
 */
export async function getMealTemplate(uid: string, templateId: string): Promise<MealTemplate> {
  try {
    const templateRef = doc(db, 'users', uid, 'mealTemplates', templateId);
    const snapshot = await getDoc(templateRef);

    if (!snapshot.exists()) {
      throw new Error('Meal template not found');
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      items: data.items,
      mealType: data.mealType,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      notes: data.notes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error: any) {
    console.error('Error fetching meal template:', error);
    throw new Error(getErrorMessage(error, 'Failed to fetch meal template'));
  }
}

/**
 * Update a meal template
 */
export async function updateMealTemplate(
  uid: string,
  templateId: string,
  updates: Partial<Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const templateRef = doc(db, 'users', uid, 'mealTemplates', templateId);
    await updateDoc(templateRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error updating meal template:', error);
    throw new Error(getErrorMessage(error, 'Failed to update meal template'));
  }
}

/**
 * Delete a meal template
 */
export async function deleteMealTemplate(uid: string, templateId: string): Promise<void> {
  try {
    const templateRef = doc(db, 'users', uid, 'mealTemplates', templateId);
    await deleteDoc(templateRef);
  } catch (error: any) {
    console.error('Error deleting meal template:', error);
    throw new Error(getErrorMessage(error, 'Failed to delete meal template'));
  }
}

/**
 * Create a meal from a template
 * Returns data ready to be used with addMeal()
 */
export function templateToMeal(
  template: MealTemplate,
  date: Date = new Date()
): Omit<import('@/lib/types/firestore').Meal, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    mealName: template.name,
    items: template.items,
    mealType: template.mealType,
    calories: template.calories,
    protein: template.protein,
    carbs: template.carbs,
    fat: template.fat,
    notes: template.notes,
    date: date,
  };
}
