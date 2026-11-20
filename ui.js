// أدوات مشتركة للواجهة
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => Number(n || 0);
  const money = (n, lang) => num(n).toFixed(3) + (lang === "en" ? " KWD" : " د.ك");

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function toast(msg, type) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = "show " + (type || "");
    clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 2600);
  }

  // نافذة سفلية (Bottom sheet)
  function sheet(html, onMount) {
    closeSheet();
    const w = document.createElement("div");
    w.id = "sheet";
    w.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet-box"><button class="sheet-x" data-close aria-label="إغلاق">✕</button>${html}</div>`;
    w.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeSheet(); });
    document.body.appendChild(w);
    requestAnimationFrame(() => w.classList.add("open"));
    if (onMount) onMount(w);
    return w;
  }
  // نافذة تأكيد داخل الصفحة (بدل confirm)
  function ask(msg) {
    return new Promise((res) => {
      const w = document.createElement("div"); w.id = "askbox";
      w.style.cssText = "position:fixed;inset:0;z-index:300;background:rgba(8,20,38,.55);display:flex;align-items:center;justify-content:center;padding:20px";
      w.innerHTML = `<div style="background:#fff;border-radius:18px;padding:18px;max-width:340px;width:100%;text-align:center"><p style="font-weight:700;margin:6px 0 16px">${esc(msg)}</p><div class="row2"><button class="btn ghost" data-a="0">إلغاء</button><button class="btn" data-a="1">تأكيد</button></div></div>`;
      w.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (b || e.target === w) { w.remove(); res(!!(b && b.dataset.a === "1")); } });
      document.body.appendChild(w);
    });
  }
  function closeSheet() { const s = document.getElementById("sheet"); if (s) s.remove(); }

  const STATUS = {
    new: { ar: "جديد", en: "New", c: "#2563eb" },
    confirmed: { ar: "تم التأكيد", en: "Confirmed", c: "#7c3aed" },
    preparing: { ar: "قيد التجهيز", en: "Preparing", c: "#d97706" },
    out_for_delivery: { ar: "في الطريق", en: "On the way", c: "#0891b2" },
    delivered: { ar: "تم التوصيل", en: "Delivered", c: "#16a34a" },
    cancelled: { ar: "ملغي", en: "Cancelled", c: "#dc2626" }
  };
  const STATUS_FLOW = ["new", "confirmed", "preparing", "out_for_delivery", "delivered"];

  const AREAS = {
    "العاصمة": ["مدينة الكويت", "الشرق", "المرقاب", "الدسمة", "الدعية", "الشامية", "الشويخ", "الصليبيخات", "الدوحة", "الروضة", "العديلية", "الفيحاء", "القادسية", "كيفان", "المنصورية", "النزهة", "اليرموك", "قرطبة", "السرة", "الخالدية", "غرناطة", "النهضة", "جابر الأحمد"],
    "حولي": ["حولي", "السالمية", "الجابرية", "الرميثية", "بيان", "مشرف", "سلوى", "الشعب", "ميدان حولي", "حطين", "الشهداء", "الصديق", "السلام", "الزهراء", "البدع"],
    "الفروانية": ["الفروانية", "خيطان", "جليب الشيوخ", "العارضية", "الرابية", "الرحاب", "الأندلس", "العمرية", "اشبيلية", "الرقعي", "عبدالله المبارك", "صباح الناصر", "الفردوس", "العباسية"],
    "مبارك الكبير": ["مبارك الكبير", "صباح السالم", "العدان", "القرين", "القصور", "المسيلة", "أبو فطيرة", "الفنيطيس", "صبحان", "المسايل", "أبو الحصانية"],
    "الأحمدي": ["الأحمدي", "الفحيحيل", "المنقف", "أبو حليفة", "الفنطاس", "المهبولة", "الصباحية", "الرقة", "هدية", "العقيلة", "الظهر", "صباح الأحمد", "الخيران", "الوفرة", "جابر العلي", "فهد الأحمد", "علي صباح السالم"],
    "الجهراء": ["الجهراء", "سعد العبدالله", "القصر", "العيون", "النسيم", "الواحة", "تيماء", "الصليبية", "النعيم", "القيروان"]
  };

  const fmtDate = (d) => { try { return new Date(d).toLocaleString("ar-KW", { dateStyle: "short", timeStyle: "short" }); } catch (e) { return d; } };

  const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#13C4C4"/><path d="M11 32c6-9 16-13 26-10 4 1 7 4 9 6l7-6v20l-7-6c-2 2-5 5-9 6-10 3-20-1-26-10z" fill="#fff"/><circle cx="21" cy="30" r="2.6" fill="#0B2545"/><path d="M10 49c5 3 9 3 14 0s9-3 14 0 9 3 14 0" stroke="#0B2545" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';

  window.UI = { LOGO, ask, esc, money, num, ls, toast, sheet, closeSheet, STATUS, STATUS_FLOW, AREAS, fmtDate };
})();
