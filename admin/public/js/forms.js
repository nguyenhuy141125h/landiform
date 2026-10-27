(() => {
    const modal = document.querySelector("#formEditorModal");
    const qrModal = document.querySelector("#formQrModal");
    const form = document.querySelector("#formEditor");
    const tbody = document.querySelector("#formTableBody");
    const toast = document.querySelector("#toastMessage");
    const search = document.querySelector("#formSearch");
    const projectFilter = document.querySelector("#formProjectFilter");
    const statusFilter = document.querySelector("#formStatusFilter");
    if (!modal || !form || !tbody) return;

    ["An Phú Riverside", "Green Valley", "Central Park Towers", "Lumière Garden"].forEach((name) => {
        if (projectFilter && ![...projectFilter.options].some((option) => option.value === name)) projectFilter.add(new Option(name, name));
    });

    const storageKey = "landiform.admin.forms.v1";
    const initialForms = {
        consult: { id: "consult", name: "Đăng ký tư vấn", project: "An Phú Riverside", projectCode: "AP-026", place: "Customer website", email: true, need: true, budget: true, appointment: false, qr: false, status: "Đang nhận" },
        price: { id: "price", name: "Nhận bảng giá", project: "Green Valley", projectCode: "GV-014", place: "Trang giới thiệu", email: true, need: true, budget: false, appointment: false, qr: false, status: "Đang nhận" },
        viewing: { id: "viewing", name: "Đăng ký tham quan", project: "Central Park Towers", projectCode: "CP-008", place: "Mã QR tại sự kiện", email: true, need: true, budget: true, appointment: true, qr: true, status: "Đang nhận" },
    };
    let savedForms = {};
    try {
        const saved = JSON.parse(null || "{}");
        if (saved && typeof saved === "object" && !Array.isArray(saved)) savedForms = saved;
    } catch {
        savedForms = {};
    }
    try {
        const projects = JSON.parse(null || "[]");
        if (Array.isArray(projects)) projects.forEach((project) => {
            if (project.name && ![...form.elements.project.options].some((option) => option.value === project.name)) {
                form.elements.project.add(new Option(project.name));
            }
            if (project.name && projectFilter && ![...projectFilter.options].some((option) => option.value === project.name)) {
                projectFilter.add(new Option(project.name, project.name));
            }
        });
    } catch {
        // Giữ danh sách dự án có sẵn.
    }
    let currentId = null;
    const removedFormIds = new Set();
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function countFields(record) {
        return 2 + ["email", "need", "budget", "appointment"].filter((field) => record[field]).length;
    }

    function makeBadge(status) {
        const badge = document.createElement("span");
        badge.className = `screen-badge ${status === "Đang nhận" ? "green" : status === "Tạm dừng" ? "amber" : "neutral"}`;
        badge.textContent = status;
        return badge;
    }

    function makeQrBadge(enabled) {
        const badge = document.createElement("span");
        badge.className = `screen-badge ${enabled ? "violet" : "neutral"}`;
        badge.textContent = enabled ? "Đã bật" : "Chưa bật";
        return badge;
    }

    function fillQrCell(cell, record) {
        const content = document.createElement("div");
        content.className = "form-qr-cell";
        content.append(makeQrBadge(record.qr));
        if (record.qr) {
            const button = document.createElement("button");
            button.className = "project-detail-button form-qr-action";
            button.type = "button";
            button.dataset.formQr = record.id;
            button.innerHTML = '<i class="fa-solid fa-qrcode" aria-hidden="true"></i> Xem mã QR';
            content.append(button);
        } else {
            const hint = document.createElement("small");
            hint.textContent = "Bật trong Chỉnh sửa";
            content.append(hint);
        }
        cell.replaceChildren(content);
    }

    function updateSummary() {
        const rows = [...tbody.rows];
        const active = rows.filter((row) => row.cells[4]?.textContent.includes("Đang nhận")).length;
        const qr = rows.filter((row) => row.cells[5]?.textContent.includes("Đã bật")).length;
        const projects = new Set(rows.map((row) => row.cells[1]?.textContent.trim()).filter(Boolean));
        document.querySelector("#formTotal").textContent = String(rows.length);
        document.querySelector("#formActive").textContent = String(active);
        document.querySelector("#formQrCount").textContent = String(qr);
        document.querySelector("#formProjectCount").textContent = String(projects.size);
    }

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const project = projectFilter?.value || "";
        const status = statusFilter?.value || "";
        tbody.querySelectorAll("tr").forEach((row) => {
            row.hidden = (!row.textContent.toLocaleLowerCase("vi").includes(query))
                || (project && row.cells[1]?.textContent.trim() !== project)
                || (status && row.cells[4]?.textContent.trim() !== status);
        });
    }

    function renderRecord(record) {
        const existing = [...tbody.rows].find((row) => row.dataset.formId === record.id);
        if (existing) {
            const entity = existing.querySelector(".screen-entity");
            if (entity) {
                entity.querySelector("strong").textContent = record.name;
                entity.querySelector("small").textContent = `${record.place} · ${countFields(record)} trường`;
            }
            existing.cells[1].textContent = record.project;
            existing.cells[2].textContent = String(countFields(record));
            existing.cells[3].textContent = record.place;
            existing.cells[4].replaceChildren(makeBadge(record.status));
            fillQrCell(existing.cells[5], record);
            const actionCell = existing.cells[6];
            actionCell.classList.add("form-actions-cell");
            const detailLink = actionCell.querySelector('a[href*="record-detail.html?type=form"]');
            if (detailLink) {
                detailLink.href = `record-detail.html?type=form&id=${encodeURIComponent(record.id)}`;
            } else {
                let editButton = actionCell.querySelector("[data-form-edit]");
                if (!editButton) {
                editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "project-detail-button";
                editButton.dataset.formEdit = record.id;
                actionCell.prepend(editButton);
                }
                editButton.innerHTML = 'Chỉnh sửa <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
            }
            let deleteButton = actionCell.querySelector("[data-form-delete]");
            if (!deleteButton) {
                deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "button button-danger screen-row-delete";
                deleteButton.dataset.formDelete = record.id;
                deleteButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span>';
                actionCell.append(deleteButton);
            }
            return;
        }
        const row = document.createElement("tr");
        row.dataset.formId = record.id;
        const nameCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = "screen-entity-icon blue";
        const symbol = document.createElement("i");
        symbol.className = "fa-solid fa-file-lines";
        symbol.setAttribute("aria-hidden", "true");
        icon.append(symbol);
        const details = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = record.name;
        const meta = document.createElement("small");
        meta.textContent = `${record.place} · ${countFields(record)} trường`;
        details.append(name, meta);
        entity.append(icon, details);
        nameCell.append(entity);
        row.append(nameCell);
        const projectCell = document.createElement("td");
        projectCell.textContent = record.project;
        row.append(projectCell);
        const countCell = document.createElement("td");
        countCell.textContent = String(countFields(record));
        row.append(countCell);
        const placeCell = document.createElement("td");
        placeCell.textContent = record.place;
        row.append(placeCell);
        const statusCell = document.createElement("td");
        statusCell.append(makeBadge(record.status));
        row.append(statusCell);
        const qrCell = document.createElement("td");
        fillQrCell(qrCell, record);
        row.append(qrCell);
        const actionCell = document.createElement("td");
        actionCell.className = "form-actions-cell";
        const button = document.createElement("button");
        button.className = "project-detail-button";
        button.type = "button";
        button.dataset.formEdit = record.id;
        button.append(document.createTextNode("Chỉnh sửa "));
        const arrow = document.createElement("i");
        arrow.className = "fa-solid fa-arrow-right";
        arrow.setAttribute("aria-hidden", "true");
        button.append(arrow);
        actionCell.append(button);
        const remove = document.createElement("button");
        remove.className = "button button-danger screen-row-delete";
        remove.type = "button";
        remove.dataset.formDelete = record.id;
        remove.setAttribute("aria-label", `Xóa biểu mẫu ${record.name}`);
        remove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span>';
        actionCell.append(remove);
        row.append(actionCell);
        tbody.prepend(row);
    }

    function open(id = null) {
        currentId = id;
        const record = removedFormIds.has(id) ? null : (savedForms[id] || initialForms[id]);
        form.reset();
        if (record) {
            form.elements.name.value = record.name;
            setSelectValue(form.elements.project, record.project);
            setSelectValue(form.elements.place, record.place);
            ["email", "need", "budget", "appointment", "qr"].forEach((field) => {
                form.elements[field].checked = Boolean(record[field]);
            });
            setSelectValue(form.elements.status, record.status || "Bản nháp");
        } else {
            setSelectValue(form.elements.status, "Bản nháp");
        }
        document.querySelector("#formEditorTitle").textContent = record ? `Chỉnh sửa ${record.name}` : "Tạo mẫu đăng ký";
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        currentId = null;
    }

    function openQr(id) {
        const record = savedForms[id] || initialForms[id];
        if (!record || !record.qr) return;
        if (record.status !== "Đang nhận") {
            notify("Biểu mẫu đang là bản nháp hoặc tạm dừng. Hãy chuyển sang Đang nhận để mã QR mở được biểu mẫu.");
            return;
        }
        const projectCode = record.projectCode || ({ "An Phú Riverside": "AP-026", "Green Valley": "GV-014", "Central Park Towers": "CP-008", "Lumière Garden": "LG-031" })[record.project] || "";
        const destination = new URL("../../customer/index.html", window.location.href);
        if (projectCode) destination.searchParams.set("project", projectCode);
        destination.searchParams.set("utm_source", "qr");
        destination.searchParams.set("form", record.id);
        const link = destination.href;
        const imageUrl = new URL("https://quickchart.io/qr");
        imageUrl.searchParams.set("size", "260");
        imageUrl.searchParams.set("format", "png");
        imageUrl.searchParams.set("text", link);
        document.querySelector("#formQrImage").src = imageUrl.href;
        document.querySelector("#formQrLink").value = link;
        document.querySelector("#formQrOpen").href = link;
        document.querySelector("#formQrProject").textContent = record.project;
        document.querySelector("#formQrName").textContent = record.name;
        document.querySelector("#formQrTitle").textContent = `Mã QR · ${record.name}`;
        qrModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeQr() {
        qrModal.hidden = true;
        if (modal.hidden) document.body.classList.remove("modal-open");
    }

    function setSelectValue(select, value) {
        const selectedValue = String(value || "");
        if (selectedValue && ![...select.options].some((option) => option.value === selectedValue)) {
            select.add(new Option(selectedValue, selectedValue));
        }
        select.value = selectedValue;
    }

    if (tbody.dataset.staticDemo !== "true") Object.values({ ...initialForms, ...savedForms }).forEach(renderRecord);
    updateSummary();
    applyFilters();
    document.querySelector("[data-form-open]")?.addEventListener("click", () => open());
    tbody.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-form-delete]");
        if (deleteButton) {
            const id = deleteButton.dataset.formDelete;
            const row = deleteButton.closest("tr");
            const name = row?.cells[0]?.textContent.trim() || "biểu mẫu";
            if (!window.confirm(`Xóa “${name}” khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục dữ liệu ví dụ.`)) return;
            removedFormIds.add(id);
            delete savedForms[id];
            row?.remove();
            updateSummary();
            applyFilters();
            notify("Đã xóa biểu mẫu khỏi danh sách hiện tại.");
            return;
        }
        const qrButton = event.target.closest("[data-form-qr]");
        if (qrButton) {
            openQr(qrButton.dataset.formQr);
            return;
        }
        const button = event.target.closest("[data-form-edit]");
        if (button) open(button.dataset.formEdit);
    });
    document.querySelectorAll("[data-form-qr-close]").forEach((button) => button.addEventListener("click", closeQr));
    qrModal?.addEventListener("click", (event) => { if (event.target === qrModal) closeQr(); });
    document.querySelector("[data-form-qr-copy]")?.addEventListener("click", async () => {
        const input = document.querySelector("#formQrLink");
        try {
            await navigator.clipboard.writeText(input.value);
            notify("Đã sao chép đường dẫn trang khách hàng.");
        } catch {
            input.select();
            document.execCommand("copy");
            notify("Đã sao chép đường dẫn trang khách hàng.");
        }
    });
    document.querySelectorAll("[data-form-close]").forEach((button) => button.addEventListener("click", close));
    search?.addEventListener("input", applyFilters);
    projectFilter?.addEventListener("change", applyFilters);
    statusFilter?.addEventListener("change", applyFilters);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
        if (event.key === "Escape" && qrModal && !qrModal.hidden) closeQr();
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = currentId || `form-${Date.now()}`;
        const previous = savedForms[id] || initialForms[id];
        const record = {
            id,
            name: form.elements.name.value.trim(),
            project: form.elements.project.value,
            projectCode: (() => {
                const project = (() => { try { const saved = JSON.parse(null || "[]"); return Array.isArray(saved) ? saved.find((item) => item.name === form.elements.project.value) : null; } catch { return null; } })();
                return project?.code || ({ "An Phú Riverside": "AP-026", "Green Valley": "GV-014", "Central Park Towers": "CP-008", "Lumière Garden": "LG-031" })[form.elements.project.value] || "";
            })(),
            place: form.elements.place.value,
            email: form.elements.email.checked,
            need: form.elements.need.checked,
            budget: form.elements.budget.checked,
            appointment: form.elements.appointment.checked,
            qr: form.elements.qr.checked,
            status: form.elements.status.value,
        };
        savedForms[id] = record;
        removedFormIds.delete(id);
        try {
            void 0;
        } catch {
            notify("Không thể lưu mẫu đăng ký trên trình duyệt này.");
            return;
        }
        renderRecord(record);
        updateSummary();
        applyFilters();
        close();
        notify("Đã lưu mẫu đăng ký.");
    });
})();

