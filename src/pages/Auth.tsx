import AuthButtons from '../components/AuthButtons';
import { useSession } from '../hooks/useSession';
import { Navigate } from 'react-router-dom';

export default function Auth() {
  const session = useSession();
  if (session === undefined) return null;
  if (session) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthButtons />
    </div>
  );
}
