(() => {
    const pad = (value) => String(value).padStart(2, "0");
    const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const fromIso = (value) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
        if (!match) return null;
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toIso(today);
    const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    document.querySelectorAll("[data-date-picker]").forEach((picker) => {
        const display = picker.querySelector(".date-picker-value");
        const value = picker.querySelector('input[name="date"]');
        const toggle = picker.querySelector(".date-picker-toggle");
        const popover = picker.querySelector(".date-picker-popover");
        const title = picker.querySelector("[data-date-title]");
        const days = picker.querySelector(".date-picker-days");
        const weekdaysEl = picker.querySelector(".date-picker-weekdays");
        const previous = picker.querySelector("[data-date-prev]");
        const next = picker.querySelector("[data-date-next]");
        const todayButton = picker.querySelector("[data-date-today]");
        let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        weekdaysEl.replaceChildren(...weekdays.map((day) => {
            const cell = document.createElement("span");
            cell.textContent = day;
            return cell;
        }));

        function close() {
            popover.hidden = true;
            display.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-expanded", "false");
        }
        function open() {
            if (value.value) {
                const selected = fromIso(value.value);
                if (selected) shownMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
            }
            popover.hidden = false;
            display.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-expanded", "true");
            render();
            popover.style.position = "fixed";
            popover.style.top = "0px";
            popover.style.left = "0px";
            const anchor = display.getBoundingClientRect();
            const box = popover.getBoundingClientRect();
            const gap = 8;
            const top = anchor.bottom + box.height + gap <= window.innerHeight - 12
                ? anchor.bottom + gap
                : Math.max(12, anchor.top - box.height - gap);
            const left = Math.min(Math.max(12, anchor.left), window.innerWidth - box.width - 12);
            popover.style.top = `${top}px`;
            popover.style.left = `${left}px`;
        }
        function setDate(date) {
            value.value = toIso(date);
            display.value = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            display.setCustomValidity("");
            close();
        }
        function parseDisplay() {
            const raw = display.value.trim();
            if (!raw) {
                value.value = "";
                display.setCustomValidity("");
                return;
            }
            const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw);
            if (!match) {
                value.value = "";
                display.setCustomValidity("Nhập ngày theo định dạng ngày/tháng/năm hoặc chọn trên lịch.");
                return;
            }
            const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
            if (date.getFullYear() !== Number(match[3]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[1])) {
                value.value = "";
                display.setCustomValidity("Ngày bạn nhập không hợp lệ.");
                return;
            }
            if (toIso(date) < todayIso) {
                value.value = "";
                display.setCustomValidity("Vui lòng chọn ngày từ hôm nay trở đi.");
                return;
            }
            value.value = toIso(date);
            display.value = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            display.setCustomValidity("");
        }
        function render() {
            title.textContent = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(shownMonth);
            const monthStart = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
            const offset = (monthStart.getDay() + 6) % 7;
            const daysInMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
            const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
            const selectedIso = value.value;
            const cells = [];
            previous.disabled = shownMonth.getFullYear() === today.getFullYear() && shownMonth.getMonth() <= today.getMonth();
            for (let index = 0; index < totalCells; index += 1) {
                const dayNumber = index - offset + 1;
                const cell = document.createElement("span");
                if (dayNumber < 1 || dayNumber > daysInMonth) {
                    cell.className = "date-picker-day is-empty";
                } else {
                    const date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), dayNumber);
                    const iso = toIso(date);
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "date-picker-day";
                    button.textContent = String(dayNumber);
                    button.setAttribute("role", "gridcell");
                    button.setAttribute("aria-label", new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(date));
                    if (iso === selectedIso) button.classList.add("is-selected");
                    if (iso === todayIso) button.classList.add("is-today");
                    if (iso < todayIso) button.disabled = true;
                    button.addEventListener("click", () => setDate(date));
                    cells.push(button);
                    continue;
                }
                cells.push(cell);
            }
            days.replaceChildren(...cells);
        }

        display.addEventListener("focus", open);
        display.addEventListener("input", parseDisplay);
        display.addEventListener("change", parseDisplay);
        toggle.addEventListener("click", () => popover.hidden ? (display.focus(), open()) : close());
        previous.addEventListener("click", () => { shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1); render(); });
        next.addEventListener("click", () => { shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1); render(); });
        todayButton.addEventListener("click", () => setDate(today));
        picker.closest("form")?.addEventListener("reset", () => setTimeout(() => {
            display.value = "";
            value.value = "";
            display.setCustomValidity("");
            shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            close();
        }, 0));
        document.addEventListener("pointerdown", (event) => { if (!picker.contains(event.target)) close(); });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !popover.hidden) { event.stopImmediatePropagation(); close(); toggle.focus(); }
        });
        window.addEventListener("resize", close);
        window.addEventListener("scroll", () => { if (!popover.hidden) close(); }, true);
        render();
    });
})();
