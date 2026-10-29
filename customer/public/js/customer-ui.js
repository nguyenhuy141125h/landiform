(() => {
    // The customer site is a static prototype. Keep submitted data in the form
    // and expose an event for a future API adapter instead of faking success.
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.hasAttribute("data-backend-submit")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        form.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            bubbles: true,
            detail: { form, values: new FormData(form) },
        }));
    }, true);
})();


(() => {
    const year = document.querySelector("#currentYear");
    if (year) year.textContent = String(new Date().getFullYear());

    const menuToggle = document.querySelector("#storeMenuToggle");
    const nav = document.querySelector(".store-nav");
    menuToggle?.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });
    nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Mở menu");
    }));
})();


(() => {
    const normalize = (value) => String(value || "").toLocaleLowerCase("vi").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d").trim();

    function all() {
        const options = [...document.querySelectorAll("[data-branch-select] option[value]:not([value=''])")];
        return options.map((option) => ({
            id: option.value,
            name: option.textContent.split("\u00b7")[0].trim(),
            city: option.dataset.city || "",
            address: option.dataset.address || "",
            phone: option.dataset.phone || "",
            email: option.dataset.email || "",
            isDefault: option.selected || option.dataset.default === "true",
        }));
    }
    function defaultBranch(branches = all()) {
        return branches.find((branch) => branch.isDefault) || branches[0] || null;
    }
    function regionKey(value) {
        const key = normalize(value);
        if (/ha noi|ha tay/.test(key)) return "ha noi";
        if (/ho chi minh|thu duc|quan [1-9]|binh thanh|tan binh|go vap|nha be/.test(key)) return "ho chi minh";
        if (/bien hoa|dong nai/.test(key)) return "dong nai";
        if (/long an/.test(key)) return "long an";
        return key;
    }
    function fillSelect(select, { area = "", reset = false } = {}) {
        if (!select) return null;
        const branches = all();
        const previous = reset ? "" : select.value;
        const preferred = regionKey(area);
        const match = preferred ? branches.find((branch) => regionKey(branch.city) === preferred) : null;
        const chosen = branches.find((branch) => branch.id === previous) || match || defaultBranch(branches);
        select.value = chosen?.id || "";
        select.required = branches.length > 1;
        const field = select.closest("[data-branch-field]");
        if (field) field.hidden = branches.length <= 1;
        return chosen || null;
    }
    function setForArea(select, area = "") { return fillSelect(select, { area, reset: true }); }
    function get(id) { const branches = all(); return branches.find((branch) => branch.id === id) || defaultBranch(branches); }
    function renderDirectory(container) {
        if (!container) return;
        const hasCards = Boolean(container.querySelector(".customer-branch-card"));
        container.hidden = !hasCards;
        const wrapper = container.closest(".customer-branch-directory-wrap");
        if (wrapper) wrapper.hidden = !hasCards;
        if (hasCards) document.querySelectorAll("#contact-details [data-company-phone], #contact-details [data-company-email], #contact-details [data-company-address-wrap]")
            .forEach((item) => { item.hidden = true; });
    }
    document.querySelectorAll("[data-branch-select]").forEach((select) => fillSelect(select));
    document.querySelectorAll("[data-branch-directory]").forEach(renderDirectory);
    window.CustomerBranches = { all, defaultBranch, fillSelect, setForArea, get, renderDirectory };
})();


(() => {
    const form = document.querySelector("#contactRequestForm");
    if (!form) return;
    const projectSelect = form.elements.projectCode;
    const branchSelect = form.elements.branchId;
    if (!projectSelect || !branchSelect) return;
    projectSelect.addEventListener("change", () => {
        const area = projectSelect.selectedOptions[0]?.dataset.area || "";
        window.CustomerBranches?.setForArea(branchSelect, area);
    });
})();
