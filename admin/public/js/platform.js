(() => {
    const modal = document.querySelector("#tenantModal");
    const form = document.querySelector("#tenantForm");
    const tbody = document.querySelector("#tenantTableBody");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !tbody) return;

    const storageKey = "landiform.admin.tenants.v1";
    let tenants = [];
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) tenants = saved;
    } catch {
        tenants = [];
    }
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    function renderTenant(tenant) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = "screen-entity-icon blue";
        const symbol = document.createElement("i");
        symbol.className = "fa-solid fa-building-user";
        symbol.setAttribute("aria-hidden", "true");
        icon.append(symbol);
        const details = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = tenant.name;
        const meta = document.createElement("small");
        meta.textContent = `${tenant.code} · ${tenant.region}`;
        details.append(name, meta);
        entity.append(icon, details);
        nameCell.append(entity);
        row.append(nameCell);
        [tenant.plan, "0", "0%", tenant.created].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        const status = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "screen-badge amber";
        badge.textContent = "Chuẩn bị thiết lập";
        status.append(badge);
        row.append(status);
        tbody.prepend(row);
    }

    function updateTotal() {
        const summary = document.querySelector(".screen-stats .screen-stat small");
        if (summary) summary.textContent = `Tổng ${42 + tenants.length} doanh nghiệp`;
    }

    tenants.slice().reverse().forEach(renderTenant);
    updateTotal();
    document.querySelector("[data-tenant-open]")?.addEventListener("click", () => {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    });
    document.querySelectorAll("[data-tenant-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const tenant = {
            code: `tenant_${Date.now().toString().slice(-6)}`,
            name: form.elements.name.value.trim(),
            contact: form.elements.contact.value.trim(),
            email: form.elements.email.value.trim(),
            plan: form.elements.plan.value,
            region: form.elements.region.value.trim(),
            domain: form.elements.domain.value.trim(),
            created: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
        };
        tenants.push(tenant);
        try {
            void 0;
        } catch {
            tenants.pop();
            notify("Không thể lưu doanh nghiệp trên trình duyệt này.");
            return;
        }
        renderTenant(tenant);
        updateTotal();
        close();
        notify("Đã thêm doanh nghiệp vào danh sách.");
    });
})();

