import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './admin/components/layout/AdminLayout';

const ExperienceApp = lazy(() => import('./experience/ExperienceApp'));
const CompanionApp = lazy(() => import('./companion/CompanionApp'));
const DashboardPage = lazy(() =>
  import('./admin/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const CatsPage = lazy(() =>
  import('./admin/pages/CatsPage').then((module) => ({ default: module.CatsPage })),
);
const AddCatPage = lazy(() =>
  import('./admin/pages/AddCatPage').then((module) => ({ default: module.AddCatPage })),
);
const CatProfilePage = lazy(() =>
  import('./admin/pages/CatProfilePage').then((module) => ({ default: module.CatProfilePage })),
);
const CaregiversPage = lazy(() =>
  import('./admin/pages/CaregiversPage').then((module) => ({ default: module.CaregiversPage })),
);
const CaregiverDetailPage = lazy(() =>
  import('./admin/pages/CaregiverDetailPage').then((module) => ({ default: module.CaregiverDetailPage })),
);
const AddCaregiverPage = lazy(() =>
  import('./admin/pages/AddCaregiverPage').then((module) => ({ default: module.AddCaregiverPage })),
);
const AdoptionPage = lazy(() =>
  import('./admin/pages/AdoptionPage').then((module) => ({ default: module.AdoptionPage })),
);
const AdoptionDetailPage = lazy(() =>
  import('./admin/pages/AdoptionDetailPage').then((module) => ({ default: module.AdoptionDetailPage })),
);
const DonorsPage = lazy(() =>
  import('./admin/pages/DonorsPage').then((module) => ({ default: module.DonorsPage })),
);
const DonorDetailPage = lazy(() =>
  import('./admin/pages/DonorDetailPage').then((module) => ({ default: module.DonorDetailPage })),
);
const AddDonorPage = lazy(() =>
  import('./admin/pages/AddDonorPage').then((module) => ({ default: module.AddDonorPage })),
);
const TodayTasksPage = lazy(() =>
  import('./admin/pages/TodayTasksPage').then((module) => ({ default: module.TodayTasksPage })),
);

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading {label}…
    </div>
  );
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback label="page" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteFallback label="experience" />}>
              <ExperienceApp />
            </Suspense>
          }
        />
        <Route
          path="/companion/*"
          element={
            <Suspense fallback={<RouteFallback label="companion" />}>
              <CompanionApp />
            </Suspense>
          }
        />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage><DashboardPage /></AdminPage>} />
          <Route path="tasks" element={<AdminPage><TodayTasksPage /></AdminPage>} />
          <Route path="cats" element={<AdminPage><CatsPage /></AdminPage>} />
          <Route path="cats/new" element={<AdminPage><AddCatPage /></AdminPage>} />
          <Route path="cats/:id" element={<AdminPage><CatProfilePage /></AdminPage>} />
          <Route path="caregivers" element={<AdminPage><CaregiversPage /></AdminPage>} />
          <Route path="caregivers/new" element={<AdminPage><AddCaregiverPage /></AdminPage>} />
          <Route path="caregivers/:id" element={<AdminPage><CaregiverDetailPage /></AdminPage>} />
          <Route path="adoption" element={<AdminPage><AdoptionPage /></AdminPage>} />
          <Route path="adoption/:id" element={<AdminPage><AdoptionDetailPage /></AdminPage>} />
          <Route path="donors" element={<AdminPage><DonorsPage /></AdminPage>} />
          <Route path="donors/new" element={<AdminPage><AddDonorPage /></AdminPage>} />
          <Route path="donors/:id" element={<AdminPage><DonorDetailPage /></AdminPage>} />
          <Route path="messages" element={<Navigate to="/admin/caregivers" replace />} />
          <Route path="reports" element={<Navigate to="/admin/tasks" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
