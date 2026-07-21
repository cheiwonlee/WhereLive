// Supabase Edge Function: foods-search
// 배포: supabase functions deploy foods-search
//
// 환경변수 (Supabase 대시보드 → Edge Functions → Secrets):
//   FATSECRET_CLIENT_ID
//   FATSECRET_CLIENT_SECRET
//
// 호출: GET /functions/v1/foods-search?q=김치찌개

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const id = Deno.env.get('FATSECRET_CLIENT_ID')!;
  const secret = Deno.env.get('FATSECRET_CLIENT_SECRET')!;
  const basic = btoa(`${id}:${secret}`);

  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 60000 };
  return cachedToken.token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? '';
    const token = await getToken();

    const apiUrl = new URL('https://platform.fatsecret.com/rest/server.api');
    apiUrl.searchParams.set('method', 'foods.search');
    apiUrl.searchParams.set('search_expression', q);
    apiUrl.searchParams.set('format', 'json');

    const res = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    // FatSecret 응답 → ClearPlate FoodSearchResult 형식 변환
    const foods = (data.foods?.food ?? []).map((f: any) => ({
      id: f.food_id,
      name: f.food_name,
      brand: f.brand_name ?? '',
      servingDescription: f.food_description?.split('-')[0] ?? '1 serving',
      // food_description 에서 영양소 파싱 (예: "Per 100g - Calories: 220kcal | Fat: 5g | Carbs: 30g | Protein: 8g")
      // 정확한 데이터는 food.get 으로 별도 호출 필요
      nutrients: parseDescription(f.food_description ?? ''),
    }));

    return new Response(JSON.stringify(foods), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseDescription(desc: string) {
  const get = (k: string) => {
    const m = desc.match(new RegExp(`${k}:\\s*([0-9.]+)`));
    return m ? parseFloat(m[1]) : 0;
  };
  return {
    calories: get('Calories'),
    carbs: get('Carbs'),
    protein: get('Protein'),
    fat: get('Fat'),
    saturated: 0, poly: 0, mono: 0, trans: 0,
    cholesterol: 0, sodium: 0, fiber: 0, sugar: 0,
  };
}
