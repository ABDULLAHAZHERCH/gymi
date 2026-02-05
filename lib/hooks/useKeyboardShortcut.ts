import { useEffect } from 'react';

type KeyCombo = string; // e.g., "ctrl+s", "escape", "enter"
type Handler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: KeyCombo;
  handler: Handler;
  description?: string;
}

export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, handler }) => {
        const combo = key.toLowerCase();
        const parts = combo.split('+');
        
        let matches = true;

        // Check modifiers
        if (parts.includes('ctrl') && !event.ctrlKey) matches = false;
        if (parts.includes('shift') && !event.shiftKey) matches = false;
        if (parts.includes('alt') && !event.altKey) matches = false;
        if (parts.includes('meta') && !event.metaKey) matches = false;

        // Check main key
        const mainKey = parts[parts.length - 1];
        if (event.key.toLowerCase() !== mainKey) matches = false;

        if (matches) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook for common form shortcuts
export function useFormShortcuts({
  onSubmit,
  onCancel,
}: {
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  useKeyboardShortcut([
    ...(onSubmit
      ? [
          {
            key: 'ctrl+enter',
            handler: () => onSubmit(),
            description: 'Submit form',
          },
        ]
      : []),
    ...(onCancel
      ? [
          {
            key: 'escape',
            handler: () => onCancel(),
            description: 'Cancel',
          },
        ]
      : []),
  ]);
}
