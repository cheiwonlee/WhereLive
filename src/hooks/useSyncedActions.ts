import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';
import {
  fetchEntries, fetchProfile, insertEntry, deleteEntry,
  upsertProfile, deleteAccount as deleteAccountSync,
} from '../lib/sync';
import { FoodEntry, Gender } from '../types';

export function useHydrateFromCloud() {
  const hydrate = useAppStore((s) => s.hydrate);
  const { user, enabled } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;
    (async () => {
      try {
        const [entries, profile] = await Promise.all([
          fetchEntries(user.id),
          fetchProfile(user.id),
        ]);
        hydrate(entries, profile.gender, profile.nickname);
      } catch (e) {
        console.error('Cloud hydration failed:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, enabled]);
}

export function useSyncedActions() {
  const addEntryLocal = useAppStore((s) => s.addEntry);
  const addEntriesLocal = useAppStore((s) => s.addEntries);
  const removeEntryLocal = useAppStore((s) => s.removeEntry);
  const setGenderLocal = useAppStore((s) => s.setGender);
  const setNicknameLocal = useAppStore((s) => s.setNickname);
  const reset = useAppStore((s) => s.reset);
  const { user, enabled } = useAuth();

  return {
    addEntry: async (e: FoodEntry) => {
      addEntryLocal(e);
      if (enabled && user) {
        try { await insertEntry(e, user.id); }
        catch (err) { console.error('Cloud insert failed:', err); }
      }
    },
    addEntries: async (es: FoodEntry[]) => {
      addEntriesLocal(es);
      if (enabled && user) {
        for (const e of es) {
          try { await insertEntry(e, user.id); }
          catch (err) { console.error('Cloud insert failed:', err); }
        }
      }
    },
    removeEntry: async (id: string) => {
      removeEntryLocal(id);
      if (enabled && user) {
        try { await deleteEntry(id); }
        catch (err) { console.error('Cloud delete failed:', err); }
      }
    },
    setGender: async (g: Gender) => {
      setGenderLocal(g);
      if (enabled && user) {
        try { await upsertProfile(user.id, { gender: g }); }
        catch (err) { console.error('Profile upsert failed:', err); }
      }
    },
    setNickname: async (n: string) => {
      setNicknameLocal(n);
      if (enabled && user) {
        try { await upsertProfile(user.id, { nickname: n }); }
        catch (err) { console.error('Nickname upsert failed:', err); }
      }
    },
    deleteAccount: async () => {
      if (enabled && user) {
        try { await deleteAccountSync(user.id); }
        catch (err) { console.error('Account deletion failed:', err); }
      }
      reset();
    },
  };
}
