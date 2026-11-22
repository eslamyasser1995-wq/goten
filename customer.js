// تطبيق العملاء – Goten
(function () {
  const { esc, money, ls, toast, sheet, closeSheet, STATUS, STATUS_FLOW, AREAS, fmtDate, LOGO } = UI;
  const T = {
    ar: { tag: "أسماك ومأكولات بحرية طازجة", search: "ابحث عن سمك، روبيان...", cats: "الأقسام", all: "الكل", offers: "عروض مميزة", products: "المنتجات", add: "أضف", out: "نفدت الكمية", home: "الرئيسية", cart: "السلة", orders: "طلباتي", viewCart: "عرض السلة", emptyCart: "سلتك فاضية", startShop: "ابدأ التسوق", subtotal: "المجموع", delivery: "التوصيل", free: "مجاني", total: "الإجمالي", checkout: "إتمام الطلب", minOrder: "الحد الأدنى للطلب", freeOver: "توصيل مجاني للطلبات فوق", name: "الاسم", phone: "رقم الهاتف", area: "المنطقة", chooseArea: "اختر المنطقة", block: "قطعة", street: "شارع", avenue: "جادة", house: "منزل / مبنى", floor: "الدور / الشقة", notes: "ملاحظات (تنظيف، تقطيع...)", slot: "وقت التوصيل", asap: "بأسرع وقت", pay: "طريقة الدفع", cash: "كاش عند الاستلام", knet: "كي نت عند الاستلام (جهاز المندوب)", place: "تأكيد الطلب", placed: "تم استلام طلبك!", orderNo: "رقم الطلب", track: "تتبع الطلب", noOrders: "ما عندك طلبات لسه", closed: "المتجر مغلق حالياً", driver: "المندوب", call: "اتصال", items: "المنتجات", back: "رجوع", required: "عبّي الحقول المطلوبة", phoneBad: "رقم الهاتف لازم 8 أرقام", lang: "English", addr: "عنوان التوصيل", whats: "واتساب", qty: "الكمية", today: "اليوم", tomorrow: "بكرة", noRes: "ما في نتائج", optin: "أوافق على استلام العروض والخصومات على الواتساب", cats2: "التصنيفات", status: "حالة الطلب", account: "حسابي", review: "مراجعة الطلب", addCart: "أضف إلى السلة", busy: "الفرع مشغول حالياً", deliverTo: "التوصيل إلى:", pickArea: "اختر منطقتك", eta: "توصيل نفس اليوم", other: "منتجات أخرى", seeAll: "الكل", myAddr: "عنواني", noAddr: "لسه ماسجلتش عنوان – هيتحفظ أول ما تطلب", contact: "تواصل معانا", installApp: "ضيف التطبيق للشاشة الرئيسية", installHint: "من Safari: زرار المشاركة ⬆️ ← إضافة إلى الشاشة الرئيسية", notif: "إشعارات العروض", langLbl: "اللغة", editAddr: "تعديل العنوان", save: "حفظ", errs: { STORE_CLOSED: "المتجر مغلق حالياً", PRODUCT_UNAVAILABLE: "منتج في سلتك لم يعد متوفراً", OUT_OF_STOCK: "الكمية المطلوبة أكبر من المتوفر", MIN_ORDER: "الطلب أقل من الحد الأدنى", EMPTY: "السلة فاضية" } },
    en: { tag: "Fresh fish & seafood", search: "Search fish, shrimp...", cats: "Categories", all: "All", offers: "Special offers", products: "Products", add: "Add", out: "Out of stock", home: "Home", cart: "Cart", orders: "Orders", viewCart: "View cart", emptyCart: "Your cart is empty", startShop: "Start shopping", subtotal: "Subtotal", delivery: "Delivery", free: "Free", total: "Total", checkout: "Checkout", minOrder: "Minimum order", freeOver: "Free delivery over", name: "Name", phone: "Phone", area: "Area", chooseArea: "Choose area", block: "Block", street: "Street", avenue: "Avenue", house: "House / Building", floor: "Floor / Apt", notes: "Notes (cleaning, cutting...)", slot: "Delivery time", asap: "As soon as possible", pay: "Payment", cash: "Cash on delivery", knet: "KNET on delivery (driver's machine)", place: "Place order", placed: "Order received!", orderNo: "Order no.", track: "Track order", noOrders: "No orders yet", closed: "Store is closed now", driver: "Driver", call: "Call", items: "Items", back: "Back", required: "Please fill the required fields", phoneBad: "Phone must be 8 digits", lang: "عربي", addr: "Delivery address", whats: "WhatsApp", qty: "Qty", today: "Today", tomorrow: "Tomorrow", noRes: "No results", optin: "Send me offers & discounts on WhatsApp", cats2: "Categories", status: "Order status", account: "Account", review: "Review order", addCart: "Add to cart", busy: "Store is busy now", deliverTo: "Deliver to:", pickArea: "Choose your area", eta: "Same-day delivery", other: "More products", seeAll: "All", myAddr: "My address", noAddr: "No address yet – it will be saved with your first order", contact: "Contact us", installApp: "Add the app to your Home Screen", installHint: "In Safari: Share ⬆️ → Add to Home Screen", notif: "Offer notifications", langLbl: "Language", editAddr: "Edit address", save: "Save", errs: { STORE_CLOSED: "Store is closed now", PRODUCT_UNAVAILABLE: "An item in your cart is no longer available", OUT_OF_STOCK: "Requested quantity is more than available", MIN_ORDER: "Order is below the minimum", EMPTY: "Cart is empty" } }
  };
  const S = { lang: ls.get("ik_lang", "ar"), cart: ls.get("ik_cart", {}), my: ls.get("ik_orders", []), addr: ls.get("ik_addr", {}), view: "home", searchOpen: false, edit: false, all: { p: [], c: [], b: [] }, cat: null, q: "", products: [], cats: [], banners: [], settings: {} };
  const t = (k) => T[S.lang][k];
  const nm = (o, f = "name") => (S.lang === "en" && o[f + "_en"]) || o[f + "_ar"] || "";
  const $ = (id) => document.getElementById(id);
  const saveCart = () => ls.set("ik_cart", S.cart);

  function setLang(l) { S.lang = l; ls.set("ik_lang", l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; render(); }

  async function load() {
    const [p, c, b, s] = await Promise.all([Store.products(), Store.categories(), Store.banners(), Store.settings()]);
    S.all = { p, c, b }; S.products = S.edit ? p : p.filter((x) => x.active); S.cats = S.edit ? c : c.filter((x) => x.active); S.banners = S.edit ? b : b.filter((x) => x.active); S.settings = s || {};
    // تنظيف السلة من منتجات محذوفة
    Object.keys(S.cart).forEach((id) => { if (!S.products.find((p) => p.id === id)) delete S.cart[id]; }); saveCart();
  }

  const cartLines = () => Object.entries(S.cart).map(([id, q]) => ({ p: S.products.find((x) => x.id === id), q })).filter((l) => l.p);
  const cartCount = () => cartLines().reduce((a, l) => a + l.q, 0);
  function totals() {
    const sub = cartLines().reduce((a, l) => a + l.p.price * l.q, 0), s = S.settings;
    const fee = s.free_delivery_over && sub >= s.free_delivery_over ? 0 : Number(s.delivery_fee || 0);
    return { sub, fee, total: sub + fee };
  }
  function setQty(id, q) {
    const p = S.products.find((x) => x.id === id), max = p && p.stock != null ? Math.floor(Number(p.stock)) : 99;
    if (q > max) { q = max; toast(S.lang === "en" ? `Only ${max} available` : `المتوفر ${max} بس`, "err"); }
    if (q <= 0) delete S.cart[id]; else S.cart[id] = Math.min(99, q); saveCart(); render();
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
    const q = S.cart[p.id] || 0;
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
        <div class="pprice">${money(p.price, S.lang)}${off ? ` <s>${money(p.old_price, S.lang)}</s>` : ""}${nm(p, "unit") ? ` <small>/ ${esc(nm(p, "unit"))}</small>` : ""}</div>
        <div class="pact">${qtyCtl(p)}</div></div>
      <div class="pimg" data-open="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy">${off ? `<span class="badge">-${off}%</span>` : ""}${busy ? `<div class="pbusy">${!p.in_stock ? t("out") : t("busy")}</div>` : ""}${S.edit ? `<button class="ebtn on-card" data-ed="prod:${p.id}">✏️ تعديل</button>` : ""}</div>
    </div>`;
  }
  function fcard(p) {
    return `<div class="fcard"><div class="fimg" data-open="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy">${p.old_price > p.price ? `<span class="badge">-${Math.round((1 - p.price / p.old_price) * 100)}%</span>` : ""}</div>
      <div class="fb"><div class="pname" data-open="${p.id}">${esc(nm(p))}</div><div class="pprice">${money(p.price, S.lang)}</div>
      ${p.in_stock && S.settings.store_open ? (S.cart[p.id] ? `<div class="qty sm"><button data-inc="${p.id}">+</button><b>${S.cart[p.id]}</b><button data-dec="${p.id}">−</button></div>` : `<button class="fplus" data-inc="${p.id}" aria-label="add">+</button>`) : `<span class="mut">${t(!p.in_stock ? "out" : "busy")}</span>`}</div></div>`;
  }
  function sections() {
    const groups = S.cats.map((c) => ({ c, items: S.products.filter((p) => p.category_id === c.id) }));
    const rest = S.products.filter((p) => !S.cats.find((c) => c.id === p.category_id));
    if (rest.length) groups.push({ c: { id: "_other", name_ar: T.ar.other, name_en: T.en.other }, items: rest });
    return groups.filter((g) => g.items.length || S.edit);
  }
  function home() {
    const s = S.settings, q = S.q.trim().toLowerCase();
    const notice = S.lang === "en" ? s.notice_en : s.notice_ar;
    if (q) {
      const list = S.products.filter((p) => (p.name_ar + " " + (p.name_en || "") + " " + (p.desc_ar || "")).toLowerCase().includes(q));
      return `<div class="wrap">${list.length ? `<div class="plist">${list.map(prow).join("")}</div>` : `<div class="empty"><div class="e">🔎</div>${t("noRes")}</div>`}</div>`;
    }
    const groups = sections(), feat = S.products.filter((p) => p.featured);
    return `<div class="hero">${S.banners.map((b) => `<div class="hslide"><img src="${esc(b.image)}" alt="${esc(b.title || "")}">${S.edit ? `<button class="ebtn on-card" data-ed="ban:${b.id}">✏️ تعديل البنر</button>` : ""}</div>`).join("")}${S.edit ? '<button class="hslide addtile" data-ed="newban">➕ إضافة بنر</button>' : ""}${!S.banners.length && !S.edit ? `<div class="hslide hfallback">${LOGO}<b>${esc(s.store_name || "Goten")}</b></div>` : ""}</div>
      ${S.banners.length > 1 ? `<div class="dots">${S.banners.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}
      <div class="wrap"><div class="info-row">
        <button class="info-pill" data-area><span><small>${t("deliverTo")}</small><b>${esc(S.addr.area || t("pickArea"))}</b></span><span class="chev">‹</span></button>
        <div class="info-pill soft"><b>⏱️ ${esc(s.delivery_eta || t("eta"))}</b></div></div>
        ${!s.store_open ? `<div class="notice">⛔ ${t("closed")}</div>` : ""}${notice ? `<div class="notice">📢 ${esc(notice)}</div>` : ""}</div>
      <div class="ctabs" id="ctabs"><div class="ctabs-in">${feat.length ? `<button data-jump="_feat">🔥 ${t("offers")}</button>` : ""}${groups.map((g) => `<button data-jump="${g.c.id}">${esc(nm(g.c))}</button>`).join("")}</div></div>
      <div class="wrap">
        ${feat.length ? `<section class="csec" id="sec__feat"><h2>🔥 ${t("offers")}</h2><div class="frow">${feat.map(fcard).join("")}</div></section>` : ""}
        ${groups.map((g) => `<section class="csec" id="sec_${g.c.id}"><h2>${esc(nm(g.c))}${S.edit && g.c.id !== "_other" ? ` <button class="ebtn sm" data-ed="cat:${g.c.id}">✏️</button>` : ""}</h2>
          <div class="plist">${g.items.map(prow).join("")}${S.edit ? '<button class="addtile row" data-ed="newprod">➕ إضافة منتج</button>' : ""}</div></section>`).join("")}
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
      <div class="card menu">
        <button data-view="orders"><span>🧾 ${t("orders")}</span><span class="chev">‹</span></button>
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
    return `<div class="line"><span>${t("subtotal")}</span><b>${money(x.sub, S.lang)}</b></div><div class="line"><span>${t("delivery")}</span><b>${x.fee ? money(x.fee, S.lang) : t("free")}</b></div><div class="line total"><span>${t("total")}</span><span>${money(x.total, S.lang)}</span></div>`;
  }
  function cart() {
    const lines = cartLines();
    if (!lines.length) return `<div class="wrap"><div class="empty"><div class="e">🛒</div><p>${t("emptyCart")}</p><button class="btn tq" data-view="home">${t("startShop")}</button></div></div>`;
    const x = totals(), min = Number(S.settings.min_order || 0);
    return `<div class="wrap"><div class="h2">${t("cart")}</div><div class="card">${lines.map((l) => `<div class="citem"><img src="${esc(l.p.image)}" alt=""><div class="t"><b>${esc(nm(l.p))}</b><div class="mut">${money(l.p.price, S.lang)} / ${esc(nm(l.p, "unit"))}</div></div>${qtyCtl(l.p)}</div>`).join("")}</div>
      <div class="card">${summary()}</div>
      ${x.sub < min ? `<div class="notice">${t("minOrder")}: ${money(min, S.lang)}</div>` : ""}
      <button class="btn tq block" data-view="checkout" ${x.sub < min || !S.settings.store_open ? "disabled" : ""}>${t("checkout")}</button></div>`;
  }
  function slots() {
    const out = [{ v: t("asap"), l: t("asap") }];
    const n = new Date();
    for (let d = 0; d < 2; d++) for (let h = 9; h <= 21; h += 2) {
      if (d === 0 && h <= n.getHours() + 1) continue;
      const lab = `${d ? t("tomorrow") : t("today")} ${h}:00 – ${h + 2}:00`; out.push({ v: lab, l: lab });
    }
    return out;
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
      <div class="card"><b>${t("slot")}</b><select class="in" id="f_slot" style="margin-top:8px">${slots().map((s) => `<option value="${esc(s.v)}">${esc(s.l)}</option>`).join("")}</select></div>
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
      <b>${t("items")}</b>${(o.items || []).map((i) => `<div class="line"><span>${esc(S.lang === "en" && i.name_en ? i.name_en : i.name_ar)} × ${i.qty}</span><span>${money(i.price * i.qty, S.lang)}</span></div>`).join("")}
      <div class="line"><span>${t("delivery")}</span><span>${Number(o.delivery_fee) ? money(o.delivery_fee, S.lang) : t("free")}</span></div><div class="line total"><span>${t("total")}</span><span>${money(o.total, S.lang)}</span></div>
      ${S.settings.whatsapp ? `<a class="btn ghost block" style="margin-top:12px" target="_blank" rel="noopener" href="https://wa.me/${esc(S.settings.whatsapp)}?text=${encodeURIComponent("طلب رقم #" + o.order_no)}">💬 ${t("whats")}</a>` : ""}`);
  }
  function openProduct(id) {
    const p = S.products.find((x) => x.id === id); if (!p) return;
    sheet(`<img class="sheet-img" src="${esc(p.image)}" alt=""><h3 style="margin:0 0 4px">${esc(nm(p))}</h3>
      <div><span class="price" style="font-size:19px">${money(p.price, S.lang)}</span>${p.old_price > p.price ? `<span class="old">${money(p.old_price, S.lang)}</span>` : ""} <span class="mut">/ ${esc(nm(p, "unit"))}</span></div>
      <p class="mut">${esc(nm(p, "desc"))}</p><div id="sq">${qtyCtl(p)}</div>`);
  }

  function render() {
    const app = $("app"), n = cartCount();
    const body = S.view === "cart" ? cart() : S.view === "checkout" ? checkout() : S.view === "orders" ? ordersView() : S.view === "cats" ? catsView() : S.view === "account" ? accountView() : home();
    const navOn = (v) => S.view === v || (v === "cart" && S.view === "checkout");
    app.innerHTML = header() + `<main class="shop">${body}</main>` +
      ((S.view === "home" || S.view === "cats") && n ? `<div class="cartbar"><div class="wrap"><button class="review-bar" data-view="cart"><span class="rcount">${n}</span><b>${t("review")}</b><span>${money(totals().sub, S.lang)}</span></button></div></div>` : "") +
      `<nav class="nav shop-nav"><div class="wrap">${[["home", IC.home, t("home")], ["cats", IC.cats, t("cats2")], ["orders", IC.status, t("status")], ["cart", IC.cart, t("cart")], ["account", IC.user, t("account")]].map(([v, i, l]) => `<button class="${navOn(v) ? "on" : ""}" data-view="${v}"><i>${i}</i>${l}${v === "cart" && n ? `<span class="cnt">${n}</span>` : ""}</button>`).join("")}</div></nav>`;
    const q = $("q"); if (q) { q.oninput = (e) => { S.q = e.target.value; const pos = e.target.selectionStart; render(); const q2 = $("q"); q2.focus(); q2.setSelectionRange(pos, pos); }; }
    const pb = $("placeBtn"); if (pb) pb.onclick = place;
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
    p.items = cartLines().map((l) => ({ id: l.p.id, qty: l.q }));
    const btn = $("placeBtn"); btn.disabled = true;
    try {
      const r = await Store.placeOrder(p);
      S.my.unshift({ id: r.id, order_no: r.order_no, total: r.total, created_at: new Date().toISOString() }); ls.set("ik_orders", S.my.slice(0, 50));
      S.cart = {}; saveCart(); S.view = "orders"; render();
      sheet(`<div class="empty" style="padding:20px 0"><div class="e">✅</div><h2>${t("placed")}</h2><p>${t("orderNo")}: <b>#${r.order_no}</b></p><p>${t("total")}: <b>${money(r.total, S.lang)}</b></p><button class="btn tq block" data-track2="${r.id}">${t("track")}</button>${Store.live && UI.pushState() !== "granted" ? `<button class="btn ghost block" style="margin-top:8px" data-pushc>🔔 ${S.lang === "en" ? "Get offers as notifications" : "فعّل الإشعارات عشان توصلك العروض"}</button>` : ""}</div>`);
    } catch (e) {
      const k = Object.keys(T.ar.errs).find((x) => String(e.message).includes(x));
      toast(k ? t("errs")[k] : e.message, "err"); btn.disabled = false; if (k === "PRODUCT_UNAVAILABLE" || k === "OUT_OF_STOCK") { await load(); }
    }
  }

  document.addEventListener("click", (e) => {
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
    const el = e.target.closest("[data-inc],[data-dec],[data-view],[data-cat],[data-open],[data-lang],[data-track],[data-track2]"); if (!el) return;
    const d = el.dataset;
    if (d.inc) { setQty(d.inc, (S.cart[d.inc] || 0) + 1); refreshSheetQty(d.inc); }
    else if (d.dec) { setQty(d.dec, (S.cart[d.dec] || 0) - 1); refreshSheetQty(d.dec); }
    else if (d.view !== undefined) { closeSheet(); S.view = d.view; render(); scrollTo(0, 0); }
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

  function refreshSheetQty(id) { const sq = document.getElementById("sq"); if (sq) { const p = S.products.find((x) => x.id === id); if (p) sq.innerHTML = qtyCtl(p); } }

  (async function start() {
    document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = S.lang;
    try { await Store.init(); await checkEditRights(); await load(); render(); } catch (e) { $("app").innerHTML = `<div class="empty"><div class="e">⚠️</div>${esc(e.message)}</div>`; return; }
    Store.onChange(async () => { if (S.view === "checkout" || document.getElementById("sheet")) return; try { await load(); render(); } catch (e) {} });
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  })();
})();
