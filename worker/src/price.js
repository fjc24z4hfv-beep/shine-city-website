/* Paver sealing rates. Keep these in step with js/site-config.js.
   The whole job uses one tier rate. It is not split across tiers.
   Up to 1,000 sq ft is $1.75. A 1,000 sq ft job is $1,750.
   Over 1,000 up to 2,000 sq ft is $1.50. A 1,500 sq ft job is $2,250.
   Over 2,000 sq ft is $1.35. A 2,500 sq ft job is $3,375.
   There is no job minimum and no flat promotional price.
   maxSqFt is inclusive. The last tier has no maxSqFt. */

export var TIERS = [
  { maxSqFt: 1000, rateCents: 175 },
  { maxSqFt: 2000, rateCents: 150 },
  { maxSqFt: null, rateCents: 135 }
];
export var MAX_SQFT = 50000;

export function priceForSqft(sqft) {
  var n = Math.round(Number(sqft));
  if (!isFinite(n) || n <= 0 || n > MAX_SQFT) return null;
  var tier = TIERS[TIERS.length - 1];
  var i;
  for (i = 0; i < TIERS.length; i++) {
    if (TIERS[i].maxSqFt == null || n <= TIERS[i].maxSqFt) {
      tier = TIERS[i];
      break;
    }
  }
  return {
    sqft: n,
    rateCents: tier.rateCents,
    totalCents: n * tier.rateCents
  };
}

export function moneyFromCents(cents) {
  var abs = Math.abs(cents);
  var dollars = Math.floor(abs / 100);
  var rem = abs % 100;
  return "$" + dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
}
