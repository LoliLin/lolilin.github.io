# Repository Guidelines

## Project Overview

Personal Chinese-language blog **可愛屋** (https://blog.kawaiis.in, repo `LoliLin/lolilin.github.io`, branch `main`) built with Jekyll on the **jekyll-theme-chirpy ~> 7.2** gem, heavily customized: a custom `novels` collection (multi-chapter fiction), floating music players (APlayer / NetEase Cloud Music), an ECharts tag co-occurrence graph, a 3D category carousel, and a terminal-style about page. Content is personal essays, fiction, and tech notes in Chinese. Deployed via GitHub Pages from a prebuilt `_site` artifact (`.nojekyll` present; custom domain set in repo settings, not in a CNAME file).

## Architecture & Data Flow

- **Theme layering**: the `jekyll-theme-chirpy` gem supplies layouts/includes/JS bundles; repo-local `_layouts/` and `_includes/` **override gem files by precedence**. Customizations live in-repo, stock Chirpy code comes from the gem.
- **Layout chain**: `compress.html` (HTML minifier) → `default.html` (shell: sidebar, topbar, panel, tail, footer, search) → page layout (`home | post | page | novel | novels | tags | categories | about | ...`). Layouts with `refactor: true` route content through `refactor-content.html` (table wrappers, code headers + copy buttons, image lazy-load/lqip/popup pipeline, heading anchors).
- **Collections** (from `_config.yml`):
  - `posts` → default permalink `/posts/:title/`, layout `post`, `toc: true`, `comments: true`.
  - `tabs` → `output: true`, `sort_by: order`, permalink `/:title/`, layout `page` — drives sidebar/topbar navigation.
  - `novels` → `output: true`, permalink `/novels/:path/`, layout `novel` — the custom fiction system.
- **Page assembly**: `default.html` consumes layout front matter — `panel_includes` (post: `[toc]`), `tail_includes` (post: `[related-posts, post-nav]`), `script_includes` (post: `[comment]`) — plus fixed includes (`update-list`, `trending-tags`, search, footer) and `global-scripts.html` (runs on every page).
- **Frontend**: per-layout deferred JS bundles `/assets/js/dist/{home|post|page|categories|misc|commons}.min.js` (built by the theme gem, gitignored) + CDN libs combined via `_includes/jsdelivr-combine.html`. Custom behavior is mostly **inline JS in `_includes`/`_layouts`** — there is only one real `.js` file in the repo (`assets/scrpits/breakout.js`, an orphaned game — do not touch, the `scrpits` typo is established).
- **Content flow**: markdown → kramdown (rouge, block line numbers) → `refactor-content.html` → final HTML. Search = Simple-Jekyll-Search over build-generated `/assets/js/data/search.json`. Comments = giscus (pathname mapping). Visitor metrics = busuanzi (active); all configured analytics ids are empty (dead code paths — don't add ids unless asked).

## Key Directories

| Path | Purpose |
|---|---|
| `_posts/` | Blog posts, `YYYY-M-D-<slug>.md` (no zero-padding; Chinese slugs OK) |
| `_novels/<书名>/` | Custom novels: optional `README.md` (novel home) + `NNN_<卷名>/` volumes of `第NNN章_<章节名>.md` chapters |
| `_tabs/` | Sidebar tab pages (`novels`, `categories`, `tags`, `archives`, `about`) |
| `_layouts/` | Page templates; **`tags.html`, `categories.html`, `novels.html`, `novel.html`, `about.html` are bespoke** (stock Chirpy versions replaced) |
| `_includes/` | Reusable snippets; bespoke: `netease-cloud-music.html`, `aplayer.html`, `music-set.html`, `global-scripts.html`, `analytics/busuanzi_*.html` |
| `_data/` | `share.yml`, `contact.yml`, `locales/*.yml` (25 stock locale files; zh-CN active) |
| `_plugins/` | `posts-lastmod-hook.rb` — sets `last_modified_at` from `git log` per post |
| `assets/css/` | Single SCSS entry: theme `@use 'main'` + custom `.ripple-dot` animation |
| `assets/categories/` | Category carousel backgrounds, named exactly `<category>.png` (碎碎念, 开发, crypto exist; 故纸堆/讲故事 missing → graceful fallback) |
| `assets/img/favicons/` | Favicon set |
| `tools/` | `run.sh` (dev server), `test.sh` (build + link check), `new-novel.py`/`new-novel.bat` (scaffolding) — excluded from build |
| `.github/workflows/` | `pages-deploy.yml` — the only workflow |

## Development Commands

```bash
bundle install                 # install gems (Gemfile.lock is gitignored, not committed)
./tools/run.sh                 # dev server: bundle exec jekyll s -l on 127.0.0.1
                               #   -p flag = JEKYLL_ENV=production; --force_polling inside Docker
./tools/test.sh                # production build to _site/ + htmlproofer link check
bundle exec jekyll b -d _site  # manual production build (JEKYLL_ENV=production for full assets)
python tools/new-novel.py new <书名> [卷名]       # scaffold a novel (README.md + 001_<卷名>/第001章_序章.md; default 卷名=正文)
python tools/new-novel.py add <书名> <卷名> <章名>  # add chapter; unknown volume is auto-created with next number
tools/new-novel.bat           # Windows twin (same new/add/list; UTF-8, needs `chcp 65001` on line 2 — keep CRLF)
```

VS Code: `Terminal > Run Task` → "Run Jekyll Server" (`run.sh`) / "Build Jekyll Site" (`test.sh`). No npm/Node involvement in the build — don't introduce `package.json` workflows (config `exclude` already lists `package*.json`).

## Code Conventions & Common Patterns

### Posts (`_posts/`)
Filename: `YYYY-M-D-<slug>.md` — month/day **not** zero-padded (`2026-6-4-这茶里并不禁烟.md`). Minimal front matter; layout/toc/comments/permalink come from defaults — **do not set them**:

```yaml
---
title: <string>                    # required
date: 2026-6-13 3:33:0 +0800       # required, explicit +0800 offset
categories: [碎碎念]               # required, always a ONE-element inline list
tags: [记忆碎片, 茶]               # required key; use [] when empty
netease-cloud-music: 2114980295$auto   # optional custom key
image:
  path: https://blog.kawaiis.in/assets/2018Winter0-2.png  # optional; used once
---
```

- `netease-cloud-music` grammar (parsed by `_includes/netease-cloud-music.html`): `<songid>` | `$auto` | `$flow` (floating draggable) | `$type1|$type3`. Also valid on tabs and `index.html` (e.g. `index.html` uses `2656567752$flow`).
- `aplayer` front matter (object) also supported by `_includes/aplayer.html` but unused in current content.
- **1970-* dates are intentional** — the 故纸堆 (undated-memory) convention. Never "fix" them.
- Categories in use: 故纸堆, 碎碎念, 开发, 讲故事, crypto. `pin`/`math`/`mermaid`/`last_modified_at` are supported but unused.
- Images: prefer external URLs; local images referenced by absolute `https://blog.kawaiis.in/assets/...` (site `url` is empty — `absolute_url` produces relative paths).

### Novels (`_novels/<书名>/`)
Structure (use `tools/new-novel.py` to scaffold):

```
_novels/<书名>/
├── README.md                    # novel home, optional
└── 001_<卷名>/
    └── 第001章_<章节名>.md
```

- `README.md` (novel home, optional): `layout: novel`, `novel: <书名>`, `title`, `description`, `permalink: /novels/<书名>/` — **no `chapter` key**. If absent, the novels index links straight to the first chapter.
- Volumes are dirs `NNN_<卷名>/` (zero-padded prefix = volume order); chapters live inside as `第NNN章_<章节名>.md` and **chapter numbers restart at 001 in each volume**.
- Chapter front matter: `novel`, `volume` (must equal the volume dir name, e.g. `001_青冥`), `chapter` (int), `title`, `description`, `date: 2026-07-14` (YYYY-MM-DD here, unlike posts), `tags`.
- Ordering is volume-major (dir prefix), then `chapter` int. 上一章/下一章/目录 are auto-generated by `_layouts/novel.html` (chapter nav crosses volume boundaries; same-volume chapter numbers restart).

### Tabs (`_tabs/`)
Front matter: `layout: page`, `icon` (FontAwesome), `order` (1–5: novels, categories, tags, archives, about). `about.md` overrides `title: 关乎此间`; `novels.md` overrides `permalink: /novels/`. Tab titles localize via `site.data.locales[lang].tabs` with fallback to `tab.title` (the novels tab falls back — no locale key exists; don't add one unless asked).

### Liquid patterns
- Includes are called with params: `{% include datetime.html date=page.date lang=page.lang %}`; layout front-matter hooks (`panel_includes`/`tail_includes`/`script_includes`) select includes per layout — follow this when adding page furniture.
- Media URLs must flow through `_includes/media-url.html` (handles `media_subpath`, `cdn`, baseurl).
- Formatting: `.editorconfig` = UTF-8, 2-space indent, LF, single quotes in JS/CSS/SCSS, double quotes in YAML. Prettier is the default VS Code formatter with `*.html` treated as Liquid; `theme-check`/`shfmt`/`stylelint` per-language. Repo styles use `text-autospace` inline where CJK spacing matters.

## Important Files

- `_config.yml` — all site config: theme, `lang: zh-CN`, `timezone: Asia/Shanghai`, collections, defaults, giscus, `paginate: 10`, PWA, `exclude`.
- `Gemfile` — `jekyll-theme-chirpy ~> 7.2 (>= 7.2.2)`, `html-proofer ~> 5.0` (test), Windows gems (`tzinfo`, `wdm`).
- `_layouts/default.html` — page shell; the hub of the layout system.
- `_layouts/post.html`, `novels.html`, `novel.html`, `categories.html`, `tags.html`, `about.html` — the bespoke layouts (read these before touching page templates).
- `_includes/refactor-content.html` — content post-processing pipeline (images, code, headings).
- `_includes/netease-cloud-music.html`, `aplayer.html`, `music-set.html`, `global-scripts.html` — bespoke frontend behavior.
- `_plugins/posts-lastmod-hook.rb` — `last_modified_at` from git history; requires full clone (CI uses `fetch-depth: 0`; local builds need a git checkout).
- `.github/workflows/pages-deploy.yml` — build (Ruby 3.3, `JEKYLL_ENV=production`) + htmlproofer + deploy to `github-pages` environment.
- `tools/run.sh`, `tools/test.sh`, `tools/new-novel.py` — the operational scripts.

## Runtime/Tooling Preferences

- **Ruby 3.3** (CI `ruby/setup-ruby@v1` with `bundler-cache`); Jekyll via Bundler only. No Node/build-toolchain in the pipeline.
- Windows is a first-class dev environment (the repo owner works there): `wdm`/`tzinfo` gems, `new-novel.bat` twin, `.gitattributes` forces LF for `*.sh` / CRLF for `*.bat`. `tools/run.sh` needs a Bash-like shell (Git Bash/WSL/devcontainer).
- Devcontainer available: `mcr.microsoft.com/devcontainers/jekyll:2-bullseye` (does **not** run `bundle install` — run it manually).
- `.gitignore` covers `_site`, `Gemfile.lock`, `.jekyll-cache`, `assets/js/dist` (build outputs). `assets/lib` submodule declared in `.gitmodules` but never initialized — leave it that way.
- Quirks to preserve: `assets/scrpits/` typo dir; stray root files `nul` (0B) and `CMAKE` (17B junk) — do not "clean up" without asking; `assets/logs/*.bin` is actually a plain-text AI chat log with sensitive personal content (not referenced by any site code).

## Testing & QA

- **No unit tests.** QA = production build + link check: `./tools/test.sh` runs `JEKYLL_ENV=production bundle exec jekyll b -d _site` then `bundle exec htmlproofer _site --disable-external --ignore-urls ...` (localhost/127.0.0.1 URLs ignored).
- CI runs the same htmlproofer step on every push; a failed build blocks deployment.
- Before changing layouts/includes, verify with `./tools/test.sh` (catches broken internal links, missing files) and eyeball the page in a browser via `./tools/run.sh`.
- Content changes (new post/chapter) generally need only `run.sh` smoke checks; structural changes (layouts, `_config.yml`) should pass the full `test.sh` gate.
