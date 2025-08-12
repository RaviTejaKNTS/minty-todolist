import Board from './Board';
import ConflictBanner from './components/ConflictBanner';
import { useSession } from './hooks/useSession';

export default function App() {
  const session = useSession();
  if (session === undefined) return null;
  return (
    <>
      <Board />
      <ConflictBanner />
    </>
  );
}
