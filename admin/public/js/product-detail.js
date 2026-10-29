(() => {
    const source = document.querySelector("#productRecordExamples");
    const form = document.querySelector("#productDetailForm");
    const notFound = document.querySelector("#productNotFound");
    const toast = document.querySelector("#toastMessage");
    if (!source || !form || !notFound) return;

    const records = [...source.querySelectorAll("[data-id]")].map((element) => {
        const record = { ...element.dataset };
        for (const [key, value] of Object.entries(record)) {
            if (value === "true") record[key] = true;
            else if (value === "false") record[key] = false;
        }
        return record;
    });
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
    setValue("address", record.address || "");
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
    document.querySelector("#summaryAddress").textContent = form.elements.address.value || "Theo địa chỉ dự án";
    document.querySelector("#summaryArea").textContent = record.area ? `${record.area} m²` : "—";
    document.querySelector("#summaryPrice").textContent = record.price ? `${record.price.replace(".", ",")} tỷ` : "—";
    document.querySelector("[data-floor-field]").hidden = !record.floor;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", { detail: { form, values: new FormData(form) } }));
        if (toast) {
            toast.textContent = "Biểu mẫu đã sẵn sàng để kết nối backend.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
        }
    });
})();
