import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CompanionProvider } from './context/CompanionContext';
import { MobileShell } from './components/MobileShell';
import { FosterOnlyRoute } from './components/FosterOnlyRoute';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const TodayScreen = lazy(() =>
  import('./screens/TodayScreen').then((module) => ({ default: module.TodayScreen })),
);
const TaskDetailScreen = lazy(() =>
  import('./screens/TaskDetailScreen').then((module) => ({ default: module.TaskDetailScreen })),
);
const CatProfileScreen = lazy(() =>
  import('./screens/CatProfileScreen').then((module) => ({ default: module.CatProfileScreen })),
);
const UpdateScreen = lazy(() =>
  import('./screens/UpdateScreen').then((module) => ({ default: module.UpdateScreen })),
);
const MyCatsScreen = lazy(() =>
  import('./screens/MyCatsScreen').then((module) => ({ default: module.MyCatsScreen })),
);
const MessagesScreen = lazy(() =>
  import('./screens/MessagesScreen').then((module) => ({ default: module.MessagesScreen })),
);
const AddCatScreen = lazy(() =>
  import('./screens/AddCatScreen').then((module) => ({ default: module.AddCatScreen })),
);
const ImpactScreen = lazy(() =>
  import('./screens/ImpactScreen').then((module) => ({ default: module.ImpactScreen })),
);
const ProfileScreen = lazy(() =>
  import('./screens/ProfileScreen').then((module) => ({ default: module.ProfileScreen })),
);
const FosterApplyScreen = lazy(() =>
  import('./screens/FosterApplyScreen').then((module) => ({ default: module.FosterApplyScreen })),
);
const FosterMatchScreen = lazy(() =>
  import('./screens/FosterMatchScreen').then((module) => ({ default: module.FosterMatchScreen })),
);
const ShelterCatsScreen = lazy(() =>
  import('./screens/ShelterCatsScreen').then((module) => ({ default: module.ShelterCatsScreen })),
);

function ScreenFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

function LazyScreen({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ScreenFallback />}>{children}</Suspense>;
}

export default function CompanionApp() {
  useDocumentMeta('Caregiver app', '🐾', 'companion');
  return (
    <CompanionProvider>
      <Routes>
        <Route element={<MobileShell />}>
          <Route index element={<LazyScreen><TodayScreen /></LazyScreen>} />
          <Route
            path="my-cats"
            element={
              <FosterOnlyRoute>
                <LazyScreen>
                  <MyCatsScreen />
                </LazyScreen>
              </FosterOnlyRoute>
            }
          />
          <Route path="messages" element={<LazyScreen><MessagesScreen /></LazyScreen>} />
          <Route path="impact" element={<LazyScreen><ImpactScreen /></LazyScreen>} />
          <Route path="profile" element={<LazyScreen><ProfileScreen /></LazyScreen>} />
          <Route path="shelter-cats" element={<LazyScreen><ShelterCatsScreen /></LazyScreen>} />
          <Route
            path="foster/apply"
            element={
              <FosterOnlyRoute>
                <LazyScreen>
                  <FosterApplyScreen />
                </LazyScreen>
              </FosterOnlyRoute>
            }
          />
          <Route path="cats/new" element={<LazyScreen><AddCatScreen /></LazyScreen>} />
        </Route>
        <Route
          path="tasks/:id"
          element={
            <MobileShell>
              <LazyScreen>
                <TaskDetailScreen />
              </LazyScreen>
            </MobileShell>
          }
        />
        <Route
          path="foster/matches/:id"
          element={
            <MobileShell>
              <LazyScreen>
                <FosterMatchScreen />
              </LazyScreen>
            </MobileShell>
          }
        />
        <Route
          path="cats/:id"
          element={
            <MobileShell>
              <LazyScreen>
                <CatProfileScreen />
              </LazyScreen>
            </MobileShell>
          }
        />
        <Route
          path="cats/:id/update"
          element={
            <MobileShell>
              <LazyScreen>
                <UpdateScreen />
              </LazyScreen>
            </MobileShell>
          }
        />
        <Route path="*" element={<Navigate to="/companion" replace />} />
      </Routes>
    </CompanionProvider>
  );
}
