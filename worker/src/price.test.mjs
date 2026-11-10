import assert from "node:assert/strict";
import { moneyFromCents, priceForSqft, priceWash } from "./price.js";

var example = priceWash(1800, 600, 1);
assert.equal(example.houseCents, 27000);
assert.equal(example.drivewayCents, 20000);
assert.equal(example.regularCents, 47000);
assert.equal(example.savingsCents, 9400);
assert.equal(example.totalCents, 37600);
assert.equal(moneyFromCents(example.totalCents), "$376.00");
assert.equal(example.stories, 1);
assert.equal(example.houseRateCents, 15);
assert.equal(example.drivewayRateCents, 20);

var twoStory = priceWash(1800, 1500, 2);
assert.equal(twoStory.houseCents, 40500);
assert.equal(twoStory.drivewayCents, 30000);
assert.equal(twoStory.houseRateCents, 22.5);
assert.equal(twoStory.regularCents, 70500);
assert.equal(twoStory.savingsCents, 14100);
assert.equal(twoStory.totalCents, 56400);

var twoStoryMinimum = priceWash(1100, 1000, 2);
assert.equal(Math.round(1100 * 45 / 2), 24750);
assert.equal(twoStoryMinimum.houseCents, 25000);
assert.equal(twoStoryMinimum.houseRateCents, 22.5);

var roundedFootprint = priceWash(2001, 1000, 2);
assert.equal(roundedFootprint.houseCents, 45023);

var minimums = priceWash(100, 50, 1);
assert.equal(minimums.houseCents, 25000);
assert.equal(minimums.drivewayCents, 20000);
assert.equal(minimums.regularCents, 45000);
assert.equal(minimums.savingsCents, 9000);
assert.equal(minimums.totalCents, 36000);

var exactDrivewayMinimum = priceWash(2000, 1000, 2);
assert.equal(exactDrivewayMinimum.houseCents, 45000);
assert.equal(exactDrivewayMinimum.drivewayCents, 20000);
assert.equal(exactDrivewayMinimum.regularCents, 65000);
assert.equal(exactDrivewayMinimum.totalCents, 52000);

assert.equal(priceWash(1800, 600, 3), null);
assert.equal(priceWash(1800, 600, 0), null);
assert.equal(priceWash(0, 600, 1), null);
assert.equal(priceWash(1800, 0, 1), null);
assert.equal(priceWash("nope", 600, 1), null);

var seal = priceForSqft(720);
assert.equal(seal.sqft, 720);
assert.equal(seal.rateCents, 195);
assert.equal(seal.totalCents, 140400);
assert.equal(priceForSqft(300).totalCents, 75000);
assert.equal(priceForSqft(1000).totalCents, 195000);
assert.equal(priceForSqft(1500).totalCents, 262500);
assert.equal(priceForSqft(2500).totalCents, 375000);

console.log("price tests passed");
