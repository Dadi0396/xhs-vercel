export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '缺少url参数' });

  const decodedUrl = decodeURIComponent(url);
  if (!decodedUrl.startsWith('https://open.feishu.cn') && 
      !decodedUrl.startsWith('https://open.larksuite.com')) {
    return res.status(403).json({ error: '只允许飞书API请求' });
  }

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }
    if (req.method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(decodedUrl, options);
    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return res.status(response.status).json(json);
    } catch {
      return res.status(500).json({ 
        error: '飞书返回了非JSON内容', 
        raw: text.slice(0, 200) 
      });
    }
  } catch (error) {
    return res.status(500).json({ error: '代理请求失败: ' + error.message });
  }
}
