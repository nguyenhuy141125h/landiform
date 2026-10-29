(() => {
    const form = document.querySelector("#accountForm");
    const passwordForm = document.querySelector("#passwordForm");
    const toast = document.querySelector("#toastMessage");
    if (!form) return;

    let toastTimer;
    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "account-profile", values: new FormData(form) },
        }));
        notify("Thông tin chưa được lưu vì trang chưa kết nối backend.");
    });

    passwordForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!passwordForm.reportValidity()) return;
        const newPassword = passwordForm.elements.newPassword.value;
        const confirmPassword = passwordForm.elements.confirmPassword.value;
        if (newPassword.length < 8) {
            notify("Mật khẩu mới cần có ít nhất 8 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            notify("Mật khẩu nhập lại chưa khớp.");
            return;
        }
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "account-password", values: new FormData(passwordForm) },
        }));
        passwordForm.reset();
        notify("Yêu cầu đổi mật khẩu chưa được gửi vì trang chưa kết nối backend.");
    });
})();
