(() => {
    const source = document.querySelector("#recordExamples");
    const form = document.querySelector("#recordDetailForm");
    const notFound = document.querySelector("#recordNotFound");
    if (!source || !form || !notFound) return;
    let records = [];
    try { records = JSON.parse(source.textContent); } catch { records = []; }
    const params = new URLSearchParams(location.search);
    const kind = params.get("type");
    const id = params.get("id");
    let record = records.find((item) => item.type === kind && item.id === id);
    if (!record && ["buyer", "appointment"].includes(kind) && (params.has("name") || params.has("customer"))) {
        record = Object.fromEntries(params.entries());
    }
    const config = {
        category: { label: "Danh mục sản phẩm", eyebrow: "CẤU TRÚC DANH MỤC", back: "categories.html", title: "Thông tin danh mục", intro: "Cập nhật cấp danh mục và mối liên hệ với danh mục cha.", fields: [["name", "Tên danh mục", "text"], ["level", "Cấp danh mục", "select", ["Cấp 1", "Cấp 2"]], ["parent", "Danh mục cha / nhóm", "text"], ["usage", "Sản phẩm đang sử dụng", "text", null, true], ["status", "Trạng thái", "select", ["Đang sử dụng", "Tạm ẩn"]]], facts: ["level", "parent", "usage"], help: "Cấp 1 là nhóm bất động sản; cấp 2 là loại sản phẩm thuộc danh mục cha." },
        form: { label: "Biểu mẫu & mã QR", eyebrow: "THU THẬP THÔNG TIN", back: "forms.html", title: "Cấu hình biểu mẫu", intro: "Chỉnh nội dung nhận khách, dự án và nơi sử dụng biểu mẫu.", fields: [["name", "Tên biểu mẫu", "text"], ["project", "Dự án", "select", ["An Phú Riverside", "Green Valley", "Central Park Towers", "Lumière Garden"]], ["place", "Nơi sử dụng", "select", ["Customer website", "Trang giới thiệu", "Mã QR tại sự kiện"]], ["status", "Trạng thái nhận đăng ký", "select", ["Đang nhận", "Bản nháp", "Tạm dừng"]], ["qr", "Mã QR", "select", ["Chưa bật", "Đã bật"]], ["fieldsCount", "Số trường thông tin", "text", null, true]], facts: ["project", "place", "qr"], checks: [["email", "Email"], ["need", "Nhu cầu quan tâm"], ["budget", "Ngân sách dự kiến"], ["appointment", "Thời gian muốn tham quan"]], help: "QR mở chính biểu mẫu này trên trang customer; khách gửi thông tin sẽ gắn với dự án." },
        buyer: { label: "Người mua & bàn giao", eyebrow: "HỒ SƠ NGƯỜI MUA", back: "buyers.html", title: "Thông tin người mua", intro: "Theo dõi người mua, sản phẩm đã giao dịch và hồ sơ bàn giao.", fields: [["code", "Mã khách hàng", "text", null, true], ["name", "Họ và tên", "text"], ["phone", "Số điện thoại", "tel"], ["project", "Dự án", "select", ["An Phú Riverside", "Green Valley", "Central Park Towers", "Lumière Garden"]], ["product", "Sản phẩm đã mua", "text"], ["handover", "Ngày dự kiến bàn giao", "date"], ["documents", "Tình trạng hồ sơ", "select", ["Đủ hồ sơ", "Đang bổ sung"]]], facts: ["project", "product", "documents"], help: "Hồ sơ người mua gắn với sản phẩm đã giao dịch để theo dõi bàn giao." },
        appointment: { label: "Công việc & lịch hẹn", eyebrow: "LỊCH CHĂM SÓC KHÁCH HÀNG", back: "workflow.html#appointments", title: "Thông tin lịch hẹn", intro: "Xem lịch tư vấn, khách hàng, sản phẩm quan tâm và người phụ trách.", fields: [["customer", "Khách hàng", "text"], ["project", "Dự án", "select", ["An Phú Riverside", "Green Valley", "Central Park Towers", "Lumière Garden"]], ["product", "Sản phẩm quan tâm", "text"], ["start", "Ngày và giờ hẹn", "datetime-local"], ["activity", "Hoạt động", "select", ["Gọi tư vấn", "Tư vấn tại văn phòng", "Dẫn khách xem nhà", "Tham quan nhà mẫu", "Bàn giao căn hộ"]], ["place", "Địa điểm / cách liên hệ", "text"], ["assignee", "Nhân viên phụ trách", "text"], ["status", "Trạng thái", "select", ["Chờ phân công", "Đã phân công", "Đã xác nhận", "Hoàn tất", "Đã hủy"]]], facts: ["project", "activity", "assignee", "status"], help: "Trang này gom thông tin lịch hẹn vào hồ sơ riêng. Nút lưu sẽ nối backend khi API lịch hẹn sẵn sàng." }
    };
    const schema = config[kind];
    if (!record || !schema) {
        form.hidden = true;
        notFound.hidden = false;
        notFound.querySelector("#recordNotFoundLink").href = schema?.back || "index.html";
        return;
    }
    const fields = document.querySelector("#recordFields");
    const checks = document.querySelector("#recordChecks");
    const makeField = ([name, label, type, options, readonly]) => {
        const wrapper = document.createElement("label");
        wrapper.className = "field";
        const caption = document.createElement("span");
        caption.textContent = label;
        const control = type === "select" ? document.createElement("select") : document.createElement("input");
        control.name = name;
        if (type !== "select") control.type = type;
        if (readonly) control.readOnly = true;
        if (type === "select") {
            options.forEach((option) => control.add(new Option(option, option)));
            if (record[name] && ![...control.options].some((option) => option.value === record[name])) {
                control.add(new Option(record[name], record[name]));
            }
        }
        control.value = record[name] || "";
        wrapper.append(caption, control);
        return wrapper;
    };
    schema.fields.forEach((field) => fields.append(makeField(field)));
    if (schema.checks) {
        checks.hidden = false;
        schema.checks.forEach(([name, label]) => {
            const wrapper = document.createElement("label");
            wrapper.className = "record-check";
            const control = document.createElement("input");
            control.type = "checkbox";
            control.name = name;
            control.checked = Boolean(record[name]);
            const text = document.createElement("span");
            text.textContent = label;
            wrapper.append(control, text);
            checks.append(wrapper);
        });
    }
    const titleValue = record.name || record.code || record.customer || record.id;
    document.title = `${titleValue} | LANDIFORM`;
    document.querySelector("#recordEyebrow").textContent = schema.eyebrow;
    document.querySelector("#recordTitle").textContent = titleValue;
    document.querySelector("#recordSubtitle").textContent = `${schema.label} · ${record.project || record.parent || "LANDIFORM"}`;
    document.querySelector("#recordBadge").textContent = schema.label;
    document.querySelector("#recordSectionTitle").textContent = schema.title;
    document.querySelector("#recordSectionIntro").textContent = schema.intro;
    document.querySelector("#recordHelpText").textContent = schema.help;
    document.querySelector("#recordSummaryTitle").textContent = titleValue;
    document.querySelector("#recordSummarySubtitle").textContent = schema.label;
    document.querySelector("#recordBackLink").href = schema.back;
    document.querySelector("#recordCancelLink").href = schema.back;
    document.querySelector("#recordNotFoundLink").href = schema.back;
    const facts = document.querySelector("#recordSummaryFacts");
    schema.facts.forEach((key) => {
        const definition = schema.fields.find((field) => field[0] === key);
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const value = document.createElement("dd");
        term.textContent = definition?.[1] || key;
        value.textContent = record[key] || "—";
        row.append(term, value);
        facts.append(row);
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", { detail: { form, values: new FormData(form) } }));
    });
})();
