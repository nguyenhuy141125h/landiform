(() => {
    const modal = document.querySelector("#bookingModal");
    const form = document.querySelector("#bookingForm");
    const tbody = document.querySelector("#bookingRequests");
    const toast = document.querySelector("#toastMessage");
    const inventory = window.LandiformInventory;
    if (!modal || !form || !tbody || !inventory) return;

    const storageKey = "landiform.admin.bookings.v1";
    const statusKey = "landiform.admin.booking-status.v1";
    const auditKey = "landiform.admin.booking-audit.v1";
    const projectNames = { "AP-026": "An Phú Riverside", "GV-014": "Green Valley", "CP-008": "Central Park Towers", "LG-031": "Lumière Garden" };
    const customerRefs = {
        anh: { name: "Nguyễn Ngọc Anh", projectCode: "AP-026" },
        khoa: { name: "Trần Minh Khoa", projectCode: "GV-014" },
        yen: { name: "Lê Hoàng Yến", projectCode: "CP-008" },
        bao: { name: "Phạm Quốc Bảo", projectCode: "AP-026" },
        nam: { name: "Võ Hoàng Nam", projectCode: "GV-014" },
        dat: { name: "Võ Thành Đạt", projectCode: "AP-026" },
        ha: { name: "Nguyễn Thu Hà", projectCode: "GV-014" },
    };
    const seedCode = "BK-2026-084";
    let requests = [];
    let statuses = {};
    let audit = [];
    let toastTimer;

    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) requests = saved.map((item) => ({
            ...item,
            createdAt: item.createdAt || item.created || new Date().toISOString(),
            createdBy: item.createdBy || "Minh Anh",
            assignee: item.assignee || "Chưa phân công",
        }));
    } catch { requests = []; }
    try {
        const saved = JSON.parse(null || "{}");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) statuses = saved;
    } catch { statuses = {}; }
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) audit = saved;
    } catch { audit = []; }

    const projectFilter = document.querySelector("[data-booking-filter]");
    const assigneeFilter = document.querySelector("[data-booking-assignee-filter]");
    const dateFrom = document.querySelector("[data-booking-date-from]");
    const dateTo = document.querySelector("[data-booking-date-to]");
    const alertButton = document.querySelector("[data-booking-alert-toggle]");
    const alertCount = document.querySelector("[data-booking-alert-count]");
    const alertPanel = document.querySelector("[data-booking-alert-panel]");
    const alertList = document.querySelector("[data-booking-alert-list]");
    const auditBody = document.querySelector("[data-booking-audit]");
    const auditCount = document.querySelector("[data-booking-audit-count]");
    const auditModal = document.querySelector("#bookingAuditModal");
    const auditTimeline = document.querySelector("[data-booking-audit-timeline]");
    let toastTimerId;

    function actorName() {
        return document.querySelector(".account-copy strong")?.textContent.trim() || "Quản trị viên";
    }

    function writeJson(key, value) {
        try { void 0; return true; }
        catch { return false; }
    }

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimerId);
        toastTimerId = setTimeout(() => toast.classList.remove("is-visible"), 3600);
    }

    function formatDate(value, options = {}) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            ...(options.time ? { hour: "2-digit", minute: "2-digit" } : {}),
        }).format(date);
    }

    function currentStatus(code) {
        return statuses[code] || "Chờ duyệt";
    }

    function seedRecord() {
        const row = tbody.querySelector(`[data-booking-code="${seedCode}"]`);
        if (!row) return null;
        return {
            code: seedCode,
            customerId: row.dataset.customerId || "anh",
            customer: row.cells[1]?.textContent.trim() || "Nguyễn Ngọc Anh",
            product: row.cells[2]?.textContent.trim() || "A2 · 12.08",
            project: row.cells[3]?.textContent.trim() || "An Phú Riverside",
            projectCode: "AP-026",
            productId: row.dataset.productId || "unit-ap-a2-1208",
            assignee: row.cells[4]?.textContent.trim() || "Trần Thanh Long",
            assigneeId: row.dataset.assigneeId || "staff-long",
            deadline: row.dataset.bookingDeadline,
            createdAt: row.dataset.bookingCreated || "2026-10-22T09:15:00",
            createdBy: "Minh Anh",
        };
    }

    function allRecords() {
        const seed = seedRecord();
        return [...(seed ? [seed] : []), ...requests];
    }

    function logAction(record, action, previousStatus, nextStatus, actor = actorName()) {
        audit.unshift({
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            code: record.code,
            customer: record.customer,
            product: record.product,
            project: record.project,
            assignee: record.assignee,
            action,
            previousStatus,
            status: nextStatus,
            actor,
            at: new Date().toISOString(),
        });
        audit = audit.slice(0, 500);
        writeJson(auditKey, audit);
    }

    function updateInventoryFor(record, expectedStatus, nextStatus) {
        const currentUnits = inventory.all();
        const unit = currentUnits.find((item) => item.id === record.productId) || currentUnits.find((item) =>
            item.code === record.product && item.project === record.project
        );
        if (!unit) return { ok: false, reason: "missing" };
        if (expectedStatus && unit.status !== expectedStatus) return { ok: false, reason: "changed" };
        const replaced = inventory.replace(currentUnits.map((item) => item.id === unit.id ? { ...item, status: nextStatus } : item));
        return { ok: replaced, units: currentUnits, unit, reason: replaced ? "" : "storage" };
    }

    function statusClass(status) {
        if (status === "Đã giữ chỗ") return "reserved";
        if (status === "Chờ duyệt") return "amber";
        if (status === "Hết hạn") return "red";
        if (status === "Từ chối" || status === "Đã giải phóng") return "neutral";
        return "blue";
    }

    function renderBookingActions(row, status) {
        const actionCell = row.cells[7];
        const badgeCell = row.cells[6];
        if (!badgeCell || !actionCell) return;
        const badge = document.createElement("span");
        badge.className = `screen-badge ${statusClass(status)}`;
        badge.textContent = status;
        badgeCell.replaceChildren(badge);
        actionCell.replaceChildren();
        const actions = document.createElement("div");
        actions.className = "booking-row-actions";
        const choices = status === "Chờ duyệt"
            ? [["Duyệt", "Đã giữ chỗ", "approve"], ["Từ chối", "Từ chối", "reject"]]
            : status === "Đã giữ chỗ" ? [["Giải phóng", "Đã giải phóng", "release"]] : [];
        choices.forEach(([label, result, className]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.dataset.bookingStatus = result;
            button.textContent = label;
            actions.append(button);
        });
        const history = document.createElement("button");
        history.type = "button";
        history.className = "history";
        history.dataset.bookingHistory = row.dataset.bookingCode;
        history.textContent = "Lịch sử";
        actions.append(history);
        actionCell.append(actions);
    }

    function renderRow(record) {
        const row = document.createElement("tr");
        row.id = `booking-${record.code}`;
        row.dataset.bookingCode = record.code;
        row.dataset.bookingDeadline = record.deadline || "";
        row.dataset.bookingCreated = record.createdAt || "";
        [record.code, record.customer, record.product, record.project, record.assignee || "Chưa phân công", formatDate(record.deadline, { time: true })].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });
        row.append(document.createElement("td"), document.createElement("td"));
        renderBookingActions(row, currentStatus(record.code));
        tbody.append(row);
        return row;
    }

    function renderAllRows() {
        const records = allRecords().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        tbody.replaceChildren();
        records.forEach((record) => renderRow(record));
        applyBookingFilters();
    }

    function updateSummary() {
        const records = allRecords().map((item) => ({ ...item, status: currentStatus(item.code) }));
        const count = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = String(value);
        };
        count("#bookingPendingCount", records.filter((item) => item.status === "Chờ duyệt").length);
        count("#bookingHeldCount", records.filter((item) => item.status === "Đã giữ chỗ").length);
        count("#bookingReleasedCount", records.filter((item) => ["Từ chối", "Đã giải phóng", "Hết hạn"].includes(item.status)).length);
        const now = Date.now();
        count("#bookingExpiringCount", records.filter((item) => {
            const hours = (new Date(item.deadline).getTime() - now) / 3600000;
            return item.status === "Đã giữ chỗ" && hours >= 0 && hours <= 72;
        }).length);
    }

    function matchesFilters(record) {
        const project = projectFilter?.value || "";
        const assignee = assigneeFilter?.value || "";
        const deadlineDate = (record.deadline || "").slice(0, 10);
        return (!project || record.project === project)
            && (!assignee || record.assignee === assignee)
            && (!dateFrom?.value || deadlineDate >= dateFrom.value)
            && (!dateTo?.value || deadlineDate <= dateTo.value);
    }

    function applyBookingFilters() {
        const records = new Map(allRecords().map((record) => [record.code, record]));
        let visible = 0;
        tbody.querySelectorAll("tr[data-booking-code]").forEach((row) => {
            const record = records.get(row.dataset.bookingCode);
            row.hidden = !record || !matchesFilters(record);
            if (!row.hidden) visible += 1;
        });
        const result = document.querySelector("[data-booking-filter-result]");
        if (result) result.textContent = `Đang hiển thị ${visible}/${records.size} yêu cầu`;
        renderAudit();
    }

    function fillAssignees() {
        if (!assigneeFilter) return;
        let staff = [];
        try {
            const saved = JSON.parse(null || "[]");
            if (Array.isArray(saved)) staff.push(...saved.filter((person) => person.accountType !== "customer" && person.status !== "Tạm ngưng").map((person) => person.name).filter(Boolean));
        } catch { /* Keep past assignments available from reservation records. */ }
        staff.push(...allRecords().map((record) => record.assignee).filter((name) => name && name !== "Chưa phân công"));
        const selected = assigneeFilter.value;
        const names = [...new Set(staff)];
        assigneeFilter.replaceChildren(new Option("Tất cả nhân viên", ""));
        names.forEach((name) => assigneeFilter.add(new Option(name, name)));
        if (names.includes(selected)) assigneeFilter.value = selected;
    }

    function fmtAction(item) {
        return item.action || item.status || "Cập nhật";
    }

    function renderAudit() {
        if (!auditBody) return;
        const filtered = audit.filter((item) => {
            const record = allRecords().find((entry) => entry.code === item.code);
            return !record || matchesFilters(record);
        }).slice(0, 12);
        if (auditCount) auditCount.textContent = `${filtered.length} thao tác`;
        auditBody.replaceChildren();
        if (!filtered.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = "Chưa có thao tác được ghi nhận trong phạm vi lọc.";
            row.append(cell);
            auditBody.append(row);
            return;
        }
        filtered.forEach((item) => {
            const row = document.createElement("tr");
            [formatDate(item.at, { time: true }), item.code, `${item.product || "Sản phẩm"} · ${item.project || "Dự án"}`, fmtAction(item), item.actor || "Quản trị viên"].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.append(cell);
            });
            auditBody.append(row);
        });
    }

    function openAudit(code) {
        if (!auditModal || !auditTimeline) return;
        const record = allRecords().find((item) => item.code === code);
        const entries = audit.filter((item) => item.code === code);
        document.querySelector("#bookingAuditTitle").textContent = `Lịch sử ${code}`;
        document.querySelector("[data-booking-audit-subtitle]").textContent = `${record?.customer || "Khách hàng"} · ${record?.product || "Sản phẩm"} · ${record?.project || "Dự án"}`;
        auditTimeline.replaceChildren();
        const creation = document.createElement("li");
        creation.className = "booking-audit-entry is-created";
        const createdDate = record?.createdAt || new Date().toISOString();
        creation.innerHTML = "";
        const createdTitle = document.createElement("strong");
        createdTitle.textContent = "Tạo yêu cầu";
        const createdMeta = document.createElement("span");
        createdMeta.textContent = `${record?.createdBy || "Minh Anh"} · ${formatDate(createdDate, { time: true })}`;
        creation.append(createdTitle, createdMeta);
        auditTimeline.append(creation);
        entries.slice().reverse().forEach((item) => {
            const entry = document.createElement("li");
            entry.className = "booking-audit-entry";
            const title = document.createElement("strong");
            title.textContent = fmtAction(item);
            const meta = document.createElement("span");
            meta.textContent = `${item.actor || "Quản trị viên"} · ${formatDate(item.at, { time: true })}`;
            const status = document.createElement("small");
            status.textContent = `${item.previousStatus || "Mới"} → ${item.status || "Đã cập nhật"}`;
            entry.append(title, meta, status);
            auditTimeline.append(entry);
        });
        auditModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeAudit() {
        if (!auditModal) return;
        auditModal.hidden = true;
        if (!document.querySelector(".modal-backdrop:not([hidden])")) document.body.classList.remove("modal-open");
    }

    function refreshAlertPanel() {
        if (!alertList || !alertCount) return;
        const now = Date.now();
        const alerts = allRecords().flatMap((record) => {
            const status = currentStatus(record.code);
            const hours = (new Date(record.deadline).getTime() - now) / 3600000;
            if (status === "Chờ duyệt") return [{ record, kind: "pending", text: "Đang chờ duyệt", detail: `Phụ trách: ${record.assignee || "Chưa phân công"} · Hạn ${formatDate(record.deadline, { time: true })}` }];
            if (status === "Đã giữ chỗ" && hours <= 72 && hours >= 0) return [{ record, kind: "expiring", text: hours <= 24 ? "Sắp hết hạn trong 24 giờ" : "Sắp hết hạn trong 3 ngày", detail: `Phụ trách: ${record.assignee || "Chưa phân công"} · Hạn ${formatDate(record.deadline, { time: true })}` }];
            return [];
        });
        alertCount.hidden = alerts.length === 0;
        alertCount.textContent = alerts.length > 99 ? "99+" : String(alerts.length);
        alertButton?.setAttribute("aria-label", alerts.length ? `${alerts.length} cảnh báo giữ chỗ cần xem` : "Không có cảnh báo giữ chỗ");
        alertList.replaceChildren();
        const summary = document.querySelector("[data-booking-alert-summary]");
        if (summary) summary.textContent = alerts.length ? `${alerts.length} yêu cầu cần theo dõi` : "Hiện không có yêu cầu chờ xử lý hoặc sắp hết hạn.";
        if (!alerts.length) {
            const empty = document.createElement("p");
            empty.className = "booking-alert-empty";
            empty.textContent = "Mọi yêu cầu đều đang trong thời hạn.";
            alertList.append(empty);
            return;
        }
        alerts.forEach(({ record, kind, text, detail }) => {
            const item = document.createElement("a");
            item.className = `booking-alert-item ${kind}`;
            item.href = `#booking-${record.code}`;
            const icon = document.createElement("i");
            icon.className = kind === "pending" ? "fa-solid fa-hourglass-half" : "fa-solid fa-clock";
            icon.setAttribute("aria-hidden", "true");
            const copy = document.createElement("span");
            const title = document.createElement("strong");
            title.textContent = `${record.code} · ${record.customer} · ${text}`;
            const meta = document.createElement("small");
            meta.textContent = detail;
            copy.append(title, meta);
            item.append(icon, copy);
            alertList.append(item);
        });
    }

    function expireOverdue() {
        const now = Date.now();
        let expired = 0;
        allRecords().forEach((record) => {
            const status = currentStatus(record.code);
            const deadline = new Date(record.deadline).getTime();
            if (!["Chờ duyệt", "Đã giữ chỗ"].includes(status) || !Number.isFinite(deadline) || deadline > now) return;
            const currentUnits = inventory.all();
            const unit = currentUnits.find((item) => item.id === record.productId) || currentUnits.find((item) => item.code === record.product && item.project === record.project);
            if (unit && ["Đang giữ chỗ", "Chờ duyệt"].includes(unit.status)) {
                const replaced = inventory.replace(currentUnits.map((item) => item.id === unit.id ? { ...item, status: "Còn bán" } : item));
                if (!replaced) return;
            }
            const previous = status;
            statuses[record.code] = "Hết hạn";
            if (!writeJson(statusKey, statuses)) {
                statuses[record.code] = previous;
                if (unit) inventory.replace(currentUnits);
                return;
            }
            logAction(record, "Tự động giải phóng do quá hạn", previous, "Hết hạn", "LANDIFORM · Tự động");
            expired += 1;
        });
        if (expired) {
            renderAllRows();
            updateSummary();
            notify(`${expired} yêu cầu quá hạn đã được tự động giải phóng về trạng thái còn bán.`);
        }
        return expired;
    }

    function closeForm() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        form.elements.deadline.setCustomValidity("");
        form.elements.product.setCustomValidity("");
    }

    function filterProducts(preserveSelection = false) {
        const projectCode = form.elements.project.value;
        const productSelect = form.elements.product;
        const selected = preserveSelection ? productSelect.value : "";
        const available = inventory.all().filter((unit) => unit.projectCode === projectCode && unit.status === "Còn bán");
        productSelect.replaceChildren(new Option(available.length ? "Chọn căn / sản phẩm" : "Chưa có sản phẩm còn bán", ""));
        available.forEach((unit) => productSelect.add(new Option(`${unit.code} · ${unit.type} · ${unit.area} m²`, unit.id)));
        if (available.some((unit) => unit.id === selected)) productSelect.value = selected;
    }

    function populateFormData() {
        if (requests.length) writeJson(storageKey, requests);
        try {
            const projects = JSON.parse(null || "[]");
            if (Array.isArray(projects)) projects.forEach((project) => {
                if (project.code && project.name) projectNames[project.code] = project.name;
                if (project.code && project.name && ![...form.elements.project.options].some((option) => option.value === project.code)) form.elements.project.add(new Option(project.name, project.code));
                if (project.name && projectFilter && ![...projectFilter.options].some((option) => option.value === project.name)) projectFilter.add(new Option(project.name, project.name));
            });
        } catch { /* Keep the built-in projects available. */ }
        const customerNames = ["Nguyễn Ngọc Anh", "Trần Minh Khoa", "Lê Hoàng Yến", "Phạm Quốc Bảo"];
        const customerPhones = {};
        try {
            const leads = JSON.parse(null || "[]");
            if (Array.isArray(leads)) leads.forEach((lead) => {
                if (!lead.name) return;
                customerNames.push(lead.name);
                customerPhones[lead.name] = lead.phone || "";
                if (lead.id) customerRefs[lead.id] = { name: lead.name, projectCode: lead.projectCode || "" };
            });
        } catch { /* Keep the built-in customers available. */ }
        [...new Set(customerNames)].forEach((name) => {
            if (![...form.elements.customer.options].some((option) => option.value === name)) {
                const option = new Option(name);
                option.dataset.phone = customerPhones[name] || "";
                form.elements.customer.add(option);
            }
        });
        let names = [];
        try {
            const people = JSON.parse(null || "[]");
            if (Array.isArray(people)) names.push(...people.filter((person) => person.accountType !== "customer" && person.status === "Đang hoạt động" && person.loginAllowed !== false).map((person) => person.name).filter(Boolean));
        } catch { /* Keep previous reservation assignments available. */ }
        [...new Set(names)].forEach((name) => {
            if (![...form.elements.assignee.options].some((option) => option.value === name)) form.elements.assignee.add(new Option(name));
        });
        fillAssignees();
    }

    function openForm() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        const params = new URLSearchParams(location.search);
        const customer = customerRefs[params.get("customer")];
        if (customer) {
            form.elements.customer.value = customer.name;
            form.elements.customer.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const projectCode = params.get("project") || customer?.projectCode;
        if (projectCode && [...form.elements.project.options].some((option) => option.value === projectCode)) form.elements.project.value = projectCode;
        filterProducts();
        const requestedProduct = params.get("product");
        if ([...form.elements.product.options].some((option) => option.value === requestedProduct)) form.elements.product.value = requestedProduct;
        document.querySelector("#bookingCustomerSearch")?.focus();
    }

    function setStatus(record, nextStatus, actionLabel) {
        const previousStatus = currentStatus(record.code);
        if (nextStatus === "Từ chối" && !window.confirm(`Từ chối yêu cầu ${record.code} và trả sản phẩm về trạng thái còn bán?`)) return;
        if (nextStatus === "Đã giải phóng" && !window.confirm(`Giải phóng sản phẩm của yêu cầu ${record.code}?`)) return;
        if (nextStatus === "Đã giữ chỗ") {
            const result = updateInventoryFor(record, "Chờ duyệt", "Đang giữ chỗ");
            if (!result.ok) {
                notify(result.reason === "missing" ? "Không tìm thấy sản phẩm trong danh mục. Hãy kiểm tra trước khi duyệt." : "Tình trạng sản phẩm đã thay đổi. Hãy kiểm tra lại danh mục.");
                return;
            }
        } else {
            const expected = previousStatus === "Đã giữ chỗ" ? "Đang giữ chỗ" : "Chờ duyệt";
            const result = updateInventoryFor(record, expected, "Còn bán");
            if (!result.ok) {
                notify(result.reason === "missing" ? "Không tìm thấy sản phẩm trong danh mục. Hãy kiểm tra trước khi xử lý." : "Tình trạng sản phẩm đã thay đổi. Hãy kiểm tra lại danh mục.");
                return;
            }
        }
        statuses[record.code] = nextStatus;
        if (!writeJson(statusKey, statuses)) {
            statuses[record.code] = previousStatus;
            const result = updateInventoryFor(record, nextStatus === "Đã giữ chỗ" ? "Đang giữ chỗ" : "Còn bán", previousStatus === "Đã giữ chỗ" ? "Đang giữ chỗ" : "Chờ duyệt");
            if (!result.ok && result.units) inventory.replace(result.units);
            notify("Không thể lưu thay đổi trên trình duyệt này.");
            return;
        }
        logAction(record, actionLabel, previousStatus, nextStatus);
        renderAllRows();
        updateSummary();
        refreshAlertPanel();
        notify(nextStatus === "Đã giữ chỗ" ? "Đã duyệt và ghi lịch sử thao tác." : nextStatus === "Đã giải phóng" ? "Đã giải phóng sản phẩm về danh mục còn bán." : "Đã từ chối yêu cầu và ghi lịch sử thao tác.");
    }

    // Keep the demo inventory and the seed request in sync with prior versions.
    const seedStatus = statuses[seedCode];
    if (seedStatus) {
        const expected = seedStatus === "Đã giữ chỗ" ? "Đang giữ chỗ" : ["Từ chối", "Đã giải phóng", "Hết hạn"].includes(seedStatus) ? "Còn bán" : "Chờ duyệt";
        const current = inventory.all();
        const seedUnit = current.find((unit) => unit.id === "unit-ap-a2-1208");
        if (seedUnit && ["Còn bán", "Chờ duyệt", "Đang giữ chỗ"].includes(seedUnit.status) && seedUnit.status !== expected) {
            inventory.replace(current.map((unit) => unit.id === "unit-ap-a2-1208" ? { ...unit, status: expected } : unit));
        }
    }
    populateFormData();
    renderAllRows();
    expireOverdue();
    updateSummary();
    renderAudit();
    refreshAlertPanel();

    tbody.addEventListener("click", (event) => {
        const historyButton = event.target.closest("[data-booking-history]");
        if (historyButton) { openAudit(historyButton.dataset.bookingHistory); return; }
        const button = event.target.closest("[data-booking-status]");
        const row = button?.closest("tr[data-booking-code]");
        const record = row && allRecords().find((item) => item.code === row.dataset.bookingCode);
        if (!record) return;
        const status = button.dataset.bookingStatus;
        const action = status === "Đã giữ chỗ" ? "Duyệt giữ chỗ" : status === "Từ chối" ? "Từ chối giữ chỗ" : "Giải phóng giữ chỗ";
        setStatus(record, status, action);
    });

    [projectFilter, assigneeFilter, dateFrom, dateTo].forEach((field) => field?.addEventListener("change", applyBookingFilters));
    document.querySelector("[data-booking-filter-clear]")?.addEventListener("click", () => {
        if (projectFilter) projectFilter.value = "";
        if (assigneeFilter) assigneeFilter.value = "";
        if (dateFrom) dateFrom.value = "";
        if (dateTo) dateTo.value = "";
        applyBookingFilters();
    });
    alertButton?.addEventListener("click", () => {
        const open = alertPanel.hidden;
        alertPanel.hidden = !open;
        alertButton.setAttribute("aria-expanded", String(open));
    });
    document.querySelector("[data-booking-alert-close]")?.addEventListener("click", () => {
        alertPanel.hidden = true;
        alertButton?.setAttribute("aria-expanded", "false");
    });
    alertList?.addEventListener("click", (event) => {
        if (!event.target.closest("a")) return;
        alertPanel.hidden = true;
        alertButton?.setAttribute("aria-expanded", "false");
    });
    document.querySelector("[data-booking-open]")?.addEventListener("click", openForm);
    if (new URLSearchParams(location.search).get("new") === "1") {
        openForm();
        const url = new URL(location.href);
        url.searchParams.delete("new");
        history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    document.querySelectorAll("[data-booking-close]").forEach((button) => button.addEventListener("click", closeForm));
    modal.addEventListener("click", (event) => { if (event.target === modal) closeForm(); });
    document.querySelectorAll("[data-booking-audit-close]").forEach((button) => button.addEventListener("click", closeAudit));
    auditModal?.addEventListener("click", (event) => { if (event.target === auditModal) closeAudit(); });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (!modal.hidden) closeForm();
            if (auditModal && !auditModal.hidden) closeAudit();
            if (alertPanel && !alertPanel.hidden) {
                alertPanel.hidden = true;
                alertButton?.setAttribute("aria-expanded", "false");
            }
        }
    });
    form.elements.project.addEventListener("change", () => filterProducts());
    form.elements.customer.addEventListener("change", () => {
        const customer = Object.values(customerRefs).find((item) => item.name === form.elements.customer.value);
        if (customer?.projectCode && [...form.elements.project.options].some((option) => option.value === customer.projectCode)) {
            form.elements.project.value = customer.projectCode;
            filterProducts();
        }
    });
    document.addEventListener("landiform:inventory-updated", () => filterProducts(true));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const customerSearch = document.querySelector("#bookingCustomerSearch");
        if (!form.elements.customer.value) {
            customerSearch?.setCustomValidity("Chọn khách hàng trong danh sách tìm kiếm.");
            customerSearch?.reportValidity();
            return;
        }
        customerSearch?.setCustomValidity("");
        const deadline = new Date(form.elements.deadline.value);
        if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
            form.elements.deadline.setCustomValidity("Chọn thời hạn trong tương lai.");
            form.reportValidity();
            return;
        }
        form.elements.deadline.setCustomValidity("");
        const unit = inventory.all().find((item) => item.id === form.elements.product.value);
        if (!unit || unit.status !== "Còn bán") {
            form.elements.product.setCustomValidity("Sản phẩm này không còn ở trạng thái còn bán. Vui lòng chọn sản phẩm khác.");
            form.reportValidity();
            return;
        }
        form.elements.product.setCustomValidity("");
        const linkedLead = [...form.elements.customer.options].map((option) => option).find((option) => option.value === form.elements.customer.value || option.textContent === form.elements.customer.value);
        const leadRecords = (() => { try { const value = JSON.parse(null || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } })();
        const lead = leadRecords.find((item) => item.id === form.elements.customer.value || item.name === form.elements.customer.value || item.name === linkedLead?.textContent);
        const teamRecords = (() => { try { const value = JSON.parse(null || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } })();
        const assignee = form.elements.assignee.value;
        const request = {
            code: `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
            customer: form.elements.customer.value,
            customerId: lead?.id || "",
            projectCode: form.elements.project.value,
            project: projectNames[form.elements.project.value] || unit.project,
            productId: unit.id,
            product: unit.code,
            assignee,
            assigneeId: teamRecords.find((person) => person.name === assignee)?.id || "",
            deadline: form.elements.deadline.value,
            note: form.elements.note.value.trim(),
            createdAt: new Date().toISOString(),
            createdBy: actorName(),
        };
        const currentUnits = inventory.all();
        if (!inventory.replace(currentUnits.map((item) => item.id === unit.id ? { ...item, status: "Chờ duyệt" } : item))) {
            notify("Không thể cập nhật tình trạng sản phẩm trên trình duyệt này.");
            return;
        }
        requests.push(request);
        if (!writeJson(storageKey, requests)) {
            requests.pop();
            inventory.replace(currentUnits);
            notify("Không thể lưu yêu cầu trên trình duyệt này.");
            return;
        }
        logAction(request, "Tạo yêu cầu giữ chỗ", "—", "Chờ duyệt");
        renderAllRows();
        fillAssignees();
        updateSummary();
        refreshAlertPanel();
        closeForm();
        notify("Đã tạo yêu cầu và ghi nhận nhân viên phụ trách.");
    });
    form.elements.deadline.addEventListener("input", () => form.elements.deadline.setCustomValidity(""));
    form.elements.product.addEventListener("change", () => form.elements.product.setCustomValidity(""));
    setInterval(() => { expireOverdue(); updateSummary(); refreshAlertPanel(); }, 60_000);
    window.addEventListener("focus", () => { expireOverdue(); updateSummary(); refreshAlertPanel(); });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) { expireOverdue(); updateSummary(); refreshAlertPanel(); }
    });
})();

