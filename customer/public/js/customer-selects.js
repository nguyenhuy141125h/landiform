(() => {
    const controls = new Map();
    const chevron = '<svg class="customer-select-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
    const clockIcon = '<svg class="customer-select-clock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    const timeDescriptions = new Map([["09:00 – 11:00", "Buổi sáng · 2 giờ"], ["13:30 – 15:00", "Đầu giờ chiều · 1,5 giờ"], ["15:00 – 17:00", "Cuối giờ chiều · 2 giờ"]]);

    function getLabel(select) {
        if (select.getAttribute("aria-label")) return select.getAttribute("aria-label");
        const label = select.labels?.[0];
        if (!label) return "Chọn một mục";
        const clone = label.cloneNode(true);
        clone.querySelectorAll("select, input, textarea, button").forEach((item) => item.remove());
        return clone.textContent.trim() || "Chọn một mục";
    }

    function closeAll(except = null) {
        controls.forEach((control) => {
            if (control !== except) control.close(false);
        });
    }

    function enhance(select) {
        if (controls.has(select) || select.multiple || select.hidden || select.dataset.nativeSelect === "true") return;
        const wrapper = document.createElement("div");
        wrapper.className = "customer-select";
        const trigger = document.createElement("button");
        trigger.className = "customer-select-trigger";
        trigger.type = "button";
        trigger.setAttribute("role", "combobox");
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", getLabel(select));
        if (select.required) trigger.setAttribute("aria-required", "true");
        const value = document.createElement("span");
        value.className = "customer-select-value";
        const arrow = document.createElement("span");
        arrow.className = "customer-select-arrow";
        arrow.innerHTML = chevron;
        if (select.name === "time") {
            const icon = document.createElement("span");
            icon.className = "customer-select-time-icon";
            icon.innerHTML = clockIcon;
            trigger.append(icon, value, arrow);
        } else trigger.append(value, arrow);

        const menu = document.createElement("div");
        menu.className = "customer-select-menu";
        menu.id = `${select.id || `customer-select-${controls.size}`}-options`;
        menu.setAttribute("role", "listbox");
        trigger.setAttribute("aria-controls", menu.id);

        select.parentNode.insertBefore(wrapper, select);
        wrapper.append(select, trigger, menu);
        select.classList.add("customer-select-native");
        select.setAttribute("aria-hidden", "true");
        select.tabIndex = -1;

        const control = {
            select,
            wrapper,
            trigger,
            menu,
            value,
            activeIndex: -1,
            close(returnFocus = false) {
                wrapper.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
                if (returnFocus) trigger.focus();
            },
            sync() {
                const selected = select.options[select.selectedIndex];
                value.textContent = selected?.textContent || "Chọn một mục";
                trigger.disabled = select.disabled;
                menu.replaceChildren(...Array.from(select.options, (option, index) => {
                    const item = document.createElement("button");
                    item.type = "button";
                    item.className = "customer-select-option";
                    item.setAttribute("role", "option");
                    item.setAttribute("aria-selected", String(option.selected));
                    item.disabled = option.disabled;
                    item.tabIndex = -1;
                    const copy = document.createElement("span");
                    copy.className = "customer-select-option-copy";
                    const title = document.createElement("span");
                    title.className = "customer-select-option-title";
                    title.textContent = option.textContent;
                    copy.append(title);
                    const description = select.name === "time" ? timeDescriptions.get(option.textContent.trim()) : "";
                    if (description) {
                        const detail = document.createElement("small");
                        detail.className = "customer-select-option-description";
                        detail.textContent = description;
                        copy.append(detail);
                    }
                    item.append(copy);
                    if (option.selected) {
                        const check = document.createElement("span");
                        check.className = "customer-select-option-check";
                        check.setAttribute("aria-hidden", "true");
                        check.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6"/></svg>';
                        item.append(check);
                    }
                    item.addEventListener("click", () => {
                        if (option.disabled) return;
                        select.value = option.value;
                        wrapper.classList.remove("has-invalid");
                        trigger.removeAttribute("aria-invalid");
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                        control.sync();
                        control.close(true);
                    });
                    item.addEventListener("keydown", (event) => control.onKeyDown(event));
                    item.addEventListener("pointermove", () => { control.activeIndex = index; });
                    return item;
                }));
                trigger.title = selected?.textContent || "";
            },
            open() {
                if (select.disabled) return;
                closeAll(control);
                control.sync();
                wrapper.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
                control.activeIndex = Math.max(0, select.selectedIndex);
                menu.querySelectorAll("[role=option]")[control.activeIndex]?.focus();
            },
            onKeyDown(event) {
                const items = [...menu.querySelectorAll("[role=option]:not(:disabled)")];
                if (event.key === "Escape") {
                    event.preventDefault();
                    control.close(true);
                    return;
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!wrapper.classList.contains("is-open")) {
                        control.open();
                        return;
                    }
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    control.activeIndex = Math.max(0, Math.min(items.length - 1, control.activeIndex + direction));
                    items[control.activeIndex]?.focus();
                    return;
                }
                if (event.key === "Home" || event.key === "End") {
                    event.preventDefault();
                    control.activeIndex = event.key === "Home" ? 0 : items.length - 1;
                    items[control.activeIndex]?.focus();
                    return;
                }
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!wrapper.classList.contains("is-open")) {
                        control.open();
                        return;
                    }
                    items.find((item) => item === document.activeElement)?.click();
                }
            },
        };
        controls.set(select, control);
        control.sync();
        trigger.addEventListener("click", () => wrapper.classList.contains("is-open") ? control.close() : control.open());
        trigger.addEventListener("keydown", (event) => control.onKeyDown(event));
        select.addEventListener("change", () => control.sync());
        select.addEventListener("invalid", (event) => {
            event.preventDefault();
            wrapper.classList.add("has-invalid");
            trigger.setAttribute("aria-invalid", "true");
            trigger.focus();
        });
        const observer = new MutationObserver(() => control.sync());
        observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "selected", "label", "value"] });
        select.labels?.forEach((label) => label.addEventListener("click", (event) => {
            if (event.target.closest(".customer-select")) return;
            event.preventDefault();
            trigger.focus();
            control.open();
        }));
    }

    function syncAll() {
        document.querySelectorAll(".customer-select-native").forEach((select) => controls.get(select)?.sync());
    }

    document.querySelectorAll("select").forEach(enhance);
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".customer-select")) closeAll();
    });
    document.addEventListener("reset", () => setTimeout(syncAll, 0));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAll();
    });
    window.CustomerSelects = { syncAll };
})();
