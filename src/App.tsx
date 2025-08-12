import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Board from './Board';
import ConflictBanner from './components/ConflictBanner';
import { useSession } from './hooks/useSession';

export default function App() {
  const session = useSession();
  if (session === undefined) return null;
  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Board />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConflictBanner />
    </>
  );
}
