// لوحة تحكم Goten
(function () {
  const { esc, money, toast, sheet, closeSheet, STATUS, fmtDate, LOGO, num } = UI;
  const C = window.ISLAMKO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const A = { tab: "dash", me: null, orders: [], products: [], cats: [], banners: [], profiles: [], settings: {}, ofilter: "active", pq: "", bulk: false, known: null };
  const TABS = [["dash", "📊 الرئيسية"], ["orders", "🧾 الطلبات"], ["products", "🐟 المنتجات"], ["cats", "🗂️ الأقسام"], ["banners", "🖼️ البنرات"], ["team", "🛵 المناديب"], ["settings", "⚙️ الإعدادات"]];
  const drivers = () => A.profiles.filter((p) => p.role === "driver");
  const ctx = () => ({ products: A.products, cats: A.cats, banners: A.banners, done: refresh });
  const pname = (id) => (A.profiles.find((p) => p.id === id) || {}).full_name || "—";

  // ---------- الدخول ----------
  function loginView(msg) {
    $("app").innerHTML = `<div class="login"><div class="brand" style="justify-content:center;color:var(--navy);font-size:22px;margin-bottom:6px">${LOGO}<span>لوحة تحكم Goten</span></div>
      ${msg ? `<div class="notice">${msg}</div>` : ""}
      ${Store.live ? `<div class="card"><label class="f"><span>البريد الإلكتروني</span><input class="in" id="em" type="email" autocomplete="username"></label><label class="f"><span>كلمة المرور</span><input class="in" id="pw" type="password" autocomplete="current-password"></label>
        <button class="btn block" id="inBtn">دخول</button><button class="btn ghost block" style="margin-top:8px" id="upBtn">إنشاء حساب أدمن جديد</button></div>`
      : `<div class="card"><span class="demo-tag">وضع تجريبي</span><label class="f"><span>رقم الدخول (PIN)</span><input class="in" id="pin" type="password" inputmode="numeric" placeholder="1234"></label><button class="btn block" id="pinBtn">دخول</button>
        <p class="mut">الـPIN الافتراضي 1234 (تقدر تغيره من ملف config.js).</p></div>`}</div>`;
    if (Store.live) {
      $("inBtn").onclick = async () => { try { await Store.signIn($("em").value.trim(), $("pw").value); boot(); } catch (e) { toast(e.message, "err"); } };
      $("upBtn").onclick = async () => { const em = $("em").value.trim(), pw = $("pw").value; if (!em || pw.length < 6) return toast("اكتب البريد وكلمة مرور 6 أحرف على الأقل", "err"); try { await Store.signUp(em, pw, "المدير", ""); toast("تم إنشاء الحساب – فعّله كأدمن من Supabase (راجع الدليل)"); } catch (e) { toast(e.message, "err"); } };
    } else {
      $("pinBtn").onclick = () => { if ($("pin").value === String(C.DEMO_ADMIN_PIN || "1234")) { Store.demoLogin({ id: "admin", role: "admin", full_name: "المدير" }); boot(); } else toast("PIN غير صحيح", "err"); };
    }
  }

  async function loadAll() {
    const [o, p, c, b, pr, s] = await Promise.all([Store.orders(), Store.products(), Store.categories(), Store.banners(), Store.profiles(), Store.settings()]);
    Object.assign(A, { orders: o, products: p, cats: c, banners: b, profiles: pr, settings: s || {} });
    const ids = new Set(o.map((x) => x.id));
    if (A.known) { const fresh = o.filter((x) => !A.known.has(x.id)); if (fresh.length) { beep(); toast(`🔔 طلب جديد #${fresh[0].order_no}`); } }
    A.known = ids;
  }
  function beep() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); [0, 0.25].forEach((d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.2, ctx.currentTime + d); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.18); }); } catch (e) {} }

  // ---------- الواجهة ----------
  function render() {
    const body = { dash, orders, products, cats, banners, team, settings }[A.tab]();
    $("app").innerHTML = `<header class="top"><div class="wrap wide"><div class="row"><div class="brand">${LOGO}<div>لوحة التحكم<small>${esc(A.me.full_name || A.me.email || "")} ${Store.live ? "" : '· <span class="demo-tag">تجريبي</span>'}</small></div></div><div class="sp"></div>
      <button class="chip-btn" id="pushBtn">${UI.pushState() === "granted" ? "🔔" : "🔕 فعّل"}</button><a class="chip-btn" href="index.html" target="_blank" style="text-decoration:none">👁️</a><button class="chip-btn" id="outBtn">خروج</button></div>
      <div class="tabs">${TABS.map(([k, l]) => `<button class="${A.tab === k ? "on" : ""}" data-tab="${k}">${l}${k === "orders" && newCount() ? ` (${newCount()})` : ""}</button>`).join("")}</div></div></header>
      <main><div class="wrap wide">${body}</div></main>`;
    $("outBtn").onclick = async () => { await Store.signOut(); loginView(); };
    $("pushBtn").onclick = async () => { try { await UI.enablePush((s) => Store.savePush(s)); toast("✅ الإشعارات اتفعّلت – هيجيلك إشعار مع كل طلب جديد"); render(); } catch (e) { toast(e.message, "err"); } };
    bind();
  }
  const newCount = () => A.orders.filter((o) => o.status === "new").length;
  const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

  function dash() {
    const today = A.orders.filter((o) => isToday(o.created_at) && o.status !== "cancelled");
    const rev = today.reduce((a, o) => a + num(o.total), 0);
    const active = A.orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    return `<div class="h2">نظرة عامة</div><div class="stats">
      <div class="stat"><span class="mut">طلبات اليوم</span><b>${today.length}</b></div><div class="stat"><span class="mut">مبيعات اليوم</span><b>${money(rev)}</b></div>
      <div class="stat"><span class="mut">طلبات جديدة</span><b style="color:${STATUS.new.c}">${newCount()}</b></div><div class="stat"><span class="mut">طلبات جارية</span><b>${active.length}</b></div></div>
      <div class="h2">إجراءات سريعة</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn tq" data-newprod>+ منتج جديد</button><button class="btn" data-tab="orders">إدارة الطلبات</button><button class="btn ghost" data-storeopen>${A.settings.store_open ? "⛔ إغلاق المتجر مؤقتاً" : "✅ فتح المتجر"}</button></div>
      <div class="h2">آخر الطلبات</div>${A.orders.slice(0, 5).map(orderCard).join("") || '<p class="mut">لا توجد طلبات بعد.</p>'}`;
  }

  // ---------- الطلبات ----------
  function mapLink(o) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`الكويت ${o.area} قطعة ${o.block || ""} شارع ${o.street || ""} ${o.avenue ? "جادة " + o.avenue : ""} منزل ${o.house || ""}`); }
  function orderCard(o) {
    const s = STATUS[o.status] || STATUS.new;
    return `<div class="ord" style="border-color:${s.c}"><div class="hd"><b>#${o.order_no} · ${esc(o.customer_name)}</b><span class="st" style="background:${s.c}">${s.ar}</span></div>
      <div class="mut">${fmtDate(o.created_at)} · ${esc(o.slot || "")} · ${o.payment === "cash" ? "💵 كاش" : "💳 كي نت عند الاستلام"}</div>
      <div style="margin-top:6px">📍 ${esc(o.area)} – ق${esc(o.block)} – ش${esc(o.street)}${o.avenue ? " – ج" + esc(o.avenue) : ""} – م${esc(o.house)}${o.floor_apt ? " – " + esc(o.floor_apt) : ""}</div>
      <div style="margin-top:6px">${(o.items || []).map((i) => `${esc(i.name_ar)} ×${i.qty}`).join("، ")}</div>
      ${o.notes ? `<div class="notice">📝 ${esc(o.notes)}</div>` : ""}
      <div class="line total" style="font-size:15px"><span>الإجمالي (شامل التوصيل ${money(o.delivery_fee)})</span><span>${money(o.total)}</span></div>
      <div class="row2" style="margin-top:6px"><select class="in" data-ostatus="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select>
        <select class="in" data-odriver="${o.id}"><option value="">🛵 بدون مندوب</option>${drivers().map((d) => `<option value="${d.id}" ${o.driver_id === d.id ? "selected" : ""}>${esc(d.full_name)}</option>`).join("")}</select></div>
      <div class="acts"><a class="btn sm ghost" href="tel:+${esc(o.phone)}">📞 اتصال</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}">💬 واتساب</a><a class="btn sm ghost" target="_blank" rel="noopener" href="${mapLink(o)}">🗺️ الخريطة</a>
        ${o.status === "new" ? `<button class="btn sm green" data-quick="${o.id}:confirmed">✓ تأكيد</button>` : ""}${o.driver_id ? `<span class="pill">المندوب: ${esc(pname(o.driver_id))}</span>` : ""}</div></div>`;
  }
  function orders() {
    const F = [["active", "الجارية"], ["new", "جديد"], ["out_for_delivery", "في الطريق"], ["delivered", "تم التوصيل"], ["cancelled", "ملغي"], ["all", "الكل"]];
    let list = A.orders;
    if (A.ofilter === "active") list = list.filter((o) => !["delivered", "cancelled"].includes(o.status));
    else if (A.ofilter !== "all") list = list.filter((o) => o.status === A.ofilter);
    return `<div class="filters">${F.map(([k, l]) => `<button class="${A.ofilter === k ? "on" : ""}" data-of="${k}">${l}</button>`).join("")}</div>
      ${list.map(orderCard).join("") || '<p class="mut">لا توجد طلبات هنا.</p>'}`;
  }

  // ---------- المنتجات ----------
  function products() {
    const q = A.pq.trim();
    const list = A.products.filter((p) => !q || (p.name_ar + " " + (p.name_en || "")).includes(q));
    const catName = (id) => (A.cats.find((c) => c.id === id) || {}).name_ar || "بدون قسم";
    if (A.bulk) return `<div class="h2">تعديل الأسعار بالجملة <button class="btn ghost sm" data-bulk>إلغاء</button></div>
      <div class="card">${A.products.map((p) => `<div class="line" style="gap:8px"><span style="flex:1">${esc(p.name_ar)}</span><input class="in" style="width:110px" type="number" step="0.005" min="0" inputmode="decimal" data-bp="${p.id}" value="${num(p.price).toFixed(3)}"><input class="in" style="width:110px" type="number" step="0.005" min="0" inputmode="decimal" placeholder="قبل الخصم" data-bo="${p.id}" value="${p.old_price ? num(p.old_price).toFixed(3) : ""}"></div>`).join("")}</div>
      <button class="btn tq block" data-bulksave>💾 حفظ كل الأسعار</button>`;
    return `<div class="h2">المنتجات (${A.products.length}) <span style="display:flex;gap:6px"><button class="btn ghost sm" data-bulk>💲 الأسعار</button><button class="btn tq sm" data-newprod>+ منتج</button></span></div>
      <input class="in" id="pq" placeholder="ابحث في المنتجات..." value="${esc(A.pq)}">
      <div class="list">${list.map((p) => `<div class="it"><img src="${esc(p.image || "")}" alt=""><div class="t"><b>${esc(p.name_ar)}</b><span class="mut">${esc(catName(p.category_id))}</span>
        <div><span class="price">${money(p.price)}</span>${p.old_price ? `<span class="old">${money(p.old_price)}</span>` : ""}${!p.active ? '<span class="pill r">مخفي</span>' : ""}${p.featured ? '<span class="pill g">عرض</span>' : ""}</div></div>
        <label class="mut" style="display:flex;flex-direction:column;align-items:center;font-size:11px"><input type="checkbox" data-stock="${p.id}" ${p.in_stock ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--tq)">متوفر</label>
        <button class="btn sm ghost" data-editprod="${p.id}">✏️</button></div>`).join("")}</div>`;
  }
  // ---------- الأقسام والبنرات ----------
  function cats() {
    return `<div class="h2">الأقسام <button class="btn tq sm" data-editcat="">+ قسم</button></div><div class="list">${A.cats.map((c) => `<div class="it"><img src="${esc(c.image || "")}" alt=""><div class="t"><b>${esc(c.name_ar)}</b><span class="mut">${esc(c.name_en || "")} · ${A.products.filter((p) => p.category_id === c.id).length} منتج</span>${!c.active ? '<span class="pill r">مخفي</span>' : ""}</div><button class="btn sm ghost" data-editcat="${c.id}">✏️</button></div>`).join("")}</div>`;
  }
  function banners() {
    return `<div class="h2">البنرات الإعلانية <button class="btn tq sm" data-editban="">+ بنر</button></div><p class="mut">المقاس المثالي: عرض ضعف الارتفاع (مثلاً 1200×600).</p>
      <div class="list">${A.banners.map((b) => `<div class="it"><img src="${esc(b.image)}" alt="" style="width:110px;height:55px"><div class="t"><b>${esc(b.title || "بدون عنوان")}</b>${!b.active ? '<span class="pill r">مخفي</span>' : ""}</div><button class="btn sm ghost" data-editban="${b.id}">✏️</button></div>`).join("")}</div>`;
  }
  // ---------- المناديب ----------
  function team() {
    const R = { pending: "بانتظار الموافقة", driver: "مندوب", admin: "أدمن", blocked: "موقوف" };
    return `<div class="h2">المناديب والحسابات ${Store.live ? "" : '<button class="btn tq sm" data-adddrv>+ مندوب</button>'}</div>
      <p class="mut">${Store.live ? "المندوب يسجّل من صفحة المناديب (driver.html)، وبعدها توافق عليه هنا بتغيير الصلاحية إلى «مندوب»." : "في الوضع التجريبي تقدر تضيف مناديب مباشرة."}</p>
      <div class="list">${A.profiles.map((p) => { const n = A.orders.filter((o) => o.driver_id === p.id && !["delivered", "cancelled"].includes(o.status)).length; return `<div class="it"><div style="font-size:30px">${p.role === "driver" ? "🛵" : p.role === "admin" ? "🛡️" : "👤"}</div><div class="t"><b>${esc(p.full_name || "بدون اسم")}</b><span class="mut">${esc(p.phone || "")}${p.role === "driver" ? ` · طلبات جارية: ${n}` : ""}</span></div>
        <select class="in" style="width:auto" data-role="${p.id}" ${p.id === A.me.id ? "disabled" : ""}>${Object.entries(R).map(([k, v]) => `<option value="${k}" ${p.role === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>`; }).join("") || '<p class="mut">لا يوجد حسابات بعد.</p>'}</div>`;
  }

  // ---------- الإعدادات ----------
  function settings() {
    const s = A.settings, fi = (k, l, type = "text", extra = "") => `<label class="f"><span>${l}</span><input class="in" id="s_${k}" type="${type}" value="${esc(s[k] == null ? "" : s[k])}" ${extra}></label>`;
    return `<div class="card"><label class="switch"><span><b>المتجر مفتوح ويستقبل طلبات</b></span><input type="checkbox" id="s_store_open" ${s.store_open ? "checked" : ""}></label>
      <div class="row3">${fi("delivery_fee", "رسوم التوصيل", "number", 'step="0.005" inputmode="decimal"')}${fi("min_order", "الحد الأدنى", "number", 'step="0.005" inputmode="decimal"')}${fi("free_delivery_over", "توصيل مجاني فوق", "number", 'step="0.005" inputmode="decimal"')}</div>
      ${fi("whatsapp", "واتساب المتجر (مثال 96550000000)", "tel")}${fi("notice_ar", "شريط تنبيه بالعربي")}${fi("notice_en", "Notice in English")}
      <button class="btn tq block" id="sSave">💾 حفظ الإعدادات</button></div>
      <div class="card"><b>شكل التطبيق</b><p class="mut">الشعار، اسم المتجر، لون الشريط العلوي.</p><button class="btn sm" data-editheader>🎨 تعديل الشريط العلوي والشعار</button></div>
      ${Store.live ? "" : '<div class="card"><b>الوضع التجريبي</b><p class="mut">البيانات محفوظة على هذا الجهاز فقط. لربط العملاء والمناديب فعلياً فعّل Supabase (راجع الدليل).</p><button class="btn red sm" id="resetBtn">إرجاع البيانات التجريبية الأصلية</button></div>'}`;
  }

  // ---------- الأحداث ----------
  function bind() {
    const pq = $("pq"); if (pq) pq.oninput = (e) => { A.pq = e.target.value; const pos = e.target.selectionStart; render(); $("pq").focus(); $("pq").setSelectionRange(pos, pos); };
    const ss = $("sSave"); if (ss) ss.onclick = async () => {
      const v = (k) => $("s_" + k).value.trim();
      try { await Store.saveSettings({ store_open: $("s_store_open").checked, delivery_fee: num(v("delivery_fee")), min_order: num(v("min_order")), free_delivery_over: v("free_delivery_over") ? num(v("free_delivery_over")) : null, whatsapp: v("whatsapp").replace(/\D/g, ""), notice_ar: v("notice_ar"), notice_en: v("notice_en") }); toast("تم الحفظ ✓"); await refresh(); } catch (e) { toast(e.message, "err"); }
    };
    const rb = $("resetBtn"); if (rb) rb.onclick = async () => { if (await UI.ask("مسح كل التعديلات والطلبات التجريبية؟")) { await Store.resetDemo(); await refresh(); toast("تم"); } };
  }
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-tab],[data-of],[data-newprod],[data-editprod],[data-editcat],[data-editban],[data-bulk],[data-bulksave],[data-quick],[data-storeopen],[data-adddrv],[data-editheader]"); if (!el || !A.me) return;
    const d = el.dataset;
    try {
      if (d.tab) { A.tab = d.tab; render(); scrollTo(0, 0); }
      else if (d.of) { A.ofilter = d.of; render(); }
      else if (d.newprod !== undefined) Editors.product(null, ctx());
      else if (d.editprod) Editors.product(d.editprod, ctx());
      else if (d.editcat !== undefined) Editors.category(d.editcat || null, ctx());
      else if (d.editban !== undefined) Editors.banner(d.editban || null, ctx());
      else if (d.bulk !== undefined) { A.bulk = !A.bulk; render(); }
      else if (d.bulksave !== undefined) {
        el.disabled = true; let n = 0;
        for (const p of A.products) {
          const np = num(document.querySelector(`[data-bp="${p.id}"]`).value), ovRaw = document.querySelector(`[data-bo="${p.id}"]`).value, ov = ovRaw ? num(ovRaw) : null;
          if (np > 0 && (np !== num(p.price) || ov !== (p.old_price == null ? null : num(p.old_price)))) { await Store.saveProduct({ ...p, price: np, old_price: ov }); n++; }
        }
        A.bulk = false; toast(`تم تحديث ${n} سعر ✓`); await refresh();
      }
      else if (d.quick) { const [id, st] = d.quick.split(":"); await Store.updateOrder(id, { status: st }); toast("تم ✓"); await refresh(); }
      else if (d.editheader !== undefined) Editors.header(A.settings, ctx());
      else if (d.storeopen !== undefined) { await Store.saveSettings({ store_open: !A.settings.store_open }); await refresh(); }
      else if (d.adddrv !== undefined) {
        sheet(`<h3>مندوب جديد</h3><label class="f"><span>الاسم</span><input class="in" id="dn"></label><label class="f"><span>الهاتف (965xxxxxxxx)</span><input class="in" id="dp" type="tel"></label><button class="btn tq block" id="dSave">حفظ</button>`, () => {
          $("dSave").onclick = async () => { if (!$("dn").value.trim()) return; await Store.saveProfile({ full_name: $("dn").value.trim(), phone: $("dp").value.replace(/\D/g, ""), role: "driver" }); closeSheet(); await refresh(); };
        });
      }
    } catch (err) { toast(err.message, "err"); el.disabled = false; }
  });
  document.addEventListener("change", async (e) => {
    const el = e.target, d = el.dataset; if (!A.me) return;
    try {
      if (d.ostatus) { await Store.updateOrder(d.ostatus, { status: el.value }); toast("تم تحديث الحالة ✓"); await refresh(); }
      else if (d.odriver !== undefined && d.odriver) { const o = A.orders.find((x) => x.id === d.odriver); const patch = { driver_id: el.value || null }; if (el.value && ["new", "confirmed"].includes(o.status)) patch.status = "preparing"; await Store.updateOrder(d.odriver, patch); toast("تم تعيين المندوب ✓"); await refresh(); }
      else if (d.stock) { const p = A.products.find((x) => x.id === d.stock); await Store.saveProduct({ ...p, in_stock: el.checked }); toast(el.checked ? "متوفر ✓" : "تم إخفاؤه كغير متوفر"); await refresh(); }
      else if (d.role) { const p = A.profiles.find((x) => x.id === d.role); await Store.saveProfile({ ...p, role: el.value }); toast("تم تحديث الصلاحية ✓"); await refresh(); }
    } catch (err) { toast(err.message, "err"); }
  });

  async function refresh(bg) { await loadAll(); const ae = document.activeElement; if (document.getElementById("sheet") || A.bulk) return; if (bg && (A.tab === "settings" || (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)))) return; render(); }
  async function boot() {
    try {
      const me = await Store.me();
      if (!me) return loginView();
      if (me.role !== "admin") return loginView(Store.live ? `حسابك (${esc(me.email || me.full_name || "")}) مش أدمن لسه. فعّله من Supabase بالأمر الموجود في الدليل، أو اطلب من أدمن آخر.` : "");
      A.me = me; await loadAll(); render();
    } catch (e) { toast(e.message, "err"); loginView(); }
  }
  (async () => { try { await Store.init(); } catch (e) { $("app").innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; return; } await boot(); Store.onChange(() => { if (A.me) refresh(true).catch(() => {}); }); })();
})();
