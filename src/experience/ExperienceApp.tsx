import { useCallback, useMemo, useState } from 'react';
import { ShelterProvider, useShelter } from '../context/ShelterContext';
import { mapCatsToScene } from './data/sceneCats';
import { LandingPage } from '../components/ui/LandingPage';
import { IllustratedShelter } from './components/IllustratedShelter';
import { StoryCard } from './components/StoryCard';
import { ExperienceHeader } from './components/ExperienceHeader';
import { AdoptionModal } from '../components/ui/AdoptionModal';
import { SupportModal } from '../components/ui/SupportModal';
import { ApplicationStatusModal } from '../components/ui/ApplicationStatusModal';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLiveCats } from '../hooks/useLiveCats';

function ExperienceContent() {
  useDocumentMeta('Adopter flow', '🐱');
  const liveCats = useLiveCats();
  const {
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
  } = useShelter();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusPrefill, setStatusPrefill] = useState({ name: '', email: '' });

  const resolvedSelectedCat = useMemo(() => {
    if (!selectedCat) return null;
    return liveCats.find((cat) => cat.id === selectedCat.id) ?? selectedCat;
  }, [selectedCat, liveCats]);

  const shelterCats = useMemo(
    () => mapCatsToScene(liveCats).filter((sceneCat) => sceneCat.visible),
    [liveCats],
  );

  const handleReturnHome = useCallback(() => {
    exitShelter();
    selectCat(null);
    closeAdoption();
    closeSupport();
    setShowStatusModal(false);
  }, [exitShelter, selectCat, closeAdoption, closeSupport]);

  const handleMeetMoreCats = useCallback(() => {
    closeAdoption();
    closeSupport();
    enterShelter();
  }, [closeAdoption, closeSupport, enterShelter]);

  const handleOpenAdoptionFromLanding = useCallback(() => {
    selectCat(null);
    openAdoption();
  }, [selectCat, openAdoption]);

  const handleOpenStatus = useCallback((name = '', email = '') => {
    setStatusPrefill({ name, email });
    setShowStatusModal(true);
  }, []);

  const handleSelectCat = useCallback(
    (cat: Parameters<typeof selectCat>[0]) => {
      if (!cat) {
        selectCat(null);
        return;
      }
      const live = liveCats.find((item) => item.id === cat.id) ?? cat;
      selectCat(live);
    },
    [liveCats, selectCat],
  );

  const modals = (
    <>
      <AdoptionModal
        cat={resolvedSelectedCat}
        isOpen={showAdoptionModal}
        onClose={closeAdoption}
        onReturnHome={handleReturnHome}
        onMeetMoreCats={handleMeetMoreCats}
        onTrackApplication={handleOpenStatus}
      />
      <SupportModal
        cat={resolvedSelectedCat}
        isOpen={showSupportModal}
        onClose={closeSupport}
        onReturnHome={handleReturnHome}
        onMeetMoreCats={handleMeetMoreCats}
      />
      <ApplicationStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        initialName={statusPrefill.name}
        initialEmail={statusPrefill.email}
      />
    </>
  );

  if (!isInShelter) {
    return (
      <>
        <LandingPage
          onEnterShelter={enterShelter}
          onOpenAdoption={handleOpenAdoptionFromLanding}
          onOpenSupport={openSupport}
          onTrackApplication={() => handleOpenStatus()}
        />

        <StoryCard
          cat={resolvedSelectedCat}
          onClose={() => selectCat(null)}
          onAdopt={openAdoption}
          onSupport={openSupport}
        />

        {modals}
      </>
    );
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <IllustratedShelter
        cats={shelterCats}
        selectedCatId={resolvedSelectedCat?.id ?? null}
        onSelectCat={handleSelectCat}
        onDeselect={() => selectCat(null)}
      />

      <ExperienceHeader onExit={exitShelter} onTrackApplication={() => handleOpenStatus()} />

      <StoryCard
        cat={resolvedSelectedCat}
        onClose={() => selectCat(null)}
        onAdopt={openAdoption}
        onSupport={openSupport}
      />

      {modals}
    </div>
  );
}

export default function ExperienceApp() {
  return (
    <div className="experience-theme min-h-dvh">
      <ShelterProvider>
        <ExperienceContent />
      </ShelterProvider>
    </div>
  );
}
