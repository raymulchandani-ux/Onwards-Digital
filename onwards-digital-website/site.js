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
  try { var saved = localStorage.getItem("onwards-currency"); if (saved && (saved in SYM)) cur = saved; } catch (e) {}
  // The new UAE dirham symbol (2025) is not on keyboards or in most fonts yet,
  // so it is drawn as a small inline SVG in front of AED prices.
  var DIRHAM = '<svg class="dh" viewBox="0 0 100 100" aria-label="AED" role="img"><path d="M30 14 H52 A36 36 0 0 1 52 86 H30 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter"/><path d="M14 42 H70 M14 58 H70" fill="none" stroke="currentColor" stroke-width="6.5"/></svg>';
  function fmt(n) {
    var v = (n % 1) ? n.toFixed(2) : n.toLocaleString("en-US");
    if (cur === "AED") return DIRHAM + v;
    return (SYM[cur] || "") + v;
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
    var btnLabel = document.querySelector(".cur-btn-label");
    if (btnLabel) {
      var symHtml = { USD: "$", EUR: "€", GBP: "£", AED: DIRHAM }[cur] || "";
      btnLabel.innerHTML = cur + " " + symHtml;
      document.querySelectorAll(".cur-list li").forEach(function (li) { li.setAttribute("aria-selected", li.getAttribute("data-cur") === cur ? "true" : "false"); });
    }
    document.querySelectorAll("[data-currency-note]").forEach(function (el) {
      el.textContent = cur === "USD" ? "Prices in USD" : "Prices shown in " + cur + " · charged in USD";
    });
  }
  document.querySelectorAll(".cur-dd").forEach(function (dd) {
    dd.addEventListener("change", function () {
      if (!(dd.value in SYM)) return;
      cur = dd.value;
      try { localStorage.setItem("onwards-currency", cur); } catch (e) {}
      paintCurrency();
    });
  });
  paintCurrency();

  /* Custom currency menu (pricing section) */
  var menu = document.getElementById("cur-menu");
  if (menu) {
    var mBtn = menu.querySelector(".cur-btn"), mList = menu.querySelector(".cur-list");
    function openMenu(o) { mList.hidden = !o; mBtn.setAttribute("aria-expanded", o ? "true" : "false"); }
    mBtn.addEventListener("click", function () { openMenu(mList.hidden); });
    mList.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        cur = li.getAttribute("data-cur");
        try { localStorage.setItem("onwards-currency", cur); } catch (e) {}
        paintCurrency(); openMenu(false); mBtn.focus();
      });
    });
    document.addEventListener("click", function (e) { if (!menu.contains(e.target)) openMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") openMenu(false); });
  }

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
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  function fieldOf(el) { return el.closest(".field") || el.parentElement; }
  function setError(el, msg) {
    var f = fieldOf(el); if (!f) return;
    var err = f.querySelector(".err");
    if (!err) { err = document.createElement("p"); err.className = "err"; err.setAttribute("aria-live", "polite"); f.appendChild(err); }
    err.textContent = msg; f.classList.add("invalid");
    el.setAttribute("aria-invalid", "true");
  }
  function clearError(el) {
    var f = fieldOf(el); if (!f) return;
    f.classList.remove("invalid"); el.removeAttribute("aria-invalid");
  }
  function validate(form) {
    var first = null, seenRadio = {};
    form.querySelectorAll("[required]").forEach(function (el) {
      if (el.offsetParent === null && el.type !== "radio") return;   // hidden (e.g. collapsed "other" field)
      var ok = true, msg = "This field is required";
      if (el.type === "radio") {
        if (seenRadio[el.name]) return; seenRadio[el.name] = true;
        ok = !!form.querySelector('input[name="' + el.name + '"]:checked');
        msg = "Please choose one option";
      } else if (el.type === "email") {
        var v = el.value.trim();
        if (!v) { ok = false; }
        else if (!EMAIL_RE.test(v)) { ok = false; msg = "Please enter a valid email address, like name@gmail.com"; }
      } else if (el.tagName === "SELECT") {
        ok = !!el.value; msg = "Please select an option";
      } else {
        ok = !!el.value.trim();
      }
      if (ok) clearError(el); else { setError(el, msg); if (!first) first = el; }
    });
    return first;
  }
  if (form) {
    // live re-check once a field has been flagged
    form.addEventListener("input", function (e) {
      var el = e.target; var f = fieldOf(el);
      if (!f || !f.classList.contains("invalid")) return;
      if (el.type === "email") { if (EMAIL_RE.test(el.value.trim())) clearError(el); }
      else if (el.value && el.value.trim()) clearError(el);
    });
    form.addEventListener("change", function (e) {
      var el = e.target; if (el.type === "radio" || el.tagName === "SELECT") { if (el.value) clearError(el); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = validate(form);
      var banner = document.getElementById("form-error");
      var picker = document.querySelector(".picker");
      if (picker && !window.__selectedPlan) {
        if (banner) { banner.textContent = "Please choose a plan above to continue."; banner.classList.add("show"); }
        picker.style.outline = "1px solid #9a3b2a";
        picker.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (picker) picker.style.outline = "";
      if (bad) {
        if (banner) { banner.textContent = "Please fix the highlighted fields to continue."; banner.classList.add("show"); }
        fieldOf(bad).scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { try { bad.focus({ preventScroll: true }); } catch (x) { bad.focus(); } }, 350);
        return;
      }
      if (banner) banner.classList.remove("show");
      var plan = form.getAttribute("data-plan");          // "Beginner" | "Advanced" | "Professional" | "Monthly Care"
      var price = form.getAttribute("data-price");        // "0" | "299" | "599" | "12.99"
      var next = form.getAttribute("data-next");          // "" for beginner, "payment" otherwise
      var label = plan + (addonOn ? " + Monthly Care" : "");
      if (window.__selectedPlan) label = window.__selectedPlan.label; // monthly-care page picker

      var dest;                                            // where the visitor lands afterwards
      if (next === "payment") {
        dest = window.__selectedPlan ? window.__selectedPlan.paymentUrl
             : "payment.html?plan=" + encodeURIComponent(plan) + "&price=" + price + (addonOn ? "&addon=true" : "");
      } else {
        dest = "thanks.html";
      }
      var absNext = new URL(dest, location.href).href;

      // Extra fields FormSubmit reads
      function hidden(name, value) {
        var el = form.querySelector('input[name="' + name + '"]');
        if (!el) { el = document.createElement("input"); el.type = "hidden"; el.name = name; form.appendChild(el); }
        el.value = value;
      }
      hidden("plan", label);
      hidden("_subject", "New Onwards Digital request — " + label);
      hidden("_template", "table");

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = next === "payment" ? "Saving your details…" : "Sending…"; }

      var fileEl = form.querySelector('input[type="file"]');
      var hasFile = !!(fileEl && fileEl.files && fileEl.files.length);

      if (hasFile) {
        // Attachments only arrive on a normal (non-AJAX) submission, so post the
        // form itself; FormSubmit then redirects the visitor to _next.
        hidden("_next", absNext);
        hidden("_captcha", "false");
        form.setAttribute("action", (CFG.formEndpoint || "").replace("/ajax/", "/"));
        form.setAttribute("method", "POST");
        form.setAttribute("enctype", "multipart/form-data");
        form.submit();
        return;
      }

      var data = new FormData(form);
      var done = false;
      var finish = function () { if (!done) { done = true; window.location.href = dest; } };
      setTimeout(finish, 4000); // never leave the visitor waiting on a slow mail relay
      fetch(CFG.formEndpoint, { method: "POST", body: data, headers: { "Accept": "application/json" } }).then(finish, finish);
    });
  }
})();
