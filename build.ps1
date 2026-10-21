# edYOUcate Blog Static Site Generator (PowerShell Local Runner)
# Mirrors the exact build logic of build.js for local Windows previews

$ErrorActionPreference = "Stop"
$SITE_URL = "https://blog.edyoucate.in"

Write-Host "Starting edYOUcate Blog Static Site Generator (PowerShell)..." -ForegroundColor Cyan

$contentDir = Join-Path $PSScriptRoot "content\blog"
$templatesDir = Join-Path $PSScriptRoot "templates"

if (-not (Test-Path $contentDir)) {
    Write-Error "Content directory not found at: $contentDir"
}

# Function to format date: "2026-10-18" -> "OCT 18, 2026"
function Format-BlogDate($dateStr) {
    if (-not $dateStr) { return "OCT 2026" }
    try {
        $d = [datetime]::Parse($dateStr)
        $months = @("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
        return "$($months[$d.Month - 1]) $($d.Day), $($d.Year)"
    } catch {
        return $dateStr.ToUpper()
    }
}

# Helper to parse frontmatter from markdown file
function Parse-MarkdownPost($filePath) {
    $raw = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    $match = [regex]::Match($raw, '^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$')
    if (-not $match.Success) {
        return $null
    }

    $yaml = $match.Groups[1].Value
    $content = $match.Groups[2].Value.Trim()
    $data = @{}

    foreach ($line in ($yaml -split '\r?\n')) {
        $m = [regex]::Match($line, '^([a-zA-Z0-9_-]+):\s*(.*)$')
        if ($m.Success) {
            $key = $m.Groups[1].Value.Trim()
            $val = $m.Groups[2].Value.Trim().Trim('"').Trim("'")
            if ($val -eq "true") { $data[$key] = $true }
            elseif ($val -eq "false") { $data[$key] = $false }
            else { $data[$key] = $val }
        }
    }

    $data["content"] = $content
    $data["filename"] = (Split-Path $filePath -Leaf)
    return $data
}

# 1. Read all published Markdown posts
$postFiles = Get-ChildItem -Path $contentDir -Filter "*.md"
$posts = @()

foreach ($pf in $postFiles) {
    $post = Parse-MarkdownPost $pf.FullName
    if ($null -eq $post) { continue }
    if ($post["status"] -eq "draft") {
        Write-Host "Skipping draft: $($post['filename'])" -ForegroundColor Gray
        continue
    }
    $posts += $post
}

# Sort posts newest first
$posts = $posts | Sort-Object { [datetime]($_.date) } -Descending
Write-Host "Processed $($posts.Count) published articles." -ForegroundColor Green

# 2. Load Templates
$articleTpl = [System.IO.File]::ReadAllText((Join-Path $templatesDir "article.html"), [System.Text.Encoding]::UTF8)
$indexTpl   = [System.IO.File]::ReadAllText((Join-Path $templatesDir "index.html"), [System.Text.Encoding]::UTF8)
$niosTpl    = [System.IO.File]::ReadAllText((Join-Path $templatesDir "nios.html"), [System.Text.Encoding]::UTF8)
$distTpl    = [System.IO.File]::ReadAllText((Join-Path $templatesDir "distance-learning.html"), [System.Text.Encoding]::UTF8)

# 3. Generate Individual Blog Pages
foreach ($post in $posts) {
    $slug = $post["slug"]
    $title = $post["title"]
    $desc = $post["description"]
    $category = $post["category"]
    $readTime = if ($post["read_time"]) { $post["read_time"] } else { "11 MIN READ" }
    $author = if ($post["author"]) { $post["author"] } else { "The edYOUcate Team" }
    $date = $post["date"]
    $image = $post["image"]
    $imageAlt = if ($post["image_alt"]) { $post["image_alt"] } else { $title }

    # Render headings & build TOC
    $rawBody = $post["content"]
    $bodyHtml = ""
    $tocDesktop = @()
    $tocMobile = @()
    $secIdx = 1

    foreach ($block in ($rawBody -split '\r?\n\r?\n')) {
        $trimmed = $block.Trim()
        if (-not $trimmed) { continue }
        if ($trimmed -match '^##\s+(.*)$') {
            $h2Title = $matches[1].Trim()
            $cleanTitle = $h2Title -replace '<[^>]+>',''
            $secId = "section-$secIdx"
            $secIdx++
            $bodyHtml += "`n                <h2 id=""$secId"">$h2Title</h2>"
            $activeClass = if ($secIdx -eq 2) { ' class="active"' } else { '' }
            $tocDesktop += "                        <li><a href=""#$secId""$activeClass>$cleanTitle</a></li>"
            $tocMobile  += "                            <li><a href=""#$secId"">$cleanTitle</a></li>"
        } elseif ($trimmed.StartsWith('<p') -or $trimmed.StartsWith('<h') -or $trimmed.StartsWith('<div')) {
            $bodyHtml += "`n                $trimmed"
        } else {
            $bodyHtml += "`n                <p>$trimmed</p>"
        }
    }

    $canonicalUrl = "$SITE_URL/$slug.html"
    $seoTitle = if ($post["seo_title"]) { $post["seo_title"] } else { "$title | edYOUcate" }
    $seoDesc  = if ($post["seo_description"]) { $post["seo_description"] } else { $desc }
    $ogImg    = if ($image -match '^http') { $image } else { "$SITE_URL/$([uri]::EscapeUriString($image))" }

    $ogTags = "<meta property=""og:type"" content=""article"">`n" +
              "<meta property=""og:title"" content=""$seoTitle"">`n" +
              "<meta property=""og:description"" content=""$seoDesc"">`n" +
              "<meta property=""og:image"" content=""$ogImg"">`n" +
              "<meta property=""og:url"" content=""$canonicalUrl"">`n" +
              "<meta name=""twitter:card"" content=""summary_large_image"">`n" +
              "<meta name=""twitter:title"" content=""$seoTitle"">`n" +
              "<meta name=""twitter:description"" content=""$seoDesc"">`n" +
              "<meta name=""twitter:image"" content=""$ogImg"">"

    $escapedTitle = $title -replace '"', '\"'
    $escapedDesc = $desc -replace '"', '\"'
    $escapedAuthor = $author -replace '"', '\"'
    $jsonLd = "<script type=""application/ld+json"">`n" +
              "{`n" +
              "  ""@context"": ""https://schema.org"",`n" +
              "  ""@type"": ""BlogPosting"",`n" +
              "  ""headline"": ""$escapedTitle"",`n" +
              "  ""description"": ""$escapedDesc"",`n" +
              "  ""image"": ""$ogImg"",`n" +
              "  ""datePublished"": ""$date"",`n" +
              "  ""dateModified"": ""$date"",`n" +
              "  ""author"": { ""@type"": ""Organization"", ""name"": ""$escapedAuthor"" },`n" +
              "  ""publisher"": { ""@type"": ""Organization"", ""name"": ""edYOUcate"", ""logo"": { ""@type"": ""ImageObject"", ""url"": ""$SITE_URL/logo.png"" } },`n" +
              "  ""mainEntityOfPage"": { ""@type"": ""WebPage"", ""@id"": ""$canonicalUrl"" }`n" +
              "}`n" +
              "</script>"

    # Related stories in same category
    $relatedPosts = $posts | Where-Object { $_["slug"] -ne $slug -and $_["category"] -eq $category } | Select-Object -First 2
    $relatedParts = @()
    foreach ($rp in $relatedPosts) {
        $rImg = [uri]::EscapeUriString($rp["image"])
        $rTitle = $rp["title"]
        $rDate = Format-BlogDate $rp["date"]
        $rSlug = $rp["slug"]
        $rAlt = $rp["image_alt"]
        $relatedParts += "                <a href=""$rSlug.html"" class=""sidebar-story-card"">`n" +
                         "                    <img src=""$rImg"" alt=""$rAlt"">`n" +
                         "                    <div class=""sidebar-story-content"">`n" +
                         "                        <h4>$rTitle</h4>`n" +
                         "                        <span class=""sidebar-story-meta"">$rDate</span>`n" +
                         "                    </div>`n" +
                         "                </a>"
    }
    $relatedHtml = $relatedParts -join "`n"

    $pageHtml = $articleTpl `
        -replace '\{\{SEO_TITLE\}\}', $seoTitle `
        -replace '\{\{SEO_DESCRIPTION\}\}', $seoDesc `
        -replace '\{\{CANONICAL_URL\}\}', $canonicalUrl `
        -replace '\{\{OG_TAGS\}\}', $ogTags `
        -replace '\{\{JSON_LD\}\}', $jsonLd `
        -replace '\{\{CATEGORY\}\}', $category.ToUpper() `
        -replace '\{\{READ_TIME\}\}', $readTime `
        -replace '\{\{TITLE\}\}', $title `
        -replace '\{\{SUBTITLE\}\}', $desc `
        -replace '\{\{AUTHOR\}\}', $author.ToUpper() `
        -replace '\{\{DATE_FORMATTED\}\}', (Format-BlogDate $date) `
        -replace '\{\{IMAGE\}\}', ([uri]::EscapeUriString($image)) `
        -replace '\{\{IMAGE_ALT\}\}', $imageAlt `
        -replace '\{\{TOC_DESKTOP\}\}', ($tocDesktop -join "`n") `
        -replace '\{\{TOC_MOBILE\}\}', ($tocMobile -join "`n") `
        -replace '\{\{CONTENT\}\}', $bodyHtml `
        -replace '\{\{RELATED_STORIES\}\}', $relatedHtml

    $targetPath = Join-Path $PSScriptRoot "$slug.html"
    [System.IO.File]::WriteAllText($targetPath, $pageHtml, [System.Text.Encoding]::UTF8)
    Write-Host "Generated article page: $slug.html" -ForegroundColor DarkGreen
}

# 4. Update Homepage (index.html)
# Strictly chronological newest-to-oldest pipeline:
# - posts[0]: Newest post takes the big left card
# - posts[1..3]: Next 3 posts move down through the right side list
# - posts[4..end]: Oldest posts flow into the More Stories archive grid
$featuredLarge = $posts[0]
$sidePosts = $posts | Select-Object -Skip 1 -First 3
$archivePosts = $posts | Select-Object -Skip 4
$gridPosts = if ($archivePosts.Count -gt 0) { $archivePosts } else { $posts | Select-Object -Skip 1 -First 4 }

$flCategory = $featuredLarge['category'].ToUpper()
$flImg = [uri]::EscapeUriString($featuredLarge['image'])
$flAlt = $featuredLarge['image_alt']
$flSlug = $featuredLarge['slug']
$flTitle = $featuredLarge['title']
$flDesc = $featuredLarge['description']
$flDate = Format-BlogDate $featuredLarge['date']
$flRead = $featuredLarge['read_time']

$featuredLargeHtml = "                <article class=""featured-large-card"">`n" +
                     "                    <div class=""card-image"">`n" +
                     "                        <div class=""card-badge"">$flCategory</div>`n" +
                     "                        <img src=""$flImg"" alt=""$flAlt"">`n" +
                     "                    </div>`n" +
                     "                    <div class=""card-content"">`n" +
                     "                        <h3><a href=""$flSlug.html"">$flTitle <svg class=""arrow-icon"" width=""16"" height=""16"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><line x1=""7"" y1=""17"" x2=""17"" y2=""7""></line><polyline points=""7 7 17 7 17 17""></polyline></svg></a></h3>`n" +
                     "                        <p>$flDesc</p>`n" +
                     "                        <div class=""card-meta"">$flDate &nbsp;&bull;&nbsp; $flRead</div>`n" +
                     "                    </div>`n" +
                     "                </article>"

$sideParts = @()
$spIdx = 0
foreach ($sp in $sidePosts) {
    $spIdx++
    $spCat = $sp['category'].ToUpper()
    $spImg = [uri]::EscapeUriString($sp['image'])
    $spAlt = $sp['image_alt']
    $spSlug = $sp['slug']
    $spTitle = $sp['title']
    $spDesc = $sp['description']
    $spDate = Format-BlogDate $sp['date']
    $spRead = $sp['read_time']

    $divider = if ($spIdx -lt $sidePosts.Count) { "`n`n                    <div class=""list-divider""></div>" } else { "" }
    $sideParts += "                    <article class=""small-list-card"">`n" +
                  "                        <div class=""small-card-image"">`n" +
                  "                            <div class=""card-badge"">$spCat</div>`n" +
                  "                            <img src=""$spImg"" alt=""$spAlt"">`n" +
                  "                        </div>`n" +
                  "                        <div class=""small-card-content"">`n" +
                  "                            <span class=""small-card-eyebrow"">$spCat</span>`n" +
                  "                            <h4><a href=""$spSlug.html"">$spTitle <svg class=""arrow-icon"" width=""16"" height=""16"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><line x1=""7"" y1=""17"" x2=""17"" y2=""7""></line><polyline points=""7 7 17 7 17 17""></polyline></svg></a></h4>`n" +
                  "                            <p>$spDesc</p>`n" +
                  "                            <div class=""card-meta"">$spDate &nbsp;&bull;&nbsp; $spRead</div>`n" +
                  "                        </div>`n" +
                  "                    </article>$divider"
}
$sidePostsHtml = $sideParts -join "`n"

$gridParts = @()
foreach ($gp in $gridPosts) {
    $gpCat = $gp['category'].ToUpper()
    $gpImg = [uri]::EscapeUriString($gp['image'])
    $gpAlt = $gp['image_alt']
    $gpSlug = $gp['slug']
    $gpTitle = $gp['title']
    $gpDesc = $gp['description']
    $gpDate = Format-BlogDate $gp['date']
    $gpRead = $gp['read_time']

    $gridParts += "                <article class=""story-card"">`n" +
                  "                    <div class=""card-image"">`n" +
                  "                        <div class=""card-badge"">$gpCat</div>`n" +
                  "                        <img src=""$gpImg"" alt=""$gpAlt"">`n" +
                  "                    </div>`n" +
                  "                    <div class=""card-content"">`n" +
                  "                        <h3><a href=""$gpSlug.html"">$gpTitle <svg class=""arrow-icon"" width=""16"" height=""16"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><line x1=""7"" y1=""17"" x2=""17"" y2=""7""></line><polyline points=""7 7 17 7 17 17""></polyline></svg></a></h3>`n" +
                  "                        <p>$gpDesc</p>`n" +
                  "                        <div class=""card-meta"">$gpDate &nbsp;&bull;&nbsp; $gpRead</div>`n" +
                  "                    </div>`n" +
                  "                </article>"
}
$gridPostsHtml = $gridParts -join "`n"

$updatedIndex = $indexTpl `
    -replace '<!-- INJECT:FEATURED_LARGE -->', $featuredLargeHtml `
    -replace '<!-- INJECT:FEATURED_LIST -->', $sidePostsHtml `
    -replace '<!-- INJECT:STORIES_GRID -->', $gridPostsHtml `
    -replace '<!-- INJECT:ARCHIVE_COUNT -->', $posts.Count.ToString()

[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "index.html"), $updatedIndex, [System.Text.Encoding]::UTF8)
Write-Host "Generated homepage: index.html" -ForegroundColor Green

# 5. Update NIOS Category Page
$niosPosts = $posts | Where-Object { $_["category"].ToLower() -eq "nios" }
$niosParts = @()
foreach ($np in $niosPosts) {
    $npDate = $np['date']
    $npImg = [uri]::EscapeUriString($np['image'])
    $npAlt = $np['image_alt']
    $npRead = $np['read_time']
    $npSlug = $np['slug']
    $npTitle = $np['title']
    $npDesc = $np['description']

    $niosParts += "                    <article class=""cat-card"" data-date=""$npDate"">`n" +
                  "                        <div class=""cat-image"">`n" +
                  "                            <img src=""$npImg"" alt=""$npAlt"">`n" +
                  "                        </div>`n" +
                  "                        <div class=""cat-meta-row"">`n" +
                  "                            <span class=""cat-read-time"">$npRead</span>`n" +
                  "                        </div>`n" +
                  "                        <h3><a href=""$npSlug.html"">$npTitle</a></h3>`n" +
                  "                        <p>$npDesc</p>`n" +
                  "                    </article>"
}
$niosGridHtml = $niosParts -join "`n"
$updatedNios = $niosTpl -replace '<!-- INJECT:NIOS_GRID -->', $niosGridHtml
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "nios.html"), $updatedNios, [System.Text.Encoding]::UTF8)
Write-Host "Generated category page: nios.html" -ForegroundColor Green

# 6. Update Distance Learning Category Page
$distPosts = $posts | Where-Object { $_["category"].ToLower() -match "distance" }
$distParts = @()
foreach ($dp in $distPosts) {
    $dpDate = $dp['date']
    $dpImg = [uri]::EscapeUriString($dp['image'])
    $dpAlt = $dp['image_alt']
    $dpRead = $dp['read_time']
    $dpSlug = $dp['slug']
    $dpTitle = $dp['title']
    $dpDesc = $dp['description']

    $distParts += "                    <article class=""cat-card"" data-date=""$dpDate"">`n" +
                  "                        <div class=""cat-image"">`n" +
                  "                            <img src=""$dpImg"" alt=""$dpAlt"">`n" +
                  "                        </div>`n" +
                  "                        <div class=""cat-meta-row"">`n" +
                  "                            <span class=""cat-eyebrow"">DISTANCE LEARNING</span>`n" +
                  "                            <span class=""cat-read-time"">$dpRead</span>`n" +
                  "                        </div>`n" +
                  "                        <h3><a href=""$dpSlug.html"">$dpTitle</a></h3>`n" +
                  "                        <p>$dpDesc</p>`n" +
                  "                    </article>"
}
$distGridHtml = $distParts -join "`n"
$updatedDist = $distTpl -replace '<!-- INJECT:DISTANCE_GRID -->', $distGridHtml
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "distance-learning.html"), $updatedDist, [System.Text.Encoding]::UTF8)
Write-Host "Generated category page: distance-learning.html" -ForegroundColor Green

# 7. Generate sitemap.xml
$today = (Get-Date).ToString("yyyy-MM-dd")
$sitemapXml = "<?xml version=""1.0"" encoding=""UTF-8""?>`n" +
              "<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"">`n" +
              "  <url>`n" +
              "    <loc>$SITE_URL/</loc>`n" +
              "    <lastmod>$today</lastmod>`n" +
              "    <changefreq>daily</changefreq>`n" +
              "    <priority>1.0</priority>`n" +
              "  </url>`n" +
              "  <url>`n" +
              "    <loc>$SITE_URL/nios.html</loc>`n" +
              "    <lastmod>$today</lastmod>`n" +
              "    <changefreq>weekly</changefreq>`n" +
              "    <priority>0.9</priority>`n" +
              "  </url>`n" +
              "  <url>`n" +
              "    <loc>$SITE_URL/distance-learning.html</loc>`n" +
              "    <lastmod>$today</lastmod>`n" +
              "    <changefreq>weekly</changefreq>`n" +
              "    <priority>0.9</priority>`n" +
              "  </url>`n"

foreach ($p in $posts) {
    $pSlug = $p["slug"]
    $pDate = $p["date"]
    $sitemapXml += "  <url>`n" +
                   "    <loc>$SITE_URL/$pSlug.html</loc>`n" +
                   "    <lastmod>$pDate</lastmod>`n" +
                   "    <changefreq>monthly</changefreq>`n" +
                   "    <priority>0.8</priority>`n" +
                   "  </url>`n"
}
$sitemapXml += "</urlset>`n"
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "sitemap.xml"), $sitemapXml.Trim(), [System.Text.Encoding]::UTF8)
Write-Host "Generated sitemap: sitemap.xml" -ForegroundColor Green

# 8. Generate robots.txt
$robotsTxt = "User-agent: *`nAllow: /`n`nSitemap: $SITE_URL/sitemap.xml`n"
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "robots.txt"), $robotsTxt.Trim(), [System.Text.Encoding]::UTF8)
Write-Host "Generated robots.txt" -ForegroundColor Green

Write-Host "Build completed successfully!" -ForegroundColor Cyan
