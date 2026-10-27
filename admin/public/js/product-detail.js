(() => {
    const source = document.querySelector("#productRecordExamples");
    const form = document.querySelector("#productDetailForm");
    const notFound = document.querySelector("#productNotFound");
    const toast = document.querySelector("#toastMessage");
    if (!source || !form || !notFound || !window.LandiformInventory) return;

    let records = [];
    try { records = JSON.parse(source.textContent); } catch { records = []; }
    const id = new URLSearchParams(location.search).get("id");
    const record = records.find((item) => item.id === id);
    if (!record) { form.hidden = true; notFound.hidden = false; return; }

    const groupLabels = { apartment: "Căn hộ", house: "Nhà ở", land: "Đất nền & lô đất" };
    const setValue = (name, value) => {
        const control = form.querySelector(`[name="${name}"]`);
        if (control && value != null) control.value = value;
    };
    Object.entries(record).forEach(([key, value]) => {
        if (!["group", "bedrooms", "bathrooms", "storeys", "frontage", "depth", "legalUse"].includes(key)) setValue(key, value);
    });
    setValue("group", groupLabels[record.group] || groupLabels.apartment);
    document.querySelectorAll("[data-product-group]").forEach((section) => { section.hidden = section.dataset.productGroup !== record.group; });
    const attributeValue = (name, value) => {
        const control = form.querySelector(`[data-product-group="${record.group}"] [name="${name}"]`);
        if (control && value != null) control.value = value;
    };
    ["bedrooms", "bathrooms", "storeys", "frontage", "depth", "legalUse"].forEach((name) => attributeValue(name, record[name]));

    document.querySelector("#productTitle").textContent = record.code;
    document.querySelector("#productSubtitle").textContent = `${record.project} · ${record.type}`;
    document.querySelector("#productTypeBadge").textContent = groupLabels[record.group] || "Sản phẩm";
    document.querySelector("#summaryCode").textContent = record.code;
    document.querySelector("#summaryProject").textContent = record.project;
    document.querySelector("#summaryGroup").textContent = groupLabels[record.group] || "—";
    document.querySelector("#summaryArea").textContent = record.area ? `${record.area} m²` : "—";
    document.querySelector("#summaryPrice").textContent = record.price ? `${record.price.replace(".", ",")} tỷ` : "—";
    document.querySelector("[data-floor-field]").hidden = !record.floor;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(form);
        const units = window.LandiformInventory.all();
        const index = units.findIndex((unit) => unit.id === id);
        if (index < 0) return;
        const group = ({ "Căn hộ": "apartment", "Nhà ở": "house", "Đất nền & lô đất": "land" })[String(values.get("group"))] || record.group;
        const floorText = String(values.get("floor") || "").trim();
        const next = {
            ...units[index],
            type: String(values.get("type") || "").trim(),
            tower: String(values.get("zone") || "").trim(),
            floor: Number(/\d+/.exec(floorText)?.[0]) || null,
            code: String(values.get("code") || "").trim(),
            area: Number(String(values.get("area") || "").replace(",", ".")),
            price: Number(String(values.get("price") || "").replace(",", ".")),
            commissionPercent: Number(String(values.get("commission") || "").replace(",", ".")),
            status: String(values.get("status")),
            productGroup: group,
            attributes: {
                ...(units[index].attributes || {}),
                bedrooms: values.get("bedrooms") ? Number(values.get("bedrooms")) : undefined,
                bathrooms: values.get("bathrooms") ? Number(values.get("bathrooms")) : undefined,
                storeys: values.get("storeys") ? Number(values.get("storeys")) : undefined,
                frontage: values.get("frontage") ? Number(String(values.get("frontage")).replace(",", ".")) : undefined,
                depth: values.get("depth") ? Number(String(values.get("depth")).replace(",", ".")) : undefined,
                legalUse: String(values.get("legalUse") || "").trim() || undefined,
            },
        };
        units[index] = next;
        if (!window.LandiformInventory.replace(units)) return;
        document.querySelector("#productTitle").textContent = next.code;
        document.querySelector("#productSubtitle").textContent = `${next.project} · ${next.type}`;
        document.querySelector("#summaryCode").textContent = next.code;
        document.querySelector("#summaryArea").textContent = next.area ? `${next.area} m²` : "—";
        document.querySelector("#summaryPrice").textContent = next.price ? `${String(next.price).replace(".", ",")} tỷ` : "—";
        if (toast) {
            toast.textContent = "Đã cập nhật trong phiên hiện tại. Tải lại trang sẽ khôi phục dữ liệu ví dụ.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
        }
    });
})();
