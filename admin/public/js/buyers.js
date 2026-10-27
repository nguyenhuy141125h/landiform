(() => {
    const modal = document.querySelector("#buyerModal");
    const form = document.querySelector("#buyerForm");
    const tbody = document.querySelector("#buyerTableBody");
    if (!modal || !form || !tbody) return;

    const storageKey = "landiform.admin.buyers.v1";
    const projectKey = "landiform.admin.projects.v1";
    const seeds = [
        { id: "buyer-00184", code: "KH-00184", leadId: "yen", projectCode: "CP-008", productId: "unit-cp-b1-0803", name: "Lê Hoàng Yến", phone: "0987 332 104", project: "Central Park Towers", unit: "B1 · 08.03", handover: "2026-12-15", documents: "Đủ hồ sơ", updated: "20/10" },
        { id: "buyer-00179", code: "KH-00179", leadId: "dat", projectCode: "AP-026", productId: "unit-ap-a2-1506", name: "Võ Thành Đạt", phone: "0903 123 179", project: "An Phú Riverside", unit: "A2 · 15.06", handover: "2026-12-22", documents: "Đang bổ sung", updated: "19/10" },
        { id: "buyer-00168", code: "KH-00168", leadId: "ha", projectCode: "GV-014", productId: "unit-gv-n08-05", name: "Nguyễn Thu Hà", phone: "0903 123 168", project: "Green Valley", unit: "N08 · 05", handover: "2027-01-10", documents: "Đủ hồ sơ", updated: "16/10" },
    ];
    const demoBuyerActivities = {
        "buyer-00184": [
            { type: "Đăng ký", note: "Quét mã QR tại sự kiện Central Park.", at: "19/10/2026 · 09:30" },
            { type: "Tham quan", note: "Đã tham quan và chọn mua sản phẩm B1 · 08.03.", at: "20/10/2026 · 14:10" },
            { type: "Giao dịch", note: "Ghi nhận giao dịch thành công; hồ sơ đủ, chờ bàn giao.", at: "20/10/2026 · 16:00" },
        ],
        "buyer-00179": [
            { type: "Cuộc gọi", note: "Tư vấn phương án thanh toán và hướng dẫn chuẩn bị giấy tờ.", at: "18/10/2026 · 15:20" },
            { type: "Giao dịch", note: "Đã ghi nhận mua sản phẩm A2 · 15.06; còn thiếu giấy tờ.", at: "19/10/2026 · 11:00" },
        ],
        "buyer-00168": [
            { type: "Tham quan", note: "Đã xem nhà mẫu Green Valley và chọn nhà phố N08 · 05.", at: "15/10/2026 · 10:00" },
            { type: "Giao dịch", note: "Ghi nhận giao dịch mua nhà phố; hồ sơ đã đủ.", at: "16/10/2026 · 09:45" },
        ],
    };
    const buyerOwners = { "buyer-00184": "Mai Ngọc", "buyer-00179": "Trần Thanh Long", "buyer-00168": "Quỳnh Dao" };
    seeds.forEach((buyer) => { buyer.activities = demoBuyerActivities[buyer.id] || []; buyer.owner = buyerOwners[buyer.id] || ""; });
    const toast = document.querySelector("#toastMessage");
    const search = document.querySelector("#buyerSearch");
    const projectFilter = document.querySelector("#buyerProjectFilter");
    const documentFilter = document.querySelector("#buyerDocumentFilter");
    const emptyState = document.querySelector("#buyerEmptyState");
    const unitSuggestions = document.querySelector("#buyerUnitSuggestions");
    const deleteButton = document.querySelector("#buyerDelete");
    let editingId = null;
    let toastTimer;
    let buyers = loadBuyers();

    function loadBuyers() {
        try {
            const stored = JSON.parse(null || "null");
            if ([2, 3, 4].includes(stored?.version) && Array.isArray(stored.items)) {
                const examples = new Map(seeds.map((buyer) => [buyer.id, buyer]));
                if (stored.version === 4) return stored.items.map((buyer) => {
                    const example = examples.get(buyer?.id);
                    if (!example) return buyer;
                    return { ...example, ...buyer, activities: Array.isArray(buyer.activities) ? buyer.activities : example.activities, owner: buyer.owner || example.owner };
                });
                const migrated = stored.items.map((buyer) => {
                    const example = examples.get(buyer?.id);
                    return example ? { ...buyer, leadId: example.leadId, projectCode: example.projectCode, productId: example.productId, unit: example.unit, project: example.project } : buyer;
                });
                void 0;
                return migrated;
            }
            if (Array.isArray(stored)) {
                const normalized = stored.map((buyer, index) => ({ ...buyer, id: buyer.id || buyer.code || `legacy-buyer-${index}` }));
                const existing = new Map(normalized.map((buyer) => [buyer.id, buyer]));
                const migrated = [...seeds.map((buyer) => ({ ...(existing.get(buyer.id) || {}), ...buyer })), ...normalized.filter((buyer) => !seeds.some((seed) => seed.id === buyer.id))];
                void 0;
                return migrated;
            }
        } catch {
            // Keep the built-in records available when browser storage is unavailable.
        }
        const defaults = seeds.map((buyer) => ({ ...buyer }));
        try { void 0; }
        catch { /* Keep examples in memory if browser storage is unavailable. */ }
        return defaults;
    }

    function saveBuyers(next) {
        try {
            void 0;
            return true;
        } catch {
            notify("Không thể lưu hồ sơ trên trình duyệt này.");
            return false;
        }
    }

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function projectNames() {
        const names = ["An Phú Riverside", "Green Valley", "Central Park Towers", "Lumière Garden"];
        try {
            const stored = JSON.parse(null || "[]");
            if (Array.isArray(stored)) stored.forEach((project) => {
                if (project.name && !names.includes(project.name)) names.push(project.name);
            });
        } catch {
            // Static project names remain available.
        }
        return names;
    }

    function syncProjectOptions() {
        projectNames().forEach((name) => {
            if (![...form.elements.project.options].some((option) => option.value === name)) form.elements.project.add(new Option(name, name));
            if (projectFilter && ![...projectFilter.options].some((option) => option.value === name)) projectFilter.add(new Option(name, name));
        });
    }

    function syncUnitSuggestions() {
        if (!unitSuggestions || !window.LandiformInventory) return;
        const selectedProject = form.elements.project.value;
        const codeByName = new Map();
        try {
            const saved = JSON.parse(null || "[]");
            if (Array.isArray(saved)) saved.forEach((project) => codeByName.set(project.name, project.code));
        } catch {
            // Built-in project/product suggestions remain available.
        }
        const builtInCodes = { "An Phú Riverside": "AP-026", "Green Valley": "GV-014", "Central Park Towers": "CP-008", "Lumière Garden": "LG-031" };
        const selectedCode = codeByName.get(selectedProject) || builtInCodes[selectedProject];
        unitSuggestions.replaceChildren();
        window.LandiformInventory.all().filter((unit) => !selectedCode || unit.projectCode === selectedCode).forEach((unit) => {
            const option = document.createElement("option");
            option.value = unit.code;
            option.label = `${unit.type} · ${unit.area} m² · ${unit.status}`;
            unitSuggestions.append(option);
        });
    }

    function dateLabel(value) {
        const date = new Date(`${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? "Chưa xác định" : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
    }

    function dateDistance(value) {
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((date - today) / 86400000);
    }

    function actionButton(label, icon, action, tone = "") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `buyer-row-action ${tone}`.trim();
        button.dataset[action] = "";
        button.setAttribute("aria-label", `${label} ${action === "buyerEdit" ? "hồ sơ" : "người mua"}`);
        button.title = label;
        const symbol = document.createElement("i");
        symbol.className = `fa-solid ${icon}`;
        symbol.setAttribute("aria-hidden", "true");
        button.append(symbol);
        return button;
    }

    function renderBuyer(buyer) {
        const row = document.createElement("tr");
        row.dataset.buyerId = buyer.id;
        const personCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = "screen-entity-icon blue";
        const symbol = document.createElement("i");
        symbol.className = "fa-solid fa-user";
        symbol.setAttribute("aria-hidden", "true");
        icon.append(symbol);
        const details = document.createElement("span");
        const name = document.createElement("strong");
        if (buyer.leadId) {
            const leadLink = document.createElement("a");
            leadLink.className = "customer-link";
            leadLink.href = `customer-detail.html?id=${encodeURIComponent(buyer.leadId)}`;
            leadLink.textContent = buyer.name;
            name.append(leadLink);
        } else {
            name.textContent = buyer.name;
        }
        const meta = document.createElement("small");
        meta.textContent = `${buyer.code} · ${buyer.phone || "Chưa có số điện thoại"}`;
        details.append(name, meta);
        entity.append(icon, details);
        personCell.append(entity);
        row.append(personCell);
        for (const value of [buyer.unit, buyer.project, dateLabel(buyer.handover)]) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        }
        const documentCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `screen-badge ${buyer.documents === "Đủ hồ sơ" ? "green" : "amber"}`;
        badge.textContent = buyer.documents;
        documentCell.append(badge);
        row.append(documentCell);
        const actions = document.createElement("td");
        const actionGroup = document.createElement("div");
        actionGroup.className = "buyer-row-actions";
        const editLink = document.createElement("a");
        editLink.className = "buyer-row-action";
        const editParams = new URLSearchParams({
            type: "buyer", id: buyer.id, code: buyer.code || "", name: buyer.name || "",
            phone: buyer.phone || "", project: buyer.project || "", product: buyer.unit || "",
            handover: buyer.handover || "", documents: buyer.documents || "",
        });
        editLink.href = `record-detail.html?${editParams.toString()}`;
        editLink.setAttribute("aria-label", `Chỉnh sửa hồ sơ người mua ${buyer.name}`);
        editLink.title = "Chỉnh sửa hồ sơ";
        const editIcon = document.createElement("i");
        editIcon.className = "fa-solid fa-pen";
        editIcon.setAttribute("aria-hidden", "true");
        editLink.append(editIcon);
        actionGroup.append(editLink, actionButton("Xóa", "fa-trash-can", "buyerDelete", "is-danger"));
        actionGroup.prepend(actionButton("Xem giao dịch và hoạt động", "fa-clock-rotate-left", "buyerView"));
        actions.append(actionGroup);
        row.append(actions);
        tbody.append(row);
    }

    function updateSummary() {
        const total = buyers.length;
        const complete = buyers.filter((buyer) => buyer.documents === "Đủ hồ sơ").length;
        const dueSoon = (windowDays) => buyers.filter((buyer) => {
            const days = dateDistance(buyer.handover);
            return days >= 0 && days <= windowDays;
        }).length;
        document.querySelector("#buyerTotal").textContent = String(total);
        document.querySelector("#buyerDueSoon").textContent = String(dueSoon(90));
        document.querySelector("#buyerDocsComplete").textContent = `${total ? Math.round(complete / total * 100) : 0}%`;
        document.querySelector("#buyerDocsCaption").textContent = `${complete} / ${total} hồ sơ hoàn tất`;
        document.querySelector("#buyerDocsMissing").textContent = String(total - complete);
        document.querySelectorAll("[data-handover-window]").forEach((node) => {
            node.textContent = String(dueSoon(Number(node.dataset.handoverWindow)));
        });
    }

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const project = projectFilter?.value || "";
        const documentStatus = documentFilter?.value || "";
        let visible = 0;
        tbody.querySelectorAll("tr").forEach((row) => {
            const buyer = buyers.find((item) => item.id === row.dataset.buyerId);
            if (!buyer) return;
            const matches = (!query || `${buyer.name} ${buyer.code} ${buyer.phone} ${buyer.unit}`.toLocaleLowerCase("vi").includes(query))
                && (!project || buyer.project === project)
                && (!documentStatus || buyer.documents === documentStatus);
            row.hidden = !matches;
            if (matches) visible += 1;
        });
        if (emptyState) emptyState.hidden = visible > 0;
    }

    function openBuyerDetails(buyer) {
        const detailModal = document.querySelector("#buyerDetailModal");
        const summary = document.querySelector("#buyerDetailSummary");
        const productBox = document.querySelector("#buyerDetailProduct");
        const timeline = document.querySelector("#buyerDetailTimeline");
        const inventoryItem = window.LandiformInventory?.all().find((item) => item.id === buyer.productId || item.code === buyer.unit);
        document.querySelector("#buyerDetailTitle").textContent = buyer.name;
        summary.replaceChildren();
        [["Mã hồ sơ", buyer.code], ["Số điện thoại", buyer.phone || "Chưa cập nhật"], ["Dự án", buyer.project], ["Nhân viên phụ trách", buyer.owner || "Chưa phân công"]].forEach(([label, value]) => {
            const item = document.createElement("div");
            const caption = document.createElement("small");
            caption.textContent = label;
            const content = document.createElement("strong");
            content.textContent = value;
            item.append(caption, content);
            summary.append(item);
        });
        productBox.replaceChildren();
        const productFacts = [
            ["Mã sản phẩm", inventoryItem?.code || buyer.unit],
            ["Loại hình", inventoryItem?.type || "Chưa cập nhật"],
            ["Diện tích", inventoryItem?.area ? `${inventoryItem.area} m²` : "Chưa cập nhật"],
            ["Giá tham khảo", inventoryItem?.price ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(inventoryItem.price)} tỷ` : "Chưa cập nhật"],
            ["Tình trạng hồ sơ", buyer.documents],
            ["Dự kiến bàn giao", dateLabel(buyer.handover)],
        ];
        productFacts.forEach(([label, value]) => {
            const item = document.createElement("div");
            const caption = document.createElement("small");
            caption.textContent = label;
            const content = document.createElement("strong");
            content.textContent = value;
            item.append(caption, content);
            productBox.append(item);
        });

        const events = [...(buyer.activities || [])];
        if (buyer.leadId) {
            try {
                const leads = JSON.parse(null || "[]");
                const lead = Array.isArray(leads) ? leads.find((item) => item.id === buyer.leadId) : null;
                if (Array.isArray(lead?.activities)) events.push(...lead.activities);
                const savedCustomer = JSON.parse(null || "{}");
                if (Array.isArray(savedCustomer.activities)) events.push(...savedCustomer.activities);
            } catch { /* A buyer can have a history even without a linked CRM record. */ }
            try {
                (window.LandiformAppointments?.all() || []).filter((appointment) => appointment.customer === buyer.leadId).forEach((appointment) => {
                    events.push({ type: appointment.type, note: `${appointment.status} · ${appointment.place || "Chưa ghi địa điểm"} · Phụ trách: ${appointment.assignee || "Chưa phân công"}`, at: new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.start)) });
                });
            } catch { /* Appointment history is optional for imported buyer records. */ }
        }
        const uniqueEvents = [...new Map(events.map((event) => [`${event.type}|${event.at}|${event.note}`, event])).values()];
        timeline.replaceChildren();
        if (!uniqueEvents.length) {
            const empty = document.createElement("li");
            empty.className = "buyer-history-empty";
            empty.textContent = "Chưa có hoạt động được ghi nhận cho hồ sơ này.";
            timeline.append(empty);
        } else {
            uniqueEvents.forEach((activity) => {
                const item = document.createElement("li");
                const mark = document.createElement("span");
                mark.className = "buyer-history-mark";
                const body = document.createElement("div");
                const title = document.createElement("strong");
                title.textContent = activity.type || "Hoạt động";
                const note = document.createElement("p");
                note.textContent = activity.note || "";
                const time = document.createElement("time");
                time.textContent = activity.at || "Chưa rõ thời điểm";
                body.append(title, note, time);
                item.append(mark, body);
                timeline.append(item);
            });
        }
        const customerLink = document.querySelector("#buyerCustomerLink");
        customerLink.href = buyer.leadId ? `customer-detail.html?id=${encodeURIComponent(buyer.leadId)}` : "leads.html";
        detailModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function refresh() {
        tbody.replaceChildren();
        buyers.forEach(renderBuyer);
        updateSummary();
        applyFilters();
    }

    function openBuyer(buyer = null) {
        editingId = buyer?.id || null;
        form.reset();
        syncProjectOptions();
        if (buyer) {
            form.elements.name.value = buyer.name;
            form.elements.phone.value = buyer.phone || "";
            form.elements.project.value = buyer.project;
            form.elements.unit.value = buyer.unit;
            form.elements.handover.value = buyer.handover;
            form.elements.documents.value = buyer.documents;
        }
        syncUnitSuggestions();
        document.querySelector("#buyerModalTitle").textContent = buyer ? `Chỉnh sửa ${buyer.name}` : "Thêm hồ sơ người mua";
        document.querySelector("#buyerSave").textContent = buyer ? "Lưu thay đổi" : "Lưu hồ sơ";
        deleteButton.hidden = !buyer;
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        editingId = null;
        deleteButton.hidden = true;
    }

    syncProjectOptions();
    syncUnitSuggestions();
    refresh();
    form.elements.project.addEventListener("change", syncUnitSuggestions);
    document.querySelector("[data-buyer-open]")?.addEventListener("click", () => openBuyer());
    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr[data-buyer-id]");
        const buyer = buyers.find((item) => item.id === row?.dataset.buyerId);
        if (!buyer) return;
        if (event.target.closest("[data-buyer-view]")) { openBuyerDetails(buyer); return; }
        if (event.target.closest("[data-buyer-edit]")) openBuyer(buyer);
        if (event.target.closest("[data-buyer-delete]")) {
            if (!window.confirm(`Xóa hồ sơ của ${buyer.name}?`)) return;
            const next = buyers.filter((item) => item.id !== buyer.id);
            if (!saveBuyers(next)) return;
            buyers = next;
            refresh();
            notify("Đã xóa hồ sơ người mua.");
        }
    });
    document.querySelectorAll("[data-buyer-close]").forEach((button) => button.addEventListener("click", close));
    const buyerDetailModal = document.querySelector("#buyerDetailModal");
    document.querySelectorAll("[data-buyer-detail-close]").forEach((button) => button.addEventListener("click", () => {
        buyerDetailModal.hidden = true;
        document.body.classList.remove("modal-open");
    }));
    buyerDetailModal?.addEventListener("click", (event) => {
        if (event.target === buyerDetailModal) {
            buyerDetailModal.hidden = true;
            document.body.classList.remove("modal-open");
        }
    });
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!modal.hidden) close();
        if (buyerDetailModal && !buyerDetailModal.hidden) {
            buyerDetailModal.hidden = true;
            document.body.classList.remove("modal-open");
        }
    });
    [search, projectFilter, documentFilter].forEach((control) => {
        control?.addEventListener(control === search ? "input" : "change", applyFilters);
    });
    deleteButton.addEventListener("click", () => {
        const buyer = buyers.find((item) => item.id === editingId);
        if (!buyer || !window.confirm(`Xóa hồ sơ của ${buyer.name}?`)) return;
        const next = buyers.filter((item) => item.id !== buyer.id);
        if (!saveBuyers(next)) return;
        buyers = next;
        refresh();
        close();
        notify("Đã xóa hồ sơ người mua.");
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const current = buyers.find((item) => item.id === editingId);
        const buyer = {
            ...(current || {}),
            id: current?.id || `buyer-${Date.now()}`,
            code: current?.code || `KH-${Date.now().toString().slice(-6)}`,
            name: form.elements.name.value.trim(),
            phone: form.elements.phone.value.trim(),
            project: form.elements.project.value,
            unit: form.elements.unit.value.trim(),
            handover: form.elements.handover.value,
            documents: form.elements.documents.value,
            updated: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date()),
        };
        const next = current ? buyers.map((item) => item.id === current.id ? buyer : item) : [...buyers, buyer];
        if (!saveBuyers(next)) return;
        buyers = next;
        refresh();
        close();
        notify(current ? "Đã cập nhật hồ sơ người mua." : "Đã thêm hồ sơ người mua.");
    });
})();

