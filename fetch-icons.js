const https = require('https');
const fs = require('fs');

const icons = [
  'gmail', 'youtube', 'openai', 'github', 'x', 'notion', 'whatsapp',
  'instagram', 'facebook', 'linkedin', 'discord', 'slack', 'spotify',
  'netflix', 'reddit', 'tiktok', 'pinterest', 'telegram',
  'googledrive', 'googlecalendar', 'figma', 'visualstudiocode',
  'linear', 'vercel', 'amazon', 'claude', 'googlegemini',
  'perplexity', 'stackoverflow', 'leetcode', 'codepen', 'replit',
  'huggingface', 'medium', 'hashnode', 'devto', 'producthunt',
  'anthropic', 'netlify', 'supabase', 'railway', 'npm',
  'mdnwebdocs', 'cloudflare', 'twitch', 'googlemaps', 'googletranslate'
];

const results = {};
const slugAliases = {
  devto: 'devdotto'
};

const fetchText = (url, depth = 0) => new Promise((resolve) => {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 5) {
      const next = res.headers.location.startsWith('http')
        ? res.headers.location
        : new URL(res.headers.location, url).toString();
      resolve(fetchText(next, depth + 1));
      return;
    }
    if (res.statusCode !== 200) {
      res.resume();
      resolve(null);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
  }).on('error', () => resolve(null));
});

const extractSvg = (data) => {
  if (!data) return null;
  const pathMatch = data.match(/\sd=(["'])(.*?)\1/);
  const vbMatch = data.match(/\sviewBox=(["'])(.*?)\1/);
  if (!pathMatch) return null;
  return {
    path: pathMatch[2],
    viewBox: vbMatch ? vbMatch[2] : '0 0 24 24'
  };
};

const fetchIcon = async (slug) => {
  const alias = slugAliases[slug];
  const variants = alias ? [slug, alias] : [slug];
  const urls = [];
  variants.forEach((s) => urls.push(`https://cdn.simpleicons.org/${s}`));
  variants.forEach((s) => urls.push(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${s}.svg`));
  variants.forEach((s) => urls.push(`https://unpkg.com/simple-icons@latest/icons/${s}.svg`));

  for (const url of urls) {
    const data = await fetchText(url);
    const parsed = extractSvg(data);
    if (parsed) {
      results[slug] = parsed;
      return;
    }
  }
  results[slug] = null;
};

(async () => {
  for (const icon of icons) {
    await fetchIcon(icon);
    console.log(`Fetched: ${icon} — ${results[icon] ? 'OK' : 'FAILED'}`);
  }
  fs.writeFileSync('icon-paths.json', JSON.stringify(results, null, 2));
  console.log('Done. Written to icon-paths.json');
})();
