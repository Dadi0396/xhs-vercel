// Vercel Serverless Function - 混合代理 (飞书 + Claude)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: '缺少 url 参数' });

  const decodedUrl = decodeURIComponent(url);

  // 1. 验证是否是允许的域名 (添加 anthropic.com)
  const isFeishu = decodedUrl.startsWith('https://open.feishu.cn') || decodedUrl.startsWith('https://open.larksuite.com');
  const isClaude = decodedUrl.startsWith('https://api.anthropic.com');

  if (!isFeishu && !isClaude) {
    return res.status(403).json({ error: '不允许请求该域名' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    // 2. 逻辑分流
    if (isFeishu) {
      // 飞书：转发前端传来的 Authorization
      if (req.headers.authorization) {
        fetchOptions.headers['Authorization'] = req.headers.authorization;
      }
    } else if (isClaude) {
      // Claude：注入环境变量里的 Key
      fetchOptions.headers['x-api-key'] = process.env.CLAUDE_API_KEY; 
      fetchOptions.headers['anthropic-version'] = '2023-06-01';
    }

    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(decodedUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: '代理失败: ' + error.message });
  }
}
