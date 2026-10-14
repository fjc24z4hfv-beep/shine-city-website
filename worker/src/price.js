/* Paver sealing rates. Keep these in step with js/site-config.js.
   At or under 800 sq ft: $2.00 on every square foot.
   Over 800 sq ft: $1.75 on every square foot, for the whole job.
   There is no flat promotional price. */

export var BREAKPOINT_SQFT = 800;
export var RATE_UP_TO_CENTS = 200;
export var RATE_OVER_CENTS = 175;
export var MAX_SQFT = 50000;

export function priceForSqft(sqft) {
  var n = Math.round(Number(sqft));
  if (!isFinite(n) || n <= 0 || n > MAX_SQFT) return null;
  var rateCents = n <= BREAKPOINT_SQFT ? RATE_UP_TO_CENTS : RATE_OVER_CENTS;
  return {
    sqft: n,
    rateCents: rateCents,
    totalCents: Math.round(n * rateCents)
  };
}

export function moneyFromCents(cents) {
  var abs = Math.abs(cents);
  var dollars = Math.floor(abs / 100);
  var rem = abs % 100;
  return "$" + dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
}
