import { Navigate } from 'react-router-dom';
import { useCompanion } from '../context/CompanionContext';

export function FosterOnlyRoute({ children }: { children: React.ReactNode }) {
  const { workRole } = useCompanion();
  if (workRole !== 'foster_parent') {
    return <Navigate to="/companion" replace />;
  }
  return children;
}
