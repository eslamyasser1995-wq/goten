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
      settings: { delivery_fee: 1, min_order: 5, free_delivery_over: 20, store_open: true, whatsapp: C.STORE_PHONE || "", notice_ar: "بيانات تجريبية – غيّرها من لوحة التحكم", notice_en: "Sample data – edit it from the admin panel" }
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
  function demoPlace(p) {
    const d = db(), s = d.settings;
    if (!s.store_open) throw new Error("STORE_CLOSED");
    const items = []; let sub = 0;
    for (const it of p.items || []) {
      const pr = d.products.find((x) => x.id === it.id && x.active && x.in_stock);
      if (!pr) throw new Error("PRODUCT_UNAVAILABLE");
      const q = Math.max(1, Math.min(99, parseInt(it.qty) || 1));
      if (pr.stock != null && Number(pr.stock) < q) throw new Error("OUT_OF_STOCK:" + pr.name_ar);
      items.push({ id: pr.id, name_ar: pr.name_ar, name_en: pr.name_en, price: pr.price, qty: q, unit_ar: pr.unit_ar, image: pr.image });
      sub += pr.price * q;
    }
    if (!items.length) throw new Error("EMPTY");
    if (sub < (s.min_order || 0)) throw new Error("MIN_ORDER");
    const fee = s.free_delivery_over && sub >= s.free_delivery_over ? 0 : Number(s.delivery_fee || 0);
    const o = { ...p, id: uid(), order_no: d.nextNo++, items, subtotal: sub, delivery_fee: fee, total: sub + fee, status: "new", driver_id: null, created_at: nowISO(), updated_at: nowISO() };
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
      sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
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
    async uploadImage(file) {
      if (!LIVE) { const c = await compress(file, 700, 0.72); return c.toDataURL("image/jpeg", 0.72); }
      const c = await compress(file, 1200, 0.82);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
      const path = "p/" + uid() + ".jpg";
      chk(await sb.storage.from("images").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
      return sb.storage.from("images").getPublicUrl(path).data.publicUrl;
    },

    async placeOrder(p) { return LIVE ? chk(await sb.rpc("place_order", { p })) : demoPlace(p); },
    async trackOrder(id) {
      if (LIVE) return chk(await sb.rpc("track_order", { oid: id }));
      const d = db(), o = d.orders.find((x) => x.id === id); if (!o) return null;
      const dr = d.profiles.find((x) => x.id === o.driver_id);
      return { ...o, driver_name: dr && dr.full_name, driver_phone: dr && dr.phone };
    },
    async orders() { return LIVE ? chk(await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(300)) : db().orders; },
    async updateOrder(id, patch) { patch = { ...patch, updated_at: nowISO() }; if (LIVE) return chk(await sb.from("orders").update(patch).eq("id", id)); const o = db().orders.find((x) => x.id === id); const was = o.status; Object.assign(o, patch); if (patch.status === "cancelled" && was !== "cancelled") demoOrderStock(o, 1, "return", "إلغاء طلب #"); else if (patch.status && was === "cancelled" && patch.status !== "cancelled") demoOrderStock(o, -1, "sale", "رجوع طلب #"); persist(); },
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
      if (LIVE) return chk(await sb.from("orders").select("*").eq("driver_id", me.id).order("created_at", { ascending: false }).limit(100));
      return db().orders.filter((o) => o.driver_id === me.id);
    },
    async driverSetStatus(id, st) {
      if (LIVE) return chk(await sb.rpc("driver_set_status", { oid: id, st }));
      if (!["out_for_delivery", "delivered"].includes(st)) throw new Error("BAD_STATUS");
      return this.updateOrder(id, { status: st });
    },

    // ---------- الحسابات ----------
    async me() {
      if (!LIVE) return sess.get();
      const { data } = await sb.auth.getUser(); if (!data || !data.user) return null;
      const p = (await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle()).data;
      return p || { id: data.user.id, role: "pending", email: data.user.email };
    },
    async signIn(email, password) { if (!LIVE) throw new Error("DEMO"); chk(await sb.auth.signInWithPassword({ email, password })); },
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
      if (LIVE) return chk(await sb.from("transactions").insert(t));
      const d = db(); d.transactions = d.transactions || []; d.transactions.unshift({ ...t, id: uid(), created_at: nowISO() }); persist();
    },
    async deleteTransaction(id) {
      if (LIVE) return chk(await sb.from("transactions").delete().eq("id", id));
      const d = db(); d.transactions = (d.transactions || []).filter((x) => x.id !== id); persist();
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
