(() => {
    const tbody = document.querySelector("#staffTableBody");
    const modal = document.querySelector("#staffModal");
    const form = document.querySelector("#staffForm");
    const accountType = document.querySelector("#staffAccountType");
    const roleSelect = document.querySelector("#staffRole");
    if (!tbody || !modal || !form || !accountType || !roleSelect) return;

    const search = document.querySelector('[data-filter="team"]');
    const groupFilter = document.querySelector("[data-staff-type-filter]");
    const roleFilter = document.querySelector("[data-staff-role-filter]");
    const allScope = document.querySelector('#staffScopeOptions input[value="Toàn doanh nghiệp"]');

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const group = groupFilter?.value || "";
        const role = roleFilter?.value || "";
        tbody.querySelectorAll("tr[data-staff-id]").forEach((row) => {
            const textMatch = !query || row.textContent.toLocaleLowerCase("vi").includes(query);
            const groupMatch = !group || row.dataset.accountType === group;
            const roleMatch = !role || row.dataset.roleId === role;
            row.hidden = !(textMatch && groupMatch && roleMatch);
        });
    }

    function updateRoleOptions() {
        const group = accountType.value;
        let visibleCount = 0;
        roleSelect.querySelectorAll("option[data-account-group]").forEach((option) => {
            const visible = option.dataset.accountGroup === group;
            option.hidden = !visible;
            option.disabled = !visible;
            if (visible) visibleCount += 1;
        });
        const first = roleSelect.querySelector('option:not([data-account-group])');
        if (first) first.textContent = visibleCount ? "Chọn chức vụ" : "Chưa có chức vụ trong nhóm này";
        roleSelect.value = "";
        const hint = document.querySelector("#staffRoleHint");
        if (hint) hint.textContent = visibleCount ? "Chọn chức vụ để áp dụng quyền đã thiết lập." : "Nhóm này chưa có chức vụ. Có thể tạo chức vụ trong trang Chức vụ & quyền.";
    }

    function updateScopePicker(changed) {
        const scopeInputs = [...document.querySelectorAll('#staffScopeOptions input[name="scopeOptions"]')];
        const projectScopes = scopeInputs.filter((input) => input !== allScope);
        if (changed === allScope && allScope?.checked) projectScopes.forEach((input) => { input.checked = true; });
        else if (changed !== allScope && changed) {
            if (projectScopes.some((input) => !input.checked)) {
                if (allScope) allScope.checked = false;
            } else if (allScope) allScope.checked = true;
        }
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        updateRoleOptions();
    }

    function open() {
        form.reset();
        accountType.value = "employee";
        updateRoleOptions();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name?.focus();
    }

    search?.addEventListener("input", applyFilters);
    groupFilter?.addEventListener("change", applyFilters);
    roleFilter?.addEventListener("change", applyFilters);
    accountType.addEventListener("change", updateRoleOptions);
    document.querySelector('#staffScopeOptions')?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="scopeOptions"]')) updateScopePicker(event.target);
    });
    tbody.addEventListener("click", (event) => {
        const button = event.target.closest("[data-staff-login-toggle]");
        if (!button) return;
        const allowed = button.getAttribute("aria-pressed") !== "true";
        button.classList.toggle("is-allowed", allowed);
        button.classList.toggle("is-blocked", !allowed);
        button.setAttribute("aria-pressed", String(allowed));
        button.innerHTML = allowed
            ? '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> Được phép'
            : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Đã khóa';
    });

    document.querySelector("[data-staff-open]")?.addEventListener("click", open);
    document.querySelectorAll("[data-staff-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
    form.addEventListener("submit", (event) => event.preventDefault());

    const requestedType = new URLSearchParams(location.search).get("type");
    if (["management", "employee", "customer"].includes(requestedType) && groupFilter) groupFilter.value = requestedType;
    updateRoleOptions();
    applyFilters();
    if (new URLSearchParams(location.search).get("new") === "1") open();
})();
