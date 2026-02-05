'use client';

import { useState, useEffect } from 'react';
import { Plus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { addMeal } from '@/lib/meals';
import {
  getMealTemplates,
  addMealTemplate,
  updateMealTemplate,
  deleteMealTemplate,
  MealTemplate,
  templateToMeal,
} from '@/lib/mealTemplates';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import MealTemplateCard from '@/components/features/MealTemplateCard';
import MealTemplateForm from '@/components/features/MealTemplateForm';

export default function TemplatesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTemplates = async () => {
      try {
        const data = await getMealTemplates(user.uid);
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        showToast('Failed to load templates', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [user]);

  const handleAddTemplate = async (
    data: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const id = await addMealTemplate(user.uid, data);
      const newTemplate: MealTemplate = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTemplates([newTemplate, ...templates]);
      setIsModalOpen(false);
      showToast('Template created successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding template:', error);
      showToast(error.message || 'Failed to create template', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTemplate = async (
    data: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !editingTemplate) return;

    setFormLoading(true);
    try {
      await updateMealTemplate(user.uid, editingTemplate.id, data);
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...data, updatedAt: new Date() }
            : t
        )
      );
      setIsModalOpen(false);
      setEditingTemplate(null);
      showToast('Template updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating template:', error);
      showToast(error.message || 'Failed to update template', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteMealTemplate(user.uid, templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      showToast('Template deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      showToast(error.message || 'Failed to delete template', 'error');
    }
  };

  const handleUseTemplate = async (template: MealTemplate) => {
    if (!user) return;

    try {
      const mealData = templateToMeal(template);
      await addMeal(user.uid, mealData);
      showToast(`Added "${template.name}" to today's meals!`, 'success');
    } catch (error: any) {
      console.error('Error using template:', error);
      showToast(error.message || 'Failed to add meal', 'error');
    }
  };

  const handleEditTemplate = (template: MealTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <AppLayout title="Meal Templates">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              Meal Templates
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Save frequent meals for quick logging
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 items-center gap-2 rounded-full bg-[color:var(--foreground)] px-6 text-sm font-semibold text-[color:var(--background)]"
          >
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full"></div>
          </div>
        ) : templates.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <BookmarkCheck className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-4 text-lg font-medium text-[color:var(--foreground)]">
              No templates yet
            </h3>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              Create your first meal template to quickly log repeated meals
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--foreground)] text-[color:var(--background)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <MealTemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <MealTemplateForm
          onSubmit={editingTemplate ? handleUpdateTemplate : handleAddTemplate}
          onCancel={handleCloseModal}
          initialData={editingTemplate || undefined}
          isLoading={formLoading}
        />
      </Modal>
    </AppLayout>
  );
}
