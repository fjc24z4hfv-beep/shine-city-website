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

  /* Whole-job tiers. maxSqFt is inclusive. The last tier has no max.
     The entire area uses that one rate. It is not split across tiers.
     Returns null when sqft is missing or not a positive finite number.
     tooLarge is an input guard, not a published maximum. */
  function sealingTiers() {
    return cfg.pricing.paverSealing.tiers;
  }

  /* Straight tier price, then hold the previous tier's top price so a
     larger area never estimates lower, then apply the job minimum.
     The no-drop hold is not mentioned in customer-facing copy. */
  function estimate(sqft) {
    var pricing = cfg.pricing.paverSealing;
    var n = typeof sqft === "number" ? sqft : parseFloat(sqft);
    if (!isFinite(n) || n <= 0) return null;
    if (n > 50000) return { tooLarge: true };
    var tiers = sealingTiers();
    var tier = tiers[tiers.length - 1];
    var index = tiers.length - 1;
    var i;
    for (i = 0; i < tiers.length; i++) {
      if (tiers[i].maxSqFt == null || n <= tiers[i].maxSqFt) {
        tier = tiers[i];
        index = i;
        break;
      }
    }
    var cents = rateCents(tier.rate);
    var straight = Math.round(n * cents);
    var total = straight;
    if (index > 0) {
      var prev = tiers[index - 1];
      var hold = Math.round(prev.maxSqFt * rateCents(prev.rate));
      if (hold > total) total = hold;
    }
    var minimumCents = rateCents(pricing.minimum || 0);
    var minimumApplied = minimumCents > 0 && total < minimumCents;
    if (minimumApplied) total = minimumCents;
    return {
      sqft: n,
      rateCents: cents,
      straightCents: straight,
      totalCents: total,
      minimumCents: minimumCents,
      minimumApplied: minimumApplied,
      includes: pricing.includes
    };
  }

  function minimumLabel() {
    var dollars = cfg.pricing.paverSealing.minimum || 0;
    return "$" + Number(dollars).toLocaleString("en-US") + " minimum";
  }

  function priceSentence(result) {
    if (result.totalCents === result.straightCents) {
      return formatSqft(result.sqft) + " sq ft × " + moneyFromCents(result.rateCents) +
        " per sq ft = " + moneyFromCents(result.totalCents);
    }
    if (result.minimumApplied) {
      return formatSqft(result.sqft) + " sq ft. " + minimumLabel();
    }
    return formatSqft(result.sqft) + ".";
  }

  function tierModel() {
    var tiers = sealingTiers();
    return tiers.map(function (tier, index) {
      var title;
      var detail;
      if (index === 0) {
        title = "Up to " + formatSqft(tier.maxSqFt) + " sq ft";
        detail = "The whole job is this rate when the area is " + formatSqft(tier.maxSqFt) + " sq ft or less.";
      } else if (tier.maxSqFt == null) {
        var floor = tiers[index - 1].maxSqFt;
        title = "Over " + formatSqft(floor) + " sq ft";
        detail = "The whole job is this rate when the area is over " + formatSqft(floor) + " sq ft.";
      } else {
        var above = tiers[index - 1].maxSqFt;
        title = formatSqft(above) + "–" + formatSqft(tier.maxSqFt) + " sq ft";
        detail = "The whole job is this rate when the area is over " + formatSqft(above) +
          " sq ft, up to " + formatSqft(tier.maxSqFt) + ".";
      }
      return { title: title, rate: tier.rate, detail: detail };
    });
  }

  function compactRateParts() {
    var tiers = sealingTiers();
    var parts = tiers.map(function (tier, index) {
      var rate = moneyFromCents(rateCents(tier.rate)) + "/sq ft";
      if (index === 0) return rate + " up to " + formatSqft(tier.maxSqFt) + " sq ft";
      var prev = tiers[index - 1].maxSqFt;
      if (tier.maxSqFt == null) return rate + " over " + formatSqft(prev);
      return rate + " " + formatSqft(prev) + "–" + formatSqft(tier.maxSqFt);
    });
    if (cfg.pricing.paverSealing.minimum) parts.push(minimumLabel());
    return parts;
  }

  function compactRateText() {
    return compactRateParts().join(" · ");
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
    var compact = root.hasAttribute("data-pricing-compact");
    var html = tierModel().map(function (tier) {
      var extra = compact ? "" :
        '<p class="tier__includes">' + escapeHtml(pricing.name) + ": " + escapeHtml(pricing.includes) + ".</p>" +
        '<p class="tier__detail">' + escapeHtml(tier.detail) + "</p>";
      return '<article class="tier' + (compact ? " tier--compact" : "") + '">' +
        '<h3 class="tier__title">' + escapeHtml(tier.title) + "</h3>" +
        '<p class="tier__rate"><span>' + moneyFromCents(rateCents(tier.rate)) + "</span> per sq ft</p>" +
        extra +
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
    var tiers = pricing.tiers;
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
    var strip = cfg.pricing.sealerStripping;
    var offers = tiers.map(function (tier, index) {
      var rateText = "$" + tier.rate.toFixed(2);
      if (index === 0) {
        return offer(
          "Paver sealing, up to " + formatSqft(tier.maxSqFt) + " sq ft",
          tier.rate,
          "The whole job up to " + formatSqft(tier.maxSqFt) + " square feet is " + rateText + " per square foot. " + minimumLabel() + "."
        );
      }
      var prev = formatSqft(tiers[index - 1].maxSqFt);
      if (tier.maxSqFt == null) {
        return offer(
          "Paver sealing, over " + prev + " sq ft",
          tier.rate,
          "The whole job over " + prev + " square feet is " + rateText + " per square foot. " + minimumLabel() + "."
        );
      }
      return offer(
        "Paver sealing, over " + prev + " up to " + formatSqft(tier.maxSqFt) + " sq ft",
        tier.rate,
        "The whole job over " + prev + " square feet, up to " + formatSqft(tier.maxSqFt) + ", is " + rateText + " per square foot. " + minimumLabel() + "."
      );
    });
    offers.push({
        "@type": "Offer",
        name: strip.name,
        description: "Sealer stripping only, $" + strip.rate.toFixed(2) +
          " per square foot. Re-sanding and resealing are not included and are priced separately. Final price is confirmed after a free on-site look.",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: strip.rate.toFixed(2),
          priceCurrency: "USD",
          unitText: "sq ft",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "FTK",
            unitText: "square foot"
          }
        }
      }
    );
    return offers;
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
      var rateNote = result.totalCents === result.straightCents
        ? result.includes + ". The whole job is priced at " + moneyFromCents(result.rateCents) + " per sq ft."
        : result.includes + ".";
      output.innerHTML =
        '<strong class="calc__total">' + moneyFromCents(result.totalCents) + "</strong>" +
        "<span>" + escapeHtml(priceSentence(result)) + ".</span>" +
        "<span>" + escapeHtml(rateNote) + "</span>" +
        "<span>Estimate only. Final price is confirmed after a free on-site look. " +
        escapeHtml(minimumLabel()) + ".</span>";
    }

    input.addEventListener("input", draw);
  }

  var MAX_PHOTOS = 6;
  var MAX_EDGE = 1600;
  var JPEG_QUALITY = 0.72;
  var MAX_TOTAL_BYTES = 9 * 1024 * 1024;

  function fieldValue(form, name) {
    var field = form.elements[name];
    return field && field.value ? String(field.value).trim() : "";
  }

  function resolvedSqft(form) {
    var direct = parseFloat(fieldValue(form, "square_feet"));
    if (isFinite(direct) && direct > 0) return direct;
    var length = parseFloat(fieldValue(form, "length_ft"));
    var width = parseFloat(fieldValue(form, "width_ft"));
    if (isFinite(length) && length > 0 && isFinite(width) && width > 0) return length * width;
    return null;
  }

  function roughEstimateText(form) {
    var sqft = resolvedSqft(form);
    if (sqft == null) return "";
    if (fieldValue(form, "service") !== "Paver sealing") {
      return formatSqft(sqft) + " sq ft noted. Published square-foot rates are for paver sealing only, so this is not a price.";
    }
    var result = estimate(sqft);
    if (!result) return "";
    if (result.tooLarge) {
      return "That size is large enough that we'll measure it with you. This is not a final quote.";
    }
    return "Rough estimate: " + priceSentence(result) +
      ". This is a rough paver sealing estimate (" + result.includes.toLowerCase() +
      ") from the size you entered. It is not a final quote.";
  }

  function bindSizeEstimate(form) {
    var output = form.querySelector("[data-size-estimate]");
    var hidden = form.querySelector("[name=rough_estimate]");
    if (!output && !hidden) return;
    function draw() {
      var text = roughEstimateText(form);
      var showPrice = text.indexOf("Rough estimate:") === 0 || text.indexOf("That size is large") === 0;
      if (hidden) hidden.value = text;
      if (!output) return;
      output.hidden = !showPrice;
      output.textContent = showPrice ? text : "";
    }
    ["length_ft", "width_ft", "square_feet", "service"].forEach(function (name) {
      var field = form.elements[name];
      if (field) field.addEventListener("input", draw);
      if (field) field.addEventListener("change", draw);
    });
    draw();
  }

  function quoteBody(form) {
    var description = fieldValue(form, "description") || fieldValue(form, "note");
    if (description.length > 700) description = description.slice(0, 700) + "…";
    var lines = ["Shine City quote request", ""];
    function add(label, name, fallback) {
      var value = fieldValue(form, name);
      if (!value && fallback == null) return;
      lines.push(label + ": " + (value || fallback));
    }
    add("Name", "name");
    add("Phone", "phone");
    add("Email", "email", "(none)");
    add("Address", "full_address");
    add("City", "city");
    add("ZIP", "zip");
    add("Street address", "property_address");
    add("Latitude", "latitude");
    add("Longitude", "longitude");
    add("Satellite", "satellite_link");
    add("Measured sq ft", "measured_sqft");
    add("Stories", "stories");
    add("House sq ft", "house_sqft");
    add("Driveway sq ft", "driveway_sqft");
    add("House price", "house_price");
    add("Driveway price", "driveway_price");
    add("Regular price", "regular_price");
    add("Wash & Shine savings", "wash_savings");
    add("Instant price", "instant_price");
    add("Confidence", "estimate_confidence");
    add("Estimate", "instant_estimate");
    add("Service", "service");
    lines.push("Note: " + (description || "(none)"));
    lines.push("");
    lines.push("Photos were not attached. Please text photos of the job to " + cfg.phoneDisplay + ".");
    return lines.join("\n");
  }

  function showThanks(form) {
    var grid = form.querySelector(".form-grid");
    var lead = form.querySelector("[data-form-lead]");
    var heading = form.querySelector("h3");
    var thanks = form.querySelector("[data-form-thanks]");
    var panel = form.querySelector("[data-form-result]");
    if (grid) grid.hidden = true;
    if (lead) lead.hidden = true;
    if (heading) heading.hidden = true;
    if (panel) panel.hidden = true;
    if (thanks) {
      thanks.hidden = false;
      if (thanks.scrollIntoView) thanks.scrollIntoView({ block: "center" });
    }
    var wizard = form.closest("[data-instant-quote]");
    if (!wizard) return;
    wizard.querySelectorAll("[data-step]").forEach(function (step) {
      if (step !== form) step.hidden = true;
    });
    var label = wizard.querySelector("[data-step-label]");
    if (label) label.hidden = true;
  }

  function showFallback(form) {
    var panel = form.querySelector("[data-form-result]");
    var body = quoteBody(form);
    var nameField = fieldValue(form, "name");
    var subject = "Quote request" + (nameField ? " from " + nameField : "");
    var mailto = "mailto:" + cfg.email +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    var sms = "sms:+" + cfg.phoneTel.replace(/\D/g, "") + "?&body=" + encodeURIComponent(body);
    if (!panel) {
      window.location.href = mailto;
      return;
    }
    panel.hidden = false;
    var mailLink = panel.querySelector("[data-mailto-link]");
    var smsLink = panel.querySelector("[data-sms-link]");
    if (mailLink) mailLink.href = mailto;
    if (smsLink) smsLink.href = sms;
    window.location.href = mailto;
  }

  function loadBitmap(file) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(file, { imageOrientation: "from-image" }).then(function (bmp) {
        return {
          source: bmp,
          width: bmp.width,
          height: bmp.height,
          close: function () { if (bmp.close) bmp.close(); }
        };
      });
    }
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({
          source: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          close: function () { URL.revokeObjectURL(url); }
        });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode"));
      };
      img.src = url;
    });
  }

  function canvasJpeg(source, width, height, quality) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, width, height);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error("compress"));
        else resolve(blob);
      }, "image/jpeg", quality);
    });
  }

  function compressImage(file, index) {
    return loadBitmap(file).then(function (bitmap) {
      var scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height, 1));
      var width = Math.max(1, Math.round(bitmap.width * scale));
      var height = Math.max(1, Math.round(bitmap.height * scale));
      return canvasJpeg(bitmap.source, width, height, JPEG_QUALITY).then(function (blob) {
        if (blob.size > 1400000) {
          return canvasJpeg(bitmap.source, width, height, 0.55);
        }
        return blob;
      }).then(function (blob) {
        bitmap.close();
        return new File([blob], "photo-" + (index + 1) + ".jpg", { type: "image/jpeg" });
      }, function (err) {
        bitmap.close();
        throw err;
      });
    }).catch(function () {
      var type = file.type || "";
      var sendOriginal = file.size <= 2500000 &&
        (type === "image/jpeg" || type === "image/png" || type === "image/webp" || type === "image/gif");
      if (sendOriginal) return file;
      throw new Error("One photo could not be prepared. Use a JPEG or PNG, or text that photo to " + cfg.phoneDisplay + ".");
    });
  }

  function preparePhotos(fileList, minCount) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) {
      if (minCount > 0) return Promise.reject(new Error("Please add at least one photo."));
      return Promise.resolve([]);
    }
    if (files.length > MAX_PHOTOS) {
      return Promise.reject(new Error("Please choose " + MAX_PHOTOS + " photos or fewer."));
    }
    var unreadable = files.some(function (file) {
      return file.type && file.type.indexOf("image/") !== 0;
    });
    if (unreadable) return Promise.reject(new Error("Please choose image files."));
    return Promise.all(files.map(compressImage)).then(function (prepared) {
      var total = prepared.reduce(function (sum, file) { return sum + file.size; }, 0);
      if (total > MAX_TOTAL_BYTES) {
        throw new Error("Those photos are still too large to send together. Remove one and try again, or text them to " + cfg.phoneDisplay + ".");
      }
      return prepared;
    });
  }

  function installPhotos(form, files) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-photo-slot]"), function (el) {
      el.remove();
    });
    var original = form.querySelector("[data-photos]");
    if (original) original.disabled = true;
    files.forEach(function (file, index) {
      var input = document.createElement("input");
      input.type = "file";
      input.name = index === 0 ? "attachment" : "attachment" + (index + 1);
      input.setAttribute("data-photo-slot", "");
      input.className = "hp";
      input.tabIndex = -1;
      var transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      form.appendChild(input);
    });
  }

  /* File attachments are delivered by a normal multipart POST.
     The post targets a hidden frame so this page can show a thank-you.
     A network failure leaves that frame on a browser error page. */
  function deliverForm(form) {
    var iframe = document.getElementById("quote-delivery");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "quote-delivery";
      iframe.name = "quote-delivery";
      iframe.hidden = true;
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
      document.body.appendChild(iframe);
    }
    var reply = form.querySelector("[name=_replyto]");
    if (!reply) {
      reply = document.createElement("input");
      reply.type = "hidden";
      reply.name = "_replyto";
      form.appendChild(reply);
    }
    reply.value = fieldValue(form, "email");
    var next = form.querySelector("[name=_next]");
    if (next && form.hasAttribute("data-wash-quote")) {
      next.value = window.location.origin + "/driveway-pool-deck-package/?thanks=1#wash-quote";
    } else if (next) {
      next.value = window.location.origin + "/pricing/?thanks=1#quote";
    }
    form.action = cfg.FORM_ENDPOINT;
    form.method = "post";
    form.enctype = "multipart/form-data";
    form.target = "quote-delivery";

    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (iframe._quoteLoad) {
        iframe.removeEventListener("load", iframe._quoteLoad);
        iframe._quoteLoad = null;
      }
      setSending(form, false);
      if (ok) {
        showThanks(form);
        return;
      }
      var original = form.querySelector("[data-photos]");
      if (original) original.disabled = false;
      showFallback(form);
    }
    function onLoad() {
      var href = "";
      try {
        href = String(iframe.contentWindow.location.href || "");
      } catch (err) {
        finish(false);
        return;
      }
      if (!href || href === "about:blank") return;
      if (href.indexOf("thanks=1") !== -1) finish(true);
      else finish(false);
    }
    if (iframe._quoteLoad) iframe.removeEventListener("load", iframe._quoteLoad);
    iframe._quoteLoad = onLoad;
    iframe.addEventListener("load", onLoad);
    var timer = window.setTimeout(function () { finish(false); }, 20000);
    form.submit();
  }

  function bindPhotos(form) {
    var input = form.querySelector("[data-photos]");
    var status = form.querySelector("[data-photo-status]");
    var preview = form.querySelector("[data-photo-preview]");
    if (!input) return;
    var urls = [];
    input.addEventListener("change", function () {
      urls.forEach(function (url) { URL.revokeObjectURL(url); });
      urls = [];
      if (preview) preview.innerHTML = "";
      var files = Array.prototype.slice.call(input.files || []);
      if (status) status.textContent = "";
      if (!files.length) return;
      if (files.length > MAX_PHOTOS) {
        if (status) status.textContent = "Please choose " + MAX_PHOTOS + " photos or fewer.";
        return;
      }
      var skipped = files.some(function (file) {
        return file.type && file.type.indexOf("image/") !== 0;
      });
      if (skipped && status) status.textContent = "Please choose image files.";
      files.forEach(function (file) {
        if (!preview) return;
        if (file.type && file.type.indexOf("image/") !== 0) return;
        if (file.type === "image/heic" || file.type === "image/heif") return;
        var url = URL.createObjectURL(file);
        urls.push(url);
        var img = document.createElement("img");
        img.src = url;
        img.alt = "";
        preview.appendChild(img);
      });
      if (status && !status.textContent) {
        status.textContent = files.length === 1 ? "1 photo selected." : files.length + " photos selected.";
      }
    });
  }

  function setHidden(form, name, value) {
    var field = form.elements[name];
    if (field) field.value = value == null ? "" : String(value);
  }

  function areaPhrase(sqft, rateCents, cents) {
    var straight = Math.round(Number(sqft)) * Number(rateCents);
    if (Number(cents) > straight) {
      return formatSqft(sqft) + " sq ft. " + moneyFromCents(cents) + " minimum";
    }
    return formatSqft(sqft) + " sq ft × " + moneyFromCents(rateCents) + " = " + moneyFromCents(cents);
  }

  function washLines(quote) {
    var stories = Number(quote.stories) === 2 ? "2-story" : "1-story";
    var house = areaPhrase(quote.houseSqft, quote.houseRateCents, quote.houseCents) + ", " + stories;
    var driveway = areaPhrase(quote.drivewaySqft, quote.drivewayRateCents, quote.drivewayCents);
    var regular = moneyFromCents(quote.regularCents);
    var savings = moneyFromCents(quote.savingsCents);
    var total = moneyFromCents(quote.totalCents);
    return {
      house: house,
      driveway: driveway,
      regular: regular,
      savings: savings,
      total: total,
      sentence: "House: " + house + ". Driveway: " + driveway + ". Regular price: " + regular +
        ". Wash & Shine 20% savings: " + savings + ". Total: " + total + ". Nick confirms every quote."
    };
  }

  function fillWashBreakdown(form, quote) {
    var box = form.querySelector("[data-wash-breakdown]");
    if (!box) return;
    if (!quote || !quote.wash) {
      box.hidden = true;
      return;
    }
    var lines = washLines(quote);
    var house = box.querySelector("[data-wash-house]");
    var driveway = box.querySelector("[data-wash-driveway]");
    var regular = box.querySelector("[data-wash-regular]");
    var savings = box.querySelector("[data-wash-savings]");
    var total = box.querySelector("[data-wash-total]");
    if (house) house.textContent = lines.house;
    if (driveway) driveway.textContent = lines.driveway;
    if (regular) regular.textContent = lines.regular;
    if (savings) savings.textContent = lines.savings;
    if (total) total.textContent = lines.total;
    box.hidden = false;
  }

  function estimateSentence(quote) {
    if (!quote) return "We'll review and send your quote.";
    if (quote.wash) return washLines(quote).sentence;
    return "Instant estimate: about " + formatSqft(Math.round(quote.sqft)) + " sq ft, " +
      moneyFromCents(quote.priceCents) + ". Final price confirmed after our review.";
  }

  function applyEstimate(form, quote) {
    if (quote && quote.wash) {
      var lines = washLines(quote);
      setHidden(form, "stories", quote.stories);
      setHidden(form, "house_sqft", Math.round(quote.houseSqft));
      setHidden(form, "driveway_sqft", Math.round(quote.drivewaySqft));
      setHidden(form, "house_price", moneyFromCents(quote.houseCents));
      setHidden(form, "driveway_price", moneyFromCents(quote.drivewayCents));
      setHidden(form, "regular_price", lines.regular);
      setHidden(form, "wash_savings", lines.savings);
      setHidden(form, "instant_price", lines.total);
      setHidden(form, "estimate_confidence", quote.confidence || "");
      setHidden(form, "measured_sqft", "");
      if (quote.formattedAddress) setHidden(form, "full_address", quote.formattedAddress);
      if (quote.latitude != null && quote.latitude !== "") setHidden(form, "latitude", quote.latitude);
      if (quote.longitude != null && quote.longitude !== "") setHidden(form, "longitude", quote.longitude);
      if (quote.satelliteLink) setHidden(form, "satellite_link", quote.satelliteLink);
      setHidden(form, "instant_estimate", lines.sentence);
      form.querySelectorAll("[data-estimate-result]").forEach(function (el) {
        el.textContent = lines.sentence;
      });
      fillWashBreakdown(form, quote);
      return;
    }
    fillWashBreakdown(form, null);
    if (quote) {
      setHidden(form, "measured_sqft", Math.round(quote.sqft));
      setHidden(form, "instant_price", moneyFromCents(quote.priceCents));
      setHidden(form, "estimate_confidence", quote.confidence || "");
      if (quote.formattedAddress) setHidden(form, "full_address", quote.formattedAddress);
      if (quote.latitude != null && quote.latitude !== "") setHidden(form, "latitude", quote.latitude);
      if (quote.longitude != null && quote.longitude !== "") setHidden(form, "longitude", quote.longitude);
      if (quote.satelliteLink) setHidden(form, "satellite_link", quote.satelliteLink);
    } else {
      setHidden(form, "measured_sqft", "");
      setHidden(form, "instant_price", "");
      setHidden(form, "estimate_confidence", "");
      if (form.hasAttribute("data-wash-quote")) {
        ["house_sqft", "driveway_sqft", "house_price", "driveway_price", "regular_price", "wash_savings"].forEach(function (name) {
          setHidden(form, name, "");
        });
      }
    }
    var sentence = estimateSentence(quote);
    setHidden(form, "instant_estimate", sentence);
    form.querySelectorAll("[data-estimate-result]").forEach(function (el) {
      el.textContent = sentence;
    });
  }

  function requestInstantQuote(form, files) {
    var url = cfg.INSTANT_QUOTE_API ? String(cfg.INSTANT_QUOTE_API).trim() : "";
    if (!url) return Promise.resolve(null);
    var body = new FormData();
    body.append("address", fieldValue(form, "full_address"));
    body.append("latitude", fieldValue(form, "latitude"));
    body.append("longitude", fieldValue(form, "longitude"));
    if (form.hasAttribute("data-wash-quote")) {
      body.append("package", "wash");
      body.append("stories", fieldValue(form, "stories"));
    }
    files.forEach(function (file) {
      body.append("photo", file, file.name || "photo.jpg");
    });
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (controller) controller.abort();
    }, 45000);
    return fetch(url, {
      method: "POST",
      body: body,
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (data) {
      if (!data || data.ok !== true) return null;
      if (form.hasAttribute("data-wash-quote")) {
        var houseSqft = Number(data.houseSqft);
        var drivewaySqft = Number(data.drivewaySqft);
        var regularCents = Number(data.regularCents);
        var savingsCents = Number(data.savingsCents);
        var totalCents = Number(data.totalCents);
        if (!isFinite(houseSqft) || houseSqft <= 0 || !isFinite(drivewaySqft) || drivewaySqft <= 0) return null;
        if (!isFinite(regularCents) || regularCents <= 0 || !isFinite(totalCents) || totalCents <= 0) return null;
        if (!isFinite(savingsCents) || savingsCents < 0) return null;
        return {
          wash: true,
          houseSqft: houseSqft,
          drivewaySqft: drivewaySqft,
          stories: Number(data.stories),
          houseRateCents: Number(data.houseRateCents),
          houseCents: Number(data.houseCents),
          drivewayRateCents: Number(data.drivewayRateCents),
          drivewayCents: Number(data.drivewayCents),
          regularCents: regularCents,
          savingsCents: savingsCents,
          totalCents: totalCents,
          confidence: data.confidence || "",
          latitude: data.latitude,
          longitude: data.longitude,
          satelliteLink: data.satelliteLink || "",
          formattedAddress: data.formattedAddress || ""
        };
      }
      var sqft = Number(data.sqft);
      var priceCents = Number(data.priceCents);
      if (!isFinite(sqft) || sqft <= 0 || !isFinite(priceCents) || priceCents <= 0) return null;
      return {
        sqft: sqft,
        priceCents: priceCents,
        confidence: data.confidence || "",
        latitude: data.latitude,
        longitude: data.longitude,
        satelliteLink: data.satelliteLink || "",
        formattedAddress: data.formattedAddress || ""
      };
    }).catch(function () {
      return null;
    }).then(function (result) {
      window.clearTimeout(timer);
      return result;
    });
  }

  function setSending(form, sending) {
    var button = form.querySelector("[type=submit]");
    if (!button) return;
    if (!button.getAttribute("data-label")) button.setAttribute("data-label", button.textContent);
    button.disabled = sending;
    button.textContent = sending ? "Sending…" : button.getAttribute("data-label");
  }

  function quoteNote(wash) {
    return wash
      ? "Sending delivers this request, including photos, to reviveexterior@gmail.com. Nick confirms every quote. This website does not store the form."
      : "Sending delivers this request, including photos, to reviveexterior@gmail.com. If that cannot be delivered, you can email or text the details. Photos are not attached to that backup. This website does not store the form.";
  }

  function bindPackagePick(form) {
    var pick = form.querySelector("[data-package-pick]");
    if (!pick) return false;
    var stories = form.querySelector(".quote-stories");

    function apply(value, updateUrl) {
      var wash = value === "wash";
      form.toggleAttribute("data-wash-quote", wash);
      document.documentElement.classList.toggle("quote-wash", wash);
      if (stories) stories.disabled = !wash;
      Array.prototype.forEach.call(form.querySelectorAll('[name="stories"]'), function (input) {
        if (input.type !== "radio") return;
        input.required = wash;
        if (!wash) input.checked = false;
      });
      setHidden(form, "service", wash ? "Wash & Shine" : "Paver sealing");
      setHidden(form, "_subject", wash ? "Shine City Wash & Shine quote request" : "Shine City quote request");
      var note = form.querySelector("[data-form-note]");
      if (cfg.FORM_ENDPOINT && note) note.textContent = quoteNote(wash);
      fillWashBreakdown(form, null);
      if (!updateUrl || !global.history || !global.history.replaceState) return;
      var url = new URL(global.location.href);
      url.searchParams.set("package", wash ? "wash" : "seal");
      global.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    var initial = "seal";
    try {
      var param = new URLSearchParams(global.location.search).get("package");
      if (param && param.toLowerCase() === "wash") initial = "wash";
    } catch (err) { /* Keep Shine & Seal when the query cannot be read. */ }
    apply(initial, false);
    Array.prototype.forEach.call(pick.querySelectorAll('input[name="estimate_package"]'), function (radio) {
      radio.addEventListener("change", function () {
        if (radio.checked) apply(radio.value === "wash" ? "wash" : "seal", true);
      });
    });
    return true;
  }

  function bindQuoteForm(form) {
    var picked = bindPackagePick(form);
    var note = form.querySelector("[data-form-note]");
    var status = form.querySelector("[data-photo-status]");
    if (!picked && cfg.FORM_ENDPOINT && note) {
      note.textContent = quoteNote(form.hasAttribute("data-wash-quote"));
    }
    bindSizeEstimate(form);
    bindPhotos(form);
    if (/[?&]thanks=1(?:&|$)/.test(window.location.search)) showThanks(form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var trap = form.querySelector('[name="_honey"]');
      if (trap && trap.value) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (status) status.textContent = "";
      var photos = form.querySelector("[data-photos]");
      var minPhotos = form.hasAttribute("data-photos-required") ? 1 : 0;
      if (minPhotos && !fieldValue(form, "full_address")) {
        setSending(form, false);
        if (status) status.textContent = "Enter the property address.";
        return;
      }
      var pending = photos ? preparePhotos(photos.files, minPhotos) : preparePhotos([], minPhotos);
      setSending(form, true);
      pending.then(function (files) {
        return requestInstantQuote(form, files).then(function (quote) {
          applyEstimate(form, quote);
          if (!cfg.FORM_ENDPOINT) {
            setSending(form, false);
            showFallback(form);
            return;
          }
          installPhotos(form, files);
          deliverForm(form);
        });
      }).catch(function (err) {
        setSending(form, false);
        var message = err && err.message ? err.message : "";
        var local = message.indexOf("photo") !== -1 || message.indexOf("image") !== -1 || message.indexOf("large") !== -1;
        if (local) {
          if (status) status.textContent = message;
          return;
        }
        showFallback(form);
      });
    });
  }

  var lastGeoAt = 0;

  function inServiceCounty(item) {
    var county = String((item.address && item.address.county) || "").toLowerCase();
    return /\borange\b/.test(county) || county.indexOf("brevard") !== -1;
  }

  function showWizardStep(root, name) {
    root.querySelectorAll("[data-step]").forEach(function (step) {
      step.hidden = step.getAttribute("data-step") !== name;
    });
    var labels = {
      address: "Step 1 of 3. Property address.",
      map: "Step 2 of 3. Confirm the satellite view.",
      details: "Step 3 of 3. Photos and contact."
    };
    var label = root.querySelector("[data-step-label]");
    if (label) label.textContent = labels[name] || "";
    var heading = root.querySelector("[data-step='" + name + "'] h3");
    if (heading && name !== "address") heading.focus();
  }

  function satelliteUrl(lat, lon) {
    return "https://www.google.com/maps?q=" + lat + "," + lon + "&t=k&z=19";
  }

  function ensureMap(root, lat, lon) {
    var mount = root.querySelector("[data-map]");
    if (!mount || !global.L) return false;
    if (!root._map) {
      root._map = global.L.map(mount, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      global.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
      }).addTo(root._map);
      root._marker = global.L.circleMarker([lat, lon], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#1565C0",
        fillOpacity: 1
      }).addTo(root._map);
    }
    root._map.setView([lat, lon], 19);
    root._marker.setLatLng([lat, lon]);
    global.setTimeout(function () {
      root._map.invalidateSize();
    }, 60);
    return true;
  }

  function geocodeAddress(query) {
    var key = "shine-geo:" + query.toLowerCase();
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (err) { /* Storage can be blocked. The lookup still runs. */ }
    var wait = Math.max(0, 1100 - (Date.now() - lastGeoAt));
    lastGeoAt = Date.now() + wait;
    return new Promise(function (resolve) { global.setTimeout(resolve, wait); }).then(function () {
      var params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        countrycodes: "us",
        q: query,
        viewbox: "-81.70,28.86,-80.40,27.84",
        bounded: "0"
      });
      return fetch("https://nominatim.openstreetmap.org/search?" + params.toString(), {
        headers: { Accept: "application/json" },
        referrerPolicy: "strict-origin-when-cross-origin"
      });
    }).then(function (res) {
      if (!res.ok) throw new Error("lookup");
      return res.json();
    }).then(function (rows) {
      var matches = (rows || []).filter(inServiceCounty).map(function (item) {
        return {
          label: item.display_name,
          lat: item.lat,
          lon: item.lon,
          county: (item.address && item.address.county) || ""
        };
      });
      if (matches.length) {
        try { sessionStorage.setItem(key, JSON.stringify(matches)); } catch (err) { /* Ignore quota errors. */ }
      }
      return matches;
    });
  }

  function bindInstantQuote(root) {
    var addressInput = root.querySelector("[data-address]");
    var findButton = root.querySelector("[data-find]");
    var status = root.querySelector("[data-geo-status]");
    var choices = root.querySelector("[data-choices]");
    var placeName = root.querySelector("[data-place-name]");
    var summary = root.querySelector("[data-summary]");
    var form = root.querySelector("[data-quote-form]");
    var selected = null;

    function setStatus(message) {
      if (status) status.textContent = message || "";
    }

    function openMap(match) {
      selected = match;
      if (placeName) placeName.textContent = match.label;
      showWizardStep(root, "map");
      if (!ensureMap(root, parseFloat(match.lat), parseFloat(match.lon))) {
        setStatus("The satellite view could not load. Try the address again.");
        showWizardStep(root, "address");
      }
    }

    function lookup() {
      var raw = addressInput ? addressInput.value.trim() : "";
      if (raw.length < 5) {
        setStatus("Enter the street, city, and ZIP.");
        return;
      }
      var query = /\bflorida\b|\bfl\b/i.test(raw) ? raw : raw + ", Florida";
      if (findButton) findButton.disabled = true;
      setStatus("Looking up that address\u2026");
      if (choices) {
        choices.hidden = true;
        choices.innerHTML = "";
      }
      geocodeAddress(query).then(function (matches) {
        if (findButton) findButton.disabled = false;
        if (!matches.length) {
          setStatus("We couldn't find that address in Orange County or Brevard County. Check the street and ZIP.");
          return;
        }
        setStatus("");
        if (matches.length === 1) {
          openMap(matches[0]);
          return;
        }
        if (!choices) {
          openMap(matches[0]);
          return;
        }
        choices.hidden = false;
        choices.innerHTML = matches.map(function (match, index) {
          return '<button type="button" data-choice="' + index + '">' + escapeHtml(match.label) + '</button>';
        }).join("");
        choices.onclick = function (event) {
          var button = event.target.closest("[data-choice]");
          if (!button) return;
          openMap(matches[Number(button.getAttribute("data-choice"))]);
        };
      }).catch(function () {
        if (findButton) findButton.disabled = false;
        setStatus("The address search didn't respond. Try again in a moment.");
      });
    }

    if (findButton) findButton.addEventListener("click", lookup);
    if (addressInput) {
      addressInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          lookup();
        }
      });
    }
    var backAddress = root.querySelector("[data-back-address]");
    if (backAddress) backAddress.addEventListener("click", function () { showWizardStep(root, "address"); });
    var confirmHouse = root.querySelector("[data-confirm]");
    if (confirmHouse) {
      confirmHouse.addEventListener("click", function () {
        if (!selected || !form) return;
        form.elements.full_address.value = selected.label;
        form.elements.latitude.value = String(selected.lat);
        form.elements.longitude.value = String(selected.lon);
        form.elements.satellite_link.value = satelliteUrl(selected.lat, selected.lon);
        if (summary) summary.textContent = selected.label;
        showWizardStep(root, "details");
      });
    }
    var backDetails = root.querySelector("[data-back-details]");
    if (backDetails) backDetails.addEventListener("click", function () { showWizardStep(root, "map"); });

    if (/[?&]thanks=1(?:&|$)/.test(global.location.search)) {
      root.querySelectorAll("[data-step]").forEach(function (step) {
        step.hidden = step.getAttribute("data-step") !== "details";
      });
    }
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
    compactRateText: compactRateText,
    washLines: washLines
  };

  function renderProcessVideo() {
    var video = cfg.processVideo || {};
    var mount = document.querySelector("[data-video-mount]");
    if (!mount) return;
    var src = String(video.src || "").trim();
    var poster = String(video.poster || "").trim();
    var youtubeId = String(video.youtubeId || "").trim();
    if (src) {
      mount.innerHTML = '<video controls muted playsinline preload="metadata" width="720" height="1280"' +
        (poster ? ' poster="' + escapeHtml(poster) + '"' : "") + ">" +
        '<source src="' + escapeHtml(src) + '" type="video/mp4">' +
        "</video>";
      return;
    }
    if (/^[A-Za-z0-9_-]{6,}$/.test(youtubeId)) {
      mount.innerHTML = '<iframe title="See the sealing process" loading="lazy" ' +
        'src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(youtubeId) + '" ' +
        'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    }
  }

  function bindInViewVideos() {
    var videos = document.querySelectorAll("video[data-inview-autoplay]");
    if (!videos.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver !== "function") return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          var pending = video.play();
          if (pending && pending.catch) pending.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.45 });
    Array.prototype.forEach.call(videos, function (video) {
      observer.observe(video);
    });
  }

  function init() {
    document.querySelectorAll("[data-pricing-tiers]").forEach(renderTiers);
    renderProcessVideo();
    bindInViewVideos();
    document.querySelectorAll("[data-price-compact]").forEach(function (el) {
      el.classList.add("price-tiers");
      el.innerHTML = compactRateParts().map(function (part) {
        return "<span>" + escapeHtml(part) + "</span>";
      }).join("");
    });
    renderAreas();
    refreshJsonLd();
    document.querySelectorAll("[data-calculator]").forEach(renderCalculator);
    document.querySelectorAll("[data-quote-form]").forEach(bindQuoteForm);
    document.querySelectorAll("[data-instant-quote]").forEach(bindInstantQuote);
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
