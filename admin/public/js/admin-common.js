(() => {
    const sidebar = document.querySelector("#sidebar[data-admin-shared-shell]");
    const topbar = document.querySelector("[data-admin-shared-topbar]");
    if (!sidebar || !topbar) return;

    const inPages = location.pathname.includes("/admin/pages/");
    const route = (file) => `${inPages ? "" : "pages/"}${file}`;
    const overview = inPages ? "../index.html" : "index.html";
    const documentTitle = document.title.split("|")[0].trim();
    const title = topbar.dataset.pageLabel === "Chi tiết" ? documentTitle : (topbar.dataset.pageLabel || documentTitle);
    const icon = (name) => `<i class="fa-solid ${name}" aria-hidden="true"></i>`;

    sidebar.innerHTML = `
        <a class="brand" href="${overview}" aria-label="LANDIFORM - Tổng quan">
            <span class="brand-mark">${icon("fa-city")}</span><span class="brand-name">LANDI<span>FORM</span></span>
        </a>
        <div class="workspace-switch" role="group" aria-label="Không gian làm việc hiện tại">
            <span class="workspace-avatar">AP</span><span class="workspace-copy"><strong>An Phát Land</strong><small>Chi nhánh Hồ Chí Minh</small></span>
        </div>
        <nav class="main-nav sidebar-overview" aria-label="Tổng quan"><a class="nav-link" href="${overview}">${icon("fa-table-cells-large")}<span>Tổng quan</span></a></nav>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Dự án &amp; sản phẩm</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Dự án và sản phẩm">
            <a class="nav-link" href="${route("projects.html")}"><span>Dự án</span></a>
            <a class="nav-link" href="${route("categories.html")}"><span>Danh mục sản phẩm</span></a>
            <a class="nav-link" href="${route("booking.html")}"><span>Sản phẩm dự án</span></a>
        </nav></details>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Khách hàng &amp; tiếp thị</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Khách hàng và tiếp thị">
            <a class="nav-link" href="${route("leads.html")}"><span>Khách hàng tiềm năng</span></a>
            <a class="nav-link" href="${route("forms.html")}"><span>Biểu mẫu &amp; mã QR</span></a>
            <a class="nav-link" href="${route("campaigns.html")}"><span>Chiến dịch tiếp thị</span></a>
        </nav></details>
        <nav class="main-nav sidebar-overview" aria-label="Lịch hẹn và công việc"><a class="nav-link" href="${route("workflow.html")}">${icon("fa-calendar-check")}<span>Công việc &amp; lịch hẹn</span></a></nav>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Giao dịch &amp; bàn giao</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Giao dịch và bàn giao">
            <a class="nav-link" href="${route("reservations.html")}"><span>Lịch hẹn tư vấn</span></a>
            <a class="nav-link" href="${route("buyers.html")}"><span>Người mua &amp; bàn giao</span></a>
        </nav></details>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Đội ngũ</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Đội ngũ">
            <a class="nav-link" href="${route("team.html?type=management")}"><span>Admin</span></a>
            <a class="nav-link" href="${route("team.html?type=employee")}"><span>Nhân viên</span></a>
        </nav></details>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Báo cáo</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Báo cáo">
            <a class="nav-link" href="${route("reports.html")}"><span>Báo cáo hoạt động</span></a>
            <a class="nav-link" href="${route("staff-reports.html")}"><span>Báo cáo nhân viên</span></a>
        </nav></details>
        <details class="nav-group"><summary class="nav-label"><span class="nav-label-text">Hệ thống</span>${icon("fa-chevron-down")}</summary><nav class="main-nav" aria-label="Thiết lập hệ thống">
            <a class="nav-link" href="${route("permissions.html")}"><span>Phân quyền</span></a>
            <a class="nav-link" href="${route("settings.html")}"><span>Thông tin doanh nghiệp</span></a>
        </nav></details>
        <div class="sidebar-bottom">
            <a class="sidebar-support" href="${route("support.html")}">${icon("fa-circle-question")}<span>Trung tâm hỗ trợ</span>${icon("fa-arrow-up-right-from-square")}</a>
            <div class="sidebar-account-actions"><a class="account-switch" href="${route("account.html")}" aria-label="Mở thông tin tài khoản"><span class="account-avatar">MA</span><span class="account-copy"><strong>Minh Anh</strong><small>Quản lý kinh doanh</small></span>${icon("fa-gear")}</a></div>
        </div>`;

    if (location.pathname.endsWith("/support.html")) {
        const supportLink = sidebar.querySelector(".sidebar-support");
        supportLink?.classList.add("is-active");
        supportLink?.setAttribute("aria-current", "page");
    }

    topbar.innerHTML = `
        <button class="icon-button mobile-menu" id="menuToggle" type="button" aria-label="Mở menu" aria-expanded="false">${icon("fa-bars")}</button>
        <div class="breadcrumbs"><span>An Phát Land</span>${icon("fa-chevron-right")}<strong>${title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])}</strong></div>
        <div class="topbar-actions"><label class="global-search">${icon("fa-magnifying-glass")}<input id="globalSearch" type="search" placeholder="Tìm trong trang này..." aria-label="Tìm trong trang hiện tại" /></label><a class="icon-button notification-button" href="${route("workflow.html")}" aria-label="Mở thông báo"><i class="fa-solid fa-bell" aria-hidden="true"></i><span></span></a><a class="topbar-avatar" href="${route("account.html")}" aria-label="Mở thông tin tài khoản">MA</a></div>`;

    document.querySelectorAll("[data-admin-shared-footer]").forEach((footer) => {
        footer.innerHTML = `<span>LANDIFORM · An Phát Land</span><span>${title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])}</span><a href="${route("support.html")}">Trung tâm hỗ trợ</a>`;
    });
})();


(() => {
    // The prototype updates the current view in memory. Page scripts own actions;
    // reload restores the sample markup and no action writes to browser storage.
    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const search = document.querySelector("#globalSearch");
    const toast = document.querySelector("#toastMessage");
    let toastTimer;

    function refreshAdminCompanyBranding() {
        try {
            const saved = JSON.parse(null || "null");
            const name = saved?.fields?.displayName?.trim() || "An Phát Land";
            document.querySelectorAll(".workspace-copy strong").forEach((element) => { element.textContent = name; });
            document.querySelectorAll(".workspace-avatar").forEach((avatar) => {
                if (saved?.logo) {
                    const image = document.createElement("img");
                    image.src = saved.logo;
                    image.alt = "";
                    avatar.replaceChildren(image);
                } else {
                    avatar.textContent = name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi") || "AP";
                }
            });
        } catch { /* Use the default workspace name and initials. */ }
    }

    refreshAdminCompanyBranding();
    window.refreshAdminCompanyBranding = refreshAdminCompanyBranding;

    function refreshAdminAccount() {
        let account = { name: "Minh Anh", role: "Quản lý kinh doanh" };
        try {
            const saved = JSON.parse(null || "null");
            if (saved && typeof saved === "object") account = { ...account, ...saved };
        } catch { /* Keep the demo account shown in the page. */ }
        const initials = String(account.name || "Minh Anh").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi") || "MA";
        document.querySelectorAll(".account-copy strong").forEach((element) => { element.textContent = account.name || "Minh Anh"; });
        document.querySelectorAll(".account-copy small").forEach((element) => { element.textContent = account.role || "Quản lý kinh doanh"; });
        document.querySelectorAll(".account-avatar").forEach((element) => { element.textContent = initials; });
        document.querySelectorAll(".topbar-avatar").forEach((element) => { element.textContent = initials; });
    }

    refreshAdminAccount();
    window.refreshAdminAccount = refreshAdminAccount;

    function addAccountNavigation() {
        const nav = document.querySelector('.nav-group nav[aria-label="Thiết lập hệ thống"]');
        if (!nav) return;
        const link = document.createElement("a");
        link.className = "nav-link";
        link.href = location.pathname.includes("/pages/") ? "account.html" : "pages/account.html";
        link.innerHTML = '<i class="fa-solid fa-circle-user" aria-hidden="true"></i><span>Tài khoản cá nhân</span>';
        if (location.pathname.endsWith("/account.html")) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
        }
        nav.append(link);
    }

    addAccountNavigation();

    function addGuideNavigation() {
        const nav = document.querySelector('.nav-group nav[aria-label="Kinh doanh"]');
        if (!nav) return;
        const link = document.createElement("a");
        link.className = "nav-link";
        link.href = location.pathname.includes("/pages/") ? "articles.html" : "pages/articles.html";
        link.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Cẩm nang</span>';
        const isActive = location.pathname.endsWith("/articles.html");
        if (isActive) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
            nav.closest(".nav-group")?.setAttribute("open", "");
        }
        nav.append(link);
    }

    addGuideNavigation();

    function initializeBranchSwitcher() {
        const switcher = document.querySelector(".workspace-switch");
        if (!switcher || switcher.dataset.branchSwitcherReady) return;
        switcher.dataset.branchSwitcherReady = "true";
        switcher.setAttribute("role", "button");
        switcher.setAttribute("tabindex", "0");
        switcher.setAttribute("aria-haspopup", "menu");
        switcher.setAttribute("aria-expanded", "false");
        switcher.setAttribute("aria-label", "Chọn chi nhánh hoặc phạm vi hệ thống");

        const copy = switcher.querySelector(".workspace-copy");
        const company = copy?.querySelector("strong");
        const subtitle = copy?.querySelector("small");
        if (!copy || !company || !subtitle) return;
        subtitle.textContent = "Chi nhánh Hồ Chí Minh";

        const arrow = document.createElement("i");
        arrow.className = "fa-solid fa-chevron-down workspace-switch-arrow";
        arrow.setAttribute("aria-hidden", "true");
        switcher.append(arrow);

        const menu = document.createElement("div");
        menu.className = "workspace-branch-menu";
        menu.setAttribute("role", "menu");
        menu.hidden = true;
        switcher.insertAdjacentElement("afterend", menu);

        function getOptions() {
            let branches = [];
            try {
                const saved = JSON.parse(null || "null");
                if (Array.isArray(saved)) branches = saved.filter((branch) => branch && branch.id).map((branch) => ({
                    id: branch.id,
                    label: [branch.name || "Chi nhánh", branch.city].filter(Boolean).join(" · "),
                }));
            } catch { /* Show the two configured demo branches below. */ }
            if (!branches.length) branches = [
                { id: "hcm", label: "Chi nhánh Hồ Chí Minh" },
                { id: "hanoi", label: "Chi nhánh Hà Nội" },
            ];
            if (!branches.some((branch) => /hà nội/i.test(branch.label))) {
                branches.push({ id: "hanoi", label: "Chi nhánh Hà Nội" });
            }
            return [...branches, { id: "all", label: "Toàn bộ hệ thống" }];
        }

        function closeMenu() {
            menu.hidden = true;
            switcher.setAttribute("aria-expanded", "false");
            switcher.classList.remove("is-open");
        }

        function renderMenu() {
            let selectedId = "hcm";
            try { selectedId = null || selectedId; } catch { /* Use Hồ Chí Minh. */ }
            const options = getOptions();
            if (!options.some((option) => option.id === selectedId)) selectedId = options[0].id;
            menu.replaceChildren(...options.map((option) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "workspace-branch-option";
                button.setAttribute("role", "menuitemradio");
                button.setAttribute("aria-checked", String(option.id === selectedId));
                button.textContent = option.label;
                if (option.id === selectedId) button.classList.add("is-selected");
                button.addEventListener("click", () => {
                    try { void 0; } catch { /* Keep the selected branch for this page. */ }
                    subtitle.textContent = option.label;
                    switcher.dataset.branchScope = option.id;
                    document.body.dataset.branchScope = option.id;
                    document.dispatchEvent(new CustomEvent("landiform:branch-change", { detail: { id: option.id, label: option.label } }));
                    closeMenu();
                });
                return button;
            }));
            const active = options.find((option) => option.id === selectedId);
            subtitle.textContent = active?.label || "Chi nhánh Hồ Chí Minh";
            switcher.dataset.branchScope = selectedId;
            document.body.dataset.branchScope = selectedId;
        }

        function toggleMenu() {
            if (!menu.hidden) return closeMenu();
            renderMenu();
            const rect = switcher.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
            menu.hidden = false;
            switcher.classList.add("is-open");
            switcher.setAttribute("aria-expanded", "true");
        }

        switcher.addEventListener("click", toggleMenu);
        switcher.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleMenu(); }
            if (event.key === "Escape") closeMenu();
        });
        document.addEventListener("click", (event) => {
            if (!switcher.contains(event.target) && !menu.contains(event.target)) closeMenu();
        });
        document.querySelector("#sidebar")?.addEventListener("scroll", closeMenu, { passive: true });
        renderMenu();
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
        logout.addEventListener("click", () => {
            try { void 0; } catch { /* Không có phiên lưu trên trình duyệt. */ }
        });
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
        const existingButton = document.querySelector(".notification-button");
        if (!existingButton || existingButton.matches("[data-booking-alert-toggle]") || existingButton.dataset.notificationsReady) return;
        existingButton.dataset.notificationsReady = "true";
        const notificationStyles = document.createElement("link");
        notificationStyles.rel = "stylesheet";
        notificationStyles.href = location.pathname.includes("/pages/") ? "../public/css/notifications.css?v=20261027-notifications-v1" : "public/css/notifications.css?v=20261027-notifications-v1";
        document.head.append(notificationStyles);
        const center = document.createElement("div");
        center.className = "notification-center";
        existingButton.replaceWith(center);
        const button = document.createElement("button");
        button.type = "button";
        button.className = existingButton.className;
        button.setAttribute("aria-label", "Mở thông báo");
        button.setAttribute("aria-haspopup", "dialog");
        button.setAttribute("aria-expanded", "false");
        button.innerHTML = existingButton.innerHTML;
        const indicator = button.querySelector("span");
        if (indicator) indicator.className = "notification-count";
        center.append(button);
        const panel = document.createElement("section");
        panel.className = "notification-popover";
        panel.hidden = true;
        panel.setAttribute("aria-label", "Thông báo");
        panel.innerHTML = '<header class="notification-popover-head"><div><strong>Thông báo</strong><small data-notification-summary></small></div><button type="button" data-notification-read>Đánh dấu đã đọc</button></header><div class="notification-list" data-notification-list></div><a class="notification-footer" href="' + (location.pathname.includes("/pages/") ? "workflow.html" : "pages/workflow.html") + '">Mở công việc & lịch hẹn <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
        center.append(panel);
        const list = panel.querySelector("[data-notification-list]");
        const summary = panel.querySelector("[data-notification-summary]");
        const readKey = "landiform.admin.notifications.read.v1";

        function readJson(key, fallback) {
            try {
                const value = JSON.parse(null || "null");
                return value ?? fallback;
            } catch { return fallback; }
        }

        function getNotifications() {
            const notifications = [];
            const leads = readJson("landiform.admin.leads.v1", []);
            if (Array.isArray(leads)) leads.filter((lead) => lead?.name && ["Chưa liên hệ", "Chưa gọi"].includes(lead.status)).slice(0, 3).forEach((lead) => {
                notifications.push({ id: `lead-${lead.id}`, icon: "fa-user-plus", tone: "blue", title: "Khách hàng cần liên hệ", detail: `${lead.name}${lead.project ? ` · ${lead.project}` : ""}`, href: `customer-detail.html?id=${encodeURIComponent(lead.id)}` });
            });
            const tasks = readJson("landiform.admin.tasks.v1", []);
            if (Array.isArray(tasks)) tasks.filter((task) => task?.title && !["Hoàn tất", "Đã hủy"].includes(task.status)).slice(0, 3).forEach((task) => {
                const due = task.deadline ? new Date(task.deadline) : null;
                const detail = [task.assignee, due && !Number.isNaN(due.getTime()) ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(due) : "Chưa đặt hạn"].filter(Boolean).join(" · ");
                notifications.push({ id: `task-${task.id || task.title}`, icon: "fa-list-check", tone: "amber", title: task.title, detail: `Công việc cần xử lý · ${detail}`, href: location.pathname.includes("/pages/") ? "workflow.html" : "pages/workflow.html" });
            });
            const appointments = readJson("landiform.admin.appointments.v1", []);
            if (Array.isArray(appointments)) appointments.filter((item) => item?.customerName && !["Hoàn tất", "Đã hủy"].includes(item.status) && new Date(item.start).getTime() >= Date.now()).slice(0, 3).forEach((item) => {
                const when = new Date(item.start);
                notifications.push({ id: `appointment-${item.id}`, icon: "fa-calendar-check", tone: "violet", title: `Lịch hẹn: ${item.customerName}`, detail: `${item.type || "Tư vấn"} · ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(when)}`, href: location.pathname.includes("/pages/") ? "workflow.html#appointments" : "pages/workflow.html#appointments" });
            });
            return notifications.slice(0, 7);
        }

        function render() {
            const notifications = getNotifications();
            const read = new Set(readJson(readKey, []));
            const unreadCount = notifications.filter((item) => !read.has(item.id)).length;
            if (indicator) {
                indicator.textContent = unreadCount ? String(unreadCount > 9 ? "9+" : unreadCount) : "";
                indicator.hidden = unreadCount === 0;
            }
            button.setAttribute("aria-label", unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo");
            summary.textContent = unreadCount ? `${unreadCount} thông báo chưa đọc` : "Bạn đã xem hết thông báo";
            list.replaceChildren();
            if (!notifications.length) {
                const empty = document.createElement("p");
                empty.className = "notification-empty";
                empty.textContent = "Chưa có thông báo mới. Thông báo về khách hàng, công việc và lịch hẹn sẽ hiện ở đây.";
                list.append(empty);
                return;
            }
            notifications.forEach((notification) => {
                const link = document.createElement("a");
                link.className = `notification-item${read.has(notification.id) ? " is-read" : ""}`;
                link.href = location.pathname.includes("/pages/") ? notification.href : notification.href.replace(/^customer-detail\.html/, "pages/customer-detail.html").replace(/^workflow\.html/, "pages/workflow.html");
                link.dataset.notificationId = notification.id;
                const icon = document.createElement("span");
                icon.className = `notification-item-icon ${notification.tone}`;
                icon.innerHTML = `<i class="fa-solid ${notification.icon}" aria-hidden="true"></i>`;
                const content = document.createElement("span");
                content.className = "notification-item-copy";
                const title = document.createElement("strong");
                title.textContent = notification.title;
                const detail = document.createElement("small");
                detail.textContent = notification.detail;
                content.append(title, detail);
                link.append(icon, content);
                list.append(link);
            });
        }

        function setRead(ids) {
            const read = new Set(readJson(readKey, []));
            ids.forEach((id) => read.add(id));
            try { void 0; } catch { /* Keep the panel usable when storage is unavailable. */ }
            render();
        }

        button.addEventListener("click", () => {
            const willOpen = panel.hidden;
            panel.hidden = !willOpen;
            button.setAttribute("aria-expanded", String(willOpen));
            if (willOpen) render();
        });
        panel.addEventListener("click", (event) => {
            const link = event.target.closest("[data-notification-id]");
            if (!link) return;
            const notificationId = link.dataset.notificationId;
            setTimeout(() => setRead([notificationId]), 0);
        });
        panel.querySelector("[data-notification-read]").addEventListener("click", () => setRead(getNotifications().map((item) => item.id)));
        document.addEventListener("click", (event) => {
            if (!center.contains(event.target)) {
                panel.hidden = true;
                button.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !panel.hidden) {
                panel.hidden = true;
                button.setAttribute("aria-expanded", "false");
                button.focus();
            }
        });
        window.addEventListener("storage", (event) => {
            if (!event.key || event.key.startsWith("landiform.admin.")) render();
        });
        render();
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
    function findGroup(sidebar, names) {
        return [...sidebar.querySelectorAll("details.nav-group")].find((item) =>
            names.some((name) => item.querySelector(".nav-label")?.textContent.trim().startsWith(name))
        );
    }

    function setGroupLabel(group, label) {
        const summary = group?.querySelector(".nav-label");
        const labelElement = summary?.querySelector(".nav-label-text");
        if (labelElement) {
            labelElement.textContent = label;
            return;
        }
        const textNode = [...(summary?.childNodes || [])].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = label;
    }

    function syncGroupHeadingIcons() {
        document.querySelectorAll(".sidebar details.nav-group").forEach((group) => {
            const summary = group.querySelector(".nav-label");
            if (!summary) return;
            let label = summary.querySelector(".nav-label-text");
            if (!label) {
                const textNode = [...summary.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                if (!textNode) return;
                label = document.createElement("span");
                label.className = "nav-label-text";
                label.textContent = textNode.textContent.trim();
                textNode.replaceWith(label);
            }
            const paths = [...group.querySelectorAll(".main-nav .nav-link")].map((link) => new URL(link.href, window.location.href).pathname);
            const hasPage = (page) => paths.some((path) => path.endsWith(`/${page}`));
            const iconName = hasPage("projects.html") ? "fa-building"
                : hasPage("leads.html") ? "fa-user-group"
                : hasPage("buyers.html") ? "fa-handshake"
                : hasPage("team.html") ? "fa-users"
                : hasPage("reports.html") ? "fa-chart-pie"
                : hasPage("settings.html") || hasPage("permissions.html") ? "fa-gear"
                : "";
            if (iconName) {
                let icon = summary.querySelector(".nav-label-icon");
                if (!icon) {
                    icon = document.createElement("i");
                    icon.className = "nav-label-icon";
                    icon.setAttribute("aria-hidden", "true");
                    summary.insertBefore(icon, label);
                }
                icon.className = `nav-label-icon fa-solid ${iconName}`;
            }
            const chevron = [...summary.querySelectorAll("i")].find((icon) => icon.classList.contains("fa-chevron-down"));
            chevron?.classList.add("nav-group-chevron");
        });
    }

    function syncProjectNavigation() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;
        const group = findGroup(sidebar, ["Danh mục dự án", "Dự án & sản phẩm"]);
        const nav = group?.querySelector(".main-nav");
        if (!group || !nav) return;

        const prefix = window.location.pathname.includes("/admin/pages/") ? "" : "pages/";
        const items = [
            ["projects.html", "Dự án", "fa-building"],
            ["categories.html", "Danh mục sản phẩm", "fa-layer-group"],
            ["booking.html", "Sản phẩm dự án", "fa-table-cells"],
        ];
        const currentPath = window.location.pathname;
        const activePath = currentPath.endsWith("/project-detail.html")
            ? `${currentPath.slice(0, currentPath.lastIndexOf("/") + 1)}projects.html`
            : currentPath.endsWith("/product-detail.html")
                ? `${currentPath.slice(0, currentPath.lastIndexOf("/") + 1)}booking.html`
                : currentPath;
        setGroupLabel(group, "Dự án & sản phẩm");
        nav.setAttribute("aria-label", "Dự án và sản phẩm");
        nav.replaceChildren(...items.map(([file, label, iconName]) => {
            const link = document.createElement("a");
            link.className = "nav-link";
            link.href = `${prefix}${file}`;
            if (new URL(link.href, window.location.href).pathname === activePath) {
                link.classList.add("is-active");
                link.setAttribute("aria-current", "page");
            }
            const icon = document.createElement("i");
            icon.className = `fa-solid ${iconName}`;
            icon.setAttribute("aria-hidden", "true");
            const text = document.createElement("span");
            text.textContent = label;
            link.append(icon, text);
            return link;
        }));
    }

    function syncCustomerNavigation() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;
        const group = findGroup(sidebar, ["Kinh doanh", "Khách hàng & tiếp thị", "Khách hàng"]);
        const nav = group?.querySelector(".main-nav");
        if (!group || !nav) return;

        const prefix = window.location.pathname.includes("/admin/pages/") ? "" : "pages/";
        const items = [
            ["leads.html", "Khách hàng tiềm năng", "fa-user-group"],
            ["forms.html", "Biểu mẫu & mã QR", "fa-qrcode"],
            ["campaigns.html", "Chiến dịch tiếp thị", "fa-user-plus"],
        ];
        setGroupLabel(group, "Khách hàng & tiếp thị");
        nav.setAttribute("aria-label", "Khách hàng và tiếp thị");
        nav.replaceChildren(...items.map(([file, label, iconName]) => {
            const link = document.createElement("a");
            link.className = "nav-link";
            link.href = `${prefix}${file}`;
            const icon = document.createElement("i");
            icon.className = `fa-solid ${iconName}`;
            icon.setAttribute("aria-hidden", "true");
            const text = document.createElement("span");
            text.textContent = label;
            link.append(icon, text);
            return link;
        }));
    }

    function syncSystemNavigation() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;
        const group = findGroup(sidebar, ["Hệ thống"]);
        const nav = group?.querySelector(".main-nav");
        if (!group || !nav) return;
        const prefix = window.location.pathname.includes("/admin/pages/") ? "" : "pages/";
        const existing = [...nav.querySelectorAll(".nav-link")].find((link) => new URL(link.href, window.location.href).pathname.endsWith("/articles.html"));
        const link = existing || document.createElement("a");
        link.className = "nav-link";
        link.href = `${prefix}articles.html`;
        if (!existing) {
            const text = document.createElement("span");
            text.textContent = "Cẩm nang";
            link.append(text);
            const settings = [...nav.querySelectorAll(".nav-link")].find((item) => new URL(item.href, window.location.href).pathname.endsWith("/settings.html"));
            if (settings) settings.after(link);
            else nav.append(link);
        }
        nav.setAttribute("aria-label", "Thiết lập hệ thống và nội dung");
    }

    function syncSubmenuIcons() {
        document.querySelectorAll(".sidebar details.nav-group .main-nav .nav-link i").forEach((icon) => icon.remove());
    }

    function organizeNavigation() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;
        const projectGroup = findGroup(sidebar, ["Dự án & sản phẩm"]);
        const customerGroup = findGroup(sidebar, ["Khách hàng & tiếp thị"]);
        const transactionGroup = findGroup(sidebar, ["Giao dịch & bàn giao"]);
        const workflowLink = [...sidebar.querySelectorAll(".sidebar-overview .nav-link")]
            .find((link) => new URL(link.href, window.location.href).pathname.endsWith("/workflow.html"));
        const workflowNav = workflowLink?.closest("nav");
        if (projectGroup && customerGroup && transactionGroup && workflowNav) {
            projectGroup.after(customerGroup, workflowNav, transactionGroup);
        }
    }

    function syncAnalyticsNavigation() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;
        const group = findGroup(sidebar, ["Phân tích", "Báo cáo"]);
        const nav = group?.querySelector(".main-nav");
        if (!group || !nav) return;

        const prefix = window.location.pathname.includes("/admin/pages/") ? "" : "pages/";
        const items = [
            ["reports.html", "Báo cáo hoạt động"],
            ["staff-reports.html", "Báo cáo nhân viên"],
        ];
        const activePath = window.location.pathname;
        setGroupLabel(group, "Báo cáo");
        nav.setAttribute("aria-label", "Báo cáo");
        nav.replaceChildren(...items.map(([file, label]) => {
            const link = document.createElement("a");
            link.className = "nav-link";
            link.href = `${prefix}${file}`;
            if (new URL(link.href, window.location.href).pathname === activePath) {
                link.classList.add("is-active");
                link.setAttribute("aria-current", "page");
            }
            const text = document.createElement("span");
            text.textContent = label;
            link.append(text);
            return link;
        }));
    }

    function syncActiveNavigation() {
        syncProjectNavigation();
        syncCustomerNavigation();
        syncSystemNavigation();
        syncAnalyticsNavigation();
        syncGroupHeadingIcons();
        organizeNavigation();
        syncSubmenuIcons();
        const currentUrl = new URL(window.location.href);
        const links = Array.from(document.querySelectorAll(".sidebar .nav-link"));
        const detailAliases = {
            category: "categories.html",
            form: "forms.html",
            buyer: "buyers.html",
            appointment: "workflow.html",
        };
        const detailTarget = currentUrl.pathname.endsWith("/record-detail.html")
            ? detailAliases[currentUrl.searchParams.get("type")]
            : null;
        const activePath = detailTarget
            ? `${currentUrl.pathname.slice(0, currentUrl.pathname.lastIndexOf("/") + 1)}${detailTarget}`
            : currentUrl.pathname;
        const matchingLinks = links.filter((link) => new URL(link.href).pathname === activePath);
        const currentType = currentUrl.searchParams.get("type") || "management";
        const teamLink = currentUrl.pathname.endsWith("/team.html")
            ? matchingLinks.find((link) => new URL(link.href).searchParams.get("type") === currentType)
            : null;
        const activeLink =
            teamLink ||
            (currentUrl.hash && matchingLinks.find((link) => new URL(link.href).hash === currentUrl.hash)) ||
            matchingLinks.find((link) => !new URL(link.href).hash) ||
            matchingLinks[0] ||
            links.find((link) => link.classList.contains("is-active"));

        if (!activeLink) return;
        links.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
        });
        activeLink.classList.add("is-active");
        activeLink.setAttribute("aria-current", "page");

        const activeGroup = activeLink.closest("details.nav-group");
        document.querySelectorAll(".sidebar details.nav-group").forEach((group) => {
            group.open = group === activeGroup;
        });
    }

    syncActiveNavigation();
    // Sidebar markup differs slightly between legacy pages. Finish normalizing
    // its groups and active state before revealing it to avoid visible reflow.
    document.querySelector(".sidebar")?.classList.add("nav-ready");
    window.addEventListener("hashchange", syncActiveNavigation);
})();


