export default async function handler(req, res) {
  const { path, ...query } = req.query;

  if (!path) {
    return res.status(400).json({ error: "path parameter required" });
  }

  // API 경로 조립
  const apiPath = Array.isArray(path) ? path.join("/") : path;
  const url = new URL(`https://apis.data.go.kr/${apiPath}`);

  // 쿼리 파라미터 전달
  for (const [key, val] of Object.entries(query)) {
    if (val) url.searchParams.set(key, String(val));
  }

  try {
    const response = await fetch(url.toString());
    const text = await response.text();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: "Proxy failed", detail: String(error) });
  }
}
