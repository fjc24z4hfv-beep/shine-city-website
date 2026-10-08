/* Shared site behavior: menu, pricing from SHINE_CITY, estimate calculator, quote form. */
(function (global) {
  "use strict";

  var cfg = global.SHINE_CITY;

  function moneyFromCents(cents) {
    var negative = cents < 0;
    var abs = Math.abs(cents);
    var dollars = Math.floor(abs / 100);
    var rem = abs % 100;
    var body = dollars.toLocaleString("en-US") + "." + (rem < 10 ? "0" : "") + rem;
    return (negative ? "-$" : "$") + body;
  }

  function rateCents(rate) {
    return Math.round(rate * 100);
  }

  function formatSqft(n) {
    if (Math.abs(n - Math.round(n)) < 1e-6) return Math.round(n).toLocaleString("en-US");
    return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }

  /* Whole-job estimate. sqft at or under the breakpoint uses rateUpTo.
     sqft over the breakpoint uses rateOver on every square foot.
     Returns null when sqft is missing or not a positive finite number.
     tooLarge is an input guard, not a published maximum. */
  function estimate(sqft) {
    var pricing = cfg.pricing.paverSealing;
    var n = typeof sqft === "number" ? sqft : parseFloat(sqft);
    if (!isFinite(n) || n <= 0) return null;
    if (n > 50000) return { tooLarge: true };
    var over = n > pricing.breakpointSqFt;
    var centsPer = rateCents(over ? pricing.rateOver : pricing.rateUpTo);
    var total = Math.round(n * centsPer);
    var bp = pricing.breakpointSqFt.toLocaleString("en-US");
    return {
      sqft: n,
      over: over,
      rateCents: centsPer,
      totalCents: total,
      tierLabel: over ? "Over " + bp + " sq ft" : "Up to " + bp + " sq ft",
      includes: pricing.includes
    };
  }

  function tierModel() {
    var pricing = cfg.pricing.paverSealing;
    var bp = pricing.breakpointSqFt.toLocaleString("en-US");
    return [
      {
        title: "Up to " + bp + " sq ft",
        rate: pricing.rateUpTo,
        detail: "The rate for the whole job when the paved area is " + bp + " sq ft or less."
      },
      {
        title: "Over " + bp + " sq ft",
        rate: pricing.rateOver,
        detail: "A lower rate, applied to every square foot, when the job is over " + bp + " sq ft."
      }
    ];
  }

  function compactRateText() {
    var pricing = cfg.pricing.paverSealing;
    var bp = pricing.breakpointSqFt.toLocaleString("en-US");
    return moneyFromCents(rateCents(pricing.rateUpTo)) + " per sq ft up to " + bp +
      " sq ft. " + moneyFromCents(rateCents(pricing.rateOver)) + " per sq ft over " + bp + " sq ft.";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTiers(root) {
    var pricing = cfg.pricing.paverSealing;
    var html = tierModel().map(function (tier) {
      return '<article class="tier">' +
        '<h3 class="tier__title">' + escapeHtml(tier.title) + '</h3>' +
        '<p class="tier__rate"><span>' + moneyFromCents(rateCents(tier.rate)) + '</span> per sq ft</p>' +
        '<p class="tier__includes">' + escapeHtml(pricing.name) + ": " + escapeHtml(pricing.includes) + ".</p>" +
        '<p class="tier__detail">' + escapeHtml(tier.detail) + "</p>" +
        "</article>";
    }).join("");
    root.innerHTML = html;
  }

  function renderAreas() {
    var lists = document.querySelectorAll("[data-area-list]");
    Array.prototype.forEach.call(lists, function (list) {
      var countyName = list.getAttribute("data-area-list");
      var county = null;
      cfg.serviceArea.forEach(function (item) {
        if (item.name === countyName) county = item;
      });
      if (!county) return;
      list.innerHTML = county.cities.map(function (city) {
        return "<li>" + escapeHtml(city) + "</li>";
      }).join("");
    });
  }

  function buildAreaServed() {
    var areas = [];
    cfg.serviceArea.forEach(function (county) {
      areas.push({
        "@type": "AdministrativeArea",
        name: county.name,
        containedInPlace: { "@type": "State", name: "Florida" }
      });
      county.cities.forEach(function (city) {
        areas.push({
          "@type": "Place",
          name: city,
          containedInPlace: { "@type": "AdministrativeArea", name: county.name + ", Florida" }
        });
      });
    });
    return areas;
  }

  function buildOffers() {
    var pricing = cfg.pricing.paverSealing;
    var bp = pricing.breakpointSqFt;
    function offer(title, rate, detail) {
      return {
        "@type": "Offer",
        name: title,
        description: pricing.name + " (" + pricing.includes + "). " + detail +
          " Final price is confirmed after a free on-site look.",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: rate.toFixed(2),
          priceCurrency: "USD",
          unitText: "sq ft",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "FTK",
            unitText: "square foot"
          }
        }
      };
    }
    return [
      offer(
        "Paver sealing up to " + bp + " sq ft",
        pricing.rateUpTo,
        "For jobs of " + bp + " square feet or less, at " + pricing.rateUpTo.toFixed(2) + " per square foot for the whole job."
      ),
      offer(
        "Paver sealing over " + bp + " sq ft",
        pricing.rateOver,
        "For jobs over " + bp + " square feet, at " + pricing.rateOver.toFixed(2) + " per square foot for the whole job."
      )
    ];
  }

  function refreshJsonLd() {
    var el = document.getElementById("business-jsonld");
    if (!el) return;
    try {
      var data = JSON.parse(el.textContent);
      data.areaServed = buildAreaServed();
      data.makesOffer = buildOffers();
      el.textContent = JSON.stringify(data);
    } catch (err) {
      /* Leave the static JSON-LD in place if it cannot be parsed. */
    }
  }

  function renderCalculator(box) {
    var input = box.querySelector("[data-calc-input]");
    var output = box.querySelector("[data-calc-output]");
    if (!input || !output) return;

    function draw() {
      var raw = input.value.trim();
      if (!raw) {
        output.innerHTML = "<span>Enter square feet for an estimate from the published rates.</span>";
        return;
      }
      var result = estimate(raw);
      if (!result) {
        output.textContent = "Enter a size greater than zero.";
        return;
      }
      if (result.tooLarge) {
        output.textContent = "For an area that large, call or text and we'll walk it with you.";
        return;
      }
      var line = formatSqft(result.sqft) + " sq ft × " + moneyFromCents(result.rateCents) +
        " per sq ft = " + moneyFromCents(result.totalCents);
      output.innerHTML =
        '<strong class="calc__total">' + moneyFromCents(result.totalCents) + "</strong>" +
        "<span>" + escapeHtml(line) + ".</span>" +
        "<span>" + escapeHtml(result.tierLabel) + " rate, for the whole job. " +
        escapeHtml(result.includes) + ".</span>" +
        "<span>Estimate only. Final price is confirmed after a free on-site look.</span>";
    }

    input.addEventListener("input", draw);
  }

  function quoteBody(form) {
    function val(name) {
      var field = form.elements[name];
      return field && field.value ? field.value.trim() : "";
    }
    return [
      "Shine City quote request",
      "",
      "Name: " + val("name"),
      "Phone: " + val("phone"),
      "Email: " + (val("email") || "(none)"),
      "Street address: " + val("street_address"),
      "ZIP: " + val("zip"),
      "Service: " + val("service"),
      "Paver age: " + val("paver_age")
    ].join("\n");
  }

  function bindQuoteForm(form) {
    var note = form.querySelector("[data-form-note]");
    var panel = form.querySelector("[data-form-result]");
    if (cfg.FORM_ENDPOINT && note) {
      note.textContent = "Submitting sends your request to Shine City. We use it only to reply about your quote.";
    }

    form.addEventListener("submit", function (event) {
      var trap = form.querySelector('[name="_gotcha"]');
      if (trap && trap.value) {
        event.preventDefault();
        return;
      }
      if (!form.checkValidity()) return;

      if (cfg.FORM_ENDPOINT) {
        event.preventDefault();
        form.action = cfg.FORM_ENDPOINT;
        form.method = "post";
        form.enctype = "application/x-www-form-urlencoded";
        form.submit();
        return;
      }

      event.preventDefault();
      var body = quoteBody(form);
      var nameField = form.elements.name.value.trim();
      var subject = "Quote request" + (nameField ? " from " + nameField : "");
      var mailto = "mailto:" + cfg.email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      var sms = "sms:+" + cfg.phoneTel.replace(/\D/g, "") + "?&body=" + encodeURIComponent(body);

      if (panel) {
        panel.hidden = false;
        var mailLink = panel.querySelector("[data-mailto-link]");
        var smsLink = panel.querySelector("[data-sms-link]");
        if (mailLink) mailLink.href = mailto;
        if (smsLink) smsLink.href = sms;
      }
      window.location.href = mailto;
    });
  }

  function bindNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      var label = toggle.querySelector(".nav-toggle__label");
      if (label) label.textContent = open ? "Close" : "Menu";
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!header || header.contains(event.target)) return;
      if (toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  global.ShineCity = {
    estimate: estimate,
    moneyFromCents: moneyFromCents,
    compactRateText: compactRateText
  };

  function init() {
    document.querySelectorAll("[data-pricing-tiers]").forEach(renderTiers);
    document.querySelectorAll("[data-price-compact]").forEach(function (el) {
      el.textContent = compactRateText();
    });
    renderAreas();
    refreshJsonLd();
    document.querySelectorAll("[data-calculator]").forEach(renderCalculator);
    document.querySelectorAll("[data-quote-form]").forEach(bindQuoteForm);
    bindNav();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
