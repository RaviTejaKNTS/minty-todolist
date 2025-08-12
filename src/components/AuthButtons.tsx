import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthButtons() {
  const [email, setEmail] = useState('');

  const signInWithEmail = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert('Check your email for the login link.');
  };

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth' },
    });

  const signInWithApple = () =>
    supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin + '/auth' },
    });

  const continueAsGuest = async () => {
    await supabase.auth.signInAnonymously();
  };

  return (
    <div className="space-y-2">
      <button onClick={signInWithGoogle} className="px-4 py-2 rounded bg-sky-600 text-white w-full">
        Continue with Google
      </button>
      <button onClick={signInWithApple} className="px-4 py-2 rounded bg-black text-white w-full">
        Continue with Apple
      </button>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1 border px-2 py-1 rounded"
        />
        <button onClick={signInWithEmail} className="px-3 py-1 rounded border">
          Magic Link
        </button>
      </div>
      <button onClick={continueAsGuest} className="px-4 py-2 rounded border w-full">
        Continue as Guest
      </button>
    </div>
  );
}
