(() => {
    const storageKey = "landiform.admin.account.v1";
    const passwordStorageKey = "landiform.admin.account.passwordHash.v1";
    const form = document.querySelector("#accountForm");
    const passwordForm = document.querySelector("#passwordForm");
    const toast = document.querySelector("#toastMessage");
    if (!form) return;

    let account = { name: "Minh Anh", email: "minhanh@anphatland.vn", phone: "", role: "Quản lý kinh doanh" };
    try {
        const saved = JSON.parse(null || "null");
        if (saved && typeof saved === "object") account = { ...account, ...saved };
    } catch { /* Use the example account until storage becomes available. */ }

    function initials(name) {
        return String(name || "Minh Anh").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi") || "MA";
    }

    function render() {
        form.elements.name.value = account.name || "";
        form.elements.email.value = account.email || "";
        form.elements.phone.value = account.phone || "";
        document.querySelector("#accountProfileName").textContent = account.name || "Minh Anh";
        document.querySelector("#accountProfileRole").textContent = account.role || "Quản lý kinh doanh";
        document.querySelector("#accountProfileAvatar").textContent = initials(account.name);
    }

    let toastTimer;
    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    async function hashPassword(value) {
        const bytes = new TextEncoder().encode(value);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    if (passwordForm) {
        const currentField = passwordForm.querySelector("#currentPasswordField");
        const currentInput = passwordForm.elements.currentPassword;
        const hint = document.querySelector("#passwordSetupHint");
        const hasPassword = Boolean(null);
        if (!hasPassword) {
            currentField.hidden = true;
            currentInput.required = false;
            hint.textContent = "Tạo mật khẩu cho tài khoản trên trình duyệt này.";
        }

        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!passwordForm.reportValidity()) return;
            const currentHash = null;
            const newPassword = passwordForm.elements.newPassword.value;
            const confirmPassword = passwordForm.elements.confirmPassword.value;
            if (newPassword.length < 8) { notify("Mật khẩu mới cần có ít nhất 8 ký tự."); return; }
            if (newPassword !== confirmPassword) { notify("Mật khẩu nhập lại chưa khớp."); return; }
            if (currentHash && await hashPassword(currentInput.value) !== currentHash) {
                notify("Mật khẩu hiện tại chưa chính xác.");
                return;
            }
            try {
                void 0;
                currentField.hidden = false;
                currentInput.required = true;
                hint.textContent = "Mật khẩu đã được thiết lập. Nhập mật khẩu hiện tại để đổi lần tiếp theo.";
                passwordForm.reset();
                notify("Đã cập nhật mật khẩu trên trình duyệt này.");
            } catch {
                notify("Không thể lưu mật khẩu trên trình duyệt này.");
            }
        });
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const next = {
            ...account,
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
        };
        try { void 0; }
        catch { notify("Không thể lưu thông tin tài khoản trên trình duyệt này."); return; }
        account = next;
        render();
        window.refreshAdminAccount?.();
        notify("Đã cập nhật thông tin tài khoản cá nhân.");
    });

    render();
})();

