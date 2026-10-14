/* Paver sealing rates. Keep these in step with js/site-config.js.
   The first 800 sq ft are $2.00 each.
   Only the square footage above 800 is $1.75 each.
   A 1,000 sq ft job is $1,600 plus 200 sq ft at $1.75, which is $1,950.
   There is no job minimum and no flat promotional price. */

export var BREAKPOINT_SQFT = 800;
export var RATE_UP_TO_CENTS = 200;
export var RATE_OVER_CENTS = 175;
export var MAX_SQFT = 50000;

export function priceForSqft(sqft) {
  var n = Math.round(Number(sqft));
  if (!isFinite(n) || n <= 0 || n > MAX_SQFT) return null;
  var first = Math.min(n, BREAKPOINT_SQFT);
  var extra = n - first;
  var firstCents = first * RATE_UP_TO_CENTS;
  var extraCents = extra * RATE_OVER_CENTS;
  return {
    sqft: n,
    firstSqft: first,
    extraSqft: extra,
    rateCents: extra > 0 ? RATE_OVER_CENTS : RATE_UP_TO_CENTS,
    firstCents: firstCents,
    extraCents: extraCents,
    totalCents: firstCents + extraCents
  };
}

export function moneyFromCents(cents) {
  var abs = Math.abs(cents);
  var dollars = Math.floor(abs / 100);
  var rem = abs % 100;
  return "$" + dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
}
