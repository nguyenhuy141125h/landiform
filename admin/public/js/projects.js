(() => {
    const tableBody = document.querySelector("#projectTableBody");
    const detailPage = document.querySelector("#projectDetailPage");
    const createModal = document.querySelector("#projectCreateModal");
    const editModal = document.querySelector("#projectEditModal");
    const profiles = [...document.querySelectorAll("[data-project-detail]")];

    function filterProjects() {
        if (!tableBody) return;
        const query = document.querySelector('[data-filter="projects"]')?.value.trim().toLocaleLowerCase("vi") || "";
        const type = document.querySelector("#projectTypeFilter")?.value || "";
        const status = document.querySelector("#projectStatusFilter")?.value || "Tất cả trạng thái";
        let visible = 0;
        tableBody.querySelectorAll("tr[data-project-code]").forEach((row) => {
            const matches = (!query || row.textContent.toLocaleLowerCase("vi").includes(query))
                && (!type || row.cells[1]?.textContent.split(" · ")[0] === type)
                && (status === "Tất cả trạng thái" || row.cells[3]?.textContent.trim() === status);
            row.hidden = !matches;
            if (matches) visible += 1;
        });
        const empty = tableBody.querySelector("[data-project-empty]");
        if (empty) empty.hidden = visible > 0;
    }

    function setModal(modal, open) {
        if (!modal) return;
        modal.hidden = !open;
        document.body.classList.toggle("modal-open", open);
        if (open) modal.querySelector("input:not([type=hidden]), select")?.focus();
    }

    if (tableBody) {
        document.querySelector('[data-filter="projects"]')?.addEventListener("input", filterProjects);
        document.querySelectorAll("#projectTypeFilter, #projectStatusFilter").forEach((select) => select.addEventListener("change", filterProjects));
        document.querySelector("[data-project-create]")?.addEventListener("click", () => setModal(createModal, true));
        tableBody.addEventListener("click", (event) => {
            if (event.target.closest("[data-project-row-delete]")) event.preventDefault();
        });
        filterProjects();
    }

    document.querySelectorAll("[data-project-modal-close]").forEach((button) => button.addEventListener("click", () => setModal(button.closest(".modal-backdrop"), false)));
    [createModal, editModal].forEach((modal) => modal?.addEventListener("click", (event) => {
        if (event.target === modal) setModal(modal, false);
    }));
    document.querySelectorAll("#projectCreateForm, #projectEditForm").forEach((form) => form.addEventListener("submit", (event) => event.preventDefault()));

    if (!detailPage) return;
    const code = new URLSearchParams(location.search).get("code") || "AP-026";
    const selected = profiles.find((profile) => profile.dataset.projectDetail === code);
    if (!selected) {
        detailPage.classList.add("is-not-found");
        const missing = document.querySelector("#projectNotFound");
        if (missing) missing.hidden = false;
        return;
    }
    profiles.forEach((profile) => { profile.hidden = profile !== selected; });
    const editButton = document.querySelector("[data-project-edit]");
    editButton?.addEventListener("click", () => {
        const form = document.querySelector("#projectEditForm");
        const facts = selected.querySelectorAll(".project-profile-facts dd");
        if (form) {
            form.elements.name.value = selected.querySelector(".project-detail-page-title h2")?.textContent.trim() || "";
            form.elements.area.value = facts[1]?.textContent.trim() || "";
            form.elements.address.value = facts[2]?.textContent.trim() || "";
            form.elements.status.value = selected.querySelector(".screen-badge")?.textContent.trim() || "Đang mở bán";
        }
        setModal(editModal, true);
    });
    document.querySelector("[data-project-delete]")?.addEventListener("click", (event) => event.preventDefault());
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") [createModal, editModal].forEach((modal) => { if (modal && !modal.hidden) setModal(modal, false); });
    });
})();
