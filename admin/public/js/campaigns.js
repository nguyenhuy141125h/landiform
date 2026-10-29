(() => {
    const modal = document.querySelector("#campaignModal");
    const form = document.querySelector("#campaignForm");
    const table = document.querySelector("#campaignTableBody");
    const search = document.querySelector('[data-filter="campaigns"], [data-filter]:not([data-filter="leads"])');
    if (!table) return;

    function setModal(open) {
        if (!modal) return;
        modal.hidden = !open;
        document.body.classList.toggle("modal-open", open);
        if (open) form?.querySelector("input:not([type=hidden])")?.focus();
        else form?.reset();
    }

    function filterRows() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        table.querySelectorAll("tr").forEach((row) => {
            row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase("vi").includes(query);
        });
    }

    search?.addEventListener("input", filterRows);
    document.querySelector("[data-campaign-open]")?.addEventListener("click", () => setModal(true));
    document.querySelectorAll("[data-campaign-close]").forEach((button) => button.addEventListener("click", () => setModal(false)));
    modal?.addEventListener("click", (event) => { if (event.target === modal) setModal(false); });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal && !modal.hidden) setModal(false);
    });
    form?.addEventListener("submit", (event) => event.preventDefault());

    document.querySelectorAll("[data-copy-url]").forEach((button) => {
        button.addEventListener("click", async () => {
            const url = button.dataset.copyUrl || "";
            try {
                await navigator.clipboard.writeText(url);
                button.setAttribute("aria-label", "Đã sao chép liên kết");
                window.setTimeout(() => button.removeAttribute("aria-label"), 1600);
            } catch {
                const input = document.createElement("textarea");
                input.value = url;
                input.setAttribute("readonly", "");
                input.style.position = "fixed";
                input.style.opacity = "0";
                document.body.append(input);
                input.select();
                document.execCommand("copy");
                input.remove();
            }
        });
    });
})();
