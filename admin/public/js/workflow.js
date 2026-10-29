(() => {
    const modal = document.querySelector("#taskModal");
    const form = document.querySelector("#taskForm");
    if (!modal || !form) return;

    function open() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        const customerId = new URLSearchParams(location.search).get("customer");
        const option = [...form.elements.customer.options].find((item) => item.value === customerId);
        if (option) {
            form.elements.customer.value = customerId;
            form.elements.project.value = option.dataset.projectCode || "";
            form.elements.customer.dispatchEvent(new Event("change", { bubbles: true }));
        }
        form.elements.title.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document.querySelector("[data-task-open]")?.addEventListener("click", open);
    document.querySelectorAll("[data-task-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
    form.elements.customer.addEventListener("change", () => {
        const option = form.elements.customer.selectedOptions[0];
        if (option?.dataset.projectCode) form.elements.project.value = option.dataset.projectCode;
    });
    if (new URLSearchParams(location.search).get("new") === "1") {
        open();
        const url = new URL(location.href);
        url.searchParams.delete("new");
        history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
})();
