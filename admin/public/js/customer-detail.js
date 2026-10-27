(() => {
    const root = document.querySelector("#customerDetail");
    if (!root) return;

    const customers = {
        anh: {
            name: "Nguyễn Ngọc Anh",
            phone: "0903 456 218",
            project: "An Phú Riverside",
            projectCode: "AP-026",
            need: "Căn hộ 2 phòng ngủ",
            budget: "3–4 tỷ",
            source: "Google Ads · Customer website",
            received: "21/10/2026 · 08:45",
            owner: "Trần Thanh Long",
            status: "Chưa liên hệ",
            activities: [
                { type: "Đăng ký", note: "Khách đăng ký tìm hiểu căn hộ 2 phòng ngủ qua customer website dùng chung.", at: "21/10/2026 · 08:45" },
            ],
        },
        khoa: {
            name: "Trần Minh Khoa",
            phone: "0918 224 760",
            project: "Green Valley",
            projectCode: "GV-014",
            need: "Nhà phố",
            budget: "8–9 tỷ",
            source: "SEO · Customer website",
            received: "19/10/2026 · 10:20",
            owner: "Quỳnh Dao",
            status: "Đang tư vấn",
            activities: [
                { type: "Cuộc gọi", note: "Đã trao đổi về diện tích, vị trí và khoảng giá phù hợp.", at: "20/10/2026 · 16:20" },
                { type: "Đăng ký", note: "Khách gửi thông tin qua website Green Valley.", at: "19/10/2026 · 10:20" },
            ],
        },
        yen: {
            name: "Lê Hoàng Yến",
            phone: "0987 332 104",
            project: "Central Park Towers",
            projectCode: "CP-008",
            need: "Căn hộ 3 phòng ngủ · Bàn giao",
            budget: "5–6 tỷ",
            source: "Mã QR · Sự kiện mở bán",
            received: "20/10/2026 · 14:10",
            owner: "Mai Ngọc",
            status: "Đã giao dịch",
            activities: [
                { type: "Lịch hẹn", note: "Đã hoàn tất tham quan và ký mua căn B1 · 08.03; lịch bàn giao đã được tạo.", at: "20/10/2026 · 14:10" },
                { type: "Đăng ký", note: "Khách quét mã QR tại sự kiện giới thiệu dự án.", at: "19/10/2026 · 09:30" },
            ],
        },
        bao: {
            name: "Phạm Quốc Bảo",
            phone: "0908 113 624",
            project: "An Phú Riverside",
            projectCode: "AP-026",
            need: "Đầu tư căn hộ 3 phòng ngủ",
            budget: "5–6 tỷ",
            source: "Meta Ads · Campaign T10",
            received: "15/10/2026 · 11:35",
            owner: "Trần Thanh Long",
            status: "Đang đàm phán",
            activities: [
                { type: "Cuộc gọi", note: "Đã trao đổi về sản phẩm phù hợp và phương án thanh toán.", at: "20/10/2026 · 11:35" },
                { type: "Gửi thông tin", note: "Đã gửi danh sách căn hộ còn bán.", at: "18/10/2026 · 15:20" },
            ],
        },
        nam: {
            name: "Võ Hoàng Nam",
            phone: "Chưa cập nhật",
            project: "Green Valley",
            projectCode: "GV-014",
            need: "Nhà phố",
            budget: "8–9 tỷ",
            source: "Customer website",
            received: "21/10/2026 · 09:10",
            owner: "Quỳnh Dao",
            status: "Chưa liên hệ",
            activities: [
                { type: "Đăng ký", note: "Khách để lại thông tin quan tâm nhà phố.", at: "21/10/2026 · 09:10" },
            ],
        },
    };

    let addedCustomers = [];
    try {
        const stored = JSON.parse(null || "[]");
        if (Array.isArray(stored)) addedCustomers = stored;
    } catch {
        addedCustomers = [];
    }
    const customerId = new URLSearchParams(location.search).get("id") || "anh";
    const customerRelations = {
        anh: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1208", campaignId: "campaign-an-phu-launch-1", ownerId: "staff-long" },
        khoa: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
        yen: { projectCode: "CP-008", formId: "viewing", productId: "unit-cp-b1-0803", campaignId: "campaign-central-park-event", ownerId: "staff-mai" },
        bao: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1210", campaignId: "campaign-an-phu-meta-oct", ownerId: "staff-long" },
        nam: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-06", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
        dat: { projectCode: "AP-026", formId: "consult", productId: "unit-ap-a2-1506", campaignId: "campaign-an-phu-meta-oct", ownerId: "staff-long" },
        ha: { projectCode: "GV-014", formId: "price", productId: "unit-gv-n08-05", campaignId: "campaign-green-valley-organic", ownerId: "staff-quynh" },
    };
    const savedLead = addedCustomers.find((item) => item.id === customerId);
    const customer = { ...(customerRelations[customerId] || {}), ...(customers[customerId] || savedLead || {}), ...(savedLead || {}) };
    const toast = document.querySelector("#toastMessage");
    let toastTimer;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    if (!customer) {
        root.innerHTML = '<div class="project-not-found"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><h1>Không tìm thấy khách hàng</h1><p>Hồ sơ này không có trong danh sách hiện tại.</p><a class="button button-primary" href="leads.html">Quay lại danh sách khách hàng</a></div>';
        return;
    }

    const storageKey = `landiform.admin.customer.${customerId}.v1`;
    let saved = {};
    try {
        saved = JSON.parse(null || "{}") || {};
    } catch {
        saved = {};
    }
    const state = {
        status: saved.status || customer.status,
        owner: saved.owner || customer.owner,
        activities: Array.isArray(saved.activities) ? saved.activities : [],
    };
    try {
        const staff = JSON.parse(null || "[]");
        const ownerField = document.querySelector("#customerAssignee");
        if (Array.isArray(staff) && ownerField) staff.forEach((person) => {
            if (person.name && person.accountType !== "customer" && person.status !== "Tạm ngưng" && ![...ownerField.options].some((option) => option.value === person.name)) {
                ownerField.add(new Option(person.name));
            }
        });
        if (ownerField && state.owner && ![...ownerField.options].some((option) => option.value === state.owner)) {
            ownerField.add(new Option(state.owner));
        }
    } catch {
        // Giữ các lựa chọn người phụ trách có sẵn.
    }

    function save() {
        try {
            void 0;
            return true;
        } catch {
            notify("Không thể lưu thay đổi trên trình duyệt này.");
            return false;
        }
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function renderRelations() {
        const list = document.querySelector("#customerRelations");
        if (!list) return;
        const labels = {
            formId: { text: "Biểu mẫu", href: () => "forms.html" },
            productId: { text: "Sản phẩm", href: () => "booking.html" },
            campaignId: { text: "Chiến dịch", href: (value) => `campaigns.html#${encodeURIComponent(value)}` },
            appointmentId: { text: "Lịch hẹn", href: () => "workflow.html#appointments" },
            buyerId: { text: "Hồ sơ người mua", href: () => "buyers.html" },
        };
        const names = {
            ap: "An Phú Riverside", gv: "Green Valley", cp: "Central Park Towers", lg: "Lumière Garden",
            consult: "Đăng ký tư vấn", price: "Nhận bảng giá", viewing: "Đăng ký tham quan", "land-interest": "Đăng ký quan tâm",
            "unit-ap-a2-1208": "Căn A2 · 12.08", "unit-ap-a2-1209": "Căn A2 · 12.09", "unit-ap-a2-1210": "Căn A2 · 12.10", "unit-ap-a2-1506": "Căn A2 · 15.06",
            "unit-gv-n08-05": "Nhà phố N08 · 05", "unit-gv-n08-06": "Nhà phố N08 · 06",
            "unit-cp-b1-0803": "Căn B1 · 08.03",
            "campaign-an-phu-launch-1": "Mở bán An Phú · Google Ads",
            "campaign-central-park-event": "Sự kiện Central Park · QR",
            "campaign-green-valley-organic": "Green Valley · SEO",
            "campaign-an-phu-meta-oct": "Mở bán An Phú · Meta tháng 10",
        };
        const linked = { ...customer };
        try {
            const buyerData = JSON.parse(null || "null");
            const buyerRecords = Array.isArray(buyerData) ? buyerData : buyerData?.items || [];
            const buyer = buyerRecords.find((item) => item.leadId === customerId);
            linked.buyerId = buyer?.id || "";
            linked.buyerLabel = buyer?.code || "";
        } catch { /* Buyer link is optional until a matching sales record exists. */ }
        try {
            const appointments = window.LandiformAppointments?.all() || [];
            const appointment = appointments.find((item) => item.customer === customerId);
            linked.appointmentId = appointment?.id || "";
            linked.appointmentLabel = appointment ? `${appointment.type} · ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(appointment.start))}` : "";
        } catch { /* Appointment link is optional for a lead without a scheduled meeting. */ }
        list.replaceChildren();
        Object.entries(labels).forEach(([key, label]) => {
            const value = linked[key];
            if (!value) return;
            const row = document.createElement("div");
            const term = document.createElement("dt");
            term.textContent = label.text;
            const detail = document.createElement("dd");
            const link = document.createElement("a");
            link.href = label.href(value);
            link.textContent = key === "buyerId"
                ? linked.buyerLabel || value
                : key === "appointmentId" ? linked.appointmentLabel : names[value] || value;
            detail.append(link);
            row.append(term, detail);
            list.append(row);
        });
    }

    function renderStatus() {
        setText("customerOwner", state.owner);
        const badge = document.querySelector("#customerStatusBadge");
        if (badge) {
            badge.textContent = state.status;
            const tones = {
                "Chưa liên hệ": "amber",
                "Đang tư vấn": "blue",
                "Đã hẹn tham quan": "violet",
                "Đang đàm phán": "green",
                "Đã giao dịch": "green",
                "Không phù hợp": "neutral",
            };
            badge.className = `screen-badge ${tones[state.status] || "neutral"}`;
        }
        document.querySelector("#customerStatus").value = state.status;
        document.querySelector("#customerAssignee").value = state.owner;
    }

    function renderTimeline() {
        const timeline = document.querySelector("#customerTimeline");
        if (!timeline) return;
        timeline.replaceChildren();
        const icons = {
            "Cuộc gọi": "fa-phone",
            "Lịch hẹn": "fa-calendar-check",
            "Gửi thông tin": "fa-paper-plane",
            "Ghi chú": "fa-note-sticky",
            "Đăng ký": "fa-user-plus",
        };
        [...state.activities, ...customer.activities].forEach((activity) => {
            const item = document.createElement("li");
            const icon = document.createElement("span");
            icon.className = "customer-timeline-icon";
            const symbol = document.createElement("i");
            symbol.className = `fa-solid ${icons[activity.type] || "fa-note-sticky"}`;
            symbol.setAttribute("aria-hidden", "true");
            icon.append(symbol);
            const body = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = activity.type === "Đăng ký" ? "Khách gửi thông tin quan tâm" : activity.type;
            const note = document.createElement("p");
            note.textContent = activity.note;
            const time = document.createElement("time");
            time.textContent = activity.at;
            body.append(title, note, time);
            item.append(icon, body);
            timeline.append(item);
        });
    }

    setText("customerName", customer.name);
    setText("customerPhone", customer.phone);
    setText("customerProject", customer.project);
    setText("customerNeed", customer.need);
    setText("customerBudget", customer.budget);
    setText("customerSource", customer.source);
    setText("customerReceived", customer.received);
    setText("customerEmail", customer.email || "Chưa cập nhật");
    renderRelations();
    const phoneLink = document.querySelector("#customerPhoneLink");
    const tasksLink = document.querySelector("#customerTasksLink");
    const appointmentLink = document.querySelector("#customerAppointmentLink");
    const appointmentListLink = document.querySelector("#customerAppointmentListLink");
    if (tasksLink) tasksLink.href = `workflow.html?customer=${encodeURIComponent(customerId)}&new=1`;
    if (appointmentLink) appointmentLink.href = `workflow.html?customer=${encodeURIComponent(customerId)}&appointment=1#appointments`;
    if (appointmentListLink) appointmentListLink.href = `workflow.html#appointments`;
    if (phoneLink) {
        if (customer.phone === "Chưa cập nhật") phoneLink.hidden = true;
        else phoneLink.href = `tel:${customer.phone.replace(/\D/g, "")}`;
    }
    const projectLink = document.querySelector("#customerProjectLink");
    if (projectLink) {
        projectLink.href = `project-detail.html?code=${encodeURIComponent(customer.projectCode)}`;
        projectLink.firstChild.textContent = `${customer.project} `;
    }
    renderStatus();
    renderTimeline();

    const appointmentList = document.querySelector("#customerAppointments");
    if (appointmentList) {
        const appointments = window.LandiformAppointments?.all() || [];
        const upcoming = appointments.filter((item) =>
            item.customer === customerId && !["Hoàn tất", "Đã hủy"].includes(item.status) &&
            new Date(item.start).getTime() >= Date.now()
        ).sort((a, b) => new Date(a.start) - new Date(b.start));
        appointmentList.replaceChildren();
        if (!upcoming.length) {
            const empty = document.createElement("p");
            empty.textContent = "Chưa có lịch hẹn sắp tới. Chọn “Đặt lịch tư vấn” để thêm lịch cho khách.";
            appointmentList.append(empty);
        }
        for (const item of upcoming) {
            const article = document.createElement("article");
            const time = document.createElement("time");
            time.textContent = new Intl.DateTimeFormat("vi-VN", {
                weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            }).format(new Date(item.start));
            const body = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = item.type;
            const note = document.createElement("span");
            note.textContent = item.assignee ? `Tư vấn: ${item.assignee}` : "Chờ phân công nhân viên tư vấn";
            body.append(title, note);
            article.append(time, body);
            appointmentList.append(article);
        }
    }

    document.querySelector("#customerProgressForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        state.status = form.elements.status.value;
        state.owner = form.elements.owner.value;
        if (!save()) return;
        renderStatus();
        notify("Đã cập nhật trạng thái và người phụ trách.");
    });

    document.querySelector("#customerActivityForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const note = form.elements.note.value.trim();
        if (!note) return;
        const at = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        }).format(new Date());
        state.activities.unshift({ type: form.elements.type.value, note, at });
        if (!save()) {
            state.activities.shift();
            return;
        }
        form.reset();
        renderTimeline();
        notify("Đã lưu hoạt động chăm sóc.");
    });
})();

