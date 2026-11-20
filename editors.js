// محررات مشتركة (لوحة التحكم + وضع التعديل في المتجر)
(function () {
  const { esc, toast, sheet, closeSheet, num } = UI;
  const $ = (id) => document.getElementById(id);
  function imgPicker(cur) {
    return `<div class="imgpick"><img id="imgPrev" src="${esc(cur || "")}" alt=""><div><input type="file" accept="image/*" id="imgFile" hidden><button type="button" class="btn tq sm" id="imgBtn">📷 اختر صورة من الجهاز</button>
      <div class="mut" style="margin-top:6px">أو الصق رابط صورة:</div><input class="in" id="imgUrl" dir="ltr" placeholder="https://..." value="${cur && !String(cur).startsWith("data:") ? esc(cur) : ""}" style="margin-top:4px"></div></div>`;
  }
  function wireImgPicker(state) {
    $("imgBtn").onclick = () => $("imgFile").click();
    $("imgFile").onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      $("imgBtn").disabled = true; $("imgBtn").textContent = "⏳ جاري الرفع...";
      try { state.image = await Store.uploadImage(f); $("imgPrev").src = state.image; toast("تم رفع الصورة ✓"); }
      catch (err) { toast(err.message, "err"); } finally { $("imgBtn").disabled = false; $("imgBtn").textContent = "📷 تغيير الصورة"; }
    };
    $("imgUrl").oninput = (e) => { const v = e.target.value.trim(); if (v) { state.image = v; $("imgPrev").src = v; } };
  }
  function editProduct(id, E) {
    const p = id ? { ...E.products.find((x) => x.id === id) } : { active: true, in_stock: true, featured: false, unit_ar: "كيلو", unit_en: "kg", sort: 0, category_id: (E.cats[0] || {}).id || null, image: "" };
    const fi = (k, l, type = "text", extra = "") => `<label class="f"><span>${l}</span><input class="in" id="p_${k}" type="${type}" value="${esc(p[k] == null ? "" : p[k])}" ${extra}></label>`;
    const sw = (k, l) => `<label class="switch"><span>${l}</span><input type="checkbox" id="p_${k}" ${p[k] ? "checked" : ""}></label>`;
    sheet(`<h3 style="margin:0 0 10px">${id ? "تعديل منتج" : "منتج جديد"}</h3>${imgPicker(p.image)}
      <div class="row2">${fi("name_ar", "الاسم بالعربي *")}${fi("name_en", "الاسم بالإنجليزي")}</div>
      <label class="f"><span>القسم</span><select class="in" id="p_category_id"><option value="">بدون قسم</option>${E.cats.map((c) => `<option value="${c.id}" ${p.category_id === c.id ? "selected" : ""}>${esc(c.name_ar)}</option>`).join("")}</select></label>
      <div class="row2">${fi("price", "السعر (د.ك) *", "number", 'step="0.005" min="0" inputmode="decimal"')}${fi("old_price", "السعر قبل الخصم", "number", 'step="0.005" min="0" inputmode="decimal"')}</div>
      <div class="row3">${fi("unit_ar", "الوحدة")}${fi("unit_en", "Unit")}${fi("sort", "الترتيب", "number", 'inputmode="numeric"')}</div>
      <label class="f"><span>الوصف بالعربي</span><textarea class="in" id="p_desc_ar" rows="2">${esc(p.desc_ar || "")}</textarea></label>
      <label class="f"><span>الوصف بالإنجليزي</span><textarea class="in" id="p_desc_en" rows="2">${esc(p.desc_en || "")}</textarea></label>
      ${sw("active", "ظاهر في التطبيق")}${sw("in_stock", "متوفر")}${sw("featured", "يظهر في العروض المميزة")}
      <button class="btn tq block" id="pSave" style="margin-top:14px">💾 حفظ</button>${id ? '<button class="btn red block" id="pDel" style="margin-top:8px">🗑️ حذف المنتج</button>' : ""}`, () => {
      wireImgPicker(p);
      $("pSave").onclick = async () => {
        const v = (k) => $("p_" + k).value.trim(), c = (k) => $("p_" + k).checked;
        const row = { ...p, name_ar: v("name_ar"), name_en: v("name_en"), category_id: v("category_id") || null, price: num(v("price")), old_price: v("old_price") ? num(v("old_price")) : null, unit_ar: v("unit_ar"), unit_en: v("unit_en"), sort: parseInt(v("sort")) || 0, desc_ar: $("p_desc_ar").value.trim(), desc_en: $("p_desc_en").value.trim(), active: c("active"), in_stock: c("in_stock"), featured: c("featured") };
        if (!row.name_ar || !(row.price > 0)) return toast("الاسم والسعر مطلوبين", "err");
        try { $("pSave").disabled = true; await Store.saveProduct(row); toast("تم الحفظ ✓"); closeSheet(); await E.done(); } catch (e) { toast(e.message, "err"); $("pSave").disabled = false; }
      };
      if (id) $("pDel").onclick = async () => { if (!(await UI.ask("حذف المنتج نهائياً؟"))) return; try { await Store.deleteProduct(id); closeSheet(); toast("تم الحذف"); await E.done(); } catch (e) { toast(e.message, "err"); } };
    });
  }

  function editCat(id, E) {
    const c = id ? { ...E.cats.find((x) => x.id === id) } : { active: true, sort: E.cats.length, image: "" };
    sheet(`<h3 style="margin:0 0 10px">${id ? "تعديل قسم" : "قسم جديد"}</h3>${imgPicker(c.image)}
      <div class="row2"><label class="f"><span>الاسم بالعربي *</span><input class="in" id="c_ar" value="${esc(c.name_ar || "")}"></label><label class="f"><span>الاسم بالإنجليزي</span><input class="in" id="c_en" value="${esc(c.name_en || "")}"></label></div>
      <label class="f"><span>الترتيب</span><input class="in" id="c_sort" type="number" value="${c.sort || 0}"></label><label class="switch"><span>ظاهر</span><input type="checkbox" id="c_act" ${c.active ? "checked" : ""}></label>
      <button class="btn tq block" id="cSave" style="margin-top:14px">💾 حفظ</button>${id ? '<button class="btn red block" id="cDel" style="margin-top:8px">🗑️ حذف القسم</button>' : ""}`, () => {
      wireImgPicker(c);
      $("cSave").onclick = async () => { const row = { ...c, name_ar: $("c_ar").value.trim(), name_en: $("c_en").value.trim(), sort: parseInt($("c_sort").value) || 0, active: $("c_act").checked }; if (!row.name_ar) return toast("اكتب اسم القسم", "err"); try { await Store.saveCategory(row); closeSheet(); toast("تم الحفظ ✓"); await E.done(); } catch (e) { toast(e.message, "err"); } };
      if (id) $("cDel").onclick = async () => { if (!(await UI.ask("حذف القسم؟ المنتجات ستبقى بدون قسم."))) return; try { await Store.deleteCategory(id); closeSheet(); await E.done(); } catch (e) { toast(e.message, "err"); } };
    });
  }
  function editBanner(id, E) {
    const b = id ? { ...E.banners.find((x) => x.id === id) } : { active: true, sort: E.banners.length, image: "" };
    sheet(`<h3 style="margin:0 0 10px">${id ? "تعديل بنر" : "بنر جديد"}</h3>${imgPicker(b.image)}<label class="f"><span>عنوان (اختياري)</span><input class="in" id="b_t" value="${esc(b.title || "")}"></label>
      <label class="f"><span>الترتيب</span><input class="in" id="b_sort" type="number" value="${b.sort || 0}"></label><label class="switch"><span>ظاهر</span><input type="checkbox" id="b_act" ${b.active ? "checked" : ""}></label>
      <button class="btn tq block" id="bSave" style="margin-top:14px">💾 حفظ</button>${id ? '<button class="btn red block" id="bDel" style="margin-top:8px">🗑️ حذف</button>' : ""}`, () => {
      wireImgPicker(b);
      $("bSave").onclick = async () => { if (!b.image) return toast("اختر صورة للبنر", "err"); try { await Store.saveBanner({ ...b, title: $("b_t").value.trim(), sort: parseInt($("b_sort").value) || 0, active: $("b_act").checked }); closeSheet(); toast("تم الحفظ ✓"); await E.done(); } catch (e) { toast(e.message, "err"); } };
      if (id) $("bDel").onclick = async () => { if (!(await UI.ask("حذف البنر؟"))) return; await Store.deleteBanner(id); closeSheet(); await E.done(); };
    });
  }


  // إعدادات الواجهة: اسم المتجر والشعار والشريط العلوي
  function editHeader(s, E) {
    const st = { image: s.logo || "" };
    sheet(`<h3 style="margin:0 0 10px">تعديل الشريط العلوي</h3><div class="mut" style="margin-bottom:6px">الشعار (صورة مربعة):</div>${imgPicker(st.image)}
      <label class="f"><span>اسم المتجر</span><input class="in" id="h_name" value="${esc(s.store_name || "إسلامكو ISLAMKO")}"></label>
      <div class="row2"><label class="f"><span>الشعار النصي بالعربي</span><input class="in" id="h_tar" value="${esc(s.tagline_ar || "أسماك ومأكولات بحرية طازجة")}"></label><label class="f"><span>Tagline (English)</span><input class="in" id="h_ten" value="${esc(s.tagline_en || "Fresh fish & seafood")}"></label></div>
      <div class="row2"><label class="f"><span>شريط التنبيه بالعربي</span><input class="in" id="h_nar" value="${esc(s.notice_ar || "")}"></label><label class="f"><span>Notice (English)</span><input class="in" id="h_nen" value="${esc(s.notice_en || "")}"></label></div>
      <label class="f"><span>لون الشريط</span><input class="in" id="h_color" type="color" value="${esc(s.header_color || "#0B2545")}" style="height:48px"></label>
      <button class="btn ghost sm" id="h_rmlogo" type="button">إرجاع الشعار الأصلي</button>
      <button class="btn tq block" id="hSave" style="margin-top:14px">💾 حفظ</button>`, () => {
      wireImgPicker(st);
      $("h_rmlogo").onclick = () => { st.image = ""; $("imgPrev").src = ""; };
      $("hSave").onclick = async () => {
        try { await Store.saveSettings({ logo: st.image || null, store_name: $("h_name").value.trim(), tagline_ar: $("h_tar").value.trim(), tagline_en: $("h_ten").value.trim(), notice_ar: $("h_nar").value.trim(), notice_en: $("h_nen").value.trim(), header_color: $("h_color").value }); closeSheet(); toast("تم الحفظ ✓"); await E.done(); } catch (e) { toast(e.message, "err"); }
      };
    });
  }
  window.Editors = { product: editProduct, category: editCat, banner: editBanner, header: editHeader };
})();
