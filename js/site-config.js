/* Shine City site settings
   Edit this file to change published paver sealing rates, the service-area
   city list, and how the quote form is delivered.

   PAVER SEALING RATES — confirmed by the owner.
   The whole job is priced at one tier rate. It is not split across tiers.
   Up to 1,000 sq ft is $1.95 per sq ft. A 1,000 sq ft job is $1,950.
   Over 1,000 sq ft, through 2,000, is $1.75 per sq ft. A 1,500 sq ft job is $2,625.
   Over 2,000 sq ft is $1.50 per sq ft. A 2,500 sq ft job is $3,750.
   A price never drops below the largest job in the tier below it:
   over 1,000 through 2,000, at least 1,000 × $1.95 ($1,950);
   over 2,000, at least 2,000 × $1.75 ($3,500).
   Then the job is at least $750.
   Publish the $750 minimum. Do not explain the no-drop rule on the site.
   The rate is for paver sealing: clean, re-sand joints, and seal.
   Sealer stripping is a separate published rate: strip only, re-sand and reseal not included.
   It is not used by the paver sealing calculator or the instant quote.
   House washing and pressure washing: call or text for an estimate. Do not add a published wash price.
   The door-hanger flat special is not a website price. Do not add it here.

   Visible tier cards, the estimate calculator, and the price fields in
   JSON-LD are filled from pricing.paverSealing.tiers below.
   maxSqFt is inclusive. The last tier has no maxSqFt.
   If the numbers change, also update the matching sentences in:
     - index.html (hero tier fallback, FAQ, meta description)
     - pricing/index.html (hero lede, quote card price line, meta description)
     - paver-sealing/index.html (tier fallback, meta description)
     - pressure-washing/index.html and contact/index.html
     - the static makesOffer block in each page's business JSON-LD
*/
var SHINE_CITY = {
  name: "Shine City Paver Sealing & Exterior Cleaning",
  legalName: "Revive Exterior Cleaning LLC",
  owner: "Nick Urbano",
  url: "https://shinecitypaversealing.com/",
  phoneDisplay: "321-795-0313",
  phoneTel: "+13217950313",
  email: "reviveexterior@gmail.com",
  regionPhrase: "Orlando & Central Florida",
  reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJhw8ynC9JzigRu_68uv9DBQM",

  /* Homepage video, directly under the pricing hero.
     Drop in a self-hosted file by setting src, for example:
     "/videos/sealing-process.mp4"
     poster is optional (an image path). Leave src "" until the file exists.
     To use YouTube instead, leave src "" and set youtubeId to the video id.
     If src is set, it is used and youtubeId is ignored.
     Empty src and youtubeId show the "Video coming soon" placeholder. */
  processVideo: {
    src: "/videos/pool-deck-sealing.mp4",
    poster: "/videos/pool-deck-sealing-poster.jpg",
    youtubeId: ""
  },

  /* Quote form delivery. Photos are sent with the request.
     FORM_ENDPOINT is the FormSubmit address that accepts file attachments
     (a normal multipart post, not the /ajax/ address). The script posts
     the form there, including compressed photos, and shows a thank-you
     on this page. If that post fails, the form opens a prefilled email
     and offers a text. Photos cannot ride along in that fallback.
     Leave "" to use only the email and text fallback.
     The same address is the form's action, so a browser without
     JavaScript still posts the form and its photos.
     The quote form lives on /pricing/. /contact/ redirects there.
     The first real submission emails reviveexterior@gmail.com a
     FormSubmit activation link. Until that link is opened, submissions
     are not delivered. Do not send a test entry. */
  FORM_ENDPOINT: "https://formsubmit.co/reviveexterior@gmail.com",

  /* Instant estimate. The deployed Cloudflare Worker (see worker/README.md).
     An empty value, or a Worker that fails, still emails the quote and
     tells the customer we'll review and send it.
     API keys stay in the Worker. Do not put them in this file. */
  INSTANT_QUOTE_API: "https://shine-city-quote.shinecity.workers.dev",

  pricing: {
    paverSealing: {
      name: "Paver sealing",
      includes: "Clean, re-sand joints, and seal",
      minimum: 750,
      tiers: [
        { maxSqFt: 1000, rate: 1.95 },
        { maxSqFt: 2000, rate: 1.75 },
        { maxSqFt: null, rate: 1.5 }
      ]
    },
    /* Strip only. Do not fold this into paverSealing or the instant quote. */
    sealerStripping: {
      name: "Sealer stripping",
      rate: 2.25
    }
  },

  /* Counties are confirmed: Orange County and Brevard County, Florida.
     Do not add Seminole, Osceola, or Lake County.
     Do not add Kissimmee or St. Cloud.
     The city names below are the working list and still need owner review. */
  serviceArea: [
    {
      name: "Orange County",
      cities: ["Orlando", "Winter Garden", "Horizon West", "Lake Nona", "Sunbridge", "East Orlando"]
    },
    {
      name: "Brevard County",
      cities: ["Melbourne", "Palm Bay", "Viera", "Titusville", "Cocoa", "Rockledge", "Merritt Island", "Cocoa Beach"]
    }
  ]
};
