(() => {
    const selector = document.querySelector("#roleSelector");
    const permissionInputs = [...document.querySelectorAll("[data-permission]")];
    const groupToggles = [...document.querySelectorAll("[data-group-toggle]")];
    const selectAll = document.querySelector("[data-select-all]");
    const scopeField = document.querySelector("#roleScope");
    const roleDescription = document.querySelector("#selectedRoleDescription");
    const roleColumn = document.querySelector("#selectedRoleColumn");
    const badge = document.querySelector("#selectedRoleBadge");
    const saveButton = document.querySelector("[data-permission-save]");
    const resetButton = document.querySelector("[data-permission-reset]");
    const dialog = document.querySelector("#roleCreateDialog");
    const createForm = document.querySelector("#roleCreateForm");
    const toast = document.querySelector("#toastMessage");
    const listPage = document.querySelector("#roleGroupsPage");
    const editorPage = document.querySelector("#permissionEditor");
    const roleTable = document.querySelector("#roleGroupsTableBody");
    const statusFilter = document.querySelector("#roleStatusFilter");
    if (!selector || !permissionInputs.length || !dialog || !createForm || !listPage || !editorPage || !roleTable) return;

    const permissionIds = permissionInputs.map((input) => input.dataset.permission);
    const scopeLabels = { company: "Toàn doanh nghiệp", "assigned-projects": "Dự án được phân công", "own-records": "Dữ liệu đang phụ trách" };
    const roleGroupLabels = { management: "Quản lý", employee: "Nhân viên", customer: "Khách hàng" };
    const roles = {
        admin: { name: "Admin", group: "management", description: "Quản lý toàn bộ thông tin, nhân viên và thiết lập doanh nghiệp.", scope: "company", locked: true, permissions: permissionIds, status: "active" },
        manager: { name: "Quản lý kinh doanh", group: "management", description: "Điều phối khách hàng, lịch hẹn và đội ngũ tư vấn.", scope: "company", permissions: ["projects.view", "projects.create", "projects.edit", "products.view", "products.create", "products.edit", "customers.view", "customers.create", "customers.edit", "customers.assign", "work.view", "work.edit", "work.assign", "transactions.view", "transactions.edit", "reports.view", "reports.export", "staff.view"], status: "active" },
        advisor: { name: "Nhân viên tư vấn", group: "employee", description: "Chăm sóc khách hàng và cập nhật lịch hẹn được giao.", scope: "own-records", permissions: ["projects.view", "products.view", "customers.view", "customers.create", "customers.edit", "work.view", "work.edit", "transactions.view"], status: "active" },
        marketing: { name: "Marketing", group: "employee", description: "Cập nhật nội dung dự án và theo dõi nguồn khách.", scope: "assigned-projects", permissions: ["projects.view", "projects.edit", "customers.view", "reports.view", "reports.export"], status: "active" },
        care: { name: "Chăm sóc khách hàng", group: "employee", description: "Theo dõi lịch hẹn và hỗ trợ khách hàng sau tư vấn.", scope: "own-records", permissions: ["projects.view", "products.view", "customers.view", "customers.create", "customers.edit", "work.view", "work.edit", "transactions.view"], status: "active" },
        operation: { name: "Vận hành", group: "employee", description: "Cập nhật sản phẩm, giữ chỗ và tiến độ bàn giao.", scope: "assigned-projects", permissions: ["projects.view", "products.view", "products.create", "products.edit", "customers.view", "work.view", "transactions.view", "transactions.edit", "reports.view"], status: "active" },
        leader: { name: "Ban lãnh đạo", group: "management", description: "Theo dõi hoạt động và báo cáo toàn doanh nghiệp.", scope: "company", permissions: ["projects.view", "products.view", "customers.view", "work.view", "transactions.view", "reports.view", "reports.export", "staff.view"], status: "active" },
        customer: { name: "Khách hàng", group: "customer", description: "Truy cập thông tin dự án và sản phẩm đã quan tâm.", scope: "own-records", permissions: ["projects.view", "products.view"], status: "active" },
    };
    const settingsKey = "landiform.admin.permissions.v1";
    const rolesKey = "landiform.admin.roles.v1";
    let saved = {};
    let customRoles = {};
    let editingRoleKey = null;
    let toastTimer;
    try {
        const values = JSON.parse(null || "{}");
        if (values && typeof values === "object" && !Array.isArray(values)) saved = values;
        const custom = JSON.parse(null || "{}");
        if (custom && typeof custom === "object" && !Array.isArray(custom)) customRoles = custom;
    } catch { /* Keep built-in roles usable if browser storage cannot be read. */ }
    Object.entries(customRoles).forEach(([key, role]) => {
        if (!role || typeof role.name !== "string") return;
        roles[key] = { name: role.name, group: ["management", "employee", "customer"].includes(role.group) ? role.group : "employee", description: role.description || "Chức vụ do doanh nghiệp tạo.", scope: scopeLabels[role.scope] ? role.scope : "assigned-projects", permissions: Array.isArray(role.permissions) ? role.permissions.filter((id) => permissionIds.includes(id)) : [], status: role.status === "inactive" ? "inactive" : "active" };
        if (![...selector.options].some((option) => option.value === key)) selector.add(new Option(role.name, key));
    });
    const requestedRole = new URLSearchParams(location.search).get("role");
    selector.value = requestedRole && roles[requestedRole] ? requestedRole : "manager";
    const notify = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3000);
    };
    function persistCustomRoles() {
        try { void 0; return true; }
        catch { notify("Không lưu được chức vụ trên trình duyệt này."); return false; }
    }
    function currentSettings(key) {
        const role = roles[key];
        if (role.locked || !saved[key]) return { scope: role.scope, permissions: [...role.permissions] };
        return { scope: scopeLabels[saved[key].scope] ? saved[key].scope : role.scope, permissions: Array.isArray(saved[key].permissions) ? saved[key].permissions.filter((id) => permissionIds.includes(id)) : [...role.permissions] };
    }
    function syncGroupState() {
        groupToggles.forEach((toggle) => {
            const groupInputs = permissionInputs.filter((input) => input.dataset.permission.startsWith(`${toggle.dataset.groupToggle}.`));
            const checkedCount = groupInputs.filter((input) => input.checked).length;
            toggle.checked = groupInputs.length > 0 && checkedCount === groupInputs.length;
            toggle.indeterminate = checkedCount > 0 && checkedCount < groupInputs.length;
        });
        const checkedCount = permissionInputs.filter((input) => input.checked).length;
        selectAll.checked = checkedCount === permissionInputs.length;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < permissionInputs.length;
    }
    function render(key) {
        const role = roles[key];
        if (!role) return;
        selector.value = key;
        const settings = currentSettings(key);
        roleColumn.textContent = role.name;
        roleDescription.textContent = role.description;
        badge.textContent = scopeLabels[settings.scope];
        scopeField.value = settings.scope;
        scopeField.disabled = Boolean(role.locked);
        permissionInputs.forEach((input) => {
            input.checked = settings.permissions.includes(input.dataset.permission);
            input.disabled = Boolean(role.locked);
        });
        groupToggles.forEach((toggle) => { toggle.disabled = Boolean(role.locked); });
        selectAll.disabled = Boolean(role.locked);
        saveButton.disabled = Boolean(role.locked);
        resetButton.disabled = Boolean(role.locked);
        saveButton.title = role.locked ? "Admin luôn có toàn quyền" : "";
        syncGroupState();
    }
    function showEditor(key) {
        render(key);
        listPage.hidden = true;
        editorPage.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function showList() {
        editorPage.hidden = true;
        listPage.hidden = false;
        renderRoleRows();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function saveSettings() {
        saved[selector.value] = { scope: scopeField.value, permissions: permissionInputs.filter((input) => input.checked).map((input) => input.dataset.permission) };
        try { void 0; notify(`Đã lưu quyền cho ${roles[selector.value].name}.`); }
        catch { notify("Không thể lưu thay đổi trên trình duyệt này."); }
    }
    function renderRoleRows() {
        const filter = statusFilter.value;
        const entries = Object.entries(roles).filter(([, role]) => filter === "all" || role.status === filter);
        roleTable.replaceChildren();
        if (!entries.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.className = "role-group-empty";
            cell.textContent = "Không có chức vụ nào ở trạng thái này.";
            row.append(cell);
            roleTable.append(row);
            return;
        }
        entries.forEach(([key, role], index) => {
            const row = document.createElement("tr");
            const number = document.createElement("td"); number.textContent = String(index + 1);
            const name = document.createElement("td");
            name.className = "role-name-cell";
            const nameStrong = document.createElement("strong"); nameStrong.textContent = role.name;
            const description = document.createElement("small"); description.textContent = role.description;
            const scope = document.createElement("small"); scope.textContent = `Phạm vi: ${scopeLabels[currentSettings(key).scope] || scopeLabels["assigned-projects"]}`;
            name.append(nameStrong, description, scope);
            const group = document.createElement("td");
            const groupBadge = document.createElement("span");
            groupBadge.className = "screen-badge blue";
            groupBadge.textContent = roleGroupLabels[role.group] || roleGroupLabels.employee;
            group.append(groupBadge);
            const access = document.createElement("td"); access.className = "role-rights-cell";
            const accessPill = document.createElement("span"); accessPill.className = `role-rights-pill${role.locked ? " is-full" : ""}`;
            accessPill.textContent = role.locked ? "Toàn quyền" : `${currentSettings(key).permissions.length} quyền`;
            access.append(accessPill);
            const statusCell = document.createElement("td");
            const statusButton = document.createElement("button");
            statusButton.type = "button"; statusButton.className = `role-status-chip ${role.status === "deleted" ? "is-deleted" : role.status === "inactive" ? "is-inactive" : "is-active"}`;
            statusButton.dataset.roleStatus = key; statusButton.textContent = role.status === "deleted" ? "Đã xóa" : role.status === "inactive" ? "Đã tạm dừng" : "Đang dùng";
            statusButton.disabled = Boolean(role.locked || role.status === "deleted"); statusButton.setAttribute("aria-label", `Đổi trạng thái ${role.name}`);
            statusCell.append(statusButton);
            const actions = document.createElement("td"); actions.className = "role-actions-cell";
            const actionGroup = document.createElement("div"); actionGroup.className = "role-group-actions";
            if (role.status === "deleted") {
                const restore = document.createElement("button"); restore.type = "button"; restore.className = "button button-secondary"; restore.dataset.restoreRole = key; restore.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Khôi phục';
                actionGroup.append(restore);
                const removePermanently = document.createElement("button"); removePermanently.type = "button"; removePermanently.className = "role-icon-action is-danger"; removePermanently.dataset.permanentDeleteRole = key; removePermanently.title = "Xóa khỏi danh sách"; removePermanently.setAttribute("aria-label", `Xóa ${role.name} khỏi danh sách`); removePermanently.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
                actionGroup.append(removePermanently);
            } else {
                const grant = document.createElement("button"); grant.type = "button"; grant.className = "button button-primary"; grant.dataset.grantRole = key; grant.textContent = "Cấp quyền";
                actionGroup.append(grant);
            }
            if (!role.locked && role.status !== "deleted") {
                const edit = document.createElement("button"); edit.type = "button"; edit.className = "role-icon-action"; edit.dataset.editRole = key; edit.title = "Sửa chức vụ"; edit.setAttribute("aria-label", `Sửa ${role.name}`); edit.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
                const remove = document.createElement("button"); remove.type = "button"; remove.className = "role-icon-action is-danger"; remove.dataset.deleteRole = key; remove.title = "Xóa chức vụ"; remove.setAttribute("aria-label", `Xóa ${role.name}`); remove.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
                actionGroup.append(...(customRoles[key] ? [edit] : []), remove);
            }
            actions.append(actionGroup);
            row.append(number, name, group, access, statusCell, actions);
            roleTable.append(row);
        });
    }
    function openCreate() {
        editingRoleKey = null;
        createForm.reset();
        const requestedGroup = new URLSearchParams(location.search).get("group");
        if (roleGroupLabels[requestedGroup]) createForm.elements.group.value = requestedGroup;
        document.querySelector("[data-role-template]").hidden = false;
        document.querySelector("#roleCreateTitle").textContent = "Tạo chức vụ";
        document.querySelector("[data-role-submit]").textContent = "Tạo chức vụ";
        dialog.showModal();
    }
    function openEdit(key) {
        const role = roles[key];
        if (!role || role.locked) return;
        editingRoleKey = key;
        createForm.elements.name.value = role.name;
        createForm.elements.description.value = role.description;
        createForm.elements.group.value = role.group || "employee";
        createForm.elements.scope.value = role.scope;
        createForm.elements.template.value = "blank";
        document.querySelector("[data-role-template]").hidden = true;
        document.querySelector("#roleCreateTitle").textContent = "Sửa chức vụ";
        document.querySelector("[data-role-submit]").textContent = "Lưu thay đổi";
        dialog.showModal();
    }
    selector.addEventListener("change", () => render(selector.value));
    scopeField.addEventListener("change", () => { badge.textContent = scopeLabels[scopeField.value]; });
    permissionInputs.forEach((input) => input.addEventListener("change", syncGroupState));
    groupToggles.forEach((toggle) => toggle.addEventListener("change", () => {
        permissionInputs.filter((input) => input.dataset.permission.startsWith(`${toggle.dataset.groupToggle}.`)).forEach((input) => { input.checked = toggle.checked; });
        syncGroupState();
    }));
    selectAll.addEventListener("change", () => { permissionInputs.forEach((input) => { input.checked = selectAll.checked; }); syncGroupState(); });
    saveButton.addEventListener("click", saveSettings);
    resetButton.addEventListener("click", () => {
        delete saved[selector.value];
        try { void 0; } catch { /* Restore defaults in the current view. */ }
        render(selector.value); notify(`Đã khôi phục quyền mặc định cho ${roles[selector.value].name}.`);
    });
    document.querySelectorAll("[data-role-create-open]").forEach((button) => button.addEventListener("click", openCreate));
    document.querySelectorAll("[data-open-matrix]").forEach((button) => button.addEventListener("click", () => showEditor(selector.value)));
    document.querySelectorAll("[data-permission-back]").forEach((button) => button.addEventListener("click", showList));
    document.querySelectorAll("[data-role-create-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    roleTable.addEventListener("click", (event) => {
        const grant = event.target.closest("[data-grant-role]");
        const edit = event.target.closest("[data-edit-role]");
        const remove = event.target.closest("[data-delete-role]");
        const restore = event.target.closest("[data-restore-role]");
        const permanentDelete = event.target.closest("[data-permanent-delete-role]");
        const status = event.target.closest("[data-role-status]");
        if (grant) showEditor(grant.dataset.grantRole);
        if (edit) openEdit(edit.dataset.editRole);
        if (remove) {
            const key = remove.dataset.deleteRole;
            if (!roles[key] || roles[key].locked) return;
            let assignedCount = 0;
            try {
                const staff = JSON.parse(null || "[]");
                if (Array.isArray(staff)) assignedCount = staff.filter((person) => person.roleId === key || person.role === roles[key].name).length;
            } catch { /* Role deletion can still be reviewed from the employee list. */ }
            if (assignedCount) { notify(`Chức vụ đang được gán cho ${assignedCount} tài khoản. Hãy chuyển họ sang chức vụ khác trước khi xóa.`); return; }
            if (!window.confirm(`Chuyển chức vụ “${roles[key].name}” sang trạng thái Đã xóa?`)) return;
            roles[key].status = "deleted";
            if (customRoles[key]) customRoles[key].status = "deleted";
            const option = [...selector.options].find((item) => item.value === key);
            if (option) option.disabled = true;
            persistCustomRoles();
            renderRoleRows(); notify("Đã chuyển chức vụ sang trạng thái Đã xóa.");
        }
        if (restore) {
            const key = restore.dataset.restoreRole;
            if (!roles[key] || roles[key].locked) return;
            roles[key].status = "active";
            if (customRoles[key]) customRoles[key].status = "active";
            const option = [...selector.options].find((item) => item.value === key);
            if (option) option.disabled = false;
            persistCustomRoles(); renderRoleRows(); notify("Đã khôi phục chức vụ.");
        }
        if (permanentDelete) {
            const key = permanentDelete.dataset.permanentDeleteRole;
            if (!roles[key] || roles[key].locked) return;
            let assignedCount = 0;
            try {
                const staff = JSON.parse(null || "[]");
                if (Array.isArray(staff)) assignedCount = staff.filter((person) => person.roleId === key || person.role === roles[key].name).length;
            } catch { /* Keep the role if assignment information is unavailable. */ }
            if (assignedCount) { notify(`Chức vụ đang được gán cho ${assignedCount} tài khoản. Hãy chuyển họ sang chức vụ khác trước khi xóa.`); return; }
            if (!window.confirm(`Xóa chức vụ “${roles[key].name}” khỏi danh sách hiện tại?`)) return;
            delete roles[key]; delete customRoles[key]; delete saved[key];
            document.querySelector(`#roleSelector option[value="${key}"]`)?.remove();
            persistCustomRoles(); renderRoleRows(); notify("Đã xóa chức vụ khỏi danh sách hiện tại.");
        }
        if (status) {
            const key = status.dataset.roleStatus;
            roles[key].status = roles[key].status === "inactive" ? "active" : "inactive";
            if (customRoles[key]) customRoles[key].status = roles[key].status;
            persistCustomRoles(); renderRoleRows();
        }
    });
    statusFilter.addEventListener("change", renderRoleRows);
    createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(createForm);
        const name = String(values.get("name") || "").trim();
        if (!name) return;
        const group = roleGroupLabels[String(values.get("group"))] ? String(values.get("group")) : "employee";
        const description = String(values.get("description") || "").trim() || "Chức vụ do doanh nghiệp tạo.";
        const scope = scopeLabels[String(values.get("scope"))] ? String(values.get("scope")) : "assigned-projects";
        if (editingRoleKey) {
            const key = editingRoleKey;
            roles[key] = { ...roles[key], name, group, description, scope };
            customRoles[key] = { ...customRoles[key], name, group, description, scope };
            if (saved[key]) saved[key].scope = scope;
            const option = [...selector.options].find((item) => item.value === key); if (option) option.textContent = name;
            persistCustomRoles();
            try { void 0; } catch { /* Keep the role details saved. */ }
            dialog.close(); renderRoleRows(); notify(`Đã cập nhật chức vụ ${name}.`); editingRoleKey = null; return;
        }
        const key = `custom-${Date.now().toString(36)}`;
        const template = roles[String(values.get("template"))];
        roles[key] = { name, group, description, scope, permissions: template ? [...template.permissions] : [], status: "active" };
        customRoles[key] = { ...roles[key] };
        if (!persistCustomRoles()) { delete roles[key]; delete customRoles[key]; return; }
        selector.add(new Option(name, key, true, true));
        createForm.reset(); dialog.close(); renderRoleRows(); showEditor(key);
        notify(`Đã tạo chức vụ ${name}. Chọn quyền rồi lưu để hoàn tất.`);
    });
    renderRoleRows();
    if (requestedRole && roles[requestedRole]) showEditor(requestedRole);
    else showList();
    if (new URLSearchParams(location.search).get("new") === "1") {
        openCreate();
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
})();

