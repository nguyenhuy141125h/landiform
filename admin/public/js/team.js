(() => {
    const modal = document.querySelector("#staffModal");
    const form = document.querySelector("#staffForm");
    const tbody = document.querySelector("#staffTableBody");
    const toast = document.querySelector("#toastMessage");
    const roleSelect = document.querySelector("#staffRole");
    const accountTypeSelect = document.querySelector("#staffAccountType");
    const roleHint = document.querySelector("#staffRoleHint");
    if (!modal || !form || !tbody || !roleSelect || !accountTypeSelect) return;

    const staffKey = "landiform.admin.team.v1";
    const customRolesKey = "landiform.admin.roles.v1";
    const projectNames = {
        "AP-026": "An Phú Riverside",
        "GV-014": "Green Valley",
        "CP-008": "Central Park Towers",
        "LG-031": "Lumière Garden",
    };
    const groupLabels = { management: "Quản lý", employee: "Nhân viên", customer: "Khách hàng" };
    const builtInRoles = {
        admin: { name: "Quản trị doanh nghiệp", group: "management", status: "active" },
        manager: { name: "Quản lý kinh doanh", group: "management", status: "active" },
        leader: { name: "Ban lãnh đạo", group: "management", status: "active" },
        advisor: { name: "Nhân viên tư vấn", group: "employee", status: "active" },
        marketing: { name: "Marketing", group: "employee", status: "active" },
        care: { name: "Chăm sóc khách hàng", group: "employee", status: "active" },
        operation: { name: "Vận hành", group: "employee", status: "active" },
        customer: { name: "Khách hàng", group: "customer", status: "active" },
    };
    let roles = { ...builtInRoles };
    let staff = [];
    let transientStaff = [];
    let toastTimer;

    function paintLoginPermission(button, allowed) {
        button.classList.toggle("is-allowed", allowed);
        button.classList.toggle("is-blocked", !allowed);
        button.setAttribute("aria-pressed", String(allowed));
        button.innerHTML = allowed
            ? '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> Được phép'
            : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Đã khóa';
    }


    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function readRoles() {
        try {
            const custom = JSON.parse(null || "{}");
            if (custom && typeof custom === "object" && !Array.isArray(custom)) {
                Object.entries(custom).forEach(([id, role]) => {
                    if (!role?.name) return;
                    roles[id] = { ...role, group: groupLabels[role.group] ? role.group : "employee", status: role.status === "inactive" ? "inactive" : "active" };
                });
            }
        } catch { /* Built-in positions remain available without browser storage. */ }
    }

    function roleFor(person) {
        if (person.roleId && roles[person.roleId]) return person.roleId;
        return Object.keys(roles).find((id) => roles[id].name === person.role) || (person.role === "Quản trị doanh nghiệp" ? "admin" : "advisor");
    }

    function getScopes(person) {
        const raw = Array.isArray(person.scopes) ? person.scopes : (Array.isArray(person.scope) ? person.scope : [person.scope || "Toàn doanh nghiệp"]);
        const scopes = [...new Set(raw.flatMap((value) => String(value || "").split(/\s*[·,;]\s*/)).filter(Boolean))];
        return scopes.includes("Toàn doanh nghiệp") ? ["Toàn doanh nghiệp"] : scopes;
    }

    function scopeLabel(person) { return getScopes(person).join(" · "); }

    function updateScopePicker(picker, checkedInput) {
        if (!picker || !checkedInput) return;
        const inputs = [...picker.querySelectorAll('input[name="scopeOptions"]')];
        const all = inputs.find((input) => input.value === "Toàn doanh nghiệp");
        const projects = inputs.filter((input) => input !== all);
        if (checkedInput === all) {
            projects.forEach((input) => { input.checked = all.checked; });
            return;
        }
        if (all) all.checked = projects.length > 0 && projects.every((input) => input.checked);
    }

    function selectedScopes(picker) {
        return [...picker.querySelectorAll('input[name="scopeOptions"]:checked')].map((input) => input.value);
    }

    function loadStaff() {
        return [];
    }

    function populateRoleFilter() {
        const select = document.querySelector("[data-staff-role-filter]");
        if (!select) return;
        const selected = select.value;
        const group = document.querySelector("[data-staff-type-filter]")?.value || "";
        select.replaceChildren(new Option("Tất cả chức vụ", ""));
        Object.entries(roles)
            .filter(([, role]) => !group || role.group === group)
            .forEach(([id, role]) => select.add(new Option(role.name, id)));
        if ([...select.options].some((option) => option.value === selected)) select.value = selected;
    }

    function populateFormRoles(selected = "") {
        const group = accountTypeSelect.value;
        const choices = Object.entries(roles)
            .filter(([id, role]) => role.group === group && (role.status !== "inactive" || id === selected))
            .sort((a, b) => a[1].name.localeCompare(b[1].name, "vi"));
        roleSelect.replaceChildren(new Option(choices.length ? "Chọn chức vụ" : "Chưa có chức vụ trong nhóm này", ""));
        choices.forEach(([id, role]) => roleSelect.add(new Option(role.name, id)));
        if (selected && choices.some(([id]) => id === selected)) roleSelect.value = selected;
        updateRoleHint();
    }

    function updateRoleHint() {
        const role = roles[roleSelect.value];
        if (!roleHint) return;
        roleHint.replaceChildren();
        if (role) {
            const detail = document.createElement("span");
            const permissions = Array.isArray(role.permissions) ? role.permissions.length : role.locked ? "Toàn quyền" : "đã thiết lập";
            detail.textContent = `Chức vụ ${role.name} · ${typeof permissions === "number" ? `${permissions} quyền` : permissions}.`;
            const link = document.createElement("a");
            link.href = `permissions.html?role=${encodeURIComponent(roleSelect.value)}`;
            link.textContent = "Xem và cấp quyền";
            roleHint.append(detail, link);
            return;
        }
        const hasAvailableRole = [...roleSelect.options].some((option) => option.value);
        if (hasAvailableRole) {
            roleHint.textContent = "Chọn chức vụ để áp dụng đúng bộ quyền cho tài khoản.";
            return;
        }
        roleHint.append(document.createTextNode(`Nhóm ${groupLabels[accountTypeSelect.value]} chưa có chức vụ phù hợp. `));
        const link = document.createElement("a");
        link.href = `permissions.html?new=1&group=${encodeURIComponent(accountTypeSelect.value)}`;
        link.textContent = "Tạo chức vụ";
        roleHint.append(link);
    }

    function groupBadge(group) {
        const badge = document.createElement("span");
        badge.className = `screen-badge ${group === "management" ? "violet" : group === "customer" ? "amber" : "blue"}`;
        badge.textContent = groupLabels[group] || groupLabels.employee;
        return badge;
    }

    function renderRow(person) {
        const row = document.createElement("tr");
        row.dataset.staffId = person.id;
        row.dataset.roleId = person.roleId;
        row.dataset.accountType = person.accountType;
        row.dataset.roleGroup = roles[person.roleId]?.group || person.accountType;
        row.dataset.loginAllowed = String(person.loginAllowed !== false);

        const accountCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = `screen-entity-icon ${person.accountType === "management" ? "violet" : person.accountType === "customer" ? "amber" : "blue"}`;
        const iconElement = document.createElement("i");
        iconElement.className = person.accountType === "customer" ? "fa-solid fa-house-user" : person.accountType === "management" ? "fa-solid fa-user-tie" : "fa-solid fa-user";
        iconElement.setAttribute("aria-hidden", "true");
        icon.append(iconElement);
        const details = document.createElement("span");
        const name = document.createElement("a");
        name.className = "staff-name-link";
        name.href = `team-detail.html?id=${encodeURIComponent(person.id)}`;
        name.textContent = person.name;
        const email = document.createElement("small");
        email.textContent = person.email;
        details.append(name, email);
        entity.append(icon, details);
        accountCell.append(entity);

        const typeCell = document.createElement("td");
        typeCell.append(groupBadge(person.accountType));
        const roleCell = document.createElement("td");
        const roleName = document.createElement("strong");
        roleName.textContent = roles[person.roleId]?.name || person.role;
        roleCell.append(roleName);
        const scopeCell = document.createElement("td");
        scopeCell.textContent = scopeLabel(person);

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "staff-row-actions";
        const permissionLink = document.createElement("a");
        permissionLink.className = "staff-permission-link";
        permissionLink.href = `permissions.html?role=${encodeURIComponent(person.roleId)}`;
        permissionLink.innerHTML = '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Quyền';
        const editButton = document.createElement("a");
        editButton.className = "staff-edit-button";
        editButton.href = `team-detail.html?id=${encodeURIComponent(person.id)}`;
        editButton.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i> Sửa <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        const deleteButton = document.createElement("button");
        deleteButton.className = "staff-delete-button";
        deleteButton.type = "button";
        deleteButton.dataset.staffDeleteAction = "";
        deleteButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa';
        actions.append(permissionLink, editButton, deleteButton);
        actionCell.append(actions);

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = `screen-badge ${person.status === "Đang hoạt động" ? "green" : "neutral"}`;
        status.textContent = person.status;
        statusCell.append(status);

        const loginCell = document.createElement("td");
        const loginButton = document.createElement("button");
        loginButton.className = `staff-login-toggle ${person.loginAllowed === false ? "is-blocked" : "is-allowed"}`;
        loginButton.type = "button";
        loginButton.dataset.staffLoginToggle = "";
        loginButton.setAttribute("aria-pressed", String(person.loginAllowed !== false));
        loginButton.innerHTML = person.loginAllowed === false
            ? '<i class="fa-solid fa-lock" aria-hidden="true"></i> Đã khóa'
            : '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> Được phép';
        loginCell.append(loginButton);

        row.append(accountCell, typeCell, roleCell, scopeCell, actionCell, statusCell, loginCell);
        tbody.append(row);
    }

    function render() {
        if (tbody.dataset.staticDemo === "true") {
            const existingIds = new Set([...tbody.querySelectorAll("tr[data-staff-id]")].map((row) => row.dataset.staffId));
            transientStaff.filter((person) => !existingIds.has(person.id)).forEach((person) => tbody.append(renderRow(person)));
            updateCounts();
            applyFilters();
            return;
        }
        tbody.replaceChildren();
        staff.forEach(renderRow);
        if (!staff.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 7;
            cell.className = "role-group-empty";
            cell.textContent = "Chưa có tài khoản. Hãy tạo chức vụ, cấp quyền rồi thêm tài khoản đầu tiên.";
            row.append(cell);
            tbody.append(row);
        }
        updateCounts();
        applyFilters();
    }

    function updateCounts() {
        const rows = [...tbody.querySelectorAll("tr[data-staff-id]")];
        const count = (group) => rows.filter((row) => row.dataset.roleGroup === group).length;
        document.querySelector("#staffTotal").textContent = String(rows.length);
        document.querySelector("#staffManagerCount").textContent = String(count("management"));
        document.querySelector("#staffEmployeeCount").textContent = String(count("employee"));
        document.querySelector("#staffCustomerCount").textContent = String(count("customer"));
    }

    function applyFilters() {
        const query = document.querySelector('[data-filter="team"]')?.value.trim().toLocaleLowerCase("vi") || "";
        const group = document.querySelector("[data-staff-type-filter]")?.value || "";
        const roleId = document.querySelector("[data-staff-role-filter]")?.value || "";
        tbody.querySelectorAll("tr[data-staff-id]").forEach((row) => {
            const matchesText = !query || row.textContent.toLocaleLowerCase("vi").includes(query);
            const matchesGroup = !group || row.dataset.roleGroup === group;
            const matchesRole = !roleId || row.dataset.roleId === roleId;
            row.hidden = !(matchesText && matchesGroup && matchesRole);
        });
    }

    function openCreate() {
        form.reset();
        accountTypeSelect.value = "employee";
        populateFormRoles();
        document.querySelector("#staffModalTitle").textContent = "Thêm tài khoản";
        document.querySelector("#staffModalDescription").textContent = "Chọn nhóm tài khoản và chức vụ để áp dụng đúng bộ quyền.";
        document.querySelector("[data-staff-submit]").textContent = "Lưu tài khoản";
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    function persist() {
        try { void 0; return true; }
        catch { notify("Không thể lưu tài khoản trên trình duyệt này."); return false; }
    }

    readRoles();
    try {
        const projects = JSON.parse(null || "[]");
        const picker = document.querySelector("#staffScopeOptions");
        if (Array.isArray(projects) && picker) projects.forEach((project) => {
            if (!project.name || [...picker.querySelectorAll('input[name="scopeOptions"]')].some((input) => input.value === project.name)) return;
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox"; input.name = "scopeOptions"; input.value = project.name;
            label.append(input, document.createTextNode(project.name)); picker.append(label);
        });
    } catch { /* Keep the default project scope choices. */ }
    staff = loadStaff();
    if (staff.length) {
        try { void 0; } catch { /* Keep normalized records in this page session. */ }
    }
    populateRoleFilter();
    const query = new URLSearchParams(location.search);
    const requestedType = query.get("type") || (query.get("new") === "1" ? "employee" : "management");
    const typeFilter = document.querySelector("[data-staff-type-filter]");
    if (["management", "employee", "customer"].includes(requestedType) && typeFilter) {
        typeFilter.value = requestedType;
    }
    populateRoleFilter();
    render();
    if (tbody.dataset.staticDemo === "true") {
        tbody.querySelectorAll("tr[data-staff-id]").forEach((row) => {
            const actionCell = row.querySelector("td:nth-child(5)");
            if (!actionCell || actionCell.querySelector("[data-staff-delete-action]")) return;
            const deleteButton = document.createElement("button");
            deleteButton.className = "staff-delete-button";
            deleteButton.type = "button";
            deleteButton.dataset.staffDeleteAction = "";
            deleteButton.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa';
            actionCell.append(" ", deleteButton);
        });
    }

    document.querySelector("[data-staff-open]")?.addEventListener("click", openCreate);
    if (new URLSearchParams(location.search).get("new") === "1") {
        openCreate();
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    accountTypeSelect.addEventListener("change", () => populateFormRoles());
    roleSelect.addEventListener("change", updateRoleHint);
    document.querySelector("#staffScopeOptions")?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="scopeOptions"]')) updateScopePicker(event.currentTarget, event.target);
    });
    document.querySelectorAll("[data-staff-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
    document.querySelector('[data-filter="team"]')?.addEventListener("input", applyFilters);
    document.querySelector("[data-staff-type-filter]")?.addEventListener("change", () => {
        populateRoleFilter();
        applyFilters();
    });
    document.querySelector("[data-staff-role-filter]")?.addEventListener("change", applyFilters);
    tbody.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-staff-delete-action]");
        if (deleteButton) {
            const row = deleteButton.closest("tr[data-staff-id]");
            const person = staff.find((item) => item.id === row?.dataset.staffId);
            const name = row?.querySelector(".screen-entity strong, .staff-name-link")?.textContent.trim() || person?.name || "nhân viên";
            if (!row || !window.confirm(`Xóa tài khoản ${name} khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục dữ liệu ví dụ.`)) return;
            if (tbody.dataset.staticDemo === "true") {
                row.remove();
                transientStaff = transientStaff.filter((item) => item.id !== row.dataset.staffId);
                updateCounts();
                applyFilters();
            } else {
                staff = staff.filter((item) => item.id !== row.dataset.staffId);
                persist();
                render();
            }
            notify(`Đã xóa ${name} khỏi danh sách hiện tại.`);
            return;
        }
        const toggle = event.target.closest("[data-staff-login-toggle]");
        if (!toggle) return;
        if (tbody.dataset.staticDemo === "true") {
            const previous = toggle.getAttribute("aria-pressed") !== "false";
            paintLoginPermission(toggle, !previous);
            notify(!previous ? "Đã cho phép tài khoản đăng nhập." : "Đã khóa quyền đăng nhập của tài khoản.");
            return;
        }
        const person = staff.find((item) => item.id === toggle.closest("tr")?.dataset.staffId);
        if (!person) return;
        const previous = person.loginAllowed !== false;
        person.loginAllowed = !previous;
        if (!persist()) { person.loginAllowed = previous; return; }
        render();
        notify(person.loginAllowed ? "Đã cho phép tài khoản đăng nhập." : "Đã khóa quyền đăng nhập của tài khoản.");
    });
    form.elements.email.addEventListener("input", () => form.elements.email.setCustomValidity(""));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const roleId = roleSelect.value;
        const role = roles[roleId];
        if (!role || role.group !== accountTypeSelect.value || role.status === "inactive") {
            notify("Hãy chọn một chức vụ đang hoạt động trong nhóm tài khoản này.");
            return;
        }
        const scopes = selectedScopes(document.querySelector("#staffScopeOptions"));
        if (!scopes.length) { notify("Chọn ít nhất một phạm vi phụ trách."); return; }
        const person = {
            id: `account-${Date.now()}`,
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim().toLocaleLowerCase("vi"),
            phone: form.elements.phone.value.trim(),
            accountType: role.group,
            roleId,
            role: role.name,
            scopes,
            scope: scopes.join(" · "),
            status: form.elements.status.value,
            loginAllowed: true,
        };
        if (staff.some((item) => (item.email || "").toLocaleLowerCase("vi") === person.email)) {
            form.elements.email.setCustomValidity("Email này đã được dùng cho một tài khoản khác.");
            form.reportValidity();
            return;
        }
        const previous = staff;
        staff = [...staff, person];
        if (!persist()) { staff = previous; return; }
        if (tbody.dataset.staticDemo === "true") transientStaff.push(person);
        populateRoleFilter();
        render();
        close();
        notify("Đã tạo tài khoản theo chức vụ đã chọn.");
    });
})();

