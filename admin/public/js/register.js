(() => {
    const form = document.querySelector("#registerForm");
    const success = document.querySelector("#registerSuccess");
    if (!form || !success) return;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        form.hidden = true;
        success.hidden = false;
        document.querySelector("#registerHeading").textContent = "Đã hoàn tất bước nhập thông tin";
        document.querySelector("#registerDescription").textContent = "Đây là giao diện mẫu; cần kết nối máy chủ để gửi yêu cầu thực tế.";
    });
})();
