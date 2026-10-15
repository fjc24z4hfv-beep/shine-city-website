# Shine City website

Static site for Shine City Paver Sealing & Exterior Cleaning. GitHub Pages serves this repo from the root of `main`, on the custom domain in `CNAME`.

Merging into `main` publishes the live site at https://shinecitypaversealing.com/. Review changes on a pull request first.

Preview locally from the repo root:

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/ and http://127.0.0.1:8000/review/.

## What to edit

Paver sealing rates, the 800 sq ft breakpoint, the city list, and quote-form delivery live in `js/site-config.js`.

- `pricing.paverSealing.breakpointSqFt`, `rateUpTo`, and `rateOver` drive the price cards, the estimate calculator, and the price structured data. The first `breakpointSqFt` use `rateUpTo`. Only the square footage above that uses `rateOver`. The same split is in `worker/src/price.js`.
- `FORM_ENDPOINT` is the FormSubmit address that receives the quote form and its photos. Leave it blank to use only the prefilled email and text backup. The first real submission sends FormSubmit's activation email to reviveexterior@gmail.com. Open that link once so later submissions are delivered. Do not send a test just to trigger it.
- The quote on `/pricing/` is one form: name, phone, email, address, note, and photos. The Worker geocodes that address and measures from the satellite image plus the photos. Photos are required. The published paver sealing rates stay on the page as general information. `/contact/` redirects there and keeps the query string, including `?thanks=1`.
- `INSTANT_QUOTE_API` is the Cloudflare Worker URL that estimates square footage from a satellite image and the customer's photos, then prices the job. It is set to `https://shine-city-quote.shinecity.workers.dev`. The deploy steps and the request shape are in `worker/README.md`. The only required Worker secret is `OPENAI_API_KEY`. Geocoding and the satellite image use ArcGIS and Esri unless `GOOGLE_MAPS_KEY` is also set. A blank setting, or a Worker error, still emails the request and shows "We'll review and send your quote."
- `serviceArea` is the city list. Counties are Orange and Brevard. If you change cities, also update the sentences on `service-area/index.html` and the meta descriptions that name cities.

The visible price lines in the HTML are a no-JavaScript fallback. If the rates change, update those sentences and the meta descriptions on the home page, the pricing page, and the paver sealing page so they match the config.

## Pages

- `/` home, with a short paver sealing price teaser in the hero
- `/pricing/` instant quote and the paver sealing rate line. Sealer stripping stays on `/sealer-stripping/` and `/paver-sealing/`. The neighbor discount stays on `/paver-sealing/`.
- `/contact/` redirects to `/pricing/`
- `/paver-sealing/` prices, the square-foot estimate, and stripping
- `/gallery/` cleaning photos (prep for sealing, not sealed finishes)
- `/first-seal/` and `/new-pavers/` redirect to `/paver-sealing/`
- `/sealer-stripping/` strip only at $2.25 per sq ft. Re-sand and reseal are priced separately. Not used by the instant quote.
- `/soft-washing/` soft washing for stucco, siding, and stone veneer
- `/pressure-washing/` pressure washing for concrete and screen enclosures
- `/service-area/` Orange County and Brevard County
- `/about/`
- `/contact/` free quote
- `/review/` Google review landing page (leave its review link as it is)
- `404.html` unknown URLs

Job photos live in `images/gallery/` with `manifest.json`. The gallery opens on paver, walkway, and pool deck cleaning. Soft washing and pressure washing have their own filters. Captions may name Orlando, East Orlando, or Titusville. Do not add street names or house numbers.

The homepage video under the pricing hero stays a placeholder until `processVideo.src` (or `processVideo.youtubeId`) is set in `js/site-config.js`. Do not invent a video file.

There are no sealed before/after photos yet. The “Coming soon: before / after cleaning / after sealing” frames on the paver sealing page and the gallery are the drop-in for the next job: three images, in that order. Do not label a cleaning photo as sealer.

About has a hidden spot for a photo of Nick or the truck, and a hidden spot for a short video. Leave both hidden until the real file or URL exists. Do not add stock photos or sample reviews.

`sitemap.xml`, `robots.txt`, `CNAME`, and `.nojekyll` stay at the repo root.
