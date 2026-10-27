(() => {
    const monthInput = document.querySelector("#reportMonth");
    const tableBody = document.querySelector("#reportProjectRows");
    if (!monthInput) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthInput.value = currentMonth;
    monthInput.max = currentMonth;
    monthInput.min = "2020-01";

    const monthFactors = [0.52, 0.56, 0.61, 0.65, 0.7, 0.75, 0.81, 0.85, 0.8865, 1, 1.05, 1.1];
    const projects = [
        { code: "AP-026", name: "An Phú Riverside", detail: "Căn hộ · TP. Thủ Đức", color: "blue", icon: "fa-building", visits: 18420 },
        { code: "GV-014", name: "Green Valley", detail: "Nhà phố · Biên Hòa", color: "green", icon: "fa-house", visits: 12860 },
        { code: "CP-008", name: "Central Park Towers", detail: "Căn hộ · Quận 7", color: "violet", icon: "fa-building", visits: 7240 },
    ];
    const demoLeads = [
        { id: "anh", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", status: "Chưa liên hệ", received: "21/10/2026 · 08:45" },
        { id: "khoa", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", status: "Đang tư vấn", received: "19/10/2026 · 10:20" },
        { id: "yen", projectCode: "CP-008", ownerId: "staff-mai", owner: "Mai Ngọc", status: "Đã giao dịch", received: "20/10/2026 · 14:10" },
        { id: "bao", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", status: "Đang đàm phán", received: "15/10/2026 · 11:35" },
        { id: "nam", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", status: "Đang tư vấn", received: "21/10/2026 · 09:10" },
        { id: "dat", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", status: "Đã giao dịch", received: "12/10/2026 · 10:15" },
        { id: "ha", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", status: "Đã giao dịch", received: "08/10/2026 · 11:30" },
    ];
    const demoStaff = [
        { id: "staff-long", name: "Trần Thanh Long", role: "Nhân viên tư vấn", accountType: "employee" },
        { id: "staff-quynh", name: "Quỳnh Dao", role: "Nhân viên tư vấn", accountType: "employee" },
        { id: "staff-mai", name: "Mai Ngọc", role: "Chăm sóc khách hàng", accountType: "employee" },
    ];
    const demoBuyers = [
        { leadId: "yen", productId: "unit-cp-b1-0803" },
        { leadId: "dat", productId: "unit-ap-a2-1506" },
        { leadId: "ha", productId: "unit-gv-n08-05" },
    ];
    const demoUnits = [
        { id: "unit-cp-b1-0803", price: 5.1, commissionPercent: 2 },
        { id: "unit-ap-a2-1506", price: 3.8, commissionPercent: 2 },
        { id: "unit-gv-n08-05", price: 8.2, commissionPercent: 2 },
    ];
    const format = (value) => Math.round(value).toLocaleString("vi-VN");
    const percent = (value, total) => total ? `${Math.round(value / total * 100)}%` : "0%";
    const formatMoney = (value) => value >= 1
        ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
        : `${(value * 1000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} triệu`;

    function getMonthlyData(date) {
        const factor = monthFactors[date.getMonth()] * Math.pow(0.88, Math.max(0, now.getFullYear() - date.getFullYear()));
        const leads = readList("landiform.admin.leads.v1", demoLeads).filter((lead) => {
            const received = dateFor(lead.received || lead.createdAt);
            return received && received.getFullYear() === date.getFullYear() && received.getMonth() === date.getMonth();
        });
        const appointments = window.LandiformAppointments?.all?.().filter((appointment) => {
            const start = dateFor(appointment.start);
            return start && start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth() && appointment.status !== "Đã hủy";
        }) || [];
        const rows = projects.map((project) => {
            const projectLeads = leads.filter((lead) => (lead.projectCode || lead.project) === project.code);
            const projectAppointments = appointments.filter((appointment) => (appointment.projectCode || appointment.project) === project.code);
            return {
                ...project,
                visits: Math.round(project.visits * factor),
                leads: projectLeads.length,
                qualified: projectLeads.filter((lead) => ["Đang tư vấn", "Đã hẹn tham quan", "Đang đàm phán", "Đã giao dịch"].includes(lead.status)).length,
                appointments: projectAppointments.length,
                deals: projectLeads.filter((lead) => lead.status === "Đã giao dịch").length,
            };
        });
        const totals = rows.reduce((sum, row) => ({
            leads: sum.leads + row.leads,
            qualified: sum.qualified + row.qualified,
            appointments: sum.appointments + row.appointments,
            deals: sum.deals + row.deals,
        }), { leads: 0, qualified: 0, appointments: 0, deals: 0 });
        const buyers = readList("landiform.admin.buyers.v1", demoBuyers);
        const bookingStatuses = (() => { try { return JSON.parse(null || "{}"); } catch { return {}; } })();
        const bookings = readList("landiform.admin.bookings.v1", [{ code: "BK-2026-084", createdAt: "2026-10-22T09:15:00" }]).filter((booking) => {
            const created = dateFor(booking.createdAt || booking.created);
            const status = bookingStatuses[booking.code] || "Chờ duyệt";
            return created && created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth() && !["Đã hủy", "Hoàn tất"].includes(status);
        });
        const leadIds = new Set(leads.map((lead) => lead.id));
        const handoffs = buyers.filter((buyer) => leadIds.has(buyer.leadId) && buyer.documents !== "Đủ hồ sơ").length;
        const tasks = {
            uncontacted: leads.filter((lead) => lead.status === "Chưa liên hệ").length,
            appointments: appointments.length,
            holds: bookings.length,
            handoffs,
        };
        return { rows, totals, tasks };
    }

    function setText(selector, value) {
        const node = document.querySelector(selector);
        if (node) node.textContent = value;
    }

    function renderProject(row) {
        const tr = document.createElement("tr");
        const projectCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const iconWrap = document.createElement("span");
        iconWrap.className = `screen-entity-icon ${row.color}`;
        const icon = document.createElement("i");
        icon.className = `fa-solid ${row.icon}`;
        icon.setAttribute("aria-hidden", "true");
        iconWrap.append(icon);
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = row.name;
        const detail = document.createElement("small");
        detail.textContent = row.detail;
        copy.append(title, detail);
        entity.append(iconWrap, copy);
        projectCell.append(entity);
        tr.append(projectCell);
        [row.visits, row.leads, row.qualified, row.appointments, row.deals].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = format(value);
            tr.append(cell);
        });
        return tr;
    }

    function readList(key, fallback) {
        try {
            const saved = JSON.parse(null || "null");
            if (Array.isArray(saved)) return saved;
            if (Array.isArray(saved?.items)) return saved.items;
        } catch { /* Use linked report examples when browser storage is unavailable. */ }
        return fallback;
    }

    function dateFor(value) {
        const text = String(value || "");
        const localized = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (localized) return new Date(Number(localized[3]), Number(localized[2]) - 1, Number(localized[1]));
        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        return iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : null;
    }

    function renderStaff(date) {
        const rows = document.querySelector("#reportStaffRows");
        const empty = document.querySelector("#reportStaffEmpty");
        const chart = document.querySelector("#reportStaffRevenueChart");
        if (!rows || !empty || !chart) return;
        const storedStaff = readList("landiform.admin.team.v1", demoStaff);
        const staff = storedStaff.filter((person) => person?.name && person.accountType !== "customer" && person.status !== "Tạm ngưng");
        const leads = readList("landiform.admin.leads.v1", demoLeads).filter((lead) => {
            const received = dateFor(lead.received || lead.createdAt);
            return received && received.getFullYear() === date.getFullYear() && received.getMonth() === date.getMonth();
        });
        const appointments = (window.LandiformAppointments?.all?.() || []).filter((appointment) => {
            const start = dateFor(appointment.start);
            return start && start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth() && appointment.status !== "Đã hủy";
        });
        const ownerLookup = new Map(staff.map((person) => [person.id, person]));
        const byName = new Map(staff.map((person) => [person.name.toLocaleLowerCase("vi"), person]));
        const totals = new Map(staff.map((person) => [person.id, { leads: 0, qualified: 0, appointments: 0, deals: 0, revenue: 0, commission: 0 }]));

        function ensureOwner(id, name) {
            let person = id ? ownerLookup.get(id) : null;
            if (!person && name) person = byName.get(String(name).toLocaleLowerCase("vi"));
            if (!person && name) {
                person = { id: id || `owner-${name}`, name: String(name), role: "Nhân viên", accountType: "employee" };
                staff.push(person);
                ownerLookup.set(person.id, person);
                byName.set(person.name.toLocaleLowerCase("vi"), person);
                totals.set(person.id, { leads: 0, qualified: 0, appointments: 0, deals: 0, revenue: 0, commission: 0 });
            }
            return person;
        }

        leads.forEach((lead) => {
            const person = ensureOwner(lead.ownerId, lead.owner);
            if (!person) return;
            const stats = totals.get(person.id);
            stats.leads += 1;
            if (["Đang tư vấn", "Đã hẹn tham quan", "Đang đàm phán", "Đã giao dịch"].includes(lead.status)) stats.qualified += 1;
            if (lead.status === "Đã giao dịch") stats.deals += 1;
        });
        appointments.forEach((appointment) => {
            const person = ensureOwner(appointment.assigneeId, appointment.assignee);
            if (person) totals.get(person.id).appointments += 1;
        });

        const leadById = new Map(leads.map((lead) => [lead.id, lead]));
        const units = [...demoUnits, ...readList("landiform.admin.units.v1", [])];
        const unitById = new Map(units.map((unit) => [unit.id, unit]));
        readList("landiform.admin.buyers.v1", demoBuyers).forEach((buyer) => {
            const lead = leadById.get(buyer.leadId);
            if (!lead || lead.status !== "Đã giao dịch") return;
            const person = ensureOwner(lead.ownerId, lead.owner);
            if (!person) return;
            const unit = unitById.get(buyer.productId);
            const revenue = Number(buyer.salePrice ?? buyer.amount ?? unit?.price ?? 0);
            const commissionPercent = Number(unit?.commissionPercent ?? buyer.commissionPercent ?? 2);
            const stats = totals.get(person.id);
            if (!stats || !Number.isFinite(revenue)) return;
            stats.revenue += revenue;
            stats.commission += revenue * (Number.isFinite(commissionPercent) ? commissionPercent : 0) / 100;
        });

        const activeRows = staff.map((person) => ({ person, ...(totals.get(person.id) || { leads: 0, qualified: 0, appointments: 0, deals: 0, revenue: 0, commission: 0 }) }));
        const hasActivity = activeRows.some((row) => row.leads || row.appointments || row.deals);
        const total = activeRows.reduce((sum, row) => ({
            leads: sum.leads + row.leads,
            qualified: sum.qualified + row.qualified,
            appointments: sum.appointments + row.appointments,
            deals: sum.deals + row.deals,
            revenue: sum.revenue + row.revenue,
            commission: sum.commission + row.commission,
        }), { leads: 0, qualified: 0, appointments: 0, deals: 0, revenue: 0, commission: 0 });
        setText("#reportStaffActive", format(activeRows.filter((row) => row.leads || row.appointments || row.deals).length));
        setText("#reportStaffLeads", format(total.leads));
        setText("#reportStaffDeals", format(total.deals));
        setText("#reportStaffRevenue", formatMoney(total.revenue));
        setText("#reportStaffCommission", `Hoa hồng dự kiến: ${formatMoney(total.commission)}`);
        empty.hidden = hasActivity;
        activeRows.sort((a, b) => b.deals - a.deals || b.leads - a.leads || b.appointments - a.appointments || a.person.name.localeCompare(b.person.name, "vi"));
        rows.replaceChildren(...(hasActivity ? activeRows : []).map(({ person, leads: leadCount, qualified, appointments: appointmentCount, deals, revenue, commission }) => {
            const tr = document.createElement("tr");
            const nameCell = document.createElement("td");
            const entity = document.createElement("span");
            entity.className = "screen-entity";
            const avatar = document.createElement("span");
            avatar.className = "report-staff-avatar";
            avatar.textContent = String(person.name).trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi");
            const nameWrap = document.createElement("span");
            const name = document.createElement("strong");
            name.textContent = person.name;
            nameWrap.append(name);
            entity.append(avatar, nameWrap);
            nameCell.append(entity);
            tr.append(nameCell);
            const values = [person.role || "Nhân viên", format(leadCount), format(qualified), format(appointmentCount), format(deals), formatMoney(revenue), formatMoney(commission), percent(deals, leadCount)];
            values.forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                tr.append(cell);
            });
            return tr;
        }));
        const revenueRows = activeRows.filter((row) => row.revenue > 0).sort((a, b) => b.revenue - a.revenue);
        chart.replaceChildren();
        if (!revenueRows.length) {
            const message = document.createElement("p");
            message.className = "report-staff-chart-empty";
            message.textContent = "Chưa ghi nhận giao dịch trong kỳ báo cáo này.";
            chart.append(message);
            return;
        }
        const maxRevenue = Math.max(...revenueRows.map((row) => row.revenue), 1);
        revenueRows.forEach((row, index) => {
            const item = document.createElement("div");
            item.className = "report-staff-chart-row";
            const label = document.createElement("div");
            label.className = "report-staff-chart-label";
            const name = document.createElement("strong");
            name.textContent = row.person.name;
            const dealCount = document.createElement("small");
            dealCount.textContent = `${format(row.deals)} giao dịch`;
            label.append(name, dealCount);
            const track = document.createElement("div");
            track.className = "report-staff-chart-track";
            const bar = document.createElement("i");
            bar.className = `tone-${index % 4}`;
            bar.style.width = `${Math.max(3, row.revenue / maxRevenue * 100)}%`;
            bar.title = `${row.person.name}: ${formatMoney(row.revenue)} · Hoa hồng ${formatMoney(row.commission)}`;
            track.append(bar);
            const values = document.createElement("div");
            values.className = "report-staff-chart-values";
            const revenue = document.createElement("strong");
            revenue.textContent = formatMoney(row.revenue);
            const commission = document.createElement("small");
            commission.textContent = `HH ${formatMoney(row.commission)}`;
            values.append(revenue, commission);
            item.append(label, track, values);
            chart.append(item);
        });
    }

    function render() {
        const [year, month] = monthInput.value.split("-").map(Number);
        const selectedDate = new Date(year, month - 1, 1);
        const previousDate = new Date(year, month - 2, 1);
        const data = getMonthlyData(selectedDate);
        const previous = getMonthlyData(previousDate);
        const leadDelta = data.totals.leads - previous.totals.leads;
        const leadRate = previous.totals.leads ? Math.round(Math.abs(leadDelta) / previous.totals.leads * 100) : 0;
        const dealDelta = data.totals.deals - previous.totals.deals;
        const leadChange = previous.totals.leads
            ? `${leadDelta === 0 ? "Không đổi" : leadDelta > 0 ? "Tăng" : "Giảm"} ${leadRate}% so với tháng trước`
            : data.totals.leads ? "Có hồ sơ mới · tháng trước chưa có dữ liệu" : "Chưa có hồ sơ trong tháng này";
        const dealChange = previous.totals.deals
            ? `${dealDelta === 0 ? "Không đổi" : dealDelta > 0 ? "Tăng" : "Giảm"} ${format(Math.abs(dealDelta))} giao dịch so với tháng trước`
            : data.totals.deals ? `${format(data.totals.deals)} giao dịch · tháng trước chưa có dữ liệu` : "Chưa có giao dịch trong tháng này";
        setText("#reportLeadTotal", format(data.totals.leads));
        setText("#reportLeadChange", leadChange);
        setText("#reportQualifiedTotal", format(data.totals.qualified));
        setText("#reportQualifiedRate", `${percent(data.totals.qualified, data.totals.leads)} tổng số khách`);
        setText("#reportAppointmentTotal", format(data.totals.appointments));
        setText("#reportDealTotal", format(data.totals.deals));
        setText("#reportDealChange", dealChange);
        setText("#funnelLeadTotal", format(data.totals.leads));
        setText("#funnelQualifiedTotal", format(data.totals.qualified));
        setText("#funnelAppointmentTotal", format(data.totals.appointments));
        setText("#funnelDealTotal", format(data.totals.deals));
        const funnelValues = { leads: data.totals.leads, qualified: data.totals.qualified, appointments: data.totals.appointments, deals: data.totals.deals };
        Object.entries(funnelValues).forEach(([key, value]) => {
            const bar = document.querySelector(`[data-funnel-bar="${key}"]`);
            if (bar) bar.style.width = `${data.totals.leads ? value / data.totals.leads * 100 : 0}%`;
        });
        setText("#reportUncontacted", `${format(data.tasks.uncontacted)} khách`);
        setText("#reportUpcoming", `${format(data.tasks.appointments)} lịch`);
        setText("#reportHolds", `${format(data.tasks.holds)} yêu cầu`);
        setText("#reportHandoffs", `${format(data.tasks.handoffs)} hồ sơ`);
        const maxTask = Math.max(1, ...Object.values(data.tasks));
        document.querySelectorAll("[data-report-task]").forEach((row) => {
            const value = data.tasks[row.dataset.reportTask] || 0;
            const bar = row.querySelector(".screen-bar > i");
            if (bar) bar.style.width = `${value / maxTask * 100}%`;
        });
        tableBody?.replaceChildren(...data.rows.map(renderProject));
        renderStaff(selectedDate);
    }

    monthInput.addEventListener("change", render);
    render();
})();

