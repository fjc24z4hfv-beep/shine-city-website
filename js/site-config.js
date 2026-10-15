/* Shine City site settings
   Edit this file to change published paver sealing rates, the service-area
   city list, and how the quote form is delivered.

   PAVER SEALING RATES — confirmed by the owner.
   The first breakpointSqFt are priced at rateUpTo.
   Only the square footage above breakpointSqFt is priced at rateOver.
   A 1,000 sq ft job is the first 800 at $2.00 ($1,600) plus 200 at $1.75 ($350), which is $1,950.
   The rate is for paver sealing: clean, re-sand joints, and seal.
   No job minimum is set. Do not add one.
   Sealer stripping is a separate published rate: strip only, re-sand and reseal not included.
   It is not used by the paver sealing calculator or the instant quote.
   House washing and pressure washing: call or text for an estimate. Do not add a published wash price.
   The door-hanger flat special is not a website price. Do not add it here.

   Visible tier cards, the estimate calculator, and the price fields in
   JSON-LD are filled from the three numbers below.
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
  regionPhrase: "Orlando & the Space Coast",
  reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJhw8ynC9JzigRu_68uv9DBQM",

  /* Homepage video, directly under the pricing hero.
     Drop in a self-hosted file by setting src, for example:
     "/videos/sealing-process.mp4"
     poster is optional (an image path). Leave src "" until the file exists.
     To use YouTube instead, leave src "" and set youtubeId to the video id.
     If src is set, it is used and youtubeId is ignored.
     Empty src and youtubeId show the "Video coming soon" placeholder. */
  processVideo: {
    src: "",
    poster: "",
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
      breakpointSqFt: 800,
      rateUpTo: 2.0,
      rateOver: 1.75
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
