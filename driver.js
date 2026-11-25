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
  // ---------- مصاريف المندوب ----------
  function expSheet() {
    UI.sheet(`<h3>⛽ مصروف جديد</h3><p class="mut">المصروف بيتخصم من الكاش اللي معاك للمحل.</p>
      <div class="chips" id="exC">${["⛽ بنزين", "🛍️ أكياس", "🧊 ثلج", "🅿️ باركينج", "📦 أخرى"].map((c, i) => `<button class="chip ${i ? "" : "on"}" data-exc="${c}">${c}</button>`).join("")}</div>
      <label class="f"><span>المبلغ (د.ك)</span><input class="in" id="exA" type="number" step="0.005" min="0" max="100" inputmode="decimal"></label>
      <label class="f"><span>ملاحظة (اختياري)</span><input class="in" id="exN"></label><button class="btn tq block" id="exS">💾 حفظ</button>`, () => {
      let cat = "⛽ بنزين";
      $("exC").onclick = (e) => { const b = e.target.closest("[data-exc]"); if (!b) return; cat = b.dataset.exc; document.querySelectorAll("#exC .chip").forEach((x) => x.classList.toggle("on", x === b)); };
      $("exS").onclick = async () => { const a = num($("exA").value); if (!(a > 0) || a > 100) return toast("اكتب مبلغ صحيح (لحد 100 د.ك)", "err"); $("exS").disabled = true;
        try { await Store.addDriverMove({ driver_id: D.me.id, kind: "expense", amount: a, category: cat, note: $("exN").value.trim() }); UI.closeSheet(); toast("اتسجّل ✓"); await refresh(); } catch (e) { $("exS").disabled = false; toast(e.message, "err"); } };
    });
  }
  // ---------- صورة التسليم ----------
  function proofSheet(id) {
    const o = D.orders.find((x) => x.id === id); if (!o) return;
    UI.sheet(`<h3>📸 صورة التسليم – طلب #${o.order_no}</h3><p class="mut">صوّر الطلب مع الزبون أو قدام الباب، علشان يبقى فيه إثبات إنه اتسلّم.</p>
      <label class="btn tq block" style="text-align:center">📷 صوّر الطلب<input type="file" id="pf" accept="image/*" capture="environment" hidden></label>
      <img id="pv" alt="" style="display:none;width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-top:10px">
      <button class="btn green block" id="pOk" disabled style="margin-top:10px">✅ تأكيد التسليم</button>`, () => {
      let file = null;
      $("pf").onchange = (ev) => { file = ev.target.files[0]; if (!file) return; $("pv").src = URL.createObjectURL(file); $("pv").style.display = "block"; $("pOk").disabled = false; };
      $("pOk").onclick = async () => {
        if (!file) return; $("pOk").disabled = true; $("pOk").textContent = "⏳ بيرفع الصورة…";
        try { const url = await Store.uploadProof(file); await Store.driverSetStatus(id, "delivered", url); UI.closeSheet(); toast("تم التوصيل ✓"); await refresh(); }
        catch (err) { toast(err.message, "err"); $("pOk").disabled = false; $("pOk").textContent = "✅ تأكيد التسليم"; }
      };
    });
  }
  // ---------- التنبيه العالي ----------
  let AC = null, alarmT = null, wake = null;
  const unlockAudio = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} };
  function beep() { try { unlockAudio(); [0, 250, 500].forEach((t) => { const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination); o.type = "square"; o.frequency.value = 1175; g.gain.value = 0.6; o.start(AC.currentTime + t / 1000); o.stop(AC.currentTime + t / 1000 + 0.18); }); } catch (e) {} }
  function alarm(on) {
    if (on && !alarmT) { const ring = () => { beep(); try { navigator.vibrate && navigator.vibrate([400, 150, 400, 150, 400]); } catch (e) {} }; ring(); alarmT = setInterval(ring, 2500); const b = $("ackBar"); if (b) b.style.display = "block"; }
    if (!on && alarmT) { clearInterval(alarmT); alarmT = null; const b = $("ackBar"); if (b) b.style.display = "none"; }
  }
  async function keepAwake() { try { if (!wake && navigator.wakeLock && document.visibilityState === "visible") { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => (wake = null)); } } catch (e) {} }
  document.addEventListener("visibilitychange", () => { if (D.me) keepAwake(); });
  document.addEventListener("touchend", unlockAudio, { passive: true });
  document.addEventListener("click", async (e) => {
    unlockAudio(); if (alarmT && e.target.closest("#ackBtn,[data-tab],.ord")) { alarm(false); }
    if (e.target.closest("[data-proof]")) return proofSheet(e.target.closest("[data-proof]").dataset.proof);
    if (e.target.closest("[data-dexp]")) return expSheet();
    const dx = e.target.closest("[data-dexpdel]"); if (dx) { if (!(await UI.ask("تمسح المصروف ده؟"))) return; try { await Store.deleteDriverMove(dx.dataset.dexpdel); toast("اتمسح"); await refresh(); } catch (err) { toast(err.message, "err"); } return; }
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

  const addrQ = (o) => encodeURIComponent(`الكويت ${o.area} قطعة ${o.block || ""} شارع ${o.street || ""} ${o.avenue ? "جادة " + o.avenue : ""} منزل ${o.house || ""}`);
  const navLink = (o) => "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + addrQ(o);
  const trackLink = (o) => location.origin + location.pathname.replace(/driver\.html$/, "") + "?order=" + o.id;
  const onWay = (o) => {
    const due = o.payment === "credit" ? "" : o.payment === "knet_on_delivery" ? `\n💳 المبلغ ${money(o.total)} – الدفع كي نت عند الاستلام` : `\n💵 المبلغ المطلوب كاش: ${money(o.total)}`;
    const t = `السلام عليكم ${o.customer_name || ""} 👋\nمعاك ${(D.me && D.me.full_name) || "المندوب"} من Goten 🐟\nأنا في الطريق ليك بطلبك #${o.order_no} 🛵${due}\n📍 تتبع طلبك: ${trackLink(o)}`;
    return "https://wa.me/" + o.phone + "?text=" + encodeURIComponent(t);
  };
  const mapLink = (o) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`الكويت ${o.area} قطعة ${o.block || ""} شارع ${o.street || ""} ${o.avenue ? "جادة " + o.avenue : ""} منزل ${o.house || ""}`);
  function card(o) {
    const s = STATUS[o.status];
    const act = ["new", "confirmed"].includes(o.status) ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="btn block" style="background:#f59e0b;color:#fff" data-go="${o.id}:preparing">🔪 بدأت التجهيز</button><button class="btn tq block" data-go="${o.id}:out_for_delivery">🚚 طلعت بالطلب</button></div>`
      : o.status === "preparing" ? `<button class="btn tq block" data-go="${o.id}:out_for_delivery">🚚 الطلب جاهز – طلعت بيه</button>`
      : o.status === "out_for_delivery" ? `<button class="btn green block" data-proof="${o.id}">✅ تم التوصيل + صورة</button>` : "";
    const going = o.status === "out_for_delivery", live = !["delivered", "cancelled"].includes(o.status);
    return `<div class="ord" style="border-color:${s.c}"><div class="hd"><b>#${o.order_no}</b><span class="st" style="background:${s.c}">${s.ar}</span></div>
      <div style="margin-top:6px"><b>${esc(o.customer_name)}</b> · <span class="mut">${esc(o.slot || "")}</span></div>
      <div>📍 ${esc(o.area)} – قطعة ${esc(o.block)} – شارع ${esc(o.street)}${o.avenue ? " – جادة " + esc(o.avenue) : ""} – منزل ${esc(o.house)}${o.floor_apt ? " – " + esc(o.floor_apt) : ""}</div>
      ${o.notes ? `<div class="notice">📝 ${esc(o.notes)}</div>` : ""}
      <div class="mut" style="margin-top:6px">${(o.items || []).map((i) => `${esc(i.name_ar)} ×${i.qty}${(i.opts || []).length ? ` (${i.opts.map((x) => esc(x.c)).join("، ")})` : ""}`).join("، ")}${(o.fees || []).length ? `<div style="color:#b45309;font-weight:700">🧾 ${o.fees.map((f) => esc(f.name_ar)).join(" + ")}</div>` : ""}${o.slot ? `<div>⏰ ${esc(o.slot)}</div>` : ""}${Number(o.discount) ? `<div>🎟️ خصم ${money(o.discount)}</div>` : ""}</div>
      <div class="line total" style="font-size:16px"><span>${o.payment === "credit" ? "📝 آجل – مفيش تحصيل" : o.payment === "knet_on_delivery" ? "💳 كي نت عند الاستلام" : "💵 المطلوب تحصيله كاش"}</span><span>${money(o.total)}</span></div>
      <div class="acts"><a class="btn sm ghost" href="tel:+${esc(o.phone)}">📞 اتصال</a>${live ? `<a class="btn sm ${going ? "tq" : "ghost"}" target="_blank" rel="noopener" href="${onWay(o)}">🛵 أنا في الطريق</a>` : `<a class="btn sm ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.phone)}">💬 واتساب</a>`}<a class="btn sm ghost" target="_blank" rel="noopener" href="${mapLink(o)}">🗺️ الخريطة</a></div>
      ${live ? `<a class="btn block" style="margin-top:8px;text-align:center;text-decoration:none;background:#1a73e8;color:#fff" target="_blank" rel="noopener" href="${navLink(o)}">🧭 ابدأ التوجيه لعنوان الزبون</a>` : ""}
      ${o.proof_url && o.status === "delivered" ? `<img src="${esc(o.proof_url)}" alt="" style="width:100%;max-height:150px;object-fit:cover;border-radius:12px;margin-top:8px">` : ""}
      ${act ? `<div style="margin-top:10px">${act}</div>` : ""}</div>`;
  }
  // ---------- المحفظة ----------
  function wallet() {
    const del = D.orders.filter((o) => o.status === "delivered"), at = (o) => new Date(o.delivered_at || o.updated_at || o.created_at);
    const since = (days) => del.filter((o) => Date.now() - at(o) < days * 864e5), earn = (a) => a.reduce((x, o) => x + num(o.driver_earning), 0);
    const today = del.filter((o) => at(o).toDateString() === new Date().toDateString());
    const cashOne = (o) => o.pay_split ? num(o.pay_split.cash) : (o.payment || "cash") === "cash" ? num(o.total) : 0;
    const cashOf = (a) => a.reduce((x, o) => x + cashOne(o), 0), mv = (k) => D.moves.filter((m) => m.kind === k).reduce((x, m) => x + num(m.amount), 0);
    const hand = mv("handover") + mv("expense") - mv("collect"), paid = mv("payout"), comm = mv("commission"), exp = mv("expense"), coll = mv("collect");
    const days = [...Array(7)].map((_, i) => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - (6 - i)); const ds = del.filter((o) => at(o).toDateString() === t.toDateString()); return { lbl: t.toLocaleDateString("ar-KW", { weekday: "short" }), n: ds.length }; });
    return { today, w: since(7), m: since(30), earn, cashAll: cashOf(del), cashToday: cashOf(today), hand, paid, comm, exp, coll, handOnly: mv("handover"), totalEarn: earn(del) + comm, del, days };
  }
  function walletView() {
    const W = wallet(), cashWith = W.cashAll - W.hand, due = W.totalEarn - W.paid, mx = Math.max(1, ...W.days.map((d) => d.n));
    const st = (l, v, c) => `<div class="stat"><span class="mut">${l}</span><b${c ? ` style="color:${c}"` : ""}>${v}</b></div>`;
    return `<div class="stats" style="margin-top:12px">${st(`النهارده (${W.today.length} توصيلة)`, money(W.earn(W.today)), "#16a34a")}${st(`آخر 7 أيام (${W.w.length})`, money(W.earn(W.w)))}${st(`آخر 30 يوم (${W.m.length})`, money(W.earn(W.m)))}${st("كل التوصيلات", W.del.length)}</div>
      <div class="card"><b>📊 توصيلاتك آخر 7 أيام</b><div style="display:flex;align-items:flex-end;gap:6px;height:110px;margin-top:10px">${W.days.map((d) => `<div style="flex:1;text-align:center;font-size:11px"><div class="mut">${d.n || ""}</div><div style="height:${Math.round((d.n / mx) * 70) + 2}px;background:var(--tq);border-radius:6px 6px 0 0"></div><div class="mut">${d.lbl}</div></div>`).join("")}</div></div>
      <div class="card"><b>💵 الكاش اللي معاك للمحل</b>
        <div class="line"><span>حصّلته من الطلبات</span><b>${money(W.cashAll)}</b></div>
        ${W.coll ? `<div class="line"><span>+ حصّلته من آجل الزباين</span><b>${money(W.coll)}</b></div>` : ""}
        <div class="line"><span>− سلّمته للمحل</span><b>${money(W.handOnly)}</b></div>
        <div class="line"><span>− مصاريفك (بنزين وغيره)</span><b>${money(W.exp)}</b></div>
        <div class="line total"><span>${cashWith >= 0 ? "معاك للمحل" : "المحل مديون لك"}</span><span style="color:${cashWith > 0.0005 ? "#b45309" : "#16a34a"}">${money(Math.abs(cashWith))}</span></div></div>
      <div class="card"><b>💰 أرباحك</b>
        <div class="line"><span>أرباحك من ${W.del.length} توصيلة</span><b>${money(W.totalEarn - W.comm)}</b></div>${W.comm ? `<div class="line"><span>+ عمولة تحصيل</span><b>${money(W.comm)}</b></div>` : ""}
        <div class="line"><span>− اتصرفلك</span><b>${money(W.paid)}</b></div>
        <div class="line total"><span>ليك عند المحل</span><span style="color:#16a34a">${money(Math.max(0, due))}</span></div>
        <p class="mut" style="margin:6px 0 0">لو عايز تخصم أرباحك من الكاش اللي معاك، الصافي ${cashWith - due >= 0 ? `تسلّم للمحل <b>${money(cashWith - due)}</b>` : `المحل يدفعلك <b>${money(due - cashWith)}</b>`}.</p></div>
      <button class="btn block" style="background:#f59e0b;color:#fff" data-dexp>⛽ سجّل مصروف (بنزين، أكياس، ثلج...)</button>
      <div class="card"><b>آخر الحركات</b>${D.moves.slice(0, 20).map((m) => `<div class="line"><span>${({ payout: "💸 اتصرفلك", handover: "💵 سلّمت", expense: "⛽ مصروف", collect: "🧾 حصّلت آجل", commission: "🎁 عمولة" })[m.kind] || m.kind}${m.category ? " " + esc(m.category) : ""} ${fmtDate(m.created_at)}${m.note ? " – " + esc(m.note) : ""}</span><span><b>${money(m.amount)}</b>${m.kind === "expense" && Date.now() - new Date(m.created_at) < 864e5 ? ` <button class="btn sm ghost" data-dexpdel="${m.id}">🗑️</button>` : ""}</span></div>`).join("") || '<p class="mut">لسه مفيش حركات.</p>'}</div>`;
  }
  function render() {
    const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
    const active = D.orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    const done = D.orders.filter((o) => o.status === "delivered" && isToday(o.updated_at || o.created_at));
    const cash = done.filter((o) => o.payment === "cash").reduce((a, o) => a + num(o.total), 0);
    const list = D.tab === "active" ? active : done;
    $("app").innerHTML = `<header class="top"><div class="wrap"><div class="row"><div class="brand">${LOGO}<div>مناديب Goten<small>${esc(D.me.full_name || "")}</small></div></div><div class="sp"></div><button class="chip-btn" id="pushBtn">${UI.pushState() === "granted" ? "🔔" : "🔕 فعّل"}</button><button class="chip-btn" id="outBtn">خروج</button></div>
      <div class="tabs"><button class="${D.tab === "active" ? "on" : ""}" data-tab="active">الطلبات الحالية (${active.length})</button><button class="${D.tab === "done" ? "on" : ""}" data-tab="done">اليوم (${done.length})</button><button class="${D.tab === "wallet" ? "on" : ""}" data-tab="wallet">💰 محفظتي</button></div></div></header>
      <div id="ackBar" style="display:${alarmT ? "block" : "none"};position:sticky;top:0;z-index:5;background:#f59e0b;padding:10px"><div class="wrap"><button class="btn block" id="ackBtn" style="background:#fff;color:#b45309;font-size:17px">🔔 طلب جديد! دوس هنا علشان توقف الصوت</button></div></div>
      <main><div class="wrap">${D.tab === "wallet" ? walletView() : `<div class="stats" style="margin-top:12px"><div class="stat"><span class="mut">تم توصيلها اليوم</span><b>${done.length}</b></div><div class="stat"><span class="mut">كاش محصّل اليوم</span><b>${money(cash)}</b></div></div>
      ${list.map(card).join("") || `<div class="empty"><div class="e">${D.tab === "active" ? "😌" : "📦"}</div>${D.tab === "active" ? "ما في طلبات معيّنة لك حالياً" : "لسه ما وصلت طلبات اليوم"}</div>`}`}</div></main>`;
    $("outBtn").onclick = async () => { await Store.signOut(); D.me = null; loginView(); };
    $("pushBtn").onclick = async () => { try { await UI.enablePush((s) => Store.savePush(s)); toast("✅ الإشعارات اتفعّلت"); render(); } catch (e) { toast(e.message, "err"); } };
  }
  async function refresh() {
    [D.orders, D.moves] = await Promise.all([Store.driverOrders(), Store.driverMoves().catch(() => [])]);
    const ids = new Set(D.orders.map((o) => o.id));
    const isNew = D.known && D.orders.some((o) => !D.known.has(o.id) && !["delivered", "cancelled"].includes(o.status));
    D.known = ids; if (!document.getElementById("sheet")) render();
    if (isNew) { toast("🔔 طلب جديد معيّن لك"); D.tab = "active"; if (!document.getElementById("sheet")) render(); alarm(true); }
  }
  async function boot() {
    const me = await Store.me();
    if (!me) return loginView();
    if (me.role !== "driver") return loginView(me.role === "pending" ? "حسابك قيد المراجعة – الإدارة لازم توافق عليه أولاً." : "هذا الحساب ليس حساب مندوب.");
    D.me = me; keepAwake(); await refresh();
  }
  (async () => { try { await Store.init(); await boot(); Store._onRecovery = () => UI.recover(() => boot()); if (Store.recovery) Store._onRecovery(); } catch (e) { toast(e.message, "err"); } Store.onChange(() => { if (D.me) refresh().catch(() => {}); }); })();
})();
