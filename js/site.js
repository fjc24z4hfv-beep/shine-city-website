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
    return "Rough estimate: " + formatSqft(result.sqft) + " sq ft × " +
      moneyFromCents(result.rateCents) + " per sq ft = " + moneyFromCents(result.totalCents) +
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
    add("Driveway size", "driveway_size");
    add("Size", "size_sqft");
    add("Instant estimate", "instant_estimate");
    add("Service", "service");
    lines.push("Description: " + (description || "(none)"));
    add("Length (ft)", "length_ft");
    add("Width (ft)", "width_ft");
    add("Square feet", "square_feet");
    add("Rough estimate", "rough_estimate");
    lines.push("");
    lines.push("Photos were not attached. Please text photos of the job to " + cfg.phoneDisplay + ".");
    return lines.join("\n");
  }

  function showThanks(form) {
    var grid = form.querySelector(".form-grid");
    var lead = form.querySelector("[data-form-lead]");
    var thanks = form.querySelector("[data-form-thanks]");
    var panel = form.querySelector("[data-form-result]");
    if (grid) grid.hidden = true;
    if (lead) lead.hidden = true;
    if (panel) panel.hidden = true;
    if (thanks) thanks.hidden = false;
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
      if (minCount > 0) return Promise.reject(new Error("Please add at least one photo of the driveway."));
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
    if (next) next.value = window.location.origin + "/contact/?thanks=1#quote";
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

  function setSending(form, sending) {
    var button = form.querySelector("[type=submit]");
    if (!button) return;
    button.disabled = sending;
    button.textContent = sending ? "Sending…" : "Send quote request";
  }

  function bindQuoteForm(form) {
    var note = form.querySelector("[data-form-note]");
    var status = form.querySelector("[data-photo-status]");
    if (cfg.FORM_ENDPOINT && note) {
      note.textContent = "Sending delivers this request, including photos, to reviveexterior@gmail.com. If that cannot be delivered, you can email or text the details. Photos are not attached to that backup. This website does not store the form.";
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
      if (minPhotos && (!fieldValue(form, "full_address") || !fieldValue(form, "driveway_size"))) {
        setSending(form, false);
        if (status) status.textContent = "Confirm the house and choose a driveway size before sending.";
        return;
      }
      var pending = photos ? preparePhotos(photos.files, minPhotos) : preparePhotos([], minPhotos);
      setSending(form, true);
      pending.then(function (files) {
        if (!cfg.FORM_ENDPOINT) {
          setSending(form, false);
          showFallback(form);
          return;
        }
        installPhotos(form, files);
        deliverForm(form);
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

  var DRIVEWAYS = [
    { id: "1-car", label: "1-car", sqft: "About 400 sq ft", low: 400, high: 400 },
    { id: "2-car", label: "2-car", sqft: "About 600\u2013800 sq ft", low: 600, high: 800 },
    { id: "3-car", label: "3-car or large", sqft: "About 900\u20131,200 sq ft", low: 900, high: 1200 },
    { id: "xl", label: "Circular or extra large", sqft: "About 1,300 sq ft or more", low: 1300, high: null },
    { id: "unsure", label: "Not sure", sqft: "We'll look at the photos", low: null, high: null }
  ];

  var lastGeoAt = 0;

  function instantPrice(low, high) {
    if (low == null) return "";
    var lowResult = estimate(low);
    if (!lowResult || lowResult.tooLarge) return "";
    if (high == null) return moneyFromCents(lowResult.totalCents) + " and up";
    var highResult = estimate(high);
    if (!highResult || highResult.tooLarge) return moneyFromCents(lowResult.totalCents);
    if (lowResult.totalCents === highResult.totalCents) return "About " + moneyFromCents(lowResult.totalCents);
    return moneyFromCents(lowResult.totalCents) + "\u2013" + moneyFromCents(highResult.totalCents);
  }

  function drivewayById(id) {
    var found = null;
    DRIVEWAYS.forEach(function (item) {
      if (item.id === id) found = item;
    });
    return found;
  }

  function inServiceCounty(item) {
    var county = String((item.address && item.address.county) || "").toLowerCase();
    return /\borange\b/.test(county) || county.indexOf("brevard") !== -1;
  }

  function showWizardStep(root, name) {
    root.querySelectorAll("[data-step]").forEach(function (step) {
      step.hidden = step.getAttribute("data-step") !== name;
    });
    var labels = {
      address: "Step 1 of 4. Property address.",
      map: "Step 2 of 4. Confirm the satellite view.",
      size: "Step 3 of 4. Driveway size.",
      details: "Step 4 of 4. Photos and contact."
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
    var sizeHost = root.querySelector("[data-size-choices]");
    var rangeNote = root.querySelector("[data-range-note]");
    var continueButton = root.querySelector("[data-to-photos]");
    var summary = root.querySelector("[data-summary]");
    var form = root.querySelector("[data-quote-form]");
    var selected = null;
    var pickedSize = null;

    if (rangeNote) {
      rangeNote.textContent = "Instant estimate for paver sealing (clean, re-sand joints, and seal). " +
        compactRateText() + " Final price after we verify the size and your photos.";
    }
    if (sizeHost) {
      sizeHost.innerHTML = DRIVEWAYS.map(function (item) {
        var price = instantPrice(item.low, item.high);
        return '<label class="size-choice">' +
          '<input type="radio" name="driveway_pick" value="' + escapeHtml(item.id) + '">' +
          '<span><strong>' + escapeHtml(item.label) + '</strong>' +
          '<span class="size-choice__sqft">' + escapeHtml(item.sqft) + '</span>' +
          (price ? '<span class="size-choice__price">' + escapeHtml(price) + '</span>' : '') +
          '</span></label>';
      }).join("");
      sizeHost.addEventListener("change", function () {
        var chosen = sizeHost.querySelector("input:checked");
        pickedSize = chosen ? drivewayById(chosen.value) : null;
        if (continueButton) continueButton.disabled = !pickedSize;
      });
    }

    function setStatus(message) {
      if (status) status.textContent = message || "";
    }

    function openMap(match) {
      selected = match;
      if (placeName) placeName.textContent = match.label;
      showWizardStep(root, "map");
      if (!ensureMap(root, parseFloat(match.lat), parseFloat(match.lon))) {
        setStatus("The satellite view could not load. You can still enter the size manually below.");
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
          setStatus("We couldn't find that address in Orange County or Brevard County. Check the street and ZIP, or enter the size manually below.");
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
        setStatus("The address search didn't respond. Try again in a moment, or enter the size manually below.");
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
    if (confirmHouse) confirmHouse.addEventListener("click", function () { showWizardStep(root, "size"); });
    var backSize = root.querySelector("[data-back-size]");
    if (backSize) backSize.addEventListener("click", function () { showWizardStep(root, "map"); });
    if (continueButton) {
      continueButton.addEventListener("click", function () {
        if (!pickedSize || !selected || !form) return;
        var price = instantPrice(pickedSize.low, pickedSize.high);
        var estimateText = price
          ? price + " for " + pickedSize.sqft.toLowerCase() + ". Instant estimate for paver sealing. Final price after we verify the size and your photos."
          : "Not sure of the size. No instant estimate until we see the photos.";
        form.elements.full_address.value = selected.label;
        form.elements.latitude.value = String(selected.lat);
        form.elements.longitude.value = String(selected.lon);
        form.elements.satellite_link.value = satelliteUrl(selected.lat, selected.lon);
        form.elements.driveway_size.value = pickedSize.label;
        form.elements.size_sqft.value = pickedSize.sqft;
        form.elements.instant_estimate.value = estimateText;
        if (summary) {
          summary.textContent = selected.label + " \u00b7 " + pickedSize.label +
            (price ? " \u00b7 " + price : "") + ". Instant estimate. Final price after we verify.";
        }
        showWizardStep(root, "details");
      });
    }
    var backDetails = root.querySelector("[data-back-details]");
    if (backDetails) backDetails.addEventListener("click", function () { showWizardStep(root, "size"); });

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
    compactRateText: compactRateText
  };

  function renderProcessVideo() {
    var video = cfg.processVideo || {};
    var mount = document.querySelector("[data-video-mount]");
    if (!mount) return;
    var src = String(video.src || "").trim();
    var poster = String(video.poster || "").trim();
    var youtubeId = String(video.youtubeId || "").trim();
    if (src) {
      mount.innerHTML = '<video controls muted playsinline preload="none"' +
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

  function init() {
    document.querySelectorAll("[data-pricing-tiers]").forEach(renderTiers);
    renderProcessVideo();
    document.querySelectorAll("[data-price-compact]").forEach(function (el) {
      el.textContent = compactRateText();
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
