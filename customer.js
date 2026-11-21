// تطبيق العملاء – Goten
(function () {
  const { esc, money, ls, toast, sheet, closeSheet, STATUS, STATUS_FLOW, AREAS, fmtDate, LOGO } = UI;
  const T = {
    ar: { tag: "أسماك ومأكولات بحرية طازجة", search: "ابحث عن سمك، روبيان...", cats: "الأقسام", all: "الكل", offers: "عروض مميزة", products: "المنتجات", add: "أضف", out: "نفدت الكمية", home: "الرئيسية", cart: "السلة", orders: "طلباتي", viewCart: "عرض السلة", emptyCart: "سلتك فاضية", startShop: "ابدأ التسوق", subtotal: "المجموع", delivery: "التوصيل", free: "مجاني", total: "الإجمالي", checkout: "إتمام الطلب", minOrder: "الحد الأدنى للطلب", freeOver: "توصيل مجاني للطلبات فوق", name: "الاسم", phone: "رقم الهاتف", area: "المنطقة", chooseArea: "اختر المنطقة", block: "قطعة", street: "شارع", avenue: "جادة", house: "منزل / مبنى", floor: "الدور / الشقة", notes: "ملاحظات (تنظيف، تقطيع...)", slot: "وقت التوصيل", asap: "بأسرع وقت", pay: "طريقة الدفع", cash: "كاش عند الاستلام", knet: "كي نت عند الاستلام (جهاز المندوب)", place: "تأكيد الطلب", placed: "تم استلام طلبك!", orderNo: "رقم الطلب", track: "تتبع الطلب", noOrders: "ما عندك طلبات لسه", closed: "المتجر مغلق حالياً", driver: "المندوب", call: "اتصال", items: "المنتجات", back: "رجوع", required: "عبّي الحقول المطلوبة", phoneBad: "رقم الهاتف لازم 8 أرقام", lang: "English", addr: "عنوان التوصيل", whats: "واتساب", qty: "الكمية", today: "اليوم", tomorrow: "بكرة", noRes: "ما في نتائج", errs: { STORE_CLOSED: "المتجر مغلق حالياً", PRODUCT_UNAVAILABLE: "منتج في سلتك لم يعد متوفراً", MIN_ORDER: "الطلب أقل من الحد الأدنى", EMPTY: "السلة فاضية" } },
    en: { tag: "Fresh fish & seafood", search: "Search fish, shrimp...", cats: "Categories", all: "All", offers: "Special offers", products: "Products", add: "Add", out: "Out of stock", home: "Home", cart: "Cart", orders: "Orders", viewCart: "View cart", emptyCart: "Your cart is empty", startShop: "Start shopping", subtotal: "Subtotal", delivery: "Delivery", free: "Free", total: "Total", checkout: "Checkout", minOrder: "Minimum order", freeOver: "Free delivery over", name: "Name", phone: "Phone", area: "Area", chooseArea: "Choose area", block: "Block", street: "Street", avenue: "Avenue", house: "House / Building", floor: "Floor / Apt", notes: "Notes (cleaning, cutting...)", slot: "Delivery time", asap: "As soon as possible", pay: "Payment", cash: "Cash on delivery", knet: "KNET on delivery (driver's machine)", place: "Place order", placed: "Order received!", orderNo: "Order no.", track: "Track order", noOrders: "No orders yet", closed: "Store is closed now", driver: "Driver", call: "Call", items: "Items", back: "Back", required: "Please fill the required fields", phoneBad: "Phone must be 8 digits", lang: "عربي", addr: "Delivery address", whats: "WhatsApp", qty: "Qty", today: "Today", tomorrow: "Tomorrow", noRes: "No results", errs: { STORE_CLOSED: "Store is closed now", PRODUCT_UNAVAILABLE: "An item in your cart is no longer available", MIN_ORDER: "Order is below the minimum", EMPTY: "Cart is empty" } }
  };
  const S = { lang: ls.get("ik_lang", "ar"), cart: ls.get("ik_cart", {}), my: ls.get("ik_orders", []), addr: ls.get("ik_addr", {}), view: "home", edit: false, all: { p: [], c: [], b: [] }, cat: null, q: "", products: [], cats: [], banners: [], settings: {} };
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
  function setQty(id, q) { if (q <= 0) delete S.cart[id]; else S.cart[id] = Math.min(99, q); saveCart(); render(); }

  // ---------- العرض ----------
  function header() {
    const s = S.settings, logo = s.logo ? `<img src="${esc(s.logo)}" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover">` : LOGO;
    const tag = (S.lang === "en" ? s.tagline_en : s.tagline_ar) || t("tag");
    return `<header class="top" style="${s.header_color ? "background:" + esc(s.header_color) : ""}"><div class="wrap"><div class="row"><div class="brand">${logo}<div>${esc(s.store_name || "Goten")}<small>${esc(tag)}</small></div></div>${S.edit ? '<button class="ebtn" data-ed="header" title="تعديل">✏️</button>' : ""}<div class="sp"></div>${S.canEdit ? `<button class="chip-btn" data-editmode>${S.edit ? "✅ تم" : "⚙️ تحكم"}</button>` : ""}<button class="chip-btn" data-lang>${t("lang")}</button></div>
      ${S.edit ? `<div class="etools"><button data-ed="newprod">➕ منتج</button><button data-ed="newcat">🗂️ قسم</button><button data-ed="newban">🖼️ بنر</button><button data-ed="header">🎨 الشريط العلوي</button><a href="admin.html" target="_blank" rel="noopener">📊 لوحة التحكم</a><a href="driver.html" target="_blank" rel="noopener">🛵 المناديب</a></div>` : ""}
      ${S.view === "home" ? `<div class="search">🔍<input id="q" placeholder="${t("search")}" value="${esc(S.q)}" autocomplete="off"></div>` : ""}</div></header>`;
  }
  function qtyCtl(p) {
    const q = S.cart[p.id] || 0;
    if (!p.in_stock) return `<button class="add" disabled>${t("out")}</button>`;
    return q ? `<div class="qty"><button data-inc="${p.id}">+</button><b>${q}</b><button data-dec="${p.id}">−</button></div>` : `<button class="add" data-inc="${p.id}">${t("add")} +</button>`;
  }
  function pcard(p) {
    const off = p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
    return `<div class="pcard">${S.edit ? `<button class="ebtn on-card" data-ed="prod:${p.id}">✏️ تعديل</button>${!p.active ? '<span class="badge off" style="top:40px">مخفي</span>' : ""}` : ""}${off ? `<span class="badge">-${off}%</span>` : ""}${!p.in_stock ? `<span class="badge off">${t("out")}</span>` : ""}
      <img src="${esc(p.image)}" alt="" loading="lazy" data-open="${p.id}"><div class="b"><div class="n" data-open="${p.id}">${esc(nm(p))}</div>
      <div><span class="price">${money(p.price, S.lang)}</span>${off ? `<span class="old">${money(p.old_price, S.lang)}</span>` : ""}</div>
      <div class="u">/ ${esc(nm(p, "unit") || "")}</div><div class="act">${qtyCtl(p)}</div></div></div>`;
  }
  function home() {
    const s = S.settings, q = S.q.trim().toLowerCase();
    let list = S.products;
    if (S.cat) list = list.filter((p) => p.category_id === S.cat);
    if (q) list = list.filter((p) => (p.name_ar + " " + (p.name_en || "")).toLowerCase().includes(q));
    const feat = S.products.filter((p) => p.featured);
    const notice = S.lang === "en" ? s.notice_en : s.notice_ar;
    return `<div class="wrap">
      ${!s.store_open ? `<div class="notice">⛔ ${t("closed")}</div>` : ""}${notice ? `<div class="notice">📢 ${esc(notice)}</div>` : ""}
      ${!q && (S.banners.length || S.edit) ? `<div class="banners">${S.banners.map((b) => S.edit ? `<div class="bwrap"><img src="${esc(b.image)}" alt=""><button class="ebtn on-card" data-ed="ban:${b.id}">✏️ تعديل البنر</button></div>` : `<img src="${esc(b.image)}" alt="${esc(b.title || "")}">`).join("")}${S.edit ? '<button class="addtile ban" data-ed="newban">➕<br>إضافة بنر</button>' : ""}</div>` : ""}
      <div class="h2">${t("cats")}</div>
      <div class="cats"><button class="cat ${!S.cat ? "on" : ""}" data-cat=""><img src="${esc((S.cats[0] || {}).image || "")}" alt=""><span>${t("all")}</span></button>
        ${S.cats.map((c) => `<div style="flex:0 0 auto;text-align:center"><button class="cat ${S.cat === c.id ? "on" : ""}" data-cat="${c.id}"><img src="${esc(c.image)}" alt=""><span>${esc(nm(c))}</span></button>${S.edit ? `<button class="ebtn sm" data-ed="cat:${c.id}">✏️</button>` : ""}</div>`).join("")}${S.edit ? '<button class="cat" data-ed="newcat"><span class="addcircle">➕</span><span>قسم جديد</span></button>' : ""}</div>
      ${!S.cat && !q && feat.length ? `<div class="h2">🔥 ${t("offers")}</div><div class="grid">${feat.map(pcard).join("")}</div>` : ""}
      <div class="h2">${S.cat ? esc(nm(S.cats.find((c) => c.id === S.cat) || {})) : t("products")}</div>
      ${list.length || S.edit ? `<div class="grid">${S.edit ? '<button class="addtile" data-ed="newprod">➕<br>إضافة منتج</button>' : ""}${list.map(pcard).join("")}</div>` : `<div class="empty"><div class="e">🔎</div>${t("noRes")}</div>`}
      <p class="mut" style="text-align:center;margin-top:24px">${s.free_delivery_over ? `🚚 ${t("freeOver")} ${money(s.free_delivery_over, S.lang)} · ` : ""}${t("minOrder")} ${money(s.min_order, S.lang)}</p>
    </div>`;
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
    const body = S.view === "cart" ? cart() : S.view === "checkout" ? checkout() : S.view === "orders" ? ordersView() : home();
    app.innerHTML = header() + `<main>${body}</main>` +
      (S.view === "home" && n ? `<div class="cartbar"><div class="wrap"><button class="btn tq" data-view="cart"><span>🛒 ${t("viewCart")} (${n})</span><span>${money(totals().sub, S.lang)}</span></button></div></div>` : "") +
      `<nav class="nav"><div class="wrap">${[["home", "🏠"], ["cart", "🛒"], ["orders", "🧾"]].map(([v, i]) => `<button class="${S.view === v || (v === "cart" && S.view === "checkout") ? "on" : ""}" data-view="${v}"><i>${i}</i>${t(v)}${v === "cart" && n ? `<span class="cnt">${n}</span>` : ""}</button>`).join("")}</div></nav>`;
    const q = $("q"); if (q) q.oninput = (e) => { S.q = e.target.value; const pos = e.target.selectionStart; render(); const q2 = $("q"); q2.focus(); q2.setSelectionRange(pos, pos); };
    const pb = $("placeBtn"); if (pb) pb.onclick = place;
    if (S.view === "orders") fillStatuses();
  }

  async function place() {
    const g = (k) => ($("f_" + k) ? $("f_" + k).value.trim() : "");
    const p = { customer_name: g("customer_name"), phone: g("phone").replace(/\D/g, ""), area: g("area"), block: g("block"), street: g("street"), avenue: g("avenue"), house: g("house"), floor_apt: g("floor_apt"), notes: g("notes"), slot: g("slot"), payment: (document.querySelector("input[name=pay]:checked") || {}).value || "cash" };
    if (!p.customer_name || !p.phone || !p.area || !p.block || !p.street || !p.house) return toast(t("required"), "err");
    if (!/^[124569]\d{7}$/.test(p.phone)) return toast(t("phoneBad"), "err");
    const { notes, slot, payment, ...addr } = p; S.addr = addr; ls.set("ik_addr", addr);
    p.phone = "965" + p.phone;
    p.items = cartLines().map((l) => ({ id: l.p.id, qty: l.q }));
    const btn = $("placeBtn"); btn.disabled = true;
    try {
      const r = await Store.placeOrder(p);
      S.my.unshift({ id: r.id, order_no: r.order_no, total: r.total, created_at: new Date().toISOString() }); ls.set("ik_orders", S.my.slice(0, 50));
      S.cart = {}; saveCart(); S.view = "orders"; render();
      sheet(`<div class="empty" style="padding:20px 0"><div class="e">✅</div><h2>${t("placed")}</h2><p>${t("orderNo")}: <b>#${r.order_no}</b></p><p>${t("total")}: <b>${money(r.total, S.lang)}</b></p><button class="btn tq block" data-track2="${r.id}">${t("track")}</button></div>`);
    } catch (e) {
      const k = Object.keys(T.ar.errs).find((x) => String(e.message).includes(x));
      toast(k ? t("errs")[k] : e.message, "err"); btn.disabled = false; if (k === "PRODUCT_UNAVAILABLE") { await load(); }
    }
  }

  document.addEventListener("click", (e) => {
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

  function refreshSheetQty(id) { const sq = document.getElementById("sq"); if (sq) { const p = S.products.find((x) => x.id === id); if (p) sq.innerHTML = qtyCtl(p); } }

  (async function start() {
    document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = S.lang;
    try { await Store.init(); await checkEditRights(); await load(); render(); } catch (e) { $("app").innerHTML = `<div class="empty"><div class="e">⚠️</div>${esc(e.message)}</div>`; return; }
    Store.onChange(async () => { if (S.view === "checkout" || document.getElementById("sheet")) return; try { await load(); render(); } catch (e) {} });
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  })();
})();
