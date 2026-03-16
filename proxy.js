// Vercel Serverless Function - 飞书API代理
// 解决浏览器CORS问题，所有飞书API请求通过此服务器转发

export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 从请求中获取目标URL
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: '缺少 url 参数' });
  }

  // 安全检查：只允许转发飞书API请求
  const decodedUrl = decodeURIComponent(url);
  if (!decodedUrl.startsWith('https://open.feishu.cn') && !decodedUrl.startsWith('https://open.larksuite.com')) {
    return res.status(403).json({ error: '只允许转发飞书API请求' });
  }

  try {
    // 转发请求到飞书
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 转发Authorization头
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    // 转发请求体
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(decodedUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: '代理请求失败: ' + error.message });
  }
}
