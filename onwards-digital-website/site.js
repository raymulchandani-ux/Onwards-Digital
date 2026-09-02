/* Onwards Digital — shared behaviour (no dependencies) */
(function () {
  "use strict";
  var CFG = window.ONWARDS || {};

  /* Reveal on scroll ---------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Scaled live previews (homepage) --------------------------- */
  var frames = document.querySelectorAll(".frame iframe");
  function fitFrames() {
    frames.forEach(function (f) {
      var w = f.parentElement.clientWidth;
      if (w) f.style.transform = "scale(" + (w / 1440) + ")";
    });
  }
  if (frames.length) { fitFrames(); window.addEventListener("resize", fitFrames); setTimeout(fitFrames, 300); }

  /* Mobile nav ---------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.parentElement.classList.toggle("menu-open", open);
    });
  }

  /* Currency (display only) --------------------------------- */
  var SYM = CFG.currencies || { USD: "$" };
  var cur = "USD";
  try { var saved = localStorage.getItem("onwards-currency"); if (saved && SYM[saved]) cur = saved; } catch (e) {}
  function fmt(n) {
    var s = SYM[cur] || "";
    var v = (n % 1) ? n.toFixed(2) : n.toLocaleString("en-US");
    return s + v;
  }
  function paintCurrency() {
    document.querySelectorAll("[data-price]").forEach(function (el) {
      var key = el.getAttribute("data-price");
      var p = CFG.prices && CFG.prices[key];
      if (!p) return;
      var v = p[cur]; if (v == null) v = p.USD;
      var txt = (key === "beginner") ? "Free" : fmt(v);
      var suffix = el.getAttribute("data-suffix") || "";
      el.innerHTML = txt + (suffix ? '<small> ' + suffix + '</small>' : "");
    });
    document.querySelectorAll(".cur-dd").forEach(function (dd) { dd.value = cur; });
    document.querySelectorAll("[data-currency-note]").forEach(function (el) {
      el.textContent = cur === "USD" ? "Prices in USD" : "Prices shown in " + cur + " · charged in USD";
    });
  }
  document.querySelectorAll(".cur-dd").forEach(function (dd) {
    dd.addEventListener("change", function () {
      if (!SYM[dd.value]) return;
      cur = dd.value;
      try { localStorage.setItem("onwards-currency", cur); } catch (e) {}
      paintCurrency();
    });
  });
  paintCurrency();

  /* Form helpers (plan pages) ------------------------------- */
  var industry = document.getElementById("business-type");
  var other = document.getElementById("business-type-other");
  if (industry && other) {
    industry.addEventListener("change", function () {
      var on = industry.value === "other";
      other.style.display = on ? "block" : "none";
      other.required = on;
      if (on) other.focus(); else other.value = "";
    });
  }
  var upgradeFields = document.getElementById("upgrade-fields");
  document.querySelectorAll('input[name="website_type"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (upgradeFields) upgradeFields.style.display = (r.value === "upgrade" && r.checked) ? "block" : "none";
    });
  });
  var uploadArea = document.getElementById("upload-area");
  var fileInput = document.getElementById("insp-file");
  var preview = document.getElementById("upload-preview");
  if (uploadArea && fileInput && preview) {
    uploadArea.addEventListener("click", function () { fileInput.click(); });
    uploadArea.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) {
        document.getElementById("upload-file-name").textContent = fileInput.files[0].name;
        preview.style.display = "flex";
        uploadArea.style.display = "none";
      }
    });
    var rm = document.getElementById("upload-remove");
    if (rm) rm.addEventListener("click", function () {
      fileInput.value = "";
      preview.style.display = "none";
      uploadArea.style.display = "flex";
    });
  }

  /* Monthly Care add-on (advanced / professional) ------------ */
  var addon = document.getElementById("addon");
  var addonInput = document.getElementById("care-input");
  var submitBtn = document.getElementById("submit-btn");
  var addonOn = false;
  function paintSubmit() {
    if (!submitBtn) return;
    var base = submitBtn.getAttribute("data-base");
    var mo = submitBtn.getAttribute("data-monthly") || "$12.99/mo";
    submitBtn.textContent = addonOn ? ("Continue to payment — " + base + " + " + mo) : ("Continue to payment — " + base);
  }
  if (addon && addonInput) {
    addon.addEventListener("click", function () {
      addonOn = !addonOn;
      addon.classList.toggle("on", addonOn);
      addon.setAttribute("aria-checked", addonOn ? "true" : "false");
      addonInput.value = addonOn ? "Yes" : "No";
      paintSubmit();
    });
    addon.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addon.click(); } });
    paintSubmit();
  }

  /* Submit ---------------------------------------------------- */
  var form = document.getElementById("plan-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var plan = form.getAttribute("data-plan");          // "Beginner" | "Advanced" | "Professional" | "Monthly Care"
      var price = form.getAttribute("data-price");        // "0" | "299" | "599" | "12.99"
      var next = form.getAttribute("data-next");          // "" for beginner, "payment" otherwise
      var data = new FormData(form);
      var label = plan + (addonOn ? " + Monthly Care" : "");
      if (window.__selectedPlan) label = window.__selectedPlan.label; // monthly-care page picker
      data.append("plan", label);
      data.append("_subject", "New Onwards Digital request — " + label);

      var dest = null;
      if (next === "payment") {
        if (window.__selectedPlan) dest = window.__selectedPlan.paymentUrl;
        else dest = "payment.html?plan=" + encodeURIComponent(plan) + "&price=" + price + (addonOn ? "&addon=true" : "");
      }
      var go = function () {
        if (dest) { window.location.href = dest; return; }
        var fs = document.getElementById("form-section");
        if (fs) fs.style.display = "none";
        var ok = document.getElementById("success");
        if (ok) { ok.classList.add("show"); ok.scrollIntoView({ behavior: "smooth", block: "start" }); }
      };
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = dest ? "Saving your details…" : "Sending…"; }
      var done = false;
      var finish = function () { if (!done) { done = true; go(); } };
      setTimeout(finish, 4000); // never leave the visitor waiting on a slow mail relay
      fetch(CFG.formEndpoint, { method: "POST", body: data, headers: { "Accept": "application/json" } }).then(finish, finish);
    });
  }
})();
