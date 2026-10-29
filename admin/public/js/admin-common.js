


(() => {
    // Keep examples in the HTML. Forms may validate and prepare backend payloads,
    // while destructive controls stay inactive until a backend is connected.
    document.addEventListener("submit", (event) => {
        if (!event.target.matches("form")) return;
        event.preventDefault();
    }, true);

    document.addEventListener("click", (event) => {
        const action = event.target.closest("button, a");
        if (!action) return;
        const actionLabel = (action.textContent || "").trim().toLocaleLowerCase("vi");
        const destructive = action.matches([
            "[data-appointment-delete]", "[data-appointment-cancel]",
            "[data-buyer-delete]", "[data-category-delete]", "[data-form-delete]",
            "[data-guide-delete]", "[data-inventory-delete]", "[data-delete-role]",
            "[data-permanent-delete-role]", "[data-project-delete]",
            "[data-project-row-delete]", "[data-staff-delete-action]"
        ].join(",")) || action.matches(".screen-row-delete, .role-icon-action.is-danger") ||
            /^xóa(?:\s|$)/i.test(action.getAttribute("aria-label") || "") ||
            ["xóa", "xóa vĩnh viễn", "duyệt", "từ chối", "hủy lịch"].includes(actionLabel);
        if (!destructive) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);

    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const search = document.querySelector("#globalSearch");
    const toast = document.querySelector("#toastMessage");
    let toastTimer;

    function initializeBranchSwitcher() {
        const switcher = document.querySelector(".workspace-switch");
        const menu = document.querySelector(".workspace-branch-menu");
        const subtitle = switcher?.querySelector(".workspace-copy small");
        if (!switcher || !menu || !subtitle) return;
        const options = [...menu.querySelectorAll("[data-branch-option]")];
        function closeMenu() {
            menu.hidden = true;
            switcher.classList.remove("is-open");
            switcher.setAttribute("aria-expanded", "false");
        }
        function selectOption(button) {
            options.forEach((option) => {
                const active = option === button;
                option.classList.toggle("is-selected", active);
                option.setAttribute("aria-checked", String(active));
            });
            subtitle.textContent = button.textContent.trim();
            switcher.dataset.branchScope = button.dataset.branchOption;
            document.body.dataset.branchScope = button.dataset.branchOption;
            document.dispatchEvent(new CustomEvent("landiform:branch-change", { detail: { id: button.dataset.branchOption, label: subtitle.textContent } }));
            closeMenu();
        }
        function toggleMenu() {
            if (!menu.hidden) return closeMenu();
            const rect = switcher.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
            menu.hidden = false;
            switcher.classList.add("is-open");
            switcher.setAttribute("aria-expanded", "true");
        }
        menu.addEventListener("click", (event) => {
            const option = event.target.closest("[data-branch-option]");
            if (option) selectOption(option);
        });
        switcher.addEventListener("click", toggleMenu);
        switcher.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleMenu(); }
            if (event.key === "Escape") closeMenu();
        });
        document.addEventListener("click", (event) => {
            if (!switcher.contains(event.target) && !menu.contains(event.target)) closeMenu();
        });
        document.querySelector("#sidebar")?.addEventListener("scroll", closeMenu, { passive: true });
    }

    initializeBranchSwitcher();

    function addLogoutAction() {
        const account = document.querySelector(".account-switch");
        if (!account || document.querySelector("[data-account-logout]")) return;
        let actions = account.parentElement;
        if (!actions?.classList.contains("sidebar-account-actions")) {
            actions = document.createElement("div");
            actions.className = "sidebar-account-actions";
            account.parentNode.insertBefore(actions, account);
            actions.append(account);
        }
        const logout = document.createElement("a");
        logout.className = "account-logout";
        logout.href = location.pathname.includes("/pages/") ? "../login.html" : "login.html";
        logout.dataset.accountLogout = "true";
        logout.setAttribute("aria-label", "Đăng xuất");
        logout.title = "Đăng xuất";
        logout.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Đăng xuất</span>';
        actions.append(logout);
    }

    addLogoutAction();

    function moveAccountControlsToTopbar() {
        const accountActions = document.querySelector(".sidebar-account-actions");
        const topbarActions = document.querySelector(".topbar-actions");
        if (!accountActions || !topbarActions) return;
        const accountHref = location.pathname.includes("/pages/") ? "account.html" : "pages/account.html";
        document.querySelectorAll(".account-switch, .topbar-avatar").forEach((link) => {
            link.href = accountHref;
            link.setAttribute("aria-label", "Mở thông tin tài khoản");
        });
        topbarActions.querySelector(".topbar-avatar")?.remove();
        const notification = topbarActions.querySelector(".notification-button");
        if (notification) topbarActions.insertBefore(accountActions, notification);
        else topbarActions.append(accountActions);
        accountActions.classList.remove("sidebar-account-actions");
        accountActions.classList.add("topbar-account-actions");
    }

    moveAccountControlsToTopbar();

    function routeSupportLinks() {
        const supportPath = location.pathname.includes("/pages/") ? "support.html" : "pages/support.html";
        document.querySelectorAll('a[href*="website/contact.html"]').forEach((link) => {
            link.href = supportPath;
            link.removeAttribute("target");
        });
    }

    routeSupportLinks();

    function initializeNotifications() {
        const center = document.querySelector(".notification-center");
        const button = center?.querySelector(".notification-button");
        const panel = center?.querySelector(".notification-popover");
        if (!center || !button || !panel) return;
        function close() {
            panel.hidden = true;
            button.setAttribute("aria-expanded", "false");
        }
        button.addEventListener("click", () => {
            const opening = panel.hidden;
            panel.hidden = !opening;
            button.setAttribute("aria-expanded", String(opening));
        });
        panel.querySelector("[data-notification-read]")?.addEventListener("click", () => {
            panel.querySelectorAll(".notification-item").forEach((item) => item.classList.add("is-read"));
            center.querySelector(".notification-count")?.setAttribute("hidden", "");
        });
        document.addEventListener("click", (event) => { if (!center.contains(event.target)) close(); });
        document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    }

    initializeNotifications();

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function exportTable() {
        const rows = [...document.querySelectorAll(".screen-table tr")];
        if (!rows.length) return notify("Chưa có danh sách để xuất.");
        const csv = rows.map((row) =>
            [...row.cells].map((cell) =>
                '"' + cell.innerText.trim().replace(/\s+/g, " ").replace(/"/g, '""') + '"'
            ).join(",")
        ).join("\r\n");
        const link = document.createElement("a");
        const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
        link.href = url;
        link.download = location.pathname.split("/").pop().replace(".html", "") + "-danh-sach.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify("Đã xuất danh sách hiện tại.");
    }

    menuToggle?.addEventListener("click", () => {
        const isOpen = sidebar?.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });

    search?.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("vi");
        document.querySelectorAll(".screen-table tbody tr, .kanban-card, .agent-card, .engine-steps article, .integration-list > div, .permission-role, .permission-row").forEach((item) => {
            item.hidden = Boolean(query) && !item.textContent.toLocaleLowerCase("vi").includes(query);
        });
    });

    document.querySelectorAll("[data-filter]").forEach((field) => {
        field.addEventListener("input", () => {
            const table = field.closest(".screen-panel")?.querySelector(".screen-table");
            const query = field.value.trim().toLocaleLowerCase("vi");
            table?.querySelectorAll("tbody tr").forEach((row) => {
                row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase("vi").includes(query);
            });
        });
    });

    document.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;
        if (action === "export-screen") exportTable();
        if (action === "refresh-platform") location.reload();
    });

    document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            search?.focus();
        }
    });

    const customSelects = new WeakMap();
    let customSelectSequence = 0;
    let typeaheadTimer;
    let typeahead = "";
    const filterSelectSelector = "select";

    function closeSelectMenus(except = null) {
        document.querySelectorAll(".select-menu-control.is-open").forEach((control) => {
            if (control === except) return;
            control.classList.remove("is-open", "opens-upward");
            const trigger = control.querySelector(".select-menu-trigger");
            const list = control.querySelector(".select-menu-list");
            trigger?.setAttribute("aria-expanded", "false");
            if (list) list.hidden = true;
        });
    }

    function enhanceSelect(select) {
        if (customSelects.has(select) || select.multiple || select.size > 1 || select.dataset.nativeSelect !== undefined) return;
        const control = document.createElement("div");
        control.className = "select-menu-control";
        const trigger = document.createElement("button");
        trigger.className = "select-menu-trigger";
        trigger.type = "button";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", select.getAttribute("aria-label") || select.labels?.[0]?.textContent.trim() || "Chọn một mục");
        const value = document.createElement("span");
        value.className = "select-menu-value";
        const arrow = document.createElement("span");
        arrow.className = "select-menu-arrow";
        arrow.setAttribute("aria-hidden", "true");
        trigger.append(value, arrow);
        const list = document.createElement("div");
        list.className = "select-menu-list";
        list.hidden = true;
        list.id = `select-menu-${++customSelectSequence}`;
        list.setAttribute("role", "listbox");
        trigger.setAttribute("aria-controls", list.id);
        const parent = select.parentNode;
        parent.insertBefore(control, select);
        control.append(select, trigger, list);
        select.classList.add("select-menu-native");
        select.tabIndex = -1;
        select.setAttribute("aria-hidden", "true");
        const state = { control, trigger, value, list, activeIndex: -1, observer: null };
        customSelects.set(select, state);

        function refresh() {
            const options = [...select.options];
            list.replaceChildren();
            options.forEach((option, index) => {
                const item = document.createElement("div");
                item.className = "select-menu-option";
                item.id = `${list.id}-option-${index}`;
                item.setAttribute("role", "option");
                item.setAttribute("aria-selected", String(index === select.selectedIndex));
                item.setAttribute("aria-disabled", String(option.disabled));
                item.textContent = option.textContent.trim();
                item.dataset.index = String(index);
                if (option.disabled) item.classList.add("is-disabled");
                if (index === select.selectedIndex) item.classList.add("is-selected");
                item.addEventListener("pointerdown", (event) => event.preventDefault());
                item.addEventListener("pointerenter", () => setActive(index));
                item.addEventListener("click", () => choose(index));
                list.append(item);
            });
            value.textContent = select.selectedOptions[0]?.textContent.trim() || "Chọn một mục";
            trigger.disabled = select.disabled;
            trigger.setAttribute("aria-label", select.getAttribute("aria-label") || select.labels?.[0]?.textContent.trim() || value.textContent);
            trigger.setAttribute("aria-invalid", String(select.getAttribute("aria-invalid") === "true"));
            if (select.disabled) control.classList.add("is-disabled");
            else control.classList.remove("is-disabled");
        }
        state.refresh = refresh;

        function setActive(index) {
            const options = [...select.options];
            if (!options.length) return;
            let next = Math.max(0, Math.min(index, options.length - 1));
            while (options[next]?.disabled && next < options.length - 1) next += 1;
            if (options[next]?.disabled) return;
            state.activeIndex = next;
            list.querySelectorAll(".select-menu-option").forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === next));
            trigger.setAttribute("aria-activedescendant", `${list.id}-option-${next}`);
            list.children[next]?.scrollIntoView({ block: "nearest" });
        }

        function choose(index) {
            const option = select.options[index];
            if (!option || option.disabled) return;
            select.selectedIndex = index;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
            refresh();
            closeSelectMenus();
            trigger.focus();
        }

        function open(direction = 1) {
            if (trigger.disabled) return;
            refresh();
            closeSelectMenus(control);
            control.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
            list.hidden = false;
            const rect = control.getBoundingClientRect();
            const freeBelow = window.innerHeight - rect.bottom;
            const freeAbove = rect.top;
            const opensUpward = freeBelow < Math.min(280, list.scrollHeight) && freeAbove > freeBelow;
            const margin = 8;
            const width = Math.min(rect.width, window.innerWidth - margin * 2);
            list.style.width = width + "px";
            list.style.left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin) + "px";
            list.style.maxHeight = Math.min(320, Math.max(120, opensUpward ? freeAbove : freeBelow) - margin) + "px";
            list.style.top = opensUpward ? "auto" : Math.min(window.innerHeight - 120, rect.bottom + 6) + "px";
            list.style.bottom = opensUpward ? window.innerHeight - rect.top + 6 + "px" : "auto";
            control.classList.toggle("opens-upward", opensUpward);
            setActive(select.selectedIndex >= 0 ? select.selectedIndex : direction > 0 ? 0 : select.options.length - 1);
        }

        trigger.addEventListener("click", () => {
            if (control.classList.contains("is-open")) closeSelectMenus();
            else open();
        });
        trigger.addEventListener("keydown", (event) => {
            const isOpen = control.classList.contains("is-open");
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!isOpen) open(event.key === "ArrowDown" ? 1 : -1);
                else setActive(state.activeIndex + (event.key === "ArrowDown" ? 1 : -1));
            } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
                event.preventDefault();
                choose(state.activeIndex);
            } else if ((event.key === "Enter" || event.key === " ") && !isOpen) {
                event.preventDefault();
                open();
            } else if (event.key === "Escape" && isOpen) {
                event.preventDefault();
                closeSelectMenus();
            } else if (event.key === "Home" && isOpen) {
                event.preventDefault();
                setActive(0);
            } else if (event.key === "End" && isOpen) {
                event.preventDefault();
                setActive(select.options.length - 1);
            } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                typeahead += event.key.toLocaleLowerCase("vi");
                clearTimeout(typeaheadTimer);
                typeaheadTimer = setTimeout(() => { typeahead = ""; }, 650);
                const found = [...select.options].findIndex((option) => option.textContent.trim().toLocaleLowerCase("vi").startsWith(typeahead));
                if (found >= 0) {
                    event.preventDefault();
                    if (isOpen) setActive(found);
                    else choose(found);
                }
            }
        });
        select.addEventListener("change", refresh);
        select.addEventListener("input", refresh);
        select.addEventListener("invalid", () => {
            trigger.setAttribute("aria-invalid", "true");
            control.classList.add("has-error");
            trigger.focus();
        });
        select.addEventListener("focus", () => trigger.focus());
        select.addEventListener("change", () => {
            if (select.checkValidity()) {
                trigger.setAttribute("aria-invalid", "false");
                control.classList.remove("has-error");
            }
        });
        state.observer = new MutationObserver(refresh);
        state.observer.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });
        const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
        const indexDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
        try {
            Object.defineProperty(select, "value", {
                configurable: true,
                get() { return valueDescriptor.get.call(this); },
                set(value) { valueDescriptor.set.call(this, value); refresh(); },
            });
            Object.defineProperty(select, "selectedIndex", {
                configurable: true,
                get() { return indexDescriptor.get.call(this); },
                set(value) { indexDescriptor.set.call(this, value); refresh(); },
            });
        } catch { /* Keep native selection if property wrapping is unavailable. */ }
        refresh();
    }

    function enhanceFilterSelects(root = document) {
        if (root.matches?.(filterSelectSelector)) enhanceSelect(root);
        root.querySelectorAll?.(filterSelectSelector).forEach(enhanceSelect);
    }

    enhanceFilterSelects();
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".select-menu-control")) closeSelectMenus();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Tab") closeSelectMenus();
    });
    window.addEventListener("scroll", (event) => {
        if (event.target instanceof Element && event.target.closest(".select-menu-list")) return;
        closeSelectMenus();
    }, true);
    window.addEventListener("resize", () => closeSelectMenus());
    document.addEventListener("reset", (event) => {
        setTimeout(() => event.target.querySelectorAll(".select-menu-native").forEach((select) => customSelects.get(select)?.refresh()), 0);
    }, true);
    const selectObserver = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) enhanceFilterSelects(node);
        }));
    });
    selectObserver.observe(document.body, { childList: true, subtree: true });
})();


(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    function syncActiveNavigation() {
        const currentUrl = new URL(window.location.href);
        const detailAliases = {
            category: "categories.html",
            form: "forms.html",
            buyer: "buyers.html",
            appointment: "workflow.html",
        };
        const detailTarget = currentUrl.pathname.endsWith("/record-detail.html")
            ? detailAliases[currentUrl.searchParams.get("type")]
            : currentUrl.pathname.endsWith("/project-detail.html")
                ? "projects.html"
                : currentUrl.pathname.endsWith("/product-detail.html")
                    ? "booking.html"
                    : null;
        const activePath = detailTarget
            ? `${currentUrl.pathname.slice(0, currentUrl.pathname.lastIndexOf("/") + 1)}${detailTarget}`
            : currentUrl.pathname;
        const links = [...sidebar.querySelectorAll(".nav-link")];
        const matchingLinks = links.filter((link) => new URL(link.href, window.location.href).pathname === activePath);
        const currentType = currentUrl.searchParams.get("type") || "management";
        const activeLink = currentUrl.pathname.endsWith("/team.html")
            ? matchingLinks.find((link) => new URL(link.href, window.location.href).searchParams.get("type") === currentType) || matchingLinks[0]
            : (currentUrl.hash && matchingLinks.find((link) => new URL(link.href, window.location.href).hash === currentUrl.hash))
                || matchingLinks.find((link) => !new URL(link.href, window.location.href).hash)
                || matchingLinks[0]
                || [...sidebar.querySelectorAll(".sidebar-support")].find((link) => new URL(link.href, window.location.href).pathname === currentUrl.pathname);

        if (!activeLink) return;
        links.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
        });
        activeLink.classList.add("is-active");
        activeLink.setAttribute("aria-current", "page");
        const activeGroup = activeLink.closest("details.nav-group");
        sidebar.querySelectorAll("details.nav-group").forEach((group) => {
            group.open = group === activeGroup;
        });
    }

    syncActiveNavigation();
    window.addEventListener("hashchange", syncActiveNavigation);
})();

(() => {
    const button = document.querySelector(".password-toggle");
    const input = document.querySelector("#password");
    if (!button || !input) return;
    button.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute("aria-label", show ? "\u1ea8n m\u1eadt kh\u1ea9u" : "Hi\u1ec7n m\u1eadt kh\u1ea9u");
        button.innerHTML = `<i class="fa-regular fa-eye${show ? "-slash" : ""}" aria-hidden="true"></i>`;
    });
})();

/* Merged from appointment-store.js; retained as a page-guarded interaction. */
(() => {
    const source = document.querySelector("#appointmentExamples");
    if (!source) return;

    function all() {
        return [...source.querySelectorAll("[data-id]")].map((element) => ({ ...element.dataset }));
    }

    function dateInput(daysAhead, hour, minute = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        date.setHours(hour, minute, 0, 0);
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function replace(items) {
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "appointment", records: items },
        }));
        return false;
    }

    window.LandiformAppointments = Object.freeze({ all, replace, dateInput });
})();

/* Merged from customer-detail.js; retained as a page-guarded interaction. */
(() => {
    const root = document.querySelector("#customerDetail");
    if (!root) return;

    const requestedProfile = new URLSearchParams(window.location.search).get("id") || "anh";
    const profileNodes = [...root.querySelectorAll("[data-profile]")];
    const profileId = profileNodes.some((node) => node.dataset.profile === requestedProfile)
        ? requestedProfile
        : "anh";

    document.body.dataset.customerProfile = profileId;
    profileNodes.forEach((node) => {
        node.hidden = node.dataset.profile !== profileId;
    });

    const status = root.querySelector(`#customerStatusBadge [data-profile="${profileId}"]`);
    const owner = root.querySelector(`#customerOwner [data-profile="${profileId}"]`);
    const statusSelect = root.querySelector("#customerStatus");
    const ownerSelect = root.querySelector("#customerAssignee");

    if (status && statusSelect) statusSelect.value = status.textContent.trim();
    if (owner && ownerSelect) ownerSelect.value = owner.textContent.trim();
})();

/* Merged from chart-tooltips.js; retained as a page-guarded interaction. */
(() => {
    const formatNumber = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
    const numericValue = (value) => Number(String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

    function addTooltip(target, message) {
        if (!target || !message) return;
        target.classList.add("chart-hover-tip");
        target.dataset.chartTip = message;
        target.title = message;
        target.tabIndex = 0;
        target.setAttribute("role", "img");
        target.setAttribute("aria-label", message);
    }

    document.querySelectorAll("#barChart .bar-group").forEach((group) => {
        const month = group.querySelector(":scope > span")?.textContent.trim() || "Tháng";
        group.querySelectorAll(":scope > .bar").forEach((bar) => {
            const series = bar.classList.contains("current") ? "Năm nay" : "Năm trước";
            const height = Number.parseFloat(bar.style.getPropertyValue("--height")) || 0;
            const value = Number(bar.dataset.chartValue ?? Math.round(height * 2));
            const detail = value ? `${formatNumber.format(value)} khách quan tâm` : "Chưa có dữ liệu";
            addTooltip(bar, bar.dataset.chartTip || `${month} · ${series}: ${detail}`);
        });
    });

    document.querySelectorAll(".funnel-panel .funnel-row").forEach((row) => {
        const total = numericValue(row.closest(".funnel-panel")?.querySelector(".funnel-total strong")?.textContent);
        const stage = row.querySelector(".funnel-meta > span")?.textContent.trim() || "Trạng thái";
        const value = numericValue(row.querySelector(".funnel-meta > strong")?.textContent);
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(row, `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng số khách`);
    });

    document.querySelectorAll(".report-funnel > div").forEach((row) => {
        const rows = [...row.parentElement.children];
        const total = numericValue(rows[0]?.querySelector("b")?.textContent);
        const stage = row.querySelector("span")?.textContent.trim() || "Giai đoạn";
        const value = numericValue(row.querySelector("b")?.textContent);
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(row, `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng lượt đăng ký`);
    });

    document.querySelectorAll(".screen-bar-row").forEach((row) => {
        const label = row.querySelector(":scope > span")?.textContent.trim() || "Chỉ số";
        const value = row.querySelector(":scope > strong")?.textContent.trim() || "";
        addTooltip(row, `${label}: ${value}`);
    });
})();

/* Merged from platform.js; retained as a page-guarded interaction. */
(() => {
    const modal = document.querySelector("#tenantModal");
    const form = document.querySelector("#tenantForm");
    const tbody = document.querySelector("#tenantTableBody");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !tbody) return;

    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document.querySelector("[data-tenant-open]")?.addEventListener("click", () => {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    });
    document.querySelectorAll("[data-tenant-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        close();
        notify("Biểu mẫu sẵn sàng kết nối backend để tạo doanh nghiệp.");
    });
})();

/* Merged from support.js; retained as a page-guarded interaction. */
(() => {
    const form = document.querySelector("#supportForm");
    const success = document.querySelector("#supportSuccess");
    if (!form || !success) return;

    const fields = form.elements;
    function updateReplyRequirements() {
        fields.email.required = fields.replyVia.value !== "Điện thoại";
        fields.phone.required = fields.replyVia.value === "Điện thoại";
    }
    fields.replyVia.addEventListener("change", updateReplyRequirements);
    updateReplyRequirements();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (!fields.email.value.trim() && !fields.phone.value.trim()) return;
        form.hidden = true;
        success.hidden = false;
        success.querySelector("h3").textContent = `Đã hoàn tất yêu cầu: ${fields.subject.value.trim()}`;
    });

    document.querySelector("#supportAgain")?.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        fields.subject.value = "";
        fields.description.value = "";
        fields.category.value = "";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        fields.category.focus();
    });
})();
