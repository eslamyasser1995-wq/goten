// طبقة البيانات: وضع تجريبي (localStorage) أو حقيقي (Supabase)
(function () {
  // بيانات Supabase مدمجة هنا كمان، عشان المتجر يفضل على النسخة الحقيقية حتى لو config.js اتمسح أو باظ
  const DEFAULT_URL = "https://aefbvmjorsohzfhbgeds.supabase.co";
  const DEFAULT_KEY = "sb_publishable_CzgMrbcOtttRVQkjVzHRjw_x4YHgtdY";
  const CFG = window.ISLAMKO_CONFIG || {};
  const C = { ...CFG, SUPABASE_URL: CFG.SUPABASE_URL || DEFAULT_URL, SUPABASE_ANON_KEY: CFG.SUPABASE_ANON_KEY || DEFAULT_KEY };
  const LIVE = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  const KEY = "islamko_demo_v1";
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const nowISO = () => new Date().toISOString();
  let sb = null;

  // ---------- ضغط الصور قبل الرفع ----------
  async function compress(file, max = 1000, q = 0.82) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c;
    } finally { URL.revokeObjectURL(url); }
  }

  // ---------- بيانات تجريبية ----------
  function art(emoji, c1, c2, text) {
    const H = text ? 200 : 300;
    const t = text ? `<text x="375" y="95" font-size="34" font-weight="700" fill="#fff" text-anchor="end" font-family="sans-serif">${text}</text><text x="375" y="135" font-size="18" fill="#fff" opacity=".85" text-anchor="end" font-family="sans-serif">Goten</text>` : "";
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="${H}" fill="url(#g)"/>${t}<text x="${text ? 95 : 200}" y="${text ? 145 : 195}" font-size="${text ? 100 : 140}" text-anchor="middle">${emoji}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }
  function seed() {
    const cats = [
      ["c1", "أسماك طازجة", "Fresh Fish", "🐟"], ["c2", "روبيان", "Shrimp", "🦐"], ["c3", "سلطعون وكابوريا", "Crabs", "🦀"],
      ["c4", "حبار وأخطبوط", "Squid & Octopus", "🦑"], ["c5", "محار وأصداف", "Shellfish", "🦪"], ["c6", "مجمدات", "Frozen", "🧊"]
    ].map((c, i) => ({ id: c[0], name_ar: c[1], name_en: c[2], image: art(c[3], "#0B2545", "#13C4C4"), sort: i, active: true }));
    const P = (cat, ar, en, price, old, emoji, featured) => ({
      id: uid(), category_id: cat, name_ar: ar, name_en: en, desc_ar: "طازج يومياً – تنظيف وتقطيع مجاني حسب الطلب", desc_en: "Fresh daily – free cleaning & cutting on request",
      price, old_price: old, unit_ar: "كيلو", unit_en: "kg", image: art(emoji, "#e6fbfb", "#9ee9e9"), in_stock: true, active: true, featured: !!featured, sort: 0, created_at: nowISO()
    });
    const products = [
      P("c1", "زبيدي", "Pomfret (Zubaidi)", 4.75, 5.5, "🐟", 1), P("c1", "هامور", "Hamour", 5.5, null, "🐠", 1), P("c1", "شعم", "Sheim", 2.25, null, "🐟"),
      P("c1", "نويبي", "Newaiby", 3, null, "🐟"), P("c1", "سبيطي", "Sobaity", 3.5, null, "🐠"), P("c1", "ميد", "Mullet (Maid)", 1.75, null, "🐟"),
      P("c2", "روبيان جامبو", "Jumbo Shrimp", 4.5, 5.25, "🦐", 1), P("c2", "روبيان وسط", "Medium Shrimp", 3.25, null, "🦐"),
      P("c3", "كابوريا حية", "Live Crab", 2.75, null, "🦀"), P("c4", "حبار", "Squid", 2.5, null, "🦑"), P("c4", "أخطبوط", "Octopus", 4, null, "🐙"),
      P("c5", "بلح البحر", "Mussels", 1.95, null, "🦪"), P("c6", "روبيان مقشر مجمد", "Frozen Peeled Shrimp", 2.9, 3.4, "🧊", 1)
    ];
    const banners = [
      { id: uid(), image: art("🦐", "#0B2545", "#13C4C4", "عروض الأسبوع"), title: "عروض الأسبوع", sort: 0, active: true },
      { id: uid(), image: art("🛵", "#13C4C4", "#0B2545", "توصيل لكل الكويت"), title: "توصيل سريع", sort: 1, active: true }
    ];
    const profiles = [
      { id: "d1", full_name: "أبو محمد (مندوب تجريبي)", phone: "96599990001", role: "driver" },
      { id: "d2", full_name: "سالم (مندوب تجريبي)", phone: "96599990002", role: "driver" }
    ];
    return {
      categories: cats, products, banners, profiles, orders: [], nextNo: 1001,
      settings: { delivery_fee: 1, min_order: 5, free_delivery_over: 20, store_open: true, slots: ["10:00 – 12:00", "12:00 – 14:00", "16:00 – 18:00", "18:00 – 20:00", "20:00 – 22:00"], slot_days: 2, slot_cutoff: 60, allow_asap: true, whatsapp: C.STORE_PHONE || "", notice_ar: "بيانات تجريبية – غيّرها من لوحة التحكم", notice_en: "Sample data – edit it from the admin panel" }
    };
  }
  let mem = null;
  const db = () => { if (mem) return mem; try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} if (!mem) { mem = seed(); persist(); } return mem; };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { throw new Error("مساحة التخزين التجريبية امتلأت – احذف بعض الصور أو فعّل Supabase"); } }
  const sess = { get() { try { return JSON.parse(sessionStorage.getItem("islamko_demo_user")); } catch (e) { return null; } }, set(v) { try { sessionStorage.setItem("islamko_demo_user", JSON.stringify(v)); } catch (e) {} } };
  const upsertArr = (arr, row) => { if (!row.id) row.id = uid(); const i = arr.findIndex((x) => x.id === row.id); if (i >= 0) arr[i] = { ...arr[i], ...row }; else arr.push(row); persist(); return row; };
  const bySort = (a, b) => (a.sort || 0) - (b.sort || 0);

  // ---------- مخزون (تجريبي – نفس منطق قاعدة البيانات) ----------
  function demoStock(pid, delta, kind, oid, note, cost) {
    const d = db(), pr = d.products.find((x) => x.id === pid); if (!pr || pr.stock == null) return;
    pr.stock = Math.round((Number(pr.stock) + delta) * 1000) / 1000; pr.in_stock = pr.stock > 0;
    d.stock_moves = d.stock_moves || []; d.stock_moves.unshift({ id: uid(), product_id: pid, product_name: pr.name_ar, kind, qty: delta, balance: pr.stock, cost: cost || null, order_id: oid || null, note: note || null, created_at: nowISO() });
  }
  function demoOrderStock(o, sign, kind, note) { (o.items || []).forEach((it) => demoStock(it.id, sign * Number(it.qty), kind, o.id, note + o.order_no)); }
  function demoCoupon(code, sub, ph) {
    const c = (db().coupons || []).find((x) => x.code === String(code || "").trim().toUpperCase());
    if (!c || !c.active) throw new Error("COUPON_INVALID");
    const now = Date.now();
    if ((c.starts_at && now < new Date(c.starts_at)) || (c.ends_at && now > new Date(c.ends_at))) throw new Error("COUPON_EXPIRED");
    if (c.max_uses != null && c.uses >= c.max_uses) throw new Error("COUPON_LIMIT");
    if (sub < Number(c.min_order || 0)) throw new Error("COUPON_MIN:" + c.min_order);
    if (c.once_per_phone && ph && db().orders.some((o) => o.phone === ph && o.coupon_code === c.code && o.status !== "cancelled")) throw new Error("COUPON_USED");
    const disc = c.kind === "percent" ? Math.min(Math.round(sub * c.value * 10) / 1000, c.max_discount != null ? Number(c.max_discount) : sub) : c.kind === "fixed" ? Math.min(Number(c.value), sub) : 0;
    return { code: c.code, kind: c.kind, discount: disc, free_delivery: c.kind === "free_delivery" };
  }
  function audit(tbl, action, r, ao, an) { const d = db(), me = sess.get(); d.audit = d.audit || []; d.audit.unshift({ id: uid(), at: nowISO(), actor_name: (me && me.full_name) || "", tbl, action, row_id: r.id, amount_old: ao, amount_new: an, info: { kind: r.kind, party: r.party_name, note: r.note, no: r.receipt_no } }); d.audit = d.audit.slice(0, 300); }
  function demoPts(ph) { return Math.max(0, db().orders.filter((o) => o.phone === ph).reduce((a, o) => a + (o.status === "delivered" ? Number(o.points_earned || 0) : 0) - (o.status !== "cancelled" ? Number(o.points_used || 0) : 0), 0)); }
  function demoPlace(p) {
    const d = db(), s = d.settings;
    if (!s.store_open) throw new Error("STORE_CLOSED");
    const items = [], tot = {}, cnt = { kr: 0, pr: 0, kw: 0, pw: 0 }; let sub = 0;
    for (const it of p.items || []) {
      const pr = d.products.find((x) => x.id === it.id && x.active && x.in_stock);
      if (!pr) throw new Error("PRODUCT_UNAVAILABLE");
      const q = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
      tot[pr.id] = (tot[pr.id] || 0) + q;
      if (pr.stock != null && Number(pr.stock) < tot[pr.id]) throw new Error("OUT_OF_STOCK:" + pr.name_ar);
      const opts = (pr.options || []).filter((g) => (g.choices || []).length).map((g) => { const want = (it.opts || []).find((o) => o.g === g.name); const ch = (want && g.choices.find((c) => c.name === want.c)) || g.choices[0]; return { g: g.name, c: ch.name, price: Number(ch.price || 0) }; });
      const unit = Math.max(0, Number(pr.price) + opts.reduce((a, o) => a + o.price, 0));
      items.push({ id: pr.id, name_ar: pr.name_ar, name_en: pr.name_en, price: unit, base_price: pr.price, opts, qty: q, unit_ar: pr.unit_ar, image: pr.image, sale_type: pr.sale_type || "retail" });
      { const k = /كيلو|كغ|كجم/.test(pr.unit_ar || "") || /(^|[^a-z])(kg|kilo)/i.test(pr.unit_en || ""), w = pr.sale_type === "wholesale"; cnt[(k ? "k" : "p") + (w ? "w" : "r")] += q; }
      sub += unit * q;
    }
    if (!items.length) throw new Error("EMPTY");
    if (sub < (s.min_order || 0)) throw new Error("MIN_ORDER");
    let fee = s.free_delivery_over && sub >= s.free_delivery_over ? 0 : Number(s.delivery_fee || 0), disc = 0, cc = null;
    if (p.coupon) { const r = demoCoupon(p.coupon, sub, p.phone); disc = r.discount; if (r.free_delivery) fee = 0; cc = r.code; const c = d.coupons.find((x) => x.code === cc); c.uses = (c.uses || 0) + 1; }
    let pts = 0, pdisc = 0;
    if (p.use_points && s.points_on !== false) { const bal = demoPts(p.phone), pv = Number(s.point_value || 0.01); if (bal >= Number(s.points_min || 0) && bal > 0) { pts = Math.min(bal, Math.floor(Math.max(0, sub - disc) / pv)); pdisc = Math.round(pts * pv * 1000) / 1000; } }
    const fl = (s.fees || []).filter((f) => f.on !== false && Number(f.price) > 0 && (f.mode !== "optional" || (p.fees || []).includes(f.id))).map((f) => { const w = !!f.w, q = f.basis === "kg" ? cnt.kr + (w ? cnt.kw : 0) : f.basis === "piece" ? cnt.pr + (w ? cnt.pw : 0) : f.basis === "order" ? (cnt.kr + cnt.pr > 0 || w ? 1 : 0) : cnt.kr + cnt.pr + (w ? cnt.kw + cnt.pw : 0); return { id: f.id, name_ar: f.name_ar, name_en: f.name_en, qty: q, basis: f.basis, price: Number(f.price), amount: Math.round(Number(f.price) * q * 1000) / 1000 }; }).filter((x) => x.qty > 0);
    const ft = fl.reduce((a, f) => a + f.amount, 0);
    const { coupon, use_points, fees: _f, ...rest } = p;
    if (rest.payment === "wallet") rest.payment = "credit";
    const o = { ...rest, id: uid(), order_no: d.nextNo++, items, subtotal: sub, delivery_fee: fee, discount: disc, coupon_code: cc, points_used: pts, points_disc: pdisc, points_earned: 0, fees: fl, fees_total: ft, driver_id: s.auto_driver || null, total: Math.max(0, sub - disc - pdisc + fee + ft), status: "new", created_at: nowISO(), updated_at: nowISO() };
    d.orders.unshift(o); demoOrderStock(o, -1, "sale", "طلب #"); persist();
    return { id: o.id, order_no: o.order_no, total: o.total };
  }

  // ---------- Supabase ----------
  const chk = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("تعذر تحميل مكتبة Supabase – تأكد من الإنترنت")); document.head.appendChild(s); }); }

  const Store = {
    live: LIVE,
    async init() {
      if (!LIVE) { db(); return; }
      if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
      const RECOVERY = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
      Store.recovery = RECOVERY;
      sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") { Store.recovery = true; if (Store._onRecovery) Store._onRecovery(); } });
      if (RECOVERY) await sb.auth.getSession();
    },
    onChange(cb) { // تحديث تلقائي
      if (!LIVE) window.addEventListener("storage", (e) => { if (e.key === KEY) { mem = null; cb(); } });
      setInterval(() => { if (!LIVE) mem = null; cb(); }, 15000);
    },

    async settings() { return LIVE ? chk(await sb.from("settings").select("*").eq("id", 1).single()) : db().settings; },
    async saveSettings(s) { if (LIVE) { const r = { ...s }; delete r.id; return chk(await sb.from("settings").update(r).eq("id", 1)); } db().settings = { ...db().settings, ...s }; persist(); },

    async categories() { return LIVE ? chk(await sb.from("categories").select("*").order("sort")) : [...db().categories].sort(bySort); },
    async saveCategory(c) { if (LIVE) { const r = { ...c }; if (!r.id) delete r.id; return chk(await sb.from("categories").upsert(r).select().single()); } return upsertArr(db().categories, c); },
    async deleteCategory(id) { if (LIVE) return chk(await sb.from("categories").delete().eq("id", id)); const d = db(); d.categories = d.categories.filter((x) => x.id !== id); d.products.forEach((p) => { if (p.category_id === id) p.category_id = null; }); persist(); },

    async products() { return LIVE ? chk(await sb.from("products").select("*").order("sort").order("created_at", { ascending: false })) : [...db().products].sort(bySort); },
    async saveProduct(p) { if (LIVE) { const r = { ...p }; if (!r.id) delete r.id; delete r.stock; return chk(await sb.from("products").upsert(r).select().single()); } if (!p.created_at) p.created_at = nowISO(); const ex = p.id && db().products.find((x) => x.id === p.id); if (ex) p = { ...p, stock: ex.stock }; return upsertArr(db().products, p); },
    async deleteProduct(id) { if (LIVE) return chk(await sb.from("products").delete().eq("id", id)); const d = db(); d.products = d.products.filter((x) => x.id !== id); persist(); },

    async banners() { return LIVE ? chk(await sb.from("banners").select("*").order("sort")) : [...db().banners].sort(bySort); },
    async saveBanner(b) { if (LIVE) { const r = { ...b }; if (!r.id) delete r.id; return chk(await sb.from("banners").upsert(r).select().single()); } return upsertArr(db().banners, b); },
    async deleteBanner(id) { if (LIVE) return chk(await sb.from("banners").delete().eq("id", id)); const d = db(); d.banners = d.banners.filter((x) => x.id !== id); persist(); },

    // رفع صورة من الجهاز → رابط
    async uploadVideo(file) {
      if (file.size > 48 * 1024 * 1024) throw new Error("الفيديو أكبر من 48 ميجا – صغّره الأول (مثلاً من CapCut بجودة 720p)");
      if (!LIVE) return URL.createObjectURL(file);
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
      const path = "v/" + uid() + "." + ext;
      chk(await sb.storage.from("images").upload(path, file, { contentType: file.type || "video/mp4", upsert: false }));
      return sb.storage.from("images").getPublicUrl(path).data.publicUrl;
    },
    async uploadProof(file) {
      const c = await compress(file, 1000, 0.75);
      if (!LIVE) return c.toDataURL("image/jpeg", 0.6);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.75));
      const path = "proofs/" + uid() + ".jpg";
      chk(await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
      return sb.storage.from("images").getPublicUrl(path).data.publicUrl;
    },
    async uploadImage(file) {
      if (!LIVE) { const c = await compress(file, 700, 0.72); return c.toDataURL("image/jpeg", 0.72); }
      const c = await compress(file, 1200, 0.82);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
      const path = "p/" + uid() + ".jpg";
      chk(await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
      return sb.storage.from("images").getPublicUrl(path).data.publicUrl;
    },

    async checkCoupon(code, sub, ph) { return LIVE ? chk(await sb.rpc("check_coupon", { cc: code, sub, ph: ph || null })) : demoCoupon(code, sub, ph); },
    async coupons() {
      if (LIVE) { const r = await sb.from("coupons").select("*").order("created_at", { ascending: false }); if (r.error) { console.warn(r.error.message); return null; } return r.data; }
      return db().coupons || [];
    },
    async saveCoupon(c, isNew) {
      c = { ...c, code: String(c.code || "").trim().toUpperCase() };
      if (LIVE) return chk(isNew ? await sb.from("coupons").insert(c) : await sb.from("coupons").update(c).eq("code", c.code));
      const d = db(); d.coupons = d.coupons || []; const i = d.coupons.findIndex((x) => x.code === c.code);
      if (isNew && i >= 0) throw new Error("duplicate key – الكود موجود قبل كده");
      if (i >= 0) d.coupons[i] = { ...d.coupons[i], ...c }; else d.coupons.unshift({ uses: 0, created_at: nowISO(), ...c }); persist();
    },
    async deleteCoupon(code) { if (LIVE) return chk(await sb.from("coupons").delete().eq("code", code)); const d = db(); d.coupons = (d.coupons || []).filter((x) => x.code !== code); persist(); },
    async placeOrder(p) { return LIVE ? chk(await sb.rpc("place_order", { p })) : demoPlace(p); },
    async trackOrder(id) {
      if (LIVE) return chk(await sb.rpc("track_order", { oid: id }));
      const d = db(), o = d.orders.find((x) => x.id === id); if (!o) return null;
      const dr = d.profiles.find((x) => x.id === o.driver_id);
      return { ...o, driver_name: dr && dr.full_name, driver_phone: dr && dr.phone };
    },
    async orders() { return LIVE ? chk(await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(1000)) : db().orders; },
    async myPoints(ph) {
      if (LIVE) return chk(await sb.rpc("my_points", { ph }));
      const s = db().settings, b = demoPts(ph), pv = Number(s.point_value == null ? 0.01 : s.point_value);
      return { on: s.points_on !== false, points: b, value: Math.round(b * pv * 1000) / 1000, point_value: pv, per_kd: Number(s.points_per_kd == null ? 1 : s.points_per_kd), min: Number(s.points_min == null ? 100 : s.points_min) };
    },
    async rateOrder(id, stars, note) {
      if (LIVE) return chk(await sb.rpc("rate_order", { oid: id, stars, note: note || null }));
      const o = db().orders.find((x) => x.id === id); if (!o || o.status !== "delivered" || o.rating) throw new Error("NOT_ALLOWED"); Object.assign(o, { rating: stars, rating_note: note || null, rated_at: nowISO() }); persist();
    },
    async updateOrder(id, patch) { if (!LIVE && patch.status) { const o0 = db().orders.find((x) => x.id === id), st = db().settings; if (o0 && patch.status === "delivered" && o0.status !== "delivered") { patch.delivered_at = nowISO(); patch.driver_earning = o0.driver_id ? Number(st.driver_pay == null ? 0.5 : st.driver_pay) : 0; } if (o0 && patch.status === "delivered" && o0.status !== "delivered") patch.points_earned = st.points_on === false ? 0 : Math.floor(Math.max(0, Number(o0.total) - Number(o0.delivery_fee || 0)) * Number(st.points_per_kd == null ? 1 : st.points_per_kd)); else if (o0 && o0.status === "delivered" && patch.status !== "delivered") patch.points_earned = 0; } patch = { ...patch, updated_at: nowISO() }; if (LIVE) return chk(await sb.from("orders").update(patch).eq("id", id)); const o = db().orders.find((x) => x.id === id); const was = o.status; Object.assign(o, patch); if (patch.status === "cancelled" && was !== "cancelled") demoOrderStock(o, 1, "return", "إلغاء طلب #"); else if (patch.status && was === "cancelled" && patch.status !== "cancelled") demoOrderStock(o, -1, "sale", "رجوع طلب #"); persist(); },
    async deleteOrder(id) {
      if (LIVE) return chk(await sb.from("orders").delete().eq("id", id));
      const d = db(), o = d.orders.find((x) => x.id === id); if (o && o.status !== "cancelled") demoOrderStock(o, 1, "return", "حذف طلب #"); d.orders = d.orders.filter((x) => x.id !== id); persist();
    },
    async deleteAllOrders() {
      if (LIVE) return chk(await sb.from("orders").delete().not("id", "is", null));
      const d = db(); d.orders.forEach((o) => { if (o.status !== "cancelled") demoOrderStock(o, 1, "return", "حذف طلب #"); }); d.orders = []; persist();
    },
    async stockMoves() {
      if (LIVE) { const r = await sb.from("stock_moves").select("*").order("created_at", { ascending: false }).limit(1000); if (r.error) { console.warn(r.error.message); return null; } return r.data; }
      return db().stock_moves || [];
    },
    async stockMove(m) {
      if (LIVE) return chk(await sb.rpc("stock_move", { p: m }));
      const d = db(), pr = d.products.find((x) => x.id === m.product_id); if (!pr) throw new Error("NO_PRODUCT");
      if (pr.stock == null) pr.stock = 0;
      const q = Number(m.qty) || 0, delta = m.kind === "purchase" ? Math.abs(q) : m.kind === "waste" ? -Math.abs(q) : q - Number(pr.stock);
      demoStock(pr.id, delta, m.kind, null, m.note, m.cost ? Number(m.cost) : null);
      if (m.kind === "purchase" && Number(m.cost) > 0 && q) pr.cost = Math.round((Number(m.cost) / Math.abs(q)) * 1000) / 1000;
      persist(); return { stock: pr.stock };
    },
    async driverOrders() {
      const me = await this.me(); if (!me) return [];
      if (LIVE) return chk(await sb.from("orders").select("*").eq("driver_id", me.id).order("created_at", { ascending: false }).limit(1000));
      return db().orders.filter((o) => o.driver_id === me.id);
    },
    async driverMoves(driverId) {
      if (LIVE) { let q = sb.from("driver_moves").select("*").order("created_at", { ascending: false }).limit(500); if (driverId) q = q.eq("driver_id", driverId); return chk(await q); }
      const all = db().driverMoves || []; return driverId ? all.filter((m) => m.driver_id === driverId) : all;
    },
    async addDriverMove(m) {
      m = { driver_id: m.driver_id, kind: m.kind, amount: Number(m.amount), note: m.note || null, ...(m.category ? { category: m.category } : {}) };
      if (LIVE) return chk(await sb.from("driver_moves").insert(m));
      const d = db(); d.driverMoves = d.driverMoves || []; d.driverMoves.unshift({ ...m, id: uid(), created_at: nowISO() }); persist();
    },
    async deleteDriverMove(id) { if (LIVE) return chk(await sb.from("driver_moves").delete().eq("id", id)); const d = db(); d.driverMoves = (d.driverMoves || []).filter((x) => x.id !== id); persist(); },
    async driverSetStatus(id, st, proof) {
      if (LIVE) return chk(await sb.rpc("driver_set_status", { oid: id, st, proof: proof || null }));
      if (proof) { const o = db().orders.find((x) => x.id === id); if (o) { o.proof_url = proof; persist(); } }
      if (!["preparing", "out_for_delivery", "delivered"].includes(st)) throw new Error("BAD_STATUS");
      return this.updateOrder(id, { status: st });
    },

    // ---------- الحسابات ----------
    async me() {
      if (!LIVE) return sess.get();
      const { data } = await sb.auth.getUser(); if (!data || !data.user) return null;
      const p = (await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle()).data;
      return p || { id: data.user.id, role: "pending", email: data.user.email };
    },
    async signIn(email, password) { if (!LIVE) throw new Error("DEMO"); chk(await sb.auth.signInWithPassword({ email, password })); UI.saveEmail(email); },
    async resetPassword(email) {
      if (!LIVE) throw new Error("مش متاح في الوضع التجريبي");
      chk(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async setNewPassword(pw) { chk(await sb.auth.updateUser({ password: pw })); Store.recovery = false; history.replaceState(null, "", location.pathname); },
    async signUp(email, password, full_name, phone) { if (!LIVE) throw new Error("DEMO"); return chk(await sb.auth.signUp({ email, password, options: { data: { full_name, phone } } })); },
    async signOut() { if (LIVE) await sb.auth.signOut(); else sess.set(null); },
    demoLogin(user) { sess.set(user); },
    async profiles() { return LIVE ? chk(await sb.from("profiles").select("*").order("created_at", { ascending: false })) : db().profiles; },
    async saveProfile(p) { if (LIVE) { const { id, role, full_name, phone } = p; return chk(await sb.from("profiles").update({ role, full_name, phone }).eq("id", id)); } return upsertArr(db().profiles, p); },
    async savePush(sub) {
      if (!LIVE) throw new Error("الإشعارات بتشتغل في النسخة الحقيقية بس");
      const j = sub.toJSON();
      chk(await sb.rpc("save_push_subscription", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }));
    },
    async saveCustomerPush(sub, phone) {
      if (!LIVE) throw new Error("DEMO");
      const j = sub.toJSON();
      chk(await sb.rpc("save_customer_push", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_phone: phone || null }));
    },
    async customerPushCount() { if (!LIVE) return 0; return chk(await sb.rpc("customer_push_count")); },
    async broadcastPush(title, body) { if (!LIVE) throw new Error("الإشعارات بتشتغل في النسخة الحقيقية بس"); return chk(await sb.rpc("broadcast_push", { p_title: title, p_body: body })); },
    // زباين مضافين يدوي / مستوردين
    async importedCustomers() {
      if (LIVE) { const r = await sb.from("customers").select("*").order("created_at", { ascending: false }); if (r.error) { console.warn(r.error.message); return []; } return r.data; }
      return db().customers || [];
    },
    async saveCustomers(rows) {
      if (LIVE) return chk(await sb.from("customers").upsert(rows, { onConflict: "phone" }));
      const d = db(); d.customers = d.customers || [];
      for (const r of rows) { const i = d.customers.findIndex((x) => x.phone === r.phone); if (i >= 0) d.customers[i] = { ...d.customers[i], ...r }; else d.customers.unshift({ ...r, created_at: nowISO() }); }
      persist();
    },
    async deleteCustomer(phone) {
      if (LIVE) return chk(await sb.from("customers").delete().eq("phone", phone));
      const d = db(); d.customers = (d.customers || []).filter((x) => x.phone !== phone); persist();
    },
    // الحسابات
    async transactions() {
      if (LIVE) { const r = await sb.from("transactions").select("*").order("date", { ascending: false }).limit(2000); if (r.error) { console.warn(r.error.message); return []; } return r.data; }
      return db().transactions || [];
    },
    async saveTransaction(t) {
      if (LIVE) return chk(await sb.from("transactions").insert(t).select().single());
      const d = db(); d.transactions = d.transactions || []; const r = { ...t, id: uid(), created_at: nowISO() };
      if (t.kind === "receivable_paid") { d.receiptNo = (d.receiptNo || 1000) + 1; r.receipt_no = d.receiptNo; }
      d.transactions.unshift(r); audit("transactions", "insert", r, null, r.amount); persist(); return r;
    },
    // التحصيل
    async custMeta() { if (LIVE) { const r = await sb.from("customer_meta").select("*"); if (r.error) { console.warn(r.error.message); return []; } return r.data; } return db().custMeta || []; },
    async saveCustMeta(m) {
      m = { ...m, updated_at: nowISO() };
      if (LIVE) return chk(await sb.from("customer_meta").upsert(m, { onConflict: "phone" }));
      const d = db(); d.custMeta = d.custMeta || []; const i = d.custMeta.findIndex((x) => x.phone === m.phone); if (i >= 0) d.custMeta[i] = { ...d.custMeta[i], ...m }; else d.custMeta.push(m); persist();
    },
    async dayCloses() { if (LIVE) { const r = await sb.from("day_closes").select("*").order("day", { ascending: false }).limit(120); if (r.error) { console.warn(r.error.message); return []; } return r.data; } return db().dayCloses || []; },
    async saveDayClose(c) {
      if (LIVE) return chk(await sb.from("day_closes").upsert(c, { onConflict: "day" }));
      const d = db(); d.dayCloses = d.dayCloses || []; const i = d.dayCloses.findIndex((x) => x.day === c.day); const r = { ...c, created_at: nowISO() }; audit("day_closes", i >= 0 ? "update" : "insert", { id: c.day }, i >= 0 ? d.dayCloses[i].counted_cash : null, c.counted_cash);
      if (i >= 0) d.dayCloses[i] = r; else d.dayCloses.unshift(r); persist();
    },
    async auditLog() { if (LIVE) { const r = await sb.from("audit_log").select("*").order("at", { ascending: false }).limit(300); if (r.error) return []; return r.data; } return db().audit || []; },
    async myAccount(oid) { if (LIVE) return chk(await sb.rpc("my_account", { oid })); const o = db().orders.find((x) => x.id === oid); if (!o) return null; return { balance: 0, lines: [], phone_tail: o.phone.slice(-4) }; },
    async walletBalance(oid) { if (LIVE) return Number(chk(await sb.rpc("wallet_balance", { oid })) || 0); return 0; },
    async deleteTransaction(id) {
      if (LIVE) return chk(await sb.from("transactions").delete().eq("id", id));
      const d = db(); { const o = (d.transactions || []).find((x) => x.id === id); if (o) audit("transactions", "delete", o, o.amount, null); } d.transactions = (d.transactions || []).filter((x) => x.id !== id); persist();
    },
    // الموظفين والمصاريف الثابتة
    async employees() { if (LIVE) { const r = await sb.from("employees").select("*").order("created_at"); if (r.error) { console.warn(r.error.message); return []; } return r.data; } return db().employees || []; },
    async saveEmployee(e) { if (LIVE) { const r = { ...e }; if (!r.id) delete r.id; return chk(await sb.from("employees").upsert(r)); } const d = db(); d.employees = d.employees || []; return upsertArr(d.employees, e); },
    async deleteEmployee(id) { if (LIVE) return chk(await sb.from("employees").delete().eq("id", id)); const d = db(); d.employees = (d.employees || []).filter((x) => x.id !== id); persist(); },
    async recurring() { if (LIVE) { const r = await sb.from("recurring").select("*").order("day"); if (r.error) { console.warn(r.error.message); return []; } return r.data; } return db().recurring || []; },
    async saveRecurring(e) { if (LIVE) { const r = { ...e }; if (!r.id) delete r.id; return chk(await sb.from("recurring").upsert(r)); } const d = db(); d.recurring = d.recurring || []; return upsertArr(d.recurring, e); },
    async deleteRecurring(id) { if (LIVE) return chk(await sb.from("recurring").delete().eq("id", id)); const d = db(); d.recurring = (d.recurring || []).filter((x) => x.id !== id); persist(); },
    async uploadDoc(file) {
      const c = await compress(file, 1400, 0.8);
      if (!LIVE) return c.toDataURL("image/jpeg", 0.6);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8)), path = "docs/" + uid() + ".jpg";
      chk(await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
      return sb.storage.from("images").getPublicUrl(path).data.publicUrl;
    },
    // الموردين
    async suppliers() {
      if (LIVE) { const r = await sb.from("suppliers").select("*").order("name"); if (r.error) { console.warn(r.error.message); return null; } return r.data; }
      return db().suppliers || [];
    },
    async saveSupplier(x) {
      if (LIVE) { const r = { ...x }; if (!r.id) delete r.id; return chk(await sb.from("suppliers").upsert(r).select().single()); }
      const d = db(); d.suppliers = d.suppliers || []; if (!x.id) { x = { ...x, id: uid(), created_at: nowISO() }; d.suppliers.push(x); } else Object.assign(d.suppliers.find((y) => y.id === x.id), x); persist(); return x;
    },
    async deleteSupplier(id) {
      if (LIVE) return chk(await sb.from("suppliers").delete().eq("id", id));
      const d = db(); d.suppliers = (d.suppliers || []).filter((x) => x.id !== id); (d.transactions || []).forEach((t) => { if (t.supplier_id === id) t.supplier_id = null; }); persist();
    },
    async resetDemo() { if (!LIVE) { mem = seed(); persist(); } }
  };
  window.Store = Store;
})();
