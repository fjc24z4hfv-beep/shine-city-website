/* Paver sealing rates. Keep these in step with js/site-config.js.
   The whole job uses one tier rate. It is not split across tiers.
   Up to 1,000 sq ft is $1.95. A 1,000 sq ft job is $1,950.
   Over 1,000 through 2,000 sq ft is $1.75. A 1,500 sq ft job is $2,625.
   Over 2,000 sq ft is $1.50. A 2,500 sq ft job is $3,750.
   A price never drops below the largest job in the tier below:
   over 1,000 through 2,000, at least 1,000 × $1.95;
   over 2,000, at least 2,000 × $1.75.
   Then the job is at least $750.
   maxSqFt is inclusive. The last tier has no maxSqFt.
   There is no flat promotional price. */

export var TIERS = [
  { maxSqFt: 1000, rateCents: 195 },
  { maxSqFt: 2000, rateCents: 175 },
  { maxSqFt: null, rateCents: 150 }
];
export var MINIMUM_CENTS = 75000;
export var MAX_SQFT = 50000;

export function priceForSqft(sqft) {
  var n = Math.round(Number(sqft));
  if (!isFinite(n) || n <= 0 || n > MAX_SQFT) return null;
  var tier = TIERS[TIERS.length - 1];
  var index = TIERS.length - 1;
  var i;
  for (i = 0; i < TIERS.length; i++) {
    if (TIERS[i].maxSqFt == null || n <= TIERS[i].maxSqFt) {
      tier = TIERS[i];
      index = i;
      break;
    }
  }
  var total = n * tier.rateCents;
  if (index > 0) {
    var prev = TIERS[index - 1];
    var hold = prev.maxSqFt * prev.rateCents;
    if (hold > total) total = hold;
  }
  if (total < MINIMUM_CENTS) total = MINIMUM_CENTS;
  return {
    sqft: n,
    rateCents: tier.rateCents,
    totalCents: total
  };
}

export function moneyFromCents(cents) {
  var abs = Math.abs(cents);
  var dollars = Math.floor(abs / 100);
  var rem = abs % 100;
  return "$" + dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
}
