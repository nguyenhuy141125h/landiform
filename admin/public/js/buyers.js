(() => {
    const body = document.querySelector("#buyerTableBody");
    if (!body) return;

    const rows = [...body.querySelectorAll("tr")];
    const search = document.querySelector("#buyerSearch");
    const projectFilter = document.querySelector("#buyerProjectFilter");
    const documentFilter = document.querySelector("#buyerDocumentFilter");
    const transactionFilter = document.querySelector("#buyerTransactionFilter");
    const emptyState = document.querySelector("#buyerEmptyState");

    function filterRows() {
        const query = (search?.value || "").trim().toLocaleLowerCase("vi");
        let visible = 0;

        rows.forEach((row) => {
            const matches = (!query || row.textContent.toLocaleLowerCase("vi").includes(query))
                && (!projectFilter?.value || row.cells[2]?.textContent.trim() === projectFilter.value)
                && (!documentFilter?.value || row.dataset.documentStatus === documentFilter.value)
                && (!transactionFilter?.value || row.dataset.transactionStatus === transactionFilter.value);
            row.hidden = !matches;
            if (matches) visible += 1;
        });

        if (emptyState) emptyState.hidden = visible > 0;
    }

    [search, projectFilter, documentFilter, transactionFilter].forEach((control) => {
        control?.addEventListener(control === search ? "input" : "change", filterRows);
    });

    const detailModal = document.querySelector("#buyerDetailModal");
    const detailTitle = document.querySelector("#buyerDetailTitle");
    const closeDetail = () => {
        if (detailModal) detailModal.hidden = true;
        document.body.classList.remove("modal-open");
    };

    body.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-buyer-view]");
        if (!trigger || !detailModal) return;

        const buyerId = trigger.dataset.buyerView;
        const row = trigger.closest("tr");
        const name = row?.cells[0]?.querySelector("strong")?.textContent.trim() || "Chi tiết người mua";
        if (detailTitle) detailTitle.textContent = name;
        document.querySelectorAll("[data-buyer-profile]").forEach((item) => {
            item.hidden = item.dataset.buyerProfile !== buyerId;
        });
        const customerLink = document.querySelector(`#buyerCustomerLinks [data-buyer-profile="${buyerId}"]`);
        if (customerLink) customerLink.hidden = false;
        detailModal.hidden = false;
        document.body.classList.add("modal-open");
    });

    detailModal?.querySelectorAll("[data-buyer-detail-close]").forEach((button) => {
        button.addEventListener("click", closeDetail);
    });
    detailModal?.addEventListener("click", (event) => {
        if (event.target === detailModal) closeDetail();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && detailModal && !detailModal.hidden) closeDetail();
    });

    const createModal = document.querySelector("#buyerModal");
    document.querySelector("[data-buyer-open]")?.addEventListener("click", () => {
        if (!createModal) return;
        createModal.hidden = false;
        document.body.classList.add("modal-open");
    });
    createModal?.querySelectorAll("[data-buyer-close]").forEach((button) => {
        button.addEventListener("click", () => {
            createModal.hidden = true;
            document.body.classList.remove("modal-open");
        });
    });
    createModal?.addEventListener("click", (event) => {
        if (event.target === createModal) {
            createModal.hidden = true;
            document.body.classList.remove("modal-open");
        }
    });
    document.querySelector("#buyerForm")?.addEventListener("submit", (event) => event.preventDefault());

    filterRows();
})();
