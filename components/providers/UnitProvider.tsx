'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { UnitSystem } from '@/lib/utils/units';

interface UnitContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => Promise<void>;
  loading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unitSystem, setUnitState] = useState<UnitSystem>('metric');
  const [loading, setLoading] = useState(true);

  // Load unit preference from user profile
  useEffect(() => {
    if (!user) {
      setUnitState('metric');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.unitSystem) {
          setUnitState(profile.unitSystem);
        }
      } catch {
        // Default to metric on error
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Save unit preference to Firestore
  const setUnitSystem = useCallback(
    async (unit: UnitSystem) => {
      setUnitState(unit);
      if (user) {
        try {
          await updateUserProfile(user.uid, { unitSystem: unit });
        } catch (error) {
          console.error('Failed to save unit preference:', error);
        }
      }
    },
    [user]
  );

  return (
    <UnitContext.Provider value={{ unitSystem, setUnitSystem, loading }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within UnitProvider');
  }
  return context;
}
