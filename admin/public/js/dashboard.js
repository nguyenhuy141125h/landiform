(() => {
    if (!document.querySelector("#barChart")) return;
    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const dateLabel = document.querySelector("#dashboardDate");
    const search = document.querySelector("#globalSearch");
    const toast = document.querySelector("#toastMessage");
    let toastTimer;

    const account = document.querySelector(".account-switch");
    if (account && !document.querySelector("[data-account-logout]")) {
        const actions = document.createElement("div");
        actions.className = "sidebar-account-actions";
        account.parentNode.insertBefore(actions, account);
        actions.append(account);
        const logout = document.createElement("a");
        logout.className = "account-logout";
        logout.href = "login.html";
        logout.dataset.accountLogout = "true";
        logout.setAttribute("aria-label", "Đăng xuất");
        logout.title = "Đăng xuất";
        logout.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Đăng xuất</span>';
        actions.append(logout);
    }

    if (dateLabel) {
        const today = new Intl.DateTimeFormat("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date());
        dateLabel.textContent = today;
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            search.focus();
        }
    });

    const completedTasks = {};
    const exampleSource = document.querySelector("#dashboardExampleData");
    const examples = (kind) => [...(exampleSource?.querySelectorAll(`[data-dashboard-example="${kind}"]`) || [])]
        .map((element) => {
            const item = { ...element.dataset };
            delete item.dashboardExample;
            if (item.price != null) item.price = Number(item.price);
            if (item.revenue != null) item.revenue = Number(item.revenue);
            return item;
        });
    const leads = examples("lead");
    const buyers = examples("buyer");
    const inventory = examples("unit");
    const unitsById = new Map(inventory.map((unit) => [unit.id, unit]));
    const recordedRevenue = buyers.reduce((sum, buyer) => {
        const unit = unitsById.get(buyer.productId);
        const value = Number(buyer.salePrice ?? buyer.amount ?? unit?.price ?? 0);
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    const leadCount = document.querySelector("#dashboardLeadCount");
    const dealCount = document.querySelector("#dashboardDealCount");
    const revenue = document.querySelector("#dashboardRevenue");
    const updateTaskCount = () => {
        const pending = [...document.querySelectorAll(".task-item[data-task-id]")]
            .filter((item) => !item.querySelector("input[type=checkbox]")?.checked).length;
        const target = document.querySelector("#dashboardTaskCount");
        if (target) target.textContent = String(pending);
    };
    if (leadCount) leadCount.textContent = leads.length.toLocaleString("vi-VN");
    if (dealCount) dealCount.textContent = buyers.length.toLocaleString("vi-VN");
    if (revenue) revenue.textContent = recordedRevenue
        ? `${recordedRevenue.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
        : "Chưa có";
    const funnel = document.querySelector(".funnel-panel");
    if (funnel) {
        const total = funnel.querySelector(".funnel-total strong");
        if (total) total.textContent = leadCount?.textContent || String(leads.length);
        funnel.querySelectorAll(".funnel-row").forEach((row) => {
            const stage = row.querySelector(".funnel-meta > span")?.textContent.trim();
            const count = leads.filter((lead) => lead.status === stage).length;
            const value = row.querySelector(".funnel-meta > strong");
            if (value) {
                value.replaceChildren(document.createTextNode(count.toLocaleString("vi-VN")));
                const share = document.createElement("small");
                share.textContent = `${leads.length ? Math.round(count / leads.length * 100) : 0}%`;
                value.append(" ", share);
            }
            const bar = row.querySelector(".funnel-track > i");
            if (bar) bar.style.setProperty("--width", `${leads.length ? count / leads.length * 100 : 0}%`);
        });
    }
    function parseLeadDate(value) {
        const text = String(value || "");
        const localized = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (localized) return new Date(Number(localized[3]), Number(localized[2]) - 1, Number(localized[1]));
        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        return iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : null;
    }
    const demoRevenueEvents = examples("revenue");
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const shiftDays = (date, count) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
    const monthNames = Array.from({ length: 12 }, (_, index) => `Thg ${index + 1}`);
    function buildChartPeriod(period, now) {
        const today = startOfDay(now);
        if (period === "year") {
            const start = new Date(now.getFullYear(), 0, 1);
            const previousStart = new Date(now.getFullYear() - 1, 0, 1);
            return {
                start, previousStart, length: 12, label: `Năm ${now.getFullYear()}`, previousLabel: `Năm ${now.getFullYear() - 1}`,
                bucket: (date) => date.getMonth(), labelAt: (index) => monthNames[index],
                inRange: (date, startDate, endDate) => date >= startDate && date < endDate,
                end: shiftDays(today, 1), previousEnd: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1),
            };
        }
        if (period === "month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const length = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            return {
                start, previousStart, length, label: "Tháng này", previousLabel: "Tháng trước",
                bucket: (date) => date.getDate() - 1, labelAt: (index) => String(index + 1),
                inRange: (date, startDate, endDate) => date >= startDate && date < endDate,
                end: shiftDays(today, 1), previousEnd: shiftDays(previousStart, Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate())),
            };
        }
        if (period === "week") {
            const weekday = (today.getDay() + 6) % 7;
            const start = shiftDays(today, -weekday);
            const previousStart = shiftDays(start, -7);
            return {
                start, previousStart, length: 7, label: "Tuần này", previousLabel: "Tuần trước",
                bucket: (date) => (date.getDay() + 6) % 7,
                labelAt: (index) => ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index],
                inRange: (date, startDate, endDate) => date >= startDate && date < endDate,
                end: shiftDays(today, 1), previousEnd: shiftDays(previousStart, weekday + 1),
            };
        }
        const length = period === "last7" ? 7 : 30;
        const start = shiftDays(today, -(length - 1));
        const previousStart = shiftDays(start, -length);
        const buckets = period === "last7" ? 7 : 5;
        return {
            start, previousStart, length: buckets,
            label: period === "last7" ? "7 ngày gần nhất" : "30 ngày gần nhất",
            previousLabel: period === "last7" ? "7 ngày trước đó" : "30 ngày trước đó",
            bucket: (date, rangeStart) => Math.min(buckets - 1, Math.floor((date - rangeStart) / 86400000 / (length / buckets))),
            labelAt: (index) => period === "last7"
                ? shiftDays(start, index).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                : `${Math.floor(index * length / buckets) + 1}–${Math.floor((index + 1) * length / buckets)} ngày`,
            inRange: (date, startDate, endDate) => date >= startDate && date < endDate,
            end: shiftDays(today, 1), previousEnd: start,
        };
    }
    function updateRegistrationChart(period = "year") {
        const chart = document.querySelector("#barChart");
        if (!chart) return;
        const now = new Date();
        const config = buildChartPeriod(period, now);
        const current = Array(config.length).fill(0);
        const previous = Array(config.length).fill(0);
        demoRevenueEvents.forEach((event) => {
            const date = parseLeadDate(event.received);
            if (!date) return;
            const day = startOfDay(date);
            if (config.inRange(day, config.start, config.end)) current[config.bucket(day, config.start)] += event.revenue;
            else if (config.inRange(day, config.previousStart, config.previousEnd)) previous[config.bucket(day, config.previousStart)] += event.revenue;
        });
        const currentTotal = current.reduce((sum, value) => sum + value, 0);
        const previousTotal = previous.reduce((sum, value) => sum + value, 0);
        const currentTotalLabel = document.querySelector("#chartCurrentTotal");
        const previousTotalLabel = document.querySelector("#chartPreviousTotal");
        const currentPeriodLabel = document.querySelector("#chartCurrentLabel");
        const previousPeriodLabel = document.querySelector("#chartPreviousLabel");
        const changeLabel = document.querySelector("#chartChange");
        const changeNote = document.querySelector("#chartChangeNote");
        const changeCard = document.querySelector("#chartChangeCard");
        const formatBillions = (value) => `${value.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} tỷ`;
        if (currentTotalLabel) currentTotalLabel.textContent = formatBillions(currentTotal);
        if (previousTotalLabel) previousTotalLabel.textContent = formatBillions(previousTotal);
        if (currentPeriodLabel) currentPeriodLabel.textContent = config.label;
        if (previousPeriodLabel) previousPeriodLabel.textContent = config.previousLabel;
        changeCard?.classList.remove("is-up", "is-down");
        if (changeLabel && changeNote) {
            if (previousTotal > 0) {
                const delta = currentTotal - previousTotal;
                const percentage = Math.round(delta / previousTotal * 100);
                changeLabel.textContent = `${percentage > 0 ? "+" : ""}${percentage}%`;
                changeNote.textContent = `${formatBillions(Math.abs(delta))} ${delta > 0 ? "tăng" : delta < 0 ? "giảm" : "không đổi"} so với kỳ trước`;
                changeCard?.classList.toggle("is-up", delta > 0);
                changeCard?.classList.toggle("is-down", delta < 0);
            } else if (currentTotal > 0) {
                changeLabel.textContent = `+${formatBillions(currentTotal)}`;
                changeNote.textContent = "Kỳ trước chưa có doanh thu";
                changeCard?.classList.add("is-up");
            } else {
                changeLabel.textContent = "0";
                changeNote.textContent = "Chưa có doanh thu trong kỳ";
            }
        }
        const maximum = Math.max(5, Math.ceil(Math.max(...current, ...previous) / 5) * 5);
        document.querySelectorAll(".chart-y-labels span").forEach((label, index, labels) => {
            label.textContent = String(Math.round(maximum * (labels.length - index - 1) / (labels.length - 1)));
        });
        chart.style.gridTemplateColumns = `repeat(${config.length}, minmax(0, 1fr))`;
        chart.replaceChildren();
        for (let index = 0; index < config.length; index += 1) {
            const group = document.createElement("div");
            group.className = "bar-group";
            const bucketDate = shiftDays(config.start, index * (period === "last30" ? 6 : 1));
            const isFuture = period === "year" ? index > now.getMonth()
                : period === "month" ? index + 1 > now.getDate()
                    : period === "week" ? index > (now.getDay() + 6) % 7
                        : period === "last7" ? bucketDate > startOfDay(now) : false;
            if (isFuture) group.classList.add("is-future");
            [previous, current].forEach((series, seriesIndex) => {
                const bar = document.createElement("i");
                const value = series[index];
                const seriesName = seriesIndex === 1 ? config.label : config.previousLabel;
                bar.className = `bar chart-hover-tip ${seriesIndex === 1 ? "current" : "previous"}`;
                bar.style.setProperty("--height", `${value ? Math.max(2, value / maximum * 100) : 0}%`);
                bar.dataset.chartValue = String(value);
                const detail = value ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ đồng doanh thu` : "Chưa có doanh thu";
                bar.dataset.chartTip = `${config.labelAt(index)} · ${seriesName}: ${detail}`;
                bar.title = bar.dataset.chartTip;
                bar.tabIndex = 0;
                bar.setAttribute("role", "img");
                bar.setAttribute("aria-label", bar.dataset.chartTip);
                group.append(bar);
            });
            const label = document.createElement("span");
            label.textContent = config.labelAt(index);
            group.append(label);
            chart.append(group);
        }
        const legend = document.querySelectorAll(".chart-legend > span");
        if (legend[0]) legend[0].lastChild.textContent = config.label;
        if (legend[1]) legend[1].lastChild.textContent = config.previousLabel;
        const description = document.querySelector(".chart-panel .panel-heading p");
        if (description) description.textContent = `Doanh thu mô phỏng (tỷ đồng) · so sánh với ${config.previousLabel.toLocaleLowerCase("vi")}`;
        const chartArea = document.querySelector(".chart-area");
        if (chartArea) chartArea.setAttribute("aria-label", `Biểu đồ doanh thu bất động sản: ${config.label} so với ${config.previousLabel}, đơn vị tỷ đồng`);
    }
    updateRegistrationChart(document.querySelector("#chartPeriod")?.value || "year");
    document.querySelectorAll(".task-item[data-task-id]").forEach((item) => {
        const checkbox = item.querySelector("input[type=checkbox]");
        const taskId = item.dataset.taskId;
        if (!checkbox || !taskId) return;
        checkbox.checked = completedTasks[taskId] === true;
        checkbox.setAttribute("aria-label", `${checkbox.checked ? "Bỏ hoàn tất" : "Hoàn tất"} ${item.querySelector(".task-copy strong")?.textContent.trim() || "công việc"}`);
        checkbox.addEventListener("change", () => {
            completedTasks[taskId] = checkbox.checked;
            checkbox.setAttribute("aria-label", `${checkbox.checked ? "Bỏ hoàn tất" : "Hoàn tất"} ${item.querySelector(".task-copy strong")?.textContent.trim() || "công việc"}`);
            updateTaskCount();
            showToast(checkbox.checked ? "Đã hoàn tất công việc." : "Đã mở lại công việc.");
        });
    });
    updateTaskCount();

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

    document.querySelector("#chartPeriod")?.addEventListener("change", (event) => updateRegistrationChart(event.target.value));

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



