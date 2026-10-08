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

- `/` home
- `/paver-sealing/` paver sealing and the square-foot estimate
- `/first-seal/` First Seal Program
- `/sealer-stripping/` stripping and resealing
- `/pressure-washing/` house washing and pressure washing
- `/service-area/` Orange County and Brevard County
- `/about/`
- `/contact/` free quote
- `/review/` Google review landing page (leave its review link as it is)
- `404.html` unknown URLs

`sitemap.xml`, `robots.txt`, `CNAME`, and `.nojekyll` stay at the repo root.
