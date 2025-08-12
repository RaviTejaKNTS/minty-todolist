import { useState } from 'react';
import { useSession } from '../hooks/useSession';
import AuthButtons from './AuthButtons';
import { supabase } from '../supabaseClient';

export default function ProfileMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);
  const avatar = session?.user?.user_metadata?.avatar_url as string | undefined;

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="h-8 w-8 rounded-full overflow-hidden border"
      >
        {avatar ? (
          <img src={avatar} alt="profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white p-3 shadow-lg z-50">
          {session && !session.user.is_anonymous ? (
            <button
              onClick={signOut}
              className="w-full text-left px-2 py-1 rounded hover:bg-gray-100"
            >
              Sign out
            </button>
          ) : (
            <AuthButtons />
          )}
        </div>
      )}
    </div>
  );
}
