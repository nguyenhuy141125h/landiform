(() => {
    const modal = document.querySelector("#leadModal");
    const form = document.querySelector("#leadForm");
    const tbody = document.querySelector("#leadTableBody");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !tbody) return;

    const storageKey = "landiform.admin.leads.v1";
    const projectNames = { "AP-026": "An Phú Riverside", "GV-014": "Green Valley", "CP-008": "Central Park Towers", "LG-031": "Lumière Garden" };
    let leads = [];
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) leads = saved;
    } catch {
        leads = [];
    }
    const relationshipSeedKey = "landiform.admin.demo-relations.leads.v3";
    const relatedLeadExamples = [
        { id: "anh", name: "Nguyễn Ngọc Anh", phone: "0903 456 218", email: "anh.nguyen@example.com", project: "An Phú Riverside", projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1208", campaignId: "campaign-an-phu-launch-1", need: "Căn hộ 2 phòng ngủ", budget: "3–4 tỷ", source: "Google Ads · UTM", owner: "Trần Thanh Long", ownerId: "staff-long", status: "Chưa liên hệ", received: "21/10/2026 · 08:45", activities: [{ type: "Đăng ký", note: "Khách đăng ký tìm hiểu căn hộ qua website An Phú Riverside từ Google Ads.", at: "21/10/2026 · 08:45" }] },
        { id: "khoa", name: "Trần Minh Khoa", phone: "0918 224 760", email: "minh.khoa@example.com", project: "Green Valley", projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", need: "Nhà phố · 8–9 tỷ", budget: "8–9 tỷ", source: "SEO · Customer website", owner: "Quỳnh Dao", ownerId: "staff-quynh", status: "Đang tư vấn", received: "19/10/2026 · 10:20", activities: [{ type: "Cuộc gọi", note: "Đã trao đổi về diện tích, vị trí và khoảng giá phù hợp.", at: "20/10/2026 · 16:20" }, { type: "Đăng ký", note: "Khách gửi yêu cầu nhận bảng giá Green Valley từ tìm kiếm tự nhiên.", at: "19/10/2026 · 10:20" }] },
        { id: "yen", name: "Lê Hoàng Yến", phone: "0987 332 104", email: "yen.le@example.com", project: "Central Park Towers", projectCode: "CP-008", formId: "viewing", productId: "unit-cp-b1-0803", campaignId: "campaign-central-park-event", need: "Căn hộ 3 phòng ngủ · Bàn giao", budget: "5–6 tỷ", source: "QR · Sự kiện mở bán", owner: "Mai Ngọc", ownerId: "staff-mai", status: "Đã giao dịch", received: "20/10/2026 · 14:10", activities: [{ type: "Lịch hẹn", note: "Đã hoàn tất tham quan và ký mua căn B1 · 08.03; lịch bàn giao đã được tạo.", at: "20/10/2026 · 14:10" }, { type: "Đăng ký", note: "Khách quét QR sự kiện và gửi biểu mẫu đăng ký tham quan.", at: "19/10/2026 · 09:30" }] },
        { id: "bao", name: "Phạm Quốc Bảo", phone: "0908 113 624", email: "quoc.bao@example.com", project: "An Phú Riverside", projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1210", campaignId: "campaign-an-phu-meta-oct", need: "Đầu tư căn hộ 3 phòng ngủ", budget: "5–6 tỷ", source: "Meta Ads · Campaign T10", owner: "Trần Thanh Long", ownerId: "staff-long", status: "Đang đàm phán", received: "15/10/2026 · 11:35", activities: [{ type: "Cuộc gọi", note: "Đã trao đổi về căn hộ 3 phòng ngủ và phương án thanh toán.", at: "20/10/2026 · 11:35" }, { type: "Đăng ký", note: "Khách để lại thông tin từ chiến dịch Meta tháng 10.", at: "15/10/2026 · 11:35" }] },
        { id: "nam", name: "Võ Hoàng Nam", phone: "0912 440 580", email: "", project: "Green Valley", projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", need: "Nhà phố · 8–9 tỷ", budget: "8–9 tỷ", source: "SEO · Customer website", owner: "Quỳnh Dao", ownerId: "staff-quynh", status: "Đang tư vấn", received: "21/10/2026 · 09:10", activities: [{ type: "Đăng ký", note: "Khách để lại thông tin về nhà phố Green Valley.", at: "21/10/2026 · 09:10" }] },
        { id: "dat", name: "Võ Thành Đạt", phone: "0903 123 179", email: "dat.vo@example.com", project: "An Phú Riverside", projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1506", campaignId: "campaign-an-phu-meta-oct", need: "Căn hộ 2 phòng ngủ", budget: "3–4 tỷ", source: "Meta Ads · Campaign T10", owner: "Trần Thanh Long", ownerId: "staff-long", status: "Đã giao dịch", received: "12/10/2026 · 10:15", activities: [{ type: "Đăng ký", note: "Khách đăng ký từ chiến dịch Meta tháng 10.", at: "12/10/2026 · 10:15" }, { type: "Bàn giao", note: "Đã hoàn tất giao dịch căn A2 · 15.06.", at: "20/10/2026 · 14:00" }] },
        { id: "ha", name: "Nguyễn Thu Hà", phone: "0903 123 168", email: "thu.ha@example.com", project: "Green Valley", projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-05", campaignId: "campaign-green-valley-organic", need: "Nhà phố", budget: "8–9 tỷ", source: "SEO · Customer website", owner: "Quỳnh Dao", ownerId: "staff-quynh", status: "Đã giao dịch", received: "08/10/2026 · 11:30", activities: [{ type: "Đăng ký", note: "Khách yêu cầu nhận bảng giá nhà phố Green Valley.", at: "08/10/2026 · 11:30" }, { type: "Giao dịch", note: "Đã hoàn tất giao dịch căn N08 · 05.", at: "18/10/2026 · 15:00" }] },
    ];
    const relatedExistingLeadFields = {
        anh: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1208", campaignId: "campaign-an-phu-launch-1", ownerId: "staff-long" },
        khoa: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
        yen: { projectCode: "CP-008", formId: "viewing", productId: "unit-cp-b1-0803", campaignId: "campaign-central-park-event", ownerId: "staff-mai" },
        bao: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1210", campaignId: "campaign-an-phu-meta-oct", ownerId: "staff-long" },
        nam: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
        dat: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1506", campaignId: "campaign-an-phu-meta-oct", ownerId: "staff-long" },
        ha: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-05", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
    };
    const legacySeedValues = {
        khoa: { need: "Nhà phố", budget: "4–5 tỷ", source: "Customer website" },
        nam: { need: "Nhà phố · 4–5 tỷ", budget: "4–5 tỷ", source: "Customer website" },
        ha: { source: "Customer website" },
        dat: { source: "Meta · Campaign T10" },
    };
    try {
        if (null !== "3") {
            const normalized = leads.map((lead) => {
                const relations = relatedExistingLeadFields[lead?.id];
                if (!relations) return lead;
                const next = { ...lead, ...relations };
                const previousValues = legacySeedValues[lead.id] || {};
                const canonical = relatedLeadExamples.find((example) => example.id === lead.id);
                Object.entries(previousValues).forEach(([field, oldValue]) => {
                    if (lead[field] === oldValue && canonical) next[field] = canonical[field];
                });
                return next;
            });
            const normalizedIds = new Set(normalized.map((lead) => lead?.id));
            const additions = relatedLeadExamples.filter((lead) => !normalizedIds.has(lead.id));
            leads = [...normalized, ...additions];
            void 0;
            void 0;
        }
    } catch { /* Show the related examples in this page session even when storage is unavailable. */ }
    try {
        const staff = JSON.parse(null || "[]");
        if (Array.isArray(staff)) staff.forEach((person) => {
            if (!person.name || person.accountType === "customer" || person.status === "Tạm ngưng" || [...form.elements.owner.options].some((option) => option.value === person.name)) return;
            form.elements.owner.add(new Option(person.name));
        });
        const projects = JSON.parse(null || "[]");
        if (Array.isArray(projects)) projects.forEach((project) => {
            if (!project.code || !project.name || projectNames[project.code]) return;
            projectNames[project.code] = project.name;
            form.elements.project.add(new Option(project.name, project.code));
        });
    } catch {
        // Danh sách có sẵn trên trang vẫn sử dụng được.
    }
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function detailState(id) {
        try {
            return JSON.parse(null || "{}") || {};
        } catch {
            return {};
        }
    }

    function tone(status) {
        return ({ "Chưa liên hệ": "amber", "Đang tư vấn": "blue", "Đã hẹn tham quan": "violet", "Đang đàm phán": "green", "Đã giao dịch": "green", "Không phù hợp": "neutral" })[status] || "neutral";
    }

    function createBadge(status) {
        const badge = document.createElement("span");
        badge.className = `screen-badge ${tone(status)}`;
        badge.textContent = status;
        return badge;
    }

    function renderRow(lead) {
        const saved = detailState(lead.id);
        const row = document.createElement("tr");
        row.dataset.customerId = lead.id;
        row.dataset.project = lead.projectCode || Object.keys(projectNames).find((code) => projectNames[code] === lead.project) || "";
        row.dataset.formId = lead.formId || "";
        row.dataset.productId = lead.productId || "";
        row.dataset.campaignId = lead.campaignId || "";
        row.dataset.source = lead.source || "";
        row.dataset.owner = saved.owner || lead.owner || "";
        row.dataset.ownerId = lead.ownerId || "";
        const customerCell = document.createElement("td");
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
        const link = document.createElement("a");
        link.className = "customer-link";
        link.href = `customer-detail.html?id=${encodeURIComponent(lead.id)}`;
        link.textContent = lead.name;
        name.append(link);
        const phone = document.createElement("small");
        phone.textContent = lead.phone;
        details.append(name, phone);
        entity.append(icon, details);
        customerCell.append(entity);
        row.append(customerCell);
        const need = document.createElement("td");
        need.textContent = lead.need;
        if (lead.appointment?.date) {
            const schedule = document.createElement("small");
            schedule.textContent = `${lead.appointment.intent === "viewing" ? "Lịch xem" : "Lịch tư vấn"}: ${lead.appointment.date}${lead.appointment.time ? ` · ${lead.appointment.time}` : ""}`;
            need.append(schedule);
        }
        row.append(need);
        const source = document.createElement("td");
        source.textContent = lead.source;
        if (lead.branch) {
            const branch = document.createElement("small");
            branch.textContent = `Chi nhánh: ${lead.branch}`;
            source.append(branch);
        }
        row.append(source);
        const statusCell = document.createElement("td");
        statusCell.append(createBadge(saved.status || lead.status));
        row.append(statusCell);
        const owner = document.createElement("td");
        owner.textContent = saved.owner || lead.owner;
        row.append(owner);
        const date = document.createElement("td");
        date.textContent = lead.received;
        row.append(date);
        tbody.prepend(row);
    }

    function updateSavedRows() {
        tbody.querySelectorAll("tr[data-customer-id]").forEach((row) => {
            const id = row.dataset.customerId;
            const saved = detailState(id);
            if (saved.status) row.cells[3].replaceChildren(createBadge(saved.status));
            if (saved.owner) {
                row.cells[4].textContent = saved.owner;
                row.dataset.owner = saved.owner;
            }
        });
    }

    function updateCounts() {
        const values = document.querySelectorAll(".screen-stats .screen-stat strong");
        const rows = [...tbody.querySelectorAll("tr[data-customer-id]")];
        const statuses = rows.map((row) => row.cells[3]?.textContent.trim() || "");
        const projectCount = new Set(rows.map((row) => row.dataset.project).filter(Boolean)).size;
        const counts = [
            rows.length,
            statuses.filter((status) => status === "Chưa liên hệ").length,
            statuses.filter((status) => status === "Đã hẹn tham quan").length,
            statuses.filter((status) => ["Đang tư vấn", "Đã hẹn tham quan", "Đang đàm phán"].includes(status)).length,
        ];
        values.forEach((value, index) => {
            if (counts[index] !== undefined) value.textContent = counts[index].toLocaleString("vi-VN");
        });
        const projectCaption = values[0]?.parentElement.querySelector("small");
        if (projectCaption) projectCaption.textContent = `Từ ${projectCount} dự án`;
    }

    function applyFilters() {
        const query = document.querySelector('[data-filter="leads"]')?.value.trim().toLocaleLowerCase("vi") || "";
        const status = document.querySelector("[data-lead-status-filter]")?.value || "Tất cả trạng thái";
        const project = document.querySelector("[data-lead-project-filter]")?.value || "";
        const source = document.querySelector("[data-lead-source-filter]")?.value || "";
        const owner = document.querySelector("[data-lead-owner-filter]")?.value || "";
        tbody.querySelectorAll("tr").forEach((row) => {
            const textMatch = !query || row.textContent.toLocaleLowerCase("vi").includes(query);
            const statusMatch = status === "Tất cả trạng thái" || row.cells[3]?.textContent.trim() === status;
            const projectMatch = !project || row.dataset.project === project;
            const sourceMatch = !source || row.dataset.source === source;
            const ownerMatch = !owner || row.dataset.owner === owner;
            row.hidden = !(textMatch && statusMatch && projectMatch && sourceMatch && ownerMatch);
        });
    }

    function populateLeadFilters() {
        const filters = [
            [document.querySelector("[data-lead-project-filter]"), [...tbody.querySelectorAll("tr")].map((row) => row.dataset.project).filter(Boolean), (value) => projectNames[value] || value],
            [document.querySelector("[data-lead-source-filter]"), [...tbody.querySelectorAll("tr")].map((row) => row.dataset.source).filter(Boolean)],
            [document.querySelector("[data-lead-owner-filter]"), [...tbody.querySelectorAll("tr")].map((row) => row.dataset.owner).filter(Boolean)],
        ];
        filters.forEach(([select, values, labelForValue = (value) => value]) => {
            if (!select) return;
            while (select.options.length > 1) select.remove(1);
            [...new Set(values)].sort((a, b) => labelForValue(a).localeCompare(labelForValue(b), "vi")).forEach((value) => {
                select.add(new Option(labelForValue(value), value));
            });
        });
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        form.elements.phone.setCustomValidity("");
    }

    if (tbody.dataset.staticDemo !== "true") {
        tbody.replaceChildren();
        leads.slice().reverse().forEach(renderRow);
    }
    updateSavedRows();
    populateLeadFilters();
    updateCounts();
    document.querySelector("[data-lead-open]")?.addEventListener("click", () => {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    });
    if (new URLSearchParams(location.search).get("new") === "1") {
        document.querySelector("[data-lead-open]")?.click();
    }
    document.querySelectorAll("[data-lead-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });
    document.querySelector('[data-filter="leads"]')?.addEventListener("input", applyFilters);
    document.querySelector("[data-lead-status-filter]")?.addEventListener("change", applyFilters);
    ["[data-lead-project-filter]", "[data-lead-source-filter]", "[data-lead-owner-filter]"].forEach((selector) => {
        document.querySelector(selector)?.addEventListener("change", applyFilters);
    });
    document.querySelector("[data-clear-lead-filters]")?.addEventListener("click", () => {
        document.querySelector('[data-filter="leads"]').value = "";
        ["[data-lead-status-filter]", "[data-lead-project-filter]", "[data-lead-source-filter]", "[data-lead-owner-filter]"].forEach((selector) => {
            const filter = document.querySelector(selector);
            if (filter) filter.selectedIndex = 0;
        });
        applyFilters();
    });
    form.elements.phone.addEventListener("input", () => form.elements.phone.setCustomValidity(""));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const phone = form.elements.phone.value.trim();
        const normalizedPhone = phone.replace(/\D/g, "");
        const usedPhones = [...tbody.querySelectorAll(".screen-entity small")].map((element) => element.textContent.replace(/\D/g, ""));
        if (normalizedPhone && usedPhones.some((value) => value.includes(normalizedPhone))) {
            form.elements.phone.setCustomValidity("Số điện thoại này đã có trong danh sách khách hàng.");
            form.reportValidity();
            return;
        }
        const now = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(new Date());
        const projectCode = form.elements.project.value;
        const owner = form.elements.owner.value;
        const projectRefs = { "AP-026": { formId: "consult" }, "GV-014": { formId: "price" }, "CP-008": { formId: "viewing" } };
        const staffRefs = { "Trần Thanh Long": "staff-long", "Quỳnh Dao": "staff-quynh", "Mai Ngọc": "staff-mai", "Minh Anh": "demo-manager-01" };
        const lead = {
            id: `lead-${Date.now()}`,
            name: form.elements.name.value.trim(),
            phone,
            email: form.elements.email.value.trim(),
            project: projectNames[projectCode],
            projectCode,
            formId: projectRefs[projectCode]?.formId || "",
            need: form.elements.need.value.trim(),
            budget: form.elements.budget.value.trim() || "Chưa cập nhật",
            source: form.elements.source.value,
            owner,
            ownerId: staffRefs[owner] || "",
            status: "Chưa liên hệ",
            received: now,
            activities: [{ type: "Đăng ký", note: "Nhân viên đã ghi nhận thông tin khách hàng.", at: now }],
        };
        leads.push(lead);
        try {
            void 0;
        } catch {
            leads.pop();
            notify("Không thể lưu khách hàng trên trình duyệt này.");
            return;
        }
        renderRow(lead);
        populateLeadFilters();
        updateCounts();
        applyFilters();
        close();
        notify("Đã thêm khách hàng vào danh sách.");
    });
})();

