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

    let currentId = "";
    let toastTimer;
    const records = () => [...tbody.querySelectorAll("tr[data-form-id]")];
    const recordFor = (id) => records().find((row) => row.dataset.formId === id);
    const recordData = (row) => ({ ...row.dataset });

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const project = projectFilter?.value || "";
        const status = statusFilter?.value || "";
        records().forEach((row) => {
            row.hidden = !row.textContent.toLocaleLowerCase("vi").includes(query)
                || Boolean(project && row.dataset.project !== project)
                || Boolean(status && row.dataset.status !== status);
        });
    }

    function updateSummary() {
        const rows = records();
        const active = rows.filter((row) => row.dataset.status === "Đang nhận").length;
        const qr = rows.filter((row) => row.dataset.qr === "true").length;
        const projects = new Set(rows.map((row) => row.dataset.project).filter(Boolean));
        document.querySelector("#formTotal").textContent = String(rows.length);
        document.querySelector("#formActive").textContent = String(active);
        document.querySelector("#formQrCount").textContent = String(qr);
        document.querySelector("#formProjectCount").textContent = String(projects.size);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        currentId = "";
    }

    function open(id = "") {
        currentId = id;
        form.reset();
        const row = id ? recordFor(id) : null;
        const record = row ? recordData(row) : null;
        if (record) {
            form.elements.name.value = record.name || "";
            form.elements.project.value = record.project || "";
            form.elements.place.value = record.place || "";
            ["email", "need", "budget", "appointment", "qr"].forEach((key) => {
                form.elements[key].checked = record[key] === "true";
            });
            form.elements.status.value = record.status || "Bản nháp";
        } else {
            form.elements.status.value = "Bản nháp";
        }
        document.querySelector("#formEditorTitle").textContent = record ? `Chỉnh sửa ${record.name}` : "Tạo mẫu đăng ký";
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function openQr(id) {
        const row = recordFor(id);
        if (!row || row.dataset.qr !== "true") return;
        if (row.dataset.status !== "Đang nhận") {
            notify("Biểu mẫu chưa ở trạng thái nhận đăng ký nên mã QR chưa thể sử dụng.");
            return;
        }
        const record = recordData(row);
        const destination = new URL("../../customer/index.html", window.location.href);
        if (record.projectCode) destination.searchParams.set("project", record.projectCode);
        destination.searchParams.set("utm_source", "qr");
        destination.searchParams.set("form", id);
        const link = destination.href;
        const imageUrl = new URL("https://quickchart.io/qr");
        imageUrl.searchParams.set("size", "260");
        imageUrl.searchParams.set("format", "png");
        imageUrl.searchParams.set("text", link);
        document.querySelector("#formQrImage").src = imageUrl.href;
        document.querySelector("#formQrLink").value = link;
        document.querySelector("#formQrOpen").href = link;
        document.querySelector("#formQrProject").textContent = record.project || "";
        document.querySelector("#formQrName").textContent = record.name || "";
        document.querySelector("#formQrTitle").textContent = `Mã QR · ${record.name || "Biểu mẫu"}`;
        qrModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeQr() {
        if (!qrModal) return;
        qrModal.hidden = true;
        if (modal.hidden) document.body.classList.remove("modal-open");
    }

    function closeAll() {
        close();
        closeQr();
    }

    updateSummary();
    applyFilters();
    document.querySelector("[data-form-open]")?.addEventListener("click", () => open());
    tbody.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-form-delete]");
        if (remove) {
            document.dispatchEvent(new CustomEvent("landiform:backend-delete", { detail: { type: "form", id: remove.dataset.formDelete } }));
            return;
        }
        const qr = event.target.closest("[data-form-qr]");
        if (qr) { openQr(qr.dataset.formQr); return; }
        const edit = event.target.closest("[data-form-edit]");
        if (edit) open(edit.dataset.formEdit);
    });
    document.querySelectorAll("[data-form-qr-close]").forEach((button) => button.addEventListener("click", closeQr));
    qrModal?.addEventListener("click", (event) => { if (event.target === qrModal) closeQr(); });
    document.querySelector("[data-form-qr-copy]")?.addEventListener("click", async () => {
        const input = document.querySelector("#formQrLink");
        try { await navigator.clipboard.writeText(input.value); }
        catch { input.select(); document.execCommand("copy"); }
        notify("Đã sao chép đường dẫn biểu mẫu.");
    });
    document.querySelectorAll("[data-form-close]").forEach((button) => button.addEventListener("click", close));
    search?.addEventListener("input", applyFilters);
    projectFilter?.addEventListener("change", applyFilters);
    statusFilter?.addEventListener("change", applyFilters);
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAll(); });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { form, id: currentId, values: new FormData(form) },
        }));
        close();
    });
})();
