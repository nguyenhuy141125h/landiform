(() => {
    const monthInput = document.querySelector("#reportMonth");
    const projectFilter = document.querySelector("#reportProjectFilter");
    const tableBody = document.querySelector("#reportProjectRows");
    if (!monthInput || !tableBody) return;

    const fallbackProjects = [
        { code: "AP-026", name: "An Phú Riverside", type: "Căn hộ", area: "TP. Thủ Đức", color: "blue", icon: "fa-building" },
        { code: "GV-014", name: "Green Valley", type: "Nhà phố", area: "Biên Hòa", color: "green", icon: "fa-house" },
        { code: "CP-008", name: "Central Park Towers", type: "Căn hộ", area: "Quận 7", color: "violet", icon: "fa-building" },
        { code: "LG-031", name: "Lumière Garden", type: "Đất nền", area: "Long An", color: "amber", icon: "fa-leaf" },
    ];
    const fallbackLeads = [
        { id: "anh", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", productId: "unit-ap-a2-1208", source: "Google Ads · UTM", status: "Chưa liên hệ", received: "21/10/2026 · 08:45" },
        { id: "khoa", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", productId: "unit-gv-n08-06", source: "SEO · Customer website", status: "Đang tư vấn", received: "19/10/2026 · 10:20" },
        { id: "yen", projectCode: "CP-008", ownerId: "staff-mai", owner: "Mai Ngọc", productId: "unit-cp-b1-0803", source: "QR · Sự kiện mở bán", status: "Đã giao dịch", received: "20/10/2026 · 14:10" },
        { id: "bao", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", productId: "unit-ap-a2-1210", source: "Meta Ads · Campaign T10", status: "Đang đàm phán", received: "15/10/2026 · 11:35" },
        { id: "nam", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", productId: "unit-gv-n08-06", source: "SEO · Customer website", status: "Đang tư vấn", received: "21/10/2026 · 09:10" },
        { id: "dat", projectCode: "AP-026", ownerId: "staff-long", owner: "Trần Thanh Long", productId: "unit-ap-a2-1506", source: "Meta Ads · Campaign T10", status: "Đã giao dịch", received: "12/10/2026 · 10:15" },
        { id: "ha", projectCode: "GV-014", ownerId: "staff-quynh", owner: "Quỳnh Dao", productId: "unit-gv-n08-05", source: "SEO · Customer website", status: "Đã giao dịch", received: "08/10/2026 · 11:30" },
    ];
    const fallbackUnits = [
        { id: "unit-cp-b1-0803", price: 5.1 }, { id: "unit-ap-a2-1506", price: 3.8 },
        { id: "unit-gv-n08-05", price: 8.2 }, { id: "unit-ap-a2-1208", price: 3.8 },
        { id: "unit-ap-a2-1210", price: 5.2 }, { id: "unit-gv-n08-06", price: 8.4 },
    ];
    const qualifiedStatuses = new Set(["Đang tư vấn", "Đã hẹn tham quan", "Đang đàm phán", "Đã giao dịch"]);
    const appointmentStatuses = new Set(["Đã hẹn tham quan", "Đang đàm phán", "Đã giao dịch"]);
    const wonStatus = "Đã giao dịch";
    const fmt = (value) => Number(value || 0).toLocaleString("vi-VN");
    const money = (value) => `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;

    function readArray(key, fallback) {
        try {
            const value = JSON.parse(null || "null");
            if (Array.isArray(value)) return value;
            if (Array.isArray(value?.items)) return value.items;
        } catch { /* Continue with the linked sample records. */ }
        return fallback;
    }

    function dateFor(value) {
        if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
        const text = String(value || "");
        const local = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (local) return new Date(Number(local[3]), Number(local[2]) - 1, Number(local[1]));
        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        return iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : null;
    }

    function projectList() {
        const saved = readArray("landiform.admin.projects.v1", fallbackProjects);
        const source = saved.length ? saved : fallbackProjects;
        return source.filter((item) => item?.code && item?.name).map((project) => {
            const fallback = fallbackProjects.find((item) => item.code === project.code);
            const type = project.type || fallback?.type || "Bất động sản";
            const kind = type.toLocaleLowerCase("vi");
            const color = fallback?.color || (kind.includes("đất") ? "amber" : kind.includes("nhà") ? "green" : "blue");
            const icon = fallback?.icon || (kind.includes("đất") ? "fa-leaf" : kind.includes("nhà") ? "fa-house" : "fa-building");
            return { ...fallback, ...project, type, color, icon, detail: [type, project.area || fallback?.area].filter(Boolean).join(" · ") };
        });
    }

    function populateProjectFilter() {
        if (!projectFilter) return;
        const selected = projectFilter.value;
        projectFilter.replaceChildren(new Option("Tất cả dự án", ""));
        projectList().forEach((project) => projectFilter.add(new Option(project.name, project.code)));
        if ([...projectFilter.options].some((option) => option.value === selected)) projectFilter.value = selected;
    }

    function monthLeads(date, projectCode) {
        return readArray("landiform.admin.leads.v1", fallbackLeads).filter((lead) => {
            const received = dateFor(lead.received || lead.createdAt || lead.created);
            const code = lead.projectCode || lead.project;
            return received && received.getFullYear() === date.getFullYear() && received.getMonth() === date.getMonth() && (!projectCode || code === projectCode);
        });
    }

    function sourceGroup(source) {
        const value = String(source || "").toLocaleLowerCase("vi");
        if (value.includes("meta") || value.includes("facebook")) return "Meta Ads";
        if (value.includes("google ads") || value.includes("google · cpc")) return "Google Ads";
        if (value.includes("qr") || value.includes("sự kiện")) return "QR / Sự kiện";
        if (value.includes("seo") || value.includes("website") || value.includes("organic")) return "Website / SEO";
        return source ? "Khác" : "Chưa ghi nguồn";
    }

    function getMonthlyData(date, selectedProject) {
        const projects = projectList().filter((project) => !selectedProject || project.code === selectedProject);
        const leads = monthLeads(date, selectedProject);
        const appointments = (window.LandiformAppointments?.all?.() || []).filter((appointment) => {
            const start = dateFor(appointment.start);
            const code = appointment.projectCode || appointment.project;
            return start && start.getFullYear() === date.getFullYear() && start.getMonth() === date.getMonth() && appointment.status !== "Đã hủy" && (!selectedProject || code === selectedProject);
        });
        const buyers = readArray("landiform.admin.buyers.v1", [
            { leadId: "yen", productId: "unit-cp-b1-0803" },
            { leadId: "dat", productId: "unit-ap-a2-1506" },
            { leadId: "ha", productId: "unit-gv-n08-05" },
        ]);
        const units = [...fallbackUnits, ...readArray("landiform.admin.units.v1", [])];
        const unitById = new Map(units.map((unit) => [unit.id, unit]));
        const buyerByLead = new Map(buyers.map((buyer) => [buyer.leadId, buyer]));
        const deals = leads.filter((lead) => lead.status === wonStatus);
        const appointmentLeadIds = new Set(leads.filter((lead) => appointmentStatuses.has(lead.status)).map((lead) => lead.id));
        appointments.forEach((appointment) => {
            const customer = appointment.customer || appointment.customerId;
            const lead = leads.find((item) => item.id === customer || item.name === customer || item.name === appointment.customerName);
            if (lead) appointmentLeadIds.add(lead.id);
        });
        const revenueForLead = (lead) => {
            const buyer = buyerByLead.get(lead.id);
            const productId = buyer?.productId || lead.productId;
            const unit = unitById.get(productId);
            return Number(buyer?.salePrice ?? buyer?.amount ?? buyer?.price ?? unit?.price ?? 0) || 0;
        };
        const projectRows = projects.map((project) => {
            const projectLeads = leads.filter((lead) => (lead.projectCode || lead.project) === project.code);
            const projectAppointments = appointments.filter((appointment) => (appointment.projectCode || appointment.project) === project.code);
            const projectDeals = projectLeads.filter((lead) => lead.status === wonStatus);
            const revenue = projectDeals.reduce((sum, lead) => sum + revenueForLead(lead), 0);
            return {
                ...project,
                leads: projectLeads.length,
                qualified: projectLeads.filter((lead) => qualifiedStatuses.has(lead.status)).length,
                appointments: projectAppointments.length,
                deals: projectDeals.length,
                revenue,
                conversion: projectLeads.length ? Math.round(projectDeals.length / projectLeads.length * 100) : 0,
            };
        });
        const totalRevenue = deals.reduce((sum, lead) => sum + revenueForLead(lead), 0);
        const sources = new Map();
        leads.forEach((lead) => {
            const label = sourceGroup(lead.source || lead.utmSource || lead.channel);
            sources.set(label, (sources.get(label) || 0) + 1);
        });
        const statuses = (() => { try { return JSON.parse(null || "{}"); } catch { return {}; } })();
        const bookings = readArray("landiform.admin.bookings.v1", [{ code: "BK-2026-084", projectCode: "AP-026", createdAt: "2026-10-22T09:15:00" }]).filter((booking) => {
            const created = dateFor(booking.createdAt || booking.created);
            const status = statuses[booking.code] || booking.status || "Chờ duyệt";
            return created && created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth() && status === "Chờ duyệt" && (!selectedProject || (booking.projectCode || booking.project) === selectedProject);
        });
        const handoffs = buyers.filter((buyer) => {
            const lead = leads.find((item) => item.id === buyer.leadId);
            return lead && buyer.documents !== "Đủ hồ sơ";
        }).length;
        return {
            projects: projectRows,
            totals: {
                leads: leads.length,
                qualified: leads.filter((lead) => qualifiedStatuses.has(lead.status)).length,
                appointments: appointments.length,
                appointmentLeads: appointmentLeadIds.size,
                deals: deals.length,
                revenue: totalRevenue,
            },
            sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
            tasks: {
                uncontacted: leads.filter((lead) => lead.status === "Chưa liên hệ").length,
                appointments: appointments.length,
                holds: bookings.length,
                handoffs,
            },
        };
    }

    function setText(selector, value) {
        const node = document.querySelector(selector);
        if (node) node.textContent = value;
    }

    function conversion(value, total) {
        return total ? `${Math.round(value / total * 100)}%` : "0%";
    }

    function renderProject(project) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = `screen-entity-icon ${project.color}`;
        const glyph = document.createElement("i");
        glyph.className = `fa-solid ${project.icon}`;
        glyph.setAttribute("aria-hidden", "true");
        icon.append(glyph);
        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = project.name;
        const detail = document.createElement("small");
        detail.textContent = `${project.code} · ${project.detail || project.type}`;
        copy.append(name, detail);
        entity.append(icon, copy);
        cell.append(entity);
        row.append(cell);
        [project.leads, project.qualified, project.appointments, project.deals, money(project.revenue), `${project.conversion}%`].forEach((value) => {
            const item = document.createElement("td");
            item.textContent = typeof value === "number" ? fmt(value) : value;
            row.append(item);
        });
        return row;
    }

    function renderSources(sources, total) {
        const container = document.querySelector("#reportSourceRows");
        if (!container) return;
        setText("#reportSourceTotal", `${fmt(total)} khách`);
        if (!sources.length) {
            const empty = document.createElement("p");
            empty.className = "report-source-empty";
            empty.textContent = "Chưa có khách đăng ký trong kỳ này.";
            container.replaceChildren(empty);
            return;
        }
        const colors = ["blue", "violet", "green", "amber", "neutral"];
        container.replaceChildren(...sources.map(([label, count], index) => {
            const row = document.createElement("div");
            row.className = "report-source-row";
            const title = document.createElement("div");
            title.className = "report-source-title";
            const name = document.createElement("span");
            name.textContent = label;
            const value = document.createElement("strong");
            value.textContent = `${fmt(count)} · ${conversion(count, total)}`;
            title.append(name, value);
            const track = document.createElement("div");
            track.className = "report-source-track";
            const bar = document.createElement("i");
            bar.className = colors[index % colors.length];
            bar.style.width = `${total ? count / total * 100 : 0}%`;
            track.append(bar);
            row.append(title, track);
            return row;
        }));
    }

    function render() {
        const [year, month] = monthInput.value.split("-").map(Number);
        if (!year || !month) return;
        const selectedDate = new Date(year, month - 1, 1);
        const previousDate = new Date(year, month - 2, 1);
        const selectedProject = projectFilter?.value || "";
        const data = getMonthlyData(selectedDate, selectedProject);
        const previous = getMonthlyData(previousDate, selectedProject);
        const leadDelta = data.totals.leads - previous.totals.leads;
        const leadChange = previous.totals.leads
            ? `${leadDelta > 0 ? "Tăng" : leadDelta < 0 ? "Giảm" : "Không đổi"} ${conversion(Math.abs(leadDelta), previous.totals.leads)} so với tháng trước`
            : "Chưa có dữ liệu tháng trước";
        const dealDelta = data.totals.deals - previous.totals.deals;
        const dealChange = previous.totals.deals
            ? `${dealDelta > 0 ? "Tăng" : dealDelta < 0 ? "Giảm" : "Không đổi"} ${fmt(Math.abs(dealDelta))} giao dịch so với tháng trước`
            : "Chưa có dữ liệu tháng trước";
        const revenueDelta = data.totals.revenue - previous.totals.revenue;
        const revenueChange = previous.totals.revenue
            ? `${revenueDelta > 0 ? "Tăng" : revenueDelta < 0 ? "Giảm" : "Không đổi"} ${money(Math.abs(revenueDelta))} so với tháng trước`
            : "Chưa có doanh thu tháng trước";
        setText("#reportLeadTotal", fmt(data.totals.leads));
        setText("#reportLeadChange", leadChange);
        setText("#reportQualifiedTotal", fmt(data.totals.qualified));
        setText("#reportQualifiedRate", `${conversion(data.totals.qualified, data.totals.leads)} tổng khách`);
        setText("#reportAppointmentTotal", fmt(data.totals.appointments));
        setText("#reportDealTotal", fmt(data.totals.deals));
        setText("#reportDealChange", dealChange);
        setText("#reportRevenueTotal", money(data.totals.revenue));
        setText("#reportRevenueChange", revenueChange);
        setText("#funnelLeadTotal", fmt(data.totals.leads));
        setText("#funnelQualifiedTotal", fmt(data.totals.qualified));
        setText("#funnelAppointmentTotal", fmt(data.totals.appointmentLeads));
        setText("#funnelDealTotal", fmt(data.totals.deals));
        setText("#funnelLeadRate", "100% tổng khách");
        setText("#funnelQualifiedRate", `${conversion(data.totals.qualified, data.totals.leads)} từ đăng ký`);
        setText("#funnelAppointmentRate", `${conversion(data.totals.appointmentLeads, data.totals.leads)} từ đăng ký`);
        setText("#funnelDealRate", `${conversion(data.totals.deals, data.totals.leads)} từ đăng ký`);
        const funnelValues = { leads: data.totals.leads, qualified: data.totals.qualified, appointments: data.totals.appointmentLeads, deals: data.totals.deals };
        Object.entries(funnelValues).forEach(([key, value]) => {
            const bar = document.querySelector(`[data-funnel-bar="${key}"]`);
            if (bar) bar.style.width = `${data.totals.leads ? Math.min(100, value / data.totals.leads * 100) : 0}%`;
        });
        setText("#reportUncontacted", `${fmt(data.tasks.uncontacted)} khách`);
        setText("#reportUpcoming", `${fmt(data.tasks.appointments)} lịch`);
        setText("#reportHolds", `${fmt(data.tasks.holds)} yêu cầu`);
        setText("#reportHandoffs", `${fmt(data.tasks.handoffs)} hồ sơ`);
        const maxTask = Math.max(1, ...Object.values(data.tasks));
        document.querySelectorAll("[data-report-task]").forEach((row) => {
            const value = data.tasks[row.dataset.reportTask] || 0;
            const bar = row.querySelector(".screen-bar > i");
            if (bar) bar.style.width = `${value / maxTask * 100}%`;
        });
        renderSources(data.sources, data.totals.leads);
        tableBody.replaceChildren(...data.projects.map(renderProject));
        const footer = document.querySelector("#reportProjectTotals");
        if (footer) {
            const row = document.createElement("tr");
            const values = ["Tổng cộng", data.totals.leads, data.totals.qualified, data.totals.appointments, data.totals.deals, money(data.totals.revenue), conversion(data.totals.deals, data.totals.leads)];
            values.forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = typeof value === "number" ? fmt(value) : value;
                row.append(cell);
            });
            footer.replaceChildren(row);
        }
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthInput.value = currentMonth;
    monthInput.max = currentMonth;
    monthInput.min = "2020-01";
    populateProjectFilter();
    monthInput.addEventListener("change", render);
    projectFilter?.addEventListener("change", render);
    window.addEventListener("storage", (event) => {
        if (["landiform.admin.leads.v1", "landiform.admin.projects.v1", "landiform.admin.units.v1", "landiform.admin.buyers.v1"].includes(event.key)) {
            populateProjectFilter();
            render();
        }
    });
    render();
})();

