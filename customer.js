// تطبيق العملاء – Goten
(function () {
  const { esc, money, ls, toast, sheet, closeSheet, STATUS, STATUS_FLOW, AREAS, fmtDate, LOGO } = UI;
  const T = {
    ar: { tag: "أسماك ومأكولات بحرية طازجة", search: "ابحث عن سمك، روبيان...", cats: "الأقسام", all: "الكل", offers: "عروض مميزة", products: "المنتجات", add: "أضف", out: "نفدت الكمية", home: "الرئيسية", cart: "السلة", orders: "طلباتي", viewCart: "عرض السلة", emptyCart: "سلتك فاضية", startShop: "ابدأ التسوق", subtotal: "المجموع", delivery: "التوصيل", free: "مجاني", total: "الإجمالي", checkout: "إتمام الطلب", minOrder: "الحد الأدنى للطلب", freeOver: "توصيل مجاني للطلبات فوق", name: "الاسم", phone: "رقم الهاتف", area: "المنطقة", chooseArea: "اختر المنطقة", block: "قطعة", street: "شارع", avenue: "جادة", house: "منزل / مبنى", floor: "الدور / الشقة", notes: "ملاحظات (تنظيف، تقطيع...)", slot: "وقت التوصيل", asap: "بأسرع وقت", pay: "طريقة الدفع", cash: "كاش عند الاستلام", knet: "كي نت عند الاستلام (جهاز المندوب)", place: "تأكيد الطلب", placed: "تم استلام طلبك!", orderNo: "رقم الطلب", track: "تتبع الطلب", noOrders: "ما عندك طلبات لسه", closed: "المتجر مغلق حالياً", driver: "المندوب", call: "اتصال", items: "المنتجات", back: "رجوع", required: "عبّي الحقول المطلوبة", phoneBad: "رقم الهاتف لازم 8 أرقام", lang: "English", addr: "عنوان التوصيل", whats: "واتساب", qty: "الكمية", today: "اليوم", tomorrow: "بكرة", noRes: "ما في نتائج", optin: "أوافق على استلام العروض والخصومات على الواتساب", cats2: "التصنيفات", status: "حالة الطلب", account: "حسابي", review: "مراجعة الطلب", addCart: "أضف إلى السلة", busy: "الفرع مشغول حالياً", deliverTo: "التوصيل إلى:", pickArea: "اختر منطقتك", eta: "توصيل نفس اليوم", other: "منتجات أخرى", seeAll: "الكل", myAddr: "عنواني", noAddr: "لسه ماسجلتش عنوان – هيتحفظ أول ما تطلب", contact: "تواصل معانا", installApp: "ضيف التطبيق للشاشة الرئيسية", installHint: "من Safari: زرار المشاركة ⬆️ ← إضافة إلى الشاشة الرئيسية", notif: "إشعارات العروض", langLbl: "اللغة", editAddr: "تعديل العنوان", save: "حفظ", coupon: "كود خصم", apply: "تطبيق", remove: "إزالة", discount: "الخصم", couponOk: "تم تطبيق الكود ✓", choose: "اختار", inCart: "في السلة", day: "اليوم", pickTime: "اختار الوقت", noSlots: "مفيش مواعيد متاحة", afterTomorrow: "بعد بكرة", errs: { COUPON_INVALID: "الكود غلط أو مش شغال", COUPON_EXPIRED: "الكود انتهت صلاحيته", COUPON_LIMIT: "الكود خلص عدد استخداماته", COUPON_USED: "استخدمت الكود ده قبل كده", COUPON_MIN: "الكود محتاج طلب بحد أدنى", STORE_CLOSED: "المتجر مغلق حالياً", PRODUCT_UNAVAILABLE: "منتج في سلتك لم يعد متوفراً", OUT_OF_STOCK: "الكمية المطلوبة أكبر من المتوفر", MIN_ORDER: "الطلب أقل من الحد الأدنى", EMPTY: "السلة فاضية" } },
    en: { tag: "Fresh fish & seafood", search: "Search fish, shrimp...", cats: "Categories", all: "All", offers: "Special offers", products: "Products", add: "Add", out: "Out of stock", home: "Home", cart: "Cart", orders: "Orders", viewCart: "View cart", emptyCart: "Your cart is empty", startShop: "Start shopping", subtotal: "Subtotal", delivery: "Delivery", free: "Free", total: "Total", checkout: "Checkout", minOrder: "Minimum order", freeOver: "Free delivery over", name: "Name", phone: "Phone", area: "Area", chooseArea: "Choose area", block: "Block", street: "Street", avenue: "Avenue", house: "House / Building", floor: "Floor / Apt", notes: "Notes (cleaning, cutting...)", slot: "Delivery time", asap: "As soon as possible", pay: "Payment", cash: "Cash on delivery", knet: "KNET on delivery (driver's machine)", place: "Place order", placed: "Order received!", orderNo: "Order no.", track: "Track order", noOrders: "No orders yet", closed: "Store is closed now", driver: "Driver", call: "Call", items: "Items", back: "Back", required: "Please fill the required fields", phoneBad: "Phone must be 8 digits", lang: "عربي", addr: "Delivery address", whats: "WhatsApp", qty: "Qty", today: "Today", tomorrow: "Tomorrow", noRes: "No results", optin: "Send me offers & discounts on WhatsApp", cats2: "Categories", status: "Order status", account: "Account", review: "Review order", addCart: "Add to cart", busy: "Store is busy now", deliverTo: "Deliver to:", pickArea: "Choose your area", eta: "Same-day delivery", other: "More products", seeAll: "All", myAddr: "My address", noAddr: "No address yet – it will be saved with your first order", contact: "Contact us", installApp: "Add the app to your Home Screen", installHint: "In Safari: Share ⬆️ → Add to Home Screen", notif: "Offer notifications", langLbl: "Language", editAddr: "Edit address", save: "Save", coupon: "Promo code", apply: "Apply", remove: "Remove", discount: "Discount", couponOk: "Code applied ✓", choose: "Choose", inCart: "in cart", day: "Day", pickTime: "Pick a time", noSlots: "No slots available", afterTomorrow: "Day after", errs: { COUPON_INVALID: "Invalid code", COUPON_EXPIRED: "Code expired", COUPON_LIMIT: "Code fully used", COUPON_USED: "You already used this code", COUPON_MIN: "Code needs a higher minimum order", STORE_CLOSED: "Store is closed now", PRODUCT_UNAVAILABLE: "An item in your cart is no longer available", OUT_OF_STOCK: "Requested quantity is more than available", MIN_ORDER: "Order is below the minimum", EMPTY: "Cart is empty" } }
  };
  const L = (ar, en) => (S.lang === "en" ? en : ar);
  const S = { secMode: {}, feeSel: [], pts: null, usePts: false, lang: ls.get("ik_lang", "ar"), cart: ls.get("ik_cart", {}), my: ls.get("ik_orders", []), addr: ls.get("ik_addr", {}), view: "home", searchOpen: false, edit: false, all: { p: [], c: [], b: [] }, cat: null, q: "", products: [], cats: [], banners: [], settings: {} };
  const t = (k) => T[S.lang][k];
  const nm = (o, f = "name") => (S.lang === "en" && o[f + "_en"]) || o[f + "_ar"] || "";
  const $ = (id) => document.getElementById(id);
  const saveCart = () => ls.set("ik_cart", S.cart);

  function setLang(l) { S.lang = l; ls.set("ik_lang", l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; render(); }

  async function load() {
    const [p, c, b, s] = await Promise.all([Store.products(), Store.categories(), Store.banners(), Store.settings()]);
    S.all = { p, c, b }; S.products = S.edit ? p : p.filter((x) => x.active); S.cats = S.edit ? c : c.filter((x) => x.active); S.banners = S.edit ? b : b.filter((x) => x.active); S.settings = s || {};
    // تنظيف السلة من منتجات محذوفة
    Object.keys(S.cart).forEach((k) => { if (!S.products.find((p) => p.id === k.split("|")[0])) delete S.cart[k]; }); saveCart();
  }

  // مفتاح السلة: id أو id|اختيار1|اختيار2 (بترتيب مجموعات الاختيارات)
  const optsOf = (p) => (Array.isArray(p.options) ? p.options : []).filter((g) => g && g.name && (g.choices || []).length);
  const hasOpts = (p) => optsOf(p).length > 0;
  function lineOf(key, q) {
    const [id, ...sel] = key.split("|"), p = S.products.find((x) => x.id === id); if (!p) return null;
    const opts = optsOf(p).map((g, i) => { const ch = g.choices.find((c) => c.name === sel[i]) || g.choices[0]; return { g: g.name, c: ch.name, price: Number(ch.price || 0) }; });
    return { key, p, q, opts, unit: Math.max(0, Number(p.price) + opts.reduce((a, o) => a + o.price, 0)) };
  }
  const cartLines = () => Object.entries(S.cart).map(([k, q]) => lineOf(k, q)).filter(Boolean);
  const qOf = (id) => Object.entries(S.cart).reduce((a, [k, q]) => a + (k === id || k.startsWith(id + "|") ? q : 0), 0);
  const optsTxt = (opts) => opts.filter((o) => o.c).map((o) => `${o.g}: ${o.c}`).join(" · ");
  const cartCount = () => cartLines().reduce((a, l) => a + l.q, 0);
  const isKg = (p) => /كيلو|كغ|كجم/.test(p.unit_ar || "") || /(^|[^a-z])(kg|kilo)/i.test(p.unit_en || "");
  function feeLines(all) {
    const c = { kr: 0, pr: 0, kw: 0, pw: 0 };
    cartLines().forEach((l) => { const w = l.p.sale_type === "wholesale", k = isKg(l.p); c[(k ? "k" : "p") + (w ? "w" : "r")] += l.q; });
    return (S.settings.fees || []).filter((f) => f.on !== false && Number(f.price) > 0 && (all || f.mode !== "optional" || S.feeSel.includes(f.id))).map((f) => {
      const w = !!f.w, q = f.basis === "kg" ? c.kr + (w ? c.kw : 0) : f.basis === "piece" ? c.pr + (w ? c.pw : 0) : f.basis === "order" ? (c.kr + c.pr > 0 || w ? 1 : 0) : c.kr + c.pr + (w ? c.kw + c.pw : 0);
      return { f, q, amount: Math.round(Number(f.price) * q * 1000) / 1000 };
    }).filter((x) => x.q > 0);
  }
  const FEE_U = { kg: ["كيلو", "kg"], piece: ["حبة", "pc"], qty: ["وحدة", "unit"], order: ["طلب", "order"] };
  function totals() {
    const sub = cartLines().reduce((a, l) => a + l.unit * l.q, 0), s = S.settings;
    let fee = s.free_delivery_over && sub >= s.free_delivery_over ? 0 : Number(s.delivery_fee || 0);
    const c = S.coupon; let disc = 0;
    if (c) { if (c.kind === "free_delivery") fee = 0; else disc = Math.min(sub, Number(c.discount || 0)); }
    let pts = 0, pd = 0; const P = S.pts;
    if (S.usePts && P && P.on && P.points > 0 && P.points >= Number(P.min || 0) && Number(P.point_value) > 0) { pts = Math.min(P.points, Math.floor(Math.max(0, sub - disc) / Number(P.point_value))); pd = Math.round(pts * Number(P.point_value) * 1000) / 1000; }
    const fl = feeLines(), ft = fl.reduce((a, f) => a + f.amount, 0);
    return { sub, fee, disc, pts, pd, fl, ft, total: Math.max(0, sub - disc - pd + fee + ft) };
  }
  function setQty(key, q) {
    const id = key.split("|")[0], p = S.products.find((x) => x.id === id), max = p && p.stock != null ? Math.floor(Number(p.stock)) : 99;
    const others = qOf(id) - (S.cart[key] || 0);
    if (q + others > max) { q = Math.max(0, max - others); toast(S.lang === "en" ? `Only ${max} available` : `المتوفر ${max} بس`, "err"); }
    if (q <= 0) delete S.cart[key]; else S.cart[key] = Math.min(99, q);
    if (S.coupon) S.coupon = null; // يتحسب تاني لو السلة اتغيرت
    saveCart(); render();
  }

  // ---------- العرض ----------
  const IC = {
    search: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    cats: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><path d="M17.25 13l4.25 4.25-4.25 4.25L13 17.25z"/></svg>',
    status: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1.2 12a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>'
  };
  function header() {
    const s = S.settings, logo = s.logo ? `<img src="${esc(s.logo)}" alt="">` : LOGO;
    return `<header class="shop-top"><div class="wrap"><div class="shop-row">
        <div class="shop-side">${!S.edit ? `<button class="icon-btn" data-search aria-label="search">${IC.search}</button>` : ""}${Store.live && !S.edit ? `<button class="icon-btn" data-pushc aria-label="notifications">${UI.pushState() === "granted" ? "🔔" : "🔕"}</button>` : ""}</div>
        <div class="shop-brand">${logo}<span>${esc(s.store_name || "Goten")}</span>${S.edit ? '<button class="ebtn" data-ed="header">✏️</button>' : ""}</div>
        <div class="shop-side end">${S.canEdit ? `<button class="icon-btn txt" data-editmode>${S.edit ? "✅" : "⚙️"}</button>` : ""}<button class="lang-btn" data-lang>${S.lang === "ar" ? "En" : "ع"}</button></div>
      </div>
      ${S.edit ? `<div class="etools"><button data-ed="newprod">➕ منتج</button><button data-ed="newcat">🗂️ قسم</button><button data-ed="newban">🖼️ بنر</button><button data-ed="header">🎨 الشعار والاسم</button><a href="admin.html" target="_blank" rel="noopener">📊 لوحة التحكم</a></div>` : ""}
      ${S.searchOpen ? `<div class="search">${IC.search}<input id="q" placeholder="${t("search")}" value="${esc(S.q)}" autocomplete="off"></div>` : ""}</div></header>`;
  }
  function qtyCtl(p) {
    const q = qOf(p.id);
    if (hasOpts(p) && p.in_stock && S.settings.store_open) return q ? `<div class="qty"><button data-open="${p.id}">+</button><b>${q}</b><button data-dec="${p.id}">−</button></div>` : `<button class="add-pill" data-open="${p.id}">${t("choose")} +</button>`;
    if (!p.in_stock) return `<button class="add-out" disabled>${t("out")}</button>`;
    if (!S.settings.store_open) return `<button class="add-out" disabled>${t("addCart")} +</button>`;
    return q ? `<div class="qty"><button data-inc="${p.id}">+</button><b>${q}</b><button data-dec="${p.id}">−</button></div>` : `<button class="add-pill" data-inc="${p.id}">${t("addCart")} +</button>`;
  }
  function prow(p) {
    const off = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
    const desc = nm(p, "desc");
    const busy = !S.settings.store_open || !p.in_stock;
    return `<div class="prow">
      <div class="pinfo"><div class="pname" data-open="${p.id}">${esc(nm(p))}${S.edit && !p.active ? ' <span class="pill r">مخفي</span>' : ""}</div>
        ${desc ? `<div class="pdesc" data-open="${p.id}">${esc(desc)}</div>` : ""}
        <div class="pprice">${p.sale_type === "wholesale" ? `<span class="pill" style="background:#fef3c7;color:#92400e;font-size:11px;margin-inline-end:4px">📦 ${L("جملة", "Wholesale")}</span>` : ""}${money(p.price, S.lang)}${off ? ` <s>${money(p.old_price, S.lang)}</s>` : ""}${nm(p, "unit") ? ` <small>/ ${esc(nm(p, "unit"))}</small>` : ""}</div>
        <div class="pact">${qtyCtl(p)}</div></div>
      <div class="pimg" data-open="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy">${off ? `<span class="badge">-${off}%</span>` : ""}${busy ? `<div class="pbusy">${!p.in_stock ? t("out") : t("busy")}</div>` : ""}${S.edit ? `<button class="ebtn on-card" data-ed="prod:${p.id}">✏️ تعديل</button>` : ""}</div>
    </div>`;
  }
  function fcard(p) {
    return `<div class="fcard"><div class="fimg" data-open="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy">${p.old_price > p.price ? `<span class="badge">-${Math.round((1 - p.price / p.old_price) * 100)}%</span>` : ""}</div>
      <div class="fb"><div class="pname" data-open="${p.id}">${esc(nm(p))}</div><div class="pprice">${money(p.price, S.lang)}${p.old_price > p.price ? `<s style="display:block;font-size:11px;color:#94a3b8">${money(p.old_price, S.lang)}</s>` : ""}${nm(p, "unit") ? `<small class="mut" style="display:block;font-size:11px">${p.sale_type === "wholesale" ? "📦 " : ""}${esc(nm(p, "unit"))}</small>` : ""}</div>
      ${p.in_stock && S.settings.store_open ? (qOf(p.id) ? `<div class="qty sm"><button ${hasOpts(p) ? "data-open" : "data-inc"}="${p.id}">+</button><b>${qOf(p.id)}</b><button data-dec="${p.id}">−</button></div>` : `<button class="fplus" ${hasOpts(p) ? "data-open" : "data-inc"}="${p.id}" aria-label="add">+</button>`) : `<span class="mut">${t(!p.in_stock ? "out" : "busy")}</span>`}</div></div>`;
  }
  function sections() {
    const groups = S.cats.map((c) => ({ c, items: S.products.filter((p) => p.category_id === c.id) }));
    const rest = S.products.filter((p) => !S.cats.find((c) => c.id === p.category_id));
    if (rest.length) groups.push({ c: { id: "_other", name_ar: T.ar.other, name_en: T.en.other }, items: rest });
    return groups.filter((g) => g.items.length || S.edit);
  }
  const hasPL = () => (S.settings.price_list || []).length || S.settings.price_list_image;
  function secHtml(g) {
    const ed = S.edit && g.c.id !== "_other" ? ` <button class="ebtn sm" data-ed="cat:${g.c.id}">✏️</button>` : "", add = S.edit ? '<button class="addtile row" data-ed="newprod">➕ إضافة منتج</button>' : "";
    if (g.c.section === "offers") return `<section class="csec" id="sec_${g.c.id}" style="background:linear-gradient(135deg,#fff7ed,#fef3c7);margin:18px -12px 0;padding:4px 12px 14px;border-radius:18px"><h2>🔥 ${esc(nm(g.c))}${ed}</h2><p class="mut" style="margin:-4px 0 8px">${L("أسعار خاصة للكميات الكبيرة", "Special prices for bulk orders")}</p><div class="frow">${g.items.map(fcard).join("")}</div>${add}</section>`;
    if (g.c.section === "special") {
      const hasR = g.items.some((p) => p.sale_type !== "wholesale"), hasW = g.items.some((p) => p.sale_type === "wholesale");
      const m = S.secMode[g.c.id] || (hasR ? "retail" : "wholesale"), list = hasR && hasW ? g.items.filter((p) => (p.sale_type === "wholesale" ? "wholesale" : "retail") === m) : g.items;
      return `<section class="csec" id="sec_${g.c.id}" style="background:#effcfc;margin:18px -12px 0;padding:4px 12px 12px;border-radius:18px"><h2>⭐ ${esc(nm(g.c))}${ed}</h2>
        ${hasR && hasW ? `<div class="chips" style="margin-bottom:8px"><button class="chip ${m === "retail" ? "on" : ""}" data-smode="${g.c.id}:retail">🛒 ${L("قطاعي", "Retail")}</button><button class="chip ${m === "wholesale" ? "on" : ""}" data-smode="${g.c.id}:wholesale">📦 ${L("جملة", "Wholesale")}</button></div>` : ""}
        <div class="plist">${list.map(prow).join("")}${add}</div></section>`;
    }
    return `<section class="csec" id="sec_${g.c.id}"><h2>${esc(nm(g.c))}${ed}</h2><div class="plist">${g.items.map(prow).join("")}${add}</div></section>`;
  }
  function pricesView() {
    const s = S.settings, L2 = s.price_list || [];
    return `<div class="wrap"><div class="h2">📋 ${L("قائمة الأسعار", "Price list")}</div>
      ${s.price_list_image ? `<img src="${esc(s.price_list_image)}" alt="" style="width:100%;border-radius:16px;margin-bottom:12px" data-zoom>` : ""}
      ${L2.length ? `<div class="card">${L2.map((r) => `<div class="line"><span>${esc(r.name)}${r.unit ? ` <small class="mut">/ ${esc(r.unit)}</small>` : ""}</span><b>${r.price == null ? "—" : money(r.price, S.lang)}</b></div>`).join("")}</div>` : ""}
      ${s.price_list_note ? `<p class="mut" style="text-align:center">${esc(s.price_list_note)}</p>` : ""}
      <button class="btn tq block" data-view="home">🛒 ${L("اطلب الحين", "Order now")}</button></div>`;
  }
  function home() {
    const s = S.settings, q = S.q.trim().toLowerCase();
    const notice = S.lang === "en" ? s.notice_en : s.notice_ar;
    if (q) {
      const list = S.products.filter((p) => (p.name_ar + " " + (p.name_en || "") + " " + (p.desc_ar || "")).toLowerCase().includes(q));
      return `<div class="wrap">${list.length ? `<div class="plist">${list.map(prow).join("")}</div>` : `<div class="empty"><div class="e">🔎</div>${t("noRes")}</div>`}</div>`;
    }
    const groups = sections(), feat = S.products.filter((p) => p.featured);
    return `<div class="hero">${S.banners.map((b) => `<div class="hslide">${b.video ? `<video data-bid="${b.id}" src="${esc(b.video)}" ${b.image ? `poster="${esc(b.image)}"` : ""} autoplay muted loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover"></video><button class="vsnd" data-vsnd aria-label="sound" style="position:absolute;bottom:10px;inset-inline-start:10px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;font-size:20px;cursor:pointer;z-index:2">🔇</button>` : `<img src="${esc(b.image)}" alt="${esc(b.title || "")}">`}${S.edit ? `<button class="ebtn on-card" data-ed="ban:${b.id}">✏️ تعديل البنر</button>` : ""}</div>`).join("")}${S.edit ? '<button class="hslide addtile" data-ed="newban">➕ إضافة بنر</button>' : ""}${!S.banners.length && !S.edit ? `<div class="hslide hfallback">${LOGO}<b>${esc(s.store_name || "Goten")}</b></div>` : ""}</div>
      ${S.banners.length > 1 ? `<div class="dots">${S.banners.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}
      <div class="wrap"><div class="info-row">
        <button class="info-pill" data-area><span><small>${t("deliverTo")}</small><b>${esc(S.addr.area || t("pickArea"))}</b></span><span class="chev">‹</span></button>
        <div class="info-pill soft"><b>⏱️ ${esc(s.delivery_eta || t("eta"))}</b></div></div>
        ${hasPL() ? `<button class="btn block" data-view="prices" style="margin-top:8px;background:#fff;color:var(--txt);border:1.5px solid var(--line)">📋 ${L("قائمة الأسعار اليوم", "Today's price list")}</button>` : ""}
        ${!s.store_open ? `<div class="notice">⛔ ${t("closed")}</div>` : ""}${notice ? `<div class="notice">📢 ${esc(notice)}</div>` : ""}</div>
      <div class="ctabs" id="ctabs"><div class="ctabs-in">${feat.length ? `<button data-jump="_feat">🔥 ${t("offers")}</button>` : ""}${groups.map((g) => `<button data-jump="${g.c.id}">${g.c.section === "special" ? "⭐ " : g.c.section === "offers" ? "🔥 " : ""}${esc(nm(g.c))}</button>`).join("")}</div></div>
      <div class="wrap">
        ${feat.length ? `<section class="csec" id="sec__feat"><h2>🔥 ${t("offers")}</h2><div class="frow">${feat.map(fcard).join("")}</div></section>` : ""}
        ${groups.map(secHtml).join("")}
        ${!groups.length ? `<div class="empty"><div class="e">🐟</div>${S.lang === "en" ? "Products coming soon" : "المنتجات هتنزل قريب"}</div>` : ""}
        <p class="mut" style="text-align:center;margin:24px 0">${s.free_delivery_over ? `🚚 ${t("freeOver")} ${money(s.free_delivery_over, S.lang)} · ` : ""}${t("minOrder")} ${money(s.min_order, S.lang)}</p>
      </div>`;
  }
  function catsView() {
    const groups = sections();
    return `<div class="wrap"><div class="h2">${t("cats2")}</div><div class="cgrid">${groups.map((g) => `<button class="ccard" data-gocat="${g.c.id}"><span class="cimg">${g.c.image ? `<img src="${esc(g.c.image)}" alt="">` : LOGO}</span><b>${esc(nm(g.c))}</b></button>`).join("")}${S.edit ? '<button class="ccard" data-ed="newcat"><span class="cimg addcircle">➕</span><b>قسم جديد</b></button>' : ""}</div></div>`;
  }
  function accountView() {
    const a = S.addr, s = S.settings, standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    return `<div class="wrap"><div class="h2">${t("account")}</div>
      <div class="card"><b>📍 ${t("myAddr")}</b>${a.customer_name ? `<p style="margin:8px 0 0">${esc(a.customer_name)} · +965 ${esc(a.phone || "")}<br><span class="mut">${esc(a.area || "")} – ${t("block")} ${esc(a.block || "")} – ${t("street")} ${esc(a.street || "")}${a.avenue ? " – " + t("avenue") + " " + esc(a.avenue) : ""} – ${t("house")} ${esc(a.house || "")}</span></p>` : `<p class="mut">${t("noAddr")}</p>`}</div>
      ${S.pts && S.pts.on ? `<div class="card" style="background:#fffbeb;border:1px solid #fde68a"><b>⭐ ${L("نقاطك", "Your points")}: ${S.pts.points}</b><p class="mut" style="margin:6px 0 0">${L(`= ${money(S.pts.value, S.lang)} خصم. كل 1 د.ك تشتري بيه = ${S.pts.per_kd} نقطة، وتقدر تستخدمها من ${S.pts.min} نقطة وانت بتطلب.`, `= ${money(S.pts.value, S.lang)} off. Earn ${S.pts.per_kd} pts per 1 KD; redeem from ${S.pts.min} pts at checkout.`)}</p></div>` : ""}
      <div class="card menu">
        <button data-view="orders"><span>🧾 ${t("orders")}</span><span class="chev">‹</span></button>
        ${hasPL() ? `<button data-view="prices"><span>📋 ${L("قائمة الأسعار", "Price list")}</span><span class="chev">‹</span></button>` : ""}
        ${Store.live ? `<button data-pushc><span>${UI.pushState() === "granted" ? "🔔" : "🔕"} ${t("notif")}</span><span class="chev">‹</span></button>` : ""}
        <button data-lang><span>🌐 ${t("langLbl")}: ${S.lang === "ar" ? "العربية" : "English"}</span><span class="chev">‹</span></button>
        ${s.whatsapp ? `<a target="_blank" rel="noopener" href="https://wa.me/${esc(s.whatsapp)}"><span>💬 ${t("contact")}</span><span class="chev">‹</span></a>` : ""}
      </div>
      ${!standalone ? `<div class="card" style="background:#effcfc"><b>📲 ${t("installApp")}</b><p class="mut" style="margin:6px 0 0">${t("installHint")}</p></div>` : ""}
      <p class="mut" style="text-align:center">${esc(s.store_name || "Goten")}</p></div>`;
  }
  function areaSheet() {
    sheet(`<h3>📍 ${t("pickArea")}</h3><select class="in" id="aSel" size="12" style="height:auto">${Object.entries(AREAS).map(([g, arr]) => `<optgroup label="${g}">${arr.map((x) => `<option ${S.addr.area === x ? "selected" : ""}>${x}</option>`).join("")}</optgroup>`).join("")}</select><button class="btn tq block" id="aSave" style="margin-top:10px">${t("save")}</button>`, () => {
      $("aSave").onclick = () => { const v = $("aSel").value; if (v) { S.addr = { ...S.addr, area: v }; ls.set("ik_addr", S.addr); } closeSheet(); render(); };
    });
  }
  function summary() {
    const x = totals();
    return `<div class="line"><span>${t("subtotal")}</span><b>${money(x.sub, S.lang)}</b></div><div class="line"><span>${t("delivery")}</span><b>${x.fee ? money(x.fee, S.lang) : t("free")}</b></div>${x.disc ? `<div class="line" style="color:#16a34a"><span>🎟️ ${t("discount")} (${esc(S.coupon.code)})</span><b>−${money(x.disc, S.lang)}</b></div>` : ""}${x.pd ? `<div class="line" style="color:#16a34a"><span>⭐ ${L("خصم النقاط", "Points discount")} (${x.pts})</span><b>−${money(x.pd, S.lang)}</b></div>` : ""}${x.fl.map((l) => `<div class="line"><span>${esc(S.lang === "en" && l.f.name_en ? l.f.name_en : l.f.name_ar)} <small class="mut">${l.f.basis === "order" ? "" : `(${l.q} ${(FEE_U[l.f.basis] || FEE_U.qty)[S.lang === "en" ? 1 : 0]} × ${money(l.f.price, S.lang)})`}</small></span><b>${money(l.amount, S.lang)}</b></div>`).join("")}<div class="line total"><span>${t("total")}<small style="display:block;font-size:12px;font-weight:600" class="mut">${L("شامل", "incl.")} ${[L("التوصيل", "delivery"), ...x.fl.map((l) => (S.lang === "en" && l.f.name_en ? l.f.name_en : l.f.name_ar))].join(L(" و", ", "))}</small></span><span>${money(x.total, S.lang)}</span></div>`;
  }
  function cart() {
    const lines = cartLines();
    if (!lines.length) return `<div class="wrap"><div class="empty"><div class="e">🛒</div><p>${t("emptyCart")}</p><button class="btn tq" data-view="home">${t("startShop")}</button></div></div>`;
    const x = totals(), min = Number(S.settings.min_order || 0);
    return `<div class="wrap"><div class="h2">${t("cart")}</div><div class="card">${lines.map((l) => `<div class="citem"><img src="${esc(l.p.image)}" alt=""><div class="t"><b>${esc(nm(l.p))}</b>${l.opts.length ? `<div class="mut" style="font-size:12px">${esc(optsTxt(l.opts))}</div>` : ""}<div class="mut">${money(l.unit, S.lang)} / ${esc(nm(l.p, "unit"))}</div></div><div class="qty"><button data-inc="${esc(l.key)}">+</button><b>${l.q}</b><button data-dec="${esc(l.key)}">−</button></div></div>`).join("")}</div>
      <div class="card">${summary()}</div>
      ${x.sub < min ? `<div class="notice">${t("minOrder")}: ${money(min, S.lang)}</div>` : ""}
      <button class="btn tq block" data-view="checkout" ${x.sub < min || !S.settings.store_open ? "disabled" : ""}>${t("checkout")}</button></div>`;
  }
  // مواعيد التوصيل من إعدادات لوحة التحكم
  function slotDays() {
    const s = S.settings, list = Array.isArray(s.slots) && s.slots.length ? s.slots : ["10:00 – 12:00", "12:00 – 14:00", "16:00 – 18:00", "18:00 – 20:00", "20:00 – 22:00"];
    const days = Math.max(1, Math.min(7, parseInt(s.slot_days) || 2)), cut = Number(s.slot_cutoff ?? 60), now = new Date(), out = [];
    const WD = { ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
    for (let d = 0; d < days; d++) {
      const day = new Date(now); day.setDate(now.getDate() + d);
      const label = d === 0 ? t("today") : d === 1 ? t("tomorrow") : `${WD[S.lang][day.getDay()]} ${day.getDate()}/${day.getMonth() + 1}`;
      const times = list.filter((sl) => { if (d > 0) return true; const m = String(sl).match(/(\d{1,2})[:.](\d{2})/); if (!m) return true; const st = new Date(now); st.setHours(+m[1], +m[2], 0, 0); return st - now > cut * 60e3; });
      if (times.length) out.push({ label, times });
    }
    return out;
  }
  function slotPicker() {
    const days = slotDays(), asap = S.settings.allow_asap !== false;
    if (S.slotDay == null || S.slotDay >= days.length) S.slotDay = 0;
    const cur = S.slotSel || (asap ? t("asap") : days[0] ? `${days[0].label} ${days[0].times[0]}` : "");
    S.slotSel = cur;
    const chip = (v, l, on) => `<button type="button" class="chip${on ? " on" : ""}" data-slot="${esc(v)}">${esc(l)}</button>`;
    return `<input type="hidden" id="f_slot" value="${esc(cur)}">
      ${asap ? `<div class="chips">${chip(t("asap"), "⚡ " + t("asap"), cur === t("asap"))}</div>` : ""}
      ${days.length ? `<div class="chips">${days.map((d, i) => `<button type="button" class="chip${S.slotDay === i ? " on" : ""}" data-sday="${i}">${esc(d.label)}</button>`).join("")}</div>
      <div class="chips">${(days[S.slotDay] || days[0]).times.map((tm) => { const v = `${(days[S.slotDay] || days[0]).label} ${tm}`; return chip(v, "🕒 " + tm, cur === v); }).join("")}</div>` : `<p class="mut">${t("noSlots")}</p>`}`;
  }
  function feesCard() {
    const opt = feeLines(true).filter((l) => l.f.mode === "optional"); if (!opt.length) return "";
    return `<div class="card"><b>🧾 ${L("خدمات إضافية", "Extra services")}</b>${opt.map((l) => `<label class="radio" style="margin-top:8px"><input type="checkbox" data-fee="${esc(l.f.id)}" ${S.feeSel.includes(l.f.id) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--tq)"> ${esc(S.lang === "en" && l.f.name_en ? l.f.name_en : l.f.name_ar)} <span class="mut">(+${money(l.amount, S.lang)})</span></label>`).join("")}</div>`;
  }
  function ptsCard() {
    const P = S.pts; if (!P || !P.on) return "";
    const ok = P.points > 0 && P.points >= Number(P.min || 0);
    return `<div class="card" style="background:#fffbeb;border:1px solid #fde68a"><b>⭐ ${L("نقاطك", "Your points")}: ${P.points} <span class="mut">(= ${money(P.value, S.lang)})</span></b>
      ${ok ? `<label class="radio" style="margin-top:8px"><input type="checkbox" id="usePts" ${S.usePts ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--tq)"> ${L("استخدم نقاطي كخصم على الطلب ده", "Use my points on this order")}</label>`
        : `<p class="mut" style="margin:6px 0 0">${L(`تقدر تستخدم النقاط لما توصل ${P.min} نقطة. كل 1 د.ك = ${P.per_kd} نقطة.`, `Redeem from ${P.min} points. Every 1 KD = ${P.per_kd} pts.`)}</p>`}</div>`;
  }
  async function loadPts(ph8, rerender) {
    if (!/^[124569]\d{7}$/.test(ph8 || "")) { S.pts = null; S.usePts = false; return; }
    try { S.pts = await Store.myPoints("965" + ph8); } catch (e) { S.pts = null; }
    if (rerender && (S.view === "checkout" || S.view === "account")) keepForm(render);
  }
  function checkout() {
    const a = S.addr;
    const f = (id, label, req, type = "text", extra = "") => `<label class="f"><span>${label}${req ? " *" : ""}</span><input class="in" id="f_${id}" type="${type}" value="${esc(a[id] || "")}" ${extra}></label>`;
    return `<div class="wrap"><div class="h2">${t("checkout")} <button class="btn ghost sm" data-view="cart">${t("back")}</button></div>
      <div class="card"><b>${t("addr")}</b>
        <div class="row2">${f("customer_name", t("name"), 1)}${f("phone", t("phone"), 1, "tel", 'inputmode="numeric" maxlength="8" placeholder="5xxxxxxx"')}</div>
        <label class="f"><span>${t("area")} *</span><select class="in" id="f_area"><option value="">${t("chooseArea")}</option>${Object.entries(AREAS).map(([g, arr]) => `<optgroup label="${g}">${arr.map((x) => `<option ${a.area === x ? "selected" : ""}>${x}</option>`).join("")}</optgroup>`).join("")}</select></label>
        <div class="row3">${f("block", t("block"), 1, "text", 'inputmode="numeric"')}${f("street", t("street"), 1)}${f("avenue", t("avenue"), 0)}</div>
        <div class="row2">${f("house", t("house"), 1)}${f("floor_apt", t("floor"), 0)}</div>
        <label class="f"><span>${t("notes")}</span><textarea class="in" id="f_notes" rows="2"></textarea></label></div>
      <div class="card"><b>${t("slot")}</b><div id="slotBox">${slotPicker()}</div></div>
      <div class="card"><b>🎟️ ${t("coupon")}</b>${S.coupon ? `<div class="line" style="color:#16a34a"><span>✓ ${esc(S.coupon.code)}</span><button class="btn ghost sm" id="cpDel">${t("remove")}</button></div>` : `<div class="row2" style="margin-top:8px;grid-template-columns:1fr auto"><input class="in" id="f_coupon" placeholder="GOTEN10" autocapitalize="characters" style="text-transform:uppercase"><button class="btn sm" id="cpBtn">${t("apply")}</button></div>`}</div>
      ${feesCard()}${ptsCard()}
      <div class="card"><b>${t("pay")}</b>
        <label class="radio"><input type="radio" name="pay" value="cash" checked> 💵 ${t("cash")}</label>
        <label class="radio"><input type="radio" name="pay" value="knet_on_delivery"> 💳 ${t("knet")}</label></div>
      <label class="radio"><input type="checkbox" id="f_optin" ${ls.get("ik_optin", false) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--tq)"> 📣 ${t("optin")}</label>
      <div class="card">${summary()}</div>
      <button class="btn tq block" id="placeBtn">${t("place")}</button></div>`;
  }
  function ordersView() {
    if (!S.my.length) return `<div class="wrap"><div class="empty"><div class="e">🧾</div>${t("noOrders")}</div></div>`;
    return `<div class="wrap"><div class="h2">${t("orders")}</div><div id="olist">${S.my.map((o) => `<div class="ord" data-track="${o.id}" style="cursor:pointer"><div class="hd"><b>#${o.order_no}</b><span class="st" id="st_${o.id}" style="background:#94a3b8">…</span></div><div class="mut">${fmtDate(o.created_at)} · ${money(o.total, S.lang)}</div></div>`).join("")}</div></div>`;
  }
  async function fillStatuses() {
    for (const o of S.my.slice(0, 15)) {
      try { const r = await Store.trackOrder(o.id); const el = $("st_" + o.id); if (r && el) { const s = STATUS[r.status]; el.textContent = s[S.lang]; el.style.background = s.c; } } catch (e) {}
    }
  }
  async function openTrack(id) {
    let o; try { o = await Store.trackOrder(id); } catch (e) { return toast(e.message, "err"); }
    if (!o) return toast("—", "err");
    const idx = STATUS_FLOW.indexOf(o.status);
    sheet(`<h3 style="margin:4px 0">${t("orderNo")} #${o.order_no}</h3><div class="mut">${fmtDate(o.created_at)} · ${esc(o.area || "")}</div>
      ${o.status === "cancelled" ? `<p><span class="st" style="background:${STATUS.cancelled.c}">${STATUS.cancelled[S.lang]}</span></p>` :
      `<div class="timeline">${STATUS_FLOW.map((s, i) => `<div class="tl ${i <= idx ? "done" : ""}"><span class="dot">${i <= idx ? "✓" : ""}</span>${STATUS[s][S.lang]}</div>`).join("")}</div>`}
      ${o.driver_name ? `<div class="card" style="background:#effcfc"><b>🛵 ${t("driver")}: ${esc(o.driver_name)}</b>${o.driver_phone ? `<div style="margin-top:8px"><a class="btn sm tq" href="tel:+${esc(o.driver_phone)}">📞 ${t("call")}</a></div>` : ""}</div>` : ""}
      <b>${t("items")}</b>${(o.items || []).map((i) => `<div class="line"><span>${esc(S.lang === "en" && i.name_en ? i.name_en : i.name_ar)} × ${i.qty}${(i.opts || []).length ? `<br><small class="mut">${esc(optsTxt(i.opts))}</small>` : ""}</span><span>${money(i.price * i.qty, S.lang)}</span></div>`).join("")}
      ${Number(o.discount) ? `<div class="line" style="color:#16a34a"><span>🎟️ ${t("discount")}${o.coupon_code ? " (" + esc(o.coupon_code) + ")" : ""}</span><span>−${money(o.discount, S.lang)}</span></div>` : ""}
      ${Number(o.points_disc) ? `<div class="line" style="color:#16a34a"><span>⭐ ${L("خصم النقاط", "Points discount")} (${o.points_used})</span><span>−${money(o.points_disc, S.lang)}</span></div>` : ""}
      ${(o.fees || []).map((f) => `<div class="line"><span>${esc(S.lang === "en" && f.name_en ? f.name_en : f.name_ar)}</span><span>${money(f.amount, S.lang)}</span></div>`).join("")}
      <div class="line"><span>${t("delivery")}</span><span>${Number(o.delivery_fee) ? money(o.delivery_fee, S.lang) : t("free")}</span></div><div class="line total"><span>${t("total")}</span><span>${money(o.total, S.lang)}</span></div>
      ${o.proof_url && o.status === "delivered" ? `<b>📸 ${L("صورة التسليم", "Delivery photo")}</b><img src="${esc(o.proof_url)}" alt="" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin:6px 0">` : ""}
      ${o.status === "delivered" && Number(o.points_earned) ? `<div class="notice" style="background:#fffbeb;border-color:#fde68a">⭐ ${L(`كسبت ${o.points_earned} نقطة من الطلب ده`, `You earned ${o.points_earned} points`)}</div>` : ""}
      ${o.status === "delivered" ? (o.rating ? `<div class="card" style="text-align:center"><b>${L("تقييمك", "Your rating")}</b><div style="font-size:26px">${"⭐".repeat(o.rating)}</div>${o.rating_note ? `<p class="mut">«${esc(o.rating_note)}»</p>` : ""}</div>`
        : `<div class="card" style="text-align:center"><b>${L("قيّم طلبك 🙏", "Rate your order 🙏")}</b><div id="rStars" style="font-size:34px;letter-spacing:4px;margin:8px 0;cursor:pointer">${[1, 2, 3, 4, 5].map((n) => `<span data-star="${n}">☆</span>`).join("")}</div>
          <textarea class="in" id="rNote" rows="2" maxlength="300" placeholder="${L("رأيك في السمك والتوصيل (اختياري)", "Comments (optional)")}"></textarea><button class="btn tq block" style="margin-top:8px" id="rSend" data-oid="${o.id}" disabled>${L("إرسال التقييم", "Send rating")}</button></div>`) : ""}
      ${S.settings.whatsapp ? `<a class="btn ghost block" style="margin-top:12px" target="_blank" rel="noopener" href="https://wa.me/${esc(S.settings.whatsapp)}?text=${encodeURIComponent("طلب رقم #" + o.order_no)}">💬 ${t("whats")}</a>` : ""}`);
  }
  function openProduct(id) {
    const p = S.products.find((x) => x.id === id); if (!p) return;
    sheet(`<img class="sheet-img" src="${esc(p.image)}" alt=""><h3 style="margin:0 0 4px">${esc(nm(p))}</h3>
      <div><span class="price" style="font-size:19px">${money(p.price, S.lang)}</span>${p.old_price > p.price ? `<span class="old">${money(p.old_price, S.lang)}</span>` : ""} <span class="mut">/ ${esc(nm(p, "unit"))}</span></div>
      <p class="mut">${esc(nm(p, "desc"))}</p>${hasOpts(p) && p.in_stock && S.settings.store_open ? optsForm(p) : `<div id="sq">${qtyCtl(p)}</div>`}`, () => { if (hasOpts(p)) wireOpts(p); });
  }
  // اختيارات المنتج (تنضيف، تقطيع، وزن...)
  function optsForm(p) {
    const gs = optsOf(p);
    return `${gs.map((g, gi) => `<div style="margin:12px 0 4px"><b>${esc(g.name)}</b></div><div class="chips wrap">${g.choices.map((c, ci) => `<button type="button" class="chip${ci === 0 ? " on" : ""}" data-og="${gi}" data-oc="${ci}">${esc(c.name)}${Number(c.price) ? ` <small>${Number(c.price) > 0 ? "+" : ""}${money(c.price, S.lang)}</small>` : ""}</button>`).join("")}</div>`).join("")}
      <div style="display:flex;align-items:center;gap:12px;margin-top:16px"><div class="qty"><button type="button" id="oInc">+</button><b id="oQty">1</b><button type="button" id="oDec">−</button></div>
      <button class="btn tq" style="flex:1" id="oAdd">${t("addCart")} · <span id="oPrice"></span></button></div>
      ${qOf(p.id) ? `<p class="mut" style="text-align:center;margin:8px 0 0">🛒 ${qOf(p.id)} ${t("inCart")}</p>` : ""}`;
  }
  function wireOpts(p) {
    const gs = optsOf(p), sel = gs.map(() => 0); let q = 1;
    const upd = () => { const unit = Math.max(0, Number(p.price) + gs.reduce((a, g, i) => a + Number(g.choices[sel[i]].price || 0), 0)); $("oQty").textContent = q; $("oPrice").textContent = money(unit * q, S.lang); };
    document.querySelectorAll("[data-og]").forEach((b) => (b.onclick = () => { const gi = +b.dataset.og; sel[gi] = +b.dataset.oc; document.querySelectorAll(`[data-og="${gi}"]`).forEach((x) => x.classList.toggle("on", x === b)); upd(); }));
    $("oInc").onclick = () => { q = Math.min(99, q + 1); upd(); };
    $("oDec").onclick = () => { q = Math.max(1, q - 1); upd(); };
    $("oAdd").onclick = () => { const key = [p.id, ...gs.map((g, i) => g.choices[sel[i]].name)].join("|"); setQty(key, (S.cart[key] || 0) + q); closeSheet(); toast("✓ " + nm(p)); };
    upd();
  }

  function render() {
    const app = $("app"), n = cartCount();
    const body = S.view === "cart" ? cart() : S.view === "checkout" ? checkout() : S.view === "orders" ? ordersView() : S.view === "cats" ? catsView() : S.view === "account" ? accountView() : S.view === "prices" ? pricesView() : home();
    const navOn = (v) => S.view === v || (v === "cart" && S.view === "checkout");
    app.innerHTML = header() + `<main class="shop">${body}</main>` +
      ((S.view === "home" || S.view === "cats") && n ? `<div class="cartbar"><div class="wrap"><button class="review-bar" data-view="cart"><span class="rcount">${n}</span><b>${t("review")}</b><span>${money(totals().sub, S.lang)}</span></button></div></div>` : "") +
      `<nav class="nav shop-nav"><div class="wrap">${[["home", IC.home, t("home")], ["cats", IC.cats, t("cats2")], ["orders", IC.status, t("status")], ["cart", IC.cart, t("cart")], ["account", IC.user, t("account")]].map(([v, i, l]) => `<button class="${navOn(v) ? "on" : ""}" data-view="${v}"><i>${i}</i>${l}${v === "cart" && n ? `<span class="cnt">${n}</span>` : ""}</button>`).join("")}</div></nav>`;
    if (S.vOn) { const v = document.querySelector(`.hslide video[data-bid="${S.vOn}"]`); if (v) { v.muted = false; v.play().catch(() => { v.muted = true; S.vOn = null; }); const bt = v.parentElement.querySelector("[data-vsnd]"); if (bt) bt.textContent = "🔊"; } }
    const q = $("q"); if (q) { q.oninput = (e) => { S.q = e.target.value; const pos = e.target.selectionStart; render(); const q2 = $("q"); q2.focus(); q2.setSelectionRange(pos, pos); }; }
    const pb = $("placeBtn"); if (pb) pb.onclick = place;
    const fp = $("f_phone"); if (fp) fp.oninput = () => { const v = fp.value.replace(/\D/g, ""); if (v.length === 8 && (!S.pts || S.ptsFor !== v)) { S.ptsFor = v; loadPts(v, true); } };
    document.querySelectorAll("[data-fee]").forEach((cb) => (cb.onchange = () => { const id = cb.dataset.fee; S.feeSel = cb.checked ? [...new Set([...S.feeSel, id])] : S.feeSel.filter((x) => x !== id); keepForm(render); }));
    const up = $("usePts"); if (up) up.onchange = () => { S.usePts = up.checked; keepForm(render); };
    if (S.view === "orders") fillStatuses();
    // ارتفاع الهيدر علشان تبويبات الأقسام تثبت تحته
    if (S.settings.header_color) document.documentElement.style.setProperty("--acc", S.settings.header_color);
    const h = document.querySelector(".shop-top"); if (h) document.documentElement.style.setProperty("--hh", h.offsetHeight + "px");
    const hero = document.querySelector(".hero"); if (hero) hero.onscroll = () => { const i = Math.round(Math.abs(hero.scrollLeft) / hero.clientWidth); document.querySelectorAll(".dots i").forEach((d, k) => d.classList.toggle("on", k === i)); };
    markTab();
  }
  function markTab() {
    const tabs = document.querySelectorAll("#ctabs button"); if (!tabs.length) return;
    const off = (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hh")) || 60) + 60;
    let cur = tabs[0].dataset.jump;
    document.querySelectorAll(".csec").forEach((sec) => { if (sec.getBoundingClientRect().top - off <= 0) cur = sec.id.replace("sec_", ""); });
    tabs.forEach((b) => { const on = b.dataset.jump === cur; if (on !== b.classList.contains("on")) { b.classList.toggle("on", on); if (on) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); } });
  }
  window.addEventListener("scroll", () => { if (S.view === "home") markTab(); }, { passive: true });
  function jumpTo(id) {
    const el = document.getElementById("sec_" + id); if (!el) return;
    const off = (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hh")) || 60) + 54;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - off, behavior: "smooth" });
  }

  async function place() {
    const g = (k) => ($("f_" + k) ? $("f_" + k).value.trim() : "");
    const p = { customer_name: g("customer_name"), phone: g("phone").replace(/\D/g, ""), area: g("area"), block: g("block"), street: g("street"), avenue: g("avenue"), house: g("house"), floor_apt: g("floor_apt"), notes: g("notes"), slot: g("slot"), payment: (document.querySelector("input[name=pay]:checked") || {}).value || "cash" };
    if (!p.customer_name || !p.phone || !p.area || !p.block || !p.street || !p.house) return toast(t("required"), "err");
    if (!/^[124569]\d{7}$/.test(p.phone)) return toast(t("phoneBad"), "err");
    const { notes, slot, payment, ...addr } = p; S.addr = addr; ls.set("ik_addr", addr);
    p.phone = "965" + p.phone;
    p.marketing_opt_in = !!($("f_optin") && $("f_optin").checked); ls.set("ik_optin", p.marketing_opt_in);
    p.items = cartLines().map((l) => ({ id: l.p.id, qty: l.q, opts: l.opts.map((o) => ({ g: o.g, c: o.c })) }));
    if (S.coupon) p.coupon = S.coupon.code;
    if (S.usePts) p.use_points = true;
    if (S.feeSel.length) p.fees = S.feeSel;
    const btn = $("placeBtn"); btn.disabled = true;
    try {
      const r = await Store.placeOrder(p);
      S.my.unshift({ id: r.id, order_no: r.order_no, total: r.total, created_at: new Date().toISOString() }); ls.set("ik_orders", S.my.slice(0, 50));
      S.cart = {}; S.coupon = null; S.slotSel = null; S.usePts = false; S.pts = null; S.feeSel = []; saveCart();
      if (Store.live && UI.pushState() === "granted") UI.enablePush((sub) => Store.saveCustomerPush(sub, p.phone)).catch(() => {}); S.view = "orders"; render();
      sheet(`<div class="empty" style="padding:20px 0"><div class="e">✅</div><h2>${t("placed")}</h2><p>${t("orderNo")}: <b>#${r.order_no}</b></p><p>${t("total")}: <b>${money(r.total, S.lang)}</b></p><button class="btn tq block" data-track2="${r.id}">${t("track")}</button>${Store.live && UI.pushState() !== "granted" ? `<button class="btn ghost block" style="margin-top:8px" data-pushc>🔔 ${S.lang === "en" ? "Get order updates & offers as notifications" : "فعّل الإشعارات عشان يوصلك حالة طلبك والعروض"}</button>` : ""}</div>`);
    } catch (e) {
      const k = Object.keys(T.ar.errs).find((x) => String(e.message).includes(x));
      toast(k ? t("errs")[k] : e.message, "err"); btn.disabled = false; if (k === "PRODUCT_UNAVAILABLE" || k === "OUT_OF_STOCK") { await load(); } if (k && k.startsWith("COUPON")) { S.coupon = null; keepForm(render); }
    }
  }

  document.addEventListener("click", async (e) => {
    const x = e.target.closest("[data-search],[data-area],[data-jump],[data-gocat]");
    if (x) {
      if (x.hasAttribute("data-search")) { S.searchOpen = !S.searchOpen; if (!S.searchOpen) S.q = ""; S.view = "home"; render(); if (S.searchOpen) $("q").focus(); }
      else if (x.hasAttribute("data-area")) areaSheet();
      else if (x.dataset.jump) jumpTo(x.dataset.jump);
      else if (x.dataset.gocat) { S.view = "home"; S.q = ""; S.searchOpen = false; render(); setTimeout(() => jumpTo(x.dataset.gocat), 60); }
      return;
    }
    const pc = e.target.closest("[data-pushc]");
    if (pc) return customerPush();
    const ed = e.target.closest("[data-ed],[data-editmode]");
    if (ed) { e.stopPropagation(); return onEdit(ed); }
    const vs = e.target.closest("[data-vsnd]");
    if (vs) { const v = vs.parentElement.querySelector("video"); if (!v) return; const on = v.muted;
      document.querySelectorAll(".hslide video").forEach((x) => { if (x !== v) { x.muted = true; const bt = x.parentElement.querySelector("[data-vsnd]"); if (bt) bt.textContent = "🔇"; } });
      v.muted = !on; S.vOn = on ? v.dataset.bid : null; if (on) { v.volume = 1; v.play().catch(() => {}); } vs.textContent = on ? "🔊" : "🔇"; return; }
    const sm = e.target.closest("[data-smode]");
    if (sm) { const [cid, m] = sm.dataset.smode.split(":"); S.secMode[cid] = m; render(); const sec = document.getElementById("sec_" + cid); if (sec) sec.scrollIntoView({ block: "start" }); return; }
    const star = e.target.closest("[data-star]");
    if (star) { const n = +star.dataset.star; S.rate = n; document.querySelectorAll("#rStars [data-star]").forEach((x) => (x.textContent = +x.dataset.star <= n ? "⭐" : "☆")); const b = $("rSend"); if (b) b.disabled = false; return; }
    if (e.target.id === "rSend") { const b = e.target, id = b.dataset.oid; b.disabled = true; try { await Store.rateOrder(id, S.rate, ($("rNote") || {}).value || ""); toast(L("شكراً على تقييمك 💙", "Thanks for your rating 💙")); openTrack(id); } catch (err) { toast(err.message, "err"); b.disabled = false; } return; }
    if (e.target.id === "cpBtn") return applyCoupon();
    if (e.target.id === "cpDel") { S.coupon = null; return render(); }
    const sl = e.target.closest("[data-slot],[data-sday]");
    if (sl) { if (sl.dataset.sday != null) { S.slotDay = +sl.dataset.sday; const dd = slotDays()[S.slotDay]; if (dd) S.slotSel = `${dd.label} ${dd.times[0]}`; } else S.slotSel = sl.dataset.slot; const bx = $("slotBox"); if (bx) bx.innerHTML = slotPicker(); return; }
    const el = e.target.closest("[data-inc],[data-dec],[data-view],[data-cat],[data-open],[data-lang],[data-track],[data-track2]"); if (!el) return;
    const d = el.dataset;
    if (d.inc) { setQty(d.inc, (S.cart[d.inc] || 0) + 1); refreshSheetQty(d.inc); }
    else if (d.dec) { let k = d.dec; if (!S.cart[k]) k = Object.keys(S.cart).filter((x) => x.startsWith(k + "|")).pop() || k; setQty(k, (S.cart[k] || 0) - 1); refreshSheetQty(d.dec); }
    else if (d.view !== undefined) { closeSheet(); S.view = d.view; render(); scrollTo(0, 0); if ((d.view === "checkout" || d.view === "account") && S.addr.phone) { S.ptsFor = S.addr.phone; loadPts(S.addr.phone, true); } }
    else if (d.cat !== undefined) { S.cat = d.cat || null; render(); }
    else if (d.open) openProduct(d.open);
    else if (d.lang !== undefined) setLang(S.lang === "ar" ? "en" : "ar");
    else if (d.track) openTrack(d.track);
    else if (d.track2) openTrack(d.track2);
  });
  // ---------- وضع التعديل ----------
  const ctx = () => ({ products: S.all.p, cats: S.all.c, banners: S.all.b, done: async () => { await load(); render(); } });
  async function onEdit(el) {
    if (el.hasAttribute("data-editmode")) {
      if (S.edit) { S.edit = false; try { sessionStorage.removeItem("ik_edit"); } catch (e) {} await load(); return render(); }
      if (Store.live) return enterEdit();
      return sheet(`<h3>⚙️ دخول وضع التحكم</h3><label class="f"><span>رقم الدخول (PIN)</span><input class="in" id="epin" type="password" inputmode="numeric" placeholder="1234"></label><button class="btn tq block" id="epinBtn">دخول</button><p class="mut">الرقم الافتراضي 1234 – تغيّره من ملف config.js</p>`, () => {
        $("epinBtn").onclick = () => { if ($("epin").value === String((window.ISLAMKO_CONFIG || {}).DEMO_ADMIN_PIN || "1234")) { Store.demoLogin({ id: "admin", role: "admin", full_name: "المدير" }); closeSheet(); enterEdit(); } else toast("PIN غير صحيح", "err"); };
      });
    }
    const v = el.dataset.ed, [k, id] = v.split(":");
    if (k === "newprod") Editors.product(null, ctx());
    else if (k === "prod") Editors.product(id, ctx());
    else if (k === "newcat") Editors.category(null, ctx());
    else if (k === "cat") Editors.category(id, ctx());
    else if (k === "newban") Editors.banner(null, ctx());
    else if (k === "ban") Editors.banner(id, ctx());
    else if (k === "header") Editors.header(S.settings, ctx());
  }
  async function enterEdit() { S.edit = true; try { sessionStorage.setItem("ik_edit", "1"); } catch (e) {} S.view = "home"; await load(); render(); toast("وضع التعديل مفعّل – اضغط ✏️ على أي عنصر"); }
  async function checkEditRights() {
    if (!Store.live) { S.canEdit = true; } else { try { const me = await Store.me(); S.canEdit = !!(me && me.role === "admin"); } catch (e) { S.canEdit = false; } }
    let was = false; try { was = sessionStorage.getItem("ik_edit") === "1"; } catch (e) {}
    if (S.canEdit && was) { const me = await Store.me(); if (me && me.role === "admin") S.edit = true; }
  }

  // ---------- إشعارات العروض للزبون ----------
  async function customerPush() {
    const en = S.lang === "en", st = UI.pushState();
    if (st === "need_home") return sheet(`<h3>🔔 ${en ? "Turn on notifications" : "فعّل الإشعارات"}</h3><p>${en ? "On iPhone, notifications work after adding the app to your Home Screen:" : "على الآيفون، الإشعارات بتشتغل بعد ما تضيف التطبيق للشاشة الرئيسية:"}</p>
      <ol style="line-height:2"><li>${en ? "Tap Share ⬆️ in Safari" : "دوس زرار المشاركة ⬆️ في Safari"}</li><li>${en ? "Choose “Add to Home Screen”" : "اختار «إضافة إلى الشاشة الرئيسية»"}</li><li>${en ? "Open Goten from the new icon and tap 🔕" : "افتح Goten من الأيقونة الجديدة ودوس 🔕"}</li></ol>`);
    try {
      await UI.enablePush((sub) => Store.saveCustomerPush(sub, (S.addr && S.addr.phone) ? "965" + S.addr.phone : null));
      closeSheet(); toast(en ? "✅ You'll get our offers as notifications" : "✅ تمام! هتوصلك العروض كإشعارات"); render();
    } catch (e) { toast(e.message, "err"); }
  }

  async function applyCoupon() {
    const code = ($("f_coupon") ? $("f_coupon").value : "").trim().toUpperCase(); if (!code) return;
    const ph = ($("f_phone") ? $("f_phone").value : "").replace(/\D/g, ""), x = totals();
    $("cpBtn").disabled = true;
    try { const r = await Store.checkCoupon(code, x.sub, /^\d{8}$/.test(ph) ? "965" + ph : null); S.coupon = r; toast(t("couponOk")); keepForm(render); }
    catch (err) { const m = String(err.message), k = Object.keys(T.ar.errs).find((c) => m.includes(c)); toast(k ? t("errs")[k] + (k === "COUPON_MIN" ? ": " + money(Number((m.split(":")[1] || "0").replace(/[^\d.]/g, "")), S.lang) : "") : m, "err"); $("cpBtn").disabled = false; }
  }
  // ما نضيّعش اللي الزبون كتبه في الفورم لما الصفحة تتحدث
  function keepForm(fn) { const vals = {}; document.querySelectorAll("[id^=f_]").forEach((el) => { if (el.type !== "hidden") vals[el.id] = el.type === "checkbox" ? el.checked : el.value; }); fn(); Object.entries(vals).forEach(([id, v]) => { const el = $(id); if (el) { if (el.type === "checkbox") el.checked = v; else el.value = v; } }); }
  function refreshSheetQty(id) { const sq = document.getElementById("sq"); if (sq) { const p = S.products.find((x) => x.id === id); if (p) sq.innerHTML = qtyCtl(p); } }

  (async function start() {
    document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = S.lang;
    try { await Store.init(); await checkEditRights(); await load(); render(); const qo = new URLSearchParams(location.search).get("order"); if (qo && /^[0-9a-f-]{36}$/i.test(qo)) { S.view = "orders"; render(); openTrack(qo); history.replaceState(null, "", location.pathname); } } catch (e) { $("app").innerHTML = `<div class="empty"><div class="e">⚠️</div>${esc(e.message)}</div>`; return; }
    Store.onChange(async () => { if (S.view === "checkout" || document.getElementById("sheet")) return; try { await load(); render(); } catch (e) {} });
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  })();
})();
