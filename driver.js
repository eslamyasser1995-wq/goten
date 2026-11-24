// تطبيق المناديب – Goten
(function () {
  const { esc, money, toast, STATUS, fmtDate, LOGO, num } = UI;
  const $ = (id) => document.getElementById(id);
  const D = { me: null, orders: [], moves: [], tab: "active", known: null };

  async function loginView(msg) {
    let demoList = "";
    if (!Store.live) { const ps = (await Store.profiles()).filter((p) => p.role === "driver"); demoList = ps.map((p) => `<button class="btn ghost block" style="margin:6px 0" data-demo="${p.id}">🛵 ${esc(p.full_name)}</button>`).join("") || '<p class="mut">لا يوجد مناديب – أضفهم من لوحة التحكم.</p>'; }
    $("app").innerHTML = `<div class="login"><div class="brand" style="justify-content:center;color:var(--navy);font-size:22px;margin-bottom:6px">${LOGO}<span>مناديب Goten</span></div>${msg ? `<div class="notice">${msg}</div>` : ""}
      ${Store.live ? `<div class="card"><label class="f"><span>البريد الإلكتروني</span><input class="in" id="em" type="email" autocomplete="username" value="${esc(UI.lastEmail())}"></label><label class="f"><span>كلمة المرور</span><input class="in" id="pw" type="password" autocomplete="current-password" enterkeyhint="go"></label><button class="btn block" id="inBtn">دخول</button><button class="btn ghost block" style="margin-top:8px" data-forgot>🔑 نسيت كلمة السر؟</button></div>
        <details class="card"><summary><b>مندوب جديد؟ سجّل هنا</b></summary><label class="f"><span>الاسم</span><input class="in" id="nn"></label><label class="f"><span>رقم الهاتف</span><input class="in" id="np" type="tel" inputmode="numeric" placeholder="5xxxxxxx"></label><p class="mut">اكتب البريد وكلمة المرور فوق ثم اضغط:</p><button class="btn tq block" id="upBtn">إنشاء حساب</button></details>`
      : `<div class="card"><span class="demo-tag">وضع تجريبي</span><p class="mut">اختر المندوب:</p>${demoList}</div>`}</div>`;
    if (Store.live) {
      $("inBtn").onclick = async () => { const em = $("em").value.trim(), pw = $("pw").value; if (!em || !pw) return toast("اكتب الإيميل وكلمة السر", "err"); $("inBtn").disabled = true; try { await Store.signIn(em, pw); boot(); } catch (e) { $("inBtn").disabled = false; toast(/Invalid login/i.test(e.message) ? "الإيميل أو كلمة السر غلط – جرّب «نسيت كلمة السر»" : /not confirmed/i.test(e.message) ? "الإيميل لسه متأكدش" : e.message, "err"); } };
      $("pw").onkeydown = (e) => { if (e.key === "Enter") $("inBtn").click(); };
      if (UI.lastEmail()) setTimeout(() => $("pw").focus(), 50);
      $("upBtn").onclick = async () => { const ph = $("np").value.replace(/\D/g, ""); if (!$("nn").value.trim() || ph.length !== 8) return toast("اكتب الاسم ورقم من 8 أرقام", "err"); try { await Store.signUp($("em").value.trim(), $("pw").value, $("nn").value.trim(), "965" + ph); toast("تم التسجيل – انتظر موافقة الإدارة"); } catch (e) { toast(e.message, "err"); } };
    }
  }
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-demo],[data-go],[data-tab]"); if (!el) return;
    if (el.dataset.demo) { const p = (await Store.profiles()).find((x) => x.id === el.dataset.demo); Store.demoLogin({ id: p.id, role: "driver", full_name: p.full_name, phone: p.phone }); boot(); }
    else if (el.dataset.tab) { D.tab = el.dataset.tab; render(); }
    else if (el.dataset.go) {
      const [id, st] = el.dataset.go.split(":");
      if (st === "delivered" && !(await UI.ask("تأكيد تسليم الطلب للعميل؟"))) return;
      el.disabled = true;
      try { await Store.driverSetStatus(id, st); toast(st === "delivered" ? "تم التوصيل ✓" : "بالتوفيق في التوصيل 🛵"); await refresh(); } catch (err) { toast(err.message, "err"); el.disabled = false; }
    }
  });

  const mapLink = (o) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`الكويت ${o.area} قطعة ${o.block || ""} شارع ${o.street || ""} ${o.avenue ? "جادة " + o.avenue : ""} منزل ${o.house || ""}`);
  function card(o) {
    const s = STATUS[o.status];
    const act = ["new", "confirmed", "preparing"].includes(o.status) ? `<button class="btn tq block" data-go="${o.id}:out_for_delivery">🚚 استلمت الطلب – في الطريق</button>`
      : o.status === "out_for_delivery" ? `<button class="btn green block" data-go="${o.id}:delivered">✅ تم التوصيل</button>` : "";
    return `<div class="ord" style="border-color:${s.c}"><div class="hd"><b>#${o.order_no}</b><span class="st" style="background:${s.c}">${s.ar}</span></div>
      <div style="margin-top:6px"><b>${esc(o.customer_name)}</b> · <span class="mut">${esc(o.slot || "")}</span></div>
      <div>📍 ${esc(o.area)} – قطعة ${esc(o.block)} – شارع ${esc(o.street)}${o.avenue ? " – جادة " + esc(o.avenue) : ""} – منزل ${esc(o.house)}${o.floor_apt ? " – " + esc(o.floor_apt) : ""}</div>
      ${o.notes ? `<div class="notice">📝 ${esc(o.notes)}</div>` : ""}
      <div class="mut" style="margin-top:6px">${(o.items || []).map((i) => `${esc(i.name_ar)} ×${i.qty}${(i.opts || []).length ? ` (${i.opts.map((x) => esc(x.c)).join("، ")})` : ""}`).join("، ")}${o.slot ? `<div>⏰ ${esc(o.slot)}</div>` : ""}${Number(o.discount) ? `<div>🎟️ خصم ${money(o.discount)}</div>` : ""}</div>
      <div class="line total" style="font-size:16px"><span>${o.payment === "credit" ? "📝 آجل – مفيش تحصيل" : o.payment === "knet_on_delivery" ? "💳 كي نت عند الاستلام" : "💵 المطلوب تحصيله كاش"}</span><span>${money(o.total)}</span></div>
      <div class="acts"><a class="btn sm ghost" href="tel:+${esc(o.phone)}">📞 اتصال</a><a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}">💬 واتساب</a><a class="btn sm ghost" target="_blank" rel="noopener" href="${mapLink(o)}">🗺️ الخريطة</a></div>
      ${act ? `<div style="margin-top:10px">${act}</div>` : ""}</div>`;
  }
  // ---------- المحفظة ----------
  function wallet() {
    const del = D.orders.filter((o) => o.status === "delivered"), at = (o) => new Date(o.delivered_at || o.updated_at || o.created_at);
    const since = (days) => del.filter((o) => Date.now() - at(o) < days * 864e5), earn = (a) => a.reduce((x, o) => x + num(o.driver_earning), 0);
    const today = del.filter((o) => at(o).toDateString() === new Date().toDateString());
    const cashOf = (a) => a.filter((o) => (o.payment || "cash") === "cash").reduce((x, o) => x + num(o.total), 0);
    const hand = D.moves.filter((m) => m.kind === "handover").reduce((x, m) => x + num(m.amount), 0), paid = D.moves.filter((m) => m.kind === "payout").reduce((x, m) => x + num(m.amount), 0);
    const days = [...Array(7)].map((_, i) => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - (6 - i)); const ds = del.filter((o) => at(o).toDateString() === t.toDateString()); return { lbl: t.toLocaleDateString("ar-KW", { weekday: "short" }), n: ds.length }; });
    return { today, w: since(7), m: since(30), earn, cashAll: cashOf(del), cashToday: cashOf(today), hand, paid, totalEarn: earn(del), del, days };
  }
  function walletView() {
    const W = wallet(), cashWith = W.cashAll - W.hand, due = W.totalEarn - W.paid, mx = Math.max(1, ...W.days.map((d) => d.n));
    const st = (l, v, c) => `<div class="stat"><span class="mut">${l}</span><b${c ? ` style="color:${c}"` : ""}>${v}</b></div>`;
    return `<div class="stats" style="margin-top:12px">${st(`النهارده (${W.today.length} توصيلة)`, money(W.earn(W.today)), "#16a34a")}${st(`آخر 7 أيام (${W.w.length})`, money(W.earn(W.w)))}${st(`آخر 30 يوم (${W.m.length})`, money(W.earn(W.m)))}${st("كل التوصيلات", W.del.length)}</div>
      <div class="card"><b>📊 توصيلاتك آخر 7 أيام</b><div style="display:flex;align-items:flex-end;gap:6px;height:110px;margin-top:10px">${W.days.map((d) => `<div style="flex:1;text-align:center;font-size:11px"><div class="mut">${d.n || ""}</div><div style="height:${Math.round((d.n / mx) * 70) + 2}px;background:var(--tq);border-radius:6px 6px 0 0"></div><div class="mut">${d.lbl}</div></div>`).join("")}</div></div>
      <div class="card"><b>💵 الكاش اللي معاك للمحل</b>
        <div class="line"><span>حصّلته من الزباين</span><b>${money(W.cashAll)}</b></div>
        <div class="line"><span>− سلّمته للمحل</span><b>${money(W.hand)}</b></div>
        <div class="line total"><span>${cashWith >= 0 ? "معاك للمحل" : "المحل مديون لك"}</span><span style="color:${cashWith > 0.0005 ? "#b45309" : "#16a34a"}">${money(Math.abs(cashWith))}</span></div></div>
      <div class="card"><b>💰 أرباحك</b>
        <div class="line"><span>أرباحك من ${W.del.length} توصيلة</span><b>${money(W.totalEarn)}</b></div>
        <div class="line"><span>− اتصرفلك</span><b>${money(W.paid)}</b></div>
        <div class="line total"><span>ليك عند المحل</span><span style="color:#16a34a">${money(Math.max(0, due))}</span></div>
        <p class="mut" style="margin:6px 0 0">لو عايز تخصم أرباحك من الكاش اللي معاك، الصافي ${cashWith - due >= 0 ? `تسلّم للمحل <b>${money(cashWith - due)}</b>` : `المحل يدفعلك <b>${money(due - cashWith)}</b>`}.</p></div>
      <div class="card"><b>آخر الحركات</b>${D.moves.slice(0, 15).map((m) => `<div class="line"><span>${m.kind === "payout" ? "💸 اتصرفلك" : "💵 سلّمت"} ${fmtDate(m.created_at)}${m.note ? " – " + esc(m.note) : ""}</span><b>${money(m.amount)}</b></div>`).join("") || '<p class="mut">لسه مفيش حركات.</p>'}</div>`;
  }
  function render() {
    const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
    const active = D.orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    const done = D.orders.filter((o) => o.status === "delivered" && isToday(o.updated_at || o.created_at));
    const cash = done.filter((o) => o.payment === "cash").reduce((a, o) => a + num(o.total), 0);
    const list = D.tab === "active" ? active : done;
    $("app").innerHTML = `<header class="top"><div class="wrap"><div class="row"><div class="brand">${LOGO}<div>مناديب Goten<small>${esc(D.me.full_name || "")}</small></div></div><div class="sp"></div><button class="chip-btn" id="pushBtn">${UI.pushState() === "granted" ? "🔔" : "🔕 فعّل"}</button><button class="chip-btn" id="outBtn">خروج</button></div>
      <div class="tabs"><button class="${D.tab === "active" ? "on" : ""}" data-tab="active">الطلبات الحالية (${active.length})</button><button class="${D.tab === "done" ? "on" : ""}" data-tab="done">اليوم (${done.length})</button><button class="${D.tab === "wallet" ? "on" : ""}" data-tab="wallet">💰 محفظتي</button></div></div></header>
      <main><div class="wrap">${D.tab === "wallet" ? walletView() : `<div class="stats" style="margin-top:12px"><div class="stat"><span class="mut">تم توصيلها اليوم</span><b>${done.length}</b></div><div class="stat"><span class="mut">كاش محصّل اليوم</span><b>${money(cash)}</b></div></div>
      ${list.map(card).join("") || `<div class="empty"><div class="e">${D.tab === "active" ? "😌" : "📦"}</div>${D.tab === "active" ? "ما في طلبات معيّنة لك حالياً" : "لسه ما وصلت طلبات اليوم"}</div>`}`}</div></main>`;
    $("outBtn").onclick = async () => { await Store.signOut(); D.me = null; loginView(); };
    $("pushBtn").onclick = async () => { try { await UI.enablePush((s) => Store.savePush(s)); toast("✅ الإشعارات اتفعّلت"); render(); } catch (e) { toast(e.message, "err"); } };
  }
  async function refresh() {
    [D.orders, D.moves] = await Promise.all([Store.driverOrders(), Store.driverMoves().catch(() => [])]);
    const ids = new Set(D.orders.map((o) => o.id));
    if (D.known && D.orders.some((o) => !D.known.has(o.id))) { toast("🔔 طلب جديد معيّن لك"); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
    D.known = ids; render();
  }
  async function boot() {
    const me = await Store.me();
    if (!me) return loginView();
    if (me.role !== "driver") return loginView(me.role === "pending" ? "حسابك قيد المراجعة – الإدارة لازم توافق عليه أولاً." : "هذا الحساب ليس حساب مندوب.");
    D.me = me; await refresh();
  }
  (async () => { try { await Store.init(); await boot(); Store._onRecovery = () => UI.recover(() => boot()); if (Store.recovery) Store._onRecovery(); } catch (e) { toast(e.message, "err"); } Store.onChange(() => { if (D.me) refresh().catch(() => {}); }); })();
})();
