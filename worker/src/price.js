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

/* Wash & Shine. Driveway cleaning is $0.20 per sq ft for concrete or pavers,
   with a $200 minimum. House soft wash uses the building footprint, one floor:
   $0.15 per sq ft for 1 story and $0.20 per sq ft for 2 stories, with a $250
   minimum. Each minimum is applied first. Then 20% comes off the combined
   total. Oil, rust, a pool cage, a fence, and a roof wash are not in this price.
   This does not change priceForSqft. */

export var WASH_DRIVEWAY_RATE_CENTS = 20;
export var WASH_DRIVEWAY_MINIMUM_CENTS = 20000;
export var WASH_HOUSE_RATE_CENTS = { 1: 15, 2: 20 };
export var WASH_HOUSE_MINIMUM_CENTS = 25000;
export var WASH_DISCOUNT_PERCENT = 20;

export function priceWash(houseSqft, drivewaySqft, stories) {
  var house = Math.round(Number(houseSqft));
  var driveway = Math.round(Number(drivewaySqft));
  var level = Number(stories);
  var houseRate = WASH_HOUSE_RATE_CENTS[level];
  if (!houseRate) return null;
  if (!isFinite(house) || house <= 0 || house > MAX_SQFT) return null;
  if (!isFinite(driveway) || driveway <= 0 || driveway > MAX_SQFT) return null;
  var houseCents = house * houseRate;
  if (houseCents < WASH_HOUSE_MINIMUM_CENTS) houseCents = WASH_HOUSE_MINIMUM_CENTS;
  var drivewayCents = driveway * WASH_DRIVEWAY_RATE_CENTS;
  if (drivewayCents < WASH_DRIVEWAY_MINIMUM_CENTS) drivewayCents = WASH_DRIVEWAY_MINIMUM_CENTS;
  var regularCents = houseCents + drivewayCents;
  var savingsCents = Math.round(regularCents * WASH_DISCOUNT_PERCENT / 100);
  return {
    houseSqft: house,
    drivewaySqft: driveway,
    stories: level,
    houseRateCents: houseRate,
    houseCents: houseCents,
    drivewayRateCents: WASH_DRIVEWAY_RATE_CENTS,
    drivewayCents: drivewayCents,
    regularCents: regularCents,
    savingsCents: savingsCents,
    totalCents: regularCents - savingsCents
  };
}

export function moneyFromCents(cents) {
  var abs = Math.abs(cents);
  var dollars = Math.floor(abs / 100);
  var rem = abs % 100;
  return "$" + dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
}
