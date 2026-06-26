import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Tenta localizar o index.html gerado pelo build (dist) ou o arquivo original (local dev)
  let htmlPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(process.cwd(), 'index.html');
  }

  try {
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Determina o host e protocolo
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'quiz-easytalks.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Obtém o path original passado pela regra de rewrite e adicionais
    const originalPath = req.query.path || '/ranking';
    
    // Repassa os outros query parameters (ex. cache buster) para o link oEmbed
    const urlObj = new URL(originalPath, baseUrl);
    for (const [key, val] of Object.entries(req.query)) {
      if (key !== 'path') {
        urlObj.searchParams.set(key, val);
      }
    }
    const canonicalUrl = urlObj.toString();
    const oembedUrl = `${baseUrl}/api/oembed?url=${encodeURIComponent(canonicalUrl)}`;

    // Substitui o link do oEmbed para usar uma URL absoluta com o parâmetro 'url'
    const relativeOembedTag = '<link rel="alternate" type="application/json+oembed" href="/api/oembed" title="Quiz EasyTalks" />';
    const absoluteOembedTag = `<link rel="alternate" type="application/json+oembed" href="${oembedUrl}" title="Quiz EasyTalks - Ranking em Tempo Real" />`;
    
    if (html.includes(relativeOembedTag)) {
      html = html.replace(relativeOembedTag, absoluteOembedTag);
    } else {
      // Caso não ache exatamente, tenta substituir no head
      html = html.replace('</head>', `${absoluteOembedTag}\n</head>`);
    }

    // Se for a rota de ranking, personaliza o título e as metatags para melhorar a exibição no Canva/redes
    if (originalPath === '/ranking') {
      html = html.replace('<title>Quiz EasyTalks</title>', '<title>Quiz EasyTalks - Ranking em Tempo Real</title>');
      
      html = html.replace(
        'content="Quiz: Qual é o seu potencial, MARKETIRO?"',
        'content="Quiz EasyTalks - Ranking em Tempo Real"'
      );
      
      html = html.replace(
        'content="Descubra como você interage com boas experiências e com sua equipe!"',
        'content="Acompanhe o ranking do quiz em tempo real!"'
      );
    }

    // Retorna o HTML com o Content-Type correto
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Erro ao renderizar HTML:', error);
    res.status(500).send('Erro interno do servidor');
  }
}
