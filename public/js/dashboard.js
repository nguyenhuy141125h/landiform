(() => {
    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const search = document.querySelector("#globalSearch");
    const modal = document.querySelector("#actionModal");
    const form = document.querySelector("#quickAddForm");
    const input = document.querySelector("#quickAddInput");
    const toast = document.querySelector("#toastMessage");
    const title = document.querySelector("#modalTitle");
    const description = document.querySelector("#modalDescription");
    const fieldLabel = document.querySelector("#quickAddLabel");
    const field = document.querySelector("#quickAddInput");
    let currentAction = "project";
    let toastTimer;

    const actionCopy = {
        project: {
            title: "Thêm dự án mới",
            description: "Tạo dự án để bắt đầu quản lý khách hàng và hoạt động bán hàng.",
            label: "Tên dự án",
            placeholder: "Ví dụ: The Horizon Riverside",
            success: "Đã ghi nhận dự án mới trong giao diện xem trước.",
        },
        customer: {
            title: "Thêm khách hàng",
            description: "Ghi nhận khách hàng quan tâm và nhu cầu ban đầu.",
            label: "Tên khách hàng",
            placeholder: "Nhập họ tên khách hàng",
            success: "Đã ghi nhận khách hàng mới trong giao diện xem trước.",
        },
        task: {
            title: "Thêm công việc",
            description: "Tạo việc cần làm để đội ngũ theo dõi chăm sóc khách hàng.",
            label: "Nội dung công việc",
            placeholder: "Ví dụ: Gọi lại khách hàng",
            success: "Đã ghi nhận công việc mới trong giao diện xem trước.",
        },
    };

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function openModal(action) {
        currentAction = action;
        const copy = actionCopy[action] || actionCopy.project;
        title.textContent = copy.title;
        description.textContent = copy.description;
        fieldLabel.textContent = copy.label;
        field.placeholder = copy.placeholder;
        modal.hidden = false;
        document.body.classList.add("modal-open");
        window.setTimeout(() => input.focus(), 40);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document.querySelectorAll("[data-modal-open]").forEach((button) => {
        button.addEventListener("click", () => openModal(button.dataset.modalOpen));
    });

    document.querySelectorAll("[data-modal-cancel], .modal-close").forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeModal();
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            search.focus();
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const copy = actionCopy[currentAction] || actionCopy.project;
        closeModal();
        showToast(copy.success);
    });

    document.querySelectorAll(".task-item input").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) showToast("Đã cập nhật trạng thái công việc trong giao diện xem trước.");
        });
    });

    document.querySelectorAll(".nav-link[href^='#']").forEach((link) => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".nav-link").forEach((item) => {
                item.classList.remove("is-active");
                item.removeAttribute("aria-current");
            });
            link.classList.add("is-active");
            link.setAttribute("aria-current", "page");
            sidebar.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelector('[data-action="export"]').addEventListener("click", () => {
        showToast("Báo cáo sẽ được tải xuống khi kết nối dữ liệu được thiết lập.");
    });

    document.querySelector("#chartPeriod").addEventListener("change", (event) => {
        const groups = [...document.querySelectorAll("#barChart .bar-group")];
        const startMonth = event.target.value === "quarter" ? 4 : 0;
        groups.forEach((group, index) => {
            group.hidden = index < startMonth || index > 9;
        });
    });

    search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("vi");
        document.querySelectorAll(".project-table tbody tr").forEach((row) => {
            row.hidden = query && !row.textContent.toLocaleLowerCase("vi").includes(query);
        });
        document.querySelectorAll(".task-item").forEach((item) => {
            item.hidden = query && !item.textContent.toLocaleLowerCase("vi").includes(query);
        });
    });
})();
