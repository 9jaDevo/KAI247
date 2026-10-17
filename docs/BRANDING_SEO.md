# Branding and search setup

The founder supplied the KAI247 brand board and selected **https://kai247.pdev.tech** as the primary public URL. The existing domain returned HTTPS200 during this change; that baseline still had the old title and does not prove this code is deployed.

## Assets and implementation

- `public/brand/logo.png`: transparent horizontal primary lockup, used by the shared Brand component on public pages, login and owner shell. Dark backgrounds use a white treatment of the same lockup.
- `public/brand/logo-social.jpg`: flattened derivative against the social-card background, with explicit numeric image dimensions for the ImageResponse renderer. The original transparent logo remains the actual site logo.
- `src/app/favicon.ico`:16/32/48px icon frames; `src/app/icon.png`:48px; `src/app/apple-icon.png`:180px.
- `public/brand/icon-192.png`, `icon-512.png`: manifest icons. The manifest does not implement or claim offline access/service-worker support.
- Logo/app-mark isolation used the built-in image editing tool with the founder's board as its edit target and transparent output. Outputs were inspected, trimmed and encoded into web/icon sizes with Sharp. These are image-assisted extractions, not independently certified pixel-identical vector masters. No image-generation service or key is needed at runtime/build; final assets are in the repository.

Extraction prompt1: “Extract ONLY the main primary horizontal KAI247 AI logo from the upper large white panel of the supplied brand board, exactly preserving the existing open-orbit symbol, dark navy KAI lettering, teal247 and tealAI. Remove the tagline underneath and all other board content. Do not redesign or add shadows, gradients, frames or text. Clean crisp flat artwork on a truly transparent background, tightly cropped with small clear padding, suitable as a website header logo. Preserve exact letter shapes, proportions, colors and spacing from the original main logo.”

Extraction prompt2: “Extract ONLY the square app/product icon from the lower-right panel of the supplied brand board: the rounded teal square containing the white and mint open-orbit symbol with the pale mint terminal dot. Preserve this exact existing design, colors, shape and proportions. Remove all surrounding board, text, labels and color swatches. Center the existing rounded-square icon on transparent canvas with minimal even clear padding. Output a crisp square app icon suitable for favicon and Apple touch icon. Do not redesign, add lettering or add a shadow.”

## Technical SEO

- Descriptive title/description and title template; `lang=en`; canonical homepage URL; Open Graph and Twitter large-image metadata;1200×630 local brand social-card renderer.
- Truthful WebSite/Organization JSON-LD, with site name, URL and supplied logo. No invented reviews, customers, prices, office address or legal-registration details.
- `/sitemap.xml` lists only the indexable public homepage. No synthetic timestamps, private renewals or login URLs.
- `/robots.txt` allows the homepage and disallows owner/API crawling. Login and owner layouts also emit noindex/nofollow metadata; APIs carry X-Robots-Tag. Crawling directives are not authentication; existing server authorization remains required and unchanged.
- Optional server-only `SITE_URL` overrides the founder-selected default. Validation permits only a credential-free HTTPS origin without query, fragment or extra path. It is separate from `APP_URL`, which controls authenticated request origins. Changes to production environment metadata normally require rebuild/deploy.

## Founder deployment checklist

1. Deploy these reviewed changes. Public deployment, commit/push and new CI success are not implied by local checks.
2. Keep the primary custom domain configured on Render with working DNS/HTTPS. Set `SITE_URL=https://kai247.pdev.tech` if an explicit environment override is preferred. Ensure the web authentication `APP_URL` also matches the actual sign-in origin; this patch does not change production secrets or auth settings.
3. Choose one primary host and configure supported host redirects in the deployment/domain layer to consolidate alternate domains. Canonical metadata is a preference, not an HTTP redirect.
4. Open `/`, `/favicon.ico`, `/icon.png`, `/apple-icon.png`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` on the deployed custom domain. Inspect the initial HTML and social card; refresh favicon caches if the old icon persists.
5. In your own Google Search Console account, add/verify the domain using its supplied DNS record, submit `https://kai247.pdev.tech/sitemap.xml`, inspect the homepage and request indexing. Do not invent a verification token. Validate JSON-LD using Schema Markup Validator; site-name markup is not necessarily a Rich Results feature.
6. Verify rendering/crawling and monitor real Core Web Vitals after deployment. No Lighthouse score, search-engine submission, ranking improvement or indexing guarantee is claimed by this implementation.

References: [installed Next.js metadata conventions](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [Google site-name guidance](https://developers.google.com/search/docs/appearance/site-names), [Google robots limitations](https://developers.google.com/search/docs/crawling-indexing/robots/intro). Community cross-check: [Next.js SEO checklist — @janak_pokharel_485508294d](https://dev.to/janak_pokharel_485508294d/nextjs-seo-checklist-what-actually-gets-app-router-pages-indexed-5fha); use current installed API docs as implementation authority.
