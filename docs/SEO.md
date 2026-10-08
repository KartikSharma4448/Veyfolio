# Veyfolio SEO

The production build prerenders the homepage and creates canonical URLs,
social metadata, WebApplication structured data, robots.txt and a homepage-only
sitemap. The editor uses noindex, follow, not an access-control mechanism.

## Public Address

Set REACT_APP_SITE_URL to the verified public origin before npm run build.
Without it, https://veyfolio.thekartiksharma.in is used.
Verify availability and ownership before publishing. Rebuild on domain changes.
Do not use localhost as the public origin.

## Hosting

Publish frontend/build. Serve /create with build/create/index.html or an
equivalent route-specific noindex response. Do not rewrite every URL to the
indexable homepage. Unknown paths should return an actual HTTP 404. Redirect
alternate hosts and HTTP to the canonical HTTPS origin. Cache static assets
and enable compression.

The approved Veyfolio social preview is used for large social cards. Sharing
crawlers can read metadata directly from generated HTML. No fake ratings,
pricing or unsupported claims are added.

## After Deployment

Verify the public home, editor, logo, /robots.txt and /sitemap.xml. Inspect the
canonical URL in Google Search Console and submit the sitemap after domain
verification. Indexing, rankings and rich results are not guaranteed. The
local build does not deploy or submit anything to Search Console.

## Render Routing

Replace the old catch-all SPA rewrite with explicit editor rewrites:

| Source | Destination | Action |
| --- | --- | --- |
| /create | /create/index.html | Rewrite |
| /create/ | /create/index.html | Rewrite |

Keep unknown routes as HTTP 404 rather than serving the homepage for every path.
This lets crawlers receive the editor's noindex metadata before JavaScript runs.
The public robots.txt and sitemap.xml files work in development; production
builds regenerate them from REACT_APP_SITE_URL.

## Database Removal

The backend no longer imports database drivers or requires database credentials.
The unused /api/status and /api/auth signup/verify endpoints were removed.
Delete old database environment variables only after deploying this version.
Keep existing frontend origins when adding the custom domain to CORS_ORIGINS.
