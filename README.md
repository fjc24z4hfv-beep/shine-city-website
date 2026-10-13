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

- `pricing.paverSealing.breakpointSqFt`, `rateUpTo`, and `rateOver` drive the price cards, the estimate calculator, and the price structured data.
- `FORM_ENDPOINT` is blank, so the quote form opens a prefilled email (and offers a text). Set it to a Formspree-style URL to POST the form instead. That is a one-line change.
- `serviceArea` is the city list. Counties are Orange and Brevard. If you change cities, also update the sentences on `service-area/index.html` and the meta descriptions that name cities.

The visible price lines in the HTML are a no-JavaScript fallback. If the rates change, update those sentences and the meta descriptions on the home page and the paver sealing page so they match the config.

## Pages

- `/` home, with paver sealing prices in the hero
- `/paver-sealing/` prices, the square-foot estimate, First Seal, and stripping
- `/gallery/` cleaning photos (prep for sealing, not sealed finishes)
- `/first-seal/` First Seal Program
- `/sealer-stripping/` stripping and resealing
- `/pressure-washing/` also offered: house washing and pressure washing
- `/service-area/` Orange County and Brevard County
- `/about/`
- `/contact/` free quote
- `/review/` Google review landing page (leave its review link as it is)
- `404.html` unknown URLs

Job photos live in `images/gallery/` with `manifest.json`. The gallery opens on paver, walkway, and pool deck cleaning. House washing and other cleaning are behind the later filters. Captions may name Orlando, East Orlando, or Titusville. Do not add street names or house numbers.

There are no sealed before/after photos yet. The “Coming soon: before / after cleaning / after sealing” frames on the paver sealing page and the gallery are the drop-in for the next job: three images, in that order. Do not label a cleaning photo as sealer.

About has a hidden spot for a photo of Nick or the truck, and a hidden spot for a short video. Leave both hidden until the real file or URL exists. Do not add stock photos or sample reviews.

`sitemap.xml`, `robots.txt`, `CNAME`, and `.nojekyll` stay at the repo root.
