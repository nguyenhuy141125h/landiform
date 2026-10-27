(() => {
    const modal = document.querySelector("#taskModal");
    const form = document.querySelector("#taskForm");
    const agenda = document.querySelector("#agendaList");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !agenda) return;

    const storageKey = "landiform.admin.tasks.v1";
    const projectNames = { "AP-026": "An Phú Riverside", "GV-014": "Green Valley", "CP-008": "Central Park Towers", "LG-031": "Lumière Garden" };
    const customerProjects = { anh: "AP-026", khoa: "GV-014", yen: "CP-008", bao: "AP-026" };
    let tasks = [];
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) tasks = saved;
    } catch {
        tasks = [];
    }
    try {
        const leads = JSON.parse(null || "[]");
        if (Array.isArray(leads)) leads.forEach((lead) => {
            if (!lead.id || !lead.name) return;
            const option = document.createElement("option");
            option.value = lead.id;
            option.textContent = lead.name;
            option.dataset.phone = lead.phone || "";
            form.elements.customer.append(option);
            customerProjects[lead.id] = lead.projectCode;
        });
    } catch {
        // The four visible customer choices remain available.
    }
    try {
        const staff = JSON.parse(null || "[]");
        if (Array.isArray(staff)) staff.forEach((person) => {
            if (!person.name || person.accountType === "customer" || person.status === "Tạm ngưng" || person.loginAllowed === false || [...form.elements.assignee.options].some((option) => option.value === person.name)) return;
            form.elements.assignee.add(new Option(person.name));
        });
        const projects = JSON.parse(null || "[]");
        if (Array.isArray(projects)) projects.forEach((project) => {
            if (!project.code || !project.name || projectNames[project.code]) return;
            projectNames[project.code] = project.name;
            form.elements.project.add(new Option(project.name, project.code));
        });
    } catch {
        // Giữ các lựa chọn có sẵn trên trang.
    }
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        form.elements.deadline.setCustomValidity("");
    }

    function renderTask(task) {
        const article = document.createElement("article");
        const date = new Date(task.deadline);
        const clock = document.createElement("time");
        clock.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
        const dot = document.createElement("span");
        dot.className = `agenda-dot ${task.priority === "Ưu tiên" ? "amber" : "blue"}`;
        const body = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = task.title;
        const note = document.createElement("small");
        const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
        note.textContent = `${day} · ${projectNames[task.project] || "Dự án"} · Phụ trách: ${task.assignee}`;
        body.append(title, note);
        if (task.customer) {
            const customerLink = document.createElement("a");
            customerLink.className = "customer-link task-customer-link";
            customerLink.href = `customer-detail.html?id=${encodeURIComponent(task.customer)}`;
            customerLink.textContent = `Xem hồ sơ ${task.customerName}`;
            body.append(customerLink);
        }
        const priority = document.createElement("span");
        priority.className = `screen-badge ${task.priority === "Ưu tiên" ? "amber" : "blue"}`;
        priority.textContent = task.priority === "Ưu tiên" ? "Ưu tiên" : "Cần xử lý";
        article.append(clock, dot, body, priority);
        agenda.prepend(article);
    }

    tasks.slice().reverse().forEach(renderTask);
    const todayCount = document.querySelector(".screen-stats .screen-stat strong");
    const addedToday = tasks.filter((task) => new Date(task.deadline).toDateString() === new Date().toDateString()).length;
    if (todayCount) todayCount.textContent = String(24 + addedToday);
    document.querySelector("[data-task-open]")?.addEventListener("click", () => {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        const customerId = new URLSearchParams(location.search).get("customer");
        if (customerId && [...form.elements.customer.options].some((option) => option.value === customerId)) {
            form.elements.customer.value = customerId;
            form.elements.project.value = customerProjects[customerId] || "";
            form.elements.customer.dispatchEvent(new Event("change", { bubbles: true }));
        }
        form.elements.title.focus();
    });
    document.querySelectorAll("[data-task-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });
    form.elements.customer.addEventListener("change", () => {
        const project = customerProjects[form.elements.customer.value];
        if (project) form.elements.project.value = project;
    });
    form.elements.deadline.addEventListener("input", () => form.elements.deadline.setCustomValidity(""));
    if (new URLSearchParams(location.search).get("new") === "1") {
        document.querySelector("[data-task-open]")?.click();
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const deadline = new Date(form.elements.deadline.value);
        if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
            form.elements.deadline.setCustomValidity("Chọn thời hạn trong tương lai.");
            form.reportValidity();
            return;
        }
        const customerOption = form.elements.customer.selectedOptions[0];
        const task = {
            id: `task-${Date.now()}`,
            title: form.elements.title.value.trim(),
            customer: form.elements.customer.value,
            customerName: customerOption?.textContent || "",
            project: form.elements.project.value,
            assignee: form.elements.assignee.value,
            deadline: form.elements.deadline.value,
            priority: form.elements.priority.value,
        };
        tasks.push(task);
        try {
            void 0;
        } catch {
            tasks.pop();
            notify("Không thể lưu công việc trên trình duyệt này.");
            return;
        }
        renderTask(task);
        const today = new Date();
        if (deadline.toDateString() === today.toDateString()) {
            const count = document.querySelector(".screen-stats .screen-stat strong");
            if (count) count.textContent = String(Number(count.textContent.replace(/\D/g, "")) + 1);
        }
        close();
        notify("Đã thêm công việc vào lịch chăm sóc.");
    });
})();

