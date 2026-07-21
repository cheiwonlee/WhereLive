// Vercel Serverless Function: /api/foods-search
// 공공데이터포털 — 식품의약품안전처 식품영양성분DB정보 (FoodNtrCpntDbInfo02)

const BASE_URL =
  'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const q = (req.query.q as string) ?? '';
    if (!q.trim()) return res.status(200).json([]);

    const apiKey = process.env.FOODSAFETY_API_KEY;
    if (!apiKey) throw new Error('FOODSAFETY_API_KEY missing');

    const url =
      `${BASE_URL}?serviceKey=${apiKey}` +
      `&type=json&numOfRows=20&pageNo=1` +
      `&FOOD_NM_KR=${encodeURIComponent(q)}`;

    const apiRes = await fetch(url);
    const rawText = await apiRes.text();

    if (!apiRes.ok) throw new Error(`API failed: ${apiRes.status} - ${rawText.substring(0, 300)}`);
    if (!rawText.trim().startsWith('{') && !rawText.trim().startsWith('['))
      throw new Error(`Non-JSON response: ${rawText.substring(0, 300)}`);

    const data = JSON.parse(rawText);
    const header = data?.header ?? data?.response?.header;
    const body = data?.body ?? data?.response?.body;

    if (header && header.resultCode !== '00') {
      console.log('API error:', header.resultCode, header.resultMsg);
      return res.status(200).json([]);
    }

    let items: any[] = [];
    const rawItems = body?.items;
    if (Array.isArray(rawItems)) items = rawItems;
    else if (rawItems?.item)
      items = Array.isArray(rawItems.item) ? rawItems.item : [rawItems.item];

    const num = (v: any) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };

    const parseServing = (s: string | undefined) => {
      if (!s) return { size: 100, unit: 'g' };
      const m = String(s).match(/([\d.]+)\s*([a-zA-Z가-힣]*)/);
      if (!m) return { size: 100, unit: 'g' };
      return { size: parseFloat(m[1]) || 100, unit: m[2] || 'g' };
    };

    const foods = items.map((r: any, i: number) => {
      const name = r.FOOD_NM_KR || r.DESC_KOR || '알 수 없음';
      const maker = r.MAKER_NM || r.MAKER_NAME || r.SELLER_MANUFAC_NM || '';
      const category = r.FOOD_CAT1_NM || r.DB_GRP_NM || '';
      const { size, unit } = parseServing(r.SERVING_SIZE);

      const fat = num(r.AMT_NUM4);
      const saturated = num(r.AMT_NUM23);
      const trans = num(r.AMT_NUM24);
      // 불포화지방 = 총지방 - 포화 - 트랜스 (수학적으로 정확)
      const unsaturated = Math.max(0, fat - saturated - trans);

      return {
        id: r.FOOD_CD || `${i}-${name}`,
        name,
        brand: maker || category,
        category, // 1인분 단위 추정용 (밥류, 면류, 국류 등)
        servingDescription: `${size}${unit}`,
        nutrients: {
          calories: num(r.AMT_NUM1),
          protein: num(r.AMT_NUM3),
          fat,
          carbs: num(r.AMT_NUM6),
          sugar: num(r.AMT_NUM7),
          fiber: num(r.AMT_NUM8),
          sodium: num(r.AMT_NUM13),
          cholesterol: num(r.AMT_NUM22),
          saturated,
          trans,
          unsaturated,
          // legacy fields
          poly: 0,
          mono: 0,
        },
      };
    });

    res.status(200).json(foods);
  } catch (err: any) {
    console.error('foods-search error:', err);
    res.status(500).json({ error: String(err?.message ?? err) });
  }
}
