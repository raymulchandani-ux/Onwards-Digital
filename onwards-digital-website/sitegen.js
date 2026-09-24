/* ─────────────────────────────────────────────────────────────
   Onwards Digital — ready-made site generator
   Turns one settings object into a complete, self-contained website.
   Used by ready-made.html for the live preview, the design thumbnails
   and the finished file a customer receives. No dependencies.
   ───────────────────────────────────────────────────────────── */
window.SITEGEN = (function () {
  "use strict";

  function U(id, w) { return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + (w || 1600) + "&q=75"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function paras(s) { return String(s || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); }).map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; }).join(""); }
  /* In the builder preview every piece of text is marked with the setting it comes from,
     so the customer can click it and type. Finished sites get plain text. */
  var EDIT = false, CUR = null;
  function getp(path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, CUR); }
  function t(path, v) { var val = v !== undefined ? v : getp(path); return EDIT ? '<span data-e="' + path + '">' + esc(val) + "</span>" : esc(val); }
  function pe(path) { var val = getp(path); return EDIT ? '<div class="pe" data-e="' + path + '" data-m="1">' + paras(val) + "</div>" : paras(val); }
  function lines(s) { return String(s || "").split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean); }

  /* ── Colour ─────────────────────────────────────────────── */
  function rgb(h) { h = String(h).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(a) { return "#" + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function lum(h) { return rgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [.2126, .7152, .0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function onColor(bg) { return contrast(bg, "#ffffff") >= contrast(bg, "#141414") ? "#ffffff" : "#141414"; }

  var PALETTES = [
    { n: "Paper & ink", bg: "#f7f5f0", fg: "#1b1a17", ac: "#1b1a17" },
    { n: "Olive grove", bg: "#f3f1e8", fg: "#2a2d22", ac: "#6b7a3a" },
    { n: "Harbour", bg: "#eef2f4", fg: "#13212b", ac: "#1f5f8b" },
    { n: "Clay", bg: "#f6efe8", fg: "#2b1d16", ac: "#b0532f" },
    { n: "Midnight brass", bg: "#101216", fg: "#eceae4", ac: "#c9a66b" },
    { n: "Forest", bg: "#12221b", fg: "#e9efe8", ac: "#a5c793" },
    { n: "Blush", bg: "#fbf1ef", fg: "#2d1f22", ac: "#b8606d" },
    { n: "Saffron", bg: "#fff8e7", fg: "#2a2112", ac: "#d99a00" },
    { n: "Sea glass", bg: "#edf6f3", fg: "#12302b", ac: "#2f8f7f" },
    { n: "Slate", bg: "#e9ebee", fg: "#1d232b", ac: "#4b5b70" },
    { n: "Plum", bg: "#f5eff5", fg: "#2a1a2d", ac: "#7a3b82" },
    { n: "Night lime", bg: "#1a1b1d", fg: "#f0f0ea", ac: "#c7e36b" },
    { n: "Terracotta", bg: "#f4e9dc", fg: "#3b2419", ac: "#d0703a" },
    { n: "Ivory & navy", bg: "#fbfaf6", fg: "#0e1f3d", ac: "#0e1f3d" },
    { n: "Sage", bg: "#eef1ea", fg: "#28302a", ac: "#6f8f6c" },
    { n: "Espresso", bg: "#231a15", fg: "#f2e9df", ac: "#d8a36a" },
    { n: "Cobalt", bg: "#f4f6ff", fg: "#0b1640", ac: "#2b4bff" },
    { n: "Rose night", bg: "#1e1718", fg: "#f3e7e3", ac: "#d7a193" },
    { n: "Sand", bg: "#efe7da", fg: "#34302a", ac: "#8a6d45" },
    { n: "Mint", bg: "#f1fbf6", fg: "#173027", ac: "#1f9d68" },
    { n: "Tomato", bg: "#fff5f0", fg: "#2a1410", ac: "#e0442a" },
    { n: "Lavender", bg: "#f3f2fb", fg: "#221f3a", ac: "#6453d6" },
    { n: "Stone", bg: "#e6e3dc", fg: "#262522", ac: "#7a5c3e" },
    { n: "Deep sea", bg: "#0b1a24", fg: "#e6f0f3", ac: "#47b5c9" },
    { n: "Champagne", bg: "#f7f1e6", fg: "#2b2418", ac: "#a8864a" },
    { n: "Oxblood", bg: "#f5eee9", fg: "#2a1414", ac: "#7a1f24" },
    { n: "Emerald night", bg: "#0e1a16", fg: "#eaf0ea", ac: "#3fae83" },
    { n: "Pistachio", bg: "#f3f6ea", fg: "#27301c", ac: "#7f9444" },
    { n: "Charcoal & coral", bg: "#1f2124", fg: "#f1eee9", ac: "#ff7a5c" },
    { n: "Porcelain blue", bg: "#f5f7fb", fg: "#1a2a44", ac: "#3c6fb6" },
    { n: "Mocha", bg: "#ece3d9", fg: "#3a2a22", ac: "#6f4e37" },
    { n: "Black & white", bg: "#ffffff", fg: "#111111", ac: "#111111" }
  ];

  /* Google Fonts: [family, axis spec, weight used for headings] */
  var HEAD_FONTS = [
    ["Instrument Serif", "ital@0;1", 400], ["Playfair Display", "wght@400;600", 600], ["Fraunces", "wght@400;600", 500],
    ["DM Serif Display", "", 400], ["Cormorant Garamond", "wght@500;600", 600], ["Libre Caslon Text", "wght@400;700", 400],
    ["Newsreader", "wght@400;600", 500], ["Bodoni Moda", "wght@400;600", 500], ["Young Serif", "", 400],
    ["Gloock", "", 400], ["Italiana", "", 400], ["Space Grotesk", "wght@500;700", 500],
    ["Bricolage Grotesque", "wght@500;700", 600], ["Syne", "wght@600;700", 700], ["Archivo Black", "", 400],
    ["Anton", "", 400], ["Unbounded", "wght@500;700", 500], ["Schibsted Grotesk", "wght@500;700", 600],
    ["Marcellus", "", 400], ["Cinzel", "wght@500;600", 500], ["Abril Fatface", "", 400], ["Prata", "", 400]
  ];
  var BODY_FONTS = [
    ["Schibsted Grotesk", "wght@400;500;700"], ["Inter", "wght@400;500;600"], ["DM Sans", "wght@400;500;700"],
    ["Jost", "wght@400;500"], ["Karla", "wght@400;500;700"], ["Manrope", "wght@400;500;700"],
    ["Figtree", "wght@400;500;700"], ["Lato", "wght@400;700"], ["Work Sans", "wght@400;500;600"],
    ["Libre Franklin", "wght@400;500;700"], ["Hanken Grotesk", "wght@400;500;700"], ["Source Serif 4", "wght@400;600"],
    ["Lora", "wght@400;500;600"], ["Geist", "wght@400;500;600"],
    ["Nunito Sans", "wght@400;600"], ["IBM Plex Sans", "wght@400;500;600"], ["Outfit", "wght@400;500;600"], ["Mulish", "wght@400;500;700"]
  ];
  function fam(f) { return "family=" + f[0].replace(/ /g, "+") + (f[1] ? ":" + f[1] : ""); }
  function fontsHref(s) {
    var h = HEAD_FONTS[s.theme.hf] || HEAD_FONTS[0], b = BODY_FONTS[s.theme.bf] || BODY_FONTS[0];
    var list = [fam(h)]; if (b[0] !== h[0]) list.push(fam(b));
    return "https://fonts.googleapis.com/css2?" + list.join("&") + "&display=swap";
  }
  function allFontsHref() {
    var seen = {}, list = [];
    HEAD_FONTS.concat(BODY_FONTS).forEach(function (f) { if (!seen[f[0]]) { seen[f[0]] = 1; list.push(fam(f)); } });
    return "https://fonts.googleapis.com/css2?" + list.join("&") + "&display=swap";
  }

  /* ── Starting points ───────────────────────────────────── */
  var PRESETS = {
    restaurant: {
      label: "Restaurant", name: "Casa Lume", tagline: "A neighbourhood trattoria. Dinner from Tuesday to Sunday.",
      hero: { kick: "Open tonight from 5pm", title: "Pasta made by hand, every afternoon.", text: "A small dining room, a short menu that changes with the season, and a table waiting for you.", cta: "Book a table", cta2: "See the menu" },
      hl: [["Made that day", "Every pasta is rolled in the afternoon and served the same night."], ["A short menu", "Twelve dishes, changed with what the market brings in."], ["Room for groups", "A long table at the back for up to fourteen."]],
      about: { title: "Three generations at one stove.", text: "We opened in a former bakery with six tables and one pasta machine. The recipes came with us from my grandmother's kitchen.\n\nToday the room is bigger, but the rule is the same: nothing leaves the kitchen that we wouldn't serve at home.", facts: [["12", "dishes on the menu"], ["6pm", "busiest hour"], ["2009", "first service"]] },
      services: { label: "Menu", title: "Tonight's menu", intro: "Changes with the season. Ask us about anything you can't eat.", items: [["Burrata", "14", "Heirloom tomato, basil oil, grilled bread"], ["Tagliatelle al ragù", "22", "Slow-cooked beef and pork, parmigiano"], ["Cacio e pepe", "19", "Tonnarelli, pecorino, black pepper"], ["Branzino", "31", "Whole sea bass, lemon, capers, potatoes"], ["Chicken Milanese", "26", "Rocket, shaved fennel, lemon"], ["Tiramisù", "11", "Made the morning of the day you eat it"]] },
      gallery: { label: "Gallery", title: "Inside the room" },
      booking: { label: "Book", title: "Book a table", intro: "Tables for up to eight online. For larger groups, call us.", kind: "table", options: "Dinner, Birthday, Date night, Business", button: "Request this table" },
      contact: { title: "Come and see us", address: "14 Market Street\nYour town", hours: "Tue – Thu  5pm – 10pm\nFri – Sat  5pm – 11pm\nSun  4pm – 9pm\nMon  Closed", phone: "(000) 000 0000", email: "you@example.com", note: "Street parking after 6pm. The room is step-free." },
      img: { hero: U("1741852197045-cc35920a3aa0"), x1: U("1414235077428-338989a2e8c0"), x2: U("1509710398975-6454dcdf049f"), about: U("1663530761401-15eefb544889"), g: [U("1753727471014-efe38840c7c7", 900), U("1467003909585-2f8a72700288", 900), U("1676471926534-d5c9771909fa", 900), U("1574966739987-65e38db0f7ce", 900), U("1744776411221-702f2848b0b2", 900), U("1689672235501-6dc1e56d454c", 900)] },
      design: { pal: 3, hf: 1, bf: 4 }
    },
    cafe: {
      label: "Café & bakery", name: "Morrow Bakehouse", tagline: "Bread, pastry and coffee from 7am.",
      hero: { kick: "Open today from 7am", title: "Bread worth getting up for.", text: "Sourdough, morning buns and a good flat white. Order ahead and it will be waiting for you.", cta: "Order ahead", cta2: "See what's baking" },
      hl: [["Baked before dawn", "The first loaves come out of the oven at 5am."], ["Order ahead", "Pick a time and skip the queue at the counter."], ["Whole cakes", "Order 48 hours ahead for birthdays and parties."]],
      about: { title: "A bakery that sells out on purpose.", text: "We bake what we can sell in a day, and not a loaf more. When the shelves are empty, we close.\n\nThat means everything you buy was made this morning, by the people behind the counter.", facts: [["5am", "first loaves out"], ["48h", "notice for cakes"], ["0", "day-old bread"]] },
      services: { label: "Menu", title: "On the counter", intro: "What we bake every day. Specials are on the board.", items: [["Country sourdough", "9", "Our everyday loaf, 36-hour ferment"], ["Morning bun", "5", "Orange zest, cinnamon sugar"], ["Seeded rye", "10", "Dense, dark and good for a week"], ["Flat white", "4.5", "Double shot, whole or oat milk"], ["Almond croissant", "5.5", "Twice-baked, frangipane"], ["Celebration cake", "45", "Serves 10, order 48 hours ahead"]] },
      gallery: { label: "Gallery", title: "This morning's bake" },
      booking: { label: "Order", title: "Order ahead", intro: "Choose a pickup time and we'll have it ready at the counter.", kind: "appointment", options: "Bread, Pastries, Coffee, Whole cake", button: "Place my order" },
      contact: { title: "Find the bakery", address: "3 Mill Lane\nYour town", hours: "Mon – Fri  7am – 3pm\nSat – Sun  8am – 2pm", phone: "(000) 000 0000", email: "you@example.com", note: "We close early when we sell out. Order ahead to be sure." },
      img: { hero: U("1787276694528-93d3c38b2d03"), x1: U("1732565729552-994c6af761e3"), x2: U("1545731939-9c302d5d27ed"), about: U("1711672284661-bd70e38f31b2"), g: [U("1639622949950-6720d1e5cdd4", 900), U("1506188044630-210826194885", 900), U("1772864463642-42c789ab5dbd", 900), U("1643944471768-2d2eac3afb6d", 900), U("1732565729552-994c6af761e3", 900), U("1545731939-9c302d5d27ed", 900)] },
      design: { pal: 18, hf: 2, bf: 6 }
    },
    salon: {
      label: "Salon & studio", name: "Atelier Nove", tagline: "Colour, cuts and care, by appointment.",
      hero: { kick: "Taking new clients this month", title: "Hair that grows out well.", text: "Cuts and colour planned for how you live, not just for the day you leave the chair.", cta: "Book an appointment", cta2: "See prices" },
      hl: [["Prices up front", "Every service lists what it costs before you book."], ["A proper consultation", "Fifteen minutes before any colour, always free."], ["Choose your stylist", "Book with the person you want to see."]],
      about: { title: "A small studio with four chairs.", text: "We keep the studio small so that every appointment runs on time and every client gets the whole of our attention.\n\nEach stylist has trained for at least five years, and we plan colour to last until your next visit.", facts: [["4", "chairs"], ["5 yrs", "minimum training"], ["15 min", "free consultation"]] },
      services: { label: "Prices", title: "Services and prices", intro: "Starting prices. We confirm the final price at your consultation.", items: [["Cut & finish", "from 65", "Includes wash and blow-dry"], ["Full colour", "from 110", "Root to tip, single process"], ["Balayage", "from 190", "Hand-painted, toner included"], ["Gloss", "from 45", "Shine and tone refresh"], ["Treatment", "from 35", "Bond repair and mask"], ["Blow-dry", "from 40", "Wash and style"]] },
      gallery: { label: "Gallery", title: "Inside the studio" },
      booking: { label: "Book", title: "Book an appointment", intro: "Pick a service, a day and a time. We confirm by email within a few hours.", kind: "appointment", options: "Cut & finish, Colour, Balayage, Treatment", button: "Request appointment" },
      contact: { title: "Visit the studio", address: "22 Linden Road\nYour town", hours: "Tue – Fri  10am – 7pm\nSat  9am – 5pm\nSun – Mon  Closed", phone: "(000) 000 0000", email: "you@example.com", note: "Please give us 24 hours' notice if you need to cancel." },
      img: { hero: U("1600948836101-f9ffda59d250"), x1: U("1620939391250-eb822ac0818a"), x2: U("1560264641-1b5191cc63e2"), about: U("1588703782464-28dcda543cf2"), g: [U("1549271568-e87e07c5406b", 900), U("1596362601603-b74f6ef166e4", 900), U("1602549179763-ce6c9df961b7", 900), U("1626379501846-0df4067b8bb9", 900), U("1705517120329-770cbe54accc", 900), U("1776105609708-3d8908ab4dc2", 900)] },
      design: { pal: 6, hf: 7, bf: 5 }
    },
    realestate: {
      label: "Real estate", name: "Harlow & Reed", tagline: "Homes bought, sold and let with care.",
      hero: { kick: "Local agents since 2011", title: "Find the home that fits.", text: "We sell fewer homes than the big agencies, and we know every one of them inside out.", cta: "Book a valuation", cta2: "See our homes" },
      hl: [["Fewer listings", "So every home gets our full attention."], ["Honest valuations", "Based on what sold nearby, not what flatters."], ["One agent throughout", "The person you meet first is with you to the keys."]],
      about: { title: "An agency the size of a street.", text: "We cover a few neighbourhoods and know them properly: the schools, the quiet roads, what sold last month and why.\n\nWhen you call, you speak to the agent handling your home.", facts: [["300+", "homes sold"], ["21 days", "average to offer"], ["1", "agent per home"]] },
      services: { label: "Homes", title: "Homes for sale", intro: "A selection of what's available now. Ask for the full list.", items: [["The Garden House", "1,250,000", "4 bed, walled garden, near the park"], ["Riverside apartment", "640,000", "2 bed, balcony over the water"], ["Mews cottage", "890,000", "3 bed, cobbled lane, parking"], ["Top-floor loft", "720,000", "2 bed, skylights, lift"], ["Family villa", "1,900,000", "5 bed, pool, double garage"], ["Studio flat", "310,000", "Open plan, close to the station"]] },
      gallery: { label: "Gallery", title: "Recently sold" },
      booking: { label: "Valuation", title: "Book a valuation", intro: "Tell us when suits you and we'll visit, free and with no obligation.", kind: "appointment", options: "Valuation, Viewing, Letting advice", button: "Request a visit" },
      contact: { title: "Talk to us", address: "8 High Street\nYour town", hours: "Mon – Fri  9am – 6pm\nSat  10am – 4pm", phone: "(000) 000 0000", email: "you@example.com", note: "Viewings in the evening by arrangement." },
      img: { hero: U("1757356657991-c3fd6e2e812e"), x1: U("1776362355123-ca966d36e29c"), x2: U("1613977257363-707ba9348227"), about: U("1642976975710-1d8890dbf5ab"), g: [U("1778910554261-837b19e25c26", 900), U("1785433080094-86a20fcc7129", 900), U("1756064173162-326c8e85215d", 900), U("1714495412938-addb0ed62c1e", 900), U("1760611655987-d348d6d28174", 900), U("1505843513577-22bb7d21e455", 900)] },
      design: { pal: 13, hf: 6, bf: 13 }
    },
    other: {
      label: "Something else", name: "Your Business", tagline: "What you do, said in one clear sentence.",
      hero: { kick: "Welcome", title: "Say what you do in one line.", text: "A short sentence about who you help and why they choose you. You can change every word here.", cta: "Get in touch", cta2: "See what we offer" },
      hl: [["What makes you different", "One or two sentences about it."], ["How it works", "Explain the first step a customer takes."], ["Why people come back", "A promise you keep every time."]],
      about: { title: "About us", text: "Tell your story here: how you started, what you care about, and what a customer can expect from you.\n\nKeep it short and in your own words.", facts: [["10", "years in business"], ["500+", "happy customers"], ["24h", "to reply"]] },
      services: { label: "Services", title: "What we offer", intro: "Your services and prices. Add, remove or rename any of them.", items: [["First service", "50", "A short description"], ["Second service", "80", "A short description"], ["Third service", "120", "A short description"], ["Fourth service", "150", "A short description"]] },
      gallery: { label: "Gallery", title: "Our work" },
      booking: { label: "Book", title: "Book a time", intro: "Choose a day and a time, and we'll confirm by email.", kind: "appointment", options: "Consultation, Service, Question", button: "Send request" },
      contact: { title: "Contact us", address: "Your street\nYour town", hours: "Mon – Fri  9am – 5pm", phone: "(000) 000 0000", email: "you@example.com", note: "We reply to every message within a day." },
      img: { hero: U("1760611655987-d348d6d28174"), x1: U("1711672284661-bd70e38f31b2"), x2: U("1600948836101-f9ffda59d250"), about: U("1642976975710-1d8890dbf5ab"), g: [U("1776362355123-ca966d36e29c", 900), U("1545731939-9c302d5d27ed", 900), U("1620939391250-eb822ac0818a", 900), U("1613977257363-707ba9348227", 900), U("1506188044630-210826194885", 900), U("1588703782464-28dcda543cf2", 900)] },
      design: { pal: 0, hf: 0, bf: 0 }
    }
  };

  function applyPreset(s, key, keepDesign) {
    var p = PRESETS[key]; if (!p) return s;
    s.preset = key; s.name = p.name; s.tagline = p.tagline;
    s.hero.kick = p.hero.kick; s.hero.title = p.hero.title; s.hero.text = p.hero.text; s.hero.cta = p.hero.cta; s.hero.cta2 = p.hero.cta2;
    s.hl = p.hl.map(function (x) { return [x[0], x[1]]; });
    s.about.title = p.about.title; s.about.text = p.about.text; s.about.facts = p.about.facts.map(function (x) { return [x[0], x[1]]; });
    s.services.label = p.services.label; s.services.title = p.services.title; s.services.intro = p.services.intro;
    s.services.items = p.services.items.map(function (x) { return { n: x[0], p: x[1], d: x[2] }; });
    s.gallery.label = p.gallery.label; s.gallery.title = p.gallery.title;
    ["label", "title", "intro", "kind", "options", "button"].forEach(function (k) { s.booking[k] = p.booking[k]; });
    ["title", "address", "hours", "phone", "email", "note"].forEach(function (k) { s.contact[k] = p.contact[k]; });
    s.img = { hero: p.img.hero, x1: p.img.x1, x2: p.img.x2, about: p.img.about, g: p.img.g.slice() };
    if (!keepDesign) { s.theme.pal = p.design.pal; s.theme.hf = p.design.hf; s.theme.bf = p.design.bf; s.theme.custom = null; }
    return s;
  }

  function defaults(key) {
    var s = {
      preset: "restaurant", name: "", tagline: "", onePage: true, credit: true,
      pages: { about: true, services: true, gallery: true, booking: true, contact: true },
      theme: { pal: 3, custom: null, hf: 1, bf: 4, size: 100, hscale: 100, radius: "soft", btn: "solid" },
      header: { v: 0, tone: "base" },
      hero: { v: 0, tone: "base", hs: "m", hlOn: true },
      hl: [],
      about: { v: 0, tone: "soft", hs: "m" },
      services: { v: 0, tone: "base", hs: "m", items: [] },
      gallery: { v: 0, tone: "base", hs: "m" },
      booking: { v: 0, tone: "ink", hs: "m" },
      contact: { v: 0, tone: "base", hs: "m" },
      footer: { v: 0, tone: "ink" },
      img: {}
    };
    return applyPreset(s, key || "restaurant");
  }

  /* ── Theme CSS ─────────────────────────────────────────── */
  function colors(s) {
    var c = s.theme.custom || PALETTES[s.theme.pal] || PALETTES[0];
    return { bg: c.bg, fg: c.fg, ac: c.ac };
  }
  function toneVars(s) {
    var c = colors(s), out = "";
    var tones = {
      base: [c.bg, c.fg], soft: [mix(c.bg, c.fg, lum(c.bg) > .5 ? .055 : .07), c.fg], ink: [c.fg, c.bg], accent: [c.ac, onColor(c.ac)]
    };
    Object.keys(tones).forEach(function (k) {
      var bg = tones[k][0], fg = tones[k][1];
      if (k === "accent" && contrast(c.ac, c.bg) < 1.25) { bg = mix(c.ac, c.fg, .12); fg = onColor(bg); }
      var bb = c.ac;
      if (k === "accent") bb = fg;
      else if (contrast(c.ac, bg) < 1.8) bb = fg;
      out += ".t-" + k + "{--sbg:" + bg + ";--sfg:" + fg + ";--smut:" + mix(fg, bg, .36) + ";--sline:" + mix(bg, fg, .16) + ";--bb:" + bb + ";--bt:" + onColor(bb) + "}";
    });
    return out;
  }
  function rootVars(s) {
    var c = colors(s), h = HEAD_FONTS[s.theme.hf] || HEAD_FONTS[0], b = BODY_FONTS[s.theme.bf] || BODY_FONTS[0];
    var serifBody = /Serif|Lora/.test(b[0]);
    return ":root{--bg:" + c.bg + ";--fg:" + c.fg + ";--ac:" + c.ac + ";--hf:'" + h[0] + "';--bf:'" + b[0] + "';--hw:" + h[2] +
      ";--sz:" + (s.theme.size / 100) + ";--hk:" + (s.theme.hscale / 100) + ";--lh:" + (serifBody ? 1.68 : 1.6) + "}" + toneVars(s);
  }

  var BASE_CSS = [
    "*,*:before,*:after{box-sizing:border-box;margin:0;padding:0}",
    "html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}",
    ":root{--gut:clamp(18px,5vw,56px)}",
    ".r-square{--r:0px;--br:0px;--brf:0px}.r-soft{--r:12px;--br:8px;--brf:8px}.r-round{--r:26px;--br:999px;--brf:14px}",
    "body{background:var(--bg);color:var(--fg);font-family:var(--bf),system-ui,sans-serif;font-size:calc(16px*var(--sz));line-height:var(--lh);-webkit-font-smoothing:antialiased}",
    "img{display:block;max-width:100%}a{color:inherit}button{font:inherit;color:inherit}",
    ".s{background:var(--sbg);color:var(--sfg);position:relative}",
    ".w{width:min(1180px,100% - 2*var(--gut));margin-inline:auto}",
    ".pad{padding-block:clamp(56px,8vw,112px)}",
    "h1,h2,h3,.hf{font-family:var(--hf),Georgia,serif;font-weight:var(--hw);line-height:1.06;letter-spacing:-.01em;text-wrap:balance}",
    ".s h1{font-size:calc(clamp(38px,6vw,86px)*var(--k,1)*var(--hk))}",
    ".s h2{font-size:calc(clamp(30px,3.9vw,54px)*var(--k,1)*var(--hk))}",
    ".s h3{font-size:calc(1.3em*var(--hk))}",
    ".hs-s{--k:.8}.hs-l{--k:1.2}",
    ".mut{color:var(--smut)}.kick{font-size:.92em;color:var(--smut);margin-bottom:18px}",
    ".lede{font-size:1.1em;max-width:34em;color:var(--smut);margin-top:20px}",
    ".body{max-width:36em}.body p+p{margin-top:.9em}",
    ".acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}",
    ".btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;padding:.95em 1.6em;background:var(--bb);color:var(--bt);border:1px solid var(--bb);border-radius:var(--br);text-decoration:none;font-weight:500;font-size:.95em;line-height:1.2;cursor:pointer;transition:opacity .2s,background .2s}",
    ".btn:hover{opacity:.88}",
    ".btn.alt{background:transparent;color:var(--sfg);border-color:var(--sline)}",
    ".b-outline .btn{background:transparent;color:var(--sfg);border-color:var(--sfg)}",
    ".b-text .btn{background:none;border:0;border-bottom:1px solid currentColor;border-radius:0;padding:.35em 0;color:var(--sfg)}",
    ".b-text .acts{gap:28px}",
    ".ph{background:var(--sline);overflow:hidden;border-radius:var(--r)}.ph img{width:100%;height:100%;object-fit:cover}",
    ".bgimg{position:absolute;inset:0;background:#222;overflow:hidden}.bgimg img{width:100%;height:100%;object-fit:cover}",
    ".sh{display:grid;gap:14px;margin-bottom:clamp(28px,4vw,52px)}.sh .lede{margin-top:0}.sh.c{text-align:center;justify-items:center}",
    ".facts{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px;padding-top:24px;border-top:1px solid var(--sline)}",
    ".facts b{display:block;font-family:var(--hf),serif;font-weight:var(--hw);font-size:2em;line-height:1.1}.facts span{font-size:.88em;color:var(--smut)}",
    ".pg{scroll-margin-top:70px}.multi .pg[hidden]{display:none}",
    /* forms */
    ".bk-form{display:grid;gap:20px}.fld{display:grid;gap:8px}.lb{font-size:.82em;color:var(--smut)}",
    ".inp{width:100%;font:inherit;color:inherit;background:transparent;border:1px solid var(--sline);border-radius:var(--brf);padding:.8em .95em;outline:none}",
    ".inp:focus{border-color:var(--sfg)}textarea.inp{min-height:110px;resize:vertical}",
    ".r3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}",
    ".days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}",
    ".days button{display:grid;gap:2px;padding:.55em 0;border:1px solid var(--sline);background:transparent;border-radius:var(--brf);cursor:pointer;line-height:1.1}",
    ".days button small{font-size:.72em;color:var(--smut)}.days button b{font-weight:500;font-size:1.05em}",
    ".chips{display:flex;flex-wrap:wrap;gap:6px}",
    ".chip{padding:.55em .9em;border:1px solid var(--sline);background:transparent;border-radius:var(--brf);font-size:.88em;cursor:pointer;line-height:1.2}",
    ".chip.on,.days button.on,.cal button.on{background:var(--sfg);color:var(--sbg);border-color:var(--sfg)}.days button.on small{color:inherit;opacity:.75}",
    ".stepper{display:inline-flex;align-items:center;border:1px solid var(--sline);border-radius:var(--brf);width:max-content}",
    ".stepper button{width:42px;height:42px;background:none;border:0;font-size:1.15em;cursor:pointer}.stepper output{min-width:34px;text-align:center}",
    ".cal{border:1px solid var(--sline);border-radius:var(--r);padding:14px}",
    ".cal .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}",
    ".cal .ch button{background:none;border:1px solid var(--sline);border-radius:var(--brf);width:34px;height:34px;cursor:pointer}",
    ".cal .cg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}",
    ".cal .cg span{font-size:.72em;color:var(--smut);padding:4px 0}",
    ".cal .cg button{aspect-ratio:1;border:1px solid transparent;background:none;border-radius:var(--brf);cursor:pointer;font-size:.9em}",
    ".cal .cg button:hover{border-color:var(--sline)}.cal .cg button[disabled]{opacity:.3;cursor:default}",
    ".sent-msg{display:none}.bk-form.sent>*{display:none}.bk-form.sent>.sent-msg{display:block}",
    ".sent-msg h3{margin-bottom:8px}",
    ".err-msg{color:var(--smut);font-size:.85em;min-height:1em}",
    "@media(max-width:760px){.r3{grid-template-columns:1fr 1fr}.r3>*:last-child{grid-column:1/-1}.acts{margin-top:24px}.facts{gap:10px}.facts b{font-size:1.5em}.facts span{font-size:.8em}}",
    "@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}"
  ].join("\n");

  /* ── Context helpers ───────────────────────────────────── */
  var ORDER = ["home", "about", "services", "gallery", "booking", "contact"];
  function ctx(s) {
    var pages = [{ id: "home", label: "Home" }];
    if (s.pages.about) pages.push({ id: "about", label: "About" });
    if (s.pages.services) pages.push({ id: "services", label: s.services.label || "Services" });
    if (s.pages.gallery) pages.push({ id: "gallery", label: s.gallery.label || "Gallery" });
    if (s.pages.booking) pages.push({ id: "booking", label: s.booking.label || "Book" });
    if (s.pages.contact) pages.push({ id: "contact", label: "Contact" });
    var has = function (id) { return pages.some(function (p) { return p.id === id; }); };
    var target = has("booking") ? "booking" : has("contact") ? "contact" : has("about") ? "about" : "";
    return { s: s, pages: pages, has: has, target: target, img: function (k) { var v = k.charAt(0) === "g" ? s.img.g[+k.slice(1)] : s.img[k]; return v || ""; } };
  }
  function im(c, k, alt) { var u = c.img(k); return u ? '<img src="' + esc(u) + '" alt="' + esc(alt || "") + '" loading="lazy">' : ""; }
  function sec(c, key, cls, inner) { var o = c.s[key]; return '<section class="s t-' + (o.tone || "base") + " hs-" + (o.hs || "m") + " " + cls + '">' + inner + "</section>"; }
  function heroActs(c) {
    var h = c.s.hero, out = "";
    if (h.cta && c.target) out += '<a class="btn" href="#' + c.target + '">' + t("hero.cta") + "</a>";
    if (h.cta2 && c.has("services")) out += '<a class="btn alt" href="#services">' + t("hero.cta2") + "</a>";
    return out ? '<div class="acts">' + out + "</div>" : "";
  }
  function heroText(c, noKick) {
    var h = c.s.hero;
    return (h.kick && !noKick ? '<p class="kick">' + t("hero.kick") + "</p>" : "") + "<h1>" + t("hero.title") + "</h1>" + (h.text ? '<p class="lede">' + t("hero.text") + "</p>" : "") + heroActs(c);
  }
  function sh(c, key, introKey, center) { var o = c.s[key], intro = introKey && o[introKey]; return '<div class="sh' + (center ? " c" : "") + '"><h2>' + t(key + ".title") + "</h2>" + (intro ? '<p class="lede">' + t(key + "." + introKey) + "</p>" : "") + "</div>"; }
  function facts(c) { var f = c.s.about.facts || []; return '<div class="facts">' + f.map(function (x, i) { return "<div><b>" + t("about.facts." + i + ".0", x[0]) + "</b><span>" + t("about.facts." + i + ".1", x[1]) + "</span></div>"; }).join("") + "</div>"; }

  /* ── Header designs ────────────────────────────────────── */
  function logo(c) { return '<a class="logo" href="#home">' + t("name") + "</a>"; }
  function links(c) { return '<nav class="links">' + c.pages.map(function (p) { return '<a href="#' + p.id + '" data-l="' + p.id + '">' + esc(p.label) + "</a>"; }).join("") + "</nav>"; }
  function hEnd(c) {
    var b = c.target && c.target !== "home" ? '<a class="btn cta" href="#' + c.target + '">' + esc(c.s.hero.cta || c.s.booking.label || "Contact") + "</a>" : "";
    return '<div class="end">' + b + '<button class="menu-btn" type="button" aria-label="Menu"><span></span><span></span></button></div>';
  }
  var HEADER_BASE = [
    ".hd{position:sticky;top:0;z-index:30;border-bottom:1px solid var(--sline)}",
    ".hd .bar{display:flex;align-items:center;gap:28px;min-height:74px}",
    ".logo{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.5em;line-height:1;text-decoration:none;white-space:nowrap;letter-spacing:-.01em}",
    ".links{display:flex;gap:26px;font-size:.92em;align-items:center}.links a{text-decoration:none;opacity:.75;transition:opacity .2s}",
    ".links a:hover,.links a.on{opacity:1}.links a.on{text-decoration:underline;text-underline-offset:7px;text-decoration-thickness:1px}",
    ".hd .end{display:flex;align-items:center;gap:10px}.hd .btn{padding:.7em 1.2em;font-size:.86em}",
    ".menu-btn{display:none;width:42px;height:42px;border:1px solid var(--sline);background:none;border-radius:var(--br);cursor:pointer;flex-direction:column;justify-content:center;align-items:center;gap:6px}",
    ".menu-btn span{width:18px;height:1.5px;background:currentColor;display:block}",
    ".dd{position:absolute;left:0;right:0;top:100%;background:var(--sbg);color:var(--sfg);flex-direction:column;align-items:flex-start;padding:18px var(--gut) 24px;gap:14px;border-bottom:1px solid var(--sline);font-size:1.05em}",
    "@media(max-width:760px){.hd .links{display:none;position:absolute;left:0;right:0;top:100%;background:var(--sbg);color:var(--sfg);flex-direction:column;align-items:flex-start;padding:18px var(--gut) 24px;gap:14px;border-bottom:1px solid var(--sline);font-size:1.05em}.hd.open .links{display:flex}.menu-btn{display:flex}.hd .cta{display:none}.hd .bar{min-height:62px;gap:12px}.hd .end{margin-left:auto}.logo{font-size:1.28em}}"
  ].join("\n");
  var HEADERS = [
    { n: "Classic", d: "Name on the left, links on the right", css: ".hd-1 .links{margin-left:auto}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Centred", d: "Large centred name with the links underneath", css: ".hd-2 .bar{flex-direction:column;gap:14px;padding:22px 0 14px}.hd-2 .logo{font-size:2.1em}.hd-2 .cta{display:none}.hd-2 .end{position:absolute;right:var(--gut);top:18px}@media(max-width:760px){.hd-2 .bar{flex-direction:row;padding:0}.hd-2 .logo{font-size:1.35em}.hd-2 .end{position:static}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Split", d: "Links on the left, name in the middle, button on the right", css: ".hd-3 .bar{display:grid;grid-template-columns:1fr auto 1fr}.hd-3 .logo{grid-column:2;grid-row:1;text-align:center}.hd-3 .links{grid-column:1;grid-row:1}.hd-3 .end{grid-column:3;grid-row:1;justify-self:end}@media(max-width:760px){.hd-3 .bar{grid-template-columns:1fr auto}.hd-3 .logo{grid-column:1;text-align:left}.hd-3 .end{grid-column:2}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Floating", d: "A rounded bar that floats over the top of the page", css: ".hd-4.s{background:transparent;border:0;padding-top:14px}.hd-4 .bar{background:var(--sbg);border:1px solid var(--sline);border-radius:calc(var(--r) + 4px);padding:0 10px 0 24px;min-height:64px;box-shadow:0 14px 34px -24px rgba(0,0,0,.45)}.hd-4 .links{margin-left:auto}.hd-4{margin-bottom:-78px}@media(max-width:760px){.hd-4{padding-top:10px;margin-bottom:-72px}.hd-4 .bar{padding-left:16px;min-height:56px}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Minimal", d: "Just your name and a menu button", css: ".hd-5 .links{display:none;position:absolute;right:var(--gut);left:auto;top:100%;min-width:230px;background:var(--sbg);flex-direction:column;align-items:flex-start;padding:18px 22px 22px;gap:14px;border:1px solid var(--sline);border-top:0}.hd-5.open .links{display:flex}.hd-5 .menu-btn{display:flex}.hd-5 .end{margin-left:auto}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Info strip", d: "A thin strip with your hours and phone above the bar", css: ".hd-6 .strip{background:var(--bb);color:var(--bt);font-size:.8em}.hd-6 .strip .w{display:flex;justify-content:space-between;gap:16px;min-height:34px;align-items:center}.hd-6 .links{margin-left:auto}@media(max-width:760px){.hd-6 .strip span+span{display:none}}", html: function (c) { var h = lines(c.s.contact.hours)[0] || ""; return '<div class="strip"><div class="w"><span>' + esc(h) + "</span><span>" + t("contact.phone") + '</span></div></div><div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "With tagline", d: "Your name with the one-line description under it", css: ".hd-7 .lg{display:grid;gap:5px}.hd-7 .tl{font-size:.78em;color:var(--smut);max-width:34ch;line-height:1.3}.hd-7 .links{margin-left:auto}.hd-7 .bar{min-height:90px}@media(max-width:760px){.hd-7 .tl{display:none}.hd-7 .bar{min-height:62px}}", html: function (c) { return '<div class="w bar"><div class="lg">' + logo(c) + '<span class="tl">' + t("tagline") + "</span></div>" + links(c) + hEnd(c) + "</div>"; } },
    { n: "Framed name", d: "Your name inside a thin frame, links split by slashes", css: ".hd-8 .logo{border:1px solid currentColor;padding:.42em .7em .38em;font-size:1.2em}.hd-8 .links{margin-left:auto;gap:14px}.hd-8 .links a+a:before{content:'/';display:inline-block;margin-right:14px;opacity:.35}@media(max-width:760px){.hd-8 .links a+a:before{display:none}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Pill menu", d: "The links sit together in one rounded bar", css: ".hd-9 .links{margin-left:auto;border:1px solid var(--sline);border-radius:999px;padding:5px;gap:2px}.hd-9 .links a{padding:.45em 1em;border-radius:999px}.hd-9 .links a.on{background:var(--sfg);color:var(--sbg);text-decoration:none}@media(max-width:760px){.hd-9 .links{border-radius:0;border:0;border-bottom:1px solid var(--sline);padding:18px var(--gut) 24px}.hd-9 .links a{padding:0}.hd-9 .links a.on{background:none;color:inherit;text-decoration:underline}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } },
    { n: "Big name", d: "A large name on the left and small, quiet links", css: ".hd-10 .logo{font-size:2.3em;letter-spacing:-.02em}.hd-10 .bar{min-height:98px}.hd-10 .links{margin-left:auto;font-size:.84em}@media(max-width:760px){.hd-10 .logo{font-size:1.5em}.hd-10 .bar{min-height:64px}}", html: function (c) { return '<div class="w bar">' + logo(c) + links(c) + hEnd(c) + "</div>"; } }
  ];

  /* ── Homepage designs ──────────────────────────────────── */
  var HEROES = [
    { n: "Split", css: ".he-1 .g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,72px);align-items:center;padding-block:clamp(40px,6vw,88px)}.he-1 .ph{aspect-ratio:4/5}@media(max-width:760px){.he-1 .g{grid-template-columns:1fr}.he-1 .ph{aspect-ratio:4/3;order:-1}}",
      html: function (c) { return '<div class="w g"><div>' + heroText(c) + '</div><div class="ph">' + im(c, "hero") + "</div></div>"; } },
    { n: "Full photo", css: ".he-2{min-height:min(86vh,760px);display:flex;align-items:flex-end;--sfg:#fff;--smut:rgba(255,255,255,.84);--sline:rgba(255,255,255,.45);color:#fff}.he-2 .bgimg:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.62))}.he-2 .in{position:relative;padding-block:clamp(48px,8vw,104px)}.he-2 h1{max-width:13ch}.he-2 .btn.alt{color:#fff}",
      html: function (c) { return '<div class="bgimg">' + im(c, "hero") + '</div><div class="w in">' + heroText(c) + "</div>"; } },
    { n: "Editorial", css: ".he-3 .w{padding-block:clamp(40px,7vw,96px)}.he-3 h1{font-size:calc(clamp(44px,8vw,128px)*var(--k,1)*var(--hk));max-width:15ch}.he-3 .row{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;margin:30px 0 36px;padding-top:24px;border-top:1px solid var(--sline)}.he-3 .row .lede,.he-3 .row .acts{margin-top:0}.he-3 .wide{aspect-ratio:21/9}@media(max-width:760px){.he-3 .row{flex-direction:column;align-items:flex-start;gap:18px}.he-3 .wide{aspect-ratio:4/3}}",
      html: function (c) { var h = c.s.hero; return '<div class="w">' + (h.kick ? '<p class="kick">' + t("hero.kick") + "</p>" : "") + "<h1>" + t("hero.title") + '</h1><div class="row">' + (h.text ? '<p class="lede">' + t("hero.text") + "</p>" : "<span></span>") + heroActs(c) + '</div><div class="ph wide">' + im(c, "hero") + "</div></div>"; } },
    { n: "Framed", css: ".he-4{padding:clamp(14px,2.4vw,30px) 0 clamp(48px,7vw,96px)}.he-4 .big{aspect-ratio:16/8}.he-4 .card{position:relative;background:var(--sbg);max-width:620px;margin:-150px 0 0 clamp(16px,4vw,56px);padding:clamp(24px,3.4vw,44px);border-radius:var(--r)}@media(max-width:760px){.he-4 .big{aspect-ratio:4/3}.he-4 .card{margin:-56px 12px 0}}",
      html: function (c) { return '<div class="w"><div class="ph big">' + im(c, "hero") + '</div><div class="card">' + heroText(c) + "</div></div>"; } },
    { n: "Centred strip", css: ".he-5 .c{text-align:center;display:flex;flex-direction:column;align-items:center;padding:clamp(56px,8vw,112px) 0 clamp(36px,5vw,60px)}.he-5 h1{max-width:15ch}.he-5 .acts{justify-content:center}.he-5 .trio{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:clamp(8px,1.5vw,20px);align-items:end;padding-bottom:clamp(48px,7vw,96px)}.he-5 .trio .ph{aspect-ratio:3/4}.he-5 .trio .ph:nth-child(2){aspect-ratio:4/5}",
      html: function (c) { return '<div class="w c">' + heroText(c) + '</div><div class="w trio"><div class="ph">' + im(c, "x1") + '</div><div class="ph">' + im(c, "hero") + '</div><div class="ph">' + im(c, "x2") + "</div></div>"; } },
    { n: "Offset", css: ".he-6 .g{display:grid;grid-template-columns:7fr 5fr;gap:clamp(40px,6vw,96px);align-items:end;padding-block:clamp(40px,6vw,88px) clamp(64px,8vw,112px)}.he-6 .fr{aspect-ratio:5/6;position:relative}.he-6 .fr:before{content:'';position:absolute;inset:26px -26px -26px 26px;background:var(--bb);border-radius:var(--r)}.he-6 .fr img{position:relative;width:100%;height:100%;object-fit:cover;border-radius:var(--r)}@media(max-width:760px){.he-6 .g{grid-template-columns:1fr;gap:44px}.he-6 .fr{aspect-ratio:4/3;margin-right:14px}.he-6 .fr:before{inset:14px -14px -14px 14px}}",
      html: function (c) { return '<div class="w g"><div class="fr">' + im(c, "hero") + "</div><div>" + heroText(c) + "</div></div>"; } },
    { n: "Arch", css: ".he-7 .g{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(28px,6vw,96px);align-items:center;padding-block:clamp(40px,6vw,88px)}.he-7 .arch{aspect-ratio:3/4;border-radius:999px 999px var(--r) var(--r);overflow:hidden;background:var(--sline)}.he-7 .arch img{width:100%;height:100%;object-fit:cover}@media(max-width:760px){.he-7 .g{grid-template-columns:1fr}.he-7 .arch{width:min(100%,300px);justify-self:center;order:-1;aspect-ratio:4/5}}",
      html: function (c) { return '<div class="w g"><div>' + heroText(c) + '</div><div class="arch">' + im(c, "hero") + "</div></div>"; } },
    { n: "Collage", css: ".he-8 .g{display:grid;grid-template-columns:5fr 7fr;gap:clamp(28px,5vw,72px);align-items:center;padding-block:clamp(40px,6vw,88px)}.he-8 .col{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:1fr 1fr;gap:clamp(8px,1.4vw,16px);height:clamp(300px,44vw,600px)}.he-8 .a{grid-row:1/3}@media(max-width:760px){.he-8 .g{grid-template-columns:1fr}.he-8 .col{height:320px}}",
      html: function (c) { return '<div class="w g"><div>' + heroText(c) + '</div><div class="col"><div class="ph a">' + im(c, "hero") + '</div><div class="ph">' + im(c, "x1") + '</div><div class="ph">' + im(c, "x2") + "</div></div></div>"; } },
    { n: "Details line", css: ".he-9 .top{display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:end;padding-top:clamp(48px,7vw,100px)}.he-9 .top .lede{margin-top:0}.he-9 .dl{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--sline);border-bottom:1px solid var(--sline);margin:clamp(32px,4vw,56px) 0}.he-9 .dl div{padding:16px 18px;display:flex;flex-direction:column;gap:2px;font-size:.92em}.he-9 .dl div:first-child{padding-left:0}.he-9 .dl div+div{border-left:1px solid var(--sline)}.he-9 .pano{aspect-ratio:21/8;margin-bottom:clamp(48px,7vw,96px)}@media(max-width:760px){.he-9 .top{grid-template-columns:1fr;gap:8px}.he-9 .dl div{padding:12px 10px;font-size:.78em}.he-9 .pano{aspect-ratio:16/10}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w"><div class="top"><div>' + (c.s.hero.kick ? '<p class="kick">' + t("hero.kick") + "</p>" : "") + "<h1>" + t("hero.title") + "</h1></div><div>" + (c.s.hero.text ? '<p class="lede">' + t("hero.text") + "</p>" : "") + heroActs(c) + '</div></div><div class="dl"><div><span class="mut">Open</span><span>' + esc(lines(ct.hours)[0] || "") + '</span></div><div><span class="mut">Find us</span><span>' + esc(lines(ct.address)[0] || "") + '</span></div><div><span class="mut">Call</span><span>' + esc(ct.phone) + '</span></div></div><div class="ph pano">' + im(c, "hero") + "</div></div>"; } },
    { n: "Photo card", css: ".he-10{min-height:min(86vh,760px);display:flex;align-items:center}.he-10 .in{position:relative;display:flex;justify-content:flex-end;padding-block:48px}.he-10 .card{background:var(--sbg);max-width:540px;padding:clamp(26px,4vw,52px);border-radius:var(--r)}.he-10 h1{font-size:calc(clamp(34px,4.4vw,64px)*var(--k,1)*var(--hk))}@media(max-width:760px){.he-10{align-items:flex-end}.he-10 .in{padding-block:20px}.he-10 .card{max-width:none}}",
      html: function (c) { return '<div class="bgimg">' + im(c, "hero") + '</div><div class="w in"><div class="card">' + heroText(c) + "</div></div>"; } },
    { n: "Colour band", css: ".he-11 .g{display:grid;grid-template-columns:1fr 1fr;min-height:min(80vh,720px)}.he-11 .band{background:var(--bb);color:var(--bt);--sfg:var(--bt);--smut:currentColor;padding:clamp(32px,6vw,88px);display:flex;flex-direction:column;justify-content:center}.he-11 .band .lede{opacity:.85}.he-11 .band .btn{background:var(--bt);color:var(--bb);border-color:var(--bt)}.he-11 .band .btn.alt{background:transparent;color:var(--bt);border-color:currentColor}.he-11 .g>.ph{border-radius:0}@media(max-width:760px){.he-11 .g{grid-template-columns:1fr}.he-11 .g>.ph{aspect-ratio:4/3;order:-1}}",
      html: function (c) { return '<div class="g"><div class="band">' + heroText(c) + '</div><div class="ph">' + im(c, "hero") + "</div></div>"; } },
    { n: "Photo banner", css: ".he-12 .band{aspect-ratio:21/7;border-radius:0}.he-12 .g{display:grid;grid-template-columns:1.2fr 1fr;gap:clamp(24px,5vw,72px);padding-block:clamp(36px,5vw,72px);align-items:start}.he-12 .g .lede{margin-top:0}@media(max-width:760px){.he-12 .band{aspect-ratio:16/10}.he-12 .g{grid-template-columns:1fr;gap:8px}}",
      html: function (c) { var h = c.s.hero; return '<div class="ph band">' + im(c, "hero") + '</div><div class="w g"><div>' + (h.kick ? '<p class="kick">' + t("hero.kick") + "</p>" : "") + "<h1>" + t("hero.title") + "</h1></div><div>" + (h.text ? '<p class="lede">' + t("hero.text") + "</p>" : "") + heroActs(c) + "</div></div>"; } }
  ];
  var HL_CSS = ".hl .g{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,4vw,56px);padding-block:clamp(40px,6vw,72px)}.hl .g>div{border-top:1px solid var(--sline);padding-top:18px}.hl h3{margin-bottom:8px}.hl p{font-size:.95em}@media(max-width:760px){.hl .g{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:74%;overflow-x:auto;scroll-snap-type:x mandatory;gap:18px;padding-block:32px;scrollbar-width:none}.hl .g>div{scroll-snap-align:start}}";
  function highlights(c) {
    if (!c.s.hero.hlOn || !(c.s.hl || []).length) return "";
    return '<section class="s t-' + (c.s.hero.tone === "ink" || c.s.hero.tone === "accent" ? c.s.hero.tone : "base") + ' hl"><div class="w g">' + c.s.hl.map(function (x, i) { return "<div><h3>" + t("hl." + i + ".0", x[0]) + '</h3><p class="mut">' + t("hl." + i + ".1", x[1]) + "</p></div>"; }).join("") + "</div></section>";
  }

  /* ── About designs (text boxes with images) ────────────── */
  function aboutText(c, noFacts) { var a = c.s.about; return "<h2>" + t("about.title") + '</h2><div class="body" style="margin-top:22px">' + pe("about.text") + "</div>" + (noFacts ? "" : facts(c)); }
  var ABOUTS = [
    { n: "Photo left", css: ".ab-1 .g{display:grid;grid-template-columns:5fr 6fr;gap:clamp(28px,6vw,96px);align-items:center}.ab-1 .ph{aspect-ratio:4/5}@media(max-width:760px){.ab-1 .g{grid-template-columns:1fr}.ab-1 .ph{aspect-ratio:16/10}}",
      html: function (c) { return '<div class="w g pad"><div class="ph">' + im(c, "about") + "</div><div>" + aboutText(c) + "</div></div>"; } },
    { n: "Photo right", css: ".ab-2 .g{display:grid;grid-template-columns:6fr 5fr;gap:clamp(28px,6vw,96px);align-items:center}.ab-2 .ph{aspect-ratio:1}@media(max-width:760px){.ab-2 .g{grid-template-columns:1fr}.ab-2 .ph{aspect-ratio:16/10;order:-1}}",
      html: function (c) { return '<div class="w g pad"><div>' + aboutText(c, true) + '</div><div class="ph">' + im(c, "about") + "</div></div>"; } },
    { n: "Centred", css: ".ab-3 .c{text-align:center;display:flex;flex-direction:column;align-items:center}.ab-3 .body{margin-inline:auto}.ab-3 .wide{aspect-ratio:21/9;margin-top:clamp(36px,5vw,64px)}@media(max-width:760px){.ab-3 .wide{aspect-ratio:4/3}}",
      html: function (c) { return '<div class="w pad"><div class="c">' + aboutText(c, true) + '</div><div class="ph wide">' + im(c, "about") + "</div></div>"; } },
    { n: "Photo panel", css: ".ab-4{min-height:620px;display:flex;align-items:center}.ab-4 .in{position:relative;padding-block:clamp(48px,7vw,96px)}.ab-4 .panel{background:var(--sbg);max-width:540px;padding:clamp(26px,4vw,52px);border-radius:var(--r)}@media(max-width:760px){.ab-4{min-height:520px;align-items:flex-end}.ab-4 .in{padding-block:20px}}",
      html: function (c) { return '<div class="bgimg">' + im(c, "about") + '</div><div class="w in"><div class="panel">' + aboutText(c, true) + "</div></div>"; } },
    { n: "Statement", css: ".ab-5 h2.big{font-size:calc(clamp(34px,5.2vw,76px)*var(--k,1)*var(--hk));max-width:18ch}.ab-5 .g{display:grid;grid-template-columns:1fr 1.6fr;gap:clamp(24px,5vw,72px);margin-top:clamp(32px,5vw,64px);padding-top:28px;border-top:1px solid var(--sline);align-items:start}.ab-5 .ph{aspect-ratio:4/3}@media(max-width:760px){.ab-5 .g{grid-template-columns:1fr 1.3fr;gap:16px}.ab-5 .body{font-size:.92em}}",
      html: function (c) { return '<div class="w pad"><h2 class="big">' + t("about.title") + '</h2><div class="g"><div class="ph">' + im(c, "about") + '</div><div class="body">' + pe("about.text") + "</div></div></div>"; } },
    { n: "Wide photo", css: ".ab-6 .wide{aspect-ratio:21/8}.ab-6 .g{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(24px,5vw,72px);margin-top:clamp(32px,5vw,56px)}.ab-6 .facts{margin-top:28px}@media(max-width:760px){.ab-6 .wide{aspect-ratio:16/10}.ab-6 .g{grid-template-columns:1fr;gap:16px}}",
      html: function (c) { return '<div class="w pad"><div class="ph wide">' + im(c, "about") + '</div><div class="g"><h2>' + t("about.title") + '</h2><div><div class="body">' + pe("about.text") + "</div>" + facts(c) + "</div></div></div>"; } },
    { n: "Photo pair", css: ".ab-7 .g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,6vw,96px);align-items:center}.ab-7 .pair{display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,1.4vw,16px)}.ab-7 .pair .ph{aspect-ratio:3/4}.ab-7 .pair .ph+.ph{margin-top:clamp(32px,5vw,72px)}@media(max-width:760px){.ab-7 .g{grid-template-columns:1fr}}",
      html: function (c) { return '<div class="w g pad"><div class="pair"><div class="ph">' + im(c, "about") + '</div><div class="ph">' + im(c, "x1") + "</div></div><div>" + aboutText(c, true) + "</div></div>"; } },
    { n: "Big numbers", css: ".ab-8 .g{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(24px,5vw,72px)}.ab-8 .facts{margin-top:clamp(36px,5vw,64px)}.ab-8 .facts b{font-size:calc(clamp(40px,5.4vw,80px)*var(--hk))}.ab-8 .strip{display:grid;grid-template-columns:2fr 1fr;gap:clamp(8px,1.4vw,16px);margin-top:clamp(36px,5vw,56px)}.ab-8 .strip .ph{aspect-ratio:16/8}.ab-8 .strip .ph+.ph{aspect-ratio:auto}@media(max-width:760px){.ab-8 .g{grid-template-columns:1fr;gap:12px}.ab-8 .facts b{font-size:2em}}",
      html: function (c) { return '<div class="w pad"><div class="g"><h2>' + t("about.title") + '</h2><div class="body">' + pe("about.text") + "</div></div>" + facts(c) + '<div class="strip"><div class="ph">' + im(c, "about") + '</div><div class="ph">' + im(c, "x1") + "</div></div></div>"; } },
    { n: "Arch", css: ".ab-9 .g{display:grid;grid-template-columns:.8fr 1fr;gap:clamp(28px,6vw,110px);align-items:center}.ab-9 .arch{aspect-ratio:3/4;border-radius:999px 999px var(--r) var(--r);overflow:hidden;background:var(--sline)}.ab-9 .arch img{width:100%;height:100%;object-fit:cover}@media(max-width:760px){.ab-9 .g{grid-template-columns:.8fr 1fr;gap:18px;align-items:start}.ab-9 .body{font-size:.9em}.ab-9 .facts{display:none}}",
      html: function (c) { return '<div class="w g pad"><div class="arch">' + im(c, "about") + "</div><div>" + aboutText(c) + "</div></div>"; } },
    { n: "Overlap", css: ".ab-10 .g{display:grid;grid-template-columns:repeat(12,1fr);align-items:center}.ab-10 .ph{grid-column:1/8;grid-row:1;aspect-ratio:4/3}.ab-10 .block{grid-column:6/13;grid-row:1;background:var(--bb);color:var(--bt);padding:clamp(28px,4vw,56px);border-radius:var(--r);position:relative;--smut:currentColor}.ab-10 .block .body{opacity:.9}@media(max-width:760px){.ab-10 .ph,.ab-10 .block{grid-column:1/-1}.ab-10 .block{grid-row:2;margin:-44px 12px 0}}",
      html: function (c) { return '<div class="w g pad"><div class="ph">' + im(c, "about") + '</div><div class="block">' + aboutText(c, true) + "</div></div>"; } },
    { n: "Two columns", css: ".ab-11 .top{display:grid;grid-template-columns:1fr auto;gap:32px;align-items:end;margin-bottom:clamp(28px,4vw,48px)}.ab-11 .top .ph{width:clamp(110px,16vw,220px);aspect-ratio:1}.ab-11 .cols{columns:2;column-gap:clamp(28px,5vw,64px);max-width:none}.ab-11 .cols p{break-inside:avoid}@media(max-width:760px){.ab-11 .cols{columns:1}}",
      html: function (c) { return '<div class="w pad"><div class="top"><h2>' + t("about.title") + '</h2><div class="ph">' + im(c, "about") + '</div></div><div class="body cols">' + pe("about.text") + "</div>" + facts(c) + "</div>"; } },
    { n: "Circle photo", css: ".ab-12 .c{text-align:center;display:flex;flex-direction:column;align-items:center}.ab-12 .circ{width:clamp(140px,18vw,240px);aspect-ratio:1;border-radius:50%;overflow:hidden;margin-bottom:28px;background:var(--sline)}.ab-12 .circ img{width:100%;height:100%;object-fit:cover}.ab-12 h2{max-width:18ch}.ab-12 .body{margin-inline:auto}",
      html: function (c) { return '<div class="w pad"><div class="c"><div class="circ">' + im(c, "about") + "</div>" + aboutText(c, true) + "</div></div>"; } }
  ];

  /* ── Services / menu designs ───────────────────────────── */
  function items(c) { return (c.s.services.items || []).map(function (x, i) { return { n: x.n, p: x.p, d: x.d, _i: i }; }).filter(function (x) { return x.n; }); }
  function iN(x) { return t("services.items." + x._i + ".n", x.n); }
  function iD(x) { return t("services.items." + x._i + ".d", x.d); }
  function price(x) { return x.p ? t("services.items." + x._i + ".p", x.p) : ""; }
  var SERVICES = [
    { n: "Price list", css: ".sv-1 .list{display:grid;grid-template-columns:1fr 1fr;column-gap:clamp(32px,6vw,96px);row-gap:26px}.sv-1 .top{display:flex;align-items:baseline;gap:10px}.sv-1 .top i{flex:1;border-bottom:1px dotted var(--smut);transform:translateY(-5px)}.sv-1 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.22em}.sv-1 .d{font-size:.92em;margin-top:4px}@media(max-width:760px){.sv-1 .list{grid-template-columns:1fr;row-gap:18px}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + '<div class="list">' + items(c).map(function (x) { return '<div><div class="top"><span class="n">' + iN(x) + "</span><i></i><span>" + price(x) + '</span></div><p class="mut d">' + iD(x) + "</p></div>"; }).join("") + "</div></div>"; } },
    { n: "Cards", css: ".sv-2 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(10px,1.6vw,20px)}.sv-2 .card{border:1px solid var(--sline);border-radius:var(--r);padding:clamp(18px,2.4vw,30px);display:flex;flex-direction:column;gap:10px;min-height:190px}.sv-2 .card p{font-size:.92em}.sv-2 .p{margin-top:auto;font-family:var(--hf),serif;font-size:1.5em}@media(max-width:760px){.sv-2 .grid{grid-template-columns:1fr 1fr}.sv-2 .card{min-height:0;padding:14px;font-size:.88em}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + '<div class="grid">' + items(c).map(function (x) { return '<div class="card"><h3>' + iN(x) + '</h3><p class="mut">' + iD(x) + '</p><span class="p">' + price(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "Rows", css: ".sv-3 .row{display:grid;grid-template-columns:1.1fr 2fr auto;gap:24px;padding:20px 0;border-top:1px solid var(--sline);align-items:baseline}.sv-3 .row:last-child{border-bottom:1px solid var(--sline)}.sv-3 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.25em}@media(max-width:760px){.sv-3 .row{grid-template-columns:1fr auto;gap:4px 16px;padding:14px 0}.sv-3 .row .mut{grid-column:1/-1;grid-row:2;font-size:.9em}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + items(c).map(function (x) { return '<div class="row"><span class="n">' + iN(x) + '</span><span class="mut">' + iD(x) + "</span><span>" + price(x) + "</span></div>"; }).join("") + "</div>"; } },
    { n: "Menu card", css: ".sv-4 .card{max-width:680px;margin-inline:auto;text-align:center;border:1px solid var(--sline);border-radius:var(--r);padding:clamp(32px,6vw,72px) clamp(20px,5vw,64px)}.sv-4 .it{padding:16px 0}.sv-4 .it+.it{border-top:1px solid var(--sline)}.sv-4 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.3em}.sv-4 .d{font-style:italic;font-size:.94em}.sv-4 .p{display:block;margin-top:4px;font-size:.92em}",
      html: function (c) { return '<div class="w pad"><div class="card">' + sh(c, "services", "intro", true) + items(c).map(function (x) { return '<div class="it"><div class="n">' + iN(x) + '</div><div class="mut d">' + iD(x) + '</div><span class="p">' + price(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "Side heading", css: ".sv-5 .g{display:grid;grid-template-columns:1fr 1.5fr;gap:clamp(28px,6vw,96px);align-items:start}.sv-5 .sh{position:sticky;top:100px}.sv-5 .row{display:flex;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid var(--sline)}.sv-5 .row:first-child{border-top:1px solid var(--sline)}.sv-5 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.2em;display:block}.sv-5 .row .mut{font-size:.9em}@media(max-width:760px){.sv-5 .g{grid-template-columns:1fr;gap:0}.sv-5 .sh{position:static}}",
      html: function (c) { return '<div class="w g pad">' + sh(c, "services", "intro") + "<div>" + items(c).map(function (x) { return '<div class="row"><div><span class="n">' + iN(x) + '</span><span class="mut">' + iD(x) + "</span></div><span>" + price(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "With photo", css: ".sv-6 .g{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(28px,6vw,96px);align-items:start}.sv-6 .ph{aspect-ratio:4/5;position:sticky;top:100px}.sv-6 .row{display:grid;grid-template-columns:1fr auto;gap:2px 20px;padding:16px 0;border-top:1px solid var(--sline)}.sv-6 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.18em}.sv-6 .row .mut{grid-column:1/-1;font-size:.9em}@media(max-width:760px){.sv-6 .g{grid-template-columns:1fr;gap:28px}.sv-6 .ph{position:static;aspect-ratio:16/9}}",
      html: function (c) { return '<div class="w g pad"><div class="ph">' + im(c, "x1") + "</div><div>" + sh(c, "services", "intro") + items(c).map(function (x) { return '<div class="row"><span class="n">' + iN(x) + "</span><span>" + price(x) + '</span><span class="mut">' + iD(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "Big names", css: ".sv-7 .it{display:grid;grid-template-columns:1fr auto;gap:4px 24px;padding:22px 0;border-top:1px solid var(--sline)}.sv-7 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:calc(clamp(24px,3.2vw,44px)*var(--hk));line-height:1.1}.sv-7 .p{font-size:1.2em;align-self:center}.sv-7 .d{grid-column:1/-1}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + items(c).map(function (x) { return '<div class="it"><span class="n">' + iN(x) + '</span><span class="p">' + price(x) + '</span><span class="mut d">' + iD(x) + "</span></div>"; }).join("") + "</div>"; } },
    { n: "Tinted tiles", css: ".sv-8 .grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(8px,1.4vw,16px)}.sv-8 .tile{background:var(--sline);border-radius:var(--r);padding:clamp(16px,2.6vw,32px);display:grid;gap:6px;align-content:start}.sv-8 .row{display:flex;justify-content:space-between;gap:16px;align-items:baseline}.sv-8 .n{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.25em}@media(max-width:760px){.sv-8 .tile{font-size:.88em}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + '<div class="grid">' + items(c).map(function (x) { return '<div class="tile"><div class="row"><span class="n">' + iN(x) + "</span><span>" + price(x) + '</span></div><span class="mut">' + iD(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "Three across", css: ".sv-9 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(28px,4vw,56px) clamp(16px,3vw,40px);text-align:center}.sv-9 .n{display:block;font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.3em;margin-bottom:6px}.sv-9 .p{display:block;margin-top:10px;font-size:1.1em}.sv-9 .d{font-size:.92em}@media(max-width:760px){.sv-9 .grid{grid-template-columns:1fr 1fr}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro", true) + '<div class="grid">' + items(c).map(function (x) { return '<div><span class="n">' + iN(x) + '</span><span class="mut d">' + iD(x) + '</span><span class="p">' + price(x) + "</span></div>"; }).join("") + "</div></div>"; } },
    { n: "Table", css: ".sv-10 table{width:100%;border-collapse:collapse}.sv-10 th{text-align:left;font-weight:500;font-size:.8em;color:var(--smut);padding:0 16px 12px 0;border-bottom:1px solid var(--sfg)}.sv-10 td{padding:16px 16px 16px 0;border-bottom:1px solid var(--sline);vertical-align:top}.sv-10 td:first-child{font-family:var(--hf),serif;font-weight:var(--hw);font-size:1.15em;width:32%}.sv-10 td:last-child,.sv-10 th:last-child{text-align:right;padding-right:0;white-space:nowrap}@media(max-width:760px){.sv-10 td{font-size:.88em}.sv-10 td:first-child{width:38%}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "services", "intro") + '<table><thead><tr><th>Item</th><th>Details</th><th>Price</th></tr></thead><tbody>' + items(c).map(function (x) { return "<tr><td>" + iN(x) + '</td><td class="mut">' + iD(x) + "</td><td>" + price(x) + "</td></tr>"; }).join("") + "</tbody></table></div>"; } }
  ];

  /* ── Gallery designs ───────────────────────────────────── */
  function gimgs(c, n) { var out = []; for (var i = 0; i < (n || 6); i++) out.push('<div class="ph">' + im(c, "g" + i) + "</div>"); return out.join(""); }
  var GALLERIES = [
    { n: "Grid", css: ".ga-1 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(6px,1.2vw,16px)}.ga-1 .ph{aspect-ratio:1}", html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="grid">' + gimgs(c) + "</div></div>"; } },
    { n: "Feature", css: ".ga-2 .grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:clamp(100px,16vw,230px);gap:clamp(6px,1.2vw,16px)}.ga-2 .ph:first-child{grid-column:span 2;grid-row:span 2}", html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="grid">' + gimgs(c, 5) + "</div></div>"; } },
    { n: "Strip", css: ".ga-3 .strip{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(220px,28vw,380px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px;scrollbar-width:thin}.ga-3 .ph{aspect-ratio:4/5;scroll-snap-align:start}@media(max-width:760px){.ga-3 .strip{grid-auto-columns:62%;gap:10px}}", html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="strip">' + gimgs(c) + "</div></div>"; } },
    { n: "Mosaic", css: ".ga-4 .cols{columns:3;column-gap:clamp(8px,1.4vw,16px)}.ga-4 .ph{margin-bottom:clamp(8px,1.4vw,16px);break-inside:avoid;aspect-ratio:4/5}.ga-4 .ph:nth-child(3n+2){aspect-ratio:1}.ga-4 .ph:nth-child(3n){aspect-ratio:3/4}", html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="cols">' + gimgs(c) + "</div></div>"; } },
    { n: "Slideshow", css: ".ga-5 .show{position:relative;aspect-ratio:16/8;border-radius:var(--r);overflow:hidden;background:var(--sline)}.ga-5 .sl{position:absolute;inset:0;opacity:0;transition:opacity .6s}.ga-5 .sl.on{opacity:1}.ga-5 .sl img{width:100%;height:100%;object-fit:cover}.ga-5 .nav{position:absolute;right:16px;bottom:16px;display:flex;gap:8px;align-items:center}.ga-5 .nav button{width:44px;height:44px;border-radius:var(--br);border:0;background:rgba(255,255,255,.9);color:#111;cursor:pointer;font-size:1.1em}.ga-5 .count{position:absolute;left:18px;bottom:22px;color:#fff;font-size:.85em;text-shadow:0 1px 8px rgba(0,0,0,.5)}@media(max-width:760px){.ga-5 .show{aspect-ratio:4/3}}",
      html: function (c) { var s = ""; for (var i = 0; i < 6; i++) s += '<div class="sl' + (i ? "" : " on") + '">' + im(c, "g" + i) + "</div>"; return '<div class="w pad">' + sh(c, "gallery") + '<div class="show" data-show>' + s + '<span class="count">1 / 6</span><div class="nav"><button type="button" data-slide="-1" aria-label="Previous">&#8249;</button><button type="button" data-slide="1" aria-label="Next">&#8250;</button></div></div></div>'; } },
    { n: "Filmstrip", css: ".ga-6 .film{display:grid;grid-template-columns:repeat(6,1fr)}.ga-6 .film .ph{aspect-ratio:3/4;border-radius:0}.ga-6 .pad{padding-bottom:clamp(28px,4vw,48px)}.ga-6 .after{height:clamp(56px,8vw,112px)}@media(max-width:760px){.ga-6 .film{grid-template-columns:repeat(3,1fr)}}", html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '</div><div class="film">' + gimgs(c) + '</div><div class="after"></div>'; } },
    { n: "Framed prints", css: ".ga-7 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(14px,2.6vw,36px);padding:8px}.ga-7 .ph{aspect-ratio:4/5;border-radius:0;padding:clamp(6px,1vw,14px);background:#fff;box-shadow:0 18px 36px -24px rgba(0,0,0,.5)}.ga-7 .ph:nth-child(3n+1){transform:rotate(-1.4deg)}.ga-7 .ph:nth-child(3n){transform:rotate(1.2deg)}",
      html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="grid">' + gimgs(c) + "</div></div>"; } },
    { n: "Two up", css: ".ga-8 .top,.ga-8 .row{display:grid;gap:clamp(6px,1.2vw,16px)}.ga-8 .top{grid-template-columns:1fr 1fr;margin-bottom:clamp(6px,1.2vw,16px)}.ga-8 .top .ph{aspect-ratio:4/3}.ga-8 .row{grid-template-columns:repeat(4,1fr)}.ga-8 .row .ph{aspect-ratio:1}",
      html: function (c) { var a = "", b = ""; for (var i = 0; i < 6; i++) { var x = '<div class="ph">' + im(c, "g" + i) + "</div>"; if (i < 2) a += x; else b += x; } return '<div class="w pad">' + sh(c, "gallery") + '<div class="top">' + a + '</div><div class="row">' + b + "</div></div>"; } },
    { n: "Staggered", css: ".ga-9 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(8px,1.6vw,20px);padding-bottom:clamp(20px,4vw,56px)}.ga-9 .ph{aspect-ratio:3/4}.ga-9 .ph:nth-child(3n+2){transform:translateY(clamp(20px,4vw,56px))}",
      html: function (c) { return '<div class="w pad">' + sh(c, "gallery") + '<div class="grid">' + gimgs(c) + "</div></div>"; } },
    { n: "Main & thumbnails", css: ".ga-10 .main{aspect-ratio:16/8;margin-bottom:10px}.ga-10 .th{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.ga-10 .th button{padding:0;border:0;background:var(--sline);cursor:pointer;aspect-ratio:1;border-radius:var(--r);overflow:hidden;opacity:.55;transition:opacity .2s}.ga-10 .th button.on,.ga-10 .th button:hover{opacity:1}.ga-10 .th img{width:100%;height:100%;object-fit:cover}@media(max-width:760px){.ga-10 .main{aspect-ratio:4/3}.ga-10 .th{gap:5px}}",
      html: function (c) { var th = ""; for (var i = 0; i < 6; i++) th += '<button type="button" data-swap="' + esc(c.img("g" + i)) + '"' + (i ? "" : ' class="on"') + ' aria-label="Show photo ' + (i + 1) + '">' + im(c, "g" + i) + "</button>"; return '<div class="w pad">' + sh(c, "gallery") + '<div data-gal><div class="ph main" data-main>' + im(c, "g0") + '</div><div class="th">' + th + "</div></div></div>"; } }
  ];

  /* ── Booking designs ───────────────────────────────────── */
  function opts(c) { return String(c.s.booking.options || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
  function times(c) { return c.s.booking.kind === "table" ? ["5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm", "8:00pm", "8:30pm", "9:00pm"] : ["9:00am", "10:00am", "11:00am", "12:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm"]; }
  function formOpen(c) {
    var s = c.s, email = (s.contact.email || "").trim();
    return '<form class="bk-form" method="POST" action="https://formsubmit.co/' + esc(email) + '" novalidate><input type="hidden" name="_subject" value="New ' + esc((s.booking.label || "booking").toLowerCase()) + " request — " + esc(s.name) + '"><input type="hidden" name="_template" value="table"><input type="hidden" name="_captcha" value="false">';
  }
  function pDay(cal) { return '<div class="fld"><span class="lb">Day</span>' + (cal ? '<div class="cal" data-cal data-name="day"></div>' : '<div class="days" data-days data-name="day"></div>') + '<input type="hidden" name="day"></div>'; }
  function pTime(c) { if (c.s.booking.kind === "enquiry") return ""; return '<div class="fld"><span class="lb">Time</span><div class="chips" data-name="time">' + times(c).map(function (t) { return '<button type="button" class="chip" data-pick="' + t + '">' + t + "</button>"; }).join("") + '</div><input type="hidden" name="time"></div>'; }
  function pGuests(c) { if (c.s.booking.kind !== "table") return ""; return '<div class="fld"><span class="lb">Guests</span><div class="stepper" data-name="guests"><button type="button" data-step="-1" aria-label="Fewer">&minus;</button><output>2</output><button type="button" data-step="1" aria-label="More">+</button></div><input type="hidden" name="guests" value="2"></div>'; }
  function pOpts(c, big) { var o = opts(c); if (!o.length) return ""; var lab = c.s.booking.kind === "table" ? "Occasion" : c.s.booking.kind === "enquiry" ? "About" : "Service"; return '<div class="fld"><span class="lb">' + lab + '</span><div class="chips' + (big ? " big" : "") + '" data-name="option">' + o.map(function (t) { return '<button type="button" class="chip" data-pick="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + '</div><input type="hidden" name="' + lab.toLowerCase() + '" data-for="option"></div>'; }
  function pMsg(c) { return c.s.booking.kind === "enquiry" ? '<div class="fld"><span class="lb">Message</span><textarea class="inp" name="message" required></textarea></div>' : ""; }
  function pDetails() { return '<div class="r3"><label class="fld"><span class="lb">Name</span><input class="inp" name="name" autocomplete="name" required></label><label class="fld"><span class="lb">Email</span><input class="inp" type="email" name="email" autocomplete="email" required></label><label class="fld"><span class="lb">Phone</span><input class="inp" type="tel" name="phone" autocomplete="tel"></label></div>'; }
  function pSubmit(c) { return '<p class="err-msg" aria-live="polite"></p><div><button class="btn" type="submit">' + t("booking.button") + '</button></div><div class="sent-msg"><h3>Request sent.</h3><p class="mut">Thank you. We\'ll confirm by email shortly.</p></div>'; }
  function pickers(c, o) {
    o = o || {};
    var k = c.s.booking.kind;
    return (o.noOpts ? "" : pOpts(c)) + (k === "enquiry" ? "" : pDay(o.cal)) + pTime(c) + pGuests(c) + pMsg(c);
  }
  function fullForm(c, o) { return formOpen(c) + pickers(c, o) + pDetails() + pSubmit(c) + "</form>"; }
  function infoBlock(c) { var ct = c.s.contact; return '<div class="info"><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Address</span>' + lines(ct.address).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Phone</span><p>' + esc(ct.phone) + "</p></div></div>"; }
  var BOOKINGS = [
    { n: "Centred card", css: ".bk-1 .card{max-width:760px;margin-inline:auto;border:1px solid var(--sline);border-radius:var(--r);padding:clamp(24px,5vw,56px)}", html: function (c) { return '<div class="w pad"><div class="card">' + sh(c, "booking", "intro", true) + fullForm(c) + "</div></div>"; } },
    { n: "Photo split", css: ".bk-2 .g{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(28px,5vw,80px);align-items:stretch}.bk-2 .ph{min-height:100%;aspect-ratio:auto}@media(max-width:760px){.bk-2 .g{grid-template-columns:1fr}.bk-2 .ph{aspect-ratio:16/9;min-height:0}}", html: function (c) { return '<div class="w g pad"><div class="ph">' + im(c, "x1") + "</div><div>" + sh(c, "booking", "intro") + fullForm(c) + "</div></div>"; } },
    { n: "Form & details", css: ".bk-3 .g{display:grid;grid-template-columns:1.5fr 1fr;gap:clamp(28px,6vw,96px);align-items:start}.bk-3 .info{display:grid;gap:22px;padding-top:24px;border-top:1px solid var(--sline);position:sticky;top:100px}.bk-3 .info p{font-size:.95em}@media(max-width:760px){.bk-3 .g{grid-template-columns:1fr}.bk-3 .info{position:static;grid-template-columns:1fr 1fr}.bk-3 .info>div:first-child{grid-column:1/-1}}", html: function (c) { return '<div class="w g pad"><div>' + sh(c, "booking", "intro") + fullForm(c) + "</div>" + infoBlock(c) + "</div>"; } },
    { n: "Band", css: ".bk-4 .g{display:grid;grid-template-columns:1fr 1.4fr;gap:clamp(28px,6vw,96px);align-items:start}@media(max-width:760px){.bk-4 .g{grid-template-columns:1fr;gap:0}}", html: function (c) { return '<div class="w g pad">' + sh(c, "booking", "intro") + fullForm(c) + "</div>"; } },
    { n: "Three steps", css: ".bk-5 .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,3vw,40px);align-items:start}.bk-5 .st{border-top:1px solid var(--sline);padding-top:18px;display:grid;gap:18px}.bk-5 .st>.hf{font-size:1.25em}.bk-5 .st .r3{grid-template-columns:1fr}.bk-5 .st .r3>*:last-child{grid-column:auto}@media(max-width:760px){.bk-5 .steps{grid-template-columns:1fr}}",
      html: function (c) { var k = c.s.booking.kind; var one = k === "enquiry" ? pOpts(c) : pDay(false) + pOpts(c); var two = k === "enquiry" ? pMsg(c) : pTime(c) + pGuests(c); return '<div class="w pad">' + sh(c, "booking", "intro") + formOpen(c) + '<div class="steps"><div class="st"><span class="hf">1. ' + (k === "enquiry" ? "Choose a topic" : "Choose a day") + "</span>" + one + '</div><div class="st"><span class="hf">2. ' + (k === "enquiry" ? "Your message" : "Choose a time") + "</span>" + two + '</div><div class="st"><span class="hf">3. Your details</span>' + pDetails() + pSubmit(c) + "</div></div></form></div>"; } },
    { n: "Calendar", css: ".bk-6 .g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,72px);align-items:start}.bk-6 .cal{padding:clamp(14px,2vw,24px)}@media(max-width:760px){.bk-6 .g{grid-template-columns:1fr}}",
      html: function (c) { if (c.s.booking.kind === "enquiry") return '<div class="w pad">' + sh(c, "booking", "intro") + fullForm(c) + "</div>"; return '<div class="w pad">' + sh(c, "booking", "intro") + formOpen(c) + '<div class="g"><div>' + pDay(true) + '</div><div class="bk-form">' + pOpts(c) + pTime(c) + pGuests(c) + pDetails() + "</div></div>" + pSubmit(c) + "</form></div>"; } },
    { n: "Over photo", css: ".bk-7 .in{position:relative;padding-block:clamp(48px,8vw,112px)}.bk-7 .glass{max-width:640px;margin-left:auto;background:var(--sbg);background:color-mix(in srgb,var(--sbg) 88%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:var(--r);padding:clamp(22px,4vw,48px)}@media(max-width:760px){.bk-7 .in{padding-block:24px}}", html: function (c) { return '<div class="bgimg">' + im(c, "hero") + '</div><div class="w in"><div class="glass">' + sh(c, "booking", "intro") + fullForm(c) + "</div></div>"; } },
    { n: "Lines", css: ".bk-8 .g{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(28px,6vw,96px);align-items:start}.bk-8 .sh{position:sticky;top:100px}.bk-8 .sh h2{font-size:calc(clamp(36px,5vw,72px)*var(--k,1)*var(--hk))}.bk-8 .inp{border:0;border-bottom:1px solid var(--sline);border-radius:0;padding-inline:0}.bk-8 .inp:focus{border-color:var(--sfg)}@media(max-width:760px){.bk-8 .g{grid-template-columns:1fr;gap:0}.bk-8 .sh{position:static}}", html: function (c) { return '<div class="w g pad">' + sh(c, "booking", "intro") + fullForm(c) + "</div>"; } },
    { n: "Choose first", css: ".bk-9 .g{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(28px,5vw,80px);align-items:start}.bk-9 .chips.big{display:grid;gap:8px}.bk-9 .chips.big .chip{text-align:left;padding:1.1em 1.2em;font-size:1em;font-family:var(--hf),serif;font-weight:var(--hw)}@media(max-width:760px){.bk-9 .g{grid-template-columns:1fr;gap:18px}.bk-9 .chips.big{grid-template-columns:1fr 1fr}}",
      html: function (c) { return '<div class="w pad">' + sh(c, "booking", "intro") + formOpen(c) + '<div class="g"><div>' + pOpts(c, true) + '</div><div class="bk-form">' + pickers(c, { noOpts: true }) + pDetails() + pSubmit(c) + "</div></div></form></div>"; } },
    { n: "Call or book", css: ".bk-10 .g{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(28px,6vw,96px);align-items:start}.bk-10 .call{display:grid;gap:10px;margin-top:28px;padding-top:24px;border-top:1px solid var(--sline)}.bk-10 .call a{font-family:var(--hf),serif;font-weight:var(--hw);font-size:calc(clamp(26px,3.2vw,44px)*var(--hk));text-decoration:none;line-height:1.1}@media(max-width:760px){.bk-10 .g{grid-template-columns:1fr;gap:28px}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w g pad"><div>' + sh(c, "booking", "intro") + '<div class="call"><span class="lb">Prefer to call?</span><a href="tel:' + esc(String(ct.phone).replace(/[^\d+]/g, "")) + '">' + esc(ct.phone) + '</a><a href="mailto:' + esc(ct.email) + '" style="font-size:1.1em;font-family:inherit">' + esc(ct.email) + "</a></div></div>" + fullForm(c) + "</div>"; } },
    { n: "Two-tone card", css: ".bk-11 .card{display:grid;grid-template-columns:1fr 1.5fr;border:1px solid var(--sline);border-radius:var(--r);overflow:hidden}.bk-11 .side{background:var(--bb);color:var(--bt);--smut:currentColor;padding:clamp(24px,4vw,48px);display:grid;align-content:start;gap:28px}.bk-11 .side .lede{opacity:.85}.bk-11 .side .info{display:grid;gap:14px;font-size:.92em}.bk-11 .main{padding:clamp(24px,4vw,48px)}@media(max-width:760px){.bk-11 .card{grid-template-columns:1fr}}",
      html: function (c) { return '<div class="w pad"><div class="card"><div class="side">' + sh(c, "booking", "intro") + infoBlock(c) + '</div><div class="main">' + fullForm(c) + "</div></div></div>"; } },
    { n: "Filled fields", css: ".bk-12 .in{max-width:680px}.bk-12 .sh h2{font-size:calc(clamp(36px,5vw,72px)*var(--k,1)*var(--hk))}.bk-12 .inp{background:var(--sline);border-color:transparent}.bk-12 .inp:focus{border-color:var(--sfg)}.bk-12 .chip,.bk-12 .days button,.bk-12 .stepper{background:var(--sline);border-color:transparent}",
      html: function (c) { return '<div class="w pad"><div class="in">' + sh(c, "booking", "intro") + fullForm(c) + "</div></div>"; } }
  ];

  /* ── Contact page designs ──────────────────────────────── */
  function hoursRows(c) { return lines(c.s.contact.hours).map(function (l) { var p = l.split(/\s{2,}|\t|\|/); return '<div class="hr"><span>' + esc(p[0]) + "</span><span>" + esc(p.slice(1).join(" ")) + "</span></div>"; }).join(""); }
  function addr(c) { return lines(c.s.contact.address).map(esc).join("<br>"); }
  function tel(c) { return '<a href="tel:' + esc(String(c.s.contact.phone).replace(/[^\d+]/g, "")) + '">' + t("contact.phone") + "</a>"; }
  function mail(c) { return '<a href="mailto:' + t("contact.email") + '">' + t("contact.email") + "</a>"; }
  var CT_BASE = ".ct a{text-decoration:none}.ct a:hover{text-decoration:underline}.hr{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--sline)}.hr span:last-child{color:var(--smut);text-align:right}";
  var CONTACTS = [
    { n: "Columns", css: ".ct-1 .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(16px,3vw,40px)}.ct-1 .cols>div{border-top:1px solid var(--sline);padding-top:16px;display:grid;gap:6px;align-content:start}.ct-1 .note{margin-top:32px}@media(max-width:760px){.ct-1 .cols{grid-template-columns:1fr 1fr}.ct-1 .cols>div:last-child{grid-column:1/-1}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad">' + sh(c, "contact") + '<div class="cols"><div><span class="lb">Visit</span><p>' + addr(c) + '</p></div><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Contact</span><p>' + tel(c) + "</p><p>" + mail(c) + "</p></div></div>" + (ct.note ? '<p class="mut note">' + t("contact.note") + "</p>" : "") + "</div>"; } },
    { n: "Split", css: ".ct-2 .g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,6vw,96px)}.ct-2 h2{font-size:calc(clamp(38px,5.4vw,80px)*var(--k,1)*var(--hk))}.ct-2 .row{display:grid;grid-template-columns:110px 1fr;gap:16px;padding:16px 0;border-top:1px solid var(--sline)}@media(max-width:760px){.ct-2 .g{grid-template-columns:1fr;gap:20px}.ct-2 .row{grid-template-columns:90px 1fr}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w g pad"><div><h2>' + t("contact.title") + "</h2>" + (ct.note ? '<p class="lede">' + t("contact.note") + "</p>" : "") + '</div><div><div class="row"><span class="lb">Address</span><p>' + addr(c) + '</p></div><div class="row"><span class="lb">Hours</span><div>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div></div><div class="row"><span class="lb">Phone</span><p>' + tel(c) + '</p></div><div class="row"><span class="lb">Email</span><p>' + mail(c) + "</p></div></div></div>"; } },
    { n: "With photo", css: ".ct-3 .g{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,6vw,96px);align-items:center}.ct-3 .ph{aspect-ratio:4/5}.ct-3 .d{display:grid;gap:18px;margin-top:8px}@media(max-width:760px){.ct-3 .g{grid-template-columns:.9fr 1fr;gap:18px;align-items:start}.ct-3 .d{font-size:.88em;gap:12px}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad">' + sh(c, "contact", "note") + '<div class="g"><div class="ph">' + im(c, "x2") + '</div><div class="d"><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Phone</span><p>' + tel(c) + '</p></div><div><span class="lb">Email</span><p>' + mail(c) + "</p></div></div></div></div>"; } },
    { n: "Big type", css: ".ct-4 .c{text-align:center}.ct-4 .big{display:grid;gap:4px;margin:clamp(24px,4vw,48px) 0}.ct-4 .big a{font-family:var(--hf),serif;font-weight:var(--hw);font-size:calc(clamp(30px,4.6vw,68px)*var(--hk));line-height:1.15;word-break:break-word}.ct-4 .two{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:640px;margin-inline:auto;padding-top:24px;border-top:1px solid var(--sline);text-align:left}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad c"><h2>' + t("contact.title") + '</h2><div class="big">' + tel(c) + mail(c) + '</div><div class="two"><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + "</div></div></div>"; } },
    { n: "Hours table", css: ".ct-5 .g{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(28px,6vw,96px)}.ct-5 .d{display:grid;gap:18px;margin-top:8px}.ct-5 .t{border-top:1px solid var(--sline)}@media(max-width:760px){.ct-5 .g{grid-template-columns:1fr;gap:24px}.ct-5 .d{grid-template-columns:1fr 1fr}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w g pad"><div>' + sh(c, "contact", "note") + '<div class="d"><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Contact</span><p>' + tel(c) + "</p><p>" + mail(c) + '</p></div></div></div><div><span class="lb">Opening hours</span><div class="t" style="margin-top:10px">' + hoursRows(c) + "</div></div></div>"; } },
    { n: "Message form", css: ".ct-6 .g{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(28px,6vw,96px);align-items:start}.ct-6 .d{display:grid;gap:18px}@media(max-width:760px){.ct-6 .g{grid-template-columns:1fr;gap:28px}.ct-6 .d{grid-template-columns:1fr 1fr}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w g pad"><div>' + sh(c, "contact", "note") + '<div class="d"><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Contact</span><p>' + tel(c) + "</p><p>" + mail(c) + "</p></div></div></div>" + '<form class="bk-form" method="POST" action="https://formsubmit.co/' + esc(ct.email) + '" novalidate><input type="hidden" name="_subject" value="New message — ' + esc(c.s.name) + '"><input type="hidden" name="_captcha" value="false"><div class="r3" style="grid-template-columns:1fr 1fr"><label class="fld"><span class="lb">Name</span><input class="inp" name="name" required></label><label class="fld"><span class="lb">Email</span><input class="inp" type="email" name="email" required></label></div><div class="fld"><span class="lb">Message</span><textarea class="inp" name="message" required></textarea></div><p class="err-msg" aria-live="polite"></p><div><button class="btn" type="submit">Send message</button></div><div class="sent-msg"><h3>Message sent.</h3><p class="mut">Thank you. We\'ll reply soon.</p></div></form></div>'; } },
    { n: "Cards", css: ".ct-7 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(8px,1.4vw,16px)}.ct-7 .card{border:1px solid var(--sline);border-radius:var(--r);padding:clamp(18px,2.6vw,32px);display:grid;gap:6px;align-content:start}.ct-7 h3{margin-bottom:8px}@media(max-width:760px){.ct-7 .grid{grid-template-columns:1fr 1fr}.ct-7 .card:last-child{grid-column:1/-1}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad">' + sh(c, "contact", "note") + '<div class="grid"><div class="card"><h3>Visit</h3><p>' + addr(c) + '</p></div><div class="card"><h3>Hours</h3>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div class="card"><h3>Get in touch</h3><p>' + tel(c) + "</p><p>" + mail(c) + "</p></div></div></div>"; } },
    { n: "Photo banner", css: ".ct-8{min-height:560px;display:flex;align-items:flex-end}.ct-8 .in{position:relative;padding-block:clamp(40px,6vw,80px)}.ct-8 .card{background:var(--sbg);max-width:520px;padding:clamp(24px,3.6vw,44px);border-radius:var(--r);display:grid;gap:14px}.ct-8 .card h2{margin-bottom:6px}@media(max-width:760px){.ct-8 .in{padding-block:20px}}",
      html: function (c) { var ct = c.s.contact; return '<div class="bgimg">' + im(c, "x2") + '</div><div class="w in"><div class="card"><h2>' + t("contact.title") + '</h2><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Contact</span><p>' + tel(c) + " &middot; " + mail(c) + "</p></div></div></div>"; } },
    { n: "Centred list", css: ".ct-9 .c{text-align:center;max-width:560px;margin-inline:auto}.ct-9 .l{display:grid;margin-top:12px}.ct-9 .l>div{padding:16px 0;border-top:1px solid var(--sline);display:grid;gap:4px}.ct-9 .l>div:last-child{border-bottom:1px solid var(--sline)}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad"><div class="c">' + sh(c, "contact", "note", true) + '<div class="l"><div><span class="lb">Address</span><p>' + addr(c) + '</p></div><div><span class="lb">Hours</span>' + lines(ct.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Phone</span><p>' + tel(c) + '</p></div><div><span class="lb">Email</span><p>' + mail(c) + "</p></div></div></div></div>"; } },
    { n: "Accent block", css: ".ct-10 .g{display:grid;grid-template-columns:1fr 1fr;border-radius:var(--r);overflow:hidden;border:1px solid var(--sline)}.ct-10 .blk{background:var(--bb);color:var(--bt);--smut:currentColor;padding:clamp(28px,5vw,64px);display:grid;gap:14px;align-content:center}.ct-10 .blk a.big{font-family:var(--hf),serif;font-weight:var(--hw);font-size:calc(clamp(26px,3.4vw,50px)*var(--hk));line-height:1.1}.ct-10 .hrs{padding:clamp(28px,5vw,64px)}@media(max-width:760px){.ct-10 .g{grid-template-columns:1fr}}",
      html: function (c) { var ct = c.s.contact; return '<div class="w pad"><div class="g"><div class="blk"><h2>' + t("contact.title") + '</h2><a class="big" href="tel:' + esc(String(ct.phone).replace(/[^\d+]/g, "")) + '">' + esc(ct.phone) + "</a><p>" + mail(c) + "</p><p>" + addr(c) + '</p></div><div class="hrs"><span class="lb">Opening hours</span><div style="margin-top:10px">' + hoursRows(c) + "</div></div></div></div>"; } }
  ];

  /* ── Footer designs ────────────────────────────────────── */
  function credit(c) { return c.s.credit ? '<a href="https://onwardsdigital.com" class="mut">Site by Onwards Digital</a>' : ""; }
  function flinks(c) { return c.pages.map(function (p) { return '<a href="#' + p.id + '">' + esc(p.label) + "</a>"; }).join(""); }
  var FT_BASE = ".ft a{text-decoration:none}.ft a:hover{text-decoration:underline}.ft .small{font-size:.82em;color:var(--smut);display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}";
  var FOOTERS = [
    { n: "Columns", css: ".ft-1 .g{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px;padding-block:clamp(40px,6vw,72px) 32px}.ft-1 .g>div{display:grid;gap:8px;align-content:start;font-size:.94em}.ft-1 .logo{font-size:1.8em;margin-bottom:6px}.ft-1 .small{padding:20px 0 28px;border-top:1px solid var(--sline)}@media(max-width:760px){.ft-1 .g{grid-template-columns:1fr 1fr}.ft-1 .g>div:first-child{grid-column:1/-1}}",
      html: function (c) { return '<div class="w g"><div>' + logo(c) + '<p class="mut">' + t("tagline") + "</p></div><div>" + flinks(c) + '</div><div><p>' + addr(c) + "</p><p>" + tel(c) + "</p><p>" + mail(c) + '</p></div></div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span>" + credit(c) + "</div>"; } },
    { n: "Centred", css: ".ft-2 .in{text-align:center;display:grid;gap:22px;justify-items:center;padding-block:clamp(48px,7vw,88px) 28px}.ft-2 .logo{font-size:2.4em}.ft-2 nav{display:flex;flex-wrap:wrap;gap:10px 28px;justify-content:center}.ft-2 .small{justify-content:center;padding-bottom:28px}",
      html: function (c) { return '<div class="w in">' + logo(c) + '<p class="mut">' + t("tagline") + "</p><nav>" + flinks(c) + '</nav></div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + " &middot; " + t("contact.phone") + "</span>" + credit(c) + "</div>"; } },
    { n: "One line", css: ".ft-3 .in{display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center;justify-content:space-between;padding-block:28px;font-size:.9em;border-top:1px solid var(--sline)}.ft-3 nav{display:flex;flex-wrap:wrap;gap:8px 22px}",
      html: function (c) { return '<div class="w in"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span><nav>" + flinks(c) + "</nav>" + (credit(c) || "<span></span>") + "</div>"; } },
    { n: "Big name", css: ".ft-4{overflow:hidden}.ft-4 .top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px 40px;padding-top:clamp(40px,6vw,72px);font-size:.94em}.ft-4 nav{display:flex;flex-wrap:wrap;gap:8px 24px}.ft-4 .huge{font-family:var(--hf),serif;font-weight:var(--hw);font-size:clamp(56px,13vw,210px);line-height:.9;letter-spacing:-.03em;white-space:nowrap;margin:clamp(28px,5vw,64px) 0 -0.12em;padding-inline:var(--gut)}.ft-4 .small{padding-bottom:22px;padding-top:28px}",
      html: function (c) { return '<div class="w top"><nav>' + flinks(c) + "</nav><span>" + esc(lines(c.s.contact.address).join(", ")) + " &middot; " + tel(c) + '</span></div><div class="huge">' + t("name") + '</div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span>" + credit(c) + "</div>"; } },
    { n: "Two sides", css: ".ft-5 .g{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding-block:clamp(40px,6vw,72px) 28px;align-items:end}.ft-5 .logo{font-size:2em}.ft-5 .l{display:grid;gap:8px}.ft-5 .r{display:grid;gap:10px;justify-items:end;text-align:right}.ft-5 nav{display:flex;flex-wrap:wrap;gap:8px 22px;justify-content:flex-end}.ft-5 .small{padding:18px 0 26px;border-top:1px solid var(--sline)}@media(max-width:760px){.ft-5 .g{grid-template-columns:1fr}.ft-5 .r{justify-items:start;text-align:left}.ft-5 nav{justify-content:flex-start}}",
      html: function (c) { return '<div class="w g"><div class="l">' + logo(c) + '<p class="mut">' + t("tagline") + '</p></div><div class="r"><nav>' + flinks(c) + "</nav><p>" + tel(c) + " &middot; " + mail(c) + '</p></div></div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span>" + credit(c) + "</div>"; } },
    { n: "With hours", css: ".ft-6 .g{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:32px;padding-block:clamp(40px,6vw,72px) 28px;font-size:.94em}.ft-6 .g>div{display:grid;gap:6px;align-content:start}.ft-6 .logo{font-size:1.7em}.ft-6 .small{padding:18px 0 26px;border-top:1px solid var(--sline)}@media(max-width:760px){.ft-6 .g{grid-template-columns:1fr 1fr}.ft-6 .g>div:first-child{grid-column:1/-1}}",
      html: function (c) { return '<div class="w g"><div>' + logo(c) + '<p class="mut">' + t("tagline") + '</p></div><div><span class="lb">Hours</span>' + lines(c.s.contact.hours).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + '</div><div><span class="lb">Find us</span><p>' + addr(c) + "</p><p>" + tel(c) + "</p><p>" + mail(c) + '</p></div></div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span>" + credit(c) + "</div>"; } },
    { n: "Call to action", css: ".ft-7 .cta{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px;padding-block:clamp(40px,6vw,72px);border-bottom:1px solid var(--sline)}.ft-7 .cta h2{font-size:calc(clamp(28px,3.6vw,52px)*var(--hk))}.ft-7 .in{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 28px;padding-block:24px;font-size:.9em}.ft-7 nav{display:flex;flex-wrap:wrap;gap:8px 22px}",
      html: function (c) { var btn = c.target && c.target !== "home" ? '<a class="btn" href="#' + c.target + '">' + esc(c.s.hero.cta || "Contact us") + "</a>" : ""; return '<div class="w cta"><h2>' + t("contact.title") + "</h2>" + btn + '</div><div class="w in"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + "</span><nav>" + flinks(c) + "</nav>" + (credit(c) || "<span></span>") + "</div>"; } },
    { n: "Boxed", css: ".ft-8 .box{border:1px solid var(--sline);border-radius:var(--r);padding:clamp(24px,4vw,48px);margin-block:clamp(28px,4vw,48px) 20px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}.ft-8 .box>div{display:grid;gap:8px}.ft-8 nav{display:flex;flex-wrap:wrap;gap:8px 22px}.ft-8 .small{padding-bottom:24px}@media(max-width:760px){.ft-8 .box{grid-template-columns:1fr}}",
      html: function (c) { return '<div class="w"><div class="box"><div>' + logo(c) + '<p class="mut">' + t("tagline") + "</p></div><nav>" + flinks(c) + '</nav></div></div><div class="w small"><span>&copy; ' + new Date().getFullYear() + " " + t("name") + " &middot; " + esc(c.s.contact.phone) + "</span>" + credit(c) + "</div>"; } }
  ];

  var SECTIONS = { header: HEADERS, hero: HEROES, about: ABOUTS, services: SERVICES, gallery: GALLERIES, booking: BOOKINGS, contact: CONTACTS, footer: FOOTERS };
  var PFX = { header: "hd", hero: "he", about: "ab", services: "sv", gallery: "ga", booking: "bk", contact: "ct", footer: "ft" };

  function pick(key, s) { var list = SECTIONS[key]; var v = Math.max(0, Math.min(list.length - 1, s[key].v | 0)); return { t: list[v], cls: PFX[key] + "-" + (v + 1) }; }

  function renderHeader(c) { var p = pick("header", c.s); return '<header class="s hd ' + p.cls + " t-" + c.s.header.tone + '">' + p.t.html(c) + "</header>"; }
  function renderFooter(c) { var p = pick("footer", c.s); return '<footer class="s ft ' + p.cls + " t-" + c.s.footer.tone + '">' + p.t.html(c) + "</footer>"; }
  function renderSection(c, key) { var p = pick(key, c.s); return sec(c, key, key === "hero" ? "he " + p.cls : (key === "contact" ? "ct " : "") + p.cls, p.t.html(c)); }

  /* Which CSS is needed for a given render */
  function css(s, only) {
    var parts = [rootVars(s), BASE_CSS, HEADER_BASE, CT_BASE, FT_BASE];
    var keys = only ? (only === "hero" || only === "header" ? ["header", "hero"] : [only]) : ["header", "hero", "about", "services", "gallery", "booking", "contact", "footer"];
    keys.forEach(function (k) { parts.push(pick(k, s).t.css); });
    if (!only || only === "hero") parts.push(HL_CSS);
    return parts.join("\n");
  }

  function bodyHTML(s, only, edit) {
    EDIT = !!edit; CUR = s;
    try { return bodyInner(s, only); } finally { EDIT = false; }
  }
  function bodyInner(s, only) {
    var c = ctx(s);
    if (only) {
      if (only === "header") return renderHeader(c) + renderSection(c, "hero");
      if (only === "hero") return renderHeader(c) + renderSection(c, "hero") + highlights(c);
      if (only === "footer") return '<div class="s t-base" style="height:560px"></div>' + renderFooter(c);
      return renderSection(c, only);
    }
    var out = renderHeader(c) + "<main>";
    out += '<div class="pg" id="pg-home">' + renderSection(c, "hero") + highlights(c) + "</div>";
    c.pages.forEach(function (p) { if (p.id !== "home") out += '<div class="pg" id="pg-' + p.id + '">' + renderSection(c, p.id) + "</div>"; });
    return out + "</main>" + renderFooter(c);
  }
  function bodyClass(s) { return (s.onePage ? "single" : "multi") + " r-" + s.theme.radius + " b-" + s.theme.btn; }

  /* The small script every finished site carries: page switching, the phone
     menu, the day/time pickers, the slideshow and form checks. */
  var RUNTIME = "(" + function () {
    var d = document, P = d.documentElement.hasAttribute("data-preview"), cur = "home";
    function pages() { return [].slice.call(d.querySelectorAll(".pg")); }
    function show(id, scroll) {
      if (!d.getElementById("pg-" + id)) id = "home";
      cur = id;
      var multi = d.body.classList.contains("multi");
      pages().forEach(function (p) { p.hidden = multi && p.id !== "pg-" + id; });
      [].forEach.call(d.querySelectorAll("[data-l]"), function (a) { a.classList.toggle("on", a.getAttribute("data-l") === id); });
      [].forEach.call(d.querySelectorAll(".hd.open"), function (h) { h.classList.remove("open"); });
      if (scroll !== false) {
        if (multi) window.scrollTo(0, 0);
        else { var t = d.getElementById("pg-" + id), hd = d.querySelector(".hd"); if (t) window.scrollTo({ top: id === "home" ? 0 : t.getBoundingClientRect().top + window.scrollY - (hd && getComputedStyle(hd).position === "sticky" ? hd.offsetHeight : 0), behavior: "smooth" }); }
      }
      if (P) try { parent.postMessage({ sitePage: id }, "*"); } catch (e) {}
    }
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function iso(dt) { return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()); }
    var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function setVal(el, v) { var f = el.closest(".fld"), inp = f && f.querySelector("input[type=hidden]"); if (inp) inp.value = v; }
    function buildCal(el, y, m) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var first = new Date(y, m, 1), start = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
      var h = '<div class="ch"><button type="button" data-cm="-1" aria-label="Previous month">&#8249;</button><span>' + MO[m] + " " + y + '</span><button type="button" data-cm="1" aria-label="Next month">&#8250;</button></div><div class="cg">';
      ["M", "T", "W", "T", "F", "S", "S"].forEach(function (x) { h += "<span>" + x + "</span>"; });
      for (var i = 0; i < start; i++) h += "<i></i>";
      var sel = el.getAttribute("data-sel");
      for (var dnum = 1; dnum <= days; dnum++) { var dt = new Date(y, m, dnum), v = iso(dt); h += '<button type="button" data-cd="' + v + '"' + (dt < today ? " disabled" : "") + (sel === v ? ' class="on"' : "") + ">" + dnum + "</button>"; }
      el.innerHTML = h + "</div>"; el.setAttribute("data-y", y); el.setAttribute("data-m", m);
    }
    function arm() {
      if (!P) return;
      [].forEach.call(d.querySelectorAll("[data-e]"), function (el) { if (el.getAttribute("contenteditable")) return; try { el.contentEditable = "plaintext-only"; } catch (x) { el.contentEditable = "true"; } el.spellcheck = false; });
    }
    function fill() {
      arm();
      [].forEach.call(d.querySelectorAll("[data-days]"), function (el) {
        if (el.children.length) return;
        var h = "", now = new Date();
        for (var i = 0; i < 7; i++) { var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); h += '<button type="button" data-pick="' + iso(dt) + '"><small>' + (i === 0 ? "Today" : WD[dt.getDay()]) + "</small><b>" + dt.getDate() + "</b></button>"; }
        el.innerHTML = h;
      });
      [].forEach.call(d.querySelectorAll("[data-cal]"), function (el) { if (el.children.length) return; var n = new Date(); buildCal(el, n.getFullYear(), n.getMonth()); });
    }
    d.addEventListener("click", function (e) {
      var t = e.target;
      if (P && t.closest("[data-e]")) { if (t.closest("a,button")) e.preventDefault(); return; }
      var sw = t.closest("[data-swap]");
      if (sw) { var g2 = sw.closest("[data-gal]"), mi = g2.querySelector("[data-main] img"); if (mi) mi.src = sw.getAttribute("data-swap"); [].forEach.call(g2.querySelectorAll("[data-swap]"), function (x) { x.classList.toggle("on", x === sw); }); return; }
      var a = t.closest("a[href^='#']");
      if (a) { var id = a.getAttribute("href").slice(1); if (d.getElementById("pg-" + id)) { e.preventDefault(); show(id); if (!P) try { history.replaceState(null, "", "#" + id); } catch (x) {} } return; }
      if (P && t.closest("a[href]")) { e.preventDefault(); return; }
      var mb = t.closest(".menu-btn"); if (mb) { mb.closest(".hd").classList.toggle("open"); return; }
      var pk = t.closest("[data-pick]");
      if (pk) { var g = pk.parentElement; [].forEach.call(g.children, function (x) { x.classList.toggle("on", x === pk); }); setVal(g, pk.getAttribute("data-pick")); return; }
      var cd = t.closest("[data-cd]");
      if (cd) { var cal = cd.closest("[data-cal]"); cal.setAttribute("data-sel", cd.getAttribute("data-cd")); [].forEach.call(cal.querySelectorAll("[data-cd]"), function (x) { x.classList.toggle("on", x === cd); }); setVal(cal, cd.getAttribute("data-cd")); return; }
      var cm = t.closest("[data-cm]");
      if (cm) { var cl = cm.closest("[data-cal]"), y = +cl.getAttribute("data-y"), m = +cl.getAttribute("data-m") + (+cm.getAttribute("data-cm")); if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } buildCal(cl, y, m); return; }
      var st = t.closest("[data-step]");
      if (st) { var box = st.parentElement, o = box.querySelector("output"), v = Math.max(1, Math.min(20, (+o.textContent || 2) + (+st.getAttribute("data-step")))); o.textContent = v; setVal(box, v); return; }
      var sl = t.closest("[data-slide]");
      if (sl) { var sh = sl.closest("[data-show]"), s = [].slice.call(sh.querySelectorAll(".sl")), i = s.findIndex(function (x) { return x.classList.contains("on"); }); i = (i + (+sl.getAttribute("data-slide")) + s.length) % s.length; s.forEach(function (x, j) { x.classList.toggle("on", j === i); }); var cnt = sh.querySelector(".count"); if (cnt) cnt.textContent = (i + 1) + " / " + s.length; }
    });
    d.addEventListener("submit", function (e) {
      var f = e.target, msg = f.querySelector(".err-msg"), bad = "";
      [].forEach.call(f.querySelectorAll("[required]"), function (x) { if (!bad && !String(x.value).trim()) bad = "Please fill in your " + (x.name || "details") + "."; });
      var em = f.querySelector("input[type=email]"); if (!bad && em && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(em.value.trim())) bad = "Please enter a valid email address.";
      var day = f.querySelector("input[name=day]"); if (!bad && day && !day.value) bad = "Please choose a day.";
      var tm = f.querySelector("input[name=time]"); if (!bad && tm && !tm.value) bad = "Please choose a time.";
      if (bad) { e.preventDefault(); if (msg) msg.textContent = bad; return; }
      if (msg) msg.textContent = "";
      if (P) { e.preventDefault(); f.classList.add("sent"); }
    });
    if (P) {
      d.addEventListener("input", function (e) {
        var el = e.target.closest && e.target.closest("[data-e]"); if (!el) return;
        var v = el.innerText;
        v = el.hasAttribute("data-m") ? v.replace(/\n{3,}/g, "\n\n").trim() : v.replace(/\s*\n\s*/g, " ");
        try { parent.postMessage({ edit: el.getAttribute("data-e"), value: v }, "*"); } catch (x) {}
      });
      d.addEventListener("keydown", function (e) { var el = e.target.closest && e.target.closest("[data-e]"); if (el && e.key === "Enter" && !el.hasAttribute("data-m")) { e.preventDefault(); el.blur(); } });
      d.addEventListener("focusout", function (e) { if (e.target.closest && e.target.closest("[data-e]")) try { parent.postMessage({ editDone: true }, "*"); } catch (x) {} });
    }
    window.__site = { show: show, fill: fill, page: function () { return cur; } };
    fill();
    show(P ? "home" : (location.hash.slice(1) || "home"), false);
  } + ")();";

  function doc(s, o) {
    o = o || {};
    var head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      "<title>" + esc(s.name) + (s.tagline ? " — " + esc(s.tagline) : "") + "</title>" +
      '<meta name="description" content="' + esc(s.tagline) + '">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link id="fonts" rel="stylesheet" href="' + fontsHref(s) + '"><style id="css">' + css(s, o.only) + "</style>" +
      (o.thumb ? "<style>html,body{overflow:hidden;pointer-events:none}.hd{position:relative}</style>" : "") +
      (o.preview ? "<style>html{scrollbar-width:thin}[data-e]{cursor:text;outline:1px dashed transparent;outline-offset:3px;border-radius:2px;transition:outline-color .15s}[data-e]:hover{outline-color:rgba(128,128,128,.7)}[data-e]:focus{outline:1.5px solid rgba(128,128,128,.95)}.pe{display:block}.pe:empty:before,[data-e]:empty:before{content:'Click to type';opacity:.4}</style>" : "");
    return "<!DOCTYPE html><html lang=\"en\"" + (o.preview || o.thumb ? " data-preview" : "") + "><head>" + head + '</head><body class="' + bodyClass(s) + '"><div id="root">' + bodyHTML(s, o.only, o.preview) + "</div>" + (o.thumb ? "" : "<script>" + RUNTIME + "<\/script>") + "</body></html>";
  }

  function count() {
    var n = 1; Object.keys(SECTIONS).forEach(function (k) { n *= SECTIONS[k].length; });
    return n * PALETTES.length * HEAD_FONTS.length * BODY_FONTS.length * 3 * 3;
  }

  return {
    PRESETS: PRESETS, PALETTES: PALETTES, HEAD_FONTS: HEAD_FONTS, BODY_FONTS: BODY_FONTS, SECTIONS: SECTIONS,
    defaults: defaults, applyPreset: applyPreset, doc: doc, css: css, body: bodyHTML, bodyClass: bodyClass,
    fontsHref: fontsHref, allFontsHref: allFontsHref, colors: colors, onColor: onColor, mix: mix, count: count, ctx: ctx
  };
})();
