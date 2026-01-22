import React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './supabase.client';

type Profile = {
  credits: number;
  role: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  deductCredits: () => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const readProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits, role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return { credits: Number(data?.credits ?? 0), role: String(data?.role ?? 'trial') };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshProfile = React.useCallback(async () => {
    const id = user?.id;
    if (!id) {
      setProfile(null);
      return;
    }
    try {
      setError(null);
      setProfileLoading(true);
      const p = await readProfile(id);
      setProfile(p);
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!supabaseReady) {
        setError('Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to init auth');
        setLoading(false);
      }
    };

    init();

    if (!supabaseReady) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession) setProfile(null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!user?.id) return;
    refreshProfile();
  }, [refreshProfile, user?.id]);

  React.useEffect(() => {
    const id = user?.id;
    if (!id) return;
    if (profile) return;
    let cancelled = false;
    let tries = 0;

    const tick = async () => {
      if (cancelled) return;
      tries += 1;
      try {
        setError(null);
        setProfileLoading(true);
        const p = await readProfile(id);
        if (cancelled) return;
        setProfile(p);
        return;
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
      if (tries >= 5) return;
      setTimeout(tick, 1500);
    };

    setTimeout(tick, 500);
    return () => {
      cancelled = true;
    };
  }, [profile, user?.id]);

  const deductCredits = React.useCallback(async () => {
    if (!supabaseReady) {
      const message = 'Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY';
      setError(message);
      return { ok: false, error: message };
    }
    try {
      setError(null);
      const { data, error } = await supabase.rpc('deduct_credits');
      if (error) {
        setError(error.message);
        return { ok: false, error: error.message };
      }
      const row = Array.isArray(data) ? data[0] : data;
      const credits = Number(row?.credits ?? NaN);
      const role = String(row?.role ?? '');
      if (!Number.isFinite(credits)) return { ok: false, error: 'Invalid deduct_credits response' };
      setProfile(prev => ({ credits, role: role || prev?.role || 'trial' }));
      return { ok: true };
    } catch (e: any) {
      const message = e?.message || 'deduct_credits failed';
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    error,
    refreshProfile,
    deductCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
