(() => {
    const modal = document.querySelector("#leadModal");
    const form = document.querySelector("#leadForm");
    const tbody = document.querySelector("#leadTableBody");
    if (!modal || !form || !tbody) return;

    const search = document.querySelector('[data-filter="leads"]');
    const filters = [
        [document.querySelector("[data-lead-project-filter]"), (row, value) => row.dataset.project === value],
        [document.querySelector("[data-lead-source-filter]"), (row, value) => row.dataset.source === value],
        [document.querySelector("[data-lead-owner-filter]"), (row, value) => row.dataset.owner === value],
        [document.querySelector("[data-lead-status-filter]"), (row, value) => row.cells[3]?.textContent.trim() === value],
    ];

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        tbody.querySelectorAll("tr").forEach((row) => {
            const matchesSearch = !query || row.textContent.toLocaleLowerCase("vi").includes(query);
            const matchesFilters = filters.every(([select, matches]) => {
                const value = select?.value || "";
                return !value || matches(row, value);
            });
            row.hidden = !(matchesSearch && matchesFilters);
        });
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    function openModal() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name?.focus();
    }

    search?.addEventListener("input", applyFilters);
    filters.forEach(([select]) => select?.addEventListener("change", applyFilters));
    document.querySelector("[data-clear-lead-filters]")?.addEventListener("click", () => {
        if (search) search.value = "";
        filters.forEach(([select]) => { if (select) select.selectedIndex = 0; });
        applyFilters();
    });

    document.querySelector("[data-lead-open]")?.addEventListener("click", openModal);
    document.querySelectorAll("[data-lead-close]").forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeModal();
    });
    form.addEventListener("submit", (event) => event.preventDefault());

    if (new URLSearchParams(location.search).get("new") === "1") openModal();
})();
