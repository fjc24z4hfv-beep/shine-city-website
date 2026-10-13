/* Gallery: manifest-driven cleaning photos.
   These are cleaning results, not sealed pavers.
   Pairs shot from different angles stay side by side (no slider). */
(function () {
  "use strict";

  var BASE = "/images/gallery/";
  var PAVER_SURFACES = {
    "paver/driveway cleaning": true,
    "walkway/sidewalk": true,
    "pool deck": true
  };
  var FORCE_SPLIT = {
    "east-orlando-driveway-2": true,
    "orlando-circular-driveway": true,
    "orlando-curved-walkway": true,
    "orlando-front-walk-garden": true,
    "orlando-screen-enclosure-2": true,
    "orlando-screen-enclosure-cleaning": true,
    "orlando-screen-enclosure-walkway": true
  };
  var FILTERS = [
    { id: "pavers", label: "Paver surfaces" },
    { id: "paver/driveway cleaning", label: "Driveways" },
    { id: "walkway/sidewalk", label: "Walkways" },
    { id: "pool deck", label: "Pool decks" },
    { id: "all", label: "All photos" },
    { id: "_later", label: "Other cleaning" },
    { id: "screen enclosure", label: "Screen enclosures" },
    { id: "house soft wash", label: "House washing" },
    { id: "stone veneer", label: "Stone veneer" },
    { id: "patio furniture", label: "Patio furniture" }
  ];
  var SERVICE_RANK = {
    "paver/driveway cleaning": 1,
    "walkway/sidewalk": 2,
    "pool deck": 3,
    "screen enclosure": 4,
    "house soft wash": 5,
    "stone veneer": 6,
    "patio furniture": 7
  };

  var dialog;
  var dialogImg;
  var dialogCap;
  var activeFilter = "pavers";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stageLabel(stage) {
    if (stage === "before") return "Before";
    if (stage === "after") return "After cleaning";
    if (stage === "during") return "During cleaning";
    if (stage === "combined") return "Before and after";
    return stage || "";
  }

  function landscape(item) {
    return item.width >= item.height;
  }

  function useSplit(id, before, after) {
    if (FORCE_SPLIT[id]) return true;
    if (before && after && landscape(before) !== landscape(after)) return true;
    return false;
  }

  function displaySize(item) {
    var width = Math.min(item.width, 600);
    var height = Math.max(1, Math.round(item.height * (width / item.width)));
    return { width: width, height: height };
  }

  function caption(group) {
    var city = group.city ? group.city + ". " : "";
    if (PAVER_SURFACES[group.service]) {
      return city + "Cleaning before the seal. Not a sealed finish.";
    }
    return city + "Cleaning result. Not sealed, and not a paver sealing photo.";
  }

  function shotButton(item) {
    var size = displaySize(item);
    return '<button type="button" class="shot" data-full="' + esc(BASE + item.filename) +
      '" data-alt="' + esc(item.alt) + '" data-w="' + item.width + '" data-h="' + item.height + '">' +
      '<img src="' + esc(BASE + item.thumbnail) + '" alt="' + esc(item.alt) +
      '" width="' + size.width + '" height="' + size.height + '" loading="lazy" decoding="async">' +
      '<span class="shot__tag">' + esc(stageLabel(item.stage)) + "</span></button>";
  }

  function fullButton(item, label) {
    return '<button type="button" class="text-btn" data-full="' + esc(BASE + item.filename) +
      '" data-alt="' + esc(item.alt) + '" data-w="' + item.width + '" data-h="' + item.height + '">' +
      esc(label) + "</button>";
  }

  function groupItems(items) {
    var pairs = Object.create(null);
    var order = [];
    items.forEach(function (item) {
      var key = item.pair_id || ("single:" + item.filename);
      if (!pairs[key]) {
        pairs[key] = [];
        order.push(key);
      }
      pairs[key].push(item);
    });
    return order.map(function (key) {
      var list = pairs[key];
      var before = null;
      var after = null;
      list.forEach(function (item) {
        if (item.stage === "before") before = item;
        if (item.stage === "after") after = item;
      });
      var city = "";
      list.forEach(function (item) {
        if (item.city && !city) city = item.city;
      });
      return {
        id: list[0].pair_id || key,
        items: list,
        before: before,
        after: after,
        service: list[0].service,
        city: city
      };
    }).sort(function (a, b) {
      var ra = SERVICE_RANK[a.service] || 9;
      var rb = SERVICE_RANK[b.service] || 9;
      if (ra !== rb) return ra - rb;
      return a.id < b.id ? -1 : 1;
    });
  }

  function renderGroup(group) {
    var before = group.before;
    var after = group.after;
    var cap = esc(caption(group));
    if (before && after && !useSplit(group.id, before, after)) {
      var maxw = Math.min(before.width, after.width, 600);
      return '<figure class="pair pair--slider" data-service="' + esc(group.service) + '">' +
        '<div class="compare" style="--pos:50%;--w:' + after.width + ";--h:" + after.height +
        ";max-width:min(100%," + maxw + 'px)">' +
        '<img class="compare__after" src="' + esc(BASE + after.thumbnail) + '" alt="' + esc(after.alt) +
        '" width="' + displaySize(after).width + '" height="' + displaySize(after).height + '" loading="lazy" decoding="async">' +
        '<img class="compare__before" src="' + esc(BASE + before.thumbnail) + '" alt="' + esc(before.alt) +
        '" width="' + displaySize(before).width + '" height="' + displaySize(before).height + '" loading="lazy" decoding="async">' +
        '<input class="compare__range" type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after cleaning">' +
        '<span class="compare__label compare__label--before">Before</span>' +
        '<span class="compare__label compare__label--after">After cleaning</span>' +
        "</div><figcaption>" + cap + " " + fullButton(before, "Full before") + " " + fullButton(after, "Full after") +
        "</figcaption></figure>";
    }
    var buttons = (before && after ? [before, after] : group.items).map(shotButton).join("");
    var angle = useSplit(group.id, before, after) && before && after
      ? " Shown side by side because the angles differ."
      : "";
    var native = group.service === "pool deck" ? " pair--native" : "";
    return '<figure class="pair pair--split' + native + '" data-service="' + esc(group.service) + '">' +
      '<div class="pair__grid">' + buttons + "</div><figcaption>" + cap + esc(angle) + "</figcaption></figure>";
  }

  function matches(service) {
    if (activeFilter === "all") return true;
    if (activeFilter === "pavers") return !!PAVER_SURFACES[service];
    return service === activeFilter;
  }

  function applyFilter(root, status) {
    var shown = 0;
    Array.prototype.forEach.call(root.querySelectorAll(".pair"), function (pair) {
      var on = matches(pair.getAttribute("data-service"));
      pair.hidden = !on;
      if (on) shown += 1;
    });
    if (status) {
      var label = "these photos";
      FILTERS.forEach(function (filter) {
        if (filter.id === activeFilter) label = filter.label.toLowerCase();
      });
      status.textContent = shown
        ? "Showing " + shown + " " + (activeFilter === "pavers" ? "paver, walkway, and pool deck photos" : label) + ". Cleaning only. Not sealed."
        : "No photos in this filter.";
    }
  }

  function bindCompare(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".compare"), function (box) {
      var range = box.querySelector(".compare__range");
      if (!range) return;
      range.addEventListener("input", function () {
        box.style.setProperty("--pos", range.value + "%");
      });
    });
  }

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML = '<button type="button" class="lightbox__close" data-lightbox-close>Close</button>' +
      "<figure><img alt=\"\"><figcaption></figcaption></figure>";
    document.body.appendChild(dialog);
    dialogImg = dialog.querySelector("img");
    dialogCap = dialog.querySelector("figcaption");
    dialog.querySelector("[data-lightbox-close]").addEventListener("click", function () {
      dialog.close();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      dialogImg.removeAttribute("src");
    });
  }

  function openLightbox(button) {
    ensureDialog();
    var width = parseInt(button.getAttribute("data-w"), 10) || 1600;
    dialogImg.style.setProperty("--natw", width + "px");
    dialogImg.width = width;
    dialogImg.height = parseInt(button.getAttribute("data-h"), 10) || 1200;
    dialogImg.alt = button.getAttribute("data-alt") || "";
    dialogCap.textContent = button.getAttribute("data-alt") || "";
    dialogImg.src = button.getAttribute("data-full");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function bindLightbox(scope) {
    (scope || document).addEventListener("click", function (event) {
      var button = event.target.closest("[data-full]");
      if (!button) return;
      event.preventDefault();
      openLightbox(button);
    });
  }

  function renderFilters(nav) {
    nav.innerHTML = FILTERS.map(function (filter) {
      if (filter.id === "_later") {
        return '<span class="filters__later">' + esc(filter.label) + "</span>";
      }
      var pressed = filter.id === activeFilter ? "true" : "false";
      return '<button type="button" data-filter="' + esc(filter.id) + '" aria-pressed="' + pressed + '">' +
        esc(filter.label) + "</button>";
    }).join("");
    nav.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.getAttribute("data-filter");
      Array.prototype.forEach.call(nav.querySelectorAll("[data-filter]"), function (item) {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      var root = document.getElementById("gallery-root");
      var status = document.getElementById("gallery-status");
      if (root) applyFilter(root, status);
    });
  }

  function renderGallery(items) {
    var root = document.getElementById("gallery-root");
    var nav = document.getElementById("gallery-filters");
    var status = document.getElementById("gallery-status");
    if (!root) return;
    root.innerHTML = groupItems(items).map(renderGroup).join("");
    bindCompare(root);
    if (nav) renderFilters(nav);
    applyFilter(root, status);
  }

  function init() {
    bindLightbox(document);
    var root = document.getElementById("gallery-root");
    if (!root) return;
    fetch(BASE + "manifest.json")
      .then(function (response) {
        if (!response.ok) throw new Error("manifest");
        return response.json();
      })
      .then(renderGallery)
      .catch(function () {
        root.innerHTML = "<p>The photo list did not load. Refresh the page to try again.</p>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
