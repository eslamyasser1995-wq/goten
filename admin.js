// لوحة تحكم Goten
(function () {
  const { esc, money, toast, sheet, closeSheet, STATUS, fmtDate, LOGO, num } = UI;
  const C = window.ISLAMKO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const A = { tx: [], period: "month", cq: "", cOnlyOpt: true, tab: "dash", me: null, orders: [], products: [], cats: [], banners: [], profiles: [], settings: {}, ofilter: "active", pq: "", bulk: false, known: null };
  const TABS = [["dash", "📊 الرئيسية"], ["reports", "📑 التقارير"], ["orders", "🧾 الطلبات"], ["accounts", "💰 الحسابات"], ["products", "🐟 المنتجات"], ["cats", "🗂️ الأقسام"], ["banners", "🖼️ البنرات"], ["coupons", "🎟️ الكوبونات"], ["customers", "👥 الزباين"], ["team", "🛵 المناديب"], ["settings", "⚙️ الإعدادات"]];
  const drivers = () => A.profiles.filter((p) => p.role === "driver");
  const ctx = () => ({ products: A.products, cats: A.cats, banners: A.banners, done: refresh });
  const pname = (id) => (A.profiles.find((p) => p.id === id) || {}).full_name || "—";

  // ---------- الدخول ----------
  function loginView(msg) {
    $("app").innerHTML = `<div class="login"><div class="brand" style="justify-content:center;color:var(--navy);font-size:22px;margin-bottom:6px">${LOGO}<span>لوحة تحكم Goten</span></div>
      ${msg ? `<div class="notice">${msg}</div>` : ""}
      ${Store.live ? `<div class="card"><label class="f"><span>البريد الإلكتروني</span><input class="in" id="em" type="email" autocomplete="username" value="${esc(UI.lastEmail())}"></label><label class="f"><span>كلمة المرور</span><input class="in" id="pw" type="password" autocomplete="current-password" enterkeyhint="go"></label>
        <button class="btn block" id="inBtn">دخول</button><button class="btn ghost block" style="margin-top:8px" data-forgot>🔑 نسيت كلمة السر؟</button><button class="btn ghost block" style="margin-top:8px" id="upBtn">إنشاء حساب أدمن جديد</button></div>`
      : `<div class="card"><span class="demo-tag">وضع تجريبي</span><label class="f"><span>رقم الدخول (PIN)</span><input class="in" id="pin" type="password" inputmode="numeric" placeholder="1234"></label><button class="btn block" id="pinBtn">دخول</button>
        <p class="mut">الـPIN الافتراضي 1234 (تقدر تغيره من ملف config.js).</p></div>`}</div>`;
    if (Store.live) {
      $("inBtn").onclick = async () => { const em = $("em").value.trim(), pw = $("pw").value; if (!em || !pw) return toast("اكتب الإيميل وكلمة السر", "err"); $("inBtn").disabled = true; try { await Store.signIn(em, pw); boot(); } catch (e) { $("inBtn").disabled = false; toast(/Invalid login/i.test(e.message) ? "الإيميل أو كلمة السر غلط – جرّب «نسيت كلمة السر»" : /not confirmed/i.test(e.message) ? "الإيميل لسه متأكدش" : e.message, "err"); } };
      $("pw").onkeydown = (e) => { if (e.key === "Enter") $("inBtn").click(); };
      if (UI.lastEmail()) setTimeout(() => $("pw").focus(), 50);
      $("upBtn").onclick = async () => { const em = $("em").value.trim(), pw = $("pw").value; if (!em || pw.length < 6) return toast("اكتب البريد وكلمة مرور 6 أحرف على الأقل", "err"); try { await Store.signUp(em, pw, "المدير", ""); toast("تم إنشاء الحساب – فعّله كأدمن من Supabase (راجع الدليل)"); } catch (e) { toast(e.message, "err"); } };
    } else {
      $("pinBtn").onclick = () => { if ($("pin").value === String(C.DEMO_ADMIN_PIN || "1234")) { Store.demoLogin({ id: "admin", role: "admin", full_name: "المدير" }); boot(); } else toast("PIN غير صحيح", "err"); };
    }
  }

  async function loadAll() {
    const [o, p, c, b, pr, s, ic, tx, mv, sp, cp] = await Promise.all([Store.orders(), Store.products(), Store.categories(), Store.banners(), Store.profiles(), Store.settings(), Store.importedCustomers().catch(() => []), Store.transactions().catch(() => []), Store.stockMoves().catch(() => null), Store.suppliers().catch(() => null), Store.coupons().catch(() => null)]);
    [A.emps, A.recs] = await Promise.all([Store.employees().catch(() => null), Store.recurring().catch(() => null)]);
    [A.dmoves, A.cmeta, A.dcloses, A.alog] = await Promise.all([Store.driverMoves().catch(() => []), Store.custMeta().catch(() => []), Store.dayCloses().catch(() => []), A.me && A.me.role === "admin" ? Store.auditLog().catch(() => []) : Promise.resolve([])]);
    Object.assign(A, { orders: o, products: p, cats: c, banners: b, profiles: pr, settings: s || {}, imported: ic || [], tx: tx || [], moves: mv, sups: sp, cps: cp });
    const ids = new Set(o.map((x) => x.id));
    if (A.known) { const fresh = o.filter((x) => !A.known.has(x.id)); if (fresh.length) { beep(); toast(`🔔 طلب جديد #${fresh[0].order_no}`); } }
    A.known = ids;
  }
  function beep() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); [0, 0.25].forEach((d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.2, ctx.currentTime + d); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.18); }); } catch (e) {} }

  // ---------- الواجهة ----------
  function render() {
    if (A.me.role === "accountant" && !["orders", "accounts", "reports"].includes(A.tab)) A.tab = "accounts";
    const body = { dash, reports, orders, accounts, products, cats, banners, coupons, customers, team, settings }[A.tab]();
    $("app").innerHTML = `<header class="top"><div class="wrap wide"><div class="row"><div class="brand">${LOGO}<div>لوحة التحكم<small>${esc(A.me.full_name || A.me.email || "")} ${Store.live ? "" : '· <span class="demo-tag">تجريبي</span>'}</small></div></div><div class="sp"></div>
      <button class="chip-btn" id="pushBtn">${UI.pushState() === "granted" ? "🔔" : "🔕 فعّل"}</button><a class="chip-btn" href="index.html" target="_blank" style="text-decoration:none">👁️</a><button class="chip-btn" id="outBtn">خروج</button></div>
      <div class="tabs">${TABS.filter(([k]) => A.me.role !== "accountant" || ["orders", "accounts", "reports"].includes(k)).map(([k, l]) => `<button class="${A.tab === k ? "on" : ""}" data-tab="${k}">${l}${k === "orders" && newCount() ? ` (${newCount()})` : ""}</button>`).join("")}</div></div></header>
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
    const lowN = A.products.filter((p) => p.stock != null && num(p.stock) <= num(p.low_stock)).length;
    const lateC = custList().map(custCollect).filter((c) => c.late > 0 && !c.archived), sd = supDueList(), ts = num(A.settings.target_sales), mF = ts ? figs((d) => inMonth(d, monthKey(new Date()))) : null;
    return `${sd.map((x) => `<div class="notice" data-supstmt="${x.id}" style="cursor:pointer;background:#fef3c7">🚚 ${x.when} ميعاد دفع ${esc(x.name)} – عليك ${money(x.bal)}</div>`).join("")}${ts ? `<div class="card" style="padding:10px" data-gomsub="plan"><div class="line"><b>🎯 هدف الشهر</b><span>${money(mF.sales)} / ${money(ts)}</span></div><div style="height:8px;background:#e2e8f0;border-radius:8px"><div style="height:8px;width:${Math.min(100, Math.round((mF.sales / ts) * 100))}%;background:#0ea5e9;border-radius:8px"></div></div></div>` : ""}${lateC.length ? `<div class="notice" data-gocollect style="cursor:pointer;background:#fee2e2;border-color:#fecaca">⏰ فيه ${lateC.length} زبون متأخر في الدفع، عليهم ${money(lateC.reduce((a, c) => a + c.bal, 0))} – اضغط للتحصيل</div>` : ""}${lowN ? `<div class="notice" data-asub="stock" style="cursor:pointer">📦 فيه ${lowN} منتج قرب يخلص أو خلص – اضغط للمخزون</div>` : ""}<div class="h2">نظرة عامة</div><div class="stats">
      <div class="stat"><span class="mut">طلبات اليوم</span><b>${today.length}</b></div><div class="stat"><span class="mut">مبيعات اليوم</span><b>${money(rev)}</b></div>
      <div class="stat"><span class="mut">طلبات جديدة</span><b style="color:${STATUS.new.c}">${newCount()}</b></div><div class="stat"><span class="mut">طلبات جارية</span><b>${active.length}</b></div>${(() => { const r = A.orders.filter((o) => o.rating); return r.length ? `<div class="stat"><span class="mut">تقييم الزباين (${r.length})</span><b style="color:#d97706">⭐ ${(r.reduce((a, o) => a + o.rating, 0) / r.length).toFixed(1)}</b></div>` : ""; })()}</div>
      <div class="h2">إجراءات سريعة</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn tq" data-newprod>+ منتج جديد</button><button class="btn" data-tab="orders">إدارة الطلبات</button><button class="btn ghost" data-storeopen>${A.settings.store_open ? "⛔ إغلاق المتجر مؤقتاً" : "✅ فتح المتجر"}</button></div>
      <div class="h2">آخر الطلبات</div>${A.orders.slice(0, 5).map(orderCard).join("") || '<p class="mut">لا توجد طلبات بعد.</p>'}`;
  }

  // ---------- الطلبات ----------
  function mapLink(o) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`الكويت ${o.area} قطعة ${o.block || ""} شارع ${o.street || ""} ${o.avenue ? "جادة " + o.avenue : ""} منزل ${o.house || ""}`); }
  function orderCard(o) {
    const s = STATUS[o.status] || STATUS.new;
    return `<div class="ord" style="border-color:${s.c}"><div class="hd"><b>#${o.order_no} · ${esc(o.customer_name)}</b><span class="st" style="background:${s.c}">${s.ar}</span></div>
      <div class="mut">${fmtDate(o.created_at)} · ${PAY[o.payment] || PAY.cash}</div>${o.slot ? `<div style="margin-top:4px"><span class="pill" style="background:#e0f2fe;color:#075985;font-size:13px">⏰ ${esc(o.slot)}</span></div>` : ""}
      <div style="margin-top:6px">📍 ${esc(o.area)} – ق${esc(o.block)} – ش${esc(o.street)}${o.avenue ? " – ج" + esc(o.avenue) : ""} – م${esc(o.house)}${o.floor_apt ? " – " + esc(o.floor_apt) : ""}</div>
      <div style="margin-top:6px">${(o.items || []).map((i) => `<div>• ${esc(i.name_ar)} ×${i.qty}${(i.opts || []).length ? ` <span class="mut" style="font-size:12px">(${i.opts.map((x) => esc(x.c)).join("، ")})</span>` : ""}</div>`).join("")}</div>
      ${o.notes ? `<div class="notice">📝 ${esc(o.notes)}</div>` : ""}
      ${Number(o.discount) ? `<div class="line" style="color:#16a34a;font-size:14px"><span>🎟️ خصم ${esc(o.coupon_code || "")}</span><span>−${money(o.discount)}</span></div>` : ""}
      ${(o.fees || []).map((f) => `<div class="line" style="font-size:14px"><span>${esc(f.name_ar)} (${Number(f.qty)} × ${money(f.price)})</span><span>${money(f.amount)}</span></div>`).join("")}
      ${Number(o.points_disc) ? `<div class="line" style="color:#16a34a;font-size:14px"><span>⭐ خصم نقاط (${o.points_used} نقطة)</span><span>−${money(o.points_disc)}</span></div>` : ""}
      <div class="line total" style="font-size:15px"><span>الإجمالي (شامل التوصيل ${money(o.delivery_fee)}${Number(o.fees_total) ? " والرسوم " + money(o.fees_total) : ""})</span><span>${money(o.total)}</span></div>
      ${o.proof_url ? `<details style="margin-top:6px"><summary class="mut">📸 صورة التسليم</summary><img src="${esc(o.proof_url)}" alt="" style="width:100%;max-height:300px;object-fit:cover;border-radius:12px;margin-top:6px"></details>` : ""}
      ${o.rating ? `<div class="notice" style="background:#fffbeb;border-color:#fde68a">${"⭐".repeat(o.rating)}${"☆".repeat(5 - o.rating)} تقييم الزبون${o.rating_note ? ` – «${esc(o.rating_note)}»` : ""}</div>` : ""}
      <div class="row2" style="margin-top:6px"><select class="in" data-ostatus="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select>
        ${(() => { const c = custC(normPh(o.phone)); return c.bal > 0.0005 ? `<div class="notice" style="grid-column:1/-1;margin:0;${c.over || c.late ? "background:#fee2e2;border-color:#fecaca" : ""}">${c.over ? "⛔ عدّى حد الآجل – " : c.late ? "⏰ متأخر في الدفع – " : "📝 "}عليه آجل ${money(c.bal)}${c.lim ? ` من حد ${money(c.lim)}` : ""}</div>` : c.bal < -0.0005 ? `<div class="notice" style="grid-column:1/-1;margin:0;background:#dcfce7;border-color:#bbf7d0">💳 ليه رصيد مقدّم ${money(-c.bal)}</div>` : ""; })()}
        <select class="in" data-opay="${o.id}">${Object.entries(PAY).map(([k, v]) => `<option value="${k}" ${(o.payment || "cash") === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <select class="in" data-odriver="${o.id}"><option value="">🛵 بدون مندوب</option>${drivers().map((d) => `<option value="${d.id}" ${o.driver_id === d.id ? "selected" : ""}>${esc(d.full_name)}</option>`).join("")}</select></div>
      <div class="acts"><a class="btn sm ghost" href="tel:+${esc(o.phone)}">📞 اتصال</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}">💬 واتساب</a><a class="btn sm ghost" target="_blank" rel="noopener" href="${mapLink(o)}">🗺️ الخريطة</a><button class="btn sm ghost" data-oinv="${o.id}">🧾 فاتورة</button><button class="btn sm ghost" data-osplit="${o.id}">➗ ${o.pay_split ? "الدفع مقسوم" : "تقسيم الدفع"}</button>
        ${o.status === "new" ? `<button class="btn sm green" data-quick="${o.id}:confirmed">✓ تأكيد</button>` : ""}${o.driver_id ? `<span class="pill">المندوب: ${esc(pname(o.driver_id))}</span>` : ""}<button class="btn sm ghost" data-delorder="${o.id}" style="margin-inline-start:auto">🗑️ حذف</button></div></div>`;
  }
  function orders() {
    const F = [["active", "الجارية"], ["new", "جديد"], ["out_for_delivery", "في الطريق"], ["delivered", "تم التوصيل"], ["cancelled", "ملغي"], ["all", "الكل"]];
    let list = A.orders;
    if (A.ofilter === "active") list = list.filter((o) => !["delivered", "cancelled"].includes(o.status));
    else if (A.ofilter !== "all") list = list.filter((o) => o.status === A.ofilter);
    return `<div class="filters">${F.map(([k, l]) => `<button class="${A.ofilter === k ? "on" : ""}" data-of="${k}">${l}</button>`).join("")}</div>
      ${list.map(orderCard).join("") || '<p class="mut">لا توجد طلبات هنا.</p>'}
      ${A.orders.length ? `<div style="text-align:center;margin:24px 0"><button class="btn red sm" data-delallorders>🗑️ مسح كل الطلبات (${A.orders.length})</button></div>` : ""}`;
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
        <div><span class="price">${money(p.price)}</span>${p.old_price ? `<span class="old">${money(p.old_price)}</span>` : ""}${!p.active ? '<span class="pill r">مخفي</span>' : ""}${p.featured ? '<span class="pill g">عرض</span>' : ""}${p.sale_type === "wholesale" ? '<span class="pill">📦 جملة</span>' : ""}</div></div>
        <label class="mut" style="display:flex;flex-direction:column;align-items:center;font-size:11px"><input type="checkbox" data-stock="${p.id}" ${p.in_stock ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--tq)">متوفر</label>
        <button class="btn sm ghost" data-editprod="${p.id}">✏️</button></div>`).join("")}</div>`;
  }
  // ---------- الأقسام والبنرات ----------
  function cats() {
    return `<div class="h2">الأقسام <button class="btn tq sm" data-editcat="">+ قسم</button></div><div class="list">${A.cats.map((c) => `<div class="it"><img src="${esc(c.image || "")}" alt=""><div class="t"><b>${esc(c.name_ar)}</b><span class="mut">${esc(c.name_en || "")} · ${A.products.filter((p) => p.category_id === c.id).length} منتج</span>${!c.active ? '<span class="pill r">مخفي</span>' : ""}</div><button class="btn sm ghost" data-editcat="${c.id}">✏️</button></div>`).join("")}</div>`;
  }
  // ---------- الكوبونات ----------
  const CK = { percent: "نسبة %", fixed: "مبلغ ثابت", free_delivery: "توصيل مجاني" };
  function cpState(c) { const n = Date.now(); if (!c.active) return ["⏸️ موقوف", "#94a3b8"]; if (c.ends_at && n > new Date(c.ends_at)) return ["⌛ انتهى", "#94a3b8"]; if (c.starts_at && n < new Date(c.starts_at)) return ["🕒 لسه مبدأش", "#d97706"]; if (c.max_uses != null && c.uses >= c.max_uses) return ["✅ خلص", "#94a3b8"]; return ["🟢 شغال", "#16a34a"]; }
  function coupons() {
    if (A.cps === null) return `<div class="notice">الكوبونات محتاجة تحديث قاعدة البيانات (extras.sql).</div>`;
    const list = A.cps || [], used = A.orders.filter((o) => o.coupon_code && o.status !== "cancelled");
    return `<div class="stats"><div class="stat"><span class="mut">كوبونات شغالة</span><b>${list.filter((c) => cpState(c)[0].includes("شغال")).length}</b></div><div class="stat"><span class="mut">طلبات بكوبون</span><b>${used.length}</b></div><div class="stat"><span class="mut">إجمالي الخصومات</span><b style="color:#dc2626">${money(used.reduce((a, o) => a + num(o.discount), 0))}</b></div><div class="stat"><span class="mut">مبيعات بكوبونات</span><b style="color:#16a34a">${money(used.reduce((a, o) => a + num(o.total), 0))}</b></div></div>
      <button class="btn tq block" data-cpnew style="margin:10px 0">🎟️ + كوبون جديد</button>
      ${list.length ? list.map((c) => { const [st, col] = cpState(c), ords = used.filter((o) => o.coupon_code === c.code); return `<div class="it" style="background:#fff;border-radius:14px;padding:12px;margin:8px 0;display:block;border-inline-start:5px solid ${col}">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px;letter-spacing:1px;direction:ltr">${esc(c.code)}</b><span class="pill" style="background:${col};color:#fff">${st}</span></div>
        <div style="margin:6px 0">${c.kind === "percent" ? `خصم <b>${num(c.value)}%</b>${c.max_discount ? ` (أقصى ${money(c.max_discount)})` : ""}` : c.kind === "fixed" ? `خصم <b>${money(c.value)}</b>` : "<b>توصيل مجاني</b>"}${num(c.min_order) ? ` · لطلبات فوق ${money(c.min_order)}` : ""}</div>
        <div class="mut" style="font-size:13px">استُخدم ${c.uses || 0}${c.max_uses != null ? ` من ${c.max_uses}` : ""} مرة · ${c.once_per_phone ? "مرة واحدة لكل رقم" : "مفتوح لنفس الرقم"}${c.ends_at ? ` · ينتهي ${fmtDate(c.ends_at)}` : ""} · خصومات ${money(ords.reduce((a, o) => a + num(o.discount), 0))}</div>
        ${c.note ? `<div class="mut" style="font-size:13px">📝 ${esc(c.note)}</div>` : ""}
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm ghost" data-cpedit="${esc(c.code)}">✏️ تعديل</button><button class="btn sm ghost" data-cptog="${esc(c.code)}">${c.active ? "⏸️ إيقاف" : "▶️ تشغيل"}</button><button class="btn sm ghost" data-cpshare="${esc(c.code)}">📣 ابعته للزباين</button></div></div>`; }).join("") : '<p class="mut">لسه مفيش كوبونات. اعمل كود زي GOTEN10 يدّي خصم 10%.</p>'}`;
  }
  function cpSheet(code) {
    const c = code ? (A.cps || []).find((x) => x.code === code) : { kind: "percent", value: 10, min_order: 0, once_per_phone: true, active: true };
    const dv = (x) => (x ? new Date(x).toISOString().slice(0, 10) : "");
    sheet(`<h3>${code ? "✏️ تعديل كوبون" : "🎟️ كوبون جديد"}</h3>
      <label class="f"><span>الكود *</span><input class="in" id="cp_code" dir="ltr" style="text-transform:uppercase;font-weight:800;letter-spacing:1px" value="${esc(c.code || "")}" ${code ? "readonly" : ""} placeholder="GOTEN10"></label>
      <label class="f"><span>نوع الخصم</span><select class="in" id="cp_kind">${Object.entries(CK).map(([k, l]) => `<option value="${k}" ${c.kind === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <div class="row2"><label class="f" id="cp_vw"><span id="cp_vl">القيمة</span><input class="in" id="cp_value" type="number" step="0.005" min="0" inputmode="decimal" value="${c.value ?? ""}"></label><label class="f" id="cp_mw"><span>أقصى خصم (د.ك)</span><input class="in" id="cp_max" type="number" step="0.005" min="0" inputmode="decimal" value="${c.max_discount ?? ""}" placeholder="بدون حد"></label></div>
      <div class="row2"><label class="f"><span>أقل طلب (د.ك)</span><input class="in" id="cp_min" type="number" step="0.005" min="0" inputmode="decimal" value="${c.min_order ?? 0}"></label><label class="f"><span>عدد الاستخدامات الكلي</span><input class="in" id="cp_uses" type="number" min="1" inputmode="numeric" value="${c.max_uses ?? ""}" placeholder="مفتوح"></label></div>
      <div class="row2"><label class="f"><span>يبدأ من</span><input class="in" id="cp_start" type="date" value="${dv(c.starts_at)}"></label><label class="f"><span>ينتهي في</span><input class="in" id="cp_end" type="date" value="${dv(c.ends_at)}"></label></div>
      <label class="switch"><span>مرة واحدة بس لكل رقم موبايل</span><input type="checkbox" id="cp_once" ${c.once_per_phone ? "checked" : ""}></label>
      <label class="switch"><span>شغال</span><input type="checkbox" id="cp_active" ${c.active ? "checked" : ""}></label>
      <label class="f"><span>ملاحظة لنفسك</span><input class="in" id="cp_note" value="${esc(c.note || "")}" placeholder="مثال: عرض رمضان"></label>
      <button class="btn tq block" id="cpSave">💾 حفظ</button>${code ? `<button class="btn red block" style="margin-top:8px" id="cpDel">🗑️ حذف</button>` : ""}`, () => {
      const sync = () => { const k = $("cp_kind").value; $("cp_vw").style.display = k === "free_delivery" ? "none" : ""; $("cp_mw").style.display = k === "percent" ? "" : "none"; $("cp_vl").textContent = k === "percent" ? "النسبة %" : "المبلغ (د.ك)"; };
      $("cp_kind").onchange = sync; sync();
      $("cpSave").onclick = async () => {
        const v = (id) => $(id).value.trim(), kind = v("cp_kind");
        const row = { code: v("cp_code").toUpperCase().replace(/\s/g, ""), kind, value: kind === "free_delivery" ? 0 : num(v("cp_value")), max_discount: kind === "percent" && v("cp_max") ? num(v("cp_max")) : null, min_order: num(v("cp_min")), max_uses: v("cp_uses") ? parseInt(v("cp_uses")) : null,
          starts_at: v("cp_start") ? new Date(v("cp_start") + "T00:00:00").toISOString() : null, ends_at: v("cp_end") ? new Date(v("cp_end") + "T23:59:59").toISOString() : null, once_per_phone: $("cp_once").checked, active: $("cp_active").checked, note: v("cp_note") || null };
        if (!/^[A-Z0-9_-]{2,30}$/.test(row.code)) return toast("الكود حروف إنجليزي وأرقام بس (من 2 لـ 30)", "err");
        if (kind === "percent" && !(row.value > 0 && row.value <= 100)) return toast("النسبة من 1 لـ 100", "err");
        if (kind === "fixed" && !(row.value > 0)) return toast("اكتب مبلغ الخصم", "err");
        try { $("cpSave").disabled = true; await Store.saveCoupon(row, !code); closeSheet(); toast("اتحفظ ✓"); await refresh(); }
        catch (e) { $("cpSave").disabled = false; toast(/duplicate/i.test(e.message) ? "الكود ده موجود قبل كده" : e.message, "err"); }
      };
      const dl = $("cpDel"); if (dl) dl.onclick = async () => { if (!(await UI.ask("حذف الكوبون؟ (الطلبات القديمة مش هتتأثر)"))) return; await Store.deleteCoupon(code); closeSheet(); toast("اتحذف"); await refresh(); };
    });
  }
  function banners() {
    return `<div class="h2">البنرات الإعلانية <button class="btn tq sm" data-editban="">+ بنر</button></div><p class="mut">المقاس المثالي: عرض ضعف الارتفاع (مثلاً 1200×600).</p>
      <div class="list">${A.banners.map((b) => `<div class="it"><img src="${esc(b.image)}" alt="" style="width:110px;height:55px"><div class="t"><b>${esc(b.title || "بدون عنوان")}</b>${!b.active ? '<span class="pill r">مخفي</span>' : ""}</div><button class="btn sm ghost" data-editban="${b.id}">✏️</button></div>`).join("")}</div>`;
  }
  // ---------- الحسابات ----------
  const PAY = { cash: "💵 كاش", knet_on_delivery: "💳 كي نت", credit: "📝 آجل" };
  const KINDS = { salary: "👷 راتب", advance: "💸 سلفة", drawing: "💼 سحب شخصي", transfer: "🔄 تحويل بين الخزن", sale: "🧾 مبيعات خارج التطبيق", purchase: "🛒 مشتريات", expense: "💸 مصروف", income: "💰 إيراد آخر", driver_settle: "🛵 استلام من مندوب", receivable: "📝 آجل يدوي", receivable_paid: "✅ سداد آجل", supplier_paid: "💳 سداد مورد" };
  const EXP_CATS = ["بنزين ومواصلات", "رواتب", "إيجار", "كهرباء وماء", "تغليف وثلج", "صيانة", "إعلانات", "أخرى"];
  const PERIODS = [["today", "اليوم"], ["week", "الأسبوع"], ["month", "الشهر"], ["lastmonth", "الشهر اللي فات"], ["all", "الكل"]];
  const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  function inPeriod(d) {
    if (A.period === "all") return true;
    const x = new Date(d), n = new Date();
    if (A.period === "today") return x.toDateString() === n.toDateString();
    if (A.period === "week") return n - x <= 7 * 864e5 && x <= n;
    if (A.period === "month") return x.getMonth() === n.getMonth() && x.getFullYear() === n.getFullYear();
    if (A.period === "lastmonth") { const l = new Date(n.getFullYear(), n.getMonth() - 1, 1); return x.getMonth() === l.getMonth() && x.getFullYear() === l.getFullYear(); }
    return true;
  }
  const sum = (arr, f) => arr.reduce((s, x) => s + num(f ? f(x) : x.amount), 0);
  function driverCash() {
    return drivers().map((d) => {
      const w = dCash(d.id);
      return { d, got: w.ordCash + w.collect, paid: w.hand + w.exp, bal: w.cashWith };
    });
  }
  function receivables() {
    const m = new Map();
    const add = (phone, name, v) => { const r = m.get(phone) || { phone, name, bal: 0 }; r.bal += v; if (name) r.name = name; m.set(phone, r); };
    A.orders.filter((o) => o.payment === "credit" && o.status !== "cancelled").forEach((o) => add(o.phone, o.customer_name, o.pay_split ? num(o.pay_split.credit) : num(o.total)));
    A.tx.filter((t) => t.kind === "sale" && t.category === "credit" && t.party).forEach((t) => add(t.party, t.party_name, num(t.amount)));
    A.tx.filter((t) => t.kind === "receivable").forEach((t) => add(t.party, t.party_name, num(t.amount)));
    A.tx.filter((t) => t.kind === "receivable_paid").forEach((t) => add(t.party, t.party_name, -num(t.amount)));
    return [...m.values()].filter((r) => Math.abs(r.bal) > 0.0005).sort((a, b) => b.bal - a.bal);
  }
  const subTabs = () => `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:10px 0 4px">${[["money", "💰 الحسابات"], ["collect", "🤝 التحصيل"], ["stock", "📦 المخزون"], ["sups", "🚚 الموردين"], ["custs", "👥 العملاء"]].map(([k, l]) => `<button style="background:${(A.asub || "money") === k ? "var(--tq)" : "#e2e8f0"};color:${(A.asub || "money") === k ? "#fff" : "#334155"};font-size:13px;padding:9px 2px;border:0;border-radius:12px;font-weight:700;cursor:pointer;white-space:nowrap" data-asub="${k}">${l}</button>`).join("")}</div>`;
  // =================== 💰 التحصيل ===================
  const DAY = 864e5, ageD = (d) => Math.floor((Date.now() - new Date(d)) / DAY);
  const metaOf = (ph) => (A.cmeta || []).find((m) => m.phone === ph) || {};
  const termsOf = (ph) => { const m = metaOf(ph); return m.terms_days != null ? +m.terms_days : A.settings.default_terms_days != null ? +A.settings.default_terms_days : 30; };
  // تحليل حساب العميل: أقدم مبلغ مش متسدد (الأقدم بيتسدد الأول)، متوسط أيام السداد، التقييم
  function custCollect(c) {
    const lines = [...c.lines].filter((r) => r.a).sort((x, y) => new Date(x.d) - new Date(y.d));
    const q = [], delays = []; let lastPay = null;
    lines.forEach((r) => {
      if (r.a > 0) q.push({ d: r.d, left: r.a });
      else { let pay = -r.a; lastPay = r.d; while (pay > 0.0005 && q.length) { const h = q[0], u = Math.min(h.left, pay); h.left -= u; pay -= u; if (h.left <= 0.0005) { delays.push(Math.max(0, (new Date(r.d) - new Date(h.d)) / DAY)); q.shift(); } } }
    });
    const oldest = q.find((h) => h.left > 0.0005), terms = termsOf(c.phone), m = metaOf(c.phone);
    const age = oldest ? ageD(oldest.d) : 0, due = oldest ? new Date(new Date(oldest.d).getTime() + terms * DAY) : null, late = oldest ? Math.max(0, age - terms) : 0;
    const avg = delays.length ? delays.reduce((a, x) => a + x, 0) / delays.length : null;
    const rate = c.bal <= 0.0005 ? (avg == null || avg <= terms ? "g" : "y") : late > 0 ? "r" : avg != null && avg > terms ? "y" : age > terms / 2 ? "y" : "g";
    const lim = m.credit_limit != null && m.credit_limit !== "" ? +m.credit_limit : null;
    return { ...c, terms, age, due, late, avg, rate, lim, over: lim != null && c.bal > lim + 0.0005, lastPay, archived: !!m.archived, lastAct: lines.length ? lines[lines.length - 1].d : null, note: m.note || "" };
  }
  const RATE = { g: ["🟢", "بيدفع في ميعاده"], y: ["🟡", "ساعات بيتأخر"], r: ["🔴", "متأخر"] };
  const custC = (ph) => { const c = custList().find((x) => x.phone === ph) || { phone: ph, name: "", ...custLedger(ph) }; return custCollect(c); };
  // تقسيم دفع الطلب
  const splitOf = (o) => { const s = o.pay_split; if (s && (num(s.cash) || num(s.knet) || num(s.credit))) return { cash: num(s.cash), knet: num(s.knet), credit: num(s.credit) }; const p = o.payment || "cash", t = num(o.total); return { cash: p === "cash" ? t : 0, knet: p === "knet_on_delivery" ? t : 0, credit: p === "credit" ? t : 0 }; };
  // محفظة المندوب الكاملة
  function dCash(id) {
    const del = A.orders.filter((o) => o.driver_id === id && o.status === "delivered"), mv = (A.dmoves || []).filter((m) => m.driver_id === id), s = (k) => mv.filter((m) => m.kind === k).reduce((a, m) => a + num(m.amount), 0);
    const ordCash = del.reduce((a, o) => a + splitOf(o).cash, 0), oldSettle = sum(A.tx.filter((t) => t.kind === "driver_settle" && t.party === id));
    const cashWith = ordCash + s("collect") - s("handover") - s("expense") - oldSettle;
    return { del, mv, ordCash, collect: s("collect"), hand: s("handover") + oldSettle, exp: s("expense"), comm: s("commission"), cashWith, earn: del.reduce((a, o) => a + num(o.driver_earning), 0) + s("commission"), paid: s("payout") };
  }
  const cTabs = () => { const lim = A.me.role === "accountant"; return `<div class="filters" style="margin-top:6px">${[["day", "📅 اليوم"], ["late", "⏰ المتأخرين"], ["drv", "🛵 المناديب"], ["rep", "📊 التقارير"], ...(lim ? [] : [["log", "📜 السجل"], ["cset", "⚙️ إعدادات"]])].map(([k, l]) => `<button class="${(A.csub || "day") === k ? "on" : ""}" data-csub="${k}">${l}</button>`).join("")}</div>`; };
  function collectPage() {
    const v = A.csub || "day";
    return cTabs() + (v === "late" ? latePage() : v === "drv" ? drvPage() : v === "rep" ? repPage() : v === "log" ? logPage() : v === "cset" ? csetPage() : dayPage());
  }
  // ---- 📅 التحصيل اليومي + الدُرج + الكي نت ----
  function dayFig(day) {
    const on = (d) => d && dayKey(d) === day, F = { oCash: 0, oKnet: 0, oCredit: 0, sCash: 0, sKnet: 0, sCredit: 0, rCash: 0, rKnet: 0, rDrv: 0, hand: 0, exp: 0, inc: 0, topup: 0 };
    A.orders.filter((o) => o.status === "delivered" && on(o.delivered_at || o.updated_at || o.created_at)).forEach((o) => { const s = splitOf(o); F.oCash += s.cash; F.oKnet += s.knet; F.oCredit += s.credit; });
    A.orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered" && o.payment === "credit" && on(o.created_at)).forEach((o) => { F.oCredit += num(o.total); });
    A.tx.filter((t) => on(t.date || t.created_at)).forEach((t) => {
      const a = num(t.amount);
      if (t.kind === "sale") { if (t.category === "credit") F.sCredit += a; else if (t.category === "knet_on_delivery") F.sKnet += a; else F.sCash += a; }
      else if (t.kind === "receivable_paid" && t.category !== "discount") { if (t.collected_by) F.rDrv += a; else if (t.method === "knet") F.rKnet += a; else F.rCash += a; if (t.category === "topup") F.topup += a; }
      else if (t.kind === "receivable") F.sCredit += a;
      else if (t.kind === "driver_settle") F.hand += a; else if (t.kind === "expense") F.exp += a; else if (t.kind === "income") F.inc += a;
    });
    (A.dmoves || []).filter((m) => m.kind === "handover" && on(m.created_at)).forEach((m) => { F.hand += num(m.amount); });
    F.cashIn = F.sCash + F.rCash + F.hand + F.inc; F.expCash = F.cashIn - F.exp; F.knet = F.oKnet + F.sKnet + F.rKnet; F.credit = F.oCredit + F.sCredit; F.collected = F.rCash + F.rKnet + F.rDrv;
    return F;
  }
  function dayPage() {
    const day = A.cday || dayKey(new Date()), F = dayFig(day), cl = (A.dcloses || []).find((x) => x.day === day);
    const L = (l, v, c) => `<div class="line"><span>${l}</span><b${c ? ` style="color:${c}"` : ""}>${money(v)}</b></div>`;
    const diff = (a, b) => { const d = num(a) - num(b); return Math.abs(d) < 0.0005 ? '<b style="color:#16a34a">✓ مظبوط</b>' : d > 0 ? `<b style="color:#16a34a">زيادة ${money(d)}</b>` : `<b style="color:#dc2626">عجز ${money(-d)}</b>`; };
    return `<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><input class="in" type="date" id="cDay" value="${day}" style="max-width:190px"><button class="btn sm ghost" data-cday="${dayKey(new Date())}">النهارده</button><button class="btn sm ghost" data-cday="${dayKey(Date.now() - DAY)}">إمبارح</button></div>
      <div class="stats"><div class="stat"><span class="mut">💵 كاش دخل الدُرج</span><b style="color:#16a34a">${money(F.cashIn)}</b></div><div class="stat"><span class="mut">💳 كي نت</span><b>${money(F.knet)}</b></div><div class="stat"><span class="mut">📝 آجل جديد</span><b style="color:#b45309">${money(F.credit)}</b></div><div class="stat"><span class="mut">✅ اتحصّل من الآجل</span><b style="color:#16a34a">${money(F.collected)}</b></div></div>
      <div class="card"><b>💵 الكاش</b>${L("مبيعات كاش في المحل", F.sCash)}${L("سداد آجل كاش", F.rCash)}${L("استلمته من المناديب", F.hand)}${F.inc ? L("إيرادات تانية", F.inc) : ""}${L("− مصاريف اتدفعت", F.exp, "#dc2626")}<div class="line total"><span>المفروض في الدُرج</span><span>${money(F.expCash)}</span></div>
        <p class="mut" style="font-size:12px;margin:4px 0 0">كاش الطلبات اللي مع المناديب (${money(F.oCash)}) بيدخل الدُرج لما تستلمه منهم.</p></div>
      <div class="card"><b>💳 الكي نت</b>${L("طلبات كي نت", F.oKnet)}${L("مبيعات كي نت", F.sKnet)}${L("سداد آجل كي نت", F.rKnet)}<div class="line total"><span>المفروض ينزل البنك</span><span>${money(F.knet)}</span></div></div>
      ${cl ? `<div class="card" style="border:2px solid #16a34a"><b>🔒 اليوم ده متقفل</b><div class="line"><span>المفروض في الدُرج</span><b>${money(cl.expected_cash)}</b></div><div class="line"><span>عدّيت</span><b>${money(cl.counted_cash)}</b></div><div class="line"><span>النتيجة</span>${diff(cl.counted_cash, cl.expected_cash)}</div>
        ${cl.bank_knet != null ? `<div class="line"><span>كي نت نزل البنك</span><b>${money(cl.bank_knet)}</b></div><div class="line"><span>مطابقة الكي نت</span>${diff(cl.bank_knet, cl.expected_knet)}</div>` : ""}${cl.note ? `<p class="mut">📝 ${esc(cl.note)}</p>` : ""}<button class="btn sm ghost" data-dclose="${day}">✏️ تعديل الإقفال</button></div>`
        : `<button class="btn tq block" data-dclose="${day}">🔒 إقفال اليوم (عدّ الدُرج + مطابقة الكي نت)</button>`}`;
  }
  function closeSheet2(day) {
    const F = dayFig(day), cl = (A.dcloses || []).find((x) => x.day === day) || {};
    sheet(`<h3>🔒 إقفال يوم ${day}</h3>
      <div class="line"><span>المفروض في الدُرج</span><b>${money(F.expCash)}</b></div>
      <label class="f"><span>💵 عدّيت كام كاش في الدُرج؟</span><input class="in" id="dcC" type="number" step="0.005" inputmode="decimal" value="${cl.counted_cash != null ? num(cl.counted_cash).toFixed(3) : ""}"></label><div id="dcD" class="mut"></div>
      <div class="line" style="margin-top:8px"><span>الكي نت المفروض</span><b>${money(F.knet)}</b></div>
      <label class="f"><span>💳 الكي نت اللي نزل البنك (اختياري)</span><input class="in" id="dcK" type="number" step="0.005" inputmode="decimal" value="${cl.bank_knet != null ? num(cl.bank_knet).toFixed(3) : ""}"></label>
      <label class="f"><span>ملاحظة</span><input class="in" id="dcN" value="${esc(cl.note || "")}" placeholder="مثال: العجز بسبب فكة"></label>
      <button class="btn tq block" id="dcS">🔒 إقفال اليوم</button>`, () => {
      const upd = () => { const v = $("dcC").value; if (v === "") return ($("dcD").textContent = ""); const d = num(v) - F.expCash; $("dcD").innerHTML = Math.abs(d) < 0.0005 ? "✓ مظبوط" : d > 0 ? `<b style="color:#16a34a">زيادة ${money(d)}</b>` : `<b style="color:#dc2626">عجز ${money(-d)}</b>`; };
      $("dcC").oninput = upd; upd();
      $("dcS").onclick = async () => { if ($("dcC").value === "") return toast("اكتب الكاش اللي عدّيته", "err"); $("dcS").disabled = true;
        try { await Store.saveDayClose({ day, expected_cash: +F.expCash.toFixed(3), counted_cash: num($("dcC").value), expected_knet: +F.knet.toFixed(3), bank_knet: $("dcK").value === "" ? null : num($("dcK").value), note: $("dcN").value.trim() || null }); closeSheet(); toast("اتقفل اليوم ✓"); await refresh(); }
        catch (e) { $("dcS").disabled = false; toast(e.message, "err"); } };
    });
  }
  // ---- ⏰ المتأخرين + حد الآجل + الأرشيف ----
  function latePage() {
    const all = custList().map(custCollect), arch = !!A.carch, q = (A.clq || "").trim();
    const isArch = (c) => c.archived || (c.bal <= 0.0005 && (!c.lastAct || ageD(c.lastAct) > 30));
    const list = all.filter((c) => (arch ? isArch(c) : !isArch(c) && c.bal > 0.0005) && (!q || (c.name + c.phone).includes(q))).sort((a, b) => b.late - a.late || b.bal - a.bal);
    const lateN = all.filter((c) => c.late > 0 && !c.archived), owe = all.reduce((a, c) => a + Math.max(0, c.bal), 0), wallet = all.reduce((a, c) => a + Math.max(0, -c.bal), 0);
    return `<div class="stats"><div class="stat"><span class="mut">برّه عند الزباين</span><b style="color:#dc2626">${money(owe)}</b></div><div class="stat"><span class="mut">متأخرين</span><b style="color:#dc2626">${lateN.length} · ${money(lateN.reduce((a, c) => a + c.bal, 0))}</b></div><div class="stat"><span class="mut">رصيد مقدّم للزباين</span><b style="color:#16a34a">${money(wallet)}</b></div><div class="stat"><span class="mut">عدّوا الحد</span><b>${all.filter((c) => c.over).length}</b></div></div>
      <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><input class="in" id="clq" placeholder="🔍 دوّر باسم أو رقم" value="${esc(q)}" style="flex:1;min-width:150px"><button class="btn sm ${arch ? "tq" : "ghost"}" data-carch>📁 ${arch ? "رجوع للنشطين" : "الأرشيف"}</button><button class="btn sm" style="background:#be185d" data-newcust>👥 + عميل</button></div>
      ${list.length ? list.map(lateCard).join("") : `<div class="empty"><div class="e">${arch ? "📁" : "🎉"}</div>${arch ? "الأرشيف فاضي" : "مفيش حد عليه فلوس"}</div>`}`;
  }
  function lateCard(c) {
    const [dot, rl] = RATE[c.rate], pct = c.lim ? Math.min(100, Math.round((Math.max(0, c.bal) / c.lim) * 100)) : 0;
    return `<div class="card" style="${c.late > 0 ? "border-inline-start:4px solid #dc2626" : ""}"><div class="line"><b>${dot} ${esc(c.name || "عميل")}</b><b style="color:${c.bal > 0.0005 ? "#dc2626" : "#16a34a"}">${c.bal < -0.0005 ? "رصيد " : ""}${money(Math.abs(c.bal))}</b></div>
      <div class="mut" style="font-size:13px"><a href="tel:+${esc(c.phone)}">${esc(c.phone)}</a> · ${rl}${c.bal > 0.0005 ? ` · ${c.late > 0 ? `<b style="color:#dc2626">متأخر ${c.late} يوم</b>` : `يستحق ${c.due ? fmtDay(c.due) : ""}`}` : ""}${c.lastPay ? ` · آخر دفعة ${fmtDay(c.lastPay)}` : ""}${c.avg != null ? ` · بيسدد في ${Math.round(c.avg)} يوم في المتوسط` : ""}</div>
      ${c.lim ? `<div style="margin:6px 0"><div style="height:6px;background:#e2e8f0;border-radius:6px"><div style="height:6px;width:${pct}%;background:${c.over ? "#dc2626" : pct > 80 ? "#f59e0b" : "#16a34a"};border-radius:6px"></div></div><small class="mut">الحد ${money(c.lim)}${c.over ? ' – <b style="color:#dc2626">عدّى الحد</b>' : ""}</small></div>` : ""}
      ${c.note ? `<div class="mut" style="font-size:12px">📝 ${esc(c.note)}</div>` : ""}
      <div class="acts" style="margin-top:6px">${c.bal > 0.0005 ? `<a class="btn sm" style="background:#16a34a;color:#fff;text-decoration:none" target="_blank" rel="noopener" href="${remindLink(c)}">💬 تذكير</a>` : ""}<button class="btn sm green" data-cpay="${esc(c.phone)}">${c.bal > 0.0005 ? "✅ سداد" : "💳 شحن رصيد"}</button><button class="btn sm ghost" data-cstmt="${esc(c.phone)}">📒 كشف</button><button class="btn sm ghost" data-cmeta="${esc(c.phone)}">⚙️</button></div></div>`;
  }
  const fmtDay = (d) => new Date(d).toLocaleDateString("ar-KW", { day: "numeric", month: "short" });
  function remindLink(c) {
    const st = A.settings, t = `السلام عليكم ${c.name || ""} 👋\nتذكير ودي من ${st.store_name || "Goten"} 🐟\nالمبلغ المستحق على حسابك: ${money(c.bal)}${c.due ? `\nتاريخ الاستحقاق: ${new Date(c.due).toLocaleDateString("ar-KW")}` : ""}${num(st.early_pay_pct) > 0 ? `\n🎁 لو سددت خلال ${st.early_pay_days || 7} أيام تاخد خصم ${num(st.early_pay_pct)}%` : ""}\nتقدر تسدد كاش أو كي نت مع المندوب أو في المحل. شكراً لتعاملك معانا 🙏`;
    return `https://wa.me/${c.phone}?text=${encodeURIComponent(t)}`;
  }
  function metaSheet(ph) {
    const c = custC(ph), m = metaOf(ph);
    sheet(`<h3>⚙️ إعدادات حساب ${esc(c.name || ph)}</h3>
      <label class="f"><span>حد أقصى للآجل (د.ك) – فاضي = من غير حد</span><input class="in" id="mL" type="number" step="0.5" min="0" inputmode="decimal" value="${m.credit_limit != null ? m.credit_limit : ""}"></label>
      <label class="f"><span>يسدد خلال كام يوم؟ (فاضي = ${A.settings.default_terms_days ?? 30} يوم)</span><input class="in" id="mT" type="number" min="0" inputmode="numeric" value="${m.terms_days != null ? m.terms_days : ""}"></label>
      <label class="f"><span>ملاحظة</span><input class="in" id="mN" value="${esc(m.note || "")}" placeholder="مثال: بيدفع أول الشهر"></label>
      <label class="switch"><span>📁 في الأرشيف</span><input type="checkbox" id="mA" ${m.archived ? "checked" : ""}></label>
      <button class="btn tq block" id="mS">💾 حفظ</button>`, () => {
      $("mS").onclick = async () => { try { await Store.saveCustMeta({ phone: ph, credit_limit: $("mL").value === "" ? null : num($("mL").value), terms_days: $("mT").value === "" ? null : parseInt($("mT").value), note: $("mN").value.trim() || null, archived: $("mA").checked }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (e) { toast(/customer_meta/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); } };
    });
  }
  // حد الآجل: تنبيه قبل ما الحساب يعدّي الحد
  async function limitOk(ph, add) {
    if (!ph) return true; const c = custC(normPh(ph)); if (c.lim == null) return true;
    const nb = c.bal + num(add); if (nb <= c.lim + 0.0005) return true;
    return UI.ask(`⚠️ ${c.name || ph} عليه ${money(c.bal)} والحد بتاعه ${money(c.lim)}.\nبعد العملية دي هيبقى عليه ${money(nb)}. تكمّل؟`);
  }
  // ---- ✅ سداد (دفعات، طريقة الدفع، المندوب، خصم مبكر، رصيد مقدّم) + سند قبض ----
  function paySheet(ph) {
    const c = custC(ph), st = A.settings, drv = A.profiles.filter((p) => p.role === "driver"), bal = Math.max(0, c.bal);
    const early = num(st.early_pay_pct) > 0 && bal > 0 && c.age <= num(st.early_pay_days || 7) ? Math.round(bal * num(st.early_pay_pct) * 10) / 1000 : 0;
    sheet(`<h3>${bal > 0 ? "✅ سداد من" : "💳 شحن رصيد لـ"} ${esc(c.name || ph)}</h3>
      <div class="line"><span>${c.bal >= 0 ? "عليه دلوقتي" : "رصيده المقدّم"}</span><b style="color:${c.bal > 0 ? "#dc2626" : "#16a34a"}">${money(Math.abs(c.bal))}</b></div>
      <label class="f"><span>المبلغ اللي دفعه (تقدر تكتب جزء بس)</span><input class="in" id="pyA" type="number" step="0.005" min="0" inputmode="decimal" value="${bal ? bal.toFixed(3) : ""}"></label>
      <div id="pyR" class="mut" style="margin:-4px 0 8px"></div>
      <label class="f"><span>دفع إزاي؟</span><select class="in" id="pyM"><option value="cash">💵 كاش</option><option value="knet">💳 كي نت</option></select></label>
      ${drv.length ? `<label class="f"><span>مين استلم الفلوس؟</span><select class="in" id="pyD"><option value="">🏪 أنا / المحل</option>${drv.map((d) => `<option value="${d.id}">🛵 ${esc(d.full_name || "مندوب")}</option>`).join("")}</select></label>${num(st.collect_commission_pct) > 0 ? `<p class="mut" style="font-size:12px;margin-top:-4px">المندوب بياخد عمولة ${num(st.collect_commission_pct)}% على اللي يحصّله.</p>` : ""}` : ""}
      ${early ? `<label class="switch" style="background:#fef3c7;padding:8px;border-radius:10px"><span>🎁 خصم سداد مبكر ${num(st.early_pay_pct)}% (${money(early)}) – لو سدد المبلغ كله</span><input type="checkbox" id="pyE"></label>` : ""}
      <label class="f"><span>ملاحظة (اختياري)</span><input class="in" id="pyN"></label>
      <button class="btn green block" id="pyS">✅ تسجيل الدفعة وطلّع سند قبض</button>`, () => {
      const upd = () => { const a = num($("pyA").value), e = $("pyE") && $("pyE").checked ? early : 0, r = c.bal - a - e; $("pyR").innerHTML = !a ? "" : r > 0.0005 ? `هيفضل عليه <b>${money(r)}</b>` : r < -0.0005 ? `هيبقى ليه رصيد مقدّم <b style="color:#16a34a">${money(-r)}</b>` : '<b style="color:#16a34a">هيبقى خالص ✓</b>'; };
      $("pyA").oninput = upd; if ($("pyE")) $("pyE").onchange = () => { if ($("pyE").checked) $("pyA").value = (bal - early).toFixed(3); upd(); }; upd();
      $("pyS").onclick = async () => {
        const a = num($("pyA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err");
        if (num(st.big_payment) > 0 && a >= num(st.big_payment) && !(await UI.ask(`المبلغ ${money(a)} كبير. متأكد إنه صح؟`))) return;
        const dv = $("pyD") ? $("pyD").value : "", e = $("pyE") && $("pyE").checked ? early : 0, M = $("pyM").value, note = $("pyN").value.trim();
        $("pyS").disabled = true;
        try {
          const r = await Store.saveTransaction({ kind: "receivable_paid", amount: a, date: dayKey(new Date()), party: ph, party_name: c.name || null, note: note || null, method: M, collected_by: dv || null, category: c.bal <= 0.0005 ? "topup" : a > bal + 0.0005 ? "topup" : null });
          if (e) await Store.saveTransaction({ kind: "receivable_paid", amount: e, date: dayKey(new Date()), party: ph, party_name: c.name || null, note: "خصم سداد مبكر", category: "discount" });
          if (dv && M === "cash") await Store.addDriverMove({ driver_id: dv, kind: "collect", amount: a, note: `تحصيل من ${c.name || ph}` });
          if (dv && num(st.collect_commission_pct) > 0) { const cm = Math.round(a * num(st.collect_commission_pct) * 10) / 1000; if (cm > 0) await Store.addDriverMove({ driver_id: dv, kind: "commission", amount: cm, note: `عمولة تحصيل من ${c.name || ph}` }); }
          closeSheet(); await refresh(); receiptSheet({ ...(r || {}), amount: a, method: M, party: ph, party_name: c.name, created_at: (r && r.created_at) || new Date().toISOString(), disc: e, collected_by: dv });
        } catch (err) { $("pyS").disabled = false; toast(err.message, "err"); }
      };
    });
  }
  function receiptText(t, after) {
    const st = A.settings, drv = t.collected_by && A.profiles.find((p) => p.id === t.collected_by);
    return `🧾 سند قبض${t.receipt_no ? " رقم " + t.receipt_no : ""} – ${st.store_name || "Goten"}\nالتاريخ: ${new Date(t.created_at).toLocaleString("ar-KW")}\nاستلمنا من: ${t.party_name || ""} (${t.party})\nالمبلغ: ${money(t.amount)} – ${t.method === "knet" ? "كي نت" : "كاش"}${t.disc ? `\nخصم سداد مبكر: ${money(t.disc)}` : ""}${drv ? `\nاستلمها: ${drv.full_name}` : ""}\n${after > 0.0005 ? `المتبقي عليك: ${money(after)}` : after < -0.0005 ? `رصيدك المقدّم: ${money(-after)}` : "حسابك خالص ✓"}`;
  }
  function receiptSheet(t) {
    const after = custC(t.party).bal, txt = receiptText(t, after), thanks = `${txt}\n\nشكراً ${t.party_name || ""} على السداد 🙏 دايماً في خدمتك – ${A.settings.store_name || "Goten"} 🐟`;
    sheet(`<h3>🧾 سند قبض${t.receipt_no ? " #" + t.receipt_no : ""}</h3><div class="card" style="white-space:pre-line;line-height:1.9">${esc(txt)}</div>
      <a class="btn green block" style="text-decoration:none;text-align:center" target="_blank" rel="noopener" href="https://wa.me/${esc(t.party)}?text=${encodeURIComponent(thanks)}">💬 ابعت السند + رسالة شكر</a>
      <button class="btn ghost block" style="margin-top:8px" data-printrec='${esc(JSON.stringify({ n: t.receipt_no, txt }))}'>🖨️ طباعة / PDF</button>`);
  }
  function printDoc(title, html) {
    const w = window.open("", "_blank"); if (!w) return toast("اسمح بفتح النوافذ علشان تطبع", "err");
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:-apple-system,Segoe UI,Tahoma,sans-serif;padding:24px;color:#0b2545}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}td,th{border-bottom:1px solid #e2e8f0;padding:6px;text-align:right}th{background:#f1f5f9}.tot{font-weight:800;font-size:16px}.mut{color:#64748b;font-size:12px}pre{white-space:pre-wrap;font-family:inherit;font-size:15px;line-height:1.9}@media print{button{display:none}}</style></head><body>${html}<p><button onclick="print()">🖨️ طباعة / حفظ PDF</button></p><script>setTimeout(()=>print(),400)<\/script></body></html>`);
    w.document.close();
  }
  function splitSheet(id) {
    const o = A.orders.find((x) => x.id === id), sp = splitOf(o), T = num(o.total);
    sheet(`<h3>➗ تقسيم دفع طلب #${o.order_no}</h3><div class="line"><span>إجمالي الطلب</span><b>${money(T)}</b></div>
      <div class="row3"><label class="f"><span>💵 كاش</span><input class="in" id="spC" type="number" step="0.005" min="0" inputmode="decimal" value="${sp.cash.toFixed(3)}"></label><label class="f"><span>💳 كي نت</span><input class="in" id="spK" type="number" step="0.005" min="0" inputmode="decimal" value="${sp.knet.toFixed(3)}"></label><label class="f"><span>📝 آجل</span><input class="in" id="spR" type="number" step="0.005" min="0" inputmode="decimal" value="${sp.credit.toFixed(3)}"></label></div>
      <div id="spD"></div><button class="btn tq block" id="spS">💾 حفظ التقسيم</button>${o.pay_split ? '<button class="btn ghost block" id="spX" style="margin-top:8px">إلغاء التقسيم</button>' : ""}`, () => {
      const g = () => ({ cash: num($("spC").value), knet: num($("spK").value), credit: num($("spR").value) });
      const upd = () => { const x = g(), d = T - x.cash - x.knet - x.credit; $("spD").innerHTML = Math.abs(d) < 0.0005 ? '<b style="color:#16a34a">✓ المجموع مظبوط</b>' : `<b style="color:#dc2626">${d > 0 ? "ناقص" : "زيادة"} ${money(Math.abs(d))}</b>`; };
      ["spC", "spK", "spR"].forEach((k) => ($(k).oninput = upd)); upd();
      $("spS").onclick = async () => { const x = g(); if (Math.abs(T - x.cash - x.knet - x.credit) >= 0.0005) return toast("المجموع لازم يساوي إجمالي الطلب", "err");
        const parts = Object.entries(x).filter(([, v]) => v > 0.0005), main = parts.length === 1 ? { cash: "cash", knet: "knet_on_delivery", credit: "credit" }[parts[0][0]] : x.credit > 0.0005 ? "credit" : x.knet >= x.cash ? "knet_on_delivery" : "cash";
        if (x.credit > 0.0005 && !(await limitOk(o.phone, x.credit - splitOf(o).credit))) return;
        try { await Store.updateOrder(id, { pay_split: parts.length > 1 ? x : null, payment: main }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (e) { toast(/pay_split/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); } };
      if ($("spX")) $("spX").onclick = async () => { await Store.updateOrder(id, { pay_split: null }); closeSheet(); await refresh(); };
    });
  }
  function printStmt(ph) {
    const c = custC(ph), st = A.settings;
    printDoc("كشف حساب " + (c.name || ph), `<h1>${esc(st.store_name || "Goten")} – كشف حساب</h1><div class="mut">${esc(c.name || "")} · ${esc(ph)} · ${new Date().toLocaleDateString("ar-KW")}</div>
      <table><tr><th>التاريخ</th><th>البيان</th><th>عليه</th><th>دفع</th><th>الرصيد</th></tr>${c.lines.filter((r) => r.a).map((r) => `<tr><td>${dayKey(r.d)}</td><td>${esc(r.l.replace(/^\S+ /, ""))}</td><td>${r.a > 0 ? r.a.toFixed(3) : ""}</td><td>${r.a < 0 ? (-r.a).toFixed(3) : ""}</td><td>${r.run.toFixed(3)}</td></tr>`).join("")}</table>
      <p class="tot">${c.bal >= 0 ? "المطلوب" : "رصيد مقدّم"}: ${money(Math.abs(c.bal))}</p>${c.due && c.bal > 0 ? `<p class="mut">تاريخ الاستحقاق: ${new Date(c.due).toLocaleDateString("ar-KW")}</p>` : ""}`);
  }
  // ---- 🛵 تسوية المناديب + مصاريفهم ----
  function drvPage() {
    const ds = A.profiles.filter((p) => p.role === "driver");
    if (!ds.length) return '<div class="empty"><div class="e">🛵</div>مفيش مناديب</div>';
    return ds.map((p) => { const w = dCash(p.id), exps = w.mv.filter((m) => m.kind === "expense").slice(0, 5);
      return `<div class="card"><div class="line"><b>🛵 ${esc(p.full_name || "مندوب")}</b><span class="mut">${w.del.length} توصيلة</span></div>
        <div class="line"><span>كاش طلبات حصّلها</span><b>${money(w.ordCash)}</b></div>${w.collect ? `<div class="line"><span>+ حصّل آجل من زباين</span><b>${money(w.collect)}</b></div>` : ""}
        <div class="line"><span>− سلّمهولك</span><b>${money(w.hand)}</b></div><div class="line"><span>− مصاريف (بنزين وغيره)</span><b>${money(w.exp)}</b></div>
        <div class="line total"><span>المفروض معاه</span><span style="color:${w.cashWith > 0.0005 ? "#b45309" : "#16a34a"}">${money(w.cashWith)}</span></div>
        <div class="line"><span>أرباحه + عمولاته اللي ليه</span><b style="color:#16a34a">${money(w.earn - w.paid)}</b></div>
        ${exps.length ? `<div class="mut" style="font-size:12px;margin-top:4px">آخر مصاريفه: ${exps.map((m) => `${esc(m.category || m.note || "مصروف")} ${money(m.amount)}`).join(" · ")}</div>` : ""}
        <div class="acts"><button class="btn sm green" data-dsettle="${p.id}">🤝 تسوية – استلمت الكاش</button><button class="btn sm tq" data-dmove="${p.id}:payout">💸 صرفتله أرباح</button><button class="btn sm ghost" data-dmlog="${p.id}">📜 الحركات</button></div></div>`; }).join("");
  }
  function settleSheet(id) {
    const p = A.profiles.find((x) => x.id === id), w = dCash(id);
    sheet(`<h3>🤝 تسوية ${esc(p.full_name || "المندوب")}</h3><div class="line"><span>المفروض معاه</span><b>${money(w.cashWith)}</b></div>
      <label class="f"><span>سلّمك كام فعلاً؟</span><input class="in" id="stA" type="number" step="0.005" inputmode="decimal" value="${Math.max(0, w.cashWith).toFixed(3)}"></label><div id="stD"></div>
      <label class="f"><span>ملاحظة</span><input class="in" id="stN"></label><button class="btn green block" id="stS">✅ تسجيل الاستلام</button>`, () => {
      const upd = () => { const d = num($("stA").value) - w.cashWith; $("stD").innerHTML = Math.abs(d) < 0.0005 ? '<b style="color:#16a34a">✓ مظبوط</b>' : d < 0 ? `<b style="color:#dc2626">ناقص ${money(-d)} – هيفضل معاه</b>` : `<b style="color:#b45309">زيادة ${money(d)}</b>`; };
      $("stA").oninput = upd; upd();
      $("stS").onclick = async () => { const a = num($("stA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err"); const d = a - w.cashWith; $("stS").disabled = true;
        try { await Store.addDriverMove({ driver_id: id, kind: "handover", amount: a, note: [ "تسوية", Math.abs(d) >= 0.0005 ? (d < 0 ? "ناقص " : "زيادة ") + Math.abs(d).toFixed(3) : "", $("stN").value.trim()].filter(Boolean).join(" – ") }); closeSheet(); toast("اتسجّل ✓"); await refresh(); }
        catch (e) { $("stS").disabled = false; toast(e.message, "err"); } };
    });
  }
  // ---- 📊 التقارير + التصدير ----
  function repPage() {
    const all = custList().map(custCollect), pays = A.tx.filter((t) => t.kind === "receivable_paid" && t.category !== "discount" && inPeriod(t.date || t.created_at));
    const coll = sum(pays), byM = { cash: sum(pays.filter((t) => t.method !== "knet" && !t.collected_by)), knet: sum(pays.filter((t) => t.method === "knet")), drv: sum(pays.filter((t) => t.collected_by && t.method !== "knet")) };
    const newCr = all.reduce((a, c) => a + c.lines.filter((r) => r.a > 0 && inPeriod(r.d)).reduce((x, r) => x + r.a, 0), 0), disc = sum(A.tx.filter((t) => t.kind === "receivable_paid" && t.category === "discount" && inPeriod(t.date || t.created_at)));
    const late = all.filter((c) => c.late > 0).sort((a, b) => b.late - a.late).slice(0, 5), closes = (A.dcloses || []).filter((c) => inPeriod(c.day + "T12:00:00"));
    const short = closes.reduce((a, c) => a + (num(c.counted_cash) - num(c.expected_cash)), 0);
    return `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>
      <div class="stats"><div class="stat"><span class="mut">اتحصّل</span><b style="color:#16a34a">${money(coll)}</b></div><div class="stat"><span class="mut">آجل جديد</span><b style="color:#b45309">${money(newCr)}</b></div><div class="stat"><span class="mut">برّه دلوقتي</span><b style="color:#dc2626">${money(all.reduce((a, c) => a + Math.max(0, c.bal), 0))}</b></div><div class="stat"><span class="mut">نسبة التحصيل</span><b>${newCr ? Math.round((coll / newCr) * 100) + "%" : "—"}</b></div></div>
      <div class="card"><b>اتحصّل إزاي</b><div class="line"><span>💵 كاش في المحل</span><b>${money(byM.cash)}</b></div><div class="line"><span>💳 كي نت</span><b>${money(byM.knet)}</b></div><div class="line"><span>🛵 حصّله المناديب</span><b>${money(byM.drv)}</b></div>${disc ? `<div class="line"><span>🎁 خصومات سداد مبكر</span><b>${money(disc)}</b></div>` : ""}</div>
      <div class="card"><b>🔴 أكتر الزباين المتأخرين</b>${late.map((c) => `<div class="line"><span>${esc(c.name || c.phone)} <small class="mut">متأخر ${c.late} يوم</small></span><b style="color:#dc2626">${money(c.bal)}</b></div>`).join("") || '<p class="mut">مفيش متأخرين 🎉</p>'}</div>
      <div class="card"><b>🔒 إقفال الأيام (${closes.length})</b>${closes.slice(0, 10).map((c) => { const d = num(c.counted_cash) - num(c.expected_cash); return `<div class="line"><span>${c.day}</span><b style="color:${Math.abs(d) < 0.0005 ? "#16a34a" : d < 0 ? "#dc2626" : "#b45309"}">${Math.abs(d) < 0.0005 ? "✓" : (d > 0 ? "+" : "") + d.toFixed(3)}</b></div>`; }).join("") || '<p class="mut">لسه مفيش أيام متقفلة.</p>'}${closes.length ? `<div class="line total"><span>إجمالي ${short < 0 ? "العجز" : "الزيادة"}</span><span>${money(Math.abs(short))}</span></div>` : ""}</div>
      <button class="btn ghost block" data-cexport>📊 تصدير تقرير التحصيل Excel</button>`;
  }
  function exportCollect() {
    const all = custList().map(custCollect), rows = [["👥 حسابات الزباين"], ["العميل", "الهاتف", "عليه", "الحد", "أيام السداد", "متأخر (يوم)", "التقييم", "آخر دفعة"]];
    all.filter((c) => Math.abs(c.bal) > 0.0005 || c.bought).forEach((c) => rows.push([c.name || "", c.phone, c.bal.toFixed(3), c.lim != null ? c.lim.toFixed(3) : "", c.terms, c.late || "", RATE[c.rate][1], c.lastPay ? dayKey(c.lastPay) : ""]));
    rows.push([], ["🧾 سندات القبض في الفترة"], ["رقم السند", "التاريخ", "العميل", "المبلغ", "الطريقة", "استلمها", "ملاحظة"]);
    A.tx.filter((t) => t.kind === "receivable_paid" && inPeriod(t.date || t.created_at)).forEach((t) => rows.push([t.receipt_no || "", t.date || dayKey(t.created_at), t.party_name || t.party, num(t.amount).toFixed(3), t.category === "discount" ? "خصم" : t.method === "knet" ? "كي نت" : "كاش", (A.profiles.find((p) => p.id === t.collected_by) || {}).full_name || "", t.note || ""]));
    rows.push([], ["🔒 إقفال الأيام"], ["اليوم", "المفروض كاش", "اتعدّ", "الفرق", "كي نت مفروض", "كي نت البنك"]);
    (A.dcloses || []).filter((c) => inPeriod(c.day + "T12:00:00")).forEach((c) => rows.push([c.day, num(c.expected_cash).toFixed(3), num(c.counted_cash).toFixed(3), (num(c.counted_cash) - num(c.expected_cash)).toFixed(3), num(c.expected_knet).toFixed(3), c.bank_knet != null ? num(c.bank_knet).toFixed(3) : ""]));
    const csv = "﻿" + rows.map((r) => r.map((x) => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = `goten-collections-${dayKey(new Date())}.csv`; a.click();
  }
  // ---- 📜 سجل التعديلات ----
  function logPage() {
    const L = A.alog || [], AC = { insert: "➕ سجّل", update: "✏️ عدّل", delete: "🗑️ مسح" }, TB = { transactions: "حركة حسابات", driver_moves: "حركة مندوب", day_closes: "إقفال يوم", orders: "طلب" };
    return `<p class="mut">آخر 300 عملية على الفلوس: مين عملها وامتى.</p>${L.length ? L.map((r) => { const i = r.info || {}; return `<div class="card" style="padding:10px"><div class="line"><b>${AC[r.action] || r.action} ${TB[r.tbl] || r.tbl}${i.no ? " #" + esc(i.no) : ""}</b><span class="mut" style="font-size:12px">${new Date(r.at).toLocaleString("ar-KW")}</span></div>
      <div class="mut" style="font-size:13px">👤 ${esc(r.actor_name || "—")}${i.party ? " · " + esc(i.party) : ""}${i.kind ? " · " + esc(KINDS[i.kind] || i.kind) : ""}${i.note ? " · " + esc(i.note) : ""}</div>
      ${r.amount_old != null || r.amount_new != null ? `<div style="font-size:14px">${r.amount_old != null ? `<s class="mut">${money(r.amount_old)}</s> ` : ""}${r.amount_new != null ? `<b>${money(r.amount_new)}</b>` : ""}</div>` : ""}${i.pay_old && i.pay_new && i.pay_old !== i.pay_new ? `<div class="mut" style="font-size:12px">الدفع: ${esc(PAY[i.pay_old] || i.pay_old)} ← ${esc(PAY[i.pay_new] || i.pay_new)}</div>` : ""}</div>`; }).join("") : '<p class="mut">لسه مفيش عمليات.</p>'}`;
  }
  // ---- ⚙️ إعدادات التحصيل ----
  function csetPage() {
    const s = A.settings, fi = (k, l, d, ex = "") => `<label class="f"><span>${l}</span><input class="in" id="cs_${k}" type="number" ${ex} value="${s[k] != null ? s[k] : d}"></label>`;
    return `<div class="card">${fi("default_terms_days", "الزبون يسدد الآجل خلال كام يوم (الافتراضي)", 30, 'min="0" inputmode="numeric"')}${fi("overdue_days", "ابعتلي إشعار بالمتأخرين كل يوم الصبح – لو عدّى كام يوم من غير ما يدفع", 7, 'min="1" inputmode="numeric"')}
      ${fi("big_payment", "نبّهني لو اتسجّل مبلغ أكبر من (د.ك) – 0 = من غير تنبيه", 100, 'step="1" min="0" inputmode="decimal"')}
      <div class="row2">${fi("early_pay_pct", "خصم السداد المبكر %", 0, 'step="0.5" min="0" max="50" inputmode="decimal"')}${fi("early_pay_days", "لو سدد خلال كام يوم", 7, 'min="1" inputmode="numeric"')}</div>
      ${fi("collect_commission_pct", "عمولة المندوب على تحصيل الآجل %", 0, 'step="0.5" min="0" max="50" inputmode="decimal"')}
      <button class="btn tq block" id="csSave">💾 حفظ</button></div>
      <div class="card"><b>👤 حساب محاسب</b><p class="mut">من «المناديب والحسابات» غيّر نوع الحساب لـ «محاسب». المحاسب بيشوف الطلبات والحسابات والتحصيل ويسجّل فيهم، ومش بيقدر يعدّل المنتجات والأسعار والإعدادات، ولا يشوف سجل التعديلات.</p></div>`;
  }
  async function saveCset() {
    const g = (k) => num($("cs_" + k).value);
    try { await Store.saveSettings({ default_terms_days: Math.max(0, Math.round(g("default_terms_days"))), overdue_days: Math.max(1, Math.round(g("overdue_days"))), big_payment: Math.max(0, g("big_payment")), early_pay_pct: Math.min(50, Math.max(0, g("early_pay_pct"))), early_pay_days: Math.max(1, Math.round(g("early_pay_days"))), collect_commission_pct: Math.min(50, Math.max(0, g("collect_commission_pct"))) }); toast("اتحفظ ✓"); await refresh(); }
    catch (e) { toast(/column/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); }
  }
  // =================== 📒 الحسابات المتقدمة ===================
  const BOX = { drawer: "🗄️ الدُرج", bank: "🏦 البنك" };
  const monthKey = (d) => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0"); };
  const inMonth = (d, mk) => d && monthKey(d) === mk;
  const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const mkLabel = (mk) => { const [y, m] = mk.split("-"); return MONTHS[+m - 1] + " " + y; };
  const txD = (t) => t.date || t.created_at;
  // أرقام أي فترة (فلتر دالة على التاريخ)
  function figs(inF) {
    const ords = A.orders.filter((o) => o.status === "delivered" && inF(o.delivered_at || o.created_at)), tx = A.tx.filter((t) => inF(txD(t))), s = (k) => sum(tx.filter((t) => t.kind === k));
    const sales = sum(ords, (o) => o.total) + s("sale"), cogs = ords.reduce((a, o) => a + (o.items || []).reduce((x, i) => { const p = A.products.find((q) => q.id === i.id); return x + num(p && p.cost) * num(i.qty); }, 0), 0);
    const waste = (A.moves || []).filter((m) => m.kind === "waste" && inF(m.created_at)).reduce((a, m) => { const p = A.products.find((q) => q.id === m.product_id); return a + Math.abs(num(m.qty)) * num(m.cost != null ? m.cost : p && p.cost); }, 0);
    const purch = s("purchase"), exp = s("expense"), sal = s("salary") + s("advance"), inc = s("income"), draw = s("drawing");
    return { ords, tx, sales, cogs, waste, purch, exp, sal, inc, draw, profit: sales + inc - purch - exp - sal };
  }
  const mSubs = [["main", "📒 الحركات"], ["profit", "🐟 ربح الأصناف"], ["month", "📈 الشهور"], ["inc", "💰 الإيرادات"], ["exp", "💸 المصاريف"], ["boxes", "🏦 الخزن"], ["plan", "🎯 الأهداف والميزانية"], ["pricing", "🧮 أداة التسعير"], ["partners", "🤝 الشركاء والسحب"]];
  const mTabs = () => `<div class="filters" style="margin-top:6px">${mSubs.map(([k, l]) => `<button class="${(A.msub || "main") === k ? "on" : ""}" data-msub="${k}">${l}</button>`).join("")}</div>`;
  const perF = () => `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>`;
  function addMenu() {
    const it = (attr, ic, t, sub, bg) => `<button ${attr} style="display:flex;align-items:center;gap:12px;width:100%;text-align:right;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:12px;margin-bottom:8px;cursor:pointer;font:inherit;color:inherit"><span style="width:42px;height:42px;border-radius:12px;background:${bg};display:grid;place-items:center;font-size:22px;flex:none">${ic}</span><span><b style="display:block">${t}</b><small class="mut">${sub}</small></span></button>`;
    sheet(`<h3>➕ إضافة</h3>
      ${it('data-addtx="sale"', "🧾", "مبيعات", "بيع في المحل أو خارج التطبيق", "#e0f2fe")}
      ${it('data-addtx="purchase"', "🛒", "مشتريات", "بضاعة من مورد أو من السوق", "#ccfbf1")}
      ${it('data-addtx="expense"', "💸", "مصروف", "بنزين، ثلج، صيانة، إعلانات...", "#fee2e2")}
      ${it('data-addtx="income"', "💰", "إيراد", "أي دخل تاني غير المبيعات", "#dcfce7")}
      ${it("data-stockpick", "📦", "مخزون", "زوّد أو قلّل أو جرد منتج", "#ede9fe")}
      ${it("data-newsup", "🚚", "مورد جديد", "ضيف مورد بحسابه", "#ccfbf1")}
      ${it("data-newcust", "👥", "عميل جديد", "ضيف عميل آجل أو رصيد سابق", "#fce7f3")}
      ${it("data-export", "📗", "تصدير Excel", "ملف فيه كل الحسابات", "#f1f5f9")}`);
  }
  function incPage() {
    const ords = A.orders.filter((o) => o.status === "delivered" && inPeriod(o.delivered_at || o.created_at)), sales = A.tx.filter((t) => t.kind === "sale" && inPeriod(txD(t))), inc = A.tx.filter((t) => t.kind === "income" && inPeriod(txD(t)));
    const aT = sum(ords, (o) => o.total), sT = sum(sales), iT = sum(inc), sec = A.isub || "all", chip = (k, l) => `<button class="${sec === k ? "on" : ""}" data-isub="${k}">${l}</button>`;
    const byPay = { cash: 0, knet_on_delivery: 0, credit: 0 };
    ords.forEach((o) => { const sp = splitOf(o); byPay.cash += sp.cash; byPay.knet_on_delivery += sp.knet; byPay.credit += sp.credit; });
    sales.forEach((t) => { const k = t.category in byPay ? t.category : "cash"; byPay[k] += num(t.amount); });
    const byCat = {}; inc.forEach((t) => { byCat[t.category || "أخرى"] = (byCat[t.category || "أخرى"] || 0) + num(t.amount); });
    const rows = [
      ...(sec === "all" || sec === "app" ? ords.map((o) => ({ d: o.delivered_at || o.created_at, t: `🧾 طلب #${o.order_no} · ${esc(o.customer_name || "")}`, s: `${esc(o.area || "")} · ${(PAY[o.payment] || PAY.cash)}`, a: num(o.total) })) : []),
      ...(sec === "all" || sec === "out" ? sales.map((t) => ({ d: txD(t), t: `🧾 مبيعات خارج التطبيق${t.party_name ? " · " + esc(t.party_name) : ""}`, s: `${PAY[t.category] || PAY.cash}${t.note ? " · " + esc(t.note) : ""}`, a: num(t.amount), id: t.id, att: t.attachment })) : []),
      ...(sec === "all" || sec === "other" ? inc.map((t) => ({ d: txD(t), t: `💰 ${esc(t.category || "إيراد")}`, s: `${t.note ? esc(t.note) : ""}${t.box === "bank" ? " · 🏦" : ""}`, a: num(t.amount), id: t.id, att: t.attachment })) : []),
    ].sort((x, y) => new Date(y.d) - new Date(x.d));
    return perF() + `<div class="stats"><div class="stat"><span class="mut">كل الإيرادات</span><b style="color:#16a34a">${money(aT + sT + iT)}</b></div><div class="stat"><span class="mut">من التطبيق (${ords.length} طلب)</span><b>${money(aT)}</b></div><div class="stat"><span class="mut">مبيعات خارج التطبيق</span><b>${money(sT)}</b></div><div class="stat"><span class="mut">إيرادات تانية</span><b>${money(iT)}</b></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0"><button class="btn block" data-addtx="sale">🧾 + مبيعات</button><button class="btn green block" data-addtx="income">💰 + إيراد</button></div>
      <div class="card"><b>حسب طريقة الدفع</b>${Object.entries(byPay).map(([k, v]) => `<div class="line"><span>${PAY[k]}</span><b>${money(v)}</b></div>`).join("")}${Object.keys(byCat).length ? `<div class="mut" style="margin-top:8px"><b>الإيرادات التانية حسب النوع:</b></div>${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="line"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join("")}` : ""}</div>
      <div class="filters">${chip("all", "📋 الكل")}${chip("app", "📱 من التطبيق")}${chip("out", "🏪 خارج التطبيق")}${chip("other", "💰 إيرادات تانية")}</div>
      <div class="list">${rows.slice(0, 200).map((r) => `<div class="it"><div class="t"><b>${r.t}</b><span class="mut">${dayKey(r.d)}${r.s ? " · " + r.s : ""}</span></div>${r.att ? `<a href="${esc(r.att)}" target="_blank" rel="noopener" style="font-size:20px;text-decoration:none">📎</a>` : ""}<b style="color:#16a34a">${money(r.a)}</b>${r.id ? `<button class="btn sm ghost" data-deltx="${r.id}">🗑️</button>` : ""}</div>`).join("") || '<p class="mut">مفيش إيرادات في الفترة دي.</p>'}</div>`;
  }
  function expPage() {
    const tx = A.tx.filter((t) => t.kind === "expense" && inPeriod(txD(t))), byCat = {};
    tx.forEach((t) => { byCat[t.category || "أخرى"] = (byCat[t.category || "أخرى"] || 0) + num(t.amount); });
    const sal = sum(A.tx.filter((t) => (t.kind === "salary" || t.kind === "advance") && inPeriod(txD(t)))), tot = sum(tx) + sal;
    const sec = A.esub || "all", chip = (k, l) => `<button class="${sec === k ? "on" : ""}" data-esub="${k}">${l}</button>`;
    const head = perF() + `<div class="stats"><div class="stat"><span class="mut">كل المصاريف</span><b style="color:#dc2626">${money(tot)}</b></div><div class="stat"><span class="mut">منها رواتب وسلف</span><b>${money(sal)}</b></div></div>
      <button class="btn red block" data-addtx="expense" style="margin:6px 0">💸 + مصروف</button>
      <div class="filters">${chip("all", "📋 كل المصاريف")}${chip("fixed", "🔁 المصاريف الثابتة")}${chip("pay", "👷 الرواتب")}</div>`;
    if (sec === "fixed") return head + fixedPage();
    if (sec === "pay") return head + payPage();
    return head + `${Object.keys(byCat).length || sal ? `<div class="card"><b>حسب النوع</b>${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="line"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join("")}${sal ? `<div class="line"><span>👷 رواتب وسلف</span><b>${money(sal)}</b></div>` : ""}</div>` : ""}
      <div class="list">${[...tx, ...A.tx.filter((t) => (t.kind === "salary" || t.kind === "advance") && inPeriod(txD(t)))].sort((x, y) => new Date(txD(y)) - new Date(txD(x))).map((t) => `<div class="it"><div class="t"><b>${KINDS[t.kind] || t.kind}${t.category && t.kind === "expense" ? " · " + esc(t.category) : t.party_name ? " · " + esc(t.party_name) : ""}</b><span class="mut">${esc(t.date || dayKey(t.created_at))}${t.note ? " · " + esc(t.note) : ""}${t.box === "bank" ? " · 🏦" : ""}</span></div>${t.attachment ? `<a href="${esc(t.attachment)}" target="_blank" rel="noopener" style="font-size:20px;text-decoration:none">📎</a>` : ""}<b>${money(t.amount)}</b><button class="btn sm ghost" data-deltx="${t.id}">🗑️</button></div>`).join("") || '<p class="mut">مفيش مصاريف في الفترة دي.</p>'}</div>`;
  }
  function moneyPage() {
    const v = A.msub || "main";
    const top = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0"><button class="btn sm" style="background:#15803d" data-xlsx>📗 ملف Excel كامل</button><button class="btn sm ghost" data-backup>💾 نسخة احتياطية</button>${A.me.role === "admin" ? `<button class="btn sm ghost" data-impx>📤 ملف للتعديل</button><button class="btn sm" style="background:#7c3aed" data-impin>📥 استيراد Excel</button><button class="btn sm ghost" data-imph>↩️ سجل الاستيراد</button>` : ""}</div>`;
    return mTabs() + top + (v === "profit" ? profitPage() : v === "month" ? monthPage() : v === "inc" ? incPage() : v === "exp" ? expPage() : v === "pay" || v === "fixed" ? ((A.msub = "exp"), (A.esub = v), expPage()) : v === "boxes" ? boxesPage() : v === "plan" ? planPage() : v === "pricing" ? pricingPage() : v === "partners" ? partnersPage() : accountsMoney());
  }
  // ---- 🐟 ربح كل صنف ----
  function profitPage() {
    const m = new Map(), F = figs(inPeriod);
    F.ords.forEach((o) => (o.items || []).forEach((i) => { const p = A.products.find((q) => q.id === i.id), r = m.get(i.id) || { name: i.name_ar, qty: 0, rev: 0, cost: 0, waste: 0, hasCost: p && p.cost != null }; r.qty += num(i.qty); r.rev += num(i.price) * num(i.qty); r.cost += num(p && p.cost) * num(i.qty); m.set(i.id, r); }));
    (A.moves || []).filter((x) => x.kind === "waste" && inPeriod(x.created_at)).forEach((x) => { const p = A.products.find((q) => q.id === x.product_id), r = m.get(x.product_id) || { name: x.product_name || (p && p.name_ar) || "منتج", qty: 0, rev: 0, cost: 0, waste: 0, hasCost: p && p.cost != null }; r.waste += Math.abs(num(x.qty)) * num(x.cost != null ? x.cost : p && p.cost); m.set(x.product_id, r); });
    const rows = [...m.values()].map((r) => ({ ...r, prof: r.rev - r.cost - r.waste })).sort((a, b) => b.prof - a.prof), noCost = rows.filter((r) => !r.hasCost).length;
    const T = rows.reduce((a, r) => ({ rev: a.rev + r.rev, cost: a.cost + r.cost, waste: a.waste + r.waste, prof: a.prof + r.prof }), { rev: 0, cost: 0, waste: 0, prof: 0 });
    return perF() + `<div class="stats"><div class="stat"><span class="mut">مبيعات الأصناف</span><b>${money(T.rev)}</b></div><div class="stat"><span class="mut">تكلفتها</span><b style="color:#b45309">${money(T.cost)}</b></div><div class="stat"><span class="mut">🗑️ قيمة الهالك</span><b style="color:#dc2626">${money(T.waste)}</b></div><div class="stat"><span class="mut">ربح الأصناف</span><b style="color:${T.prof >= 0 ? "#16a34a" : "#dc2626"}">${money(T.prof)}</b></div></div>
      ${noCost ? `<div class="notice">⚠️ ${noCost} صنف من غير تكلفة – ربحه هيبان أكبر من الحقيقي. حط «تكلفة الوحدة» من المخزون ← 📝 جرد أو من المشتريات.</div>` : ""}
      ${rows.length ? rows.map((r) => { const mg = r.rev ? Math.round((r.prof / r.rev) * 100) : 0; return `<div class="card" style="padding:10px"><div class="line"><b>${esc(r.name)}</b><b style="color:${r.prof >= 0 ? "#16a34a" : "#dc2626"}">${money(r.prof)}</b></div>
        <div class="mut" style="font-size:13px">اتباع ${fq(r.qty)} بـ ${money(r.rev)} · التكلفة ${r.hasCost ? money(r.cost) : "مش متسجّلة"}${r.waste ? ` · هالك ${money(r.waste)}` : ""} · هامش ${mg}%</div>
        <div style="height:6px;background:#e2e8f0;border-radius:6px;margin-top:6px"><div style="height:6px;width:${Math.max(0, Math.min(100, mg))}%;background:${mg >= 20 ? "#16a34a" : mg >= 0 ? "#f59e0b" : "#dc2626"};border-radius:6px"></div></div></div>`; }).join("") : '<p class="mut">مفيش مبيعات في الفترة دي.</p>'}`;
  }
  // ---- 📈 مقارنة الشهور ----
  function monthPage() {
    const ms = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return monthKey(d); });
    const R = ms.map((mk) => ({ mk, ...figs((d) => inMonth(d, mk)) })), cur = R[5], prev = R[4], mx = Math.max(1, ...R.map((r) => Math.max(r.sales, Math.abs(r.profit))));
    const ch = (a, b) => { if (!b) return a ? '<small style="color:#16a34a">جديد</small>' : ""; const p = Math.round(((a - b) / Math.abs(b)) * 100); return `<small style="color:${p >= 0 ? "#16a34a" : "#dc2626"}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}%</small>`; };
    const row = (l, k) => `<div class="line"><span>${l}</span><span><b>${money(cur[k])}</b> ${ch(cur[k], prev[k])} <small class="mut">(${money(prev[k])})</small></span></div>`;
    return `<div class="card"><b>${mkLabel(cur.mk)} مقارنة بـ ${mkLabel(prev.mk)}</b>${row("المبيعات", "sales")}${row("المشتريات", "purch")}${row("المصاريف", "exp")}${row("الرواتب", "sal")}${row("🗑️ الهالك", "waste")}<div class="line total"><span>صافي الربح</span><span>${money(cur.profit)} ${ch(cur.profit, prev.profit)}</span></div></div>
      <div class="card"><b>آخر 6 شهور</b><div style="display:flex;align-items:flex-end;gap:8px;height:150px;margin-top:12px">${R.map((r) => `<div style="flex:1;text-align:center;font-size:11px"><div style="display:flex;gap:2px;align-items:flex-end;height:120px;justify-content:center"><div title="مبيعات" style="width:45%;height:${Math.round((r.sales / mx) * 115) + 2}px;background:#0ea5e9;border-radius:4px 4px 0 0"></div><div title="ربح" style="width:45%;height:${Math.round((Math.max(0, r.profit) / mx) * 115) + 2}px;background:${r.profit >= 0 ? "#16a34a" : "#dc2626"};border-radius:4px 4px 0 0"></div></div><div class="mut">${MONTHS[+r.mk.split("-")[1] - 1].slice(0, 5)}</div></div>`).join("")}</div>
        <div class="mut" style="font-size:12px;margin-top:6px">🟦 المبيعات · 🟩 الربح</div></div>
      <div class="card">${R.slice().reverse().map((r) => `<div class="line"><span>${mkLabel(r.mk)}</span><span class="mut" style="font-size:12px">مبيعات ${money(r.sales)} · </span><b style="color:${r.profit >= 0 ? "#16a34a" : "#dc2626"}">${money(r.profit)}</b></div>`).join("")}</div>`;
  }
  // ---- 👷 الرواتب والسلف ----
  function payPage() {
    const mk = monthKey(new Date()), E = A.emps || [];
    if (A.emps === null) return '<p class="mut">محتاج تحديث قاعدة البيانات.</p>';
    const of = (id, k) => sum(A.tx.filter((t) => t.employee_id === id && t.kind === k && inMonth(txD(t), mk)));
    const tot = E.filter((e) => e.active !== false).reduce((a, e) => a + num(e.salary), 0);
    return `<div class="stats"><div class="stat"><span class="mut">رواتب شهرية</span><b>${money(tot)}</b></div><div class="stat"><span class="mut">اتصرف الشهر ده</span><b style="color:#16a34a">${money(E.reduce((a, e) => a + of(e.id, "salary") + of(e.id, "advance"), 0))}</b></div></div>
      <button class="btn tq sm" data-emp="new" style="margin:6px 0">👷 + موظف</button>
      ${E.length ? E.map((e) => { const adv = of(e.id, "advance"), paid = of(e.id, "salary"), left = num(e.salary) - adv - paid;
        return `<div class="card" style="${e.active === false ? "opacity:.55" : ""}"><div class="line"><b>👷 ${esc(e.name)}${e.role ? ` <small class="mut">${esc(e.role)}</small>` : ""}</b><b>${money(e.salary)}</b></div>
          <div class="mut" style="font-size:13px">بيقبض يوم ${e.pay_day || 1} · ${mkLabel(mk)}: سلف ${money(adv)} · قبض ${money(paid)} · <b style="color:${left > 0.0005 ? "#b45309" : "#16a34a"}">${left > 0.0005 ? "فاضله " + money(left) : "خالص ✓"}</b></div>
          <div class="acts"><button class="btn sm green" data-esal="${e.id}">💵 صرف الراتب</button><button class="btn sm" style="background:#f59e0b" data-eadv="${e.id}">💸 سلفة</button><button class="btn sm ghost" data-emp="${e.id}">✏️</button></div></div>`; }).join("") : '<p class="mut">ضيف موظفينك علشان تتابع رواتبهم وسلفهم.</p>'}`;
  }
  function empSheet(id) {
    const e = (A.emps || []).find((x) => x.id === id) || { active: true, pay_day: 1 };
    sheet(`<h3>${id ? "✏️ تعديل موظف" : "👷 موظف جديد"}</h3><label class="f"><span>الاسم *</span><input class="in" id="emN" value="${esc(e.name || "")}"></label>
      <div class="row2"><label class="f"><span>الوظيفة</span><input class="in" id="emR" value="${esc(e.role || "")}" placeholder="منظّف، كاشير..."></label><label class="f"><span>الهاتف</span><input class="in" id="emP" type="tel" value="${esc(e.phone || "")}"></label></div>
      <div class="row2"><label class="f"><span>الراتب الشهري (د.ك) *</span><input class="in" id="emS" type="number" step="0.5" inputmode="decimal" value="${e.salary || ""}"></label><label class="f"><span>بيقبض يوم</span><input class="in" id="emD" type="number" min="1" max="28" value="${e.pay_day || 1}"></label></div>
      <label class="switch"><span>شغّال</span><input type="checkbox" id="emA" ${e.active !== false ? "checked" : ""}></label>
      <button class="btn tq block" id="emSave">💾 حفظ</button>${id ? '<button class="btn ghost block" style="margin-top:8px;color:var(--red)" id="emDel">🗑️ حذف</button>' : ""}`, () => {
      $("emSave").onclick = async () => { const name = $("emN").value.trim(); if (!name) return toast("اكتب الاسم", "err");
        try { await Store.saveEmployee({ ...(id ? { id } : {}), name, role: $("emR").value.trim() || null, phone: $("emP").value.trim() || null, salary: num($("emS").value), pay_day: Math.min(28, Math.max(1, parseInt($("emD").value) || 1)), active: $("emA").checked }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (err) { toast(err.message, "err"); } };
      if ($("emDel")) $("emDel").onclick = async () => { if (!(await UI.ask("حذف الموظف؟ (المصروف القديم هيفضل)"))) return; await Store.deleteEmployee(id); closeSheet(); await refresh(); };
    });
  }
  function empPaySheet(id, kind) {
    const e = A.emps.find((x) => x.id === id), mk = monthKey(new Date()), adv = sum(A.tx.filter((t) => t.employee_id === id && t.kind === "advance" && inMonth(txD(t), mk))), paid = sum(A.tx.filter((t) => t.employee_id === id && t.kind === "salary" && inMonth(txD(t), mk)));
    const sug = kind === "salary" ? Math.max(0, num(e.salary) - adv - paid) : 0;
    sheet(`<h3>${kind === "salary" ? "💵 صرف راتب" : "💸 سلفة لـ"} ${esc(e.name)}</h3>${kind === "salary" ? `<div class="line"><span>الراتب</span><b>${money(e.salary)}</b></div><div class="line"><span>− سلف الشهر ده</span><b>${money(adv)}</b></div>${paid ? `<div class="line"><span>− قبض قبل كده</span><b>${money(paid)}</b></div>` : ""}` : ""}
      <label class="f"><span>المبلغ (د.ك)</span><input class="in" id="epA" type="number" step="0.005" inputmode="decimal" value="${sug ? sug.toFixed(3) : ""}"></label>
      <div class="row2"><label class="f"><span>من</span><select class="in" id="epB">${Object.entries(BOX).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label><label class="f"><span>ملاحظة (مكافأة / خصم...)</span><input class="in" id="epN"></label></div>
      <button class="btn green block" id="epS">💾 تسجيل</button>`, () => {
      $("epS").onclick = async () => { const a = num($("epA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err");
        try { await Store.saveTransaction({ kind, amount: a, date: dayKey(new Date()), employee_id: id, party_name: e.name, category: "رواتب", box: $("epB").value, note: [kind === "salary" ? "راتب " + mkLabel(mk) : "سلفة", $("epN").value.trim()].filter(Boolean).join(" – ") }); closeSheet(); toast("اتسجّل ✓"); await refresh(); } catch (err) { toast(err.message, "err"); } };
    });
  }
  // ---- 🔁 المصاريف الثابتة ----
  function fixedPage() {
    if (A.recs === null) return '<p class="mut">محتاج تحديث قاعدة البيانات.</p>';
    const R = A.recs || [], tot = R.filter((r) => r.active !== false).reduce((a, r) => a + num(r.amount), 0);
    return `<div class="notice">🔁 المصاريف دي بتتسجّل لوحدها كل شهر في يومها (الإيجار، الكهربا، الاشتراكات...). مش محتاج تكتبها كل مرة.</div>
      <div class="stats"><div class="stat"><span class="mut">مصاريف ثابتة شهرياً</span><b style="color:#dc2626">${money(tot)}</b></div><div class="stat"><span class="mut">+ رواتب</span><b>${money((A.emps || []).filter((e) => e.active !== false).reduce((a, e) => a + num(e.salary), 0))}</b></div></div>
      <button class="btn tq sm" data-rec="new" style="margin:6px 0">🔁 + مصروف ثابت</button>
      ${R.map((r) => `<div class="card" style="padding:10px;${r.active === false ? "opacity:.55" : ""}"><div class="line"><b>${esc(r.name)}</b><b>${money(r.amount)}</b></div><div class="mut" style="font-size:13px">${esc(r.category || "")} · يوم ${r.day} من كل شهر · من ${BOX[r.box || "drawer"]}${r.last_run ? ` · آخر مرة ${r.last_run}` : ""}</div><div class="acts"><button class="btn sm ghost" data-rec="${r.id}">✏️ تعديل</button></div></div>`).join("") || '<p class="mut">لسه مفيش.</p>'}`;
  }
  function recSheet(id) {
    const r = (A.recs || []).find((x) => x.id === id) || { day: 1, active: true, box: "drawer", category: "إيجار" };
    sheet(`<h3>${id ? "✏️ تعديل" : "🔁 مصروف ثابت جديد"}</h3><label class="f"><span>الاسم *</span><input class="in" id="rcN" value="${esc(r.name || "")}" placeholder="مثال: إيجار المحل"></label>
      <div class="row2"><label class="f"><span>النوع</span><select class="in" id="rcC">${EXP_CATS.map((c) => `<option ${r.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="f"><span>المبلغ *</span><input class="in" id="rcA" type="number" step="0.005" inputmode="decimal" value="${r.amount || ""}"></label></div>
      <div class="row2"><label class="f"><span>يتسجّل يوم</span><input class="in" id="rcD" type="number" min="1" max="28" value="${r.day}"></label><label class="f"><span>بيتدفع من</span><select class="in" id="rcB">${Object.entries(BOX).map(([k, l]) => `<option value="${k}" ${r.box === k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <label class="switch"><span>شغّال</span><input type="checkbox" id="rcO" ${r.active !== false ? "checked" : ""}></label>
      <button class="btn tq block" id="rcS">💾 حفظ</button>${id ? '<button class="btn ghost block" style="margin-top:8px;color:var(--red)" id="rcX">🗑️ حذف</button>' : ""}`, () => {
      $("rcS").onclick = async () => { const name = $("rcN").value.trim(), a = num($("rcA").value); if (!name || !(a > 0)) return toast("الاسم والمبلغ مطلوبين", "err");
        try { await Store.saveRecurring({ ...(id ? { id } : {}), name, category: $("rcC").value, amount: a, day: Math.min(28, Math.max(1, parseInt($("rcD").value) || 1)), box: $("rcB").value, active: $("rcO").checked }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (err) { toast(err.message, "err"); } };
      if ($("rcX")) $("rcX").onclick = async () => { if (!(await UI.ask("حذف المصروف الثابت؟"))) return; await Store.deleteRecurring(id); closeSheet(); await refresh(); };
    });
  }
  // ---- 🏦 الخزن (الدُرج والبنك) ----
  function boxFlows() {
    const L = [], add = (box, d, l, a) => L.push({ box, d, l, a });
    A.tx.forEach((t) => {
      const a = num(t.amount), d = txD(t), b = t.box || "drawer";
      if (t.kind === "sale" && t.category !== "credit") add(t.category === "knet_on_delivery" ? "bank" : "drawer", d, "مبيعات " + (t.note || ""), a);
      else if (t.kind === "receivable_paid" && t.category !== "discount" && !t.collected_by) add(t.method === "knet" ? "bank" : "drawer", d, "سداد " + (t.party_name || "") + (t.receipt_no ? " #" + t.receipt_no : ""), a);
      else if (t.kind === "income") add(b, d, t.category || "إيراد", a);
      else if (t.kind === "driver_settle") add("drawer", d, "استلام من مندوب", a);
      else if (t.kind === "purchase" && !t.supplier_id) add(b, d, "مشتريات " + (t.category || ""), -a);
      else if (["supplier_paid", "expense", "salary", "advance", "drawing"].includes(t.kind)) add(b, d, (KINDS[t.kind] || t.kind).replace(/^\S+ /, "") + " " + (t.party_name || t.category || ""), -a);
      else if (t.kind === "transfer") { const to = t.category === "to_drawer" ? "drawer" : "bank", from = to === "bank" ? "drawer" : "bank"; add(from, d, "تحويل لـ " + BOX[to], -a); add(to, d, "تحويل من " + BOX[from], a); }
    });
    (A.dmoves || []).filter((m) => m.kind === "handover").forEach((m) => add("drawer", m.created_at, "استلام من مندوب", num(m.amount)));
    A.orders.filter((o) => o.status === "delivered").forEach((o) => { const k = splitOf(o).knet; if (k) add("bank", o.delivered_at || o.created_at, "طلب كي نت #" + o.order_no, k); });
    return L;
  }
  function boxesPage() {
    const L = boxFlows(), op = A.settings.box_open || {}, bal = (b) => num(op[b]) + L.filter((x) => x.box === b).reduce((a, x) => a + x.a, 0);
    return `<div class="stats">${Object.entries(BOX).map(([k, l]) => `<div class="stat"><span class="mut">${l}</span><b style="color:${bal(k) >= 0 ? "#16a34a" : "#dc2626"}">${money(bal(k))}</b></div>`).join("")}<div class="stat"><span class="mut">الإجمالي</span><b>${money(bal("drawer") + bal("bank"))}</b></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0"><button class="btn sm tq" data-xfer="to_bank">🗄️ ➜ 🏦 إيداع في البنك</button><button class="btn sm ghost" data-xfer="to_drawer">🏦 ➜ 🗄️ سحب من البنك</button><button class="btn sm ghost" data-boxopen>⚙️ الرصيد الافتتاحي</button></div>
      <p class="mut" style="font-size:12px">كاش الطلبات بيدخل الدُرج لما تستلمه من المندوب، والكي نت بيدخل البنك. المصاريف والمشتريات بتتخصم من الخزنة اللي تختارها وانت بتسجّلها.</p>
      ${Object.keys(BOX).map((b) => `<div class="card"><b>${BOX[b]} – آخر الحركات</b>${L.filter((x) => x.box === b && inPeriod(x.d)).sort((x, y) => new Date(y.d) - new Date(x.d)).slice(0, 12).map((x) => `<div class="line" style="font-size:13px"><span>${esc(x.l)} <small class="mut">${dayKey(x.d)}</small></span><b style="color:${x.a >= 0 ? "#16a34a" : "#dc2626"};direction:ltr">${x.a >= 0 ? "+" : ""}${x.a.toFixed(3)}</b></div>`).join("") || '<p class="mut">مفيش.</p>'}</div>`).join("")}`;
  }
  function xferSheet(dir) {
    sheet(`<h3>${dir === "to_bank" ? "🗄️ ➜ 🏦 إيداع في البنك" : "🏦 ➜ 🗄️ سحب من البنك"}</h3><label class="f"><span>المبلغ</span><input class="in" id="xfA" type="number" step="0.005" inputmode="decimal"></label><label class="f"><span>ملاحظة</span><input class="in" id="xfN"></label>${docPicker()}<button class="btn tq block" id="xfS">💾 تسجيل</button>`, () => {
      const st = wireDoc();
      $("xfS").onclick = async () => { const a = num($("xfA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err"); try { await Store.saveTransaction({ kind: "transfer", category: dir, amount: a, date: dayKey(new Date()), note: $("xfN").value.trim() || null, attachment: st.url || null }); closeSheet(); toast("اتسجّل ✓"); await refresh(); } catch (e) { toast(e.message, "err"); } };
    });
  }
  function boxOpenSheet() {
    const op = A.settings.box_open || {};
    sheet(`<h3>⚙️ الرصيد الافتتاحي</h3><p class="mut">كان فيه كام في كل خزنة قبل ما تبدأ تسجّل في التطبيق؟</p>${Object.entries(BOX).map(([k, l]) => `<label class="f"><span>${l}</span><input class="in" id="bo_${k}" type="number" step="0.005" inputmode="decimal" value="${num(op[k]) || ""}"></label>`).join("")}<button class="btn tq block" id="boS">💾 حفظ</button>`, () => {
      $("boS").onclick = async () => { try { await Store.saveSettings({ box_open: { drawer: num($("bo_drawer").value), bank: num($("bo_bank").value) } }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (e) { toast(/box_open/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); } };
    });
  }
  // ---- 🎯 الأهداف والميزانية ونقطة التعادل والهالك ----
  function planPage() {
    const s = A.settings, mk = monthKey(new Date()), F = figs((d) => inMonth(d, mk)), B = s.budgets || {};
    const day = new Date().getDate(), dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const bar = (v, t, c) => `<div style="height:10px;background:#e2e8f0;border-radius:8px;margin:6px 0"><div style="height:10px;width:${Math.min(100, t ? Math.round((v / t) * 100) : 0)}%;background:${c};border-radius:8px"></div></div>`;
    const fixedM = (A.recs || []).filter((r) => r.active !== false).reduce((a, r) => a + num(r.amount), 0) + (A.emps || []).filter((e) => e.active !== false).reduce((a, e) => a + num(e.salary), 0);
    const L30 = figs((d) => Date.now() - new Date(d) <= 30 * DAY), gm = L30.sales ? (L30.cogs > 0 ? (L30.sales - L30.cogs - L30.waste) / L30.sales : (L30.sales - L30.purch) / L30.sales) : 0;
    const be = gm > 0 ? fixedM / gm : null, spentCat = (c) => sum(A.tx.filter((t) => t.kind === "expense" && (t.category || "أخرى") === c && inMonth(txD(t), mk)));
    return `<div class="card"><b>🎯 هدف ${mkLabel(mk)}</b>
        ${num(s.target_sales) ? `<div class="line"><span>المبيعات</span><b>${money(F.sales)} من ${money(s.target_sales)}</b></div>${bar(F.sales, num(s.target_sales), "#0ea5e9")}<div class="mut" style="font-size:12px">${F.sales >= num(s.target_sales) ? "🎉 وصلت للهدف!" : `فاضل ${money(num(s.target_sales) - F.sales)} في ${dim - day + 1} يوم = ${money((num(s.target_sales) - F.sales) / (dim - day + 1))} في اليوم`}</div>` : ""}
        ${num(s.target_profit) ? `<div class="line"><span>الربح</span><b>${money(F.profit)} من ${money(s.target_profit)}</b></div>${bar(Math.max(0, F.profit), num(s.target_profit), "#16a34a")}` : ""}
        ${!num(s.target_sales) && !num(s.target_profit) ? '<p class="mut">حط هدف للشهر من تحت.</p>' : ""}</div>
      <div class="card"><b>⚖️ نقطة التعادل</b><div class="line"><span>مصاريفك الثابتة في الشهر (ثابتة + رواتب)</span><b>${money(fixedM)}</b></div><div class="line"><span>هامش ربحك (آخر 30 يوم)</span><b>${Math.round(gm * 100)}%</b></div>
        ${be != null ? `<div class="line total"><span>لازم تبيع في الشهر</span><span>${money(be)}</span></div>${bar(F.sales, be, F.sales >= be ? "#16a34a" : "#f59e0b")}<div class="mut" style="font-size:12px">${F.sales >= be ? "✅ غطّيت مصاريفك الشهر ده، وأي بيع زيادة ربح" : `بعت ${money(F.sales)} – فاضل ${money(be - F.sales)} علشان تغطي مصاريفك`}</div>` : `<p class="mut">محتاج مبيعات وتكلفة في آخر 30 يوم علشان أحسبها${fixedM ? "" : "، وضيف المصاريف الثابتة والرواتب"}.</p>`}</div>
      <div class="card"><b>🗑️ الهالك</b><div class="line"><span>الشهر ده</span><b style="color:#dc2626">${money(F.waste)}</b></div><div class="line"><span>الشهر اللي فات</span><b>${money(figs((d) => inMonth(d, monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5)))).waste)}</b></div>${F.sales ? `<div class="mut" style="font-size:12px">الهالك = ${(F.waste / F.sales * 100).toFixed(1)}% من المبيعات</div>` : ""}</div>
      <div class="card"><b>💸 ميزانية المصاريف – ${mkLabel(mk)}</b><p class="mut" style="font-size:12px">حط حد لكل نوع، ولما توصل 80% ولما تعدّيه يوصلك إشعار.</p>
        ${EXP_CATS.map((c) => { const sp = spentCat(c), b = num(B[c]); return `<div style="margin:8px 0"><div class="line"><span>${c}</span><span><b style="color:${b && sp > b ? "#dc2626" : "inherit"}">${money(sp)}</b>${b ? ` <small class="mut">من ${money(b)}</small>` : ""}</span></div>${b ? bar(sp, b, sp > b ? "#dc2626" : sp > b * 0.8 ? "#f59e0b" : "#16a34a") : ""}</div>`; }).join("")}</div>
      <div class="card"><b>⚙️ تعديل الأهداف والميزانية</b>
        <div class="row2"><label class="f"><span>هدف المبيعات الشهري</span><input class="in" id="pl_ts" type="number" step="10" inputmode="decimal" value="${s.target_sales || ""}"></label><label class="f"><span>هدف الربح الشهري</span><input class="in" id="pl_tp" type="number" step="10" inputmode="decimal" value="${s.target_profit || ""}"></label></div>
        ${EXP_CATS.map((c, i) => `<label class="f"><span>ميزانية ${c}</span><input class="in" id="pl_b${i}" type="number" step="5" inputmode="decimal" value="${B[c] || ""}" placeholder="من غير حد"></label>`).join("")}
        <label class="switch"><span>📊 ابعتلي ملخص كل يوم الساعة 10 بالليل</span><input type="checkbox" id="pl_ds" ${s.daily_summary !== false ? "checked" : ""}></label>
        <button class="btn tq block" id="plSave">💾 حفظ</button></div>`;
  }
  async function savePlan() {
    const B = {}; EXP_CATS.forEach((c, i) => { const v = num($("pl_b" + i).value); if (v > 0) B[c] = v; });
    try { await Store.saveSettings({ target_sales: num($("pl_ts").value) || null, target_profit: num($("pl_tp").value) || null, budgets: B, daily_summary: $("pl_ds").checked }); toast("اتحفظ ✓"); await refresh(); } catch (e) { toast(/column/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); }
  }
  // ---- 🤝 الشركاء والسحب الشخصي ----
  function partnersPage() {
    const P = A.settings.partners || [], F = figs(inPeriod), dr = (n) => sum(F.tx.filter((t) => t.kind === "drawing" && (t.party_name || "أنا") === n));
    const people = P.length ? P : [{ name: "أنا", share: 100 }];
    return perF() + `<div class="stats"><div class="stat"><span class="mut">صافي الربح في الفترة</span><b style="color:${F.profit >= 0 ? "#16a34a" : "#dc2626"}">${money(F.profit)}</b></div><div class="stat"><span class="mut">اتسحب</span><b style="color:#b45309">${money(F.draw)}</b></div></div>
      <p class="mut" style="font-size:12px">السحب الشخصي مش مصروف، علشان كده مش بيقلل الربح. هو بيتخصم من نصيبك.</p>
      ${people.map((p) => { const share = F.profit * num(p.share) / 100, d = dr(p.name); return `<div class="card"><div class="line"><b>👤 ${esc(p.name)}</b><span class="mut">${num(p.share)}%</span></div><div class="line"><span>نصيبه من الربح</span><b>${money(share)}</b></div><div class="line"><span>− سحب</span><b>${money(d)}</b></div><div class="line total"><span>${share - d >= 0 ? "ليه" : share < 0 && !d ? "نصيبه من الخسارة" : "سحب زيادة"}</span><span style="color:${share - d >= 0 ? "#16a34a" : "#dc2626"}">${money(Math.abs(share - d))}</span></div><button class="btn sm" style="background:#7c3aed" data-draw="${esc(p.name)}">💼 سجّل سحب</button></div>`; }).join("")}
      <button class="btn ghost block" data-partners>⚙️ ${P.length ? "تعديل الشركاء" : "عندي شريك؟ ضيفه"}</button>`;
  }
  function partnersSheet() {
    let P = JSON.parse(JSON.stringify(A.settings.partners || [])); if (!P.length) P = [{ name: "أنا", share: 50 }, { name: "", share: 50 }];
    const draw = () => { $("ptL").innerHTML = P.map((p, i) => `<div style="display:grid;grid-template-columns:2fr 1fr auto;gap:6px;margin-bottom:6px"><input class="in" data-pk="${i}:name" value="${esc(p.name)}" placeholder="الاسم"><input class="in" type="number" data-pk="${i}:share" value="${p.share}" placeholder="%"><button class="btn sm ghost" data-pdel="${i}">✕</button></div>`).join(""); };
    sheet(`<h3>🤝 الشركاء</h3><p class="mut">اكتب كل شريك ونسبته من الربح. المجموع لازم يبقى 100%.</p><div id="ptL"></div><button class="btn ghost sm" id="ptAdd">➕ شريك</button><button class="btn tq block" id="ptS" style="margin-top:10px">💾 حفظ</button><button class="btn ghost block" id="ptX" style="margin-top:6px">مفيش شركاء (أنا لوحدي)</button>`, () => {
      draw(); const body = document.getElementById("sheet");
      body.addEventListener("input", (e) => { const k = e.target.dataset.pk; if (!k) return; const [i, f] = k.split(":"); P[i][f] = f === "share" ? num(e.target.value) : e.target.value; });
      body.addEventListener("click", (e) => { const d = e.target.closest("[data-pdel]"); if (d) { P.splice(+d.dataset.pdel, 1); draw(); } });
      $("ptAdd").onclick = () => { P.push({ name: "", share: 0 }); draw(); };
      $("ptS").onclick = async () => { P = P.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), share: num(p.share) })); const t = P.reduce((a, p) => a + p.share, 0); if (P.length && Math.abs(t - 100) > 0.01) return toast(`المجموع ${t}% – لازم 100%`, "err"); try { await Store.saveSettings({ partners: P }); closeSheet(); toast("اتحفظ ✓"); await refresh(); } catch (e) { toast(e.message, "err"); } };
      $("ptX").onclick = async () => { await Store.saveSettings({ partners: [] }); closeSheet(); await refresh(); };
    });
  }
  function drawSheet(name) {
    sheet(`<h3>💼 سحب شخصي – ${esc(name)}</h3><label class="f"><span>المبلغ</span><input class="in" id="dwA" type="number" step="0.005" inputmode="decimal"></label><label class="f"><span>من</span><select class="in" id="dwB">${Object.entries(BOX).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label><label class="f"><span>ملاحظة</span><input class="in" id="dwN"></label><button class="btn tq block" id="dwS">💾 تسجيل</button>`, () => {
      $("dwS").onclick = async () => { const a = num($("dwA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err"); try { await Store.saveTransaction({ kind: "drawing", amount: a, date: dayKey(new Date()), party_name: name, box: $("dwB").value, note: $("dwN").value.trim() || null }); closeSheet(); toast("اتسجّل ✓"); await refresh(); } catch (e) { toast(/kind_check/.test(e.message) ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); } };
    });
  }
  // ---- 📎 صورة الفاتورة ----
  const docPicker = () => `<div class="f"><span class="mut">📎 صورة الفاتورة / الإيصال (اختياري)</span><div style="display:flex;gap:8px;align-items:center;margin-top:4px"><label class="btn sm ghost" style="margin:0">📷 صوّر<input type="file" accept="image/*" capture="environment" id="docF" hidden></label><img id="docP" alt="" style="display:none;height:48px;border-radius:8px"><span id="docS" class="mut" style="font-size:12px"></span></div></div>`;
  function wireDoc() {
    const st = { url: null }, f = $("docF"); if (!f) return st;
    f.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; $("docS").textContent = "⏳ بيرفع…"; try { st.url = await Store.uploadDoc(file); $("docP").src = st.url; $("docP").style.display = "block"; $("docS").textContent = "✓"; } catch (err) { $("docS").textContent = ""; toast(err.message, "err"); } };
    return st;
  }
  // ---- 🧾 فاتورة رسمية (جملة) ----
  function invoicePrint(id) {
    const o = A.orders.find((x) => x.id === id), s = A.settings, logo = s.logo ? `<img src="${esc(s.logo)}" style="height:60px">` : "";
    printDoc("فاتورة " + o.order_no, `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0b2545;padding-bottom:10px">${logo}<div style="text-align:left"><h1>فاتورة رقم ${o.order_no}</h1><div class="mut">${new Date(o.created_at).toLocaleDateString("ar-KW")}</div></div></div>
      <p><b>${esc(s.store_name || "Goten")}</b>${s.whatsapp ? " · " + esc(s.whatsapp) : ""}</p><p>العميل: <b>${esc(o.customer_name)}</b> · ${esc(o.phone)}<br><span class="mut">${esc(o.area)} – قطعة ${esc(o.block || "")} – شارع ${esc(o.street || "")} – منزل ${esc(o.house || "")}</span></p>
      <table><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>${(o.items || []).map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.name_ar)}${(i.opts || []).length ? `<div class="mut">${i.opts.map((x) => esc(x.c)).join("، ")}</div>` : ""}</td><td>${i.qty} ${esc(i.unit_ar || "")}</td><td>${num(i.price).toFixed(3)}</td><td>${(num(i.price) * num(i.qty)).toFixed(3)}</td></tr>`).join("")}
      ${(o.fees || []).map((f) => `<tr><td></td><td>${esc(f.name_ar)}</td><td>${f.qty}</td><td>${num(f.price).toFixed(3)}</td><td>${num(f.amount).toFixed(3)}</td></tr>`).join("")}
      ${num(o.delivery_fee) ? `<tr><td></td><td>التوصيل</td><td></td><td></td><td>${num(o.delivery_fee).toFixed(3)}</td></tr>` : ""}${num(o.discount) + num(o.points_disc) ? `<tr><td></td><td>خصم</td><td></td><td></td><td>-${(num(o.discount) + num(o.points_disc)).toFixed(3)}</td></tr>` : ""}</table>
      <p class="tot">الإجمالي: ${money(o.total)}</p><p class="mut">طريقة الدفع: ${(PAY[o.payment] || PAY.cash).replace(/^\S+ /, "")}${o.pay_split ? ` (كاش ${num(o.pay_split.cash).toFixed(3)} + كي نت ${num(o.pay_split.knet).toFixed(3)} + آجل ${num(o.pay_split.credit).toFixed(3)})` : ""}</p><p class="mut" style="margin-top:30px">شكراً لتعاملكم معنا 🐟</p>`);
  }
  // ---- 🚚 مواعيد الموردين ----
  function supDueList() {
    const d = new Date().getDate(), t = new Date(Date.now() + DAY).getDate();
    return (A.sups || []).filter((x) => x.pay_day && (x.pay_day === d || x.pay_day === t) && supBal(x.id) > 0.0005).map((x) => ({ ...x, when: x.pay_day === d ? "النهارده" : "بكرة", bal: supBal(x.id) }));
  }
  // ---- 📗 ملف Excel كامل ----
  function loadXLSX() { return window.XLSX ? Promise.resolve() : new Promise((ok, bad) => { const sc = document.createElement("script"); sc.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"; sc.onload = ok; sc.onerror = () => bad(new Error("مقدرتش أحمّل مكتبة الإكسل – اتأكد من النت")); document.head.appendChild(sc); }); }
  async function exportXlsx(all) {
    toast("⏳ بجهّز ملف الإكسل…");
    try { await loadXLSX(); } catch (e) { return toast(e.message, "err"); }
    const inF = all ? () => true : inPeriod, n3 = (v) => Math.round(num(v) * 1000) / 1000, wb = XLSX.utils.book_new();
    const add = (name, rows) => { const ws = XLSX.utils.aoa_to_sheet(rows); ws["!cols"] = (rows[0] || []).map((_, i) => ({ wch: Math.min(40, Math.max(10, ...rows.slice(0, 200).map((r) => String(r[i] == null ? "" : r[i]).length + 2))) })); ws["!views"] = [{ RTL: true }]; XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); };
    const pn = (id) => (A.profiles.find((p) => p.id === id) || {}).full_name || "";
    const F = figs(inF);
    add("الملخص", [["البند", "المبلغ (د.ك)"], ["المبيعات", n3(F.sales)], ["المشتريات", n3(F.purch)], ["المصاريف", n3(F.exp)], ["الرواتب والسلف", n3(F.sal)], ["إيرادات أخرى", n3(F.inc)], ["صافي الربح", n3(F.profit)], ["تكلفة الأصناف المباعة", n3(F.cogs)], ["قيمة الهالك", n3(F.waste)], ["السحب الشخصي", n3(F.draw)], [], ["الفترة", all ? "كل الوقت" : (PERIODS.find((p) => p[0] === A.period) || [, ""])[1]], ["تاريخ الملف", new Date().toLocaleString("ar-KW")]]);
    add("الطلبات", [["رقم", "التاريخ", "الحالة", "العميل", "الهاتف", "المنطقة", "الأصناف", "المجموع", "الرسوم", "التوصيل", "الخصم", "الإجمالي", "الدفع", "كاش", "كي نت", "آجل", "المندوب", "أجرة المندوب", "التقييم"],
      ...A.orders.filter((o) => inF(o.created_at)).map((o) => { const s = splitOf(o); return [o.order_no, dayKey(o.created_at), (STATUS[o.status] || {}).ar || o.status, o.customer_name, o.phone, o.area, (o.items || []).map((i) => i.name_ar + " ×" + i.qty).join(" + "), n3(o.subtotal), n3(o.fees_total), n3(o.delivery_fee), n3(num(o.discount) + num(o.points_disc)), n3(o.total), (PAY[o.payment] || PAY.cash).replace(/^\S+ /, ""), n3(s.cash), n3(s.knet), n3(s.credit), pn(o.driver_id), n3(o.driver_earning), o.rating || ""]; })]);
    const TX = (kinds) => A.tx.filter((t) => kinds.includes(t.kind) && inF(txD(t))).sort((a, b) => String(txD(a)).localeCompare(String(txD(b))));
    const txRows = (kinds, extra) => [["التاريخ", "النوع", "البيان", "الطرف", "المبلغ", "الخزنة", "ملاحظة", "صورة", ...(extra ? extra.h : [])], ...TX(kinds).map((t) => [t.date || dayKey(t.created_at), (KINDS[t.kind] || t.kind).replace(/^\S+ /, ""), t.category || "", t.party_name || t.party || "", n3(t.amount), BOX[t.box || "drawer"].replace(/^\S+ /, ""), t.note || "", t.attachment || "", ...(extra ? extra.f(t) : [])])];
    add("كل الحركات", txRows(Object.keys(KINDS)));
    add("المبيعات اليدوية", txRows(["sale", "income"], { h: ["طريقة الدفع"], f: (t) => [(PAY[t.category] || "").replace(/^\S+ /, "")] }));
    add("المصاريف", txRows(["expense"]));
    add("المشتريات", txRows(["purchase", "supplier_paid"]));
    add("سندات القبض", [["رقم السند", "التاريخ", "العميل", "الهاتف", "المبلغ", "الطريقة", "استلمها", "ملاحظة"], ...TX(["receivable_paid"]).map((t) => [t.receipt_no || "", t.date || dayKey(t.created_at), t.party_name || "", t.party || "", n3(t.amount), t.category === "discount" ? "خصم مبكر" : t.category === "topup" ? "شحن رصيد" : t.method === "knet" ? "كي نت" : "كاش", pn(t.collected_by), t.note || ""])]);
    add("العملاء", [["العميل", "الهاتف", "اشترى بـ", "دفع", "عليه", "الحد", "متأخر (يوم)", "التقييم"], ...custList().map(custCollect).map((c) => [c.name || "", c.phone, n3(c.bought), n3(c.paid), n3(c.bal), c.lim != null ? n3(c.lim) : "", c.late || "", RATE[c.rate][1]])]);
    add("الموردين", [["المورد", "الهاتف", "رصيد سابق", "اشتريت", "دفعت", "عليك", "يوم الدفع"], ...(A.sups || []).map((x) => { const st = supStats(x.id); return [x.name, x.phone || "", n3(st.open), n3(st.bought), n3(st.paid), n3(st.bal), x.pay_day || ""]; })]);
    add("المخزون", [["المنتج", "الوحدة", "الموجود", "حد التنبيه", "تكلفة الوحدة", "القيمة"], ...A.products.filter((p) => p.stock != null).map((p) => [p.name_ar, p.unit_ar || "", n3(p.stock), n3(p.low_stock), p.cost != null ? n3(p.cost) : "", n3(Math.max(0, num(p.stock)) * num(p.cost))])]);
    add("حركات المخزون", [["التاريخ", "المنتج", "الحركة", "الكمية", "الرصيد بعدها", "التكلفة", "ملاحظة"], ...(A.moves || []).filter((m) => inF(m.created_at)).map((m) => [dayKey(m.created_at), m.product_name || "", (MV[m.kind] || m.kind).replace(/^\S+ /, ""), n3(m.qty), n3(m.balance), m.cost != null ? n3(m.cost) : "", m.note || ""])]);
    add("ربح الأصناف", (() => { const mp = new Map(); F.ords.forEach((o) => (o.items || []).forEach((i) => { const p = A.products.find((q) => q.id === i.id), r = mp.get(i.id) || [i.name_ar, 0, 0, 0]; r[1] += num(i.qty); r[2] += num(i.price) * num(i.qty); r[3] += num(p && p.cost) * num(i.qty); mp.set(i.id, r); })); return [["الصنف", "الكمية", "المبيعات", "التكلفة", "الربح", "الهامش %"], ...[...mp.values()].map((r) => [r[0], n3(r[1]), n3(r[2]), n3(r[3]), n3(r[2] - r[3]), r[2] ? Math.round(((r[2] - r[3]) / r[2]) * 100) : 0])]; })());
    add("المناديب", [["المندوب", "توصيلات", "كاش طلبات", "حصّل آجل", "سلّم", "مصاريف", "معاه دلوقتي", "أرباح", "اتصرفله"], ...A.profiles.filter((p) => p.role === "driver").map((p) => { const w = dCash(p.id); return [p.full_name || "", w.del.length, n3(w.ordCash), n3(w.collect), n3(w.hand), n3(w.exp), n3(w.cashWith), n3(w.earn), n3(w.paid)]; })]);
    add("حركات المناديب", [["التاريخ", "المندوب", "الحركة", "المبلغ", "النوع", "ملاحظة"], ...(A.dmoves || []).filter((m) => inF(m.created_at)).map((m) => [dayKey(m.created_at), pn(m.driver_id), ({ payout: "صرف أرباح", handover: "سلّم كاش", expense: "مصروف", collect: "حصّل آجل", commission: "عمولة" })[m.kind] || m.kind, n3(m.amount), m.category || "", m.note || ""])]);
    add("الرواتب والسلف", [["التاريخ", "الموظف", "النوع", "المبلغ", "ملاحظة"], ...TX(["salary", "advance"]).map((t) => [t.date || dayKey(t.created_at), t.party_name || "", t.kind === "salary" ? "راتب" : "سلفة", n3(t.amount), t.note || ""])]);
    add("الموظفين", [["الاسم", "الوظيفة", "الهاتف", "الراتب", "يوم القبض", "شغّال"], ...(A.emps || []).map((e) => [e.name, e.role || "", e.phone || "", n3(e.salary), e.pay_day || "", e.active !== false ? "أيوه" : "لأ"])]);
    add("مصاريف ثابتة", [["الاسم", "النوع", "المبلغ", "اليوم", "الخزنة", "شغّال"], ...(A.recs || []).map((r) => [r.name, r.category || "", n3(r.amount), r.day, BOX[r.box || "drawer"].replace(/^\S+ /, ""), r.active !== false ? "أيوه" : "لأ"])]);
    add("الخزن", [["التاريخ", "الخزنة", "البيان", "داخل", "خارج"], ...boxFlows().filter((x) => inF(x.d)).sort((a, b) => new Date(a.d) - new Date(b.d)).map((x) => [dayKey(x.d), BOX[x.box].replace(/^\S+ /, ""), x.l, x.a > 0 ? n3(x.a) : "", x.a < 0 ? n3(-x.a) : ""])]);
    add("إقفال الأيام", [["اليوم", "المفروض كاش", "اتعدّ", "الفرق", "كي نت مفروض", "كي نت البنك", "ملاحظة"], ...(A.dcloses || []).filter((c) => inF(c.day + "T12:00:00")).map((c) => [c.day, n3(c.expected_cash), n3(c.counted_cash), n3(num(c.counted_cash) - num(c.expected_cash)), n3(c.expected_knet), c.bank_knet != null ? n3(c.bank_knet) : "", c.note || ""])]);
    add("السحب والشركاء", [["التاريخ", "الاسم", "المبلغ", "ملاحظة"], ...TX(["drawing"]).map((t) => [t.date || dayKey(t.created_at), t.party_name || "", n3(t.amount), t.note || ""])]);
    add("الشهور", [["الشهر", "المبيعات", "المشتريات", "المصاريف", "الرواتب", "الهالك", "الربح"], ...[...Array(12)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const mk = monthKey(d), f = figs((x) => inMonth(x, mk)); return [mkLabel(mk), n3(f.sales), n3(f.purch), n3(f.exp), n3(f.sal), n3(f.waste), n3(f.profit)]; })]);
    if (A.me.role === "admin" && (A.alog || []).length) add("سجل التعديلات", [["الوقت", "مين", "العملية", "الجدول", "قبل", "بعد", "الطرف", "ملاحظة"], ...A.alog.map((r) => [new Date(r.at).toLocaleString("ar-KW"), r.actor_name || "", r.action, r.tbl, r.amount_old != null ? n3(r.amount_old) : "", r.amount_new != null ? n3(r.amount_new) : "", (r.info || {}).party || "", (r.info || {}).note || ""])]);
    XLSX.writeFile(wb, `Goten-${all ? "backup" : "accounts"}-${dayKey(new Date())}.xlsx`);
    toast("✅ الملف اتنزّل");
  }
  // =================== 🧮 أداة التسعير والتوقعات ===================
  const PR_DEF = { days: 60, overhead: "", varOrder: 0.5, knet: 1, waste: 3, target: 900, orders: "", aov: "", margin: "", mkt: 0, ofCost: 6, ofPcs: 10, ofW: 0.35, ofExtra: 1, ofProfit: 5 };
  const prGet = () => ({ ...PR_DEF, ...(A.settings.pricing || {}), ...(A.prLocal || {}) });
  // البيانات الحقيقية من التطبيق للفترة
  function prData(days) {
    const now = Date.now(), D = 86400000, since = now - days * D, inW = (d) => d && new Date(d).getTime() >= since;
    const del = A.orders.filter((o) => o.status === "delivered" && inW(o.delivered_at || o.created_at));
    let rev = 0, cost = 0, revC = 0;
    del.forEach((o) => (o.items || []).forEach((i) => { const p = A.products.find((q) => q.id === i.id), r = num(i.price) * num(i.qty); rev += r; if (p && p.cost != null) { cost += num(p.cost) * num(i.qty); revC += r; } }));
    const tx = A.tx.filter((t) => inW(txD(t))), s = (k) => sum(tx.filter((t) => t.kind === k));
    const months = days / 30.4;
    const ohTx = (s("expense") + s("salary")) / months;
    const ohFixed = sum((A.recs || []).filter((r) => r.active !== false)) + sum((A.emps || []).filter((e) => e.active !== false), (e) => e.salary);
    const waste = (A.moves || []).filter((m) => m.kind === "waste" && inW(m.created_at)).reduce((a, m) => { const p = A.products.find((q) => q.id === m.product_id); return a + Math.abs(num(m.qty)) * num(m.cost != null ? m.cost : p && p.cost); }, 0);
    const drv = sum(del, (o) => o.driver_earning);
    // اتجاه الطلب: آخر 30 يوم مقابل الـ 30 اللي قبلها
    const all = A.orders.filter((o) => o.status === "delivered"), cnt = (a, b) => all.filter((o) => { const t = new Date(o.delivered_at || o.created_at).getTime(); return t >= now - a * D && t < now - b * D; });
    const l30 = cnt(30, 0), p30 = cnt(60, 30);
    const growth = p30.length >= 5 ? Math.max(-0.5, Math.min(0.5, (l30.length - p30.length) / p30.length)) : null;
    const phones = new Map(); all.forEach((o) => phones.set(o.phone, (phones.get(o.phone) || 0) + 1));
    const repeat = phones.size ? [...phones.values()].filter((n) => n > 1).length / phones.size : null;
    // أيام الأسبوع
    const wd = [0, 0, 0, 0, 0, 0, 0]; del.forEach((o) => wd[new Date(o.delivered_at || o.created_at).getDay()]++);
    return { n: del.length, rev, cost, revC, gm: revC ? (revC - cost) / revC : null, aov: del.length ? rev / del.length : null, ordersMonth: del.length / months, ohTx, ohFixed, wastePct: cost ? waste / cost : null, drvPer: del.length ? drv / del.length : null, growth, l30: l30.length, repeat, wd };
  }
  const pct = (x, d = 1) => (x == null || !isFinite(x) ? "—" : (x * 100).toFixed(d) + "%");
  function prCompute(I, R) {
    const ordersBase = num(I.orders) || R.ordersMonth || 0, aov = num(I.aov) || R.aov || 0;
    const overhead = I.overhead !== "" && I.overhead != null ? num(I.overhead) : Math.max(R.ohTx, R.ohFixed);
    const varPct = (num(I.knet) + num(I.waste)) / 100, varOrder = num(I.varOrder);
    const mkt = num(I.mkt) / 100;
    const scen = (k, oMul, cMul) => {
      const N = ordersBase * oMul, S = N * aov;
      const need = S ? (overhead + num(I.target) + N * varOrder) / S + varPct : null; // هامش مطلوب من سعر البيع
      const be = S ? (overhead + N * varOrder) / S + varPct : null; // نقطة التعادل
      const gm = num(I.margin) ? num(I.margin) / 100 : R.gm; // الهامش الحالي
      const gmAfter = gm != null ? 1 - (1 - gm) * (1 + mkt) * cMul : null; // بعد تغير تكلفة السوق
      const profit = gmAfter != null ? S * (gmAfter - varPct) - N * varOrder - overhead : null;
      return { k, N, S, need, be, gm: gmAfter, profit, ownerDay: profit != null ? profit / 30 : null };
    };
    const g = R.growth != null ? R.growth : 0;
    return { overhead, ordersBase, aov, varPct, varOrder, S: [scen("😟 متشائم", (1 + g) * 0.8, 1.1), scen("🙂 متوقع", 1 + g, 1), scen("😃 متفائل", (1 + g) * 1.2, 0.95)] };
  }
  function pricingPage() {
    const I = prGet(), R = prData(num(I.days) || 60), C = prCompute(I, R);
    const inp = (k, lab, hint, step = "0.001") => `<label class="f"><span>${lab}</span><input class="in" data-pr="${k}" type="number" inputmode="decimal" step="${step}" value="${I[k] === "" || I[k] == null ? "" : I[k]}" placeholder="${hint || ""}"></label>`;
    const fromApp = (v, f = money) => (v == null || !isFinite(v) ? "مفيش بيانات لسه" : "من التطبيق: " + f(v));
    const noData = R.n < 5;
    return `<div class="card"><div class="h2">🧮 أداة التسعير والتوقعات</div>
      <p class="mut" style="font-size:13px">بتحسبلك أقل نسبة ربح تغطي التكاليف والمصاريف، والنسبة اللي توصّلك لربحك كصاحب المؤسسة، وتوقعات الشهر الجاي حسب حركة الزباين وتغيّر أسعار السوق.</p>
      ${noData ? `<p class="notice">📌 لسه الطلبات المسلّمة قليلة (${R.n})، فالحسبة ماشية على الأرقام اللي هتكتبها. كل ما الطلبات تزيد، الأداة هتاخد أرقامك الحقيقية من التطبيق لوحدها.</p>` : ""}
      <div class="filters">${[30, 60, 90].map((d) => `<button class="${num(I.days) === d ? "on" : ""}" data-prdays="${d}">آخر ${d} يوم</button>`).join("")}</div></div>

      <div class="card"><div class="h2">📊 أرقامك من التطبيق (آخر ${num(I.days)} يوم)</div>
        <div class="stats">
          <div class="stat"><span class="mut">طلبات مسلّمة</span><b>${R.n}</b></div>
          <div class="stat"><span class="mut">مبيعات الأصناف</span><b>${money(R.rev)}</b></div>
          <div class="stat"><span class="mut">متوسط الطلب</span><b>${R.aov ? money(R.aov) : "—"}</b></div>
          <div class="stat"><span class="mut">هامشك الحالي</span><b>${pct(R.gm)}</b></div>
          <div class="stat"><span class="mut">نمو الطلبات (30 يوم)</span><b>${R.growth == null ? "—" : (R.growth >= 0 ? "▲ " : "▼ ") + pct(Math.abs(R.growth), 0)}</b></div>
          <div class="stat"><span class="mut">زباين بيرجعوا</span><b>${pct(R.repeat, 0)}</b></div>
        </div>
        ${R.revC < R.rev ? `<p class="mut" style="font-size:12px">⚠️ فيه أصناف اتباعت ومالهاش تكلفة متسجلة، فالهامش محسوب على اللي ليه تكلفة بس. سجّل التكلفة من 🐟 المنتجات.</p>` : ""}
        ${R.n >= 7 ? `<p class="mut" style="font-size:12px">📅 أكتر أيام بيع: ${["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"].map((n, i) => [n, R.wd[i]]).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]).join(" و")} – خلي عروضك القوية فيهم.</p>` : ""}
      </div>

      <div class="card"><div class="h2">⚙️ الافتراضات (عدّلها براحتك)</div>
        <div class="row2">${inp("target", "🎯 ربحك المستهدف في الشهر (د.ك)", "900")}${inp("overhead", "🏢 المصاريف الثابتة في الشهر", `${fromApp(Math.max(R.ohTx, R.ohFixed))}`)}</div>
        <div class="row2">${inp("orders", "🧾 طلبات متوقعة في الشهر", `${fromApp(R.ordersMonth, (v) => Math.round(v))}`, "1")}${inp("aov", "💳 متوسط قيمة الطلب", `${fromApp(R.aov)}`)}</div>
        <div class="row2">${inp("varOrder", "🛵 تكلفة متغيرة لكل طلب (توصيل، تغليف)", R.drvPer != null ? "المندوب: " + money(R.drvPer) : "")}${inp("margin", "📈 هامشك الحالي % (لو فاضي ياخد من التطبيق)", pct(R.gm), "0.1")}</div>
        <div class="row2">${inp("knet", "💳 عمولة كي نت %", "", "0.1")}${inp("waste", "🗑️ الهالك % من المبيعات", R.wastePct != null ? "من التطبيق: " + pct(R.wastePct) : "", "0.1")}</div>
        ${inp("mkt", "🌊 تغيّر أسعار السوق المتوقع % (موجب = البضاعة هتغلى)", "مثلاً 10", "1")}
        <p class="mut" style="font-size:12px">المصاريف الثابتة من التطبيق = الأكبر بين متوسط مصاريفك ورواتبك الفعلية، ومجموع المصاريف الثابتة والرواتب المسجلة. الأرقام بتتحفظ لما تدوس حفظ.</p>
        <button class="btn sm tq" data-prsave>💾 حفظ الافتراضات</button>
      </div>
      <div id="prOut">${prOut(I, R, C)}</div>
      <div class="card"><div class="h2">🐟 حاسبة العرض</div>
        <div class="row2">${inp("ofCost", "تكلفة الكيلو", "6")}${inp("ofPcs", "عدد الحبات", "10", "1")}</div>
        <div class="row2">${inp("ofW", "أقصى وزن للحبة (كيلو)", "0.35")}${inp("ofExtra", "توصيل/كي نت للطلب", "1")}</div>
        ${inp("ofProfit", "الربح اللي عايزه في الطلب", "5")}
        <div id="prOffer">${prOffer(I, C)}</div>
      </div>`;
  }
  function prOut(I, R, C) {
    const E = C.S[1];
    const mk = (m) => (m != null && m < 1 ? pct(m / (1 - m)) : "—");
    const pctN = (x) => (x != null && x >= 0.95 ? "مش واقعي (أكتر من 95%)" : pct(x));
    const status = E.gm == null || E.need == null ? "" : E.be >= 0.95 ? `<p class="notice" style="background:#fee2e2;color:#991b1b">🚨 مصاريفك الثابتة كبيرة على حجم مبيعاتك الحالي، ورفع السعر لوحده مش هيغطيها. الحل الأساسي إنك تزوّد عدد الطلبات (شوف «طلبات محتاجها» تحت) أو تقلل المصاريف.</p>` : E.gm >= E.need ? `<p class="notice" style="background:#dcfce7;color:#166534">✅ هامشك الحالي ${pct(E.gm)} أعلى من المطلوب ${pct(E.need)} – انت ماشي للهدف.</p>` : E.gm >= E.be ? `<p class="notice" style="background:#fef9c3;color:#854d0e">⚠️ انت مغطّي مصاريفك (التعادل ${pct(E.be)}) بس مش هتوصل للهدف. ${E.need >= 0.95 ? "الهدف ده محتاج طلبات أكتر، مش سعر أعلى بس." : `محتاج تزوّد الهامش ${pct(E.need - E.gm)} أو تزود الطلبات.`}</p>` : `<p class="notice" style="background:#fee2e2;color:#991b1b">🚨 هامشك ${pct(E.gm)} أقل من نقطة التعادل ${pct(E.be)} – كده بتخسر. لازم ترفع الأسعار أو تقلل المصاريف.</p>`;
    const needOrders = (() => { const gm = E.gm; if (gm == null || !C.aov) return null; const per = C.aov * (gm - C.varPct) - C.varOrder; return per > 0 ? (C.overhead + num(I.target)) / per : null; })();
    const prods = A.products.filter((p) => p.cost != null && num(p.cost) > 0 && p.active !== false);
    const m = E.need;
    return `<div class="card"><div class="h2">🎯 النتيجة</div>${status}
      <div class="stats">
        <div class="stat"><span class="mut">هامش التعادل (تغطي المصاريف بس)</span><b>${pctN(E.be)}</b><small class="mut">زيادة على التكلفة ${mk(E.be)}</small></div>
        <div class="stat"><span class="mut">الهامش اللي يوصّلك لهدفك</span><b style="color:#0e7490">${pctN(E.need)}</b><small class="mut">زيادة على التكلفة ${mk(E.need)}</small></div>
        <div class="stat"><span class="mut">ربحك المتوقع الشهر الجاي</span><b style="color:${(E.profit || 0) >= 0 ? "#16a34a" : "#dc2626"}">${E.profit == null ? "—" : money(E.profit)}</b><small class="mut">${E.ownerDay == null ? "" : "يعني " + money(E.ownerDay) + " في اليوم"}</small></div>
        <div class="stat"><span class="mut">طلبات محتاجها في الشهر للهدف</span><b>${needOrders ? Math.ceil(needOrders) : "—"}</b><small class="mut">${needOrders ? "حوالي " + Math.ceil(needOrders / 30) + " في اليوم" : ""}</small></div>
      </div>
      <p class="mut" style="font-size:12px">«الهامش» = الربح ÷ سعر البيع. «الزيادة على التكلفة» = اللي بتضيفه على سعر الشراء. مثال: تكلفة 6 وهامش 25% ← السعر 8.</p></div>
      <div class="card"><div class="h2">🔮 التوقعات للشهر الجاي</div>
      <p class="mut" style="font-size:12px">مبنية على حركة طلباتك آخر 30 يوم${R.growth != null ? ` (${R.growth >= 0 ? "زيادة" : "نقص"} ${pct(Math.abs(R.growth), 0)})` : ""}، وتغيّر السوق اللي كتبته. المتشائم: طلبات أقل 20% والبضاعة أغلى 10%. المتفائل: طلبات أكتر 20% والبضاعة أرخص 5%.</p>
      <div class="list">${C.S.map((s) => `<div class="it"><div class="t"><b>${s.k}</b><span class="mut">${Math.round(s.N)} طلب · مبيعات ${money(s.S)} · هامش ${pct(s.gm)}</span><span class="mut" style="font-size:12px">المطلوب للهدف ${pctN(s.need)} · التعادل ${pctN(s.be)}</span></div><b style="color:${(s.profit || 0) >= 0 ? "#16a34a" : "#dc2626"}">${s.profit == null ? "—" : money(s.profit)}</b></div>`).join("")}</div></div>
      <div class="card"><div class="h2">🏷️ الأسعار المقترحة للأصناف</div>
      ${!prods.length ? `<p class="mut">سجّل «التكلفة» لكل منتج من 🐟 المنتجات علشان أقترحلك سعره.</p>` : m == null || m >= 0.95 ? `<p class="mut">كمّل الافتراضات فوق علشان أحسب السعر المقترح.</p>` : `<div class="list">${prods.map((p) => { const c = num(p.cost) * (1 + num(I.mkt) / 100), sug = Math.ceil((c / (1 - m)) * 4) / 4, cur = num(p.price), cm = cur ? (cur - c) / cur : null; return `<div class="it"><div class="t"><b>${esc(p.name_ar)}</b><span class="mut">التكلفة ${money(c)} · السعر الحالي ${money(cur)} (هامش ${pct(cm)})</span></div><div style="text-align:left"><b style="color:${cur >= sug ? "#16a34a" : "#b45309"}">${money(sug)}</b>${Math.abs(cur - sug) > 0.001 ? `<br><button class="btn sm ghost" data-prapply="${p.id}" data-prv="${sug}">اعتمد</button>` : ""}</div></div>`; }).join("")}</div><p class="mut" style="font-size:12px">السعر المقترح متقرّب لأقرب ربع دينار، ومحسوب على الهامش اللي يوصّلك لهدفك.</p>`}</div>`;
  }
  function prOffer(I, C) {
    const w = num(I.ofPcs) * num(I.ofW), cost = w * num(I.ofCost) + num(I.ofExtra), price = Math.ceil((cost + num(I.ofProfit)) * 4) / 4;
    const avgW = num(I.ofPcs) * (num(I.ofW) - 0.025), m = price ? (price - cost) / price : 0;
    if (!w) return "";
    return `<div class="line"><span>الوزن (أقصى)</span><b>${fq(w)} كيلو</b></div><div class="line"><span>التكلفة الكاملة</span><b>${money(cost)}</b></div>
      <div class="line"><span>💰 سعر العرض</span><b style="color:#0e7490;font-size:20px">${money(price)}</b></div>
      <div class="line"><span>الكيلو على الزبون</span><b>~ ${money(price / (avgW > 0 ? avgW : w))}</b></div>
      <div class="line"><span>ربحك</span><b style="color:#16a34a">${money(price - cost)} (هامش ${pct(m)})</b></div>
      ${C.S[1].need != null ? `<p class="mut" style="font-size:12px">${m >= C.S[1].need ? "✅ العرض ده فوق الهامش المطلوب لهدفك." : "ℹ️ هامش العرض أقل من المطلوب لهدفك – كويس كعرض لجذب زباين جداد، بس ماتعتمدش عليه طول الوقت."}</p>` : ""}`;
  }
  function prRecalc() {
    const I = prGet(), R = prData(num(I.days) || 60), C = prCompute(I, R);
    const o = document.getElementById("prOut"); if (o) o.innerHTML = prOut(I, R, C);
    const f = document.getElementById("prOffer"); if (f) f.innerHTML = prOffer(I, C);
  }
  document.addEventListener("input", (e) => { const k = e.target && e.target.dataset && e.target.dataset.pr; if (!k) return; A.prLocal = { ...(A.prLocal || {}), [k]: e.target.value === "" ? "" : num(e.target.value) }; prRecalc(); });
  // =================== 📥 استيراد Excel (يصحّح الحسابات) + تراجع ===================
  const YN = (v) => (v === true ? "أيوه" : v === false ? "لأ" : "");
  const isYes = (v) => /^(أيوه|ايوه|نعم|yes|true|1|✓)$/i.test(String(v == null ? "" : v).trim());
  const clean = (s) => String(s == null ? "" : s).replace(/^\S*[\u{1F300}-\u{1FAFF}☀-➿]\S*\s+/u, "").trim();
  const labelOf = (map, k) => clean(map[k] || k || "");
  const keyOf = (map, v) => { const s = String(v == null ? "" : v).trim(); if (!s) return null; if (map[s] !== undefined) return s; const f = Object.keys(map).find((k) => clean(map[k]) === s || map[k] === s); return f || undefined; };
  const DMK = { handover: "سلّم كاش", payout: "صرف أرباح", expense: "مصروف", collect: "حصّل آجل", commission: "عمولة" };
  const METH = { cash: "كاش", knet: "كي نت" };
  function toDay(v) {
    if (v == null || v === "") return null;
    if (v instanceof Date && !isNaN(v)) return dayKey(v);
    if (typeof v === "number" && v > 20000 && v < 80000) return dayKey(new Date(Math.round((v - 25569) * 86400000) + 12 * 3600000));
    const s = String(v).trim().replace(/\//g, "-"); let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return undefined;
  }
  const nOrNull = (v) => (v === "" || v == null ? null : isNaN(Number(String(v).replace(/,/g, ""))) ? undefined : Number(String(v).replace(/,/g, "")));
  const sOrNull = (v) => (v === "" || v == null ? null : String(v).trim() || null);
  const iOrNull = (v) => { const n = nOrNull(v); return n == null ? n : Math.round(n); };
  // تعريف كل شيت: اسمه، الجدول، المفتاح، والأعمدة [العنوان، الحقل، من الداتا للشيت، من الشيت للداتا]
  function impDefs() {
    const pn = (id) => (A.profiles.find((p) => p.id === id) || {}).full_name || "";
    const drvId = (v) => { const s = String(v || "").trim(); if (!s) return undefined; const p = A.profiles.find((x) => x.id === s || (x.full_name || "").trim() === s); return p ? p.id : undefined; };
    const supN = (id) => ((A.sups || []).find((x) => x.id === id) || {}).name || "";
    const supId = (v) => { const s = String(v || "").trim(); if (!s) return null; const x = (A.sups || []).find((y) => y.id === s || y.name.trim() === s); return x ? x.id : undefined; };
    const empN = (id) => ((A.emps || []).find((x) => x.id === id) || {}).name || "";
    const empId = (v) => { const s = String(v || "").trim(); if (!s) return null; const x = (A.emps || []).find((y) => y.id === s || y.name.trim() === s); return x ? x.id : undefined; };
    const box = [ "الخزنة", "box", (r) => labelOf(BOX, r.box || "drawer"), (v) => keyOf(BOX, v) || (String(v || "").trim() ? undefined : "drawer")];
    return [
      { sh: "الموردين", t: "suppliers", k: "id", rows: () => A.sups || [], cols: [["الاسم", "name", (r) => r.name, sOrNull, 1], ["الهاتف", "phone", (r) => r.phone || "", sOrNull], ["رصيد سابق", "opening_balance", (r) => num(r.opening_balance), (v) => nOrNull(v) ?? 0], ["يوم الدفع", "pay_day", (r) => r.pay_day || "", iOrNull], ["مدة السداد (يوم)", "terms_days", (r) => r.terms_days || "", iOrNull], ["ملاحظة", "note", (r) => r.note || "", sOrNull]] },
      { sh: "الموظفين", t: "employees", k: "id", rows: () => A.emps || [], cols: [["الاسم", "name", (r) => r.name, sOrNull, 1], ["الوظيفة", "role", (r) => r.role || "", sOrNull], ["الهاتف", "phone", (r) => r.phone || "", sOrNull], ["الراتب", "salary", (r) => num(r.salary), (v) => nOrNull(v) ?? 0], ["يوم القبض", "pay_day", (r) => r.pay_day || 1, (v) => iOrNull(v) ?? 1], ["شغّال", "active", (r) => YN(r.active !== false), (v) => (String(v || "").trim() ? isYes(v) : true)]] },
      { sh: "مصاريف ثابتة", t: "recurring", k: "id", rows: () => A.recs || [], cols: [["الاسم", "name", (r) => r.name, sOrNull, 1], ["النوع", "category", (r) => r.category || "", sOrNull], ["المبلغ", "amount", (r) => num(r.amount), nOrNull, 1], ["اليوم (1-28)", "day", (r) => r.day || 1, (v) => iOrNull(v) ?? 1], box, ["شغّال", "active", (r) => YN(r.active !== false), (v) => (String(v || "").trim() ? isYes(v) : true)]] },
      { sh: "العملاء", t: "customers", k: "phone", rows: () => A.imported || [], cols: [["الاسم", "name", (r) => r.name || "", sOrNull], ["المنطقة", "area", (r) => r.area || "", sOrNull]] },
      { sh: "حدود العملاء", t: "customer_meta", k: "phone", rows: () => A.cmeta || [], cols: [["حد الآجل", "credit_limit", (r) => (r.credit_limit != null ? num(r.credit_limit) : ""), nOrNull], ["مدة السداد (يوم)", "terms_days", (r) => r.terms_days || "", iOrNull], ["مؤرشف", "archived", (r) => YN(!!r.archived), isYes], ["ملاحظة", "note", (r) => r.note || "", sOrNull]] },
      { sh: "الحركات", t: "transactions", k: "id", rows: () => A.tx, cols: [["التاريخ", "date", (r) => r.date || dayKey(r.created_at), (v) => toDay(v) ?? dayKey(new Date()), 0, "date"], ["النوع", "kind", (r) => labelOf(KINDS, r.kind), (v) => keyOf(KINDS, v), 1], ["البيان / التصنيف", "category", (r) => r.category || "", sOrNull], ["الطرف", "party_name", (r) => r.party_name || "", sOrNull], ["هاتف الطرف", "party", (r) => r.party || "", sOrNull], ["المبلغ", "amount", (r) => num(r.amount), nOrNull, 1], box, ["الطريقة", "method", (r) => labelOf(METH, r.method) || "", (v) => (String(v || "").trim() ? keyOf(METH, v) : null)], ["المورد", "supplier_id", (r) => supN(r.supplier_id), supId], ["الموظف", "employee_id", (r) => empN(r.employee_id), empId], ["رقم السند", "receipt_no", (r) => r.receipt_no || "", iOrNull], ["ملاحظة", "note", (r) => r.note || "", sOrNull]] },
      { sh: "حركات المناديب", t: "driver_moves", k: "id", rows: () => A.dmoves || [], cols: [["التاريخ", "created_at", (r) => dayKey(r.created_at), (v) => toDay(v), 1, "ts"], ["المندوب", "driver_id", (r) => pn(r.driver_id), drvId, 1], ["الحركة", "kind", (r) => DMK[r.kind] || r.kind, (v) => keyOf(DMK, v), 1], ["المبلغ", "amount", (r) => num(r.amount), nOrNull, 1], ["النوع", "category", (r) => r.category || "", sOrNull], ["ملاحظة", "note", (r) => r.note || "", sOrNull]] },
      { sh: "إقفال الأيام", t: "day_closes", k: "day", rows: () => A.dcloses || [], cols: [["المفروض كاش", "expected_cash", (r) => num(r.expected_cash), nOrNull], ["اتعدّ", "counted_cash", (r) => num(r.counted_cash), nOrNull], ["كي نت مفروض", "expected_knet", (r) => num(r.expected_knet), nOrNull], ["كي نت البنك", "bank_knet", (r) => (r.bank_knet != null ? num(r.bank_knet) : ""), nOrNull], ["ملاحظة", "note", (r) => r.note || "", sOrNull]] }
    ];
  }
  const KEYH = { id: "🔒 رقم داخلي (سيبه زي ما هو – فاضي للجديد)", phone: "الهاتف (مفتاح)", day: "اليوم (مفتاح)" };
  async function exportEditable() {
    toast("⏳ بجهّز ملف التعديل…"); try { await loadXLSX(); } catch (e) { return toast(e.message, "err"); }
    const wb = XLSX.utils.book_new();
    const help = [["📥 ملف الحسابات للتعديل – Goten"], [], ["1) عدّل الأرقام الغلط أو ضيف سطور جديدة أو امسح سطور."], ["2) السطر الجديد: سيب عمود «رقم داخلي» فاضي."], ["3) متغيّرش أسماء الشيتات ولا العناوين في أول سطر."], ["4) الشيت اللي تمسحه من الملف مش هيتلمس. لكن جوّه أي شيت، السطر اللي تمسحه هيتمسح من التطبيق."], ["5) ارفع الملف من «📥 استيراد Excel»، وهيوريك قبل ما يحفظ هيضيف/يعدّل/يمسح كام."], ["6) لو حاجة طلعت غلط: «↩️ سجل الاستيراد» ← تراجع، وكل حاجة ترجع زي ما كانت."], [], ["الأنواع المتاحة في الحركات:", Object.values(KINDS).map(clean).join(" / ")], ["الخزنة:", Object.values(BOX).map(clean).join(" / ")], ["حركات المناديب:", Object.values(DMK).join(" / ")], ["التواريخ:", "بالشكل 2026-11-27"], [], ["اتعمل:", new Date().toLocaleString("ar-KW")]];
    const addS = (name, rows) => { const ws = XLSX.utils.aoa_to_sheet(rows); ws["!cols"] = (rows[0] || []).map((_, i) => ({ wch: Math.min(45, Math.max(12, ...rows.slice(0, 200).map((r) => String(r[i] == null ? "" : r[i]).length + 2))) })); ws["!views"] = [{ RTL: true }]; XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); };
    addS("اقرأني", help);
    for (const D of impDefs()) {
      const head = [KEYH[D.k], ...D.cols.map((c) => c[0])];
      const keyVal = (r) => (D.k === "day" ? r.day : D.k === "phone" ? r.phone : r.id);
      addS(D.sh, [head, ...D.rows().map((r) => [keyVal(r), ...D.cols.map((c) => c[2](r))])]);
    }
    XLSX.writeFile(wb, `Goten-تعديل-الحسابات-${dayKey(new Date())}.xlsx`); toast("✅ الملف اتنزّل – عدّله وارفعه");
  }
  function same(a, b) { const n = (v) => (v === undefined || v === "" ? null : typeof v === "number" ? Math.round(v * 1000) / 1000 : v); const x = n(a), y = n(b); if (x == null && y == null) return true; if (typeof x === "number" || typeof y === "number") return Number(x) === Number(y); return String(x) === String(y); }
  async function importXlsx(file) {
    toast("⏳ بقرا الملف…"); try { await loadXLSX(); } catch (e) { return toast(e.message, "err"); }
    let wb; try { wb = XLSX.read(await file.arrayBuffer(), { cellDates: true }); } catch (e) { return toast("الملف ده مش Excel سليم", "err"); }
    const P = {}, plan = [], errs = [], uidG = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16)));
    for (const D of impDefs()) {
      const ws = wb.Sheets[D.sh]; if (!ws) continue;
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      const head = (aoa[0] || []).map((h) => String(h).trim());
      const ix = (h) => head.indexOf(h), kI = head.findIndex((h) => h === KEYH[D.k] || h.startsWith("🔒") || h.startsWith("الهاتف") || h.startsWith("اليوم (مفتاح"));
      if (kI < 0) { errs.push(`شيت «${D.sh}»: عمود المفتاح مش موجود في أول سطر`); continue; }
      const old = new Map(D.rows().map((r) => [String(r[D.k]), r])), out = [], seen = new Set(); let add = 0, edit = 0;
      aoa.slice(1).forEach((row, ri) => {
        if (!row.some((v) => String(v).trim() !== "")) return;
        const at = `«${D.sh}» سطر ${ri + 2}`;
        let key = row[kI];
        if (D.k === "day") { key = toDay(key); if (!key) return errs.push(`${at}: اليوم مش مكتوب صح`); }
        else if (D.k === "phone") { key = normPh(String(key)); if (!key || key.length < 8) return errs.push(`${at}: رقم الهاتف غلط`); }
        else key = String(key || "").trim();
        if (D.k === "id" && key && !old.has(key)) return errs.push(`${at}: «رقم داخلي» مش موجود – امسحه لو السطر جديد`);
        if (key && seen.has(key)) return errs.push(`${at}: السطر ده متكرر`);
        const base = (key && old.get(key)) || null, rec = base ? { ...base } : {};
        let changed = !base;
        for (const c of D.cols) {
          const i = ix(c[0]); if (i < 0) continue;
          const v = c[3](row[i]);
          if (v === undefined || (c[4] && (v == null || v === ""))) { errs.push(`${at}: «${c[0]}» قيمته غلط أو فاضية (${String(row[i]).slice(0, 25) || "فاضي"})`); continue; }
          if (c[5] === "ts") { if (base && dayKey(base.created_at) === v) continue; rec[c[1]] = v + "T12:00:00+03:00"; changed = true; continue; }
          if (!same(rec[c[1]], v)) { rec[c[1]] = v; if (base) changed = true; }
        }
        if (D.t === "transactions" && num(rec.amount) < 0) errs.push(`${at}: المبلغ لازم يبقى موجب`);
        if ((D.t === "driver_moves" || D.t === "recurring") && !(num(rec.amount) > 0)) errs.push(`${at}: المبلغ لازم يبقى أكبر من صفر`);
        if (D.t === "recurring" && (rec.day < 1 || rec.day > 28)) errs.push(`${at}: اليوم لازم من 1 لـ 28`);
        if (!key) { key = uidG(); rec.created_at = rec.created_at || new Date().toISOString(); }
        rec[D.k] = key; if (D.t === "customers" && !base) rec.source = "import";
        seen.add(key); out.push(rec); if (!base) add++; else if (changed) edit++;
      });
      const del = [...old.keys()].filter((k) => !seen.has(k)).length;
      P[D.t] = out; plan.push({ sh: D.sh, add, edit, del, total: out.length });
    }
    if (!plan.length && !errs.length) return toast("مفيش ولا شيت من شيتات الحسابات في الملف – نزّل «ملف للتعديل» الأول", "err");
    const tbl = `<table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="text-align:right">الشيت</th><th>➕ جديد</th><th>✏️ تعديل</th><th>🗑️ مسح</th></tr>${plan.map((p) => `<tr style="border-top:1px solid #eee"><td>${esc(p.sh)}</td><td style="text-align:center">${p.add}</td><td style="text-align:center">${p.edit}</td><td style="text-align:center;${p.del ? "color:#dc2626;font-weight:700" : ""}">${p.del}</td></tr>`).join("")}</table>`;
    const nothing = plan.every((p) => !p.add && !p.edit && !p.del);
    sheet(`<div class="h2">📥 مراجعة الاستيراد</div><p class="mut" style="font-size:12px">${esc(file.name)}</p>${tbl}
      ${errs.length ? `<div class="notice" style="background:#fef2f2;color:#991b1b;margin-top:10px"><b>لازم تصلّح دول الأول (${errs.length}):</b><div style="max-height:200px;overflow:auto;font-size:12px">${errs.slice(0, 60).map((e) => "• " + esc(e)).join("<br>")}</div></div>` : nothing ? `<p class="notice" style="margin-top:10px">الملف مطابق للتطبيق – مفيش حاجة تتغير.</p>` : `<p class="mut" style="font-size:12px;margin-top:10px">هاخد نسخة من البيانات الحالية قبل ما أحفظ، وتقدر تتراجع في أي وقت من «↩️ سجل الاستيراد».</p><button class="btn" id="impGo" style="width:100%;margin-top:6px">✅ طبّق التعديلات</button>`}`, () => {
      const b = $("impGo"); if (!b) return;
      b.onclick = async () => {
        const dels = plan.reduce((a, p) => a + p.del, 0);
        if (dels && !(await UI.ask(`هيتمسح ${dels} سطر من التطبيق لأنهم مش موجودين في الملف. تكمّل؟`))) return;
        b.disabled = true; b.textContent = "⏳ بحفظ…";
        try { await Store.importAccounts(P, file.name); closeSheet(); toast("✅ الحسابات اتصححت من الملف"); await loadAll(); render(); }
        catch (e) { b.disabled = false; b.textContent = "✅ طبّق التعديلات"; toast("❌ " + (e.message || e), "err"); }
      };
    });
  }
  function importPick() {
    if (A.me.role !== "admin") return toast("الأدمن بس اللي يقدر يستورد", "err");
    const f = document.createElement("input"); f.type = "file"; f.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";
    f.onchange = () => { if (f.files[0]) importXlsx(f.files[0]); }; f.click();
  }
  async function importHistory() {
    let L = []; try { L = (await Store.importList()) || []; } catch (e) { return toast(e.message, "err"); }
    const firstOpen = (L.find((x) => !x.undone_at) || {}).id;
    const sumTxt = (s) => Object.entries(s || {}).map(([t, v]) => `${(impDefs().find((d) => d.t === t) || {}).sh || t}: ${v.saved} سطر${v.deleted ? ` · اتمسح ${v.deleted}` : ""}`).join(" – ");
    sheet(`<div class="h2">↩️ سجل الاستيراد</div>${L.length ? `<div class="list">${L.map((x) => `<div class="it"><div class="t"><b>${esc(x.file || "ملف")}</b><span class="mut">${new Date(x.at).toLocaleString("ar-KW")}${x.by ? " · " + esc(x.by) : ""}</span><span class="mut" style="font-size:11px">${esc(sumTxt(x.summary))}</span></div>${x.undone_at ? `<span class="mut" style="font-size:12px">اتلغى ✓</span>` : x.id === firstOpen ? `<button class="btn sm" style="background:#dc2626" data-undo="${x.id}">تراجع</button>` : `<span class="mut" style="font-size:11px">ألغي اللي بعده الأول</span>`}</div>`).join("")}</div>` : `<p class="mut">لسه مفيش استيراد.</p>`}`, (w) => {
      w.querySelectorAll("[data-undo]").forEach((b) => (b.onclick = async () => {
        if (!(await UI.ask("ترجّع الحسابات زي ما كانت قبل الملف ده؟ (أي تعديل يدوي حصل بعد الاستيراد على نفس الشيتات هيضيع)"))) return;
        b.disabled = true; b.textContent = "⏳";
        try { await Store.undoImport(Number(b.dataset.undo)); closeSheet(); toast("✅ رجعت كل حاجة زي ما كانت"); await loadAll(); render(); } catch (e) { b.disabled = false; b.textContent = "تراجع"; toast("❌ " + e.message, "err"); }
      }));
    });
  }
  // =================== 📑 التقارير ===================
  const RK = { day: "📅 يومي", month: "🗓️ شهري", year: "📆 سنوي" };
  function repRange() {
    const k = A.rk || "day", now = new Date();
    const sel = k === "day" ? A.rday || dayKey(now) : k === "month" ? A.rmon || monthKey(now) : String(A.ryear || now.getFullYear());
    const inF = k === "day" ? (d) => d && dayKey(d) === sel : k === "month" ? (d) => d && monthKey(d) === sel : (d) => d && String(new Date(d).getFullYear()) === sel;
    const title = k === "day" ? new Date(sel + "T12:00:00").toLocaleDateString("ar-KW", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : k === "month" ? mkLabel(sel) : "سنة " + sel;
    return { k, sel, inF, title };
  }
  function repData(inF) {
    const F = figs(inF), allO = A.orders.filter((o) => inF(o.created_at)), del = F.ords, canc = allO.filter((o) => o.status === "cancelled"), open = allO.filter((o) => !["delivered", "cancelled"].includes(o.status));
    const pay = { cash: 0, knet: 0, credit: 0 }; del.forEach((o) => { const s = splitOf(o); pay.cash += s.cash; pay.knet += s.knet; pay.credit += s.credit; });
    F.tx.filter((t) => t.kind === "sale").forEach((t) => { if (t.category === "credit") pay.credit += num(t.amount); else if (t.category === "knet_on_delivery") pay.knet += num(t.amount); else pay.cash += num(t.amount); });
    const prod = new Map(); del.forEach((o) => (o.items || []).forEach((i) => { const p = A.products.find((q) => q.id === i.id), r = prod.get(i.id) || { n: i.name_ar, q: 0, s: 0, c: 0 }; r.q += num(i.qty); r.s += num(i.price) * num(i.qty); r.c += num(p && p.cost) * num(i.qty); prod.set(i.id, r); }));
    const cust = new Map(); del.forEach((o) => { const r = cust.get(o.phone) || { n: o.customer_name, ph: o.phone, c: 0, s: 0 }; r.c++; r.s += num(o.total); cust.set(o.phone, r); });
    const area = new Map(); del.forEach((o) => { const r = area.get(o.area) || { n: o.area || "—", c: 0, s: 0 }; r.c++; r.s += num(o.total); area.set(o.area, r); });
    const drv = A.profiles.filter((p) => p.role === "driver").map((p) => { const ds = del.filter((o) => o.driver_id === p.id); return { n: p.full_name || "مندوب", c: ds.length, e: ds.reduce((a, o) => a + num(o.driver_earning), 0), cash: ds.reduce((a, o) => a + splitOf(o).cash, 0) }; }).filter((x) => x.c);
    const expCat = {}; F.tx.filter((t) => t.kind === "expense").forEach((t) => { expCat[t.category || "أخرى"] = (expCat[t.category || "أخرى"] || 0) + num(t.amount); });
    const rec = F.tx.filter((t) => t.kind === "receivable_paid" && t.category !== "discount"), newCr = pay.credit + sum(F.tx.filter((t) => t.kind === "receivable"));
    const rated = del.filter((o) => o.rating), first = {}; A.orders.filter((o) => o.status !== "cancelled").forEach((o) => { if (!first[o.phone] || new Date(o.created_at) < new Date(first[o.phone])) first[o.phone] = o.created_at; });
    const newCust = Object.values(first).filter((d) => inF(d)).length;
    return { F, allO, del, canc, open, pay, prod: [...prod.values()].sort((a, b) => b.s - a.s), cust: [...cust.values()].sort((a, b) => b.s - a.s), area: [...area.values()].sort((a, b) => b.s - a.s), drv, expCat, rec, recT: sum(rec), newCr,
      fees: del.reduce((a, o) => a + num(o.delivery_fee), 0), svc: del.reduce((a, o) => a + num(o.fees_total), 0), disc: del.reduce((a, o) => a + num(o.discount) + num(o.points_disc), 0), coupons: del.filter((o) => o.coupon_code).length,
      avg: del.length ? sum(del, (o) => o.total) / del.length : 0, rating: rated.length ? rated.reduce((a, o) => a + o.rating, 0) / rated.length : null, rated: rated.length, newCust };
  }
  function repBreak(k, sel) {
    if (k === "day") return null;
    const keys = k === "month" ? [...Array(new Date(+sel.slice(0, 4), +sel.slice(5, 7), 0).getDate())].map((_, i) => sel + "-" + String(i + 1).padStart(2, "0")) : [...Array(12)].map((_, i) => sel + "-" + String(i + 1).padStart(2, "0"));
    return keys.map((x) => { const f = figs(k === "month" ? (d) => d && dayKey(d) === x : (d) => d && monthKey(d) === x); return { l: k === "month" ? +x.slice(8) : MONTHS[+x.slice(5) - 1], sales: f.sales, n: f.ords.length, purch: f.purch, exp: f.exp + f.sal, profit: f.profit }; });
  }
  function reports() {
    const R = repRange(), D = repData(R.inF), F = D.F, B = repBreak(R.k, R.sel), now = new Date();
    const yrs = [...new Set([now.getFullYear(), ...A.orders.map((o) => new Date(o.created_at).getFullYear())])].sort((a, b) => b - a);
    const st = (l, v, c) => `<div class="stat"><span class="mut">${l}</span><b${c ? ` style="color:${c}"` : ""}>${v}</b></div>`, L = (l, v, c) => `<div class="line"><span>${l}</span><b${c ? ` style="color:${c}"` : ""}>${v}</b></div>`;
    const top = (arr, f, n = 5) => arr.slice(0, n).map(f).join("") || '<p class="mut">مفيش.</p>';
    const mx = B ? Math.max(1, ...B.map((x) => x.sales)) : 1;
    return `<div class="h2">📑 التقارير</div>
      <div class="filters">${Object.entries(RK).map(([k, l]) => `<button class="${(A.rk || "day") === k ? "on" : ""}" data-rk="${k}">${l}</button>`).join("")}</div>
      <div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap">${R.k === "day" ? `<input class="in" type="date" id="rSel" value="${R.sel}" style="max-width:180px">` : R.k === "month" ? `<input class="in" type="month" id="rSel" value="${R.sel}" style="max-width:180px">` : `<select class="in" id="rSel" style="max-width:140px">${yrs.map((y) => `<option ${String(y) === R.sel ? "selected" : ""}>${y}</option>`).join("")}</select>`}
        <button class="btn sm" style="background:#15803d" data-rxlsx>📗 Excel</button><button class="btn sm ghost" data-rprint>🖨️ طباعة / PDF</button></div>
      <div class="card" style="background:linear-gradient(135deg,#0b2545,#13315c);color:#fff"><div style="opacity:.8;font-size:13px">تقرير ${RK[R.k].replace(/^\S+ /, "")}</div><b style="font-size:18px">${R.title}</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div><small style="opacity:.8">المبيعات</small><div style="font-size:20px;font-weight:800">${money(F.sales)}</div></div><div><small style="opacity:.8">صافي الربح</small><div style="font-size:20px;font-weight:800;color:${F.profit >= 0 ? "#86efac" : "#fca5a5"}">${money(F.profit)}</div></div></div></div>
      <div class="stats">${st("طلبات اتسلّمت", D.del.length)}${st("متوسط الطلب", money(D.avg))}${st("اتلغت", D.canc.length, D.canc.length ? "#dc2626" : "")}${st("لسه شغالة", D.open.length)}${st("زباين جداد", D.newCust)}${st("التقييم", D.rating != null ? "⭐ " + D.rating.toFixed(1) + ` (${D.rated})` : "—", "#d97706")}</div>
      ${B ? `<div class="card"><b>${R.k === "month" ? "المبيعات يوم بيوم" : "المبيعات شهر بشهر"}</b><div style="display:flex;align-items:flex-end;gap:${R.k === "month" ? 2 : 6}px;height:120px;margin-top:10px">${B.map((x) => `<div style="flex:1;text-align:center;font-size:9px" title="${x.l}: ${money(x.sales)}"><div style="height:${Math.round((x.sales / mx) * 95) + 2}px;background:${x.profit >= 0 ? "#0ea5e9" : "#f87171"};border-radius:3px 3px 0 0"></div><div class="mut">${R.k === "month" ? (x.l % 5 === 1 ? x.l : "") : String(x.l).slice(0, 3)}</div></div>`).join("")}</div></div>` : ""}
      <div class="card"><b>💰 الفلوس</b>${L("المبيعات", money(F.sales))}${L("إيرادات تانية", money(F.inc))}${L("− المشتريات", money(F.purch), "#b45309")}${L("− المصاريف", money(F.exp), "#dc2626")}${L("− الرواتب والسلف", money(F.sal), "#dc2626")}<div class="line total"><span>صافي الربح</span><span style="color:${F.profit >= 0 ? "#16a34a" : "#dc2626"}">${money(F.profit)}</span></div>
        ${L("تكلفة الأصناف اللي اتباعت", money(F.cogs))}${L("🗑️ الهالك", money(F.waste), "#dc2626")}${F.draw ? L("💼 سحب شخصي", money(F.draw), "#7c3aed") : ""}</div>
      <div class="card"><b>💳 طرق الدفع</b>${L("💵 كاش", money(D.pay.cash))}${L("💳 كي نت", money(D.pay.knet))}${L("📝 آجل", money(D.pay.credit))}${L("🛵 رسوم توصيل", money(D.fees))}${D.svc ? L("🧾 رسوم تجهيز وتنظيف", money(D.svc)) : ""}${D.disc ? L(`🎟️ خصومات (${D.coupons} كوبون)`, money(D.disc), "#dc2626") : ""}</div>
      <div class="card"><b>🤝 التحصيل</b>${L("آجل جديد", money(D.newCr), "#b45309")}${L(`اتحصّل (${D.rec.length} سند)`, money(D.recT), "#16a34a")}${L("برّه عند الزباين دلوقتي", money(custList().reduce((a, c) => a + Math.max(0, c.bal), 0)), "#dc2626")}</div>
      <div class="card"><b>🐟 أكتر الأصناف مبيعاً</b>${top(D.prod, (r) => L(`${esc(r.n)} <small class="mut">${fq(r.q)}${r.c ? ` · ربح ${money(r.s - r.c)}` : ""}</small>`, money(r.s)), 8)}</div>
      <div class="card"><b>👥 أكتر الزباين</b>${top(D.cust, (r) => L(`${esc(r.n || r.ph)} <small class="mut">${r.c} طلب</small>`, money(r.s)))}</div>
      <div class="card"><b>📍 أكتر المناطق</b>${top(D.area, (r) => L(`${esc(r.n)} <small class="mut">${r.c} طلب</small>`, money(r.s)))}</div>
      <div class="card"><b>🛵 المناديب</b>${top(D.drv, (r) => L(`${esc(r.n)} <small class="mut">${r.c} توصيلة · كاش ${money(r.cash)}</small>`, money(r.e)), 10)}</div>
      <div class="card"><b>💸 المصاريف حسب النوع</b>${top(Object.entries(D.expCat).sort((a, b) => b[1] - a[1]), ([k, v]) => L(esc(k), money(v)), 20)}${F.sal ? L("👷 رواتب وسلف", money(F.sal)) : ""}</div>
      ${B ? `<div class="card"><b>${R.k === "month" ? "تفصيل الأيام" : "تفصيل الشهور"}</b>${B.filter((x) => x.sales || x.purch || x.exp).map((x) => `<div class="line" style="font-size:13px"><span>${R.k === "month" ? x.l + " " + MONTHS[+R.sel.slice(5) - 1] : x.l} <small class="mut">${x.n} طلب</small></span><span>${money(x.sales)} · <b style="color:${x.profit >= 0 ? "#16a34a" : "#dc2626"}">${money(x.profit)}</b></span></div>`).join("") || '<p class="mut">مفيش حركة.</p>'}</div>` : ""}`;
  }
  async function repXlsx() {
    const R = repRange(), D = repData(R.inF), F = D.F, B = repBreak(R.k, R.sel), n3 = (v) => Math.round(num(v) * 1000) / 1000;
    toast("⏳ بجهّز التقرير…"); try { await loadXLSX(); } catch (e) { return toast(e.message, "err"); }
    const wb = XLSX.utils.book_new(), add = (name, rows) => { const ws = XLSX.utils.aoa_to_sheet(rows); ws["!cols"] = (rows[0] || []).map((_, i) => ({ wch: Math.min(40, Math.max(10, ...rows.slice(0, 200).map((r) => String(r[i] == null ? "" : r[i]).length + 2))) })); ws["!views"] = [{ RTL: true }]; XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); };
    add("الملخص", [["تقرير " + RK[R.k].replace(/^\S+ /, ""), R.title], [], ["البند", "القيمة"], ["المبيعات", n3(F.sales)], ["إيرادات تانية", n3(F.inc)], ["المشتريات", n3(F.purch)], ["المصاريف", n3(F.exp)], ["الرواتب والسلف", n3(F.sal)], ["صافي الربح", n3(F.profit)], ["تكلفة الأصناف المباعة", n3(F.cogs)], ["الهالك", n3(F.waste)], ["سحب شخصي", n3(F.draw)], [],
      ["طلبات اتسلّمت", D.del.length], ["طلبات اتلغت", D.canc.length], ["طلبات لسه شغالة", D.open.length], ["متوسط الطلب", n3(D.avg)], ["زباين جداد", D.newCust], ["متوسط التقييم", D.rating != null ? +D.rating.toFixed(2) : ""], [],
      ["كاش", n3(D.pay.cash)], ["كي نت", n3(D.pay.knet)], ["آجل", n3(D.pay.credit)], ["رسوم توصيل", n3(D.fees)], ["رسوم تجهيز وتنظيف", n3(D.svc)], ["خصومات", n3(D.disc)], [], ["آجل جديد", n3(D.newCr)], ["اتحصّل من الآجل", n3(D.recT)]]);
    if (B) add(R.k === "month" ? "الأيام" : "الشهور", [[R.k === "month" ? "اليوم" : "الشهر", "عدد الطلبات", "المبيعات", "المشتريات", "المصاريف والرواتب", "الربح"], ...B.map((x) => [R.k === "month" ? R.sel + "-" + String(x.l).padStart(2, "0") : x.l, x.n, n3(x.sales), n3(x.purch), n3(x.exp), n3(x.profit)])]);
    add("الأصناف", [["الصنف", "الكمية", "المبيعات", "التكلفة", "الربح"], ...D.prod.map((r) => [r.n, n3(r.q), n3(r.s), n3(r.c), n3(r.s - r.c)])]);
    add("الزباين", [["العميل", "الهاتف", "عدد الطلبات", "المبيعات"], ...D.cust.map((r) => [r.n || "", r.ph, r.c, n3(r.s)])]);
    add("المناطق", [["المنطقة", "عدد الطلبات", "المبيعات"], ...D.area.map((r) => [r.n, r.c, n3(r.s)])]);
    add("المناديب", [["المندوب", "توصيلات", "كاش حصّله", "أرباحه"], ...D.drv.map((r) => [r.n, r.c, n3(r.cash), n3(r.e)])]);
    add("المصاريف", [["التاريخ", "النوع", "البيان", "المبلغ", "ملاحظة"], ...F.tx.filter((t) => ["expense", "salary", "advance", "purchase"].includes(t.kind)).map((t) => [t.date || dayKey(t.created_at), (KINDS[t.kind] || t.kind).replace(/^\S+ /, ""), t.category || t.party_name || "", n3(t.amount), t.note || ""])]);
    add("الطلبات", [["رقم", "التاريخ", "الحالة", "العميل", "الهاتف", "المنطقة", "الإجمالي", "الدفع", "المندوب"], ...D.allO.map((o) => [o.order_no, dayKey(o.created_at), (STATUS[o.status] || {}).ar || o.status, o.customer_name, o.phone, o.area, n3(o.total), (PAY[o.payment] || PAY.cash).replace(/^\S+ /, ""), pname(o.driver_id)])]);
    add("سندات القبض", [["رقم", "التاريخ", "العميل", "المبلغ", "الطريقة"], ...D.rec.map((t) => [t.receipt_no || "", t.date || dayKey(t.created_at), t.party_name || t.party, n3(t.amount), t.method === "knet" ? "كي نت" : "كاش"])]);
    XLSX.writeFile(wb, `Goten-تقرير-${R.sel}.xlsx`); toast("✅ التقرير اتنزّل");
  }
  function repPrint() {
    const R = repRange(), D = repData(R.inF), F = D.F, B = repBreak(R.k, R.sel), s = A.settings, row = (a, b) => `<tr><td>${a}</td><td><b>${b}</b></td></tr>`;
    printDoc("تقرير " + R.sel, `<h1>${esc(s.store_name || "Goten")} – تقرير ${RK[R.k].replace(/^\S+ /, "")}</h1><div class="mut">${esc(R.title)} · اتطبع ${new Date().toLocaleString("ar-KW")}</div>
      <table>${row("المبيعات", money(F.sales))}${row("إيرادات تانية", money(F.inc))}${row("المشتريات", money(F.purch))}${row("المصاريف", money(F.exp))}${row("الرواتب والسلف", money(F.sal))}${row("صافي الربح", money(F.profit))}${row("الهالك", money(F.waste))}${row("طلبات اتسلّمت", D.del.length)}${row("متوسط الطلب", money(D.avg))}${row("كاش / كي نت / آجل", `${money(D.pay.cash)} / ${money(D.pay.knet)} / ${money(D.pay.credit)}`)}${row("اتحصّل من الآجل", money(D.recT))}</table>
      <h3>أكتر الأصناف</h3><table><tr><th>الصنف</th><th>الكمية</th><th>المبيعات</th></tr>${D.prod.slice(0, 10).map((r) => `<tr><td>${esc(r.n)}</td><td>${fq(r.q)}</td><td>${r.s.toFixed(3)}</td></tr>`).join("")}</table>
      <h3>المصاريف</h3><table>${Object.entries(D.expCat).map(([k, v]) => row(esc(k), v.toFixed(3))).join("")}</table>
      ${B ? `<h3>${R.k === "month" ? "الأيام" : "الشهور"}</h3><table><tr><th></th><th>طلبات</th><th>مبيعات</th><th>ربح</th></tr>${B.filter((x) => x.sales || x.exp || x.purch).map((x) => `<tr><td>${x.l}</td><td>${x.n}</td><td>${x.sales.toFixed(3)}</td><td>${x.profit.toFixed(3)}</td></tr>`).join("")}</table>` : ""}`);
  }
  function accounts() {
    if (A.asub === "collect") return subTabs() + collectPage();
    if (A.asub === "stock") return subTabs() + stock();
    if (A.asub === "sups") return subTabs() + supsPage();
    if (A.asub === "custs") return subTabs() + custsPage();
    return subTabs() + moneyPage();
  }
  function accountsMoney() {
    const ords = A.orders.filter((o) => o.status === "delivered" && inPeriod(o.created_at));
    const pending = A.orders.filter((o) => !["delivered", "cancelled"].includes(o.status) && inPeriod(o.created_at));
    const tx = A.tx.filter((t) => inPeriod(t.date || t.created_at));
    const manual = tx.filter((t) => t.kind === "sale");
    const sales = sum(ords, (o) => o.total) + sum(manual), fees = sum(ords, (o) => o.delivery_fee);
    const purch = sum(tx.filter((t) => t.kind === "purchase")), exp = sum(tx.filter((t) => t.kind === "expense")), inc = sum(tx.filter((t) => t.kind === "income"));
    const sal = sum(tx.filter((t) => t.kind === "salary" || t.kind === "advance")), draws = sum(tx.filter((t) => t.kind === "drawing"));
    const profit = sales + inc - purch - exp - sal;
    const byPay = Object.keys(PAY).map((k) => [k, sum(ords.filter((o) => (o.payment || "cash") === k), (o) => o.total) + sum(manual.filter((t) => (t.category || "cash") === k))]);
    const byCat = {}; tx.filter((t) => t.kind === "expense").forEach((t) => { byCat[t.category || "أخرى"] = (byCat[t.category || "أخرى"] || 0) + num(t.amount); });
    const dc = driverCash(), rc = receivables();
    const stat = (l, v, c) => `<div class="stat"><span class="mut">${l}</span><b style="${c ? "color:" + c : ""}">${v}</b></div>`;
    return `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>
      <div class="stats">${stat("المبيعات (" + ords.length + " طلب" + (manual.length ? " + " + manual.length + " يدوي" : "") + ")", money(sales))}${stat("المشتريات", money(purch), "#b45309")}${stat("المصاريف", money(exp), "#dc2626")}${sal ? stat("الرواتب والسلف", money(sal), "#dc2626") : ""}${stat("صافي الربح", money(profit), profit >= 0 ? "#16a34a" : "#dc2626")}${draws ? stat("سحب شخصي (مش مصروف)", money(draws), "#7c3aed") : ""}</div>
      <div class="card"><div class="line"><span>من التطبيق</span><b>${money(sales - sum(manual))}</b></div><div class="line"><span>خارج التطبيق</span><b>${money(sum(manual))}</b></div><div class="line"><span>منها رسوم توصيل</span><b>${money(fees)}</b></div>${inc ? `<div class="line"><span>إيرادات أخرى</span><b>${money(inc)}</b></div>` : ""}
        ${byPay.map(([k, v]) => `<div class="line"><span>${PAY[k]}</span><b>${money(v)}</b></div>`).join("")}
        ${pending.length ? `<div class="line mut"><span>طلبات لسه ماتوصّلتش (${pending.length})</span><span>${money(sum(pending, (o) => o.total))}</span></div>` : ""}
        ${Object.keys(byCat).length ? `<div class="mut" style="margin-top:8px"><b>المصاريف حسب النوع:</b></div>${Object.entries(byCat).map(([k, v]) => `<div class="line"><span>${esc(k)}</span><span>${money(v)}</span></div>`).join("")}` : ""}</div>
      <button class="btn tq block" data-addmenu style="font-size:17px;padding:14px">➕ إضافة</button>
      <div class="h2">🛵 كاش مع المناديب</div>
      ${dc.length ? dc.map((r) => `<div class="it" style="background:#fff;border-radius:14px;padding:10px;margin:8px 0;display:flex;align-items:center;gap:10px"><div class="t" style="flex:1"><b>${esc(r.d.full_name || "مندوب")}</b><div class="mut">حصّل ${money(r.got)} · سلّم ${money(r.paid)}</div></div><b style="color:${r.bal > 0 ? "#b45309" : "#16a34a"}">${money(r.bal)}</b>${r.bal > 0.0005 ? `<button class="btn sm green" data-settle="${r.d.id}">✅ استلمت</button>` : ""}</div>`).join("") : '<p class="mut">مفيش مناديب.</p>'}
      ${supMini()}
      ${rc.length ? `<div class="notice" data-asub="custs" style="cursor:pointer;background:#fdf2f8;color:#9d174d">👥 فلوس عند العملاء (آجل) <b>${money(rc.reduce((a, r) => a + Math.max(0, r.bal), 0))}</b> – اضغط للتفاصيل</div>` : ""}
      <div class="h2">📒 سجل الحركات</div>
      <div class="list">${tx.length ? [...tx].sort((x, y) => new Date(y.date || y.created_at) - new Date(x.date || x.created_at)).map((t) => `<div class="it"><div class="t"><b>${KINDS[t.kind] || t.kind}${t.kind === "sale" ? " · " + (PAY[t.category] || PAY.cash) : t.category ? " · " + esc(t.category) : ""}</b><span class="mut">${esc(t.date || dayKey(t.created_at))}${t.party_name ? " · " + esc(t.party_name) : ""}${t.note ? " · " + esc(t.note) : ""}${t.box === "bank" ? " · 🏦" : ""}</span></div>${t.attachment ? `<a href="${esc(t.attachment)}" target="_blank" rel="noopener" style="font-size:20px;text-decoration:none">📎</a>` : ""}<b>${money(t.amount)}</b><button class="btn sm ghost" data-deltx="${t.id}">🗑️</button></div>`).join("") : '<p class="mut">مفيش حركات في الفترة دي.</p>'}</div>`;
  }
  // ---------- المخزون ----------
  const MV = { purchase: "🛒 شراء", sale: "🧾 بيع", return: "↩️ مرتجع", waste: "🗑️ تالف", count: "📝 جرد" };
  const fq = (n) => { n = num(n); return (Math.round(n * 1000) / 1000).toString(); };
  function stockState(p) { if (p.stock == null) return "off"; if (num(p.stock) <= 0) return "out"; if (num(p.stock) <= num(p.low_stock)) return "low"; return "ok"; }
  function stock() {
    if (A.moves === null) return `<div class="notice">⚠️ المخزون محتاج كود SQL الأول – شغّل ملف <b>inventory.sql</b> في Supabase مرة واحدة.</div>`;
    const f = A.sfilter || "all", q = (A.sq || "").trim();
    const tracked = A.products.filter((p) => p.stock != null);
    const cnt = (st) => A.products.filter((p) => stockState(p) === st).length;
    const value = tracked.reduce((a, p) => a + Math.max(0, num(p.stock)) * num(p.cost), 0);
    const list = A.products.filter((p) => (f === "all" || stockState(p) === f || (f === "low" && stockState(p) === "out")) && (!q || (p.name_ar + " " + (p.name_en || "")).includes(q)));
    const SC = { ok: ["#16a34a", "متوفر"], low: ["#d97706", "قرب يخلص"], out: ["#dc2626", "خلص"], off: ["#94a3b8", "مش متتبَّع"] };
    return `<div class="h2">📦 المخزون</div>
      <div class="stats"><div class="stat"><span class="mut">منتجات متتبَّعة</span><b>${tracked.length}</b></div><div class="stat"><span class="mut">قرب يخلص</span><b style="color:#d97706">${cnt("low")}</b></div>
        <div class="stat"><span class="mut">خلص</span><b style="color:#dc2626">${cnt("out")}</b></div><div class="stat"><span class="mut">قيمة البضاعة (بالتكلفة)</span><b>${money(value)}</b></div></div>
      <div class="card" style="font-size:13px" ><span class="mut">💡 الكمية بتنقص لوحدها مع كل طلب، وبترجع لو الطلب اتلغى أو اتحذف. لما المنتج يخلص بيظهر للزبون «نفدت الكمية» لوحده.</span></div>
      <div class="tabs" style="padding:4px 0">${[["all", "الكل"], ["low", "قرب يخلص"], ["out", "خلص"], ["off", "مش متتبَّع"]].map(([k, l]) => `<button style="background:${f === k ? "var(--tq)" : "#e2e8f0"};color:${f === k ? "#fff" : "#334155"}" data-sf="${k}">${l}</button>`).join("")}</div>
      <input class="in" id="sq" placeholder="🔍 دوّر على منتج" value="${esc(q)}" style="margin:6px 0">
      <div class="list">${list.map((p) => { const st = stockState(p); return `<div class="it" style="flex-wrap:wrap;border-inline-start:4px solid ${SC[st][0]}">
        ${p.image ? `<img src="${esc(p.image)}" alt="">` : ""}<div class="t"><b>${esc(p.name_ar)}</b><span class="mut">${st === "off" ? "مش متتبَّع" : `<b style="display:inline;color:${SC[st][0]};font-size:18px">${fq(p.stock)}</b> ${esc(p.unit_ar || "")} · ${SC[st][1]}${num(p.low_stock) ? ` · تنبيه عند ${fq(p.low_stock)}` : ""}${p.cost != null ? ` · تكلفة ${money(p.cost)}` : ""}`}</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;width:100%">${st === "off" ? `<button class="btn sm tq" data-smv="count:${p.id}">▶️ ابدأ تتبّع المخزون</button>` : `<button class="btn sm tq" data-buy="${p.id}">➕ شراء</button><button class="btn sm ghost" data-smv="waste:${p.id}">➖ تالف</button><button class="btn sm ghost" data-smv="count:${p.id}">📝 جرد</button><button class="btn sm ghost" data-shist="${p.id}">📜 الحركات</button>`}</div></div>`; }).join("") || '<p class="mut">مفيش منتجات هنا.</p>'}</div>
      <div class="h2">آخر الحركات</div><div class="card">${(A.moves || []).slice(0, 25).map(mvLine).join("") || '<p class="mut">لسه مفيش حركات.</p>'}</div>`;
  }
  function mvLine(m) { return `<div class="line"><span>${MV[m.kind] || m.kind} · ${esc(m.product_name || "")}<br><small class="mut">${fmtDate(m.created_at)}${m.note ? " · " + esc(m.note) : ""}${m.cost ? " · " + money(m.cost) : ""}</small></span><b style="color:${num(m.qty) >= 0 ? "#16a34a" : "#dc2626"};direction:ltr">${num(m.qty) > 0 ? "+" : ""}${fq(m.qty)}${m.balance != null ? ` <small class="mut">= ${fq(m.balance)}</small>` : ""}</b></div>`; }
  function stockSheet(kind, id) {
    const p = A.products.find((x) => x.id === id), u = esc(p.unit_ar || "");
    const title = { purchase: "➕ شراء / استلام بضاعة", waste: "➖ تالف / هالك", count: p.stock == null ? "▶️ ابدأ تتبّع المخزون" : "📝 جرد (الكمية الفعلية)" }[kind];
    sheet(`<h3>${title}</h3><p class="mut">${esc(p.name_ar)}${p.stock != null ? ` · الموجود دلوقتي: <b>${fq(p.stock)} ${u}</b>` : ""}</p>
      <label class="f"><span>${kind === "count" ? "الكمية الموجودة فعلاً" : "الكمية"} (${u || "وحدة"}) *</span><input class="in" id="sQty" type="number" step="0.25" min="0" inputmode="decimal" value="${kind === "count" && p.stock != null ? fq(p.stock) : ""}"></label>
      ${kind === "purchase" ? `<label class="f"><span>إجمالي سعر الشراء (د.ك) – اختياري</span><input class="in" id="sCost" type="number" step="0.005" min="0" inputmode="decimal"></label>
        <label class="radio"><input type="checkbox" id="sTx" checked> سجّلها في الحسابات كمشتريات</label><label class="f"><span>المورد (اختياري)</span><input class="in" id="sParty"></label>` : ""}
      ${kind === "waste" ? `<label class="f"><span>السبب</span><select class="in" id="sReason"><option>تالف / مش طازة</option><option>فاقد في التنظيف</option><option>استخدام داخلي</option><option>سبب آخر</option></select></label>` : ""}
      ${kind === "count" ? `<label class="f"><span>نبّهني لما يقل عن (${u || "وحدة"})</span><input class="in" id="sLow" type="number" step="0.25" min="0" inputmode="decimal" value="${p.low_stock != null ? fq(p.low_stock) : ""}"></label>` : ""}
      <label class="f"><span>ملاحظة</span><input class="in" id="sNote"></label><button class="btn tq block" id="sSave">💾 حفظ</button>`, () => {
      $("sSave").onclick = async () => {
        const raw = $("sQty").value; if (raw === "" || num(raw) < 0 || (kind !== "count" && !(num(raw) > 0))) return toast("اكتب الكمية", "err");
        const qty = num(raw), cost = $("sCost") && $("sCost").value ? num($("sCost").value) : null;
        const note = [$("sReason") ? $("sReason").value : "", $("sParty") && $("sParty").value.trim() ? "من " + $("sParty").value.trim() : "", $("sNote").value.trim()].filter(Boolean).join(" – ") || null;
        $("sSave").disabled = true;
        try {
          await Store.stockMove({ product_id: id, kind, qty, cost, note });
          if (kind === "count" && $("sLow").value !== "" && num($("sLow").value) !== num(p.low_stock)) await Store.saveProduct({ ...p, low_stock: num($("sLow").value) });
          if (kind === "purchase" && cost && $("sTx").checked) await Store.saveTransaction({ kind: "purchase", amount: cost, date: dayKey(new Date()), category: p.name_ar, note: fq(qty) + " " + (p.unit_ar || ""), party_name: ($("sParty").value || "").trim() || null }).catch(() => toast("اتسجّل في المخزون بس – الحسابات مش متفعّلة", "err"));
          closeSheet(); toast("اتسجّل ✓"); await refresh();
        } catch (e) { $("sSave").disabled = false; toast(/stock_move|function/.test(e.message) ? "شغّل inventory.sql الأول" : e.message, "err"); }
      };
    });
  }
  function txSheet(kind, preset) {
    preset = preset || {};
    const isRec = kind === "receivable" || kind === "receivable_paid";
    sheet(`<h3>${KINDS[kind]}</h3>
      ${kind === "expense" ? `<label class="f"><span>النوع</span><select class="in" id="tCat">${EXP_CATS.map((c) => `<option>${c}</option>`).join("")}</select></label>` : ""}
      ${kind === "purchase" ? `<label class="f"><span>المنتج (بيزوّد المخزون)</span><select class="in" id="tProd"><option value="">— حاجة تانية مش منتج (ثلج، أكياس...) —</option>${A.products.map((p) => `<option value="${p.id}" ${preset.product === p.id ? "selected" : ""}>${esc(p.name_ar)}${p.stock != null ? ` (موجود ${fq(p.stock)})` : ""}</option>`).join("")}</select></label>
        <div class="row2"><label class="f" id="tQtyW"><span>الكمية *</span><input class="in" id="tQty" type="number" step="0.25" min="0" inputmode="decimal" placeholder="كام كيلو / حبة"></label><label class="f" id="tCatW"><span>الصنف</span><input class="in" id="tCat" placeholder="ثلج، أكياس..."></label></div>
        <label class="f"><span>المورد</span><select class="in" id="tSup"><option value="">— بدون مورد (اتدفع كاش) —</option>${(A.sups || []).map((x) => `<option value="${x.id}" ${preset.supplier === x.id ? "selected" : ""}>🚚 ${esc(x.name)}${supBal(x.id) > 0.0005 ? ` (عليك ${money(supBal(x.id))})` : ""}</option>`).join("")}</select></label>
        ${A.sups === null ? `<p class="mut" style="font-size:12px">لتفعيل الموردين شغّل suppliers.sql</p>` : !(A.sups || []).length ? `<p class="mut" style="font-size:12px">ضيف موردينك من زرار «🚚 + مورد» علشان تختارهم هنا</p>` : ""}` : ""}
      ${kind === "sale" ? `<label class="f"><span>العميل</span><select class="in" id="tCust"><option value="">— زبون عادي / اكتب تحت —</option>${custList().map((c) => `<option value="${esc(c.phone)}" ${preset.phone && normPh(preset.phone) === c.phone ? "selected" : ""}>👤 ${esc(c.name || c.phone)}${c.bal > 0.0005 ? ` (عليه ${money(c.bal)})` : ""}</option>`).join("")}</select></label>
        <label class="f"><span>اتباع إيه؟</span><input class="in" id="tDesc" placeholder="مثال: 2 كيلو زبيدي – بيع في المحل"></label>
        <label class="f"><span>طريقة الدفع</span><select class="in" id="tPay">${Object.entries(PAY).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
        <div class="row2"><label class="f"><span>اسم الزبون (اختياري)</span><input class="in" id="tPName" value="${esc(preset.name || "")}"></label><label class="f"><span>رقمه (لازم لو آجل)</span><input class="in" id="tPhone" type="tel" inputmode="tel" value="${esc(String(preset.phone || "").replace(/^965/, ""))}"></label></div>` : ""}
      ${kind === "income" ? `<label class="f"><span>البيان</span><input class="in" id="tCat" placeholder="مثال: بيع جملة"></label>` : ""}
      ${isRec ? `<div class="row2"><label class="f"><span>اسم الزبون</span><input class="in" id="tPName" value="${esc(preset.name || "")}"></label><label class="f"><span>الرقم</span><input class="in" id="tPhone" type="tel" value="${esc(preset.phone || "")}" ${preset.phone ? "readonly" : ""}></label></div>` : ""}
      <div class="row2"><label class="f"><span>المبلغ (د.ك) *</span><input class="in" id="tAmt" type="number" step="0.005" min="0" inputmode="decimal" value="${preset.amount != null ? num(preset.amount).toFixed(3) : ""}"></label><label class="f"><span>التاريخ</span><input class="in" id="tDate" type="date" value="${dayKey(new Date())}"></label></div>
      ${kind === "purchase" ? `<label class="f" id="tPaidW" style="display:none"><span>دفعت كام دلوقتي؟ (فاضي = دفعت المبلغ كله، 0 = آجل كله)</span><input class="in" id="tPaid" type="number" step="0.005" min="0" inputmode="decimal" placeholder="المبلغ كله"></label>` : ""}
      ${["expense", "purchase", "income"].includes(kind) ? `<label class="f"><span>${kind === "income" ? "دخل على" : "اتدفع من"}</span><select class="in" id="tBox">${Object.entries(BOX).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label>` : ""}
      ${["expense", "purchase", "income", "sale"].includes(kind) ? docPicker() : ""}
      <label class="f"><span>ملاحظة</span><input class="in" id="tNote" value="${esc(preset.note || "")}"></label>
      <button class="btn tq block" id="tSave">💾 حفظ</button>`, () => {
      const tp = $("tProd"), ts = $("tSup"), tc = $("tCust"), DOC = wireDoc();
      if (tc) tc.onchange = () => { const c = custList().find((x) => x.phone === tc.value); $("tPName").value = c ? c.name || "" : ""; $("tPhone").value = c ? c.phone.replace(/^965/, "") : ""; if (c) $("tPay").value = "credit"; };
      if (ts) { const s2 = () => { $("tPaidW").style.display = ts.value ? "" : "none"; }; ts.onchange = s2; s2(); }
      if (tp) { const sync = () => { const on = !!tp.value; $("tQtyW").style.display = on ? "" : "none"; $("tCatW").style.display = on ? "none" : ""; }; tp.onchange = sync; sync(); }
      $("tSave").onclick = async () => {
        const amount = num($("tAmt").value); if (!(amount > 0)) return toast("اكتب المبلغ", "err");
        if (tp && tp.value) {
          const qty = num($("tQty").value); if (!(qty > 0)) return toast("اكتب الكمية", "err");
          const pr = A.products.find((x) => x.id === tp.value), sup = supOf(ts && ts.value), party = sup ? sup.name : "", note = $("tNote").value.trim();
          try {
            $("tSave").disabled = true;
            await Store.stockMove({ product_id: pr.id, kind: "purchase", qty, cost: amount, note: [party ? "من " + party : "", note].filter(Boolean).join(" – ") || null });
            await Store.saveTransaction({ kind: "purchase", amount, box: $("tBox") ? $("tBox").value : "drawer", attachment: DOC.url || null, date: $("tDate").value || dayKey(new Date()), category: pr.name_ar, note: [fq(qty) + " " + (pr.unit_ar || ""), note].filter(Boolean).join(" – "), party_name: party || null, ...(sup ? { supplier_id: sup.id } : {}) });
            const owed = await payWithPurchase(sup, amount);
            closeSheet(); toast(`اتسجّل ✓ – المخزون زاد ${fq(qty)}${owed > 0.0005 ? ` · فاضل عليك للمورد ${money(owed)}` : ""}`); await refresh();
          } catch (e) { $("tSave").disabled = false; toast(/stock_move|function/.test(e.message) ? "شغّل inventory.sql الأول" : e.message, "err"); }
          return;
        }
        const row = { kind, amount, ...($("tBox") ? { box: $("tBox").value } : {}), ...(DOC.url ? { attachment: DOC.url } : {}), date: $("tDate").value || dayKey(new Date()), note: $("tNote").value.trim() || null, category: $("tCat") ? $("tCat").value.trim() || null : null, party: preset.party || null, party_name: preset.party_name || null };
        const sup = kind === "purchase" ? supOf(ts && ts.value) : null;
        if (sup) { row.party_name = sup.name; row.supplier_id = sup.id; }
        if (kind === "sale") {
          row.category = $("tPay").value; const desc = $("tDesc").value.trim(); row.note = [desc, row.note].filter(Boolean).join(" – ") || null;
          const ph = ($("tPhone").value || "").replace(/\D/g, ""); row.party_name = $("tPName").value.trim() || null;
          if (ph) row.party = /^[124569]\d{7}$/.test(ph) ? "965" + ph : ph;
          if (row.category === "credit" && !row.party) return toast("البيع الآجل محتاج رقم الزبون", "err");
          if (row.category === "credit" && !(await limitOk(row.party, row.amount))) return;
        }
        if (isRec) { const ph = ($("tPhone").value || "").replace(/\D/g, ""); if (!ph) return toast("اكتب رقم الزبون", "err"); row.party = /^[124569]\d{7}$/.test(ph) ? "965" + ph : ph; row.party_name = $("tPName").value.trim() || null; if (kind === "receivable" && !(await limitOk(row.party, row.amount))) return; }
        try { $("tSave").disabled = true; await Store.saveTransaction(row); const owed = sup ? await payWithPurchase(sup, amount) : 0; closeSheet(); toast("اتسجّل ✓" + (owed > 0.0005 ? ` · فاضل عليك للمورد ${money(owed)}` : "")); await refresh(); } catch (e) { toast(e.message.includes("transactions") ? "شغّل كود SQL بتاع الحسابات الأول" : e.message, "err"); $("tSave").disabled = false; }
      };
    });
  }
  // ---------- حسابات العملاء ----------
  const normPh = (v) => { let p = String(v || "").replace(/\D/g, ""); if (/^[124569]\d{7}$/.test(p)) p = "965" + p; return p; };
  function custLedger(phone) {
    const L = [];
    A.orders.filter((o) => normPh(o.phone) === phone && o.status !== "cancelled").forEach((o) => { const sc = o.payment === "credit" ? (o.pay_split ? num(o.pay_split.credit) : num(o.total)) : 0; if (sc > 0) L.push({ d: o.created_at, l: `🧾 طلب #${o.order_no} (${sc < num(o.total) - 0.0005 ? "جزء آجل" : "آجل"})`, a: sc, buy: num(o.total) }); else if (o.status === "delivered") L.push({ d: o.created_at, l: `🧾 طلب #${o.order_no} (${(PAY[o.payment || "cash"] || "").replace(/^\S+ /, "")})`, a: 0, buy: num(o.total) }); });
    A.tx.filter((t) => t.party && normPh(t.party) === phone).forEach((t) => {
      const d = t.date || t.created_at, c = t.created_at;
      if (t.kind === "sale") L.push({ d, c, l: `🛍️ ${t.note || "مبيعات"} (${(PAY[t.category] || PAY.cash).replace(/^\S+ /, "")})`, a: t.category === "credit" ? num(t.amount) : 0, buy: num(t.amount), id: t.id });
      else if (t.kind === "receivable") L.push({ d, c, l: `📝 ${t.note || "آجل"}`, a: num(t.amount), buy: 0, id: t.id });
      else if (t.kind === "receivable_paid") L.push({ d, c, l: `✅ سداد${t.note ? " – " + t.note : ""}`, a: -num(t.amount), buy: 0, id: t.id });
    });
    L.sort((x, y) => dayKey(x.d).localeCompare(dayKey(y.d)) || new Date(x.c || x.d) - new Date(y.c || y.d) || (y.a < 0 ? -1 : 1)); let run = 0; L.forEach((r) => { run += r.a; r.run = run; });
    return { lines: L, bal: run, bought: L.reduce((s2, r) => s2 + r.buy, 0), paid: -L.filter((r) => r.a < 0).reduce((s2, r) => s2 + r.a, 0) };
  }
  function custList() {
    const m = new Map(), name = (ph, n) => { const r = m.get(ph) || { phone: ph, name: "" }; if (n && !r.name) r.name = n; m.set(ph, r); };
    (A.imported || []).filter((c) => c.source === "account").forEach((c) => name(normPh(c.phone), c.name));
    receivables().forEach((r) => name(normPh(r.phone), r.name));
    A.tx.filter((t) => t.party && ["sale", "receivable", "receivable_paid"].includes(t.kind)).forEach((t) => name(normPh(t.party), t.party_name));
    (A.imported || []).forEach((c) => { const r = m.get(normPh(c.phone)); if (r && !r.name) r.name = c.name; });
    return [...m.values()].map((r) => ({ ...r, ...custLedger(r.phone) })).sort((a, b) => b.bal - a.bal || b.bought - a.bought);
  }
  function custsPage() {
    const all = custList(), q = (A.ccq || "").trim(), list = all.filter((c) => !q || (c.name + " " + c.phone).includes(q));
    const owe = all.reduce((a, c) => a + Math.max(0, c.bal), 0);
    const inP = (r) => inPeriod(r.d);
    const credP = all.reduce((a, c) => a + c.lines.filter((r) => r.a > 0 && inP(r)).reduce((x, r) => x + r.a, 0), 0), paidP = all.reduce((a, c) => a + c.lines.filter((r) => r.a < 0 && inP(r)).reduce((x, r) => x - r.a, 0), 0);
    return `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>
      <div class="stats"><div class="stat"><span class="mut">عدد العملاء</span><b>${all.length}</b></div><div class="stat"><span class="mut">عليهم دلوقتي (آجل)</span><b style="color:#dc2626">${money(owe)}</b></div>
        <div class="stat"><span class="mut">آجل جديد في الفترة</span><b style="color:#b45309">${money(credP)}</b></div><div class="stat"><span class="mut">اتحصّل في الفترة</span><b style="color:#16a34a">${money(paidP)}</b></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><button class="btn sm" style="background:#be185d" data-newcust>👥 + عميل جديد</button><button class="btn sm" data-addtx="sale">🧾 + مبيعات</button><button class="btn ghost sm" data-addtx="receivable">📝 + آجل يدوي</button><button class="btn ghost sm" data-export>📗 تصدير Excel</button></div>
      <input class="in" id="ccq" placeholder="🔍 دوّر باسم العميل أو رقمه" value="${esc(q)}" style="margin-bottom:6px">
      ${list.length ? list.map((c) => `<div class="it" style="background:#fff;border-radius:14px;padding:10px;margin:8px 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
        <div class="t" style="flex:1;min-width:140px"><b>👤 ${esc(c.name || "عميل")}</b><div class="mut" style="font-size:13px"><a href="tel:+${esc(c.phone)}">${esc(c.phone)}</a> · اشترى بـ ${money(c.bought)} · دفع آجل ${money(c.paid)}</div></div>
        <div style="text-align:center"><small class="mut">${c.bal > 0.0005 ? "عليه" : c.bal < -0.0005 ? "ليه عندك" : "خالص"}</small><b style="display:block;color:${c.bal > 0.0005 ? "#dc2626" : "#16a34a"}">${money(Math.abs(c.bal))}</b></div>
        <div style="display:flex;gap:6px;width:100%;flex-wrap:wrap">${c.bal > 0.0005 ? `<button class="btn sm green" data-cpay="${esc(c.phone)}">✅ سداد</button>` : ""}<button class="btn sm tq" data-csell="${esc(c.phone)}">🧾 بيع له</button><button class="btn sm ghost" data-cstmt="${esc(c.phone)}">📒 كشف حساب</button><button class="btn sm ghost" data-cedit="${esc(c.phone)}">✏️</button></div></div>`).join("") : '<p class="mut">لسه مفيش عملاء ليهم حساب. دوس «👥 + عميل جديد»، أو سجّل بيع آجل.</p>'}`;
  }
  function custSheet(phone) {
    const c = phone ? custList().find((x) => x.phone === phone) || { phone } : {};
    sheet(`<h3>${phone ? "✏️ تعديل عميل" : "👥 عميل جديد"}</h3>
      <label class="f"><span>اسم العميل *</span><input class="in" id="cuN" value="${esc(c.name || "")}" placeholder="مثال: مطعم البحر / أبو فهد"></label>
      <label class="f"><span>رقم الهاتف *</span><input class="in" id="cuP" type="tel" inputmode="tel" value="${esc(String(c.phone || "").replace(/^965/, ""))}" ${phone ? "readonly" : ""} placeholder="5xxxxxxx"></label>
      <label class="f"><span>المنطقة</span><input class="in" id="cuA"></label>
      ${phone ? "" : `<label class="f"><span>عليه كام من قبل؟ (رصيد سابق – اختياري)</span><input class="in" id="cuO" type="number" step="0.005" min="0" inputmode="decimal"></label>`}
      <button class="btn tq block" id="cuS">💾 حفظ</button>`, () => {
      $("cuS").onclick = async () => {
        const name = $("cuN").value.trim(), ph = normPh($("cuP").value); if (!name) return toast("اكتب اسم العميل", "err"); if (ph.length < 8) return toast("اكتب رقم صحيح", "err");
        try {
          $("cuS").disabled = true;
          await Store.saveCustomers([{ phone: ph, name, source: "account", ...($("cuA").value.trim() ? { area: $("cuA").value.trim() } : {}) }]);
          const o = $("cuO") ? num($("cuO").value) : 0;
          if (o > 0) await Store.saveTransaction({ kind: "receivable", amount: o, date: dayKey(new Date()), party: ph, party_name: name, note: "رصيد سابق" });
          closeSheet(); toast("اتحفظ ✓"); A.asub = "custs"; A.tab = "accounts"; await refresh();
        } catch (e) { $("cuS").disabled = false; toast(/customers/.test(e.message) ? "شغّل customers-table.sql الأول" : e.message, "err"); }
      };
    });
  }
  function custStmt(phone) {
    const c = custList().find((x) => x.phone === phone) || { phone, name: "", ...custLedger(phone) };
    const txt = `كشف حساب ${c.name || ""} – Goten\n` + c.lines.filter((r) => r.a).map((r) => `${dayKey(r.d)} ${r.l.replace(/^\S+ /, "")}: ${r.a > 0 ? "+" : ""}${r.a.toFixed(3)} (الرصيد ${r.run.toFixed(3)})`).join("\n") + `\nالمطلوب: ${Math.max(0, c.bal).toFixed(3)} د.ك`;
    sheet(`<h3>📒 كشف حساب ${esc(c.name || c.phone)}</h3>
      <div class="stats" style="margin:8px 0"><div class="stat"><span class="mut">إجمالي مشترياته</span><b>${money(c.bought)}</b></div><div class="stat"><span class="mut">${c.bal >= 0 ? "عليه" : "ليه عندك"}</span><b style="color:${c.bal > 0.0005 ? "#dc2626" : "#16a34a"}">${money(Math.abs(c.bal))}</b></div></div>
      <div class="card">${c.lines.map((r) => `<div class="line"><span>${esc(r.l)}<br><small class="mut">${dayKey(r.d)}${r.a ? " · الرصيد " + money(r.run) : " · مدفوع"}</small></span><b style="color:${r.a > 0 ? "#dc2626" : r.a < 0 ? "#16a34a" : "#64748b"};direction:ltr">${r.a ? (r.a > 0 ? "+" : "") + r.a.toFixed(3) : money(r.buy)}</b></div>`).join("") || '<p class="mut">لسه مفيش حركات.</p>'}
        <div class="line total"><span>${c.bal >= 0 ? "عليه" : "ليه عندك"}</span><span>${money(Math.abs(c.bal))}</span></div></div>
      <div class="row2">${c.bal > 0.0005 ? `<button class="btn green" data-cpay="${esc(phone)}">✅ سداد</button>` : `<span></span>`}<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(phone)}?text=${encodeURIComponent(txt)}">💬 ابعت الكشف</a></div><button class="btn ghost block" style="margin-top:8px" data-pstmt="${esc(phone)}">🖨️ طباعة / PDF</button>`);
  }
  // ---------- الموردين ----------
  const supOf = (id) => (id && (A.sups || []).find((x) => x.id === id)) || null;
  function supStats(id) {
    const x = supOf(id), t = A.tx.filter((r) => r.supplier_id === id);
    const bought = sum(t.filter((r) => r.kind === "purchase")), paid = sum(t.filter((r) => r.kind === "supplier_paid"));
    return { open: num(x && x.opening_balance), bought, paid, bal: num(x && x.opening_balance) + bought - paid, count: t.filter((r) => r.kind === "purchase").length };
  }
  const supBal = (id) => supStats(id).bal;
  async function payWithPurchase(sup, amount) {
    if (!sup) return 0;
    const raw = $("tPaid") ? $("tPaid").value : "", paid = raw === "" ? amount : Math.min(amount, num(raw));
    if (paid > 0) await Store.saveTransaction({ kind: "supplier_paid", amount: paid, date: $("tDate").value || dayKey(new Date()), supplier_id: sup.id, party_name: sup.name, note: "دفعة مع الفاتورة" });
    return amount - paid;
  }
  function supMini() {
    if (A.sups === null || !(A.sups || []).length) return "";
    const total = A.sups.reduce((a, x) => a + Math.max(0, supBal(x.id)), 0);
    return `<div class="notice" data-asub="sups" style="cursor:pointer;background:#ecfdf5;color:#065f46">🚚 عليك للموردين <b>${money(total)}</b> – اضغط للتفاصيل</div>`;
  }
  function supsPage() {
    if (A.sups === null) return supSection();
    const list = A.sups || [], owe = list.reduce((a, x) => a + Math.max(0, supBal(x.id)), 0);
    const pt = A.tx.filter((t) => t.supplier_id && inPeriod(t.date || t.created_at));
    return `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>
      <div class="stats"><div class="stat"><span class="mut">عدد الموردين</span><b>${list.length}</b></div><div class="stat"><span class="mut">عليك ليهم دلوقتي</span><b style="color:#dc2626">${money(owe)}</b></div>
        <div class="stat"><span class="mut">اشتريت منهم في الفترة</span><b style="color:#b45309">${money(sum(pt.filter((t) => t.kind === "purchase")))}</b></div><div class="stat"><span class="mut">دفعتلهم في الفترة</span><b style="color:#16a34a">${money(sum(pt.filter((t) => t.kind === "supplier_paid")))}</b></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><button class="btn sm" style="background:#0f766e" data-newsup>🚚 + مورد جديد</button><button class="btn tq sm" data-addtx="purchase">🛒 + مشتريات</button><button class="btn ghost sm" data-export>📗 تصدير Excel</button></div>
      ${supSection()}`;
  }
  function supSection() {
    if (A.sups === null) return `<div class="h2">🚚 الموردين</div><div class="notice">شغّل ملف <b>suppliers.sql</b> في Supabase علشان تفعّل الموردين.</div>`;
    const list = A.sups || [], total = list.reduce((a, x) => a + Math.max(0, supBal(x.id)), 0);
    return `<div class="h2">🚚 الموردين ${total > 0.0005 ? `<span class="mut" style="font-size:14px">· عليك ${money(total)}</span>` : ""} <button class="btn ghost sm" data-newsup>+ مورد</button></div>
      ${list.length ? list.map((x) => { const st = supStats(x.id); return `<div class="it" style="background:#fff;border-radius:14px;padding:10px;margin:8px 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
        <div class="t" style="flex:1;min-width:140px"><b>🚚 ${esc(x.name)}</b><div class="mut" style="font-size:13px">${x.phone ? `<a href="tel:${esc(x.phone)}">${esc(x.phone)}</a> · ` : ""}اشتريت ${money(st.bought + st.open)} · دفعت ${money(st.paid)}</div></div>
        <div style="text-align:center"><small class="mut">${st.bal > 0.0005 ? "عليك ليه" : st.bal < -0.0005 ? "ليك عنده" : "خالص"}</small><b style="display:block;color:${st.bal > 0.0005 ? "#dc2626" : "#16a34a"}">${money(Math.abs(st.bal))}</b></div>
        <div style="display:flex;gap:6px;width:100%"><button class="btn sm green" data-suppay="${x.id}">💳 سداد</button><button class="btn sm tq" data-supbuy="${x.id}">🛒 شراء منه</button><button class="btn sm ghost" data-supstmt="${x.id}">📒 كشف حساب</button><button class="btn sm ghost" data-supedit="${x.id}">✏️</button></div></div>`; }).join("") : '<p class="mut">لسه مفيش موردين. دوس «🚚 + مورد» وضيف التجار اللي بتشتري منهم.</p>'}`;
  }
  function supSheet(id) {
    const x = supOf(id) || {};
    sheet(`<h3>${id ? "✏️ تعديل مورد" : "🚚 مورد جديد"}</h3>
      <label class="f"><span>اسم المورد *</span><input class="in" id="spN" value="${esc(x.name || "")}" placeholder="مثال: سوق شرق – أبو علي"></label>
      <label class="f"><span>رقم الهاتف</span><input class="in" id="spP" type="tel" inputmode="tel" value="${esc(x.phone || "")}"></label>
      <label class="f"><span>عليك ليه كام من قبل؟ (رصيد سابق – اختياري)</span><input class="in" id="spO" type="number" step="0.005" inputmode="decimal" value="${x.opening_balance ? num(x.opening_balance) : ""}"></label>
      <label class="f"><span>📅 بتدفعله يوم كام في الشهر؟ (اختياري – هيوصلك تنبيه قبلها بيوم)</span><input class="in" id="spDay" type="number" min="1" max="31" inputmode="numeric" value="${x.pay_day || ""}"></label>
      <label class="f"><span>ملاحظة</span><input class="in" id="spT" value="${esc(x.note || "")}" placeholder="بيورّد إيه، مواعيده..."></label>
      <button class="btn tq block" id="spS">💾 حفظ</button>${id ? `<button class="btn ghost block" style="margin-top:8px;color:var(--red)" id="spD">🗑️ حذف المورد</button>` : ""}`, () => {
      $("spS").onclick = async () => {
        const name = $("spN").value.trim(); if (!name) return toast("اكتب اسم المورد", "err");
        let phone = $("spP").value.replace(/\D/g, ""); if (/^[124569]\d{7}$/.test(phone)) phone = "965" + phone;
        try { $("spS").disabled = true; await Store.saveSupplier({ ...(id ? { id } : {}), name, phone: phone || null, opening_balance: num($("spO").value), note: $("spT").value.trim() || null, ...($("spDay").value || x.pay_day ? { pay_day: $("spDay").value ? Math.min(31, Math.max(1, parseInt($("spDay").value))) : null } : {}) }); closeSheet(); toast("اتحفظ ✓"); await refresh(); }
        catch (e) { $("spS").disabled = false; toast(/suppliers/.test(e.message) ? "شغّل suppliers.sql الأول" : e.message, "err"); }
      };
      const dl = $("spD"); if (dl) dl.onclick = async () => { if (!(await UI.ask("حذف المورد؟ (الحركات القديمة هتفضل في الحسابات)"))) return; await Store.deleteSupplier(id); closeSheet(); toast("اتحذف"); await refresh(); };
    });
  }
  function supPaySheet(id) {
    const x = supOf(id), bal = supBal(id);
    sheet(`<h3>💳 سداد لـ ${esc(x.name)}</h3><p class="mut">عليك ليه دلوقتي: <b style="color:#dc2626">${money(Math.max(0, bal))}</b></p>
      <div class="row2"><label class="f"><span>المبلغ (د.ك) *</span><input class="in" id="ppA" type="number" step="0.005" min="0" inputmode="decimal" value="${bal > 0.0005 ? bal.toFixed(3) : ""}"></label><label class="f"><span>التاريخ</span><input class="in" id="ppD" type="date" value="${dayKey(new Date())}"></label></div>
      <label class="f"><span>طريقة الدفع</span><select class="in" id="ppM"><option>كاش</option><option>تحويل بنكي</option><option>كي نت / لينك</option></select></label>
      <label class="f"><span>ملاحظة</span><input class="in" id="ppN"></label><button class="btn green block" id="ppS">✅ تسجيل السداد</button>`, () => {
      $("ppS").onclick = async () => {
        const a = num($("ppA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err");
        try { $("ppS").disabled = true; await Store.saveTransaction({ kind: "supplier_paid", amount: a, date: $("ppD").value || dayKey(new Date()), supplier_id: id, party_name: x.name, category: $("ppM").value, note: $("ppN").value.trim() || null }); closeSheet(); toast(`اتسجّل ✓ – الباقي ${money(Math.max(0, bal - a))}`); await refresh(); }
        catch (e) { $("ppS").disabled = false; toast(/supplier/.test(e.message) ? "شغّل suppliers.sql الأول" : e.message, "err"); }
      };
    });
  }
  function supStmt(id) {
    const x = supOf(id), st = supStats(id);
    const rows = A.tx.filter((r) => r.supplier_id === id).sort((a, b) => (a.date || dayKey(a.created_at)).localeCompare(b.date || dayKey(b.created_at)) || new Date(a.created_at) - new Date(b.created_at) || (a.kind === "purchase" ? -1 : 1));
    let run = st.open; const lines = [];
    if (st.open) lines.push({ d: "", l: "رصيد سابق", a: st.open, run });
    rows.forEach((r) => { const sign = r.kind === "purchase" ? 1 : -1; run += sign * num(r.amount); lines.push({ d: r.date || dayKey(r.created_at), l: r.kind === "purchase" ? `🛒 ${r.category || "مشتريات"}${r.note ? " – " + r.note : ""}` : `💳 سداد${r.category ? " " + r.category : ""}${r.note ? " – " + r.note : ""}`, a: sign * num(r.amount), run, id: r.id }); });
    const txt = `كشف حساب ${x.name}\n` + lines.map((l) => `${l.d} ${l.l.replace(/^\S+ /, "")}: ${l.a > 0 ? "+" : ""}${num(l.a).toFixed(3)} (الرصيد ${l.run.toFixed(3)})`).join("\n") + `\nالرصيد النهائي: ${st.bal.toFixed(3)} د.ك`;
    sheet(`<h3>📒 كشف حساب ${esc(x.name)}</h3>
      <div class="stats" style="margin:8px 0"><div class="stat"><span class="mut">إجمالي المشتريات</span><b>${money(st.bought + st.open)}</b></div><div class="stat"><span class="mut">إجمالي المدفوع</span><b style="color:#16a34a">${money(st.paid)}</b></div></div>
      <div class="card">${lines.map((l) => `<div class="line"><span>${esc(l.l)}<br><small class="mut">${esc(l.d)} · الرصيد ${money(l.run)}</small></span><b style="color:${l.a > 0 ? "#dc2626" : "#16a34a"};direction:ltr">${l.a > 0 ? "+" : ""}${num(l.a).toFixed(3)}</b></div>`).join("") || '<p class="mut">لسه مفيش حركات.</p>'}
        <div class="line total"><span>${st.bal >= 0 ? "عليك ليه" : "ليك عنده"}</span><span>${money(Math.abs(st.bal))}</span></div></div>
      <div class="row2"><button class="btn green" id="stPay">💳 سداد</button>${x.phone ? `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(x.phone)}?text=${encodeURIComponent(txt)}">💬 ابعت الكشف</a>` : `<button class="btn ghost" id="stCopy">📋 نسخ الكشف</button>`}</div>`, () => {
      $("stPay").onclick = () => supPaySheet(id);
      const cp = $("stCopy"); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(txt); toast("اتنسخ ✓"); } catch (e) { toast("مقدرتش أنسخ", "err"); } };
    });
  }
  function stockPick() {
    sheet(`<h3>📦 المخزون</h3><label class="f"><span>المنتج</span><select class="in" id="pkP">${A.products.map((p) => `<option value="${p.id}">${esc(p.name_ar)}${p.stock != null ? ` (موجود ${fq(p.stock)} ${esc(p.unit_ar || "")})` : " (مش متتبَّع)"}</option>`).join("")}</select></label>
      <label class="radio"><input type="radio" name="pkK" value="purchase" checked> ➕ إضافة كمية (شراء بضاعة) – بتتسجّل في المشتريات</label>
      <label class="radio"><input type="radio" name="pkK" value="count"> 📝 جرد – اكتب الكمية الموجودة فعلاً</label>
      <label class="radio"><input type="radio" name="pkK" value="waste"> ➖ تالف / هالك</label>
      <button class="btn tq block" id="pkGo" style="margin-top:8px">التالي ←</button><button class="btn ghost block" style="margin-top:8px" data-asub="stock">📋 افتح صفحة المخزون كلها</button>`, () => {
      $("pkGo").onclick = () => { const id = $("pkP").value, k = document.querySelector("input[name=pkK]:checked").value; closeSheet(); if (!id) return; if (k === "purchase") txSheet("purchase", { product: id }); else stockSheet(k, id); };
    });
  }
  function exportCsv() {
    const rows = [["النوع", "التاريخ", "البيان", "الطرف", "طريقة الدفع", "المبلغ"]];
    A.orders.filter((o) => o.status === "delivered" && inPeriod(o.created_at)).forEach((o) => rows.push(["مبيعات – طلب #" + o.order_no, dayKey(o.created_at), (o.items || []).map((i) => i.name_ar + " ×" + i.qty).join(" + "), o.customer_name + " " + o.phone, PAY[o.payment || "cash"].replace(/^\S+ /, ""), num(o.total).toFixed(3)]));
    A.tx.filter((t) => inPeriod(t.date || t.created_at)).forEach((t) => rows.push([KINDS[t.kind].replace(/^\S+ /, ""), t.date || dayKey(t.created_at), [t.category, t.note].filter(Boolean).join(" – "), t.party_name || "", t.kind === "sale" ? (PAY[t.category] || PAY.cash).replace(/^\S+ /, "") : "", (t.kind === "supplier_paid" ? "سداد " : t.kind === "sale" ? "" : ["purchase", "expense", "driver_settle"].includes(t.kind) ? "-" : "") + num(t.amount).toFixed(3)]));
    const tracked = A.products.filter((p) => p.stock != null);
    if (tracked.length) {
      rows.push([], ["📦 المخزون الحالي"], ["المنتج", "الوحدة", "الكمية الموجودة", "حد التنبيه", "تكلفة الوحدة", "قيمة المخزون", "الحالة"]);
      let tv = 0;
      tracked.forEach((p) => { const v = Math.max(0, num(p.stock)) * num(p.cost); tv += v; rows.push([p.name_ar, p.unit_ar || "", fq(p.stock), fq(p.low_stock), p.cost != null ? num(p.cost).toFixed(3) : "", p.cost != null ? v.toFixed(3) : "", { ok: "متوفر", low: "قرب يخلص", out: "خلص" }[stockState(p)]]); });
      rows.push(["الإجمالي", "", "", "", "", tv.toFixed(3), ""]);
    }
    const cl = custList().filter((c) => Math.abs(c.bal) > 0.0005 || c.bought);
    if (cl.length) {
      rows.push([], ["👥 حسابات العملاء"], ["العميل", "الهاتف", "إجمالي مشترياته", "اللي دفعه من الآجل", "عليه"]);
      let tb = 0; cl.forEach((c) => { tb += c.bal; rows.push([c.name || "", c.phone, c.bought.toFixed(3), c.paid.toFixed(3), c.bal.toFixed(3)]); });
      rows.push(["الإجمالي", "", "", "", tb.toFixed(3)]);
    }
    if ((A.sups || []).length) {
      rows.push([], ["🚚 حسابات الموردين"], ["المورد", "الهاتف", "رصيد سابق", "إجمالي المشتريات", "إجمالي المدفوع", "عليك ليه"]);
      let tb = 0; A.sups.forEach((x) => { const st = supStats(x.id); tb += st.bal; rows.push([x.name, x.phone || "", st.open.toFixed(3), st.bought.toFixed(3), st.paid.toFixed(3), st.bal.toFixed(3)]); });
      rows.push(["الإجمالي", "", "", "", "", tb.toFixed(3)]);
    }
    const mv = (A.moves || []).filter((m) => inPeriod(m.created_at));
    if (mv.length) {
      rows.push([], ["📜 حركات المخزون في الفترة"], ["النوع", "التاريخ", "المنتج", "الكمية", "الرصيد بعدها", "التكلفة", "ملاحظة"]);
      mv.forEach((m) => rows.push([(MV[m.kind] || m.kind).replace(/^\S+ /, ""), dayKey(m.created_at), m.product_name || "", (num(m.qty) > 0 ? "+" : "") + fq(m.qty), m.balance != null ? fq(m.balance) : "", m.cost ? num(m.cost).toFixed(3) : "", m.note || ""]));
    }
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const label = (PERIODS.find((p) => p[0] === A.period) || [, ""])[1];
    const file = new File([csv], `goten-حسابات-${label}-${dayKey(new Date())}.csv`, { type: "text/csv" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(() => {});
    else { const l = document.createElement("a"); l.href = URL.createObjectURL(file); l.download = file.name; document.body.appendChild(l); l.click(); l.remove(); }
  }

  // ---------- الزباين ----------
  function customerList() {
    const m = new Map();
    for (const x of A.imported || []) m.set(x.phone, { phone: x.phone, name: x.name || "زبون", orders: 0, spent: 0, optin: !!x.optin, imported: true, last: x.created_at, addr: x.area || "" });
    for (const o of [...A.orders].sort((x, y) => new Date(x.created_at) - new Date(y.created_at))) {
      if (!o.phone) continue;
      const c = m.get(o.phone) || { phone: o.phone, name: o.customer_name, orders: 0, spent: 0, optin: false };
      c.imported = false;
      c.name = o.customer_name || c.name; c.orders++; if (o.status !== "cancelled") c.spent += num(o.total);
      c.last = o.created_at; c.addr = `${o.area} – ق${o.block || ""} – ش${o.street || ""}${o.avenue ? " – ج" + o.avenue : ""} – م${o.house || ""}`;
      if (o.marketing_opt_in) c.optin = true;
      m.set(o.phone, c);
    }
    return [...m.values()].sort((a, b) => new Date(b.last) - new Date(a.last));
  }
  const targets = () => customerList().filter((c) => !A.cOnlyOpt || c.optin);
  function customers() {
    const all = customerList(), q = A.cq.trim();
    const list = all.filter((c) => !q || (c.name + " " + c.phone + " " + c.addr).includes(q));
    const opt = all.filter((c) => c.optin).length;
    return `<div class="h2">الزباين (${all.length}) <span class="mut" style="font-weight:500">${opt} موافقين على العروض</span></div>
      <div class="card"><b>📣 رسالة لكل الزباين</b>
        <label class="switch"><span>الموافقين على العروض بس (${opt})</span><input type="checkbox" id="cOnlyOpt" ${A.cOnlyOpt ? "checked" : ""}></label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn tq sm" data-bcast>✉️ اكتب رسالة وابعتها</button><button class="btn ghost sm" data-vcf>📇 حفظهم في جهات الاتصال</button><button class="btn ghost sm" data-copynums>📋 نسخ الأرقام</button></div></div>
      <div class="card"><b>🔔 إشعار عروض على التطبيق</b><p class="mut" style="margin:6px 0">بيوصل كإشعار لكل زبون فعّل الإشعارات في Goten (<b id="pushCnt">…</b> زبون). من غير واتساب.</p>
        <button class="btn tq sm" data-pushall>🔔 ابعت إشعار لكل الزباين</button></div>
      <button class="btn block" data-import style="margin-bottom:10px">➕ إضافة / استيراد زباين</button>
      <input class="in" id="cq" placeholder="ابحث بالاسم أو الرقم أو المنطقة..." value="${esc(A.cq)}">
      <div class="list">${list.map((c) => `<div class="it" style="align-items:flex-start"><div style="font-size:28px">👤</div><div class="t"><b>${esc(c.name)} ${c.optin ? '<span class="pill g">📣 عروض</span>' : ""}${c.imported ? '<span class="pill">📥 مضاف</span>' : ""}</b>
        <span class="mut">${esc(c.phone)}${c.orders ? ` · ${c.orders} طلب · ${money(c.spent)}` : ""}</span>${c.addr ? `<div class="mut" style="white-space:normal">📍 ${esc(c.addr)}</div>` : ""}<div class="mut">${c.orders ? "آخر طلب" : "اتضاف"}: ${fmtDate(c.last)}</div></div>
        <div style="display:flex;flex-direction:column;gap:6px"><a class="btn sm ghost" href="tel:+${esc(c.phone)}">📞</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(c.phone)}">💬</a>${c.imported ? `<button class="btn sm ghost" data-delcust="${esc(c.phone)}">🗑️</button>` : ""}</div></div>`).join("") || '<p class="mut">لسه مفيش زباين – هيظهروا هنا أول ما ييجي أول طلب.</p>'}</div>`;
  }
  function pushAll() {
    sheet(`<h3>🔔 إشعار لكل الزباين</h3><label class="f"><span>العنوان</span><input class="in" id="pT" maxlength="60" placeholder="مثال: 🐟 عرض اليوم"></label>
      <label class="f"><span>الرسالة</span><textarea class="in" id="pB" rows="3" maxlength="200" placeholder="مثال: زبيدي طازج بـ 3.500 د.ك بدل 4.250 – لحد الساعة 10 بالليل"></textarea></label>
      <button class="btn tq block" id="pSend">📤 إرسال لكل الزباين</button><p class="mut">الإشعار بيوصل فوراً لكل زبون مفعّل الإشعارات، ولما يدوس عليه بيفتح المتجر.</p>`, () => {
      $("pSend").onclick = async () => {
        const t = $("pT").value.trim(), b = $("pB").value.trim();
        if (!t || !b) return toast("اكتب العنوان والرسالة", "err");
        if (!(await UI.ask(`إرسال الإشعار لكل الزباين المفعّلين؟`))) return;
        $("pSend").disabled = true;
        try { const n = await Store.broadcastPush(t, b); closeSheet(); toast(`✅ اتبعت لـ ${n} زبون`); } catch (e) { toast(e.message, "err"); $("pSend").disabled = false; }
      };
    });
  }
  function vcfShare() {
    const list = targets(); if (!list.length) return toast("مفيش زباين في القايمة", "err");
    const vcf = list.map((c) => `BEGIN:VCARD\r\nVERSION:3.0\r\nN:${c.name} Goten;;;;\r\nFN:${c.name} - Goten\r\nTEL;TYPE=CELL:+${c.phone}\r\nNOTE:${c.addr}\r\nEND:VCARD`).join("\r\n");
    const file = new File([vcf], "goten-customers.vcf", { type: "text/vcard" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: "زباين Goten" }).catch(() => {});
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); }
    sheet(`<h3>📇 بعد ما تحفظ جهات الاتصال</h3><p>عشان تبعت رسالة واحدة توصل للكل مرة واحدة من الواتساب:</p>
      <ol style="line-height:1.9"><li>افتح الملف واختار <b>«إضافة كل جهات الاتصال (${list.length})»</b>.</li><li>في الواتساب: <b>الدردشات ← ⋯ ← قوائم البث ← قائمة جديدة</b>.</li><li>اختار الزباين (أساميهم آخرها <b>Goten</b>) ← <b>إنشاء</b>.</li><li>اكتب الرسالة مرة واحدة وابعتها، توصل لكل واحد لوحده.</li></ol>
      <p class="mut">⚠️ رسالة قايمة البث بتوصل بس للي حافظ رقمك عنده. عشان كده اطلب من الزباين يحفظوا رقم المحل.</p>`);
  }
  function broadcast() {
    const list = targets(); if (!list.length) return toast("مفيش زباين في القايمة", "err");
    let i = 0;
    sheet(`<h3>✉️ رسالة لـ ${list.length} زبون</h3><textarea class="in" id="bMsg" rows="5" placeholder="مثال: عرض اليوم 🐟 زبيدي طازج بـ 3.500 د.ك بدل 4.250 – اطلب من التطبيق: ${esc(location.origin + location.pathname.replace(/admin\.html.*$/, ""))}"></textarea>
      <label class="switch"><span>اكتب اسم الزبون في أول الرسالة</span><input type="checkbox" id="bName" checked></label>
      <div class="card" style="background:#effcfc"><div id="bWho" class="mut"></div><a class="btn tq block" id="bSend" target="_blank" rel="noopener" style="margin-top:8px">📤 إرسال</a>
      <div style="display:flex;gap:6px;margin-top:8px"><button class="btn ghost sm" id="bSkip">تخطي ⏭️</button><button class="btn ghost sm" id="bCopy">📋 نسخ الرسالة</button></div></div>
      <p class="mut">كل ضغطة على «إرسال» بتفتح الواتساب على الزبون والرسالة مكتوبة، تدوس إرسال وترجع هنا للي بعده. الواتساب مش بيسمح بإرسال تلقائي للكل من غير ما تدوس.</p>`, () => {
      const upd = () => {
        if (i >= list.length) { $("bWho").innerHTML = "<b>✅ خلصت كل الزباين</b>"; $("bSend").style.display = "none"; return; }
        const c = list[i], m = $("bMsg").value.trim(), txt = ($("bName").checked ? `أهلاً ${c.name} 👋\n` : "") + m;
        $("bWho").innerHTML = `<b>${i + 1} / ${list.length}</b> – ${esc(c.name)} (${esc(c.phone)})`;
        $("bSend").href = "https://wa.me/" + c.phone + "?text=" + encodeURIComponent(txt);
      };
      $("bMsg").oninput = upd; $("bName").onchange = upd;
      $("bSend").onclick = (e) => { if (!$("bMsg").value.trim()) { e.preventDefault(); return toast("اكتب الرسالة الأول", "err"); } setTimeout(() => { i++; upd(); }, 400); };
      $("bSkip").onclick = () => { i++; upd(); };
      $("bCopy").onclick = async () => { try { await navigator.clipboard.writeText($("bMsg").value); toast("اتنسخت ✓"); } catch (e) { toast("انسخها يدوي", "err"); } };
      upd();
    });
  }

  // ---------- استيراد زباين ----------
  function normPhone(raw) {
    let d = String(raw || "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
    d = d.replace(/\D/g, "");
    if (/^[124569]\d{7}$/.test(d)) return "965" + d;
    if (/^965[124569]\d{7}$/.test(d)) return d;
    if (d.length >= 10 && d.length <= 15) return d;
    return null;
  }
  function parseText(txt) {
    const out = [];
    for (const line of String(txt).split(/\r?\n/)) {
      const m = line.match(/(\+?[\d\s\-()]{8,20})/); if (!m) continue;
      const phone = normPhone(m[1]); if (!phone) continue;
      const name = line.replace(m[1], "").replace(/[,;:\-–|]+/g, " ").trim();
      out.push({ phone, name: name || "زبون" });
    }
    return out;
  }
  function parseVcf(txt) {
    const out = [];
    for (const card of String(txt).split(/BEGIN:VCARD/i).slice(1)) {
      const un = card.replace(/\r?\n[ \t]/g, "");
      const fn = (un.match(/^FN[^:]*:(.*)$/im) || [])[1] || "";
      const n = (un.match(/^N[^:]*:(.*)$/im) || [])[1] || "";
      const tels = [...un.matchAll(/^(?:item\d+\.)?TEL[^:]*:(.*)$/gim)].map((x) => normPhone(x[1])).filter(Boolean);
      const name = (fn || n.split(";").filter(Boolean).reverse().join(" ")).trim();
      if (tels[0]) out.push({ phone: tels[0], name: name || "زبون" });
    }
    return out;
  }
  function importSheet() {
    let pending = [];
    const hasPicker = "contacts" in navigator && "ContactsManager" in window;
    sheet(`<h3>➕ إضافة / استيراد زباين</h3>
      <div class="card"><b>زبون واحد</b><div class="row2"><label class="f"><span>الاسم</span><input class="in" id="iName"></label><label class="f"><span>الرقم</span><input class="in" id="iPhone" type="tel" inputmode="tel" placeholder="5xxxxxxx"></label></div>
        <label class="f"><span>المنطقة (اختياري)</span><input class="in" id="iArea"></label><button class="btn sm" id="iOne">➕ إضافة</button></div>
      <div class="card"><b>كذا زبون مرة واحدة</b><p class="mut">الصق قايمة، كل زبون في سطر: الاسم والرقم (أي شكل).</p>
        <textarea class="in" id="iList" rows="5" placeholder="محمد 55512345&#10;أحمد +965 6661 2345&#10;99887766"></textarea>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><input type="file" id="iFile" accept=".vcf,text/vcard,text/x-vcard,.txt,.csv" hidden><button class="btn ghost sm" id="iFileBtn">📇 ملف جهات اتصال (vcf)</button>${hasPicker ? '<button class="btn ghost sm" id="iPick">📱 اختار من جهات الاتصال</button>' : ""}</div></div>
      <label class="switch"><span>الزباين دول وافقوا يستلموا عروض</span><input type="checkbox" id="iOpt"></label>
      <div id="iPrev" class="mut" style="margin:8px 0"></div>
      <button class="btn tq block" id="iSave" disabled>💾 حفظ</button>`, () => {
      const show = () => {
        const map = new Map(); pending.forEach((r) => map.set(r.phone, r)); pending = [...map.values()];
        $("iPrev").innerHTML = pending.length ? `جاهز للإضافة: <b>${pending.length}</b> زبون<br>${pending.slice(0, 5).map((r) => esc(r.name) + " – " + r.phone).join("<br>")}${pending.length > 5 ? "<br>…" : ""}` : "";
        $("iSave").disabled = !pending.length;
      };
      $("iList").oninput = () => { pending = parseText($("iList").value); show(); };
      $("iOne").onclick = () => { const ph = normPhone($("iPhone").value); if (!ph) return toast("الرقم مش صحيح", "err"); pending.push({ phone: ph, name: $("iName").value.trim() || "زبون", area: $("iArea").value.trim() || null }); $("iName").value = ""; $("iPhone").value = ""; $("iArea").value = ""; show(); };
      $("iFileBtn").onclick = () => $("iFile").click();
      $("iFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const t = await f.text(); const rows = /BEGIN:VCARD/i.test(t) ? parseVcf(t) : parseText(t); pending = pending.concat(rows); show(); toast(`لقيت ${rows.length} رقم`); };
      if ($("iPick")) $("iPick").onclick = async () => { try { const cs = await navigator.contacts.select(["name", "tel"], { multiple: true }); for (const c of cs) { const ph = normPhone((c.tel || [])[0]); if (ph) pending.push({ phone: ph, name: (c.name || [])[0] || "زبون" }); } show(); } catch (err) { toast("مقدرتش أفتح جهات الاتصال", "err"); } };
      $("iSave").onclick = async () => {
        $("iSave").disabled = true;
        const known = new Set(A.orders.map((o) => o.phone));
        const rows = pending.map((r) => ({ phone: r.phone, name: r.name, area: r.area || null, optin: $("iOpt").checked, source: "import" }));
        try { await Store.saveCustomers(rows); closeSheet(); toast(`✅ اتضاف ${rows.length} زبون${rows.some((r) => known.has(r.phone)) ? " (اللي عنده طلبات اتحدّث)" : ""}`); await refresh(); }
        catch (err) { toast(err.message.includes("customers") ? "شغّل كود SQL بتاع الزباين الأول" : err.message, "err"); $("iSave").disabled = false; }
      };
    });
  }

  // ---------- المناديب ----------
  function dWallet(id) {
    const w = dCash(id), today = w.del.filter((o) => isToday(o.delivered_at || o.updated_at));
    return { n: w.del.length, today: today.length, cash: w.ordCash, earn: w.earn, hand: w.hand, paid: w.paid, cashWith: w.cashWith, due: w.earn - w.paid, mv: w.mv };
  }
  function walletCards() {
    const ds = A.profiles.filter((p) => p.role === "driver"); if (!ds.length) return "";
    return `<div class="h2">💰 محافظ المناديب <span class="mut" style="font-size:13px">(${money(A.settings.driver_pay == null ? 0.5 : A.settings.driver_pay)} لكل توصيلة – تتغيّر من الإعدادات)</span></div>${ds.map((p) => { const w = dWallet(p.id); return `<div class="card"><div class="line"><b>🛵 ${esc(p.full_name || "مندوب")}</b><span class="mut">${w.n} توصيلة · النهارده ${w.today}</span></div>
      <div class="line"><span>💵 كاش معاه للمحل</span><b style="color:${w.cashWith > 0.0005 ? "#b45309" : "#16a34a"}">${money(w.cashWith)}</b></div>
      <div class="line"><span>💰 أرباحه اللي ليه</span><b style="color:#16a34a">${money(w.due)}</b></div>
      <div class="line mut" style="font-size:13px"><span>الصافي</span><span>${w.cashWith - w.due >= 0 ? `يسلّمك ${money(w.cashWith - w.due)}` : `تدفعله ${money(w.due - w.cashWith)}`}</span></div>
      <div class="acts"><button class="btn sm green" data-dmove="${p.id}:handover">💵 استلمت منه كاش</button><button class="btn sm tq" data-dmove="${p.id}:payout">💸 صرفتله أرباح</button>${w.mv.length ? `<button class="btn sm ghost" data-dmlog="${p.id}">📜 الحركات</button>` : ""}</div></div>`; }).join("")}`;
  }
  function dMoveSheet(id, kind) {
    const p = A.profiles.find((x) => x.id === id), w = dWallet(id), sug = kind === "handover" ? Math.max(0, w.cashWith) : Math.max(0, w.due);
    sheet(`<h3>${kind === "handover" ? "💵 استلمت كاش من" : "💸 صرفت أرباح لـ"} ${esc(p.full_name || "المندوب")}</h3>
      <label class="f"><span>المبلغ (د.ك)</span><input class="in" id="dmA" type="number" step="0.005" inputmode="decimal" value="${sug ? sug.toFixed(3) : ""}"></label>
      <label class="f"><span>ملاحظة (اختياري)</span><input class="in" id="dmN" placeholder="${kind === "handover" ? "مثال: كاش يوم الخميس" : "مثال: أرباح الأسبوع"}"></label>
      <button class="btn tq block" id="dmS">💾 حفظ</button>`, () => {
      $("dmS").onclick = async () => { const a = num($("dmA").value); if (!(a > 0)) return toast("اكتب المبلغ", "err"); $("dmS").disabled = true;
        try { await Store.addDriverMove({ driver_id: id, kind, amount: a, note: $("dmN").value.trim() }); closeSheet(); toast("تم ✓"); await refresh(); } catch (e) { toast(e.message.includes("driver_moves") ? "محتاج تحديث قاعدة البيانات" : e.message, "err"); $("dmS").disabled = false; } };
    });
  }
  function dMoveLog(id) {
    const w = dWallet(id);
    sheet(`<h3>📜 حركات المندوب</h3>${w.mv.map((m) => `<div class="line"><span>${({ payout: "💸 صرفتله", handover: "💵 استلمت", expense: "⛽ مصروف", collect: "🧾 حصّل آجل", commission: "🎁 عمولة" })[m.kind] || m.kind}${m.category ? " " + esc(m.category) : ""} ${fmtDate(m.created_at)}${m.note ? " – " + esc(m.note) : ""}</span><span><b>${money(m.amount)}</b> <button class="btn sm ghost" data-dmdel="${m.id}">🗑️</button></span></div>`).join("")}`);
  }
  function team() {
    const R = { pending: "بانتظار الموافقة", driver: "مندوب", accountant: "محاسب", admin: "أدمن", blocked: "موقوف" };
    return `${walletCards()}<div class="h2">المناديب والحسابات ${Store.live ? "" : '<button class="btn tq sm" data-adddrv>+ مندوب</button>'}</div>
      <p class="mut">${Store.live ? "المندوب يسجّل من صفحة المناديب (driver.html)، وبعدها توافق عليه هنا بتغيير الصلاحية إلى «مندوب»." : "في الوضع التجريبي تقدر تضيف مناديب مباشرة."}</p>
      <div class="list">${A.profiles.map((p) => { const n = A.orders.filter((o) => o.driver_id === p.id && !["delivered", "cancelled"].includes(o.status)).length; return `<div class="it"><div style="font-size:30px">${p.role === "driver" ? "🛵" : p.role === "admin" ? "🛡️" : "👤"}</div><div class="t"><b>${esc(p.full_name || "بدون اسم")}</b><span class="mut">${esc(p.phone || "")}${p.role === "driver" ? ` · طلبات جارية: ${n}` : ""}</span></div>
        <select class="in" style="width:auto" data-role="${p.id}" ${p.id === A.me.id ? "disabled" : ""}>${Object.entries(R).map(([k, v]) => `<option value="${k}" ${p.role === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>`; }).join("") || '<p class="mut">لا يوجد حسابات بعد.</p>'}</div>`;
  }

  // ---------- الإعدادات ----------
  const FEE_B = { kg: "لكل كيلو", piece: "لكل حبة/علبة", qty: "لكل وحدة في السلة", order: "مرة واحدة على الطلب" };
  function feesSheet() {
    let F = JSON.parse(JSON.stringify(A.settings.fees || []));
    const row = (f, i) => `<div class="card" style="background:#f8fafc">
      <div class="row2"><label class="f"><span>الاسم</span><input class="in" data-fk="${i}:name_ar" value="${esc(f.name_ar || "")}"></label><label class="f"><span>السعر (د.ك)</span><input class="in" type="number" step="0.005" min="0" inputmode="decimal" data-fk="${i}:price" value="${f.price || ""}"></label></div>
      <div class="row2"><label class="f"><span>بيتحسب</span><select class="in" data-fk="${i}:basis">${Object.entries(FEE_B).map(([k, l]) => `<option value="${k}" ${f.basis === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f"><span>للزبون</span><select class="in" data-fk="${i}:mode"><option value="always" ${f.mode !== "optional" ? "selected" : ""}>إجباري على كل طلب</option><option value="optional" ${f.mode === "optional" ? "selected" : ""}>اختياري (الزبون يختار)</option></select></label></div>
      <label class="switch"><span>مفعّل</span><input type="checkbox" data-fk="${i}:on" ${f.on !== false ? "checked" : ""}></label>
      <label class="switch"><span>يتحسب كمان على منتجات الجملة</span><input type="checkbox" data-fk="${i}:w" ${f.w ? "checked" : ""}></label>
      <button class="btn sm red" data-fdel="${i}">🗑️ مسح</button></div>`;
    const draw = () => { $("fList").innerHTML = F.map(row).join("") || '<p class="mut">مفيش رسوم.</p>'; };
    sheet(`<h3>🧾 رسوم الطلب</h3><p class="mut">السعر بيتضرب في الكمية حسب اختيارك: «لكل كيلو» بيعدّ الكيلوهات في السلة، و«لكل حبة/علبة» بيعدّ المنتجات اللي مش بالكيلو. الرسوم بتظهر للزبون سطر سطر، وتحتها الإجمالي شامل كل حاجة.</p>
      <div id="fList"></div><button class="btn ghost block" id="fAdd">➕ رسم جديد</button><button class="btn tq block" id="fSave" style="margin-top:8px">💾 حفظ الرسوم</button>`, () => {
      draw();
      const body = document.getElementById("sheet");
      body.addEventListener("input", (e) => { const k = e.target.dataset.fk; if (!k) return; const [i, f] = k.split(":"); F[i][f] = e.target.type === "checkbox" ? e.target.checked : f === "price" ? num(e.target.value) : e.target.value; });
      body.addEventListener("change", (e) => { const k = e.target.dataset.fk; if (!k) return; const [i, f] = k.split(":"); F[i][f] = e.target.type === "checkbox" ? e.target.checked : f === "price" ? num(e.target.value) : e.target.value; });
      body.addEventListener("click", (e) => { const d = e.target.closest("[data-fdel]"); if (d) { F.splice(+d.dataset.fdel, 1); draw(); } });
      $("fAdd").onclick = () => { F.push({ id: "f" + Date.now().toString(36), name_ar: "", name_en: "", price: 0, basis: "kg", mode: "always", on: true, w: false }); draw(); };
      $("fSave").onclick = async () => {
        F = F.filter((f) => (f.name_ar || "").trim()).map((f) => ({ ...f, name_ar: f.name_ar.trim(), price: Math.max(0, num(f.price)) }));
        try { await Store.saveSettings({ fees: F }); closeSheet(); toast("تم الحفظ ✓"); await refresh(); } catch (err) { toast(err.message, "err"); }
      };
    });
  }
  function plistSheet() {
    let L = JSON.parse(JSON.stringify(A.settings.price_list || [])); const st = { image: A.settings.price_list_image || "" };
    const row = (r, i) => `<div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;margin-bottom:6px"><input class="in" placeholder="الصنف" data-lk="${i}:name" value="${esc(r.name || "")}"><input class="in" placeholder="السعر" type="number" step="0.005" inputmode="decimal" data-lk="${i}:price" value="${r.price == null ? "" : r.price}"><input class="in" placeholder="الوحدة" data-lk="${i}:unit" value="${esc(r.unit || "")}"><button class="btn sm ghost" data-ldel="${i}">✕</button></div>`;
    const draw = () => { $("lList").innerHTML = L.map(row).join("") || '<p class="mut">القايمة فاضية.</p>'; };
    sheet(`<h3>📋 قائمة الأسعار</h3><div class="mut" style="margin-bottom:6px">🖼️ صورة القايمة (اختياري):</div>${Editors.imgPicker(st.image)}
      <label class="f"><span>ملاحظة تحت القايمة (اختياري)</span><input class="in" id="lNote" value="${esc(A.settings.price_list_note || "")}" placeholder="مثال: الأسعار بتتغير يومياً حسب السوق"></label>
      <div class="h2" style="margin-top:10px">الأصناف</div><div id="lList"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn ghost sm" id="lAdd">➕ صنف</button><button class="btn ghost sm" id="lFill">📥 انسخ أسعار المنتجات الحالية</button><button class="btn ghost sm" id="lClr">مسح الكل</button></div>
      <button class="btn tq block" id="lSave" style="margin-top:10px">💾 حفظ قائمة الأسعار</button>`, () => {
      Editors.wireImgPicker(st); draw();
      const body = document.getElementById("sheet");
      body.addEventListener("input", (e) => { const k = e.target.dataset.lk; if (!k) return; const [i, f] = k.split(":"); L[i][f] = f === "price" ? (e.target.value === "" ? null : num(e.target.value)) : e.target.value; });
      body.addEventListener("click", (e) => { const d = e.target.closest("[data-ldel]"); if (d) { L.splice(+d.dataset.ldel, 1); draw(); } });
      $("lAdd").onclick = () => { L.push({ name: "", price: null, unit: "كيلو" }); draw(); };
      $("lFill").onclick = () => { const have = new Set(L.map((r) => r.name)); A.products.filter((p) => p.active).forEach((p) => { if (!have.has(p.name_ar)) L.push({ name: p.name_ar, price: num(p.price), unit: (p.sale_type === "wholesale" ? "جملة – " : "") + (p.unit_ar || "") }); }); draw(); };
      $("lClr").onclick = () => { L = []; draw(); };
      $("lSave").onclick = async () => {
        L = L.filter((r) => (r.name || "").trim()).map((r) => ({ name: r.name.trim(), price: r.price == null ? null : num(r.price), unit: (r.unit || "").trim() }));
        try { await Store.saveSettings({ price_list: L, price_list_image: st.image || null, price_list_note: $("lNote").value.trim() || null }); closeSheet(); toast("تم الحفظ ✓"); await refresh(); } catch (err) { toast(err.message, "err"); }
      };
    });
  }
  function settings() {
    const s = A.settings, fi = (k, l, type = "text", extra = "") => `<label class="f"><span>${l}</span><input class="in" id="s_${k}" type="${type}" value="${esc(s[k] == null ? "" : s[k])}" ${extra}></label>`;
    return `<div class="card"><label class="switch"><span><b>المتجر مفتوح ويستقبل طلبات</b></span><input type="checkbox" id="s_store_open" ${s.store_open ? "checked" : ""}></label>
      <div class="row3">${fi("delivery_fee", "رسوم التوصيل", "number", 'step="0.005" inputmode="decimal"')}${fi("min_order", "الحد الأدنى", "number", 'step="0.005" inputmode="decimal"')}${fi("free_delivery_over", "توصيل مجاني فوق", "number", 'step="0.005" inputmode="decimal"')}</div>
      ${fi("delivery_eta", "مدة التوصيل اللي بتظهر للزبون (مثال: خلال ساعتين)")}${fi("whatsapp", "واتساب المتجر (مثال 96550000000)", "tel")}${fi("notice_ar", "شريط تنبيه بالعربي")}${fi("notice_en", "Notice in English")}
      <div class="h2" style="margin-top:14px">⏰ مواعيد التوصيل</div>
      <label class="switch"><span>يظهر للزبون «بأسرع وقت»</span><input type="checkbox" id="s_allow_asap" ${s.allow_asap !== false ? "checked" : ""}></label>
      <label class="f"><span>الفترات (كل فترة في سطر)</span><textarea class="in" id="s_slots" rows="5" dir="ltr" style="text-align:right">${esc((Array.isArray(s.slots) ? s.slots : ["10:00 – 12:00", "12:00 – 14:00", "16:00 – 18:00", "18:00 – 20:00", "20:00 – 22:00"]).join("\n"))}</textarea></label>
      <div class="row2">${fi("slot_days", "يقدر يحجز لكام يوم قدّام", "number", 'min="1" max="7" inputmode="numeric"').replace('value=""', 'value="2"')}${fi("slot_cutoff", "تقفل الفترة قبل بدايتها بكام دقيقة", "number", 'min="0" inputmode="numeric"').replace('value=""', 'value="60"')}</div>
      <div class="h2" style="margin-top:14px">🛵 المندوب اللي بيستلم الطلبات تلقائي</div>
      <label class="f"><span>أول ما الزبون يطلب، الطلب يروح على طول للمندوب ده من غير ما تعيّنه</span><select class="in" id="s_auto_driver"><option value="">❌ لأ – أنا اللي بعيّن المندوب</option>${A.profiles.filter((p) => p.role === "driver").map((p) => `<option value="${p.id}" ${s.auto_driver === p.id ? "selected" : ""}>🛵 ${esc(p.full_name || p.phone || "مندوب")}</option>`).join("")}</select></label>
      <div class="h2" style="margin-top:14px">🛵 أجرة المندوب</div>
      ${fi("driver_pay", "المندوب ياخد كام على كل توصيلة (د.ك)", "number", 'step="0.005" min="0" inputmode="decimal"').replace('value=""', 'value="0.5"')}
      <div class="h2" style="margin-top:14px">⭐ نقاط الولاء</div>
      <label class="switch"><span>نظام النقاط شغال</span><input type="checkbox" id="s_points_on" ${s.points_on !== false ? "checked" : ""}></label>
      <div class="row3">${fi("points_per_kd", "نقاط لكل 1 د.ك", "number", 'step="0.5" min="0" inputmode="decimal"').replace('value=""', 'value="1"')}${fi("point_value", "قيمة النقطة (د.ك)", "number", 'step="0.001" min="0" inputmode="decimal"').replace('value=""', 'value="0.010"')}${fi("points_min", "أقل نقاط للاستخدام", "number", 'min="0" inputmode="numeric"').replace('value=""', 'value="100"')}</div>
      <p class="mut" style="margin-top:0">الزبون بياخد النقاط لما الطلب يتسلّم (على قيمة المنتجات من غير التوصيل). مثال: 1 نقطة لكل دينار، والنقطة بـ 0.010 → كل 100 نقطة = 1 د.ك خصم.</p>
      <button class="btn tq block" id="sSave">💾 حفظ الإعدادات</button></div>
      <div class="card"><b>🧾 رسوم التجهيز والتنظيف والفلين</b><p class="mut">${(A.settings.fees || []).filter((f) => f.on !== false && Number(f.price) > 0).map((f) => `${esc(f.name_ar)}: ${money(f.price)} ${FEE_B[f.basis] || ""}${f.mode === "optional" ? " (اختياري للزبون)" : ""}`).join(" · ") || "لسه مفيش رسوم مفعّلة."}</p><button class="btn sm" data-fees>✏️ تعديل الرسوم</button></div>
      <div class="card"><b>📋 قائمة الأسعار</b><p class="mut">${(A.settings.price_list || []).length} صنف${A.settings.price_list_image ? " + صورة" : ""} – بتظهر للزبون في التطبيق.</p><button class="btn sm" data-plist>✏️ تعديل قائمة الأسعار</button></div>
      <div class="card"><b>شكل التطبيق</b><p class="mut">الشعار، اسم المتجر، لون الشريط العلوي.</p><button class="btn sm" data-editheader>🎨 تعديل الشريط العلوي والشعار</button></div>
      ${Store.live ? "" : '<div class="card"><b>الوضع التجريبي</b><p class="mut">البيانات محفوظة على هذا الجهاز فقط. لربط العملاء والمناديب فعلياً فعّل Supabase (راجع الدليل).</p><button class="btn red sm" id="resetBtn">إرجاع البيانات التجريبية الأصلية</button></div>'}`;
  }

  // ---------- الأحداث ----------
  function bind() {
    const ccq = $("ccq"); if (ccq) ccq.oninput = (e) => { A.ccq = e.target.value; const pos = e.target.selectionStart; render(); $("ccq").focus(); $("ccq").setSelectionRange(pos, pos); };
    const sq = $("sq"); if (sq) sq.oninput = (e) => { A.sq = e.target.value; const pos = e.target.selectionStart; render(); $("sq").focus(); $("sq").setSelectionRange(pos, pos); };
    const cq = $("cq"); if (cq) cq.oninput = (e) => { A.cq = e.target.value; const pos = e.target.selectionStart; render(); $("cq").focus(); $("cq").setSelectionRange(pos, pos); };
    const pc = $("pushCnt"); if (pc) Store.customerPushCount().then((n) => { pc.textContent = n; }).catch(() => { pc.textContent = "0"; });
    const co = $("cOnlyOpt"); if (co) co.onchange = (e) => { A.cOnlyOpt = e.target.checked; };
    const pq = $("pq"); if (pq) pq.oninput = (e) => { A.pq = e.target.value; const pos = e.target.selectionStart; render(); $("pq").focus(); $("pq").setSelectionRange(pos, pos); };
    const ss = $("sSave"); if (ss) ss.onclick = async () => {
      const v = (k) => $("s_" + k).value.trim();
      try { await Store.saveSettings({ store_open: $("s_store_open").checked, delivery_fee: num(v("delivery_fee")), min_order: num(v("min_order")), free_delivery_over: v("free_delivery_over") ? num(v("free_delivery_over")) : null, whatsapp: v("whatsapp").replace(/\D/g, ""), notice_ar: v("notice_ar"), notice_en: v("notice_en"), ...(v("delivery_eta") || A.settings.delivery_eta ? { delivery_eta: v("delivery_eta") || null } : {}), ...("slots" in A.settings || !Store.live ? { slots: $("s_slots").value.split(/\n+/).map((x) => x.trim()).filter(Boolean), slot_days: Math.max(1, Math.min(7, parseInt(v("slot_days")) || 2)), slot_cutoff: Math.max(0, parseInt(v("slot_cutoff")) || 0), allow_asap: $("s_allow_asap").checked } : {}), ...("points_on" in A.settings || !Store.live ? { points_on: $("s_points_on").checked, points_per_kd: Math.max(0, num(v("points_per_kd"))), point_value: Math.max(0, num(v("point_value"))), points_min: Math.max(0, parseInt(v("points_min")) || 0) } : {}), ...("auto_driver" in A.settings || !Store.live ? { auto_driver: $("s_auto_driver").value || null } : {}), ...("driver_pay" in A.settings || !Store.live ? { driver_pay: Math.max(0, num(v("driver_pay"))) } : {}) }); toast("تم الحفظ ✓"); await refresh(); } catch (e) { toast(e.message, "err"); }
    };
    const cd = $("cDay"); if (cd) cd.onchange = () => { A.cday = cd.value || dayKey(new Date()); render(); };
    const clq = $("clq"); if (clq) clq.oninput = (e) => { A.clq = e.target.value; const pos = e.target.selectionStart; render(); $("clq").focus(); $("clq").setSelectionRange(pos, pos); };
    const csS = $("csSave"); if (csS) csS.onclick = saveCset;
    const plS = $("plSave"); if (plS) plS.onclick = savePlan;
    const rS = $("rSel"); if (rS) rS.onchange = () => { const v = rS.value; if (!v) return; if (A.rk === "month") A.rmon = v; else if (A.rk === "year") A.ryear = v; else A.rday = v; render(); };
    const rb = $("resetBtn"); if (rb) rb.onclick = async () => { if (await UI.ask("مسح كل التعديلات والطلبات التجريبية؟")) { await Store.resetDemo(); await refresh(); toast("تم"); } };
  }
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-prdays],[data-prsave],[data-prapply],[data-impx],[data-impin],[data-imph],[data-tab],[data-of],[data-newprod],[data-editprod],[data-editcat],[data-editban],[data-bulk],[data-bulksave],[data-quick],[data-storeopen],[data-adddrv],[data-editheader],[data-bcast],[data-vcf],[data-copynums],[data-pushall],[data-import],[data-delcust],[data-delorder],[data-delallorders],[data-period],[data-addtx],[data-export],[data-settle],[data-rpaid],[data-deltx],[data-sf],[data-smv],[data-shist],[data-asub],[data-buy],[data-stockpick],[data-newsup],[data-supedit],[data-suppay],[data-supstmt],[data-supbuy],[data-newcust],[data-cpay],[data-csell],[data-cstmt],[data-cedit],[data-cpnew],[data-cpedit],[data-cptog],[data-cpshare],[data-dmove],[data-dmlog],[data-fees],[data-plist],[data-csub],[data-gocollect],[data-msub],[data-addmenu],[data-esub],[data-isub],[data-rk],[data-rxlsx],[data-rprint],[data-gomsub],[data-xlsx],[data-backup],[data-emp],[data-esal],[data-eadv],[data-rec],[data-xfer],[data-boxopen],[data-partners],[data-draw],[data-oinv],[data-cday],[data-dclose],[data-carch],[data-cmeta],[data-dsettle],[data-cexport],[data-printrec],[data-pstmt],[data-osplit],[data-dmdel]"); if (!el || !A.me) return;
    const d = el.dataset;
    try {
      if (d.tab) { A.tab = d.tab; render(); scrollTo(0, 0); }
      else if (d.cpnew !== undefined) cpSheet(null);
      else if (d.cpedit) cpSheet(d.cpedit);
      else if (d.cptog) { const c = A.cps.find((x) => x.code === d.cptog); await Store.saveCoupon({ code: c.code, active: !c.active }, false); toast(c.active ? "اتوقف" : "اتشغّل"); await refresh(); }
      else if (d.cpshare) { const c = A.cps.find((x) => x.code === d.cpshare), off = c.kind === "percent" ? `خصم ${num(c.value)}%` : c.kind === "fixed" ? `خصم ${money(c.value)}` : "توصيل مجاني"; const txt = `🐟 عرض من ${A.settings.store_name || "Goten"}!\n${off}${num(c.min_order) ? ` على الطلبات فوق ${money(c.min_order)}` : ""} بكود: ${c.code}${c.ends_at ? `\nلحد ${fmtDate(c.ends_at)}` : ""}\nاطلب من هنا: ${new URL("index.html", location.href).href}`; try { await navigator.clipboard.writeText(txt); toast("📋 اتنسخت الرسالة – ابعتها من «الزباين» أو واتساب"); } catch (x) { sheet(`<h3>📣 رسالة العرض</h3><textarea class="in" rows="6">${esc(txt)}</textarea>`); } }
      else if (d.stockpick !== undefined) stockPick();
      else if (d.newsup !== undefined) { if (A.sups === null) return toast("شغّل suppliers.sql الأول", "err"); supSheet(null); }
      else if (d.supedit) supSheet(d.supedit);
      else if (d.newcust !== undefined) custSheet(null);
      else if (d.cedit) custSheet(d.cedit);
      else if (d.cstmt) custStmt(d.cstmt);
      else if (d.csell) { const c = custList().find((x) => x.phone === d.csell) || {}; txSheet("sale", { phone: d.csell, name: c.name }); setTimeout(() => { const tp2 = $("tPay"); if (tp2) tp2.value = "credit"; }, 0); }
      else if (d.cpay) { closeSheet(); paySheet(d.cpay); }
      else if (d.suppay) supPaySheet(d.suppay);
      else if (d.supstmt) supStmt(d.supstmt);
      else if (d.supbuy) txSheet("purchase", { supplier: d.supbuy });
      else if (d.buy) txSheet("purchase", { product: d.buy });
      else if (d.asub) { closeSheet(); A.tab = "accounts"; A.asub = d.asub; render(); scrollTo(0, 0); }
      else if (d.sf) { A.sfilter = d.sf; render(); }
      else if (d.smv) { const [k, id] = d.smv.split(":"); stockSheet(k, id); }
      else if (d.shist) { const p = A.products.find((x) => x.id === d.shist); sheet(`<h3>📜 حركات ${esc(p.name_ar)}</h3>${(A.moves || []).filter((m) => m.product_id === p.id).map(mvLine).join("") || '<p class="mut">لسه مفيش حركات.</p>'}`); }
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
      else if (d.addmenu !== undefined) addMenu();
      else if (d.esub) { A.esub = d.esub; render(); }
      else if (d.isub) { A.isub = d.isub; render(); }
      else if (d.rk) { A.rk = d.rk; render(); }
      else if (d.rxlsx !== undefined) repXlsx();
      else if (d.rprint !== undefined) repPrint();
      else if (d.msub) { A.msub = d.msub; render(); }
      else if (d.gomsub) { A.tab = "accounts"; A.asub = "money"; A.msub = d.gomsub; render(); scrollTo(0, 0); }
      else if (d.xlsx !== undefined) exportXlsx(false);
      else if (d.backup !== undefined) exportXlsx(true);
      else if (d.impx !== undefined) exportEditable();
      else if (d.prdays) { A.prLocal = { ...(A.prLocal || {}), days: +d.prdays }; render(); }
      else if (d.prsave !== undefined) { const v = { ...prGet() }; try { await Store.saveSettings({ pricing: v }); A.settings.pricing = v; A.prLocal = {}; toast("اتحفظ ✓"); } catch (e) { toast("❌ " + e.message, "err"); } }
      else if (d.prapply) { const p = A.products.find((x) => x.id === d.prapply); if (!p) return; if (!(await UI.ask(`تغيّر سعر «${p.name_ar}» من ${money(p.price)} لـ ${money(+d.prv)}؟`))) return; try { await Store.saveProduct({ ...p, old_price: p.old_price, price: +d.prv }); toast("✅ السعر اتغير"); await refresh(); } catch (e) { toast("❌ " + e.message, "err"); } }
      else if (d.impin !== undefined) importPick();
      else if (d.imph !== undefined) importHistory();
      else if (d.emp) empSheet(d.emp === "new" ? null : d.emp);
      else if (d.esal) empPaySheet(d.esal, "salary");
      else if (d.eadv) empPaySheet(d.eadv, "advance");
      else if (d.rec) recSheet(d.rec === "new" ? null : d.rec);
      else if (d.xfer) xferSheet(d.xfer);
      else if (d.boxopen !== undefined) boxOpenSheet();
      else if (d.partners !== undefined) partnersSheet();
      else if (d.draw) drawSheet(d.draw);
      else if (d.oinv) invoicePrint(d.oinv);
      else if (d.gocollect !== undefined) { A.tab = "accounts"; A.asub = "collect"; A.csub = "late"; render(); scrollTo(0, 0); }
      else if (d.csub) { A.csub = d.csub; render(); }
      else if (d.cday) { A.cday = d.cday; render(); }
      else if (d.dclose) closeSheet2(d.dclose);
      else if (d.carch !== undefined) { A.carch = !A.carch; render(); }
      else if (d.cmeta) { closeSheet(); metaSheet(d.cmeta); }
      else if (d.dsettle) settleSheet(d.dsettle);
      else if (d.cexport !== undefined) exportCollect();
      else if (d.printrec) { const r = JSON.parse(d.printrec); printDoc("سند قبض " + (r.n || ""), `<pre>${esc(r.txt)}</pre>`); }
      else if (d.pstmt) printStmt(d.pstmt);
      else if (d.osplit) splitSheet(d.osplit);
      else if (d.fees !== undefined) feesSheet();
      else if (d.plist !== undefined) plistSheet();
      else if (d.dmove) { const [id, k] = d.dmove.split(":"); dMoveSheet(id, k); }
      else if (d.dmlog) dMoveLog(d.dmlog);
      else if (d.dmdel) { if (!(await UI.ask("مسح الحركة دي؟"))) return; try { await Store.deleteDriverMove(d.dmdel); closeSheet(); await refresh(); toast("اتمسحت"); } catch (err) { toast(err.message, "err"); } }
      else if (d.delorder) {
        const o = A.orders.find((x) => x.id === d.delorder);
        if (await UI.ask(`حذف طلب #${o ? o.order_no : ""} نهائياً؟ مش هيرجع تاني.`)) { await Store.deleteOrder(d.delorder); toast("اتحذف الطلب ✓"); await refresh(); }
      }
      else if (d.delallorders !== undefined) {
        if (!(await UI.ask(`مسح كل الطلبات (${A.orders.length} طلب) نهائياً؟ المبيعات والزباين اللي جايين من الطلبات هيتمسحوا كمان.`))) return;
        sheet(`<h3>⚠️ تأكيد أخير</h3><p>علشان تتأكد إن مش بالغلط، اكتب كلمة <b>امسح</b> ودوس تأكيد.</p><input class="in" id="delWord" autocomplete="off"><button class="btn red block" id="delGo" style="margin-top:10px">🗑️ تأكيد المسح</button>`, () => {
          $("delGo").onclick = async () => {
            if ($("delWord").value.trim() !== "امسح") return toast("اكتب كلمة امسح بالظبط", "err");
            $("delGo").disabled = true;
            try { await Store.deleteAllOrders(); closeSheet(); toast("✅ اتمسحت كل الطلبات"); await refresh(); } catch (e) { toast(e.message, "err"); $("delGo").disabled = false; }
          };
        });
      }
      else if (d.period) { A.period = d.period; render(); }
      else if (d.addtx) txSheet(d.addtx);
      else if (d.export !== undefined) { closeSheet(); exportXlsx(false); }
      else if (d.settle) settleSheet(d.settle);
      else if (d.rpaid) { const r = receivables().find((x) => x.phone === d.rpaid); txSheet("receivable_paid", { amount: r.bal, phone: r.phone, name: r.name }); }
      else if (d.deltx) { if (await UI.ask("حذف الحركة دي؟")) { await Store.deleteTransaction(d.deltx); toast("اتحذفت"); await refresh(); } }
      else if (d.pushall !== undefined) pushAll();
      else if (d.import !== undefined) importSheet();
      else if (d.delcust) { if (await UI.ask("حذف الزبون ده من القايمة؟")) { await Store.deleteCustomer(d.delcust); toast("اتحذف"); await refresh(); } }
      else if (d.bcast !== undefined) broadcast();
      else if (d.vcf !== undefined) vcfShare();
      else if (d.copynums !== undefined) { const n = targets().map((c) => "+" + c.phone).join("\n"); try { await navigator.clipboard.writeText(n); toast(`اتنسخ ${targets().length} رقم ✓`); } catch (e) { sheet(`<h3>الأرقام</h3><textarea class="in" rows="10">${esc(n)}</textarea>`); } }
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
      if (d.opay) { const oo = A.orders.find((x) => x.id === d.opay); if (el.value === "credit" && oo && oo.payment !== "credit" && !(await limitOk(oo.phone, oo.total))) { el.value = oo.payment || "cash"; return; } await Store.updateOrder(d.opay, { payment: el.value, pay_split: null }); toast("تم تحديث طريقة الدفع ✓"); await refresh(); }
      else if (d.ostatus) { await Store.updateOrder(d.ostatus, { status: el.value }); toast("تم تحديث الحالة ✓"); await refresh(); }
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
      if (me.role !== "admin" && me.role !== "accountant") return loginView(Store.live ? `حسابك (${esc(me.email || me.full_name || "")}) مش أدمن لسه. فعّله من Supabase بالأمر الموجود في الدليل، أو اطلب من أدمن آخر.` : "");
      A.me = me; if (me.role === "accountant") { A.tab = "accounts"; A.asub = "collect"; } await loadAll(); render();
    } catch (e) { toast(e.message, "err"); loginView(); }
  }
  (async () => { try { await Store.init(); } catch (e) { $("app").innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; return; } await boot(); Store._onRecovery = () => UI.recover(() => boot()); if (Store.recovery) Store._onRecovery(); Store.onChange(() => { if (A.me) refresh(true).catch(() => {}); }); })();
})();
