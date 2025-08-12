import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { upgradeGuestToUser } from '../services/db';

/**
 * useSession returns the current auth session. On first load it creates an
 * anonymous session so the user can start using the app immediately.
 * When the user upgrades with OAuth or email we migrate existing data.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const prevUser = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session) {
        prevUser.current = data.session.user.id;
        setSession(data.session);
      } else {
        const { data: anon } = await supabase.auth.signInAnonymously();
        prevUser.current = anon?.user?.id ?? null;
        setSession(anon.session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      const oldId = prevUser.current;
      setSession(newSession);
      if (oldId && newSession?.user && oldId !== newSession.user.id && !newSession.user.is_anonymous) {
        try {
          await upgradeGuestToUser(newSession.user.id, oldId);
          alert('Your tasks are now synced to your account.');
        } catch (e) {
          console.error('upgradeGuestToUser failed', e);
        }
      }
      prevUser.current = newSession?.user?.id ?? null;
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return session;
}
