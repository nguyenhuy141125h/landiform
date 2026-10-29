(() => {
    const staffId = new URLSearchParams(location.search).get("id");
    const detail = document.querySelector("#staffDetailContent");
    const notFound = document.querySelector("#staffDetailNotFound");
    const profileForm = document.querySelector("#staffDetailForm");
    const passwordForm = document.querySelector("#staffPasswordForm");
    const roleSelect = document.querySelector("#staffDetailRole");
    const groupSelect = document.querySelector("#staffDetailGroupSelect");
    const toast = document.querySelector("#toastMessage");
    if (!detail || !notFound || !profileForm || !passwordForm || !roleSelect || !groupSelect) return;

    const roles = Object.fromEntries(
        [...document.querySelectorAll("#staffRoleExamples [data-key]")].map((element) => {
            const data = element.dataset;
            return [data.key, {
                name: data.name,
                group: data.group,
                status: data.status,
                locked: data.locked === "true",
                permissions: data.permissions ? data.permissions.split(/\s+/) : [],
            }];
        }),
    );
    let people = [];
    let person = null;
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function loadData() {
        people = [...document.querySelectorAll("#staffRecordExamples [data-id]")].map((element) => ({
            ...element.dataset,
            loginAllowed: element.dataset.loginAllowed === "true",
        }));
        person = people.find((item) => item.id === staffId) || null;
    }


    function getScopes(record) {
        const raw = Array.isArray(record.scopes) ? record.scopes : (Array.isArray(record.scope) ? record.scope : [record.scope || "Toàn doanh nghiệp"]);
        const scopes = [...new Set(raw.flatMap((value) => String(value || "").split(/\s*[·,;]\s*/)).filter(Boolean))];
        return scopes.includes("Toàn doanh nghiệp") ? ["Toàn doanh nghiệp"] : scopes;
    }

    function scopePicker() { return document.querySelector("#staffDetailScopeOptions"); }

    function syncScopePicker(checkedInput) {
        const picker = scopePicker();
        if (!picker || !checkedInput) return;
        const inputs = [...picker.querySelectorAll('input[name="staffDetailScopeOptions"]')];
        const all = inputs.find((input) => input.value === "Toàn doanh nghiệp");
        const projects = inputs.filter((input) => input !== all);
        if (checkedInput === all) {
            projects.forEach((input) => { input.checked = all.checked; });
            return;
        }
        if (all) all.checked = projects.length > 0 && projects.every((input) => input.checked);
    }

    function setScopes(scopes) {
        const picker = scopePicker();
        if (!picker) return;
        const selected = scopes.length ? scopes : ["Toàn doanh nghiệp"];
        const allSelected = selected.includes("Toàn doanh nghiệp");
        [...picker.querySelectorAll('input[name="staffDetailScopeOptions"]')].forEach((input) => {
            input.checked = allSelected || selected.includes(input.value);
        });
    }

    function selectedScopes() {
        return [...(scopePicker()?.querySelectorAll('input[name="staffDetailScopeOptions"]:checked') || [])].map((input) => input.value);
    }

    function populateRoles(group, selected = "") {
        const list = Object.entries(roles)
            .filter(([id, role]) => role.group === group && (role.status !== "inactive" || id === selected))
            .sort((a, b) => a[1].name.localeCompare(b[1].name, "vi"));
        roleSelect.replaceChildren(new Option(list.length ? "Chọn chức vụ" : "Chưa có chức vụ", ""));
        list.forEach(([id, role]) => roleSelect.add(new Option(role.name, id)));
        if (selected && list.some(([id]) => id === selected)) roleSelect.value = selected;
    }

    const permissionLabels = {
        "projects.view": "Xem dự án",
        "projects.edit": "Sửa dự án",
        "products.view": "Xem sản phẩm",
        "products.edit": "Sửa sản phẩm",
        "customers.view": "Xem khách hàng",
        "customers.create": "Thêm khách hàng",
        "customers.edit": "Sửa khách hàng",
        "work.view": "Xem công việc & lịch hẹn",
        "work.edit": "Quản lý công việc & lịch hẹn",
        "transactions.view": "Xem giao dịch",
        "reports.view": "Xem báo cáo",
        "team.view": "Xem đội ngũ",
        "team.edit": "Quản lý đội ngũ",
        "settings.edit": "Sửa thiết lập",
    };

    function renderPermissionSummary(roleId) {
        const role = roles[roleId] || {};
        const list = document.querySelector("#staffDetailPermissionList");
        document.querySelector("#staffDetailPermissionRole").textContent = role.name || "Chức vụ chưa được chọn";
        document.querySelector("#staffDetailPermissionLink").href = `permissions.html?role=${encodeURIComponent(roleId || "")}`;
        list.replaceChildren();
        if (role.locked) {
            document.querySelector("#staffDetailPermissionSummary").textContent = "Chức vụ quản trị có toàn quyền trong hệ thống.";
            const item = document.createElement("span");
            item.className = "staff-permission-chip is-full";
            item.textContent = "Toàn quyền quản trị";
            list.append(item);
            return;
        }
        const permissions = Array.isArray(role.permissions) ? role.permissions : [];
        document.querySelector("#staffDetailPermissionSummary").textContent = permissions.length
            ? `${permissions.length} quyền được cấp theo chức vụ này.`
            : "Chức vụ chưa được cấu hình quyền chi tiết.";
        permissions.slice(0, 8).forEach((permission) => {
            const chip = document.createElement("span");
            chip.className = "staff-permission-chip";
            chip.textContent = permissionLabels[permission] || permission;
            list.append(chip);
        });
        if (!permissions.length) {
            const item = document.createElement("span");
            item.className = "staff-permission-chip is-muted";
            item.textContent = "Chưa thiết lập quyền";
            list.append(item);
        }
    }

    function render() {
        if (!person || person.accountType === "customer") {
            detail.hidden = true;
            notFound.hidden = false;
            return;
        }
        detail.hidden = false;
        notFound.hidden = true;
        const roleId = person.roleId || Object.keys(roles).find((id) => roles[id].name === person.role) || "advisor";
        const group = roles[roleId]?.group || person.accountType || "employee";
        const teamHref = `team.html?type=${group}`;
        document.querySelector("#staffDetailBack").href = teamHref;
        document.querySelector("#staffDetailCancel").href = teamHref;
        const employeeNav = document.querySelector("#staffEmployeeNav");
        const managementNav = document.querySelector("#staffManagementNav");
        employeeNav.classList.toggle("is-active", group === "employee");
        managementNav.classList.toggle("is-active", group === "management");
        if (group === "employee") employeeNav.setAttribute("aria-current", "page");
        else employeeNav.removeAttribute("aria-current");
        if (group === "management") managementNav.setAttribute("aria-current", "page");
        else managementNav.removeAttribute("aria-current");
        const displayName = person.name || "Nhân viên";
        document.title = `${displayName} | LANDIFORM`;
        document.querySelector("#staffDetailName").textContent = displayName;
        document.querySelector("#staffDetailBreadcrumb").textContent = displayName;
        document.querySelector("#staffDetailSubtitle").textContent = `${person.email || "Chưa có email"} · ${person.phone || "Chưa có số điện thoại"}`;
        const status = document.querySelector("#staffDetailStatus");
        status.textContent = person.status || "Đang hoạt động";
        status.className = `screen-badge ${person.status === "Tạm ngưng" ? "neutral" : "green"}`;
        const scopes = getScopes(person);
        profileForm.elements.name.value = person.name || "";
        profileForm.elements.email.value = person.email || "";
        profileForm.elements.phone.value = person.phone || "";
        groupSelect.value = group;
        populateRoles(group, roleId);
        setScopes(scopes);
        profileForm.elements.status.value = person.status || "Đang hoạt động";
        profileForm.elements.loginAllowed.checked = person.loginAllowed !== false;
        renderPermissionSummary(roleId);
    }

    function hex(bytes) {
        return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    }

    groupSelect.addEventListener("change", () => {
        populateRoles(groupSelect.value);
        renderPermissionSummary(roleSelect.value);
    });
    roleSelect.addEventListener("change", () => renderPermissionSummary(roleSelect.value));
    scopePicker()?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="staffDetailScopeOptions"]')) syncScopePicker(event.target);
    });
    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!profileForm.reportValidity()) return;
        const role = roles[roleSelect.value];
        if (!role || role.group !== groupSelect.value || role.status === "inactive") {
            notify("Chọn chức vụ đang hoạt động trong nhóm tài khoản.");
            return;
        }
        const scopes = selectedScopes();
        if (!scopes.length) { notify("Chọn ít nhất một phạm vi phụ trách."); return; }
        if (people.some((item) => item.id !== person.id && (item.email || "").toLocaleLowerCase("vi") === next.email)) {
            profileForm.elements.email.setCustomValidity("Email n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c d\u00f9ng cho m\u1ed9t t\u00e0i kho\u1ea3n kh\u00e1c.");
            profileForm.reportValidity();
            return;
        }
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "staff-profile", id: person.id, values: new FormData(profileForm) },
        }));
        notify("H\u1ed3 s\u01a1 ch\u01b0a \u0111\u01b0\u1ee3c l\u01b0u v\u00ec trang ch\u01b0a k\u1ebft n\u1ed1i backend.");
    });
    profileForm.elements.email.addEventListener("input", () => profileForm.elements.email.setCustomValidity(""));

    passwordForm.elements.password.addEventListener("input", () => passwordForm.elements.confirmPassword.setCustomValidity(""));
    passwordForm.elements.confirmPassword.addEventListener("input", () => passwordForm.elements.confirmPassword.setCustomValidity(""));
    passwordForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!passwordForm.reportValidity()) return;
        if (passwordForm.elements.password.value !== passwordForm.elements.confirmPassword.value) {
            passwordForm.elements.confirmPassword.setCustomValidity("M\u1eadt kh\u1ea9u nh\u1eadp l\u1ea1i ch\u01b0a kh\u1edbp.");
            passwordForm.reportValidity();
            return;
        }
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "staff-password", id: person.id, values: new FormData(passwordForm) },
        }));
        notify("M\u1eadt kh\u1ea9u ch\u01b0a \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt v\u00ec trang ch\u01b0a k\u1ebft n\u1ed1i backend.");
    });

    loadData();
    render();
})();

