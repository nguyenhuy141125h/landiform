(() => {
    const form = document.querySelector("#contactRequestForm");
    if (!form) return;

    const storageKey = "landiform.admin.leads.v1";
    const status = document.querySelector("#contactFormStatus");
    const toast = document.querySelector("#contactToast");
    const projectNames = {
        "AP-026": "An Phú Riverside",
        "GV-014": "Green Valley",
        "CP-008": "Central Park Towers",
        "LG-031": "Lumière Garden",
    };
    const projectAreas = {
        "AP-026": "TP. Thủ Đức",
        "GV-014": "Biên Hòa",
        "CP-008": "Quận 7, TP. Hồ Chí Minh",
        "LG-031": "Long An",
    };
    const formByProject = { "AP-026": "consult", "GV-014": "price", "CP-008": "viewing" };
    try {
        const projects = JSON.parse(null || "[]");
        if (Array.isArray(projects)) projects.forEach((project) => {
            const code = String(project.code || "").trim();
            const name = String(project.name || "").trim();
            if (/^[A-Z]{2,5}-[A-Z0-9]{2,}$/i.test(code) && name && !/^(admin|test|demo)$/i.test(name)) {
                projectNames[code] = name;
                projectAreas[code] = project.area || project.location || projectAreas[code] || "";
            }
        });
    } catch { /* Keep the default project options. */ }

    const projectSelect = form.elements.projectCode;
    Object.entries(projectNames).forEach(([code, name]) => {
        const option = [...projectSelect.options].find((item) => item.value === code);
        if (option) option.textContent = name;
        else projectSelect.add(new Option(name, code));
    });
    const branchSelect = form.elements.branchId;
    if (branchSelect) {
        window.CustomerBranches?.fillSelect(branchSelect);
        projectSelect.addEventListener("change", () => window.CustomerBranches?.setForArea(branchSelect, projectAreas[projectSelect.value] || ""));
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(form);
        const now = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(new Date());
        const projectCode = String(values.get("projectCode") || "");
        const branch = window.CustomerBranches?.get(String(values.get("branchId") || ""));
        const message = String(values.get("need") || "").trim();
          const campaignSlug = new URLSearchParams(window.location.search).get("utm_campaign") || "";
          const utmSource = new URLSearchParams(window.location.search).get("utm_source") || "";
          const sourceNames = { google: "Google Ads", meta: "Meta Ads", qr: "QR / Sự kiện", email: "Email" };
          const source = sourceNames[utmSource] ? `${sourceNames[utmSource]} · ${campaignSlug || "Trang liên hệ"}` : "Website · Trang liên hệ";
        const lead = {
            id: `lead-${Date.now()}`,
            name: String(values.get("name") || "").trim(),
            phone: String(values.get("phone") || "").trim(),
            email: String(values.get("email") || "").trim(),
            project: projectNames[projectCode] || "",
            projectCode,
              formId: formByProject[projectCode] || "",
              productId: "",
              campaignId: campaignSlug ? `campaign-${campaignSlug}` : "",
            branch: branch?.name || "",
            branchId: branch?.id || "",
            need: message || "Yêu cầu tư vấn chung",
            budget: "Chưa cập nhật",
              source,
            owner: "Chưa phân công",
            status: "Chưa liên hệ",
            received: now,
            activities: [{ type: "Đăng ký", note: message || "Khách hàng gửi yêu cầu tư vấn chung qua trang liên hệ.", at: now }],
        };

        try {
            const saved = JSON.parse(null || "[]");
            const leads = Array.isArray(saved) ? saved : [];
            leads.push(lead);
            void 0;
        } catch {
            status.textContent = "Chưa lưu được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp qua điện thoại.";
            status.classList.add("is-error");
            return;
        }

        status.textContent = "Cảm ơn bạn. Yêu cầu đã được ghi nhận.";
        status.classList.remove("is-error");
        form.reset();
        if (toast) {
            toast.textContent = "Đã ghi nhận yêu cầu tư vấn của bạn.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3500);
        }
    });
})();

