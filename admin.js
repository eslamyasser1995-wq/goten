// لوحة تحكم Goten
(function () {
  const { esc, money, toast, sheet, closeSheet, STATUS, fmtDate, LOGO, num } = UI;
  const C = window.ISLAMKO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const A = { tx: [], period: "month", cq: "", cOnlyOpt: true, tab: "dash", me: null, orders: [], products: [], cats: [], banners: [], profiles: [], settings: {}, ofilter: "active", pq: "", bulk: false, known: null };
  const TABS = [["dash", "📊 الرئيسية"], ["orders", "🧾 الطلبات"], ["accounts", "💰 الحسابات"], ["products", "🐟 المنتجات"], ["cats", "🗂️ الأقسام"], ["banners", "🖼️ البنرات"], ["customers", "👥 الزباين"], ["team", "🛵 المناديب"], ["settings", "⚙️ الإعدادات"]];
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
    const [o, p, c, b, pr, s, ic, tx, mv] = await Promise.all([Store.orders(), Store.products(), Store.categories(), Store.banners(), Store.profiles(), Store.settings(), Store.importedCustomers().catch(() => []), Store.transactions().catch(() => []), Store.stockMoves().catch(() => null)]);
    Object.assign(A, { orders: o, products: p, cats: c, banners: b, profiles: pr, settings: s || {}, imported: ic || [], tx: tx || [], moves: mv });
    const ids = new Set(o.map((x) => x.id));
    if (A.known) { const fresh = o.filter((x) => !A.known.has(x.id)); if (fresh.length) { beep(); toast(`🔔 طلب جديد #${fresh[0].order_no}`); } }
    A.known = ids;
  }
  function beep() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); [0, 0.25].forEach((d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.2, ctx.currentTime + d); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.18); }); } catch (e) {} }

  // ---------- الواجهة ----------
  function render() {
    const body = { dash, orders, accounts, products, cats, banners, customers, team, settings }[A.tab]();
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
    const lowN = A.products.filter((p) => p.stock != null && num(p.stock) <= num(p.low_stock)).length;
    return `${lowN ? `<div class="notice" data-asub="stock" style="cursor:pointer">📦 فيه ${lowN} منتج قرب يخلص أو خلص – اضغط للمخزون</div>` : ""}<div class="h2">نظرة عامة</div><div class="stats">
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
      <div class="mut">${fmtDate(o.created_at)} · ${esc(o.slot || "")} · ${PAY[o.payment] || PAY.cash}</div>
      <div style="margin-top:6px">📍 ${esc(o.area)} – ق${esc(o.block)} – ش${esc(o.street)}${o.avenue ? " – ج" + esc(o.avenue) : ""} – م${esc(o.house)}${o.floor_apt ? " – " + esc(o.floor_apt) : ""}</div>
      <div style="margin-top:6px">${(o.items || []).map((i) => `${esc(i.name_ar)} ×${i.qty}`).join("، ")}</div>
      ${o.notes ? `<div class="notice">📝 ${esc(o.notes)}</div>` : ""}
      <div class="line total" style="font-size:15px"><span>الإجمالي (شامل التوصيل ${money(o.delivery_fee)})</span><span>${money(o.total)}</span></div>
      <div class="row2" style="margin-top:6px"><select class="in" data-ostatus="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select>
        <select class="in" data-opay="${o.id}">${Object.entries(PAY).map(([k, v]) => `<option value="${k}" ${(o.payment || "cash") === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <select class="in" data-odriver="${o.id}"><option value="">🛵 بدون مندوب</option>${drivers().map((d) => `<option value="${d.id}" ${o.driver_id === d.id ? "selected" : ""}>${esc(d.full_name)}</option>`).join("")}</select></div>
      <div class="acts"><a class="btn sm ghost" href="tel:+${esc(o.phone)}">📞 اتصال</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}">💬 واتساب</a><a class="btn sm ghost" target="_blank" rel="noopener" href="${mapLink(o)}">🗺️ الخريطة</a>
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
  // ---------- الحسابات ----------
  const PAY = { cash: "💵 كاش", knet_on_delivery: "💳 كي نت", credit: "📝 آجل" };
  const KINDS = { sale: "🧾 مبيعات خارج التطبيق", purchase: "🛒 مشتريات", expense: "💸 مصروف", income: "💰 إيراد آخر", driver_settle: "🛵 استلام من مندوب", receivable: "📝 آجل يدوي", receivable_paid: "✅ سداد آجل" };
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
      const got = sum(A.orders.filter((o) => o.driver_id === d.id && o.status === "delivered" && (o.payment || "cash") === "cash"), (o) => o.total);
      const paid = sum(A.tx.filter((t) => t.kind === "driver_settle" && t.party === d.id));
      return { d, got, paid, bal: got - paid };
    });
  }
  function receivables() {
    const m = new Map();
    const add = (phone, name, v) => { const r = m.get(phone) || { phone, name, bal: 0 }; r.bal += v; if (name) r.name = name; m.set(phone, r); };
    A.orders.filter((o) => o.payment === "credit" && o.status !== "cancelled").forEach((o) => add(o.phone, o.customer_name, num(o.total)));
    A.tx.filter((t) => t.kind === "sale" && t.category === "credit" && t.party).forEach((t) => add(t.party, t.party_name, num(t.amount)));
    A.tx.filter((t) => t.kind === "receivable").forEach((t) => add(t.party, t.party_name, num(t.amount)));
    A.tx.filter((t) => t.kind === "receivable_paid").forEach((t) => add(t.party, t.party_name, -num(t.amount)));
    return [...m.values()].filter((r) => Math.abs(r.bal) > 0.0005).sort((a, b) => b.bal - a.bal);
  }
  const subTabs = () => `<div class="tabs" style="padding:10px 0 4px">${[["money", "💰 الحسابات"], ["stock", "📦 المخزون"]].map(([k, l]) => `<button style="background:${(A.asub || "money") === k ? "var(--tq)" : "#e2e8f0"};color:${(A.asub || "money") === k ? "#fff" : "#334155"};font-size:15px;padding:9px 18px" data-asub="${k}">${l}</button>`).join("")}</div>`;
  function accounts() {
    if (A.asub === "stock") return subTabs() + stock();
    return subTabs() + accountsMoney();
  }
  function accountsMoney() {
    const ords = A.orders.filter((o) => o.status === "delivered" && inPeriod(o.created_at));
    const pending = A.orders.filter((o) => !["delivered", "cancelled"].includes(o.status) && inPeriod(o.created_at));
    const tx = A.tx.filter((t) => inPeriod(t.date || t.created_at));
    const manual = tx.filter((t) => t.kind === "sale");
    const sales = sum(ords, (o) => o.total) + sum(manual), fees = sum(ords, (o) => o.delivery_fee);
    const purch = sum(tx.filter((t) => t.kind === "purchase")), exp = sum(tx.filter((t) => t.kind === "expense")), inc = sum(tx.filter((t) => t.kind === "income"));
    const profit = sales + inc - purch - exp;
    const byPay = Object.keys(PAY).map((k) => [k, sum(ords.filter((o) => (o.payment || "cash") === k), (o) => o.total) + sum(manual.filter((t) => (t.category || "cash") === k))]);
    const byCat = {}; tx.filter((t) => t.kind === "expense").forEach((t) => { byCat[t.category || "أخرى"] = (byCat[t.category || "أخرى"] || 0) + num(t.amount); });
    const dc = driverCash(), rc = receivables();
    const stat = (l, v, c) => `<div class="stat"><span class="mut">${l}</span><b style="${c ? "color:" + c : ""}">${v}</b></div>`;
    return `<div class="filters">${PERIODS.map(([k, l]) => `<button class="${A.period === k ? "on" : ""}" data-period="${k}">${l}</button>`).join("")}</div>
      <div class="stats">${stat("المبيعات (" + ords.length + " طلب" + (manual.length ? " + " + manual.length + " يدوي" : "") + ")", money(sales))}${stat("المشتريات", money(purch), "#b45309")}${stat("المصاريف", money(exp), "#dc2626")}${stat("صافي الربح", money(profit), profit >= 0 ? "#16a34a" : "#dc2626")}</div>
      <div class="card"><div class="line"><span>من التطبيق</span><b>${money(sales - sum(manual))}</b></div><div class="line"><span>خارج التطبيق</span><b>${money(sum(manual))}</b></div><div class="line"><span>منها رسوم توصيل</span><b>${money(fees)}</b></div>${inc ? `<div class="line"><span>إيرادات أخرى</span><b>${money(inc)}</b></div>` : ""}
        ${byPay.map(([k, v]) => `<div class="line"><span>${PAY[k]}</span><b>${money(v)}</b></div>`).join("")}
        ${pending.length ? `<div class="line mut"><span>طلبات لسه ماتوصّلتش (${pending.length})</span><span>${money(sum(pending, (o) => o.total))}</span></div>` : ""}
        ${Object.keys(byCat).length ? `<div class="mut" style="margin-top:8px"><b>المصاريف حسب النوع:</b></div>${Object.entries(byCat).map(([k, v]) => `<div class="line"><span>${esc(k)}</span><span>${money(v)}</span></div>`).join("")}` : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-addtx="sale">🧾 + مبيعات</button><button class="btn tq sm" data-addtx="purchase">🛒 + مشتريات</button><button class="btn sm red" data-addtx="expense">💸 + مصروف</button><button class="btn sm green" data-addtx="income">💰 + إيراد</button><button class="btn sm" style="background:#7c3aed" data-stockpick>📦 + مخزون</button><button class="btn ghost sm" data-export>📊 تصدير Excel</button></div>
      <div class="h2">🛵 كاش مع المناديب</div>
      ${dc.length ? dc.map((r) => `<div class="it" style="background:#fff;border-radius:14px;padding:10px;margin:8px 0;display:flex;align-items:center;gap:10px"><div class="t" style="flex:1"><b>${esc(r.d.full_name || "مندوب")}</b><div class="mut">حصّل ${money(r.got)} · سلّم ${money(r.paid)}</div></div><b style="color:${r.bal > 0 ? "#b45309" : "#16a34a"}">${money(r.bal)}</b>${r.bal > 0.0005 ? `<button class="btn sm green" data-settle="${r.d.id}">✅ استلمت</button>` : ""}</div>`).join("") : '<p class="mut">مفيش مناديب.</p>'}
      <div class="h2">📝 فلوس عند الزباين (آجل) <button class="btn ghost sm" data-addtx="receivable">+ آجل</button></div>
      ${rc.length ? rc.map((r) => `<div class="it" style="background:#fff;border-radius:14px;padding:10px;margin:8px 0;display:flex;align-items:center;gap:10px"><div class="t" style="flex:1"><b>${esc(r.name || "زبون")}</b><div class="mut">${esc(r.phone)}</div></div><b style="color:#b45309">${money(r.bal)}</b><button class="btn sm green" data-rpaid="${esc(r.phone)}">✅ دفع</button></div>`).join("") : '<p class="mut">مفيش فلوس آجل. علشان تسجّل طلب آجل، غيّر طريقة الدفع في الطلب لـ «📝 آجل».</p>'}
      <div class="h2">📒 سجل الحركات</div>
      <div class="list">${tx.length ? [...tx].sort((x, y) => new Date(y.date || y.created_at) - new Date(x.date || x.created_at)).map((t) => `<div class="it"><div class="t"><b>${KINDS[t.kind] || t.kind}${t.kind === "sale" ? " · " + (PAY[t.category] || PAY.cash) : t.category ? " · " + esc(t.category) : ""}</b><span class="mut">${esc(t.date || dayKey(t.created_at))}${t.party_name ? " · " + esc(t.party_name) : ""}${t.note ? " · " + esc(t.note) : ""}</span></div><b>${money(t.amount)}</b><button class="btn sm ghost" data-deltx="${t.id}">🗑️</button></div>`).join("") : '<p class="mut">مفيش حركات في الفترة دي.</p>'}</div>`;
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
        <label class="f"><span>المورد (اختياري)</span><input class="in" id="tParty" placeholder="اسم التاجر"></label>` : ""}
      ${kind === "sale" ? `<label class="f"><span>اتباع إيه؟</span><input class="in" id="tDesc" placeholder="مثال: 2 كيلو زبيدي – بيع في المحل"></label>
        <label class="f"><span>طريقة الدفع</span><select class="in" id="tPay">${Object.entries(PAY).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
        <div class="row2"><label class="f"><span>اسم الزبون (اختياري)</span><input class="in" id="tPName"></label><label class="f"><span>رقمه (لازم لو آجل)</span><input class="in" id="tPhone" type="tel" inputmode="tel"></label></div>` : ""}
      ${kind === "income" ? `<label class="f"><span>البيان</span><input class="in" id="tCat" placeholder="مثال: بيع جملة"></label>` : ""}
      ${isRec ? `<div class="row2"><label class="f"><span>اسم الزبون</span><input class="in" id="tPName" value="${esc(preset.name || "")}"></label><label class="f"><span>الرقم</span><input class="in" id="tPhone" type="tel" value="${esc(preset.phone || "")}" ${preset.phone ? "readonly" : ""}></label></div>` : ""}
      <div class="row2"><label class="f"><span>المبلغ (د.ك) *</span><input class="in" id="tAmt" type="number" step="0.005" min="0" inputmode="decimal" value="${preset.amount != null ? num(preset.amount).toFixed(3) : ""}"></label><label class="f"><span>التاريخ</span><input class="in" id="tDate" type="date" value="${dayKey(new Date())}"></label></div>
      <label class="f"><span>ملاحظة</span><input class="in" id="tNote" value="${esc(preset.note || "")}"></label>
      <button class="btn tq block" id="tSave">💾 حفظ</button>`, () => {
      const tp = $("tProd");
      if (tp) { const sync = () => { const on = !!tp.value; $("tQtyW").style.display = on ? "" : "none"; $("tCatW").style.display = on ? "none" : ""; }; tp.onchange = sync; sync(); }
      $("tSave").onclick = async () => {
        const amount = num($("tAmt").value); if (!(amount > 0)) return toast("اكتب المبلغ", "err");
        if (tp && tp.value) {
          const qty = num($("tQty").value); if (!(qty > 0)) return toast("اكتب الكمية", "err");
          const pr = A.products.find((x) => x.id === tp.value), party = $("tParty").value.trim(), note = $("tNote").value.trim();
          try {
            $("tSave").disabled = true;
            await Store.stockMove({ product_id: pr.id, kind: "purchase", qty, cost: amount, note: [party ? "من " + party : "", note].filter(Boolean).join(" – ") || null });
            await Store.saveTransaction({ kind: "purchase", amount, date: $("tDate").value || dayKey(new Date()), category: pr.name_ar, note: [fq(qty) + " " + (pr.unit_ar || ""), note].filter(Boolean).join(" – "), party_name: party || null });
            closeSheet(); toast(`اتسجّل ✓ – المخزون زاد ${fq(qty)}`); await refresh();
          } catch (e) { $("tSave").disabled = false; toast(/stock_move|function/.test(e.message) ? "شغّل inventory.sql الأول" : e.message, "err"); }
          return;
        }
        const row = { kind, amount, date: $("tDate").value || dayKey(new Date()), note: $("tNote").value.trim() || null, category: $("tCat") ? $("tCat").value.trim() || null : null, party: preset.party || null, party_name: preset.party_name || null };
        if (kind === "purchase" && $("tParty").value.trim()) row.party_name = $("tParty").value.trim();
        if (kind === "sale") {
          row.category = $("tPay").value; const desc = $("tDesc").value.trim(); row.note = [desc, row.note].filter(Boolean).join(" – ") || null;
          const ph = ($("tPhone").value || "").replace(/\D/g, ""); row.party_name = $("tPName").value.trim() || null;
          if (ph) row.party = /^[124569]\d{7}$/.test(ph) ? "965" + ph : ph;
          if (row.category === "credit" && !row.party) return toast("البيع الآجل محتاج رقم الزبون", "err");
        }
        if (isRec) { const ph = ($("tPhone").value || "").replace(/\D/g, ""); if (!ph) return toast("اكتب رقم الزبون", "err"); row.party = /^[124569]\d{7}$/.test(ph) ? "965" + ph : ph; row.party_name = $("tPName").value.trim() || null; }
        try { $("tSave").disabled = true; await Store.saveTransaction(row); closeSheet(); toast("اتسجّل ✓"); await refresh(); } catch (e) { toast(e.message.includes("transactions") ? "شغّل كود SQL بتاع الحسابات الأول" : e.message, "err"); $("tSave").disabled = false; }
      };
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
    A.tx.filter((t) => inPeriod(t.date || t.created_at)).forEach((t) => rows.push([KINDS[t.kind].replace(/^\S+ /, ""), t.date || dayKey(t.created_at), [t.category, t.note].filter(Boolean).join(" – "), t.party_name || "", t.kind === "sale" ? (PAY[t.category] || PAY.cash).replace(/^\S+ /, "") : "", (t.kind === "sale" ? "" : ["purchase", "expense", "driver_settle"].includes(t.kind) ? "-" : "") + num(t.amount).toFixed(3)]));
    const tracked = A.products.filter((p) => p.stock != null);
    if (tracked.length) {
      rows.push([], ["📦 المخزون الحالي"], ["المنتج", "الوحدة", "الكمية الموجودة", "حد التنبيه", "تكلفة الوحدة", "قيمة المخزون", "الحالة"]);
      let tv = 0;
      tracked.forEach((p) => { const v = Math.max(0, num(p.stock)) * num(p.cost); tv += v; rows.push([p.name_ar, p.unit_ar || "", fq(p.stock), fq(p.low_stock), p.cost != null ? num(p.cost).toFixed(3) : "", p.cost != null ? v.toFixed(3) : "", { ok: "متوفر", low: "قرب يخلص", out: "خلص" }[stockState(p)]]); });
      rows.push(["الإجمالي", "", "", "", "", tv.toFixed(3), ""]);
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
      ${fi("delivery_eta", "مدة التوصيل اللي بتظهر للزبون (مثال: خلال ساعتين)")}${fi("whatsapp", "واتساب المتجر (مثال 96550000000)", "tel")}${fi("notice_ar", "شريط تنبيه بالعربي")}${fi("notice_en", "Notice in English")}
      <button class="btn tq block" id="sSave">💾 حفظ الإعدادات</button></div>
      <div class="card"><b>شكل التطبيق</b><p class="mut">الشعار، اسم المتجر، لون الشريط العلوي.</p><button class="btn sm" data-editheader>🎨 تعديل الشريط العلوي والشعار</button></div>
      ${Store.live ? "" : '<div class="card"><b>الوضع التجريبي</b><p class="mut">البيانات محفوظة على هذا الجهاز فقط. لربط العملاء والمناديب فعلياً فعّل Supabase (راجع الدليل).</p><button class="btn red sm" id="resetBtn">إرجاع البيانات التجريبية الأصلية</button></div>'}`;
  }

  // ---------- الأحداث ----------
  function bind() {
    const sq = $("sq"); if (sq) sq.oninput = (e) => { A.sq = e.target.value; const pos = e.target.selectionStart; render(); $("sq").focus(); $("sq").setSelectionRange(pos, pos); };
    const cq = $("cq"); if (cq) cq.oninput = (e) => { A.cq = e.target.value; const pos = e.target.selectionStart; render(); $("cq").focus(); $("cq").setSelectionRange(pos, pos); };
    const pc = $("pushCnt"); if (pc) Store.customerPushCount().then((n) => { pc.textContent = n; }).catch(() => { pc.textContent = "0"; });
    const co = $("cOnlyOpt"); if (co) co.onchange = (e) => { A.cOnlyOpt = e.target.checked; };
    const pq = $("pq"); if (pq) pq.oninput = (e) => { A.pq = e.target.value; const pos = e.target.selectionStart; render(); $("pq").focus(); $("pq").setSelectionRange(pos, pos); };
    const ss = $("sSave"); if (ss) ss.onclick = async () => {
      const v = (k) => $("s_" + k).value.trim();
      try { await Store.saveSettings({ store_open: $("s_store_open").checked, delivery_fee: num(v("delivery_fee")), min_order: num(v("min_order")), free_delivery_over: v("free_delivery_over") ? num(v("free_delivery_over")) : null, whatsapp: v("whatsapp").replace(/\D/g, ""), notice_ar: v("notice_ar"), notice_en: v("notice_en"), ...(v("delivery_eta") || A.settings.delivery_eta ? { delivery_eta: v("delivery_eta") || null } : {}) }); toast("تم الحفظ ✓"); await refresh(); } catch (e) { toast(e.message, "err"); }
    };
    const rb = $("resetBtn"); if (rb) rb.onclick = async () => { if (await UI.ask("مسح كل التعديلات والطلبات التجريبية؟")) { await Store.resetDemo(); await refresh(); toast("تم"); } };
  }
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-tab],[data-of],[data-newprod],[data-editprod],[data-editcat],[data-editban],[data-bulk],[data-bulksave],[data-quick],[data-storeopen],[data-adddrv],[data-editheader],[data-bcast],[data-vcf],[data-copynums],[data-pushall],[data-import],[data-delcust],[data-delorder],[data-delallorders],[data-period],[data-addtx],[data-export],[data-settle],[data-rpaid],[data-deltx],[data-sf],[data-smv],[data-shist],[data-asub],[data-buy],[data-stockpick]"); if (!el || !A.me) return;
    const d = el.dataset;
    try {
      if (d.tab) { A.tab = d.tab; render(); scrollTo(0, 0); }
      else if (d.stockpick !== undefined) stockPick();
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
      else if (d.export !== undefined) exportCsv();
      else if (d.settle) { const r = driverCash().find((x) => x.d.id === d.settle); txSheet("driver_settle", { amount: r.bal, party: r.d.id, party_name: r.d.full_name, note: "تسليم كاش" }); }
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
      if (d.opay) { await Store.updateOrder(d.opay, { payment: el.value }); toast("تم تحديث طريقة الدفع ✓"); await refresh(); }
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
      if (me.role !== "admin") return loginView(Store.live ? `حسابك (${esc(me.email || me.full_name || "")}) مش أدمن لسه. فعّله من Supabase بالأمر الموجود في الدليل، أو اطلب من أدمن آخر.` : "");
      A.me = me; await loadAll(); render();
    } catch (e) { toast(e.message, "err"); loginView(); }
  }
  (async () => { try { await Store.init(); } catch (e) { $("app").innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; return; } await boot(); Store.onChange(() => { if (A.me) refresh(true).catch(() => {}); }); })();
})();
