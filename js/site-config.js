/* Shine City site settings
   Edit this file to change published paver sealing rates, the service-area
   city list, and how the quote form is delivered.

   PAVER SEALING RATES — confirmed by the owner.
   Jobs at or under breakpointSqFt use rateUpTo for every square foot.
   Jobs over breakpointSqFt use rateOver for every square foot (not a blend).
   The rate is for paver sealing: clean, re-sand joints, and seal.
   No job minimum is set. Do not add one.
   Stripping/resealing and house or pressure washing have no published price.
   The door-hanger flat special is not a website price. Do not add it here.

   Visible tier cards, the estimate calculator, and the price fields in
   JSON-LD are filled from the three numbers below.
   If the numbers change, also update the matching sentences in:
     - index.html (hero rate line, tier fallback, FAQ, meta description)
     - paver-sealing/index.html (intro, tier fallback, meta description)
     - first-seal/index.html and contact/index.html (the rate sentences)
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

  /* ONE-LINE SWITCH for the quote form.
     Leave "" to open a prefilled email (the form also offers a text).
     Set a Formspree-style URL to POST the form instead, for example:
     "https://formspree.io/f/xxxxxxxx" */
  FORM_ENDPOINT: "",

  pricing: {
    paverSealing: {
      name: "Paver sealing",
      includes: "Clean, re-sand joints, and seal",
      breakpointSqFt: 800,
      rateUpTo: 2.0,
      rateOver: 1.75
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
