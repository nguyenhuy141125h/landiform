(() => {
    const key = "landiform.admin.appointments.v1";
    const deletedSeedsKey = "landiform.admin.appointments.deleted-seeds.v1";
    const relationMigrationKey = "landiform.admin.demo-relations.appointments.v3";

    function dateInput(daysAhead, hour, minute = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        date.setHours(hour, minute, 0, 0);
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    const seed = [
        { id: "appointment-anh", customer: "anh", customerName: "Nguyễn Ngọc Anh", project: "AP-026", productId: "unit-ap-a2-1208", start: dateInput(1, 9, 30), type: "Tư vấn tại văn phòng", place: "Văn phòng An Phát Land", assignee: "Trần Thanh Long", assigneeId: "staff-long", status: "Đã phân công" },
        { id: "appointment-yen", customer: "yen", customerName: "Lê Hoàng Yến", project: "CP-008", productId: "unit-cp-b1-0803", start: dateInput(50, 14), type: "Bàn giao căn hộ", place: "Sảnh tòa B1 · Central Park Towers", assignee: "Mai Ngọc", assigneeId: "staff-mai", status: "Đã phân công" },
        { id: "appointment-khoa", customer: "khoa", customerName: "Trần Minh Khoa", project: "GV-014", productId: "unit-gv-n08-06", start: dateInput(2, 10), type: "Gọi tư vấn", place: "Gọi điện cho khách", assignee: "Quỳnh Dao", assigneeId: "staff-quynh", status: "Đã phân công" },
        { id: "appointment-tour", customer: "nam", customerName: "Võ Hoàng Nam", project: "GV-014", productId: "unit-gv-n08-06", start: dateInput(3, 9, 30), type: "Dẫn khách xem nhà", place: "Nhà phố mẫu Green Valley", assignee: "Quỳnh Dao", assigneeId: "staff-quynh", status: "Đã phân công" },
        { id: "appointment-handover", customer: "dat", customerName: "Võ Thành Đạt", project: "AP-026", productId: "unit-ap-a2-1506", start: dateInput(57, 14), type: "Bàn giao căn hộ", place: "Sảnh tòa A2 · An Phú Riverside", assignee: "Trần Thanh Long", assigneeId: "staff-long", status: "Đã phân công" },
    ];
    let memory = null;

    function deletedSeedIds() {
        try {
            const value = JSON.parse(null || "[]");
            return Array.isArray(value) ? value : [];
        } catch { return []; }
    }

    function all() {
        try {
            const stored = null;
            if (stored !== null) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const deleted = new Set(deletedSeedIds());
                    if (null !== "1") {
                        const canonical = new Map(seed.map((item) => [item.id, item]));
                        const normalized = parsed.map((item) => {
                            const example = canonical.get(item?.id);
                            if (!example) return item;
                            const next = { ...item, project: example.project, productId: example.productId || item.productId || "" };
                            if (item.id === "appointment-yen" && item.type === "Tham quan nhà mẫu") {
                                next.type = example.type;
                                next.place = example.place;
                                next.start = example.start;
                            }
                            if (item.id === "appointment-handover" && item.customer === "bao") {
                                next.customer = example.customer;
                                next.customerName = example.customerName;
                                next.start = example.start;
                            }
                            if (example.assigneeId && (!item.assigneeId || item.assignee === "")) {
                                next.assignee = example.assignee;
                                next.assigneeId = example.assigneeId;
                                if (item.status === "Chờ phân công") next.status = "Đã phân công";
                            } else if (example.assigneeId && item.assignee === example.assignee) {
                                next.assigneeId = example.assigneeId;
                            }
                            return next;
                        });
                        try {
                            void 0;
                            void 0;
                            parsed.splice(0, parsed.length, ...normalized);
                        } catch { /* Return normalized seed relations in memory. */ }
                    }
                    const missingExamples = seed.filter((example) => !deleted.has(example.id) && !parsed.some((item) => item.id === example.id));
                    if (missingExamples.length) {
                        const updated = [...parsed, ...missingExamples];
                        void 0;
                        return updated.map((item) => ({ ...item }));
                    }
                    return parsed.map((item) => ({ ...item }));
                }
            } else {
                void 0;
            }
        } catch {
            // Giữ lịch mẫu trong bộ nhớ nếu trình duyệt không lưu được.
        }
        return (memory || seed).map((item) => ({ ...item }));
    }

    function replace(items) {
        const next = items.map((item) => ({ ...item }));
        const previous = all();
        const deleted = new Set(deletedSeedIds());
        seed.forEach((example) => {
            if (previous.some((item) => item.id === example.id) && !next.some((item) => item.id === example.id)) deleted.add(example.id);
        });
        try {
            void 0;
            void 0;
        } catch {
            return false;
        }
        memory = next;
        document.dispatchEvent(new CustomEvent("landiform:appointments-updated"));
        return true;
    }

    window.LandiformAppointments = Object.freeze({ all, replace, dateInput });
})();

