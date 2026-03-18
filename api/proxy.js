// Vercel Serverless Function - 混合代理 (支持飞书 + Gemini)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '缺少 url 参数' });

  const decodedUrl = decodeURIComponent(url);

  // 1. 验证域名权限
  const isFeishu = decodedUrl.startsWith('https://open.feishu.cn') || decodedUrl.startsWith('https://open.larksuite.com');
  const isGemini = decodedUrl.startsWith('https://generativelanguage.googleapis.com');

  if (!isFeishu && !isGemini) {
    return res.status(403).json({ error: '安全拦截：不允许代理该域名（' + decodedUrl + '）' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (isFeishu) {
      if (req.headers.authorization) fetchOptions.headers['Authorization'] = req.headers.authorization;
    } else if (isGemini) {
      // 自动注入 Vercel 环境变量里的 Gemini API Key
      fetchOptions.headers['x-goog-api-key'] = process.env.GEMINI_API_KEY; 
    }

    if (req.method !== 'GET' && req.body) fetchOptions.body = JSON.stringify(req.body);

    const response = await fetch(decodedUrl, fetchOptions);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: '代理中转失败: ' + error.message });
  }
}
