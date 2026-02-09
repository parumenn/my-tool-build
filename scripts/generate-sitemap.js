
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ソースファイルと出力先の設定
const TOOLS_FILE = path.join(__dirname, '../constants/toolsData.ts');
const SITEMAP_FILE = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://parumenn.server-on.net'; // 本番環境のドメイン

const generateSitemap = () => {
  try {
    // toolsData.ts をテキストとして読み込む
    const content = fs.readFileSync(TOOLS_FILE, 'utf-8');
    
    // 静的ページ（HashRouterを使用しているため /#/ を付与）
    const pages = [
      { loc: '/#/', priority: '1.0' },
      { loc: '/#/about', priority: '0.5' },
      { loc: '/#/privacy', priority: '0.5' },
      { loc: '/#/terms', priority: '0.5' }
    ];

    // 正規表現で path: '/...' を抽出する
    // 注意: TSファイルを直接実行せずに文字列解析することで依存関係を増やさない
    const regex = /path:\s*'([^']+)'/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const pathStr = match[1];
      let fullUrl = '';

      // 外部ディレクトリ(/で終わるもの)はハッシュなし、それ以外はハッシュあり
      if (pathStr.endsWith('/')) {
        fullUrl = pathStr; // 例: /freebord/
      } else {
        fullUrl = `/#${pathStr}`; // 例: /#/qrcode
      }

      pages.push({
        loc: fullUrl,
        priority: '0.8'
      });
    }

    // XMLの生成
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // ファイル書き込み
    fs.writeFileSync(SITEMAP_FILE, sitemapContent);
    console.log('✅ Sitemap generated successfully at public/sitemap.xml');

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
};

generateSitemap();
