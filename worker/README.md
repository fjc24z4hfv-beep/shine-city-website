# Shine City instant quote Worker

This Cloudflare Worker prices a paver sealing job after a customer sends an address and photos. It is not deployed by the website pull request. Nick deploys it, then pastes the Worker URL into `INSTANT_QUOTE_API` in `js/site-config.js`.

Until that setting is a real URL, the website still emails the quote and tells the customer: "We'll review and send your quote."

The Worker:

1. Accepts a POST only from `https://shinecitypaversealing.com` or `https://www.shinecitypaversealing.com`.
2. Limits each IP to 8 requests an hour.
3. Geocodes the address with the ArcGIS World Geocoding service (`findAddressCandidates`, no key) and keeps Orange County and Brevard County, Florida.
4. Downloads an Esri World Imagery satellite image at zoom 20, about 640 pixels on a side, centered on that point. No key.
5. Sends that image plus the customer's photos to a vision model.
6. Prices the returned square footage on the server: the first 800 sq ft at $2.00, and only the square footage above 800 at $1.75. A 1,000 sq ft job is $1,950.
7. Returns the square footage, price in cents, confidence, and a Google Maps satellite link. That link is only a URL. It does not use a Google key.

If `GOOGLE_MAPS_KEY` is set, steps 3 and 4 use Google Geocoding and the Google Maps Static API instead of ArcGIS and Esri. Leave that secret unset unless you want Google.

Secrets stay in the Worker. They are never written into the website. The only required secret is `OPENAI_API_KEY`.

## 1. Vision model key

Use one provider. OpenAI is the default (`VISION_PROVIDER = "openai"` in `wrangler.toml`).

**OpenAI**

1. Open [OpenAI API keys](https://platform.openai.com/api-keys) and create a key.
2. The Worker calls `gpt-4o` unless you change `OPENAI_MODEL`.
3. Add billing on the OpenAI account. Each quote sends the satellite image and the customer photos.

**Gemini instead**

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.
2. In `wrangler.toml`, set `VISION_PROVIDER = "gemini"` before deploy. The default model is `gemini-2.5-flash` (`GEMINI_MODEL`).
3. You do not need an OpenAI key if Gemini is the provider.

## 2. Install Wrangler and sign in

From this `worker` directory, on your own computer:

```bash
npx wrangler login
```

Node.js 20 or newer is required. `npx` downloads Wrangler for the command. You do not add Wrangler to the website.

## 3. Store the secret

Still inside `worker`. This is the only secret you need:

```bash
npx wrangler secret put OPENAI_API_KEY
```

Paste the key when prompted. If you chose Gemini instead, skip the OpenAI secret and run:

```bash
npx wrangler secret put GEMINI_API_KEY
```

Confirm the names with:

```bash
npx wrangler secret list
```

### Optional: Google instead of Esri

You do not need a Google key. ArcGIS geocodes the address and Esri supplies the satellite image.

To use Google for both the lookup and the image, create a key in [Google Cloud Console](https://console.cloud.google.com/) with Geocoding API and Maps Static API enabled, restrict the key to those two APIs, and do not add an HTTP referrer restriction (the Worker calls Google from Cloudflare). Then:

```bash
npx wrangler secret put GOOGLE_MAPS_KEY
```

Do not commit the key and do not put it in `js/site-config.js`. The email's Google Maps link is sent either way, and that link does not need a key.

## 4. Deploy

```bash
npx wrangler deploy
```

Wrangler prints a URL like `https://shine-city-quote.<account>.workers.dev`.

Optional custom domain: Cloudflare dashboard → Workers → shine-city-quote → Settings → Domains. A custom domain is not required.

## 5. Point the website at the Worker

In `js/site-config.js` set:

```js
INSTANT_QUOTE_API: "https://shine-city-quote.<account>.workers.dev",
```

Use the URL from the deploy output, with no trailing path. Commit that one line and merge only when you want the live site to start calling the Worker.

The browser on shinecitypaversealing.com is allowed. A local preview on another origin is rejected by the Worker, so the form there falls back to emailing the quote without an instant price. That is expected.

## What the browser sends

`POST` multipart form data:

- `address`
- `latitude` and `longitude` from the map confirmation (the Worker geocodes `address` itself)
- one or more `photo` files (at least one, up to six)

A success body looks like:

```json
{
  "ok": true,
  "sqft": 720,
  "priceCents": 144000,
  "confidence": "medium",
  "latitude": 28.25,
  "longitude": -80.74,
  "formattedAddress": "123 Example St, Viera, FL 32940, USA",
  "satelliteLink": "https://www.google.com/maps?q=28.25,-80.74&t=k&z=20"
}
```

`priceCents` 144000 is $1,440.00, which is 720 sq ft at $2.00. The website then emails that result, the address, the satellite link, and the photos through FormSubmit.

Any failure, including a missing Worker URL, returns the customer to "We'll review and send your quote." The email still goes out.
