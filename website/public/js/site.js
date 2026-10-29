(() => {
    const header = document.querySelector(".site-header");
    const toggle = header?.querySelector(".menu-toggle");
    const nav = header?.querySelector(".main-nav");
    if (!toggle || !nav) return;
    const closeMenu = () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "M\u1edf menu");
        toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    };
    toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "\u0110\u00f3ng menu" : "M\u1edf menu");
        toggle.innerHTML = `<i class="fa-solid fa-${open ? "xmark" : "bars"}" aria-hidden="true"></i>`;
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
})();

(() => {
    const modal = document.querySelector(".consultation-modal");
    if (!modal) return;
    const dialog = modal.querySelector(".consultation-dialog");
    const form = modal.querySelector(".consultation-form");
    let opener = null;
    let originalPadding = "";
    let step = 1;
    const setStep = (value, moveFocus = false) => {
        step = value;
        modal.querySelectorAll("[data-step]").forEach((panel) => {
            panel.hidden = Number(panel.dataset.step) !== step;
        });
        modal.querySelectorAll("[data-step-indicator]").forEach((item) => {
            const itemStep = Number(item.dataset.stepIndicator);
            item.classList.toggle("is-current", itemStep === step);
            item.classList.toggle("is-done", itemStep < step);
        });
        if (moveFocus) {
            modal
                .querySelector(
                    `[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] button`,
                )
                ?.focus();
        }
    };
    const open = (source) => {
        opener = source;
        form.reset();
        setStep(1);
        originalPadding = document.body.style.paddingRight;
        const gap = window.innerWidth - document.documentElement.clientWidth;
        if (gap > 0) document.body.style.paddingRight = `${gap}px`;
        document.body.classList.add("modal-open");
        modal.inert = false;
        modal.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() =>
            requestAnimationFrame(() => modal.classList.add("is-open")),
        );
        dialog.focus({ preventScroll: true });
    };
    const close = () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.inert = true;
        document.body.classList.remove("modal-open");
        document.body.style.paddingRight = originalPadding;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-consultation-open]");
        if (trigger) {
            event.preventDefault();
            open(trigger);
            return;
        }
        if (event.target.closest("[data-consultation-close]")) close();
    });
    modal.querySelector("[data-step-next]").addEventListener("click", () => {
        const invalid = [
            ...modal.querySelectorAll('[data-step="1"] input'),
        ].find((field) => !field.reportValidity());
        if (!invalid) setStep(2, true);
    });
    modal
        .querySelector("[data-step-back]")
        .addEventListener("click", () => setStep(1, true));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const invalid = [
            ...modal.querySelectorAll(
                '[data-step="2"] input, [data-step="2"] select',
            ),
        ].find((field) => !field.reportValidity());
        if (!invalid) setStep(3, true);
    });
    document.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("is-open")) return;
        if (event.key === "Escape") {
            close();
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = [
            ...dialog.querySelectorAll(
                "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
            ),
        ].filter(
            (item) => !item.closest("[hidden]") && item.offsetParent !== null,
        );
        if (!focusable.length) return;
        const first = focusable[0],
            last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
})();
