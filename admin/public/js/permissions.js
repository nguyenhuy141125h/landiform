(() => {
    const roleSelector = document.querySelector("#roleSelector");
    const roleRows = [...document.querySelectorAll("#roleGroupsTableBody tr[data-role-key]")];
    const editor = document.querySelector("#permissionEditor");
    const list = document.querySelector("#roleGroupsPage");
    const dialog = document.querySelector("#roleCreateDialog");
    const createForm = document.querySelector("#roleCreateForm");
    const statusFilter = document.querySelector("#roleStatusFilter");
    const permissionInputs = [...document.querySelectorAll("[data-permission]")];
    const groupToggles = [...document.querySelectorAll("[data-group-toggle]")];
    const selectAll = document.querySelector("[data-select-all]");
    const scopeSelect = document.querySelector("#roleScope");
    if (!roleSelector || !editor || !list || !dialog || !createForm || !roleRows.length) return;

    const rowFor = (key) => roleRows.find((row) => row.dataset.roleKey === key);
    const rolePermissionIds = (row) => (row?.dataset.rolePermissions || "").split(/\s+/).filter(Boolean);

    function syncChecks() {
        groupToggles.forEach((toggle) => {
            const inputs = permissionInputs.filter((input) => input.dataset.permission.startsWith(`${toggle.dataset.groupToggle}.`));
            const checked = inputs.filter((input) => input.checked).length;
            toggle.checked = inputs.length > 0 && checked === inputs.length;
            toggle.indeterminate = checked > 0 && checked < inputs.length;
        });
        const checked = permissionInputs.filter((input) => input.checked).length;
        selectAll.checked = checked === permissionInputs.length;
        selectAll.indeterminate = checked > 0 && checked < permissionInputs.length;
    }

    function showRole(key) {
        const row = rowFor(key);
        if (!row) return;
        roleSelector.value = key;
        const locked = row.dataset.roleLocked === "true";
        const allowed = new Set(rolePermissionIds(row));
        document.querySelector("#selectedRoleColumn").textContent = row.querySelector(".role-name-cell strong")?.textContent || "Chức vụ";
        document.querySelector("#selectedRoleDescription").textContent = row.querySelector(".role-name-cell small")?.textContent || "";
        document.querySelector("#selectedRoleBadge").textContent = scopeSelect.selectedOptions[0]?.textContent || "Toàn doanh nghiệp";
        scopeSelect.value = row.dataset.roleScope || "company";
        scopeSelect.disabled = locked;
        permissionInputs.forEach((input) => { input.checked = allowed.has(input.dataset.permission); input.disabled = locked; });
        groupToggles.forEach((input) => { input.disabled = locked; });
        selectAll.disabled = locked;
        document.querySelector("[data-permission-save]").disabled = locked;
        document.querySelector("[data-permission-reset]").disabled = locked;
        syncChecks();
    }

    function showEditor(key) {
        showRole(key);
        list.hidden = true;
        editor.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function showList() {
        editor.hidden = true;
        list.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function filterRoles() {
        const state = statusFilter.value;
        roleRows.forEach((row) => { row.hidden = state !== "all" && row.dataset.roleStatus !== state; });
    }

    roleSelector.addEventListener("change", () => showRole(roleSelector.value));
    scopeSelect.addEventListener("change", () => { document.querySelector("#selectedRoleBadge").textContent = scopeSelect.selectedOptions[0]?.textContent || ""; });
    permissionInputs.forEach((input) => input.addEventListener("change", syncChecks));
    groupToggles.forEach((toggle) => toggle.addEventListener("change", () => {
        permissionInputs.filter((input) => input.dataset.permission.startsWith(`${toggle.dataset.groupToggle}.`)).forEach((input) => { input.checked = toggle.checked; });
        syncChecks();
    }));
    selectAll?.addEventListener("change", () => { permissionInputs.forEach((input) => { input.checked = selectAll.checked; }); syncChecks(); });
    document.querySelector("[data-permission-reset]")?.addEventListener("click", () => showRole(roleSelector.value));
    document.querySelector("[data-permission-save]")?.addEventListener("click", () => {
        const row = rowFor(roleSelector.value);
        if (!row || row.dataset.roleLocked === "true") return;
        const selected = permissionInputs.filter((input) => input.checked).map((input) => input.dataset.permission);
        row.dataset.rolePermissions = selected.join(" ");
        const count = row.querySelector(".role-rights-pill");
        if (count) count.textContent = `${selected.length} quyền`;
    });

    roleRows.forEach((row) => row.querySelector("[data-grant-role]")?.addEventListener("click", () => showEditor(row.dataset.roleKey)));
    document.querySelectorAll("[data-open-matrix]").forEach((button) => button.addEventListener("click", () => showEditor(roleSelector.value || "manager")));
    document.querySelectorAll("[data-permission-back]").forEach((button) => button.addEventListener("click", showList));
    statusFilter?.addEventListener("change", filterRoles);
    document.querySelectorAll("[data-role-create-open]").forEach((button) => button.addEventListener("click", () => dialog.showModal()));
    document.querySelectorAll("[data-role-create-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    createForm.addEventListener("submit", (event) => event.preventDefault());

    const requestedRole = new URLSearchParams(location.search).get("role");
    roleSelector.value = rowFor(requestedRole) ? requestedRole : "manager";
    showRole(roleSelector.value);
    filterRoles();
    if (new URLSearchParams(location.search).get("new") === "1") dialog.showModal();
})();
