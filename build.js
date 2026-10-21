import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://blog.edyoucate.in';

// Helper to format date: "2026-10-18" -> "OCT 18, 2026"
function formatDate(dateStr) {
  if (!dateStr) return 'OCT 2026';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.toUpperCase();
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

// Frontmatter parser using gray-matter with automatic BOM stripping
function parseFrontmatter(fileContent) {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  const cleanContent = fileContent.replace(/^\uFEFF/, '').trimStart();
  try {
    const parsed = matter(cleanContent);
    return { data: parsed.data || {}, content: parsed.content || '' };
  } catch (err) {
    console.warn('gray-matter error, using fallback:', err.message);
  }

  // Fallback regex frontmatter parser
  const match = cleanContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: cleanContent };

  const yamlBlock = match[1];
  const content = match[2];
  const data = {};

  let currentKey = null;
  let inList = false;

  yamlBlock.split(/\r?\n/).forEach(line => {
    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch && inList && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(listMatch[1].replace(/^["']|["']$/g, '').trim());
      return;
    }

    const keyValMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyValMatch) {
      currentKey = keyValMatch[1].trim();
      let val = keyValMatch[2].trim();
      if (val === '') {
        inList = true;
        data[currentKey] = [];
      } else {
        inList = false;
        if (val === 'true') data[currentKey] = true;
        else if (val === 'false') data[currentKey] = false;
        else data[currentKey] = val.replace(/^["']|["']$/g, '').trim();
      }
    }
  });

  return { data, content };
}

// Markdown to HTML converter
async function renderMarkdown(markdown) {
  try {
    if (typeof marked.parse === 'function') {
      return marked.parse(markdown);
    }
    if (typeof marked === 'function') {
      return marked(markdown);
    }
  } catch (e) {
    // Graceful fallback markdown compiler
  }

  // Regex fallback compiler
  let html = markdown
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold / Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Paragraphs
    .split(/\r?\n\r?\n/)
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<blockquote') || p.startsWith('<div')) return p;
      return `<p>${p}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

// Add IDs and extract Headings for Table of Contents
function processHeadingsAndTOC(html) {
  let sectionIndex = 1;
  const tocEntries = [];

  const processedHtml = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, titleText) => {
    const cleanTitle = titleText.replace(/<[^>]+>/g, '').trim();
    // Don't duplicate ID if already exists
    let idMatch = attrs.match(/id=["'](.*?)["']/);
    let sectionId = idMatch ? idMatch[1] : `section-${sectionIndex++}`;

    // Skip reference heading from basic TOC numbering if it is official resources
    tocEntries.push({ id: sectionId, title: cleanTitle });

    if (!idMatch) {
      return `<h2 id="${sectionId}"${attrs}>${titleText}</h2>`;
    }
    return match;
  });

  const desktopTocHtml = tocEntries
    .map((entry, idx) => `                        <li><a href="#${entry.id}"${idx === 0 ? ' class="active"' : ''}>${entry.title}</a></li>`)
    .join('\n');

  const mobileTocHtml = tocEntries
    .map(entry => `                            <li><a href="#${entry.id}">${entry.title}</a></li>`)
    .join('\n');

  return { html: processedHtml, desktopTocHtml, mobileTocHtml };
}

async function build() {
  console.log('🚀 Starting edYOUcate Blog Static Site Generator...');

  const contentDir = path.join(__dirname, 'content', 'blog');
  const templatesDir = path.join(__dirname, 'templates');

  if (!fs.existsSync(contentDir)) {
    console.error(`❌ Content directory not found at: ${contentDir}`);
    process.exit(1);
  }

  // 1. Read all Markdown files
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseFrontmatter(raw);

    if (data.status === 'draft') {
      console.log(`⏩ Skipping draft: ${file}`);
      continue;
    }

    if (!data.title || !data.slug) {
      console.warn(`⚠️ Warning: Post in ${file} is missing title or slug. Skipping.`);
      continue;
    }

    posts.push({
      ...data,
      content,
      filename: file,
      dateObj: new Date(data.date || '2026-01-01')
    });
  }

  // Sort posts newest first
  posts.sort((a, b) => b.dateObj - a.dateObj);
  console.log(`📝 Processed ${posts.length} published articles.`);

  // 2. Load Templates
  const articleTpl = fs.readFileSync(path.join(templatesDir, 'article.html'), 'utf-8');
  const indexTpl = fs.readFileSync(path.join(templatesDir, 'index.html'), 'utf-8');
  const niosTpl = fs.readFileSync(path.join(templatesDir, 'nios.html'), 'utf-8');
  const distTpl = fs.readFileSync(path.join(templatesDir, 'distance-learning.html'), 'utf-8');

  // 3. Generate Individual Blog Pages
  for (const post of posts) {
    const renderedBody = await renderMarkdown(post.content);
    const { html: finalBody, desktopTocHtml, mobileTocHtml } = processHeadingsAndTOC(renderedBody);

    const canonicalUrl = `${SITE_URL}/${post.slug}.html`;
    const seoTitle = post.seo_title || `${post.title} | edYOUcate`;
    const seoDesc = post.seo_description || post.description;
    const ogImage = post.image.startsWith('http') ? post.image : `${SITE_URL}/${encodeURI(post.image)}`;

    const ogTags = `
    <meta property="og:type" content="article">
    <meta property="og:title" content="${seoTitle}">
    <meta property="og:description" content="${seoDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${seoTitle}">
    <meta name="twitter:description" content="${seoDesc}">
    <meta name="twitter:image" content="${ogImage}">`;

    const jsonLd = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": ${JSON.stringify(post.title)},
      "description": ${JSON.stringify(post.description)},
      "image": ${JSON.stringify(ogImage)},
      "datePublished": "${post.date || '2026-10-18'}",
      "dateModified": "${post.date || '2026-10-18'}",
      "author": {
        "@type": "Organization",
        "name": ${JSON.stringify(post.author || 'The edYOUcate Team')}
      },
      "publisher": {
        "@type": "Organization",
        "name": "edYOUcate",
        "logo": {
          "@type": "ImageObject",
          "url": "${SITE_URL}/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${canonicalUrl}"
      }
    }
    </script>`;

    // Related stories in same category
    const relatedPosts = posts
      .filter(p => p.slug !== post.slug && p.category === post.category)
      .slice(0, 2);

    const relatedStoriesHtml = relatedPosts.map(rel => `
                <a href="${rel.slug}.html" class="sidebar-story-card">
                    <img src="${encodeURI(rel.image)}" alt="${rel.image_alt || rel.title}">
                    <div class="sidebar-story-content">
                        <h4>${rel.title}</h4>
                        <span class="sidebar-story-meta">${formatDate(rel.date)}</span>
                    </div>
                </a>`).join('\n');

    let outputHtml = articleTpl
      .replace(/{{SEO_TITLE}}/g, seoTitle)
      .replace(/{{SEO_DESCRIPTION}}/g, seoDesc)
      .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
      .replace(/{{OG_TAGS}}/g, ogTags)
      .replace(/{{JSON_LD}}/g, jsonLd)
      .replace(/{{CATEGORY}}/g, post.category.toUpperCase())
      .replace(/{{READ_TIME}}/g, post.read_time || '11 MIN READ')
      .replace(/{{TITLE}}/g, post.title)
      .replace(/{{SUBTITLE}}/g, post.description)
      .replace(/{{AUTHOR}}/g, (post.author || 'THE EDYOUCATE TEAM').toUpperCase())
      .replace(/{{DATE_FORMATTED}}/g, formatDate(post.date))
      .replace(/{{IMAGE}}/g, encodeURI(post.image))
      .replace(/{{IMAGE_ALT}}/g, post.image_alt || post.title)
      .replace(/{{TOC_DESKTOP}}/g, desktopTocHtml)
      .replace(/{{TOC_MOBILE}}/g, mobileTocHtml)
      .replace(/{{CONTENT}}/g, finalBody)
      .replace(/{{RELATED_STORIES}}/g, relatedStoriesHtml);

    const targetFile = path.join(__dirname, `${post.slug}.html`);
    fs.writeFileSync(targetFile, outputHtml, 'utf-8');
    console.log(`✅ Generated article page: ${post.slug}.html`);
  }

  // 4. Update Homepage (index.html)
  // Strictly chronological newest-to-oldest pipeline:
  // - posts[0]: Newest post takes the big left card
  // - posts[1..3]: Next 3 posts move down through the right side list
  // - posts[4..end]: Oldest posts flow into the More Stories archive grid
  const featuredLarge = posts[0];
  const sidePosts = posts.slice(1, 4);
  const archivePosts = posts.slice(4);
  const gridPosts = archivePosts.length > 0 ? archivePosts : posts.slice(1, 5);

  const featuredLargeHtml = `
                <article class="featured-large-card">
                    <div class="card-image">
                        <div class="card-badge">${featuredLarge.category.toUpperCase()}</div>
                        <img src="${encodeURI(featuredLarge.image)}" alt="${featuredLarge.image_alt || featuredLarge.title}">
                    </div>
                    <div class="card-content">
                        <h3><a href="${featuredLarge.slug}.html">${featuredLarge.title} <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></a></h3>
                        <p>${featuredLarge.description}</p>
                        <div class="card-meta">${formatDate(featuredLarge.date)} &nbsp;&bull;&nbsp; ${featuredLarge.read_time || '11 MIN READ'}</div>
                    </div>
                </article>`;

  const sidePostsHtml = sidePosts.map((post, idx) => `
                    <article class="small-list-card">
                        <div class="small-card-image">
                            <div class="card-badge">${post.category.toUpperCase()}</div>
                            <img src="${encodeURI(post.image)}" alt="${post.image_alt || post.title}">
                        </div>
                        <div class="small-card-content">
                            <span class="small-card-eyebrow">${post.category.toUpperCase()}</span>
                            <h4><a href="${post.slug}.html">${post.title} <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></a></h4>
                            <p>${post.description}</p>
                            <div class="card-meta">${formatDate(post.date)} &nbsp;&bull;&nbsp; ${post.read_time || '11 MIN READ'}</div>
                        </div>
                    </article>${idx < sidePosts.length - 1 ? '\n\n                    <div class="list-divider"></div>' : ''}`).join('\n');

  const gridPostsHtml = gridPosts.map(post => `
                <article class="story-card">
                    <div class="card-image">
                        <div class="card-badge">${post.category.toUpperCase()}</div>
                        <img src="${encodeURI(post.image)}" alt="${post.image_alt || post.title}">
                    </div>
                    <div class="card-content">
                        <h3><a href="${post.slug}.html">${post.title} <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></a></h3>
                        <p>${post.description}</p>
                        <div class="card-meta">${formatDate(post.date)} &nbsp;&bull;&nbsp; ${post.read_time || '11 MIN READ'}</div>
                    </div>
                </article>`).join('\n');

  let updatedIndex = indexTpl
    .replace('<!-- INJECT:FEATURED_LARGE -->', featuredLargeHtml)
    .replace('<!-- INJECT:FEATURED_LIST -->', sidePostsHtml)
    .replace('<!-- INJECT:STORIES_GRID -->', gridPostsHtml)
    .replace('<!-- INJECT:ARCHIVE_COUNT -->', posts.length.toString());

  fs.writeFileSync(path.join(__dirname, 'index.html'), updatedIndex, 'utf-8');
  console.log('✅ Generated homepage: index.html');

  // 5. Update NIOS Category Page
  const niosPosts = posts.filter(p => p.category.toLowerCase() === 'nios');
  const niosGridHtml = niosPosts.map(post => `
                    <article class="cat-card" data-date="${post.date}">
                        <div class="cat-image">
                            <img src="${encodeURI(post.image)}" alt="${post.image_alt || post.title}">
                        </div>
                        <div class="cat-meta-row">
                            <span class="cat-read-time">${post.read_time || '11 MIN READ'}</span>
                        </div>
                        <h3><a href="${post.slug}.html">${post.title}</a></h3>
                        <p>${post.description}</p>
                    </article>`).join('\n');

  let updatedNios = niosTpl.replace('<!-- INJECT:NIOS_GRID -->', niosGridHtml);
  fs.writeFileSync(path.join(__dirname, 'nios.html'), updatedNios, 'utf-8');
  console.log('✅ Generated category page: nios.html');

  // 6. Update Distance Learning Category Page
  const distPosts = posts.filter(p => p.category.toLowerCase().includes('distance'));
  const distGridHtml = distPosts.map(post => `
                    <article class="cat-card" data-date="${post.date}">
                        <div class="cat-image">
                            <img src="${encodeURI(post.image)}" alt="${post.image_alt || post.title}">
                        </div>
                        <div class="cat-meta-row">
                            <span class="cat-eyebrow">DISTANCE LEARNING</span>
                            <span class="cat-read-time">${post.read_time || '12 MIN READ'}</span>
                        </div>
                        <h3><a href="${post.slug}.html">${post.title}</a></h3>
                        <p>${post.description}</p>
                    </article>`).join('\n');

  let updatedDist = distTpl.replace('<!-- INJECT:DISTANCE_GRID -->', distGridHtml);
  fs.writeFileSync(path.join(__dirname, 'distance-learning.html'), updatedDist, 'utf-8');
  console.log('✅ Generated category page: distance-learning.html');

  // 7. Generate sitemap.xml
  const today = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/nios.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/distance-learning.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${posts.map(p => `  <url>
    <loc>${SITE_URL}/${p.slug}.html</loc>
    <lastmod>${p.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapXml.trim(), 'utf-8');
  console.log('✅ Generated sitemap: sitemap.xml');

  // 8. Generate robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(__dirname, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('✅ Generated robots.txt');

  console.log('🎉 Build completed successfully!');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
