import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Cat } from '../types/cat';

interface ShelterContextValue {
  selectedCat: Cat | null;
  isInShelter: boolean;
  showAdoptionModal: boolean;
  showSupportModal: boolean;
  selectCat: (cat: Cat | null) => void;
  enterShelter: () => void;
  exitShelter: () => void;
  openAdoption: () => void;
  closeAdoption: () => void;
  openSupport: () => void;
  closeSupport: () => void;
}

const ShelterContext = createContext<ShelterContextValue | null>(null);

export function ShelterProvider({ children }: { children: ReactNode }) {
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [isInShelter, setIsInShelter] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const selectCat = useCallback((cat: Cat | null) => setSelectedCat(cat), []);
  const enterShelter = useCallback(() => setIsInShelter(true), []);
  const exitShelter = useCallback(() => {
    setIsInShelter(false);
    setSelectedCat(null);
  }, []);
  const openAdoption = useCallback(() => setShowAdoptionModal(true), []);
  const closeAdoption = useCallback(() => setShowAdoptionModal(false), []);
  const openSupport = useCallback(() => setShowSupportModal(true), []);
  const closeSupport = useCallback(() => setShowSupportModal(false), []);

  return (
    <ShelterContext.Provider
      value={{
        selectedCat,
        isInShelter,
        showAdoptionModal,
        showSupportModal,
        selectCat,
        enterShelter,
        exitShelter,
        openAdoption,
        closeAdoption,
        openSupport,
        closeSupport,
      }}
    >
      {children}
    </ShelterContext.Provider>
  );
}

export function useShelter() {
  const ctx = useContext(ShelterContext);
  if (!ctx) throw new Error('useShelter must be used within ShelterProvider');
  return ctx;
}
