(() => {
    const form = document.querySelector("#contactForm");
    if (!form) return;

    const interest = new URLSearchParams(location.search).get("interest");
    const interestField = form.querySelector('[name="interest"]');
    if (interest && interestField && [...interestField.options].some((option) => option.value === interest)) {
        interestField.value = interest;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = form.querySelector("#formNote");
        if (status) status.textContent = "Bạn đã nhập xong thông tin. Đây là bản dùng thử, thông tin chưa được gửi đến LANDIFORM.";
    });
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
