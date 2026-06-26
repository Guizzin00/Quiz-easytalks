export default function handler(req, res) {
  // Configura CORS para permitir requisições do Canva/Iframely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Identifica a URL base dinamicamente (host atual)
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'quiz-easytalks.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const defaultBaseUrl = `${protocol}://${host}`;

  // Se a rota for solicitada pelo Canva com o parâmetro ?url=
  let targetUrl = req.query.url || defaultBaseUrl;

  // Validação simples de segurança: só permite emoldurar URLs da própria aplicação
  try {
    const parsedTarget = new URL(targetUrl);
    const parsedBase = new URL(defaultBaseUrl);
    
    // Se o host for diferente (e não for subdomínio vercel.app correspondente), força a URL base
    if (parsedTarget.host !== parsedBase.host && !parsedTarget.host.endsWith('.vercel.app')) {
      targetUrl = defaultBaseUrl;
    }
  } catch {
    targetUrl = defaultBaseUrl;
  }

  let title = 'Quiz EasyTalks';
  if (targetUrl.includes('/ranking')) {
    title = 'Quiz EasyTalks - Ranking em Tempo Real';
  }

  // Resposta estruturada conforme especificação oEmbed (tipo 'rich')
  res.status(200).json({
    type: 'rich',
    version: '1.0',
    title: title,
    provider_name: 'Quiz EasyTalks',
    provider_url: defaultBaseUrl,
    width: 800,
    height: 600,
    html: `<iframe src="${targetUrl}" width="100%" height="600" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border: none; border-radius: 8px; width: 100%; height: 600px;"></iframe>`
  });
}
