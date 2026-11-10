import assert from "node:assert/strict";
import { moneyFromCents, priceForSqft, priceWash } from "./price.js";

var example = priceWash(1800, 600, 1);
assert.equal(example.houseCents, 36000);
assert.equal(example.drivewayCents, 20000);
assert.equal(example.regularCents, 56000);
assert.equal(example.savingsCents, 11200);
assert.equal(example.totalCents, 44800);
assert.equal(moneyFromCents(example.totalCents), "$448.00");
assert.equal(example.stories, 1);
assert.equal(example.houseRateCents, 20);
assert.equal(example.drivewayRateCents, 20);

var oneStoryHouse = priceWash(1800, 1000, 1);
assert.equal(oneStoryHouse.houseCents, 36000);

var twoStory = priceWash(1100, 1000, 2);
assert.equal(twoStory.houseCents, 33000);
assert.equal(twoStory.houseRateCents, 30);

var oneStoryMinimum = priceWash(1000, 1000, 1);
assert.equal(oneStoryMinimum.houseCents, 25000);
assert.equal(oneStoryMinimum.drivewayCents, 20000);

assert.equal(priceWash(1800, 600, 3), null);
assert.equal(priceWash(1800, 600, 0), null);
assert.equal(priceWash(0, 600, 1), null);
assert.equal(priceWash(1800, 0, 1), null);
assert.equal(priceWash("nope", 600, 1), null);

var seal = priceForSqft(720);
assert.equal(seal.sqft, 720);
assert.equal(seal.rateCents, 175);
assert.equal(seal.totalCents, 126000);
assert.equal(priceForSqft(300).totalCents, 75000);
assert.equal(priceForSqft(800).totalCents, 140000);
assert.equal(priceForSqft(1000).totalCents, 175000);
assert.equal(priceForSqft(1001).totalCents, 175000);
assert.equal(priceForSqft(1500).totalCents, 225000);
assert.equal(priceForSqft(2000).totalCents, 300000);
assert.equal(priceForSqft(2001).totalCents, 300000);
assert.equal(priceForSqft(2500).totalCents, 325000);
assert.equal(priceForSqft(2500).rateCents, 130);

console.log("price tests passed");
