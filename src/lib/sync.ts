import { supabase } from './supabase';
import { FoodEntry, Gender, Nutrients } from '../types';

type EntryRow = {
  id: string;
  user_id: string;
  date: string;
  slot: string;
  food_name: string;
  servings: number;
  calories: number; carbs: number; protein: number; fat: number;
  saturated: number; unsaturated: number;
  poly: number; mono: number; trans: number;
  cholesterol: number; sodium: number; fiber: number; sugar: number;
  created_at: string;
};

function rowToEntry(r: EntryRow): FoodEntry {
  const nutrients: Nutrients = {
    calories: r.calories, carbs: r.carbs, protein: r.protein, fat: r.fat,
    saturated: r.saturated, unsaturated: r.unsaturated ?? 0,
    poly: r.poly, mono: r.mono, trans: r.trans,
    cholesterol: r.cholesterol, sodium: r.sodium, fiber: r.fiber, sugar: r.sugar,
  };
  return {
    id: r.id,
    name: r.food_name,
    slot: r.slot as FoodEntry['slot'],
    date: r.date,
    servings: Number(r.servings),
    nutrients,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function entryToRow(e: FoodEntry, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    date: e.date,
    slot: e.slot,
    food_name: e.name,
    servings: e.servings,
    ...e.nutrients,
  };
}

export async function fetchEntries(userId: string): Promise<FoodEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function insertEntry(entry: FoodEntry, userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('food_entries').insert(entryToRow(entry, userId));
  if (error) throw error;
}

export async function deleteEntry(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}

export interface ProfileData {
  gender: Gender | null;
  nickname: string | null;
}

export async function fetchProfile(userId: string): Promise<ProfileData> {
  if (!supabase) return { gender: null, nickname: null };
  const { data } = await supabase.from('profiles').select('gender, nickname').eq('id', userId).maybeSingle();
  return {
    gender: (data?.gender as Gender) ?? null,
    nickname: (data?.nickname as string) ?? null,
  };
}

export async function upsertProfile(userId: string, fields: Partial<ProfileData>) {
  if (!supabase) return;
  const update: any = { id: userId };
  if (fields.gender !== undefined) {
    update.gender = fields.gender;
    update.daily_calorie_target = fields.gender === 'male' ? 2600 : 2000;
  }
  if (fields.nickname !== undefined) update.nickname = fields.nickname;

  const { error } = await supabase.from('profiles').upsert(update);
  if (error) throw error;
}

/**
 * 회원 탈퇴: profile + entries 모두 삭제 후 sign out
 * (auth.users 자체는 Supabase admin 권한이 필요해서 client에서 직접 삭제 불가.
 *  하지만 모든 개인 데이터는 RLS cascade로 정리되고, 사용자 입장에서는 완전 탈퇴.)
 */
export async function deleteAccount(userId: string) {
  if (!supabase) return;
  // entries는 profile cascade로 자동 삭제되지만 명시적으로 한 번 더 호출
  await supabase.from('food_entries').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.signOut();
}
