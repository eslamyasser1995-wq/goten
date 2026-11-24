// تطبيق المناديب – Goten
(function () {
  const { esc, money, toast, STATUS, fmtDate, LOGO, num } = UI;
  const $ = (id) => document.getElementById(id);
  const D = { me: null, orders: [], tab: "active", known: null };

  async function loginView(msg) {
    let demoList = "";
    if (!Store.live) { const ps = (await Store.profiles()).filter((p) => p.role === "driver"); demoList = ps.map((p) => `<button class="btn ghost block" style="margin:6px 0" data-demo="${p.id}">🛵 ${esc(p.full_name)}</button>`).join("") || '<p class="mut">لا يوجد مناديب – أضفهم من لوحة التحكم.</p>'; }
    $("app").innerHTML = `<div class="login"><div class="brand" style="justify-content:center;color:var(--navy);font-size:22px;margin-bottom:6px">${LOGO}<span>مناديب Goten</span></div>${msg ? `<div class="notice">${msg}</div>` : ""}
      ${Store.live ? `<div class="card"><label class="f"><span>البريد الإلكتروني</span><input class="in" id="em" type="email" autocomplete="username"></label><label class="f"><span>كلمة المرور</span><input class="in" id="pw" type="password" autocomplete="current-password"></label><button class="btn block" id="inBtn">دخول</button></div>
        <details class="card"><summary><b>مندوب جديد؟ سجّل هنا</b></summary><label class="f"><span>الاسم</span><input class="in" id="nn"></label><label class="f"><span>رقم الهاتف</span><input class="in" id="np" type="tel" inputmode="numeric" placeholder="5xxxxxxx"></label><p class="mut">اكتب البريد وكلمة المرور فوق ثم اضغط:</p><button class="btn tq block" id="upBtn">إنشاء حساب</button></details>`
      : `<div class="card"><span class="demo-tag">وضع تجريبي</span><p class="mut">اختر المندوب:</p>${demoList}</div>`}</div>`;
    if (Store.live) {
      $("inBtn").onclick = async () => { try { await Store.signIn($("em").value.trim(), $("pw").value); boot(); } catch (e) { toast(e.message, "err"); } };
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
  function render() {
    const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
    const active = D.orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    const done = D.orders.filter((o) => o.status === "delivered" && isToday(o.updated_at || o.created_at));
    const cash = done.filter((o) => o.payment === "cash").reduce((a, o) => a + num(o.total), 0);
    const list = D.tab === "active" ? active : done;
    $("app").innerHTML = `<header class="top"><div class="wrap"><div class="row"><div class="brand">${LOGO}<div>مناديب Goten<small>${esc(D.me.full_name || "")}</small></div></div><div class="sp"></div><button class="chip-btn" id="pushBtn">${UI.pushState() === "granted" ? "🔔" : "🔕 فعّل"}</button><button class="chip-btn" id="outBtn">خروج</button></div>
      <div class="tabs"><button class="${D.tab === "active" ? "on" : ""}" data-tab="active">الطلبات الحالية (${active.length})</button><button class="${D.tab === "done" ? "on" : ""}" data-tab="done">تم توصيلها اليوم (${done.length})</button></div></div></header>
      <main><div class="wrap"><div class="stats" style="margin-top:12px"><div class="stat"><span class="mut">تم توصيلها اليوم</span><b>${done.length}</b></div><div class="stat"><span class="mut">كاش محصّل اليوم</span><b>${money(cash)}</b></div></div>
      ${list.map(card).join("") || `<div class="empty"><div class="e">${D.tab === "active" ? "😌" : "📦"}</div>${D.tab === "active" ? "ما في طلبات معيّنة لك حالياً" : "لسه ما وصلت طلبات اليوم"}</div>`}</div></main>`;
    $("outBtn").onclick = async () => { await Store.signOut(); D.me = null; loginView(); };
    $("pushBtn").onclick = async () => { try { await UI.enablePush((s) => Store.savePush(s)); toast("✅ الإشعارات اتفعّلت"); render(); } catch (e) { toast(e.message, "err"); } };
  }
  async function refresh() {
    D.orders = await Store.driverOrders();
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
  (async () => { try { await Store.init(); await boot(); } catch (e) { toast(e.message, "err"); } Store.onChange(() => { if (D.me) refresh().catch(() => {}); }); })();
})();
