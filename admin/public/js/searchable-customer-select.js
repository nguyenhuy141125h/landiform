(() => {
    const pickers = [...document.querySelectorAll(".searchable-customer-picker")];
    if (!pickers.length) return;

    function bind(picker) {
        const input = picker.querySelector("[role='combobox']");
        const select = picker.querySelector("select");
        const list = picker.querySelector("[role='listbox']");
        if (!input || !select || !list) return;
        let hasQuery = false;

        function selectedLabel() {
            return select.value ? select.selectedOptions[0]?.textContent.trim() || "" : "";
        }

        function sync(open = false) {
            const selectedValue = select.value;
            const label = selectedLabel();
            const query = hasQuery && !(selectedValue && input.value === label)
                ? input.value.trim().toLocaleLowerCase("vi")
                : "";
            const options = [...select.options].filter((option) =>
                (option.value === "" && !query) || (Boolean(query) && `${option.textContent} ${option.dataset.phone || ""}`.toLocaleLowerCase("vi").includes(query))
            );

            list.replaceChildren(...options.map((option) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "appointment-customer-option";
                button.id = `${list.id}-option-${[...select.options].indexOf(option)}`;
                button.setAttribute("role", "option");
                button.setAttribute("aria-selected", String(option.value === selectedValue));
                button.dataset.optionValue = option.value;
                button.dataset.optionIndex = String([...select.options].indexOf(option));
                button.textContent = option.textContent.trim();
                if (option.dataset.phone) {
                    const phone = document.createElement("small");
                    phone.textContent = option.dataset.phone;
                    button.append(phone);
                }
                return button;
            }));
            if (!options.length) {
                const empty = document.createElement("div");
                empty.className = "appointment-customer-empty";
                empty.textContent = "Không tìm thấy khách hàng phù hợp.";
                list.append(empty);
            }
            list.hidden = !open;
            input.setAttribute("aria-expanded", String(open));
            if (!open) input.removeAttribute("aria-activedescendant");
        }

        function choose(option) {
            if (!option) return;
            select.selectedIndex = Number(option.dataset.optionIndex);
            input.value = selectedLabel();
            input.setCustomValidity("");
            select.dispatchEvent(new Event("change", { bubbles: true }));
            sync(false);
        }

        list.addEventListener("click", (event) => {
            const option = event.target.closest("[data-option-index]");
            if (option) choose(option);
        });
        input.addEventListener("focus", () => {
            hasQuery = false;
            input.select();
            sync(true);
        });
        input.addEventListener("input", () => {
            hasQuery = true;
            if (select.value && input.value !== selectedLabel()) select.value = "";
            input.setCustomValidity("");
            sync(true);
        });
        input.addEventListener("keydown", (event) => {
            const options = [...list.querySelectorAll("[data-option-index]")];
            const active = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
            if (event.key === "Escape") {
                sync(false);
                return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!options.length) return;
                const next = event.key === "ArrowDown"
                    ? Math.min(active < 0 ? 0 : active + 1, options.length - 1)
                    : Math.max(active < 0 ? options.length - 1 : active - 1, 0);
                options.forEach((option, index) => option.setAttribute("aria-selected", String(index === next)));
                input.setAttribute("aria-activedescendant", options[next].id);
                options[next].scrollIntoView({ block: "nearest" });
                return;
            }
            if (event.key === "Enter" && !list.hidden) {
                const option = options[active] || options[0];
                if (option) {
                    event.preventDefault();
                    choose(option);
                }
            }
        });
        select.addEventListener("change", () => {
            input.value = selectedLabel();
            sync(false);
        });
        select.form?.addEventListener("reset", () => setTimeout(() => {
            input.value = selectedLabel();
            sync(false);
        }));
        new MutationObserver(() => sync(!list.hidden)).observe(select, { childList: true, subtree: true, attributes: true });
        sync(false);
    }

    pickers.forEach(bind);
    document.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".searchable-customer-picker")) return;
        pickers.forEach((picker) => {
            const input = picker.querySelector("[role='combobox']");
            const list = picker.querySelector("[role='listbox']");
            if (input && list) {
                list.hidden = true;
                input.setAttribute("aria-expanded", "false");
                input.removeAttribute("aria-activedescendant");
            }
        });
    });
})();
