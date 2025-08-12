import { useStore } from '../store/useStore';

export default function ConflictBanner() {
  const conflict = useStore((s) => s.conflict);
  if (!conflict) return null;
  return (
    <div className="fixed top-2 inset-x-0 flex justify-center z-50">
      <div className="bg-amber-500 text-white px-4 py-2 rounded shadow">
        We merged recent changes. <button className="underline ml-2" onClick={() => alert('Show history')}>View diff</button>
      </div>
    </div>
  );
}
