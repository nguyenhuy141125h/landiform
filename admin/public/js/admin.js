/* --- dashboard.js --- */
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
        logout.innerHTML =
            '<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Đăng xuất</span>';
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
        toastTimer = setTimeout(
            () => toast.classList.remove("is-visible"),
            3200,
        );
    }

    document.addEventListener("keydown", (event) => {
        if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();
            search.focus();
        }
    });

    const completedTasks = {};
    const exampleSource = document.querySelector("#dashboardExampleData");
    const examples = (kind) =>
        [
            ...(exampleSource?.querySelectorAll(
                `[data-dashboard-example="${kind}"]`,
            ) || []),
        ].map((element) => {
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
        const value = Number(
            buyer.salePrice ?? buyer.amount ?? unit?.price ?? 0,
        );
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    const leadCount = document.querySelector("#dashboardLeadCount");
    const dealCount = document.querySelector("#dashboardDealCount");
    const revenue = document.querySelector("#dashboardRevenue");
    const updateTaskCount = () => {
        const pending = [
            ...document.querySelectorAll(".task-item[data-task-id]"),
        ].filter(
            (item) => !item.querySelector("input[type=checkbox]")?.checked,
        ).length;
        const target = document.querySelector("#dashboardTaskCount");
        if (target) target.textContent = String(pending);
    };
    if (leadCount) leadCount.textContent = leads.length.toLocaleString("vi-VN");
    if (dealCount)
        dealCount.textContent = buyers.length.toLocaleString("vi-VN");
    if (revenue)
        revenue.textContent = recordedRevenue
            ? `${recordedRevenue.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
            : "Chưa có";
    const funnel = document.querySelector(".funnel-panel");
    if (funnel) {
        const total = funnel.querySelector(".funnel-total strong");
        if (total)
            total.textContent = leadCount?.textContent || String(leads.length);
        funnel.querySelectorAll(".funnel-row").forEach((row) => {
            const stage = row
                .querySelector(".funnel-meta > span")
                ?.textContent.trim();
            const count = leads.filter((lead) => lead.status === stage).length;
            const value = row.querySelector(".funnel-meta > strong");
            if (value) {
                value.replaceChildren(
                    document.createTextNode(count.toLocaleString("vi-VN")),
                );
                const share = document.createElement("small");
                share.textContent = `${leads.length ? Math.round((count / leads.length) * 100) : 0}%`;
                value.append(" ", share);
            }
            const bar = row.querySelector(".funnel-track > i");
            if (bar)
                bar.style.setProperty(
                    "--width",
                    `${leads.length ? (count / leads.length) * 100 : 0}%`,
                );
        });
    }
    function parseLeadDate(value) {
        const text = String(value || "");
        const localized = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (localized)
            return new Date(
                Number(localized[3]),
                Number(localized[2]) - 1,
                Number(localized[1]),
            );
        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        return iso
            ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
            : null;
    }
    const demoRevenueEvents = examples("revenue");
    const startOfDay = (date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const shiftDays = (date, count) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
    const chartPeriodSelect = document.querySelector("#chartPeriod");
    const monthNames = [
        ...document.querySelectorAll("#chartLabelData [data-month-label]"),
    ].map((item) => item.dataset.monthLabel);
    const weekNames = [
        ...document.querySelectorAll("#chartLabelData [data-week-label]"),
    ].map((item) => item.dataset.weekLabel);
    function buildChartPeriod(period, now) {
        const option = chartPeriodSelect?.querySelector(
            `option[value="${period}"]`,
        );
        const periodLabel =
            option?.dataset.periodLabel ||
            option?.textContent.trim() ||
            "Kỳ này";
        const previousLabel = option?.dataset.previousLabel || "Kỳ trước";
        const today = startOfDay(now);
        if (period === "year") {
            const start = new Date(now.getFullYear(), 0, 1);
            const previousStart = new Date(now.getFullYear() - 1, 0, 1);
            return {
                start,
                previousStart,
                length: monthNames.length,
                label: `${option?.dataset.periodPrefix || "Năm"} ${now.getFullYear()}`,
                previousLabel: `${option?.dataset.periodPrefix || "Năm"} ${now.getFullYear() - 1}`,
                bucket: (date) => date.getMonth(),
                labelAt: (index) => monthNames[index],
                inRange: (date, startDate, endDate) =>
                    date >= startDate && date < endDate,
                end: shiftDays(today, 1),
                previousEnd: new Date(
                    now.getFullYear() - 1,
                    now.getMonth(),
                    now.getDate() + 1,
                ),
            };
        }
        if (period === "month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const previousStart = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1,
            );
            const length = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
            ).getDate();
            return {
                start,
                previousStart,
                length,
                label: periodLabel,
                previousLabel,
                bucket: (date) => date.getDate() - 1,
                labelAt: (index) => String(index + 1),
                inRange: (date, startDate, endDate) =>
                    date >= startDate && date < endDate,
                end: shiftDays(today, 1),
                previousEnd: shiftDays(
                    previousStart,
                    Math.min(
                        now.getDate(),
                        new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            0,
                        ).getDate(),
                    ),
                ),
            };
        }
        if (period === "week") {
            const weekday = (today.getDay() + 6) % 7;
            const start = shiftDays(today, -weekday);
            const previousStart = shiftDays(start, -7);
            return {
                start,
                previousStart,
                length: weekNames.length,
                label: periodLabel,
                previousLabel,
                bucket: (date) => (date.getDay() + 6) % 7,
                labelAt: (index) => weekNames[index],
                inRange: (date, startDate, endDate) =>
                    date >= startDate && date < endDate,
                end: shiftDays(today, 1),
                previousEnd: shiftDays(previousStart, weekday + 1),
            };
        }
        const length = Number(option?.dataset.rangeDays) || 7;
        const start = shiftDays(today, -(length - 1));
        const previousStart = shiftDays(start, -length);
        const buckets = Number(option?.dataset.bucketCount) || length;
        return {
            start,
            previousStart,
            length: buckets,
            label: periodLabel,
            previousLabel,
            bucket: (date, rangeStart) =>
                Math.min(
                    buckets - 1,
                    Math.floor(
                        (date - rangeStart) / 86400000 / (length / buckets),
                    ),
                ),
            labelAt: (index) =>
                period === "last7"
                    ? shiftDays(start, index).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                      })
                    : `${Math.floor((index * length) / buckets) + 1}–${Math.floor(((index + 1) * length) / buckets)} ngày`,
            inRange: (date, startDate, endDate) =>
                date >= startDate && date < endDate,
            end: shiftDays(today, 1),
            previousEnd: start,
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
            if (config.inRange(day, config.start, config.end))
                current[config.bucket(day, config.start)] += event.revenue;
            else if (
                config.inRange(day, config.previousStart, config.previousEnd)
            )
                previous[config.bucket(day, config.previousStart)] +=
                    event.revenue;
        });
        const currentTotal = current.reduce((sum, value) => sum + value, 0);
        const previousTotal = previous.reduce((sum, value) => sum + value, 0);
        const currentTotalLabel = document.querySelector("#chartCurrentTotal");
        const previousTotalLabel = document.querySelector(
            "#chartPreviousTotal",
        );
        const currentPeriodLabel = document.querySelector("#chartCurrentLabel");
        const previousPeriodLabel = document.querySelector(
            "#chartPreviousLabel",
        );
        const changeLabel = document.querySelector("#chartChange");
        const changeNote = document.querySelector("#chartChangeNote");
        const changeCard = document.querySelector("#chartChangeCard");
        const formatBillions = (value) =>
            `${value.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} tỷ`;
        if (currentTotalLabel)
            currentTotalLabel.textContent = formatBillions(currentTotal);
        if (previousTotalLabel)
            previousTotalLabel.textContent = formatBillions(previousTotal);
        if (currentPeriodLabel) currentPeriodLabel.textContent = config.label;
        if (previousPeriodLabel)
            previousPeriodLabel.textContent = config.previousLabel;
        changeCard?.classList.remove("is-up", "is-down");
        if (changeLabel && changeNote) {
            if (previousTotal > 0) {
                const delta = currentTotal - previousTotal;
                const percentage = Math.round((delta / previousTotal) * 100);
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
        const maximum = Math.max(
            5,
            Math.ceil(Math.max(...current, ...previous) / 5) * 5,
        );
        document
            .querySelectorAll(".chart-y-labels span")
            .forEach((label, index, labels) => {
                label.textContent = String(
                    Math.round(
                        (maximum * (labels.length - index - 1)) /
                            (labels.length - 1),
                    ),
                );
            });
        chart.style.gridTemplateColumns = `repeat(${config.length}, minmax(0, 1fr))`;
        chart.replaceChildren();
        for (let index = 0; index < config.length; index += 1) {
            const group = document.createElement("div");
            group.className = "bar-group";
            const bucketDate = shiftDays(
                config.start,
                index * (period === "last30" ? 6 : 1),
            );
            const isFuture =
                period === "year"
                    ? index > now.getMonth()
                    : period === "month"
                      ? index + 1 > now.getDate()
                      : period === "week"
                        ? index > (now.getDay() + 6) % 7
                        : period === "last7"
                          ? bucketDate > startOfDay(now)
                          : false;
            if (isFuture) group.classList.add("is-future");
            [previous, current].forEach((series, seriesIndex) => {
                const bar = document.createElement("i");
                const value = series[index];
                const seriesName =
                    seriesIndex === 1 ? config.label : config.previousLabel;
                bar.className = `bar chart-hover-tip ${seriesIndex === 1 ? "current" : "previous"}`;
                bar.style.setProperty(
                    "--height",
                    `${value ? Math.max(2, (value / maximum) * 100) : 0}%`,
                );
                bar.dataset.chartValue = String(value);
                const detail = value
                    ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ đồng doanh thu`
                    : "Chưa có doanh thu";
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
        const description = document.querySelector(
            ".chart-panel .panel-heading p",
        );
        if (description)
            description.textContent = `Doanh thu mô phỏng (tỷ đồng) · so sánh với ${config.previousLabel.toLocaleLowerCase("vi")}`;
        const chartArea = document.querySelector(".chart-area");
        if (chartArea)
            chartArea.setAttribute(
                "aria-label",
                `Biểu đồ doanh thu bất động sản: ${config.label} so với ${config.previousLabel}, đơn vị tỷ đồng`,
            );
    }
    updateRegistrationChart(
        document.querySelector("#chartPeriod")?.value || "year",
    );
    document.querySelectorAll(".task-item[data-task-id]").forEach((item) => {
        const checkbox = item.querySelector("input[type=checkbox]");
        const taskId = item.dataset.taskId;
        if (!checkbox || !taskId) return;
        checkbox.checked = completedTasks[taskId] === true;
        checkbox.setAttribute(
            "aria-label",
            `${checkbox.checked ? "Bỏ hoàn tất" : "Hoàn tất"} ${item.querySelector(".task-copy strong")?.textContent.trim() || "công việc"}`,
        );
        checkbox.addEventListener("change", () => {
            completedTasks[taskId] = checkbox.checked;
            checkbox.setAttribute(
                "aria-label",
                `${checkbox.checked ? "Bỏ hoàn tất" : "Hoàn tất"} ${item.querySelector(".task-copy strong")?.textContent.trim() || "công việc"}`,
            );
            updateTaskCount();
            showToast(
                checkbox.checked
                    ? "Đã hoàn tất công việc."
                    : "Đã mở lại công việc.",
            );
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

    document
        .querySelector("#chartPeriod")
        ?.addEventListener("change", (event) =>
            updateRegistrationChart(event.target.value),
        );

    search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("vi");
        document.querySelectorAll(".project-table tbody tr").forEach((row) => {
            row.hidden =
                query &&
                !row.textContent.toLocaleLowerCase("vi").includes(query);
        });
        document.querySelectorAll(".task-item").forEach((item) => {
            item.hidden =
                query &&
                !item.textContent.toLocaleLowerCase("vi").includes(query);
        });
    });
})();

/* --- inventory.js --- */
(() => {
    const source = document.querySelector(
        "#inventoryCatalogExamples, #productRecordExamples",
    );
    if (!source && !document.querySelector("#inventoryTableBody")) return;
    let demoRecords = null;

    function fromMarkup() {
        if (!source) return [];
        return [...source.querySelectorAll("[data-id]")].map((element) => {
            const data = { ...element.dataset };
            const floorMatch = /\d+/.exec(data.floor || "");
            const numeric = (value) =>
                value === "" || value == null
                    ? null
                    : Number(String(value).replace(",", "."));
            const attributes = {};
            ["bedrooms", "bathrooms", "storeys", "frontage", "depth"].forEach(
                (key) => {
                    if (data[key] !== "" && data[key] != null)
                        attributes[key] = numeric(data[key]);
                },
            );
            if (data.legalUse) attributes.legalUse = data.legalUse;
            return {
                id: data.id,
                projectCode: data.projectCode || "",
                project: data.project || "",
                projectArea: data.projectArea || "",
                projectType: data.projectType || "",
                formId: data.formId || "",
                address: data.address || "",
                image: data.image || "",
                galleryImages: data.gallery ? data.gallery.split("|") : [],
                tower: data.zone || "",
                floor: floorMatch ? Number(floorMatch[0]) : null,
                number:
                    String(data.code || "")
                        .split(/[·.]/)
                        .pop()
                        ?.trim() || "",
                code: data.code || "",
                type: data.type || "",
                area: numeric(data.area),
                price: numeric(data.price),
                commissionPercent: numeric(data.commission),
                status: data.status || "",
                productGroup: data.group || "",
                categoryId:
                    window.LandiformCategories?.findByName(data.type)?.id || "",
                attributes,
            };
        });
    }

    function fromInventoryTable() {
        const body = document.querySelector("#inventoryTableBody");
        if (!body) return [];
        const projectOptions = [
            ...document.querySelectorAll("#inventoryProjectFilter option"),
        ];
        return [...body.querySelectorAll("tr")]
            .map((row) => {
                const cells = [...row.cells];
                if (cells.length < 10) return null;
                const project = cells[1].textContent.trim();
                const projectCode =
                    projectOptions.find(
                        (option) => option.textContent.trim() === project,
                    )?.value || "";
                const href =
                    row.querySelector('a[href*="product-detail.html"]')?.href ||
                    "";
                const id =
                    new URL(href, location.href).searchParams.get("id") ||
                    row.dataset.unitId ||
                    "";
                const type = cells[4].textContent.trim();
                const specification = cells[5].textContent.trim();
                const bedroomCount = /([0-9]+)\s*PN/i.exec(specification);
                const bathroomCount = /([0-9]+)\s*PT/i.exec(specification);
                const floorMatch = /\d+/.exec(cells[3].textContent);
                const parseNumber = (value) =>
                    Number(
                        String(value || "")
                            .replace(/[^0-9,.-]/g, "")
                            .replace(",", "."),
                    ) || 0;
                return {
                    id,
                    projectCode,
                    project,
                    address: row.dataset.address || "",
                    tower: cells[2].textContent.trim(),
                    floor: floorMatch ? Number(floorMatch[0]) : null,
                    code: cells[0].textContent.trim(),
                    type,
                    area: parseNumber(cells[6].textContent),
                    price: parseNumber(cells[7].textContent),
                    commissionPercent: parseNumber(cells[8].textContent),
                    status: cells[9].textContent.trim(),
                    categoryId:
                        window.LandiformCategories?.findByName(type)?.id || "",
                    attributes: {
                        ...(bedroomCount
                            ? { bedrooms: Number(bedroomCount[1]) }
                            : {}),
                        ...(bathroomCount
                            ? { bathrooms: Number(bathroomCount[1]) }
                            : {}),
                    },
                };
            })
            .filter((unit) => unit && unit.id);
    }

    function all() {
        if (demoRecords)
            return demoRecords.map((record) => ({
                ...record,
                attributes: { ...(record.attributes || {}) },
                galleryImages: [...(record.galleryImages || [])],
            }));
        const markupRecords = fromMarkup();
        return markupRecords.length ? markupRecords : fromInventoryTable();
    }

    function replace(records) {
        demoRecords = records.map((record) => ({
            ...record,
            attributes: { ...(record.attributes || {}) },
            galleryImages: [...(record.galleryImages || [])],
        }));
        document.dispatchEvent(
            new CustomEvent("landiform:inventory-updated", {
                detail: { records: all() },
            }),
        );
        return true;
    }

    window.LandiformInventory = Object.freeze({ all, replace });
})();

/* --- category-store.js --- */
(() => {
    const source = document.querySelector(
        "#categoryExampleData, #categoryTableBody",
    );
    if (!source) return;
    let demoCategories = null;

    function all() {
        if (demoCategories) return demoCategories.map((item) => ({ ...item }));
        return [...(source?.querySelectorAll("[data-category-id]") || [])].map(
            (element) => ({
                id: element.dataset.categoryId,
                name: element.dataset.name,
                group: element.dataset.group,
                level: Number(element.dataset.level || 2),
                parentId: element.dataset.parentId || "",
            }),
        );
    }

    function forProject() {
        const categories = all().filter(
            (item) => String(item.level || 2) !== "1",
        );
        return categories.map((item) => item.name);
    }

    function findByName(name) {
        return (
            all().find(
                (item) =>
                    String(item.level || 2) !== "1" &&
                    item.name.toLocaleLowerCase("vi") ===
                        String(name || "").toLocaleLowerCase("vi"),
            ) || null
        );
    }

    function groupForType(name) {
        return findByName(name)?.group || "other";
    }

    function save(categories) {
        demoCategories = categories.map((item) => ({ ...item }));
        document.dispatchEvent(
            new CustomEvent("landiform:categories-updated", {
                detail: { categories: all() },
            }),
        );
        return true;
    }

    window.LandiformCategories = Object.freeze({
        all,
        forProject,
        findByName,
        groupForType,
        save,
        defaults: all,
    });
})();

/* --- admin-common.js --- */

(() => {
    const toastTimers = new WeakMap();
    window.LandiformAdminUI = Object.freeze({
        notify(toast, message, duration = 3200) {
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add("is-visible");
            clearTimeout(toastTimers.get(toast));
            toastTimers.set(toast, window.setTimeout(() => toast.classList.remove("is-visible"), duration));
        },
    });

    // HTML contains the sample records; page actions are temporary UI demos.
    document.addEventListener(
        "submit",
        (event) => {
            if (!event.target.matches("form")) return;
            event.preventDefault();
        },
        true,
    );

    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (
            !(form instanceof HTMLFormElement) ||
            !form.matches(
                "#buyerForm, #campaignForm, #roleCreateForm, #projectCreateForm, #projectEditForm, #leadForm, #staffForm",
            )
        )
            return;
        if (!form.reportValidity()) return;
        form.reset();
        const modal = form.closest(".modal-backdrop");
        if (modal) modal.hidden = true;
        if (!document.querySelector(".modal-backdrop:not([hidden])"))
            document.body.classList.remove("modal-open");
        notify(
            "Đã mô phỏng thao tác trên giao diện. Dữ liệu không được lưu; tải lại trang để khôi phục ví dụ.",
        );
    });

    const sidebar = document.querySelector("#sidebar");
    const menuToggle = document.querySelector("#menuToggle");
    const search = document.querySelector("#globalSearch");
    const toast = document.querySelector("#toastMessage");

    function initializeBranchSwitcher() {
        const switcher = document.querySelector(".workspace-switch");
        const menu = document.querySelector(".workspace-branch-menu");
        const subtitle = switcher?.querySelector(".workspace-copy small");
        if (!switcher || !menu || !subtitle) return;
        const options = [...menu.querySelectorAll("[data-branch-option]")];
        function closeMenu() {
            menu.hidden = true;
            switcher.classList.remove("is-open");
            switcher.setAttribute("aria-expanded", "false");
        }
        function selectOption(button) {
            options.forEach((option) => {
                const active = option === button;
                option.classList.toggle("is-selected", active);
                option.setAttribute("aria-checked", String(active));
            });
            subtitle.textContent = button.textContent.trim();
            switcher.dataset.branchScope = button.dataset.branchOption;
            document.body.dataset.branchScope = button.dataset.branchOption;
            document.dispatchEvent(
                new CustomEvent("landiform:branch-change", {
                    detail: {
                        id: button.dataset.branchOption,
                        label: subtitle.textContent,
                    },
                }),
            );
            closeMenu();
        }
        function toggleMenu() {
            if (!menu.hidden) return closeMenu();
            const rect = switcher.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
            menu.hidden = false;
            switcher.classList.add("is-open");
            switcher.setAttribute("aria-expanded", "true");
        }
        menu.addEventListener("click", (event) => {
            const option = event.target.closest("[data-branch-option]");
            if (option) selectOption(option);
        });
        switcher.addEventListener("click", toggleMenu);
        switcher.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleMenu();
            }
            if (event.key === "Escape") closeMenu();
        });
        document.addEventListener("click", (event) => {
            if (
                !switcher.contains(event.target) &&
                !menu.contains(event.target)
            )
                closeMenu();
        });
        document
            .querySelector("#sidebar")
            ?.addEventListener("scroll", closeMenu, { passive: true });
    }

    initializeBranchSwitcher();

    function addLogoutAction() {
        const account = document.querySelector(".account-switch");
        if (!account || document.querySelector("[data-account-logout]")) return;
        let actions = account.parentElement;
        if (!actions?.classList.contains("sidebar-account-actions")) {
            actions = document.createElement("div");
            actions.className = "sidebar-account-actions";
            account.parentNode.insertBefore(actions, account);
            actions.append(account);
        }
        const logout = document.createElement("a");
        logout.className = "account-logout";
        logout.href = location.pathname.includes("/pages/")
            ? "../login.html"
            : "login.html";
        logout.dataset.accountLogout = "true";
        logout.setAttribute("aria-label", "Đăng xuất");
        logout.title = "Đăng xuất";
        logout.innerHTML =
            '<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i><span>Đăng xuất</span>';
        actions.append(logout);
    }

    addLogoutAction();

    function moveAccountControlsToTopbar() {
        const accountActions = document.querySelector(
            ".sidebar-account-actions",
        );
        const topbarActions = document.querySelector(".topbar-actions");
        if (!accountActions || !topbarActions) return;
        const accountHref = location.pathname.includes("/pages/")
            ? "account.html"
            : "pages/account.html";
        document
            .querySelectorAll(".account-switch, .topbar-avatar")
            .forEach((link) => {
                link.href = accountHref;
                link.setAttribute("aria-label", "Mở thông tin tài khoản");
            });
        topbarActions.querySelector(".topbar-avatar")?.remove();
        const notification = topbarActions.querySelector(
            ".notification-button",
        );
        if (notification)
            topbarActions.insertBefore(accountActions, notification);
        else topbarActions.append(accountActions);
        accountActions.classList.remove("sidebar-account-actions");
        accountActions.classList.add("topbar-account-actions");
    }

    moveAccountControlsToTopbar();

    function routeSupportLinks() {
        const supportPath = location.pathname.includes("/pages/")
            ? "support.html"
            : "pages/support.html";
        document
            .querySelectorAll('a[href*="website/contact.html"]')
            .forEach((link) => {
                link.href = supportPath;
                link.removeAttribute("target");
            });
    }

    routeSupportLinks();

    function initializeNotifications() {
        const center = document.querySelector(".notification-center");
        const button = center?.querySelector(".notification-button");
        const panel = center?.querySelector(".notification-popover");
        if (!center || !button || !panel) return;
        function close() {
            panel.hidden = true;
            button.setAttribute("aria-expanded", "false");
        }
        button.addEventListener("click", () => {
            const opening = panel.hidden;
            panel.hidden = !opening;
            button.setAttribute("aria-expanded", String(opening));
        });
        panel
            .querySelector("[data-notification-read]")
            ?.addEventListener("click", () => {
                panel
                    .querySelectorAll(".notification-item")
                    .forEach((item) => item.classList.add("is-read"));
                center
                    .querySelector(".notification-count")
                    ?.setAttribute("hidden", "");
            });
        document.addEventListener("click", (event) => {
            if (!center.contains(event.target)) close();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") close();
        });
    }

    initializeNotifications();

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest(
            "[data-staff-delete-action], [data-project-row-delete], [data-project-delete], [data-buyer-delete], [data-delete-role], [data-permanent-delete-role], .role-icon-action.is-danger",
        );
        if (!button) return;
        event.preventDefault();
        const row = button.closest("tr");
        if (row) row.remove();
        else if (button.matches("[data-project-delete]")) {
            document
                .querySelectorAll("[data-project-detail]")
                .forEach((profile) => {
                    profile.hidden = true;
                });
            document
                .querySelector("#projectDetailPage")
                ?.classList.add("is-not-found");
            const missing = document.querySelector("#projectNotFound");
            if (missing) missing.hidden = false;
        } else
            button
                .closest(".role-row, [data-role-row], .permission-role-card")
                ?.remove();
        notify(
            "Đã ẩn mục khỏi bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });

    function exportTable() {
        const rows = [...document.querySelectorAll(".screen-table tr")];
        if (!rows.length) return notify("Chưa có danh sách để xuất.");
        const csv = rows
            .map((row) =>
                [...row.cells]
                    .map(
                        (cell) =>
                            '"' +
                            cell.innerText
                                .trim()
                                .replace(/\s+/g, " ")
                                .replace(/"/g, '""') +
                            '"',
                    )
                    .join(","),
            )
            .join("\r\n");
        const link = document.createElement("a");
        const url = URL.createObjectURL(
            new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
        );
        link.href = url;
        link.download =
            location.pathname.split("/").pop().replace(".html", "") +
            "-danh-sach.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify("Đã xuất danh sách hiện tại.");
    }

    menuToggle?.addEventListener("click", () => {
        const isOpen = sidebar?.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });

    search?.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("vi");
        document
            .querySelectorAll(
                ".screen-table tbody tr, .kanban-card, .agent-card, .engine-steps article, .integration-list > div, .permission-role, .permission-row",
            )
            .forEach((item) => {
                item.hidden =
                    Boolean(query) &&
                    !item.textContent.toLocaleLowerCase("vi").includes(query);
            });
    });

    document.querySelectorAll("[data-filter]").forEach((field) => {
        field.addEventListener("input", () => {
            const table = field
                .closest(".screen-panel")
                ?.querySelector(".screen-table");
            const query = field.value.trim().toLocaleLowerCase("vi");
            table?.querySelectorAll("tbody tr").forEach((row) => {
                row.hidden =
                    Boolean(query) &&
                    !row.textContent.toLocaleLowerCase("vi").includes(query);
            });
        });
    });

    document.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;
        if (action === "export-screen") exportTable();
        if (action === "refresh-platform") location.reload();
    });

    document.addEventListener("keydown", (event) => {
        if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();
            search?.focus();
        }
    });

    const customSelects = new WeakMap();
    let customSelectSequence = 0;
    let typeaheadTimer;
    let typeahead = "";
    const filterSelectSelector = "select";

    function closeSelectMenus(except = null) {
        document
            .querySelectorAll(".select-menu-control.is-open")
            .forEach((control) => {
                if (control === except) return;
                control.classList.remove("is-open", "opens-upward");
                const trigger = control.querySelector(".select-menu-trigger");
                const list = control.querySelector(".select-menu-list");
                trigger?.setAttribute("aria-expanded", "false");
                if (list) list.hidden = true;
            });
    }

    function enhanceSelect(select) {
        if (
            customSelects.has(select) ||
            select.multiple ||
            select.size > 1 ||
            select.dataset.nativeSelect !== undefined
        )
            return;
        const control = document.createElement("div");
        control.className = "select-menu-control";
        const trigger = document.createElement("button");
        trigger.className = "select-menu-trigger";
        trigger.type = "button";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute(
            "aria-label",
            select.getAttribute("aria-label") ||
                select.labels?.[0]?.textContent.trim() ||
                "Chọn một mục",
        );
        const value = document.createElement("span");
        value.className = "select-menu-value";
        const arrow = document.createElement("span");
        arrow.className = "select-menu-arrow";
        arrow.setAttribute("aria-hidden", "true");
        trigger.append(value, arrow);
        const list = document.createElement("div");
        list.className = "select-menu-list";
        list.hidden = true;
        list.id = `select-menu-${++customSelectSequence}`;
        list.setAttribute("role", "listbox");
        trigger.setAttribute("aria-controls", list.id);
        const parent = select.parentNode;
        parent.insertBefore(control, select);
        control.append(select, trigger, list);
        select.classList.add("select-menu-native");
        select.tabIndex = -1;
        select.setAttribute("aria-hidden", "true");
        const state = {
            control,
            trigger,
            value,
            list,
            activeIndex: -1,
            observer: null,
        };
        customSelects.set(select, state);

        function refresh() {
            const options = [...select.options];
            list.replaceChildren();
            options.forEach((option, index) => {
                const item = document.createElement("div");
                item.className = "select-menu-option";
                item.id = `${list.id}-option-${index}`;
                item.setAttribute("role", "option");
                item.setAttribute(
                    "aria-selected",
                    String(index === select.selectedIndex),
                );
                item.setAttribute("aria-disabled", String(option.disabled));
                item.textContent = option.textContent.trim();
                item.dataset.index = String(index);
                if (option.disabled) item.classList.add("is-disabled");
                if (index === select.selectedIndex)
                    item.classList.add("is-selected");
                item.addEventListener("pointerdown", (event) =>
                    event.preventDefault(),
                );
                item.addEventListener("pointerenter", () => setActive(index));
                item.addEventListener("click", () => choose(index));
                list.append(item);
            });
            value.textContent =
                select.selectedOptions[0]?.textContent.trim() || "Chọn một mục";
            trigger.disabled = select.disabled;
            trigger.setAttribute(
                "aria-label",
                select.getAttribute("aria-label") ||
                    select.labels?.[0]?.textContent.trim() ||
                    value.textContent,
            );
            trigger.setAttribute(
                "aria-invalid",
                String(select.getAttribute("aria-invalid") === "true"),
            );
            if (select.disabled) control.classList.add("is-disabled");
            else control.classList.remove("is-disabled");
        }
        state.refresh = refresh;

        function setActive(index) {
            const options = [...select.options];
            if (!options.length) return;
            let next = Math.max(0, Math.min(index, options.length - 1));
            while (options[next]?.disabled && next < options.length - 1)
                next += 1;
            if (options[next]?.disabled) return;
            state.activeIndex = next;
            list.querySelectorAll(".select-menu-option").forEach(
                (item, itemIndex) =>
                    item.classList.toggle("is-active", itemIndex === next),
            );
            trigger.setAttribute(
                "aria-activedescendant",
                `${list.id}-option-${next}`,
            );
            list.children[next]?.scrollIntoView({ block: "nearest" });
        }

        function choose(index) {
            const option = select.options[index];
            if (!option || option.disabled) return;
            select.selectedIndex = index;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
            refresh();
            closeSelectMenus();
            trigger.focus();
        }

        function open(direction = 1) {
            if (trigger.disabled) return;
            refresh();
            closeSelectMenus(control);
            control.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
            list.hidden = false;
            const rect = control.getBoundingClientRect();
            const freeBelow = window.innerHeight - rect.bottom;
            const freeAbove = rect.top;
            const opensUpward =
                freeBelow < Math.min(280, list.scrollHeight) &&
                freeAbove > freeBelow;
            const margin = 8;
            const width = Math.min(rect.width, window.innerWidth - margin * 2);
            list.style.width = width + "px";
            list.style.left =
                Math.min(
                    Math.max(margin, rect.left),
                    window.innerWidth - width - margin,
                ) + "px";
            list.style.maxHeight =
                Math.min(
                    320,
                    Math.max(120, opensUpward ? freeAbove : freeBelow) - margin,
                ) + "px";
            list.style.top = opensUpward
                ? "auto"
                : Math.min(window.innerHeight - 120, rect.bottom + 6) + "px";
            list.style.bottom = opensUpward
                ? window.innerHeight - rect.top + 6 + "px"
                : "auto";
            control.classList.toggle("opens-upward", opensUpward);
            setActive(
                select.selectedIndex >= 0
                    ? select.selectedIndex
                    : direction > 0
                      ? 0
                      : select.options.length - 1,
            );
        }

        trigger.addEventListener("click", () => {
            if (control.classList.contains("is-open")) closeSelectMenus();
            else open();
        });
        trigger.addEventListener("keydown", (event) => {
            const isOpen = control.classList.contains("is-open");
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!isOpen) open(event.key === "ArrowDown" ? 1 : -1);
                else
                    setActive(
                        state.activeIndex +
                            (event.key === "ArrowDown" ? 1 : -1),
                    );
            } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
                event.preventDefault();
                choose(state.activeIndex);
            } else if (
                (event.key === "Enter" || event.key === " ") &&
                !isOpen
            ) {
                event.preventDefault();
                open();
            } else if (event.key === "Escape" && isOpen) {
                event.preventDefault();
                closeSelectMenus();
            } else if (event.key === "Home" && isOpen) {
                event.preventDefault();
                setActive(0);
            } else if (event.key === "End" && isOpen) {
                event.preventDefault();
                setActive(select.options.length - 1);
            } else if (
                event.key.length === 1 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
            ) {
                typeahead += event.key.toLocaleLowerCase("vi");
                clearTimeout(typeaheadTimer);
                typeaheadTimer = setTimeout(() => {
                    typeahead = "";
                }, 650);
                const found = [...select.options].findIndex((option) =>
                    option.textContent
                        .trim()
                        .toLocaleLowerCase("vi")
                        .startsWith(typeahead),
                );
                if (found >= 0) {
                    event.preventDefault();
                    if (isOpen) setActive(found);
                    else choose(found);
                }
            }
        });
        select.addEventListener("change", refresh);
        select.addEventListener("input", refresh);
        select.addEventListener("invalid", () => {
            trigger.setAttribute("aria-invalid", "true");
            control.classList.add("has-error");
            trigger.focus();
        });
        select.addEventListener("focus", () => trigger.focus());
        select.addEventListener("change", () => {
            if (select.checkValidity()) {
                trigger.setAttribute("aria-invalid", "false");
                control.classList.remove("has-error");
            }
        });
        state.observer = new MutationObserver(refresh);
        state.observer.observe(select, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
        });
        const valueDescriptor = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            "value",
        );
        const indexDescriptor = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            "selectedIndex",
        );
        try {
            Object.defineProperty(select, "value", {
                configurable: true,
                get() {
                    return valueDescriptor.get.call(this);
                },
                set(value) {
                    valueDescriptor.set.call(this, value);
                    refresh();
                },
            });
            Object.defineProperty(select, "selectedIndex", {
                configurable: true,
                get() {
                    return indexDescriptor.get.call(this);
                },
                set(value) {
                    indexDescriptor.set.call(this, value);
                    refresh();
                },
            });
        } catch {
            /* Keep native selection if property wrapping is unavailable. */
        }
        refresh();
    }

    function enhanceFilterSelects(root = document) {
        if (root.matches?.(filterSelectSelector)) enhanceSelect(root);
        root.querySelectorAll?.(filterSelectSelector).forEach(enhanceSelect);
    }

    enhanceFilterSelects();
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".select-menu-control")) closeSelectMenus();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Tab") closeSelectMenus();
    });
    window.addEventListener(
        "scroll",
        (event) => {
            if (
                event.target instanceof Element &&
                event.target.closest(".select-menu-list")
            )
                return;
            closeSelectMenus();
        },
        true,
    );
    window.addEventListener("resize", () => closeSelectMenus());
    document.addEventListener(
        "reset",
        (event) => {
            setTimeout(
                () =>
                    event.target
                        .querySelectorAll(".select-menu-native")
                        .forEach((select) =>
                            customSelects.get(select)?.refresh(),
                        ),
                0,
            );
        },
        true,
    );
    const selectObserver = new MutationObserver((records) => {
        records.forEach((record) =>
            record.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE)
                    enhanceFilterSelects(node);
            }),
        );
    });
    selectObserver.observe(document.body, { childList: true, subtree: true });
})();

(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    function syncActiveNavigation() {
        const currentUrl = new URL(window.location.href);
        const detailAliases = {
            category: "categories.html",
            form: "forms.html",
            buyer: "buyers.html",
            appointment: "workflow.html",
        };
        const detailTarget = currentUrl.pathname.endsWith("/record-detail.html")
            ? detailAliases[currentUrl.searchParams.get("type")]
            : currentUrl.pathname.endsWith("/project-detail.html")
              ? "projects.html"
              : currentUrl.pathname.endsWith("/product-detail.html")
                ? "booking.html"
                : null;
        const activePath = detailTarget
            ? `${currentUrl.pathname.slice(0, currentUrl.pathname.lastIndexOf("/") + 1)}${detailTarget}`
            : currentUrl.pathname;
        const links = [...sidebar.querySelectorAll(".nav-link")];
        const matchingLinks = links.filter(
            (link) =>
                new URL(link.href, window.location.href).pathname ===
                activePath,
        );
        const currentType = currentUrl.searchParams.get("type") || "management";
        const activeLink = currentUrl.pathname.endsWith("/team.html")
            ? matchingLinks.find(
                  (link) =>
                      new URL(link.href, window.location.href).searchParams.get(
                          "type",
                      ) === currentType,
              ) || matchingLinks[0]
            : (currentUrl.hash &&
                  matchingLinks.find(
                      (link) =>
                          new URL(link.href, window.location.href).hash ===
                          currentUrl.hash,
                  )) ||
              matchingLinks.find(
                  (link) => !new URL(link.href, window.location.href).hash,
              ) ||
              matchingLinks[0] ||
              [...sidebar.querySelectorAll(".sidebar-support")].find(
                  (link) =>
                      new URL(link.href, window.location.href).pathname ===
                      currentUrl.pathname,
              );

        if (!activeLink) return;
        links.forEach((link) => {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
        });
        activeLink.classList.add("is-active");
        activeLink.setAttribute("aria-current", "page");
        const activeGroup = activeLink.closest("details.nav-group");
        sidebar.querySelectorAll("details.nav-group").forEach((group) => {
            group.open = group === activeGroup;
        });
    }

    syncActiveNavigation();
    window.addEventListener("hashchange", syncActiveNavigation);
})();

(() => {
    const button = document.querySelector(".password-toggle");
    const input = document.querySelector("#password");
    if (!button || !input) return;
    button.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute(
            "aria-label",
            show
                ? "\u1ea8n m\u1eadt kh\u1ea9u"
                : "Hi\u1ec7n m\u1eadt kh\u1ea9u",
        );
        button.innerHTML = `<i class="fa-regular fa-eye${show ? "-slash" : ""}" aria-hidden="true"></i>`;
    });
})();

/* Merged from appointment-store.js; retained as a page-guarded interaction. */
(() => {
    const source = document.querySelector("#appointmentExamples");
    if (!source) return;
    let demoAppointments = null;

    function all() {
        const items =
            demoAppointments ||
            [...source.querySelectorAll("[data-id]")].map((element) => ({
                ...element.dataset,
            }));
        return items.map((item) => ({ ...item }));
    }

    function dateInput(daysAhead, hour, minute = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        date.setHours(hour, minute, 0, 0);
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function replace(items) {
        demoAppointments = items.map((item) => ({ ...item }));
        return true;
    }

    window.LandiformAppointments = Object.freeze({ all, replace, dateInput });
})();

/* Merged from customer-detail.js; retained as a page-guarded interaction. */
(() => {
    const root = document.querySelector("#customerDetail");
    if (!root) return;

    const requestedProfile =
        new URLSearchParams(window.location.search).get("id") || "anh";
    const profileNodes = [...root.querySelectorAll("[data-profile]")];
    const profileId = profileNodes.some(
        (node) => node.dataset.profile === requestedProfile,
    )
        ? requestedProfile
        : "anh";

    document.body.dataset.customerProfile = profileId;
    profileNodes.forEach((node) => {
        node.hidden = node.dataset.profile !== profileId;
    });

    const status = root.querySelector(
        `#customerStatusBadge [data-profile="${profileId}"]`,
    );
    const owner = root.querySelector(
        `#customerOwner [data-profile="${profileId}"]`,
    );
    const statusSelect = root.querySelector("#customerStatus");
    const ownerSelect = root.querySelector("#customerAssignee");

    if (status && statusSelect) statusSelect.value = status.textContent.trim();
    if (owner && ownerSelect) ownerSelect.value = owner.textContent.trim();
})();

/* Merged from chart-tooltips.js; retained as a page-guarded interaction. */
(() => {
    const formatNumber = new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 1,
    });
    const numericValue = (value) =>
        Number(
            String(value || "")
                .replace(/[^\d,.-]/g, "")
                .replace(/\./g, "")
                .replace(",", "."),
        ) || 0;

    function addTooltip(target, message) {
        if (!target || !message) return;
        target.classList.add("chart-hover-tip");
        target.dataset.chartTip = message;
        target.title = message;
        target.tabIndex = 0;
        target.setAttribute("role", "img");
        target.setAttribute("aria-label", message);
    }

    document.querySelectorAll("#barChart .bar-group").forEach((group) => {
        const month =
            group.querySelector(":scope > span")?.textContent.trim() || "Tháng";
        group.querySelectorAll(":scope > .bar").forEach((bar) => {
            const series = bar.classList.contains("current")
                ? "Năm nay"
                : "Năm trước";
            const height =
                Number.parseFloat(bar.style.getPropertyValue("--height")) || 0;
            const value = Number(
                bar.dataset.chartValue ?? Math.round(height * 2),
            );
            const detail = value
                ? `${formatNumber.format(value)} khách quan tâm`
                : "Chưa có dữ liệu";
            addTooltip(
                bar,
                bar.dataset.chartTip || `${month} · ${series}: ${detail}`,
            );
        });
    });

    document.querySelectorAll(".funnel-panel .funnel-row").forEach((row) => {
        const total = numericValue(
            row.closest(".funnel-panel")?.querySelector(".funnel-total strong")
                ?.textContent,
        );
        const stage =
            row.querySelector(".funnel-meta > span")?.textContent.trim() ||
            "Trạng thái";
        const value = numericValue(
            row.querySelector(".funnel-meta > strong")?.textContent,
        );
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(
            row,
            `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng số khách`,
        );
    });

    document.querySelectorAll(".report-funnel > div").forEach((row) => {
        const rows = [...row.parentElement.children];
        const total = numericValue(rows[0]?.querySelector("b")?.textContent);
        const stage =
            row.querySelector("span")?.textContent.trim() || "Giai đoạn";
        const value = numericValue(row.querySelector("b")?.textContent);
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(
            row,
            `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng lượt đăng ký`,
        );
    });

    document.querySelectorAll(".screen-bar-row").forEach((row) => {
        const label =
            row.querySelector(":scope > span")?.textContent.trim() || "Chỉ số";
        const value =
            row.querySelector(":scope > strong")?.textContent.trim() || "";
        addTooltip(row, `${label}: ${value}`);
    });
})();

/* Merged from platform.js; retained as a page-guarded interaction. */
(() => {
    const modal = document.querySelector("#tenantModal");
    const form = document.querySelector("#tenantForm");
    const tbody = document.querySelector("#tenantTableBody");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !tbody) return;


    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document
        .querySelector("[data-tenant-open]")
        ?.addEventListener("click", () => {
            modal.hidden = false;
            document.body.classList.add("modal-open");
            form.elements.name.focus();
        });
    document
        .querySelectorAll("[data-tenant-close]")
        .forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        close();
        notify(
            "Đã mô phỏng thao tác tạo doanh nghiệp. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
})();

/* Merged from support.js; retained as a page-guarded interaction. */
(() => {
    const form = document.querySelector("#supportForm");
    const success = document.querySelector("#supportSuccess");
    if (!form || !success) return;

    const fields = form.elements;
    function updateReplyRequirements() {
        fields.email.required = fields.replyVia.value !== "Điện thoại";
        fields.phone.required = fields.replyVia.value === "Điện thoại";
    }
    fields.replyVia.addEventListener("change", updateReplyRequirements);
    updateReplyRequirements();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (!fields.email.value.trim() && !fields.phone.value.trim()) return;
        form.hidden = true;
        success.hidden = false;
        success.querySelector("h3").textContent =
            `Đã hoàn tất yêu cầu: ${fields.subject.value.trim()}`;
    });

    document.querySelector("#supportAgain")?.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        fields.subject.value = "";
        fields.description.value = "";
        fields.category.value = "";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        fields.category.focus();
    });
})();

/* --- account.js --- */
(() => {
    const form = document.querySelector("#accountForm");
    const passwordForm = document.querySelector("#passwordForm");
    const toast = document.querySelector("#toastMessage");
    if (!form) return;

        function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        notify(
            "Đã kiểm tra thông tin trên bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });

    passwordForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!passwordForm.reportValidity()) return;
        const newPassword = passwordForm.elements.newPassword.value;
        const confirmPassword = passwordForm.elements.confirmPassword.value;
        if (newPassword.length < 8) {
            notify("Mật khẩu mới cần có ít nhất 8 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            notify("Mật khẩu nhập lại chưa khớp.");
            return;
        }
        passwordForm.reset();
        notify(
            "Đã mô phỏng cập nhật mật khẩu. Mật khẩu không được lưu trong bản xem thử.",
        );
    });
})();

/* --- activity-reports.js --- */
(() => {
    const monthInput = document.querySelector("#reportMonth");
    const projectFilter = document.querySelector("#reportProjectFilter");
    const tableBody = document.querySelector("#reportProjectRows");
    if (!monthInput || !tableBody) return;

    const reportExamples = document.querySelector("#reportExampleData");
    const readExamples = (kind) =>
        [
            ...(reportExamples?.querySelectorAll(
                `[data-report-example="${kind}"]`,
            ) || []),
        ].map((element) => {
            const row = { ...element.dataset };
            delete row.reportExample;
            if (row.price != null) row.price = Number(row.price);
            return row;
        });
    const fallbackProjects = readExamples("project");
    const fallbackLeads = readExamples("lead");
    const fallbackUnits = readExamples("unit");
    const fallbackBuyers = readExamples("buyer");
    const qualifiedStatuses = new Set([
        "Đang tư vấn",
        "Đã hẹn tham quan",
        "Đang đàm phán",
        "Đã giao dịch",
    ]);
    const appointmentStatuses = new Set([
        "Đã hẹn tham quan",
        "Đang đàm phán",
        "Đã giao dịch",
    ]);
    const wonStatus = "Đã giao dịch";
    const fmt = (value) => Number(value || 0).toLocaleString("vi-VN");
    const money = (value) =>
        `${Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;

    function dateFor(value) {
        if (value instanceof Date)
            return Number.isNaN(value.getTime()) ? null : value;
        const text = String(value || "");
        const local = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (local)
            return new Date(
                Number(local[3]),
                Number(local[2]) - 1,
                Number(local[1]),
            );
        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        return iso
            ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
            : null;
    }

    function projectList() {
        const source = fallbackProjects;
        return source
            .filter((item) => item?.code && item?.name)
            .map((project) => {
                const fallback = fallbackProjects.find(
                    (item) => item.code === project.code,
                );
                const type = project.type || fallback?.type || "Bất động sản";
                const kind = type.toLocaleLowerCase("vi");
                const color =
                    fallback?.color ||
                    (kind.includes("đất")
                        ? "amber"
                        : kind.includes("nhà")
                          ? "green"
                          : "blue");
                const icon =
                    fallback?.icon ||
                    (kind.includes("đất")
                        ? "fa-leaf"
                        : kind.includes("nhà")
                          ? "fa-house"
                          : "fa-building");
                return {
                    ...fallback,
                    ...project,
                    type,
                    color,
                    icon,
                    detail: [type, project.area || fallback?.area]
                        .filter(Boolean)
                        .join(" · "),
                };
            });
    }

    function populateProjectFilter() {
        if (
            projectFilter &&
            ![...projectFilter.options].some(
                (option) => option.value === projectFilter.value,
            )
        )
            projectFilter.value = "";
    }

    function monthLeads(date, projectCode) {
        return fallbackLeads.filter((lead) => {
            const received = dateFor(
                lead.received || lead.createdAt || lead.created,
            );
            const code = lead.projectCode || lead.project;
            return (
                received &&
                received.getFullYear() === date.getFullYear() &&
                received.getMonth() === date.getMonth() &&
                (!projectCode || code === projectCode)
            );
        });
    }

    function sourceGroup(source) {
        const value = String(source || "").toLocaleLowerCase("vi");
        if (value.includes("meta") || value.includes("facebook"))
            return "Meta Ads";
        if (value.includes("google ads") || value.includes("google · cpc"))
            return "Google Ads";
        if (value.includes("qr") || value.includes("sự kiện"))
            return "QR / Sự kiện";
        if (
            value.includes("seo") ||
            value.includes("website") ||
            value.includes("organic")
        )
            return "Website / SEO";
        return source ? "Khác" : "Chưa ghi nguồn";
    }

    function getMonthlyData(date, selectedProject) {
        const projects = projectList().filter(
            (project) => !selectedProject || project.code === selectedProject,
        );
        const leads = monthLeads(date, selectedProject);
        const appointments = (
            window.LandiformAppointments?.all?.() || []
        ).filter((appointment) => {
            const start = dateFor(appointment.start);
            const code = appointment.projectCode || appointment.project;
            return (
                start &&
                start.getFullYear() === date.getFullYear() &&
                start.getMonth() === date.getMonth() &&
                appointment.status !== "Đã hủy" &&
                (!selectedProject || code === selectedProject)
            );
        });
        const buyers = fallbackBuyers;
        const units = fallbackUnits;
        const unitById = new Map(units.map((unit) => [unit.id, unit]));
        const buyerByLead = new Map(
            buyers.map((buyer) => [buyer.leadId, buyer]),
        );
        const deals = leads.filter((lead) => lead.status === wonStatus);
        const appointmentLeadIds = new Set(
            leads
                .filter((lead) => appointmentStatuses.has(lead.status))
                .map((lead) => lead.id),
        );
        appointments.forEach((appointment) => {
            const customer = appointment.customer || appointment.customerId;
            const lead = leads.find(
                (item) =>
                    item.id === customer ||
                    item.name === customer ||
                    item.name === appointment.customerName,
            );
            if (lead) appointmentLeadIds.add(lead.id);
        });
        const revenueForLead = (lead) => {
            const buyer = buyerByLead.get(lead.id);
            const productId = buyer?.productId || lead.productId;
            const unit = unitById.get(productId);
            return (
                Number(
                    buyer?.salePrice ??
                        buyer?.amount ??
                        buyer?.price ??
                        unit?.price ??
                        0,
                ) || 0
            );
        };
        const projectRows = projects.map((project) => {
            const projectLeads = leads.filter(
                (lead) => (lead.projectCode || lead.project) === project.code,
            );
            const projectAppointments = appointments.filter(
                (appointment) =>
                    (appointment.projectCode || appointment.project) ===
                    project.code,
            );
            const projectDeals = projectLeads.filter(
                (lead) => lead.status === wonStatus,
            );
            const revenue = projectDeals.reduce(
                (sum, lead) => sum + revenueForLead(lead),
                0,
            );
            return {
                ...project,
                leads: projectLeads.length,
                qualified: projectLeads.filter((lead) =>
                    qualifiedStatuses.has(lead.status),
                ).length,
                appointments: projectAppointments.length,
                deals: projectDeals.length,
                revenue,
                conversion: projectLeads.length
                    ? Math.round(
                          (projectDeals.length / projectLeads.length) * 100,
                      )
                    : 0,
            };
        });
        const totalRevenue = deals.reduce(
            (sum, lead) => sum + revenueForLead(lead),
            0,
        );
        const sources = new Map();
        leads.forEach((lead) => {
            const label = sourceGroup(
                lead.source || lead.utmSource || lead.channel,
            );
            sources.set(label, (sources.get(label) || 0) + 1);
        });
        const bookings = readExamples("booking").filter((booking) => {
            const created = dateFor(booking.createdAt || booking.created);
            const status = booking.status || "Chờ duyệt";
            return (
                created &&
                created.getFullYear() === date.getFullYear() &&
                created.getMonth() === date.getMonth() &&
                status === "Chờ duyệt" &&
                (!selectedProject ||
                    (booking.projectCode || booking.project) ===
                        selectedProject)
            );
        });
        const handoffs = buyers.filter((buyer) => {
            const lead = leads.find((item) => item.id === buyer.leadId);
            return lead && buyer.documents !== "Đủ hồ sơ";
        }).length;
        return {
            projects: projectRows,
            totals: {
                leads: leads.length,
                qualified: leads.filter((lead) =>
                    qualifiedStatuses.has(lead.status),
                ).length,
                appointments: appointments.length,
                appointmentLeads: appointmentLeadIds.size,
                deals: deals.length,
                revenue: totalRevenue,
            },
            sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
            tasks: {
                uncontacted: leads.filter(
                    (lead) => lead.status === "Chưa liên hệ",
                ).length,
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
        return total ? `${Math.round((value / total) * 100)}%` : "0%";
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
        [
            project.leads,
            project.qualified,
            project.appointments,
            project.deals,
            money(project.revenue),
            `${project.conversion}%`,
        ].forEach((value) => {
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
        container.replaceChildren(
            ...sources.map(([label, count], index) => {
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
                bar.style.width = `${total ? (count / total) * 100 : 0}%`;
                track.append(bar);
                row.append(title, track);
                return row;
            }),
        );
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
        setText(
            "#reportQualifiedRate",
            `${conversion(data.totals.qualified, data.totals.leads)} tổng khách`,
        );
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
        setText(
            "#funnelQualifiedRate",
            `${conversion(data.totals.qualified, data.totals.leads)} từ đăng ký`,
        );
        setText(
            "#funnelAppointmentRate",
            `${conversion(data.totals.appointmentLeads, data.totals.leads)} từ đăng ký`,
        );
        setText(
            "#funnelDealRate",
            `${conversion(data.totals.deals, data.totals.leads)} từ đăng ký`,
        );
        const funnelValues = {
            leads: data.totals.leads,
            qualified: data.totals.qualified,
            appointments: data.totals.appointmentLeads,
            deals: data.totals.deals,
        };
        Object.entries(funnelValues).forEach(([key, value]) => {
            const bar = document.querySelector(`[data-funnel-bar="${key}"]`);
            if (bar)
                bar.style.width = `${data.totals.leads ? Math.min(100, (value / data.totals.leads) * 100) : 0}%`;
        });
        setText("#reportUncontacted", `${fmt(data.tasks.uncontacted)} khách`);
        setText("#reportUpcoming", `${fmt(data.tasks.appointments)} lịch`);
        setText("#reportHolds", `${fmt(data.tasks.holds)} yêu cầu`);
        setText("#reportHandoffs", `${fmt(data.tasks.handoffs)} hồ sơ`);
        const maxTask = Math.max(1, ...Object.values(data.tasks));
        document.querySelectorAll("[data-report-task]").forEach((row) => {
            const value = data.tasks[row.dataset.reportTask] || 0;
            const bar = row.querySelector(".screen-bar > i");
            if (bar) bar.style.width = `${(value / maxTask) * 100}%`;
        });
        renderSources(data.sources, data.totals.leads);
        tableBody.replaceChildren(...data.projects.map(renderProject));
        const footer = document.querySelector("#reportProjectTotals");
        if (footer) {
            const row = document.createElement("tr");
            const values = [
                "Tổng cộng",
                data.totals.leads,
                data.totals.qualified,
                data.totals.appointments,
                data.totals.deals,
                money(data.totals.revenue),
                conversion(data.totals.deals, data.totals.leads),
            ];
            values.forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent =
                    typeof value === "number" ? fmt(value) : value;
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
    render();
})();

/* --- appointments.js --- */
(() => {
    const form = document.querySelector("#appointmentForm");
    const modal = document.querySelector("#appointmentModal");
    const rows = document.querySelector("#appointmentRows");
    const calendar = document.querySelector("#appointmentCalendar");
    const calendarTitle = document.querySelector("#appointmentCalendarTitle");
    const staffFilter = document.querySelector("#appointmentStaffFilter");
    const calendarDayModal = document.querySelector("#calendarDayModal");
    const calendarDayAgenda = document.querySelector("#calendarDayAgenda");
    const appointmentStore = window.LandiformAppointments;
    if (
        !form ||
        !modal ||
        !rows ||
        !calendar ||
        !calendarTitle ||
        !appointmentStore
    )
        return;

    const dateInput = appointmentStore.dateInput;
    const projectNames = Object.fromEntries(
        [...form.elements.project.options]
            .filter((option) => option.value)
            .map((option) => [option.value, option.textContent.trim()]),
    );
    const customerRows = [
        ...document.querySelectorAll(
            '#appointmentPeopleExamples [data-person-kind="customer"]',
        ),
    ];
    const customerProjects = Object.fromEntries(
        customerRows.map((row) => [row.dataset.id, row.dataset.projectCode]),
    );
    const newCustomerOption =
        document.querySelector(
            '#appointmentPeopleExamples [data-person-kind="new"]',
        )?.dataset.id || "__new__";
    const customerOptions = [
        ...document.querySelectorAll(
            "#appointmentPeopleExamples [data-person-kind]",
        ),
    ]
        .filter((row) => row.dataset.personKind !== "staff")
        .map((row) => ({
            value: row.dataset.id,
            label: row.dataset.name,
            phone: row.dataset.phone || "",
        }));
    const staff = [
        ...document.querySelectorAll(
            '#appointmentPeopleExamples [data-person-kind="staff"]',
        ),
    ].map((row) => ({
        id: row.dataset.id,
        name: row.dataset.name,
        role: row.dataset.role,
        scope: row.dataset.project,
        status: row.dataset.status,
    }));
    const toast = document.querySelector("#toastMessage");
    const projectFilter = document.querySelector("#appointmentProjectFilter");
    const assigneeHint = document.querySelector("#appointmentAssigneeHint");
    const placeHint = document.querySelector("#appointmentPlaceHint");
    const deleteButton = document.querySelector("[data-appointment-delete]");
    const cancelAppointmentButton = document.querySelector(
        "[data-appointment-cancel]",
    );
    const productContext = document.querySelector("#appointmentProductContext");
    const productDisplay = document.querySelector("#appointmentProductDisplay");
    const newCustomerFields = document.querySelector(
        "#appointmentNewCustomerFields",
    );
    const newCustomerName = form.elements.newCustomerName;
    const newCustomerPhone = form.elements.newCustomerPhone;
    const customerSearch = document.querySelector("#appointmentCustomerSearch");
    const customerOptionsList = document.querySelector(
        "#appointmentCustomerOptions",
    );
    const viewButtons = document.querySelectorAll("[data-appointment-view]");
    const calendarModeButtons = document.querySelectorAll(
        "[data-calendar-mode]",
    );
    let editingId = null;
    let view = "upcoming";
    let calendarMode = "month";
    let calendarDate = new Date();
    let customerSearchHasQuery = false;
        let appointments = appointmentStore.all();

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3400);
    }

    function formatStart(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
        return new Intl.DateTimeFormat("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    function setProductReference(productId = "") {
        const product = window.LandiformInventory?.all().find(
            (item) => item.id === productId,
        );
        form.elements.productId.value = product?.id || "";
        productContext.hidden = !product;
        productDisplay.value = product
            ? `${product.code} · ${product.type} · ${product.area} m²`
            : "";
        return product || null;
    }

    function setNewCustomerMode() {
        const active = form.elements.customer.value === newCustomerOption;
        newCustomerFields.hidden = !active;
        newCustomerName.required = active;
        newCustomerPhone.required = active;
        if (!active) {
            newCustomerName.setCustomValidity("");
            newCustomerPhone.setCustomValidity("");
        }
    }

    function syncCustomerOptions(open = false) {
        const selected = form.elements.customer.value;
        const currentLabel = customerOptions.find(
            (option) => option.value === selected,
        )?.label;
        const query =
            customerSearchHasQuery &&
            !(
                selected &&
                selected !== newCustomerOption &&
                customerSearch.value === currentLabel
            )
                ? customerSearch.value.trim().toLocaleLowerCase("vi")
                : "";
        const visible = customerOptions.filter((option) => {
            if (!option.value) return false;
            if (option.value === newCustomerOption) return true;
            if (!query) return false;
            if (option.value === selected) return true;
            return `${option.label} ${option.phone}`
                .toLocaleLowerCase("vi")
                .includes(query);
        });
        customerOptionsList.replaceChildren(
            ...visible.map((option) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `appointment-customer-option${option.value === newCustomerOption ? " is-create" : ""}`;
                button.setAttribute("role", "option");
                button.setAttribute(
                    "aria-selected",
                    String(option.value === selected),
                );
                button.dataset.customerChoice = option.value;
                const name = document.createElement("span");
                name.textContent = option.label;
                button.append(name);
                if (option.phone) {
                    const phone = document.createElement("small");
                    phone.textContent = option.phone;
                    button.append(phone);
                }
                return button;
            }),
        );
        customerOptionsList.hidden = !open;
        customerSearch.setAttribute("aria-expanded", String(open));
    }

    function chooseCustomer(value) {
        const option = customerOptions.find((item) => item.value === value);
        if (!option) return;
        form.elements.customer.value = value;
        customerSearch.value =
            value === newCustomerOption
                ? "Tạo hồ sơ khách hàng mới"
                : option.label;
        customerSearch.setCustomValidity("");
        form.elements.customer.dispatchEvent(
            new Event("change", { bubbles: true }),
        );
        syncCustomerOptions(false);
    }

    customerOptionsList.addEventListener("click", (event) => {
        const option = event.target.closest("[data-customer-choice]");
        if (option) chooseCustomer(option.dataset.customerChoice);
    });

    customerSearch.addEventListener("focus", () => {
        customerSearchHasQuery = false;
        if (form.elements.customer.value === newCustomerOption) {
            form.elements.customer.value = "";
            customerSearch.value = "";
            setNewCustomerMode();
        }
        customerSearch.select();
        syncCustomerOptions(true);
    });

    customerSearch.addEventListener("input", () => {
        customerSearchHasQuery = true;
        const selected = form.elements.customer.value;
        const selectedOption = customerOptions.find(
            (option) => option.value === selected,
        );
        if (
            selected === newCustomerOption ||
            (selected && customerSearch.value !== selectedOption?.label)
        ) {
            form.elements.customer.value = "";
            setNewCustomerMode();
        }
        customerSearch.setCustomValidity("");
        syncCustomerOptions(true);
    });

    customerSearch.addEventListener("keydown", (event) => {
        const options = [
            ...customerOptionsList.querySelectorAll("[data-customer-choice]"),
        ];
        const active = options.findIndex(
            (option) => option.getAttribute("aria-selected") === "true",
        );
        if (event.key === "Escape") {
            syncCustomerOptions(false);
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!options.length) return;
            const next =
                event.key === "ArrowDown"
                    ? Math.min(active < 0 ? 0 : active + 1, options.length - 1)
                    : Math.max(active < 0 ? options.length - 1 : active - 1, 0);
            options.forEach((option, index) =>
                option.setAttribute("aria-selected", String(index === next)),
            );
            customerSearch.setAttribute(
                "aria-activedescendant",
                options[next].id ||
                    (options[next].id = `appointment-customer-option-${next}`),
            );
            options[next].scrollIntoView({ block: "nearest" });
            return;
        }
        if (event.key === "Enter" && !customerOptionsList.hidden) {
            const option = options[active] || options[0];
            if (option) {
                event.preventDefault();
                chooseCustomer(option.dataset.customerChoice);
            }
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (!event.target.closest(".appointment-customer-picker"))
            syncCustomerOptions(false);
    });

    function statusTone(status) {
        return (
            {
                "Chờ phân công": "amber",
                "Đã phân công": "blue",
                "Hoàn tất": "green",
                "Đã hủy": "neutral",
            }[status] || "neutral"
        );
    }

    function appointmentDetailHref(appointment) {
        const params = new URLSearchParams({
            type: "appointment",
            id: appointment.id,
            customer: appointment.customerName || "",
            project:
                projectNames[appointment.project] || appointment.project || "",
            product:
                window.LandiformInventory?.all().find(
                    (item) => item.id === appointment.productId,
                )?.code || "",
            start: appointment.start || "",
            activity: appointment.type || "",
            place: appointment.place || "",
            assignee: appointment.assignee || "",
            status: appointment.status || "",
        });
        return `record-detail.html?${params.toString()}`;
    }

    function eligibleStaff(projectCode) {
        const project = projectNames[projectCode] || "";
        return staff.filter((person) => {
            const scopes = Array.isArray(person.scopes)
                ? person.scopes
                : Array.isArray(person.scope)
                  ? person.scope
                  : [person.scope || "Toàn doanh nghiệp"];
            return (
                person.name &&
                person.accountType !== "customer" &&
                person.status !== "Tạm ngưng" &&
                person.loginAllowed !== false &&
                (scopes.includes("Toàn doanh nghiệp") ||
                    Boolean(
                        project &&
                        scopes.some((scope) => scope?.includes(project)),
                    ))
            );
        });
    }

    function fillAssignees(preserve = "") {
        const select = form.elements.assignee;
        select.replaceChildren(new Option("Chưa phân công", ""));
        const load = (name) =>
            appointments.filter(
                (item) =>
                    item.id !== editingId &&
                    item.assignee === name &&
                    !["Hoàn tất", "Đã hủy"].includes(item.status) &&
                    new Date(item.start).getTime() >= Date.now(),
            ).length;
        const people = eligibleStaff(form.elements.project.value).sort(
            (a, b) => load(a.name) - load(b.name),
        );
        people.forEach((person) =>
            select.add(
                new Option(
                    `${person.name} · ${load(person.name)} lịch sắp tới`,
                    person.name,
                ),
            ),
        );
        if (preserve && !people.some((person) => person.name === preserve)) {
            select.add(
                new Option(`${preserve} (đã phân công trước đây)`, preserve),
            );
        }
        select.value = preserve || "";
        assigneeHint.textContent = form.elements.project.value
            ? people.length
                ? `${people.length} nhân viên phù hợp. Không thể phân công trùng giờ hẹn.`
                : "Chưa có nhân viên tư vấn cho dự án này. Tạo nhân viên trong mục Nhân sự."
            : "Chọn dự án để xem nhân viên phù hợp.";
    }

    function syncActivityDetails() {
        const type = form.elements.type.value;
        const project = projectNames[form.elements.project.value] || "dự án";
        const details = {
            "Tư vấn tại văn phòng": {
                required: true,
                placeholder: "Ví dụ: Văn phòng An Phát Land",
                hint: "Cần ghi nơi khách và nhân viên sẽ gặp.",
            },
            "Dẫn khách xem nhà": {
                required: true,
                placeholder: `Ví dụ: Điểm đón tại ${project}`,
                hint: "Cần ghi địa chỉ hoặc điểm đón khách đi xem nhà.",
            },
            "Tham quan nhà mẫu": {
                required: true,
                placeholder: `Ví dụ: Nhà mẫu ${project}`,
                hint: "Cần ghi địa điểm nhà mẫu để khách dễ tìm.",
            },
            "Bàn giao nhà": {
                required: true,
                placeholder: "Ví dụ: Sảnh tòa và căn hộ bàn giao",
                hint: "Cần ghi địa điểm bàn giao cụ thể.",
            },
            "Gọi tư vấn": {
                required: false,
                placeholder: "Ví dụ: Gọi vào số điện thoại khách",
                hint: "Có thể để trống hoặc ghi chú thời điểm/cách gọi.",
            },
            "Họp trực tuyến": {
                required: true,
                placeholder: "Dán liên kết Google Meet, Zoom hoặc nền tảng họp",
                hint: "Cần thêm liên kết để người tham gia vào cuộc họp.",
            },
        }[type] || {
            required: false,
            placeholder: "Nhập địa điểm hoặc cách liên hệ",
            hint: "Thêm địa điểm hoặc cách liên hệ nếu cần.",
        };
        form.elements.place.required = details.required;
        form.elements.place.placeholder = details.placeholder;
        if (placeHint) placeHint.textContent = details.hint;
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        return cell;
    }

    function localDateKey(date) {
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function startOfWeek(date) {
        const start = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
        );
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        return start;
    }

    function eventKind(type) {
        if (type.includes("Bàn giao")) return "handover";
        if (type.includes("xem nhà") || type.includes("Tham quan"))
            return "viewing";
        return "consultation";
    }

    function renderCalendar() {
        if (calendarMode === "day") {
            renderDayCalendar();
            return;
        }
        const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
        const grid = document.createElement("div");
        grid.className = `appointment-calendar-grid${calendarMode === "week" ? " is-week" : ""}`;
        const weekdayRow = document.createElement("div");
        weekdayRow.className = "calendar-weekdays";
        weekdays.forEach((label) => {
            const item = document.createElement("span");
            item.textContent = label;
            weekdayRow.append(item);
        });
        grid.append(weekdayRow);

        let firstDay;
        let dayCount;
        if (calendarMode === "week") {
            firstDay = startOfWeek(calendarDate);
            dayCount = 7;
            const lastDay = new Date(firstDay);
            lastDay.setDate(lastDay.getDate() + 6);
            const range = new Intl.DateTimeFormat("vi-VN", {
                day: "numeric",
                month: "long",
            });
            calendarTitle.textContent = `${range.format(firstDay)} – ${range.format(lastDay)}${firstDay.getFullYear() === lastDay.getFullYear() ? `, ${lastDay.getFullYear()}` : ` ${firstDay.getFullYear()} – ${lastDay.getFullYear()}`}`;
        } else {
            const monthStart = new Date(
                calendarDate.getFullYear(),
                calendarDate.getMonth(),
                1,
            );
            firstDay = startOfWeek(monthStart);
            dayCount =
                Math.ceil(
                    (((monthStart.getDay() + 6) % 7) +
                        new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth() + 1,
                            0,
                        ).getDate()) /
                        7,
                ) * 7;
            calendarTitle.textContent = new Intl.DateTimeFormat("vi-VN", {
                month: "long",
                year: "numeric",
            }).format(calendarDate);
        }

        const days = document.createElement("div");
        days.className = "calendar-days";
        const todayKey = localDateKey(new Date());
        for (let index = 0; index < dayCount; index += 1) {
            const date = new Date(firstDay);
            date.setDate(firstDay.getDate() + index);
            const key = localDateKey(date);
            const day = document.createElement("div");
            day.className = "calendar-day";
            day.dataset.calendarDate = key;
            day.tabIndex = 0;
            day.setAttribute("role", "group");
            day.setAttribute(
                "aria-label",
                `Xem lịch ngày ${new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" }).format(date)}`,
            );
            if (
                calendarMode === "month" &&
                date.getMonth() !== calendarDate.getMonth()
            )
                day.classList.add("is-outside");
            if (key === todayKey) day.classList.add("is-today");

            const top = document.createElement("div");
            top.className = "calendar-day-top";
            const number = document.createElement("span");
            number.className = "calendar-day-number";
            number.textContent = String(date.getDate());
            const add = document.createElement("button");
            add.type = "button";
            add.className = "calendar-day-add";
            add.dataset.calendarAdd = key;
            add.textContent = "+ Xếp lịch";
            top.append(number, add);

            const events = document.createElement("div");
            events.className = "calendar-day-events";
            const dayAppointments = appointments
                .filter((item) => {
                    if (
                        localDateKey(new Date(item.start)) !== key ||
                        item.status === "Đã hủy"
                    )
                        return false;
                    if (
                        projectFilter.value &&
                        item.project !== projectFilter.value
                    )
                        return false;
                    if (
                        staffFilter?.value &&
                        item.assignee !== staffFilter.value
                    )
                        return false;
                    return true;
                })
                .sort((a, b) => new Date(a.start) - new Date(b.start));
            const visibleCount = calendarMode === "month" ? 3 : 8;
            dayAppointments.slice(0, visibleCount).forEach((appointment) => {
                const event = document.createElement("button");
                event.type = "button";
                event.className = `calendar-event ${eventKind(appointment.type)}`;
                event.dataset.calendarEvent = appointment.id;
                event.title = `${appointment.customerName} · ${appointment.assignee || "Chưa phân công"}`;
                const time = document.createElement("span");
                time.className = "calendar-event-time";
                time.textContent = new Intl.DateTimeFormat("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(new Date(appointment.start));
                const title = document.createElement("strong");
                title.textContent = appointment.type;
                const owner = document.createElement("small");
                owner.textContent = appointment.assignee || "Chưa phân công";
                event.append(time, title, owner);
                events.append(event);
            });
            if (dayAppointments.length > visibleCount) {
                const more = document.createElement("span");
                more.className = "calendar-more";
                more.textContent = `+${dayAppointments.length - visibleCount} lịch khác`;
                events.append(more);
            }
            day.append(top, events);
            days.append(day);
        }
        grid.append(days);
        calendar.replaceChildren(grid);
        calendarModeButtons.forEach((button) => {
            const active = button.dataset.calendarMode === calendarMode;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function renderDayCalendar() {
        const date = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth(),
            calendarDate.getDate(),
        );
        const dateKey = localDateKey(date);
        calendarTitle.textContent = new Intl.DateTimeFormat("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);

        const dayAppointments = appointments
            .filter((item) => {
                if (
                    localDateKey(new Date(item.start)) !== dateKey ||
                    item.status === "Đã hủy"
                )
                    return false;
                if (projectFilter.value && item.project !== projectFilter.value)
                    return false;
                if (staffFilter?.value && item.assignee !== staffFilter.value)
                    return false;
                return true;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        let people = staffFilter?.value
            ? staff.filter((person) => person.name === staffFilter.value)
            : projectFilter.value
              ? eligibleStaff(projectFilter.value)
              : staff.filter(
                    (person) =>
                        person.name &&
                        person.accountType !== "customer" &&
                        person.status !== "Tạm ngưng" &&
                        person.loginAllowed !== false,
                );
        const displayedNames = new Set(people.map((person) => person.name));
        if (!staffFilter?.value) {
            dayAppointments.forEach((item) => {
                if (item.assignee && !displayedNames.has(item.assignee)) {
                    people = [...people, { name: item.assignee }];
                    displayedNames.add(item.assignee);
                }
            });
        }

        const hasUnassigned =
            !staffFilter?.value &&
            dayAppointments.some((item) => !item.assignee);
        const columns = [
            ...people.map((person) => ({
                name: person.name,
                unassigned: false,
            })),
        ];
        if (hasUnassigned)
            columns.push({ name: "Chưa phân công", unassigned: true });

        const view = document.createElement("div");
        view.className = "calendar-day-view-grid";
        const gridTemplateColumns = `76px repeat(${Math.max(columns.length, 1)}, minmax(165px, 1fr))`;
        view.style.minWidth = `${76 + Math.max(columns.length, 1) * 165}px`;
        view.style.setProperty("--calendar-day-row-height", "44px");

        const header = document.createElement("div");
        header.className = "calendar-day-view-row calendar-day-view-header";
        header.style.gridTemplateColumns = gridTemplateColumns;
        const timeHeading = document.createElement("div");
        timeHeading.className = "calendar-day-view-time-heading";
        const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        timeHeading.textContent = `${weekdayLabels[date.getDay()]} ${date.getDate()}`;
        header.append(timeHeading);
        columns.forEach((column) => {
            const cell = document.createElement("div");
            cell.className = `calendar-day-view-staff${column.unassigned ? " is-unassigned" : ""}`;
            cell.textContent = column.name;
            header.append(cell);
        });
        if (!columns.length) {
            const empty = document.createElement("div");
            empty.className =
                "calendar-day-view-staff calendar-day-view-no-staff";
            empty.style.gridColumn = "2 / -1";
            empty.textContent = "Chưa có nhân viên phù hợp với bộ lọc.";
            header.append(empty);
        }
        view.append(header);

        const appointmentHours = dayAppointments.map((item) =>
            new Date(item.start).getHours(),
        );
        const firstHour = Math.min(6, ...appointmentHours);
        const lastHour = Math.max(23, ...appointmentHours);
        const pad = (number) => String(number).padStart(2, "0");
        for (let hour = firstHour; hour <= lastHour; hour += 1) {
            const row = document.createElement("div");
            row.className = "calendar-day-view-row";
            row.style.gridTemplateColumns = gridTemplateColumns;
            const time = document.createElement("time");
            time.className = "calendar-day-view-time";
            time.textContent = `${pad(hour)}:00`;
            row.append(time);

            columns.forEach((column) => {
                const slot = document.createElement("div");
                slot.className = `calendar-day-view-slot${column.unassigned ? " is-unassigned" : ""}`;
                slot.dataset.calendarSlot = `${dateKey}T${pad(hour)}:00`;
                slot.dataset.calendarAssignee = column.unassigned
                    ? ""
                    : column.name;
                slot.tabIndex = 0;
                slot.setAttribute("role", "button");
                slot.setAttribute(
                    "aria-label",
                    `${dateKey}, ${pad(hour)}:00, ${column.name}: xếp lịch hẹn`,
                );
                dayAppointments
                    .filter(
                        (item) =>
                            new Date(item.start).getHours() === hour &&
                            (column.unassigned
                                ? !item.assignee
                                : item.assignee === column.name),
                    )
                    .forEach((appointment) => {
                        slot.classList.add("has-appointment");
                        const event = document.createElement("button");
                        event.type = "button";
                        event.className = `calendar-event ${eventKind(appointment.type)}`;
                        event.dataset.calendarEvent = appointment.id;
                        event.title = `${appointment.customerName} · ${appointment.type}`;
                        const eventTime = document.createElement("span");
                        eventTime.className = "calendar-event-time";
                        eventTime.textContent = new Intl.DateTimeFormat(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                        ).format(new Date(appointment.start));
                        const title = document.createElement("strong");
                        title.textContent = appointment.type;
                        const customer = document.createElement("small");
                        customer.textContent = appointment.customerName;
                        event.append(eventTime, title, customer);
                        const start = new Date(appointment.start);
                        const durationMinutes = Math.max(
                            30,
                            Number(appointment.duration) || 60,
                        );
                        event.style.top = `${(start.getMinutes() / 60) * 44 + 3}px`;
                        event.style.height = `${Math.max(36, (durationMinutes / 60) * 44 - 6)}px`;
                        slot.append(event);
                    });
                row.append(slot);
            });
            view.append(row);
        }

        calendar.replaceChildren(view);
        calendarModeButtons.forEach((button) => {
            const active = button.dataset.calendarMode === calendarMode;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function openDayAgenda(dateKey) {
        if (!calendarDayModal || !calendarDayAgenda) return;
        const [year, month, day] = dateKey.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        document.querySelector("#calendarDayTitle").textContent =
            new Intl.DateTimeFormat("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
        const dayAppointments = appointments
            .filter((item) => {
                if (
                    localDateKey(new Date(item.start)) !== dateKey ||
                    item.status === "Đã hủy"
                )
                    return false;
                if (projectFilter.value && item.project !== projectFilter.value)
                    return false;
                if (staffFilter?.value && item.assignee !== staffFilter.value)
                    return false;
                return true;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        calendarDayAgenda.replaceChildren();
        if (!dayAppointments.length) {
            const empty = document.createElement("p");
            empty.className = "calendar-day-empty";
            empty.textContent = "Chưa có lịch trong ngày này.";
            calendarDayAgenda.append(empty);
        }
        dayAppointments.forEach((appointment) => {
            const item = document.createElement("article");
            item.className = `calendar-day-agenda-item ${eventKind(appointment.type)}`;
            const time = document.createElement("time");
            time.textContent = new Intl.DateTimeFormat("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }).format(new Date(appointment.start));
            const details = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = appointment.type;
            const summary = document.createElement("p");
            summary.textContent = `${appointment.customerName} · ${projectNames[appointment.project] || "Dự án"}`;
            const owner = document.createElement("small");
            owner.textContent = `${appointment.assignee || "Chưa phân công"} · ${appointment.status}`;
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "button button-quiet";
            edit.dataset.calendarDayEdit = appointment.id;
            edit.textContent = "Xem / sửa";
            details.append(title, summary, owner);
            item.append(time, details, edit);
            calendarDayAgenda.append(item);
        });
        calendarDayModal.dataset.date = dateKey;
        calendarDayModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeDayAgenda() {
        if (!calendarDayModal) return;
        calendarDayModal.hidden = true;
        if (!document.querySelector(".modal-backdrop:not([hidden])")) {
            document.body.classList.remove("modal-open");
        }
    }

    function render() {
        renderCalendar();
        const now = Date.now();
        const upcoming = appointments.filter(
            (item) =>
                !["Hoàn tất", "Đã hủy"].includes(item.status) &&
                new Date(item.start).getTime() >= now,
        );
        const unassigned = appointments.filter(
            (item) => item.status === "Chờ phân công" && !item.assignee,
        );
        document.querySelector("#appointmentUpcomingCount").textContent =
            String(upcoming.length);
        document.querySelector("#appointmentUnassignedCount").textContent =
            String(unassigned.length);
        viewButtons.forEach((button) => {
            const active = button.dataset.appointmentView === view;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
        const matching = appointments
            .filter(
                (item) =>
                    (view === "all" ||
                        (view === "unassigned"
                            ? item.status === "Chờ phân công" && !item.assignee
                            : upcoming.includes(item))) &&
                    (!projectFilter.value ||
                        item.project === projectFilter.value) &&
                    (!staffFilter?.value ||
                        item.assignee === staffFilter.value),
            )
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        rows.replaceChildren();
        for (const appointment of matching) {
            const row = document.createElement("tr");
            row.append(createCell(formatStart(appointment.start)));
            const customerCell = document.createElement("td");
            const customerLink = document.createElement("a");
            customerLink.className = "customer-link";
            customerLink.href = `customer-detail.html?id=${encodeURIComponent(appointment.customer)}`;
            customerLink.textContent = appointment.customerName;
            customerCell.append(customerLink);
            row.append(customerCell);
            const contentCell = document.createElement("td");
            const title = document.createElement("strong");
            title.textContent = appointment.type;
            const meta = document.createElement("small");
            const linkedProduct =
                appointment.productId &&
                window.LandiformInventory?.all().find(
                    (item) => item.id === appointment.productId,
                );
            meta.textContent = `${projectNames[appointment.project] || "Dự án"}${appointment.place ? ` · ${appointment.place}` : ""}${linkedProduct ? ` · Sản phẩm ${linkedProduct.code}` : ""}`;
            contentCell.append(title, meta);
            row.append(contentCell);
            const assignee = createCell(
                appointment.assignee || "Chưa phân công",
            );
            if (!appointment.assignee)
                assignee.className = "appointment-unassigned";
            row.append(assignee);
            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `screen-badge ${statusTone(appointment.status)}`;
            badge.textContent = appointment.status;
            statusCell.append(badge);
            row.append(statusCell);
            const actionCell = document.createElement("td");
            const action = document.createElement("a");
            action.className = "project-detail-button";
            action.href = appointmentDetailHref(appointment);
            action.textContent = appointment.assignee
                ? "Xem / sửa"
                : "Phân công";
            actionCell.append(action);
            row.append(actionCell);
            rows.append(row);
        }
        if (!matching.length) {
            const row = document.createElement("tr");
            const cell = createCell(
                view === "upcoming"
                    ? "Không có lịch hẹn sắp tới trong mục này."
                    : "Không có lịch hẹn phù hợp.",
            );
            cell.colSpan = 6;
            cell.className = "appointment-empty";
            row.append(cell);
            rows.append(row);
        }
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        setNewCustomerMode();
        syncCustomerOptions();
        form.elements.start.setCustomValidity("");
        form.elements.assignee.setCustomValidity("");
        editingId = null;
    }

    function open(id = null, startValue = "", assigneeValue = "") {
        editingId = id;
        form.reset();
        setNewCustomerMode();
        syncCustomerOptions();
        form.elements.start.setCustomValidity("");
        form.elements.assignee.setCustomValidity("");
        const appointment = appointments.find((item) => item.id === id);
        const requestedProductId = new URLSearchParams(location.search).get(
            "product",
        );
        deleteButton.hidden = !appointment;
        cancelAppointmentButton.hidden =
            !appointment || ["Hoàn tất", "Đã hủy"].includes(appointment.status);
        document.querySelector("#appointmentModalTitle").textContent =
            appointment
                ? "Xem và phân công lịch hẹn"
                : requestedProductId
                  ? "Lên lịch gọi tư vấn"
                  : "Tạo lịch hẹn khách hàng";
        if (appointment) {
            for (const field of [
                "customer",
                "project",
                "start",
                "type",
                "place",
                "status",
            ]) {
                form.elements[field].value = appointment[field] || "";
            }
            customerSearch.value =
                customerOptions.find(
                    (option) => option.value === appointment.customer,
                )?.label || "";
            setNewCustomerMode();
            setProductReference(appointment.productId || "");
            fillAssignees(appointment.assignee);
        } else {
            const customerId = new URLSearchParams(location.search).get(
                "customer",
            );
            const params = new URLSearchParams(location.search);
            if (customerId && customerProjects[customerId]) {
                form.elements.customer.value = customerId;
                customerSearch.value =
                    customerOptions.find(
                        (option) => option.value === customerId,
                    )?.label || "";
                form.elements.project.value = customerProjects[customerId];
            }
            form.elements.start.value = startValue || dateInput(1, 9);
            const linkedProduct = setProductReference(requestedProductId || "");
            if (linkedProduct)
                form.elements.project.value = linkedProduct.projectCode;
            const requestedActivity = params.get("activity");
            if (
                requestedActivity &&
                [...form.elements.type.options].some(
                    (option) => option.value === requestedActivity,
                )
            )
                form.elements.type.value = requestedActivity;
            if (
                form.elements.type.value === "Gọi tư vấn" &&
                !form.elements.place.value
            )
                form.elements.place.value = "Gọi điện cho khách";
            fillAssignees(assigneeValue);
            if (assigneeValue) form.elements.status.value = "Đã phân công";
        }
        syncActivityDetails();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        (appointment || form.elements.customer.value
            ? form.elements.assignee
            : customerSearch
        ).focus();
    }

    document
        .querySelector("[data-appointment-open]")
        ?.addEventListener("click", () => open());
    document
        .querySelectorAll("[data-appointment-close]")
        .forEach((button) => button.addEventListener("click", close));
    cancelAppointmentButton?.addEventListener("click", () => {
        const appointment = appointments.find((item) => item.id === editingId);
        if (!appointment || ["Hoàn tất", "Đã hủy"].includes(appointment.status))
            return;
        appointments = appointments.map((item) =>
            item.id === editingId ? { ...item, status: "Đã hủy" } : item,
        );
        appointmentStore.replace(appointments);
        render();
        close();
        notify(
            "Đã hủy lịch trong bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    deleteButton?.addEventListener("click", () => {
        const appointment = appointments.find((item) => item.id === editingId);
        if (!appointment) return;
        appointments = appointments.filter((item) => item.id !== editingId);
        appointmentStore.replace(appointments);
        render();
        close();
        notify(
            "Đã xóa lịch khỏi bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!modal.hidden) close();
        else if (calendarDayModal && !calendarDayModal.hidden) closeDayAgenda();
    });
    viewButtons.forEach((button) =>
        button.addEventListener("click", () => {
            view = button.dataset.appointmentView;
            render();
        }),
    );
    calendarModeButtons.forEach((button) =>
        button.addEventListener("click", () => {
            calendarMode = button.dataset.calendarMode;
            renderCalendar();
        }),
    );
    document
        .querySelector("[data-calendar-prev]")
        ?.addEventListener("click", () => {
            if (calendarMode === "day")
                calendarDate.setDate(calendarDate.getDate() - 1);
            else if (calendarMode === "week")
                calendarDate.setDate(calendarDate.getDate() - 7);
            else calendarDate.setMonth(calendarDate.getMonth() - 1, 1);
            renderCalendar();
        });
    document
        .querySelector("[data-calendar-next]")
        ?.addEventListener("click", () => {
            if (calendarMode === "day")
                calendarDate.setDate(calendarDate.getDate() + 1);
            else if (calendarMode === "week")
                calendarDate.setDate(calendarDate.getDate() + 7);
            else calendarDate.setMonth(calendarDate.getMonth() + 1, 1);
            renderCalendar();
        });
    document
        .querySelector("[data-calendar-today]")
        ?.addEventListener("click", () => {
            calendarDate = new Date();
            renderCalendar();
        });
    projectFilter.addEventListener("change", render);
    staffFilter?.addEventListener("change", render);
    calendar.addEventListener("click", (event) => {
        const appointmentButton = event.target.closest("[data-calendar-event]");
        if (appointmentButton) {
            open(appointmentButton.dataset.calendarEvent);
            return;
        }
        const addButton = event.target.closest("[data-calendar-add]");
        if (addButton) {
            open(null, `${addButton.dataset.calendarAdd}T09:00`);
            return;
        }
        const slot = event.target.closest("[data-calendar-slot]");
        if (slot) {
            open(
                null,
                slot.dataset.calendarSlot,
                slot.dataset.calendarAssignee,
            );
            return;
        }
        const day = event.target.closest(".calendar-day");
        if (day) openDayAgenda(day.dataset.calendarDate);
    });
    calendar.addEventListener("keydown", (event) => {
        if (
            event.target.matches("[data-calendar-slot]") &&
            ["Enter", " "].includes(event.key)
        ) {
            event.preventDefault();
            open(
                null,
                event.target.dataset.calendarSlot,
                event.target.dataset.calendarAssignee,
            );
            return;
        }
        if (
            event.target.matches(".calendar-day") &&
            ["Enter", " "].includes(event.key)
        ) {
            event.preventDefault();
            openDayAgenda(event.target.dataset.calendarDate);
        }
    });
    calendarDayModal?.addEventListener("click", (event) => {
        if (
            event.target === calendarDayModal ||
            event.target.closest("[data-calendar-day-close]")
        ) {
            closeDayAgenda();
            return;
        }
        const editButton = event.target.closest("[data-calendar-day-edit]");
        if (editButton) {
            const appointment = appointments.find(
                (item) => item.id === editButton.dataset.calendarDayEdit,
            );
            if (appointment)
                window.location.href = appointmentDetailHref(appointment);
        }
        if (event.target.closest("[data-calendar-day-add]")) {
            const date = calendarDayModal.dataset.date;
            closeDayAgenda();
            open(null, `${date}T09:00`);
        }
    });
    form.elements.customer.addEventListener("change", () => {
        customerSearch.setCustomValidity("");
        setNewCustomerMode();
        const selected = form.elements.customer.value;
        customerSearch.value =
            selected === newCustomerOption
                ? "Tạo hồ sơ khách hàng mới"
                : customerOptions.find((option) => option.value === selected)
                      ?.label || "";
        syncCustomerOptions(false);
        if (form.elements.customer.value === newCustomerOption) return;
        const project = customerProjects[form.elements.customer.value];
        if (project) {
            form.elements.project.value = project;
            fillAssignees();
        }
    });
    form.elements.project.addEventListener("change", () => fillAssignees());
    form.elements.type.addEventListener("change", syncActivityDetails);
    form.elements.project.addEventListener("change", syncActivityDetails);
    form.elements.assignee.addEventListener("change", () => {
        form.elements.assignee.setCustomValidity("");
        form.elements.start.setCustomValidity("");
        if (
            ["Chờ phân công", "Đã phân công"].includes(
                form.elements.status.value,
            )
        ) {
            form.elements.status.value = form.elements.assignee.value
                ? "Đã phân công"
                : "Chờ phân công";
        }
    });
    form.elements.status.addEventListener("change", () =>
        form.elements.assignee.setCustomValidity(""),
    );
    form.elements.start.addEventListener("input", () =>
        form.elements.start.setCustomValidity(""),
    );
    newCustomerName.addEventListener("input", () =>
        newCustomerName.setCustomValidity(""),
    );
    newCustomerPhone.addEventListener("input", () =>
        newCustomerPhone.setCustomValidity(""),
    );
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.elements.customer.value) {
            customerSearch.setCustomValidity(
                "Chọn khách hàng hoặc tạo hồ sơ khách hàng mới.",
            );
            customerSearch.reportValidity();
            return;
        }
        customerSearch.setCustomValidity("");
        const start = new Date(form.elements.start.value);
        const previous = appointments.find((item) => item.id === editingId);
        if (
            Number.isNaN(start.getTime()) ||
            ((!previous || previous.start !== form.elements.start.value) &&
                start <= new Date())
        ) {
            form.elements.start.setCustomValidity(
                "Chọn ngày và giờ hẹn trong tương lai.",
            );
            form.reportValidity();
            return;
        }
        const assignee = form.elements.assignee.value;
        const linkedProduct = window.LandiformInventory?.all().find(
            (item) => item.id === form.elements.productId.value,
        );
        if (
            linkedProduct &&
            linkedProduct.projectCode !== form.elements.project.value
        ) {
            customerSearch.setCustomValidity(
                "Khách hàng và sản phẩm phải thuộc cùng dự án để gắn đúng lịch tư vấn.",
            );
            form.reportValidity();
            return;
        }
        customerSearch.setCustomValidity("");
        let status = form.elements.status.value;
        if (!["Hoàn tất", "Đã hủy"].includes(status))
            status = assignee ? "Đã phân công" : "Chờ phân công";
        if (status === "Hoàn tất" && !assignee) {
            form.elements.assignee.setCustomValidity(
                "Chọn nhân viên tư vấn trước khi hoàn tất lịch hẹn.",
            );
            form.reportValidity();
            return;
        }
        const conflict =
            assignee &&
            !["Hoàn tất", "Đã hủy"].includes(status) &&
            appointments.some(
                (item) =>
                    item.id !== editingId &&
                    item.assignee === assignee &&
                    !["Đã hủy", "Hoàn tất"].includes(item.status) &&
                    Math.abs(new Date(item.start).getTime() - start.getTime()) <
                        60 * 60 * 1000,
            );
        if (conflict) {
            form.elements.start.setCustomValidity(
                `${assignee} đã có lịch hẹn gần thời gian này. Chọn giờ khác hoặc người tư vấn khác.`,
            );
            form.reportValidity();
            return;
        }
        const selectedCustomer = customerOptions.find(
            (option) => option.value === form.elements.customer.value,
        );
        let customerId = form.elements.customer.value;
        let customerName = selectedCustomer?.label || "";
        if (customerId === newCustomerOption) {
            customerId = `demo-customer-${Date.now()}`;
            customerName = newCustomerName.value.trim();
            customerOptions.push({
                value: customerId,
                label: customerName,
                phone: newCustomerPhone.value.trim(),
            });
            customerProjects[customerId] = form.elements.project.value;
        }
        const record = {
            ...(previous || {}),
            id: editingId || `demo-appointment-${Date.now()}`,
            customer: customerId,
            customerName,
            project: form.elements.project.value,
            start: form.elements.start.value,
            type: form.elements.type.value,
            place: form.elements.place.value.trim(),
            assignee,
            status,
            productId: form.elements.productId.value,
        };
        appointments = editingId
            ? appointments.map((item) =>
                  item.id === editingId ? record : item,
              )
            : [...appointments, record];
        appointmentStore.replace(appointments);
        calendarDate = new Date(record.start);
        render();
        close();
        notify(
            "Đã cập nhật lịch trong bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    if (new URLSearchParams(location.search).get("appointment") === "1") open();
    render();
})();

/* --- buyers.js --- */
(() => {
    const body = document.querySelector("#buyerTableBody");
    if (!body) return;

    const rows = [...body.querySelectorAll("tr")];
    const search = document.querySelector("#buyerSearch");
    const projectFilter = document.querySelector("#buyerProjectFilter");
    const documentFilter = document.querySelector("#buyerDocumentFilter");
    const transactionFilter = document.querySelector("#buyerTransactionFilter");
    const emptyState = document.querySelector("#buyerEmptyState");

    function filterRows() {
        const query = (search?.value || "").trim().toLocaleLowerCase("vi");
        let visible = 0;

        rows.forEach((row) => {
            const matches =
                (!query ||
                    row.textContent.toLocaleLowerCase("vi").includes(query)) &&
                (!projectFilter?.value ||
                    row.cells[2]?.textContent.trim() === projectFilter.value) &&
                (!documentFilter?.value ||
                    row.dataset.documentStatus === documentFilter.value) &&
                (!transactionFilter?.value ||
                    row.dataset.transactionStatus === transactionFilter.value);
            row.hidden = !matches;
            if (matches) visible += 1;
        });

        if (emptyState) emptyState.hidden = visible > 0;
    }

    [search, projectFilter, documentFilter, transactionFilter].forEach(
        (control) => {
            control?.addEventListener(
                control === search ? "input" : "change",
                filterRows,
            );
        },
    );

    const detailModal = document.querySelector("#buyerDetailModal");
    const detailTitle = document.querySelector("#buyerDetailTitle");
    const closeDetail = () => {
        if (detailModal) detailModal.hidden = true;
        document.body.classList.remove("modal-open");
    };

    body.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-buyer-view]");
        if (!trigger || !detailModal) return;

        const buyerId = trigger.dataset.buyerView;
        const row = trigger.closest("tr");
        const name =
            row?.cells[0]?.querySelector("strong")?.textContent.trim() ||
            "Chi tiết người mua";
        if (detailTitle) detailTitle.textContent = name;
        document.querySelectorAll("[data-buyer-profile]").forEach((item) => {
            item.hidden = item.dataset.buyerProfile !== buyerId;
        });
        const customerLink = document.querySelector(
            `#buyerCustomerLinks [data-buyer-profile="${buyerId}"]`,
        );
        if (customerLink) customerLink.hidden = false;
        detailModal.hidden = false;
        document.body.classList.add("modal-open");
    });

    detailModal
        ?.querySelectorAll("[data-buyer-detail-close]")
        .forEach((button) => {
            button.addEventListener("click", closeDetail);
        });
    detailModal?.addEventListener("click", (event) => {
        if (event.target === detailModal) closeDetail();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && detailModal && !detailModal.hidden)
            closeDetail();
    });

    const createModal = document.querySelector("#buyerModal");
    document
        .querySelector("[data-buyer-open]")
        ?.addEventListener("click", () => {
            if (!createModal) return;
            createModal.hidden = false;
            document.body.classList.add("modal-open");
        });
    createModal?.querySelectorAll("[data-buyer-close]").forEach((button) => {
        button.addEventListener("click", () => {
            createModal.hidden = true;
            document.body.classList.remove("modal-open");
        });
    });
    createModal?.addEventListener("click", (event) => {
        if (event.target === createModal) {
            createModal.hidden = true;
            document.body.classList.remove("modal-open");
        }
    });
    document
        .querySelector("#buyerForm")
        ?.addEventListener("submit", (event) => event.preventDefault());

    filterRows();
})();

/* --- campaigns.js --- */
(() => {
    const modal = document.querySelector("#campaignModal");
    const form = document.querySelector("#campaignForm");
    const table = document.querySelector("#campaignTableBody");
    const search = document.querySelector(
        '[data-filter="campaigns"], [data-filter]:not([data-filter="leads"])',
    );
    if (!table) return;

    function setModal(open) {
        if (!modal) return;
        modal.hidden = !open;
        document.body.classList.toggle("modal-open", open);
        if (open) form?.querySelector("input:not([type=hidden])")?.focus();
        else form?.reset();
    }

    function filterRows() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        table.querySelectorAll("tr").forEach((row) => {
            row.hidden =
                Boolean(query) &&
                !row.textContent.toLocaleLowerCase("vi").includes(query);
        });
    }

    search?.addEventListener("input", filterRows);
    document
        .querySelector("[data-campaign-open]")
        ?.addEventListener("click", () => setModal(true));
    document
        .querySelectorAll("[data-campaign-close]")
        .forEach((button) =>
            button.addEventListener("click", () => setModal(false)),
        );
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) setModal(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal && !modal.hidden) setModal(false);
    });
    form?.addEventListener("submit", (event) => event.preventDefault());

    document.querySelectorAll("[data-copy-url]").forEach((button) => {
        button.addEventListener("click", async () => {
            const url = button.dataset.copyUrl || "";
            try {
                await navigator.clipboard.writeText(url);
                button.setAttribute("aria-label", "Đã sao chép liên kết");
                window.setTimeout(
                    () => button.removeAttribute("aria-label"),
                    1600,
                );
            } catch {
                const input = document.createElement("textarea");
                input.value = url;
                input.setAttribute("readonly", "");
                input.style.position = "fixed";
                input.style.opacity = "0";
                document.body.append(input);
                input.select();
                document.execCommand("copy");
                input.remove();
            }
        });
    });
})();

/* --- categories.js --- */
(() => {
    const modal = document.querySelector("#categoryModal");
    const form = document.querySelector("#categoryForm");
    const level = document.querySelector("#categoryLevel");
    const parent = document.querySelector("#categoryParent");
    const table = document.querySelector("#categoryTableBody");
    if (!modal || !form || !level || !parent) return;

    function notify(message) {
        window.LandiformAdminUI.notify(document.querySelector("#toastMessage"), message, 3000);
    }

    function groupFromName(name) {
        const value = name.toLocaleLowerCase("vi");
        if (/căn hộ|chung cư/.test(value)) return "apartment";
        if (/nhà|biệt thự/.test(value)) return "house";
        if (/đất|lô/.test(value)) return "land";
        if (/thương mại|văn phòng|shophouse/.test(value)) return "commercial";
        return "other";
    }

    function appendCategoryRow(item) {
        if (!table) return;
        const row = document.createElement("tr");
        row.dataset.categoryId = item.id;
        row.dataset.name = item.name;
        row.dataset.group = item.group;
        row.dataset.level = String(item.level);
        row.dataset.parentId = item.parentId;
        const name = document.createElement("td");
        const strong = document.createElement("strong");
        strong.textContent = item.name;
        name.append(strong);
        const parentCell = document.createElement("td");
        const parentName =
            item.level === 1
                ? "Nhóm bất động sản"
                : window.LandiformCategories?.all().find(
                      (category) => category.id === item.parentId,
                  )?.name || "Danh mục cha";
        parentCell.textContent = `Cấp ${item.level} · ${parentName}`;
        const count = document.createElement("td");
        count.textContent = "0";
        const actions = document.createElement("td");
        actions.className = "category-actions-cell";
        const edit = document.createElement("a");
        edit.className = "button button-quiet";
        edit.href = `record-detail.html?type=category&id=${encodeURIComponent(item.id)}`;
        edit.textContent = "Sửa →";
        const remove = document.createElement("button");
        remove.className = "button button-quiet category-delete-button";
        remove.type = "button";
        remove.dataset.categoryDelete = item.id;
        remove.textContent = "Xóa";
        actions.append(edit, remove);
        row.append(name, parentCell, count, actions);
        table.append(row);
    }

    function updatePreview() {
        const child = level.value === "2";
        parent.required = child;
        form.elements.name.placeholder = child
            ? "Ví dụ: Căn hộ 2 phòng ngủ"
            : "Ví dụ: Căn hộ";
        document.querySelector("#categoryPreviewParent").textContent = child
            ? parent.selectedOptions[0]?.textContent || "Danh mục cha"
            : "Nhóm bất động sản";
        document.querySelector("#categoryPreviewChild").textContent =
            form.elements.name.value.trim() || "Tên danh mục";
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        updatePreview();
    }

    document
        .querySelector("[data-category-create]")
        ?.addEventListener("click", () => {
            form.reset();
            document.querySelector("#categoryModalTitle").textContent =
                "Thêm danh mục";
            form.querySelector('[type="submit"]').textContent = "Lưu danh mục";
            updatePreview();
            modal.hidden = false;
            document.body.classList.add("modal-open");
            form.elements.name.focus();
        });
    level.addEventListener("change", updatePreview);
    parent.addEventListener("change", updatePreview);
    form.elements.name.addEventListener("input", updatePreview);
    document
        .querySelectorAll("[data-category-close]")
        .forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const name = form.elements.name.value.trim();
        const levelValue = Number(level.value);
        const parentId = levelValue === 2 ? parent.value : "";
        const categories = window.LandiformCategories?.all() || [];
        if (
            categories.some(
                (item) =>
                    item.name.toLocaleLowerCase("vi") ===
                    name.toLocaleLowerCase("vi"),
            )
        ) {
            form.elements.name.setCustomValidity(
                "Tên danh mục này đã có trong danh sách.",
            );
            form.reportValidity();
            return;
        }
        form.elements.name.setCustomValidity("");
        const parentCategory = categories.find((item) => item.id === parentId);
        const item = {
            id: `demo-category-${Date.now()}`,
            name,
            level: levelValue,
            parentId,
            group:
                levelValue === 1
                    ? groupFromName(name)
                    : parentCategory?.group || "other",
        };
        if (window.LandiformCategories?.save([...categories, item]) === false)
            return;
        appendCategoryRow(item);
        if (item.level === 1) parent.add(new Option(item.name, item.id));
        close();
        notify(
            "Đã thêm danh mục vào bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    form.elements.name.addEventListener("input", () =>
        form.elements.name.setCustomValidity(""),
    );
    table?.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-category-delete]");
        if (!remove) return;
        const id = remove.dataset.categoryDelete;
        const categories = window.LandiformCategories?.all() || [];
        const item = categories.find((category) => category.id === id);
        if (!item) return;
        if (categories.some((category) => category.parentId === id)) {
            notify("Hãy xóa các danh mục con trước.");
            return;
        }
        window.LandiformCategories?.save(
            categories.filter((category) => category.id !== id),
        );
        parent.querySelector(`option[value="${CSS.escape(id)}"]`)?.remove();
        remove.closest("tr")?.remove();
        notify(
            "Đã xóa danh mục khỏi bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    updatePreview();
})();

/* --- forms.js --- */
(() => {
    const modal = document.querySelector("#formEditorModal");
    const qrModal = document.querySelector("#formQrModal");
    const form = document.querySelector("#formEditor");
    const tbody = document.querySelector("#formTableBody");
    const toast = document.querySelector("#toastMessage");
    const search = document.querySelector("#formSearch");
    const projectFilter = document.querySelector("#formProjectFilter");
    const statusFilter = document.querySelector("#formStatusFilter");
    if (!modal || !form || !tbody) return;

    let currentId = "";
        const records = () => [...tbody.querySelectorAll("tr[data-form-id]")];
    const recordFor = (id) =>
        records().find((row) => row.dataset.formId === id);
    const recordData = (row) => ({ ...row.dataset });

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const project = projectFilter?.value || "";
        const status = statusFilter?.value || "";
        records().forEach((row) => {
            row.hidden =
                !row.textContent.toLocaleLowerCase("vi").includes(query) ||
                Boolean(project && row.dataset.project !== project) ||
                Boolean(status && row.dataset.status !== status);
        });
    }

    function updateSummary() {
        const rows = records();
        const active = rows.filter(
            (row) => row.dataset.status === "Đang nhận",
        ).length;
        const qr = rows.filter((row) => row.dataset.qr === "true").length;
        const projects = new Set(
            rows.map((row) => row.dataset.project).filter(Boolean),
        );
        document.querySelector("#formTotal").textContent = String(rows.length);
        document.querySelector("#formActive").textContent = String(active);
        document.querySelector("#formQrCount").textContent = String(qr);
        document.querySelector("#formProjectCount").textContent = String(
            projects.size,
        );
    }

    function renderRecord(record, existingRow = null) {
        const row = existingRow || records()[0]?.cloneNode(true);
        if (!row) return null;
        Object.entries(record).forEach(([key, value]) => {
            row.dataset[key] = String(value ?? "");
        });
        const fieldCount =
            2 +
            ["email", "need", "budget", "appointment"].filter(
                (key) => record[key] === "true",
            ).length;
        row.querySelector("td:nth-child(1) strong").textContent = record.name;
        row.querySelector("td:nth-child(1) small").textContent =
            `${record.place} · ${fieldCount} trường`;
        row.cells[1].textContent = record.project;
        row.cells[2].textContent = String(fieldCount);
        row.cells[3].textContent = record.place;
        const status = row.cells[4].querySelector(".screen-badge");
        status.textContent = record.status;
        status.className = `screen-badge ${record.status === "Đang nhận" ? "green" : "neutral"}`;
        const qrBadge = row.cells[5].querySelector(".screen-badge");
        qrBadge.textContent = record.qr === "true" ? "Đã bật" : "Chưa bật";
        qrBadge.className = `screen-badge ${record.qr === "true" ? "violet" : "neutral"}`;
        let qrButton = row.cells[5].querySelector("[data-form-qr]");
        const qrHint = row.cells[5].querySelector("small");
        if (record.qr === "true" && !qrButton) {
            qrButton = document.createElement("button");
            qrButton.type = "button";
            qrButton.className = "project-detail-button form-qr-action";
            qrButton.innerHTML =
                '<i class="fa-solid fa-qrcode" aria-hidden="true"></i> Xem mã QR';
            row.cells[5].querySelector(".form-qr-cell").append(qrButton);
        }
        if (qrButton) {
            qrButton.hidden = record.qr !== "true";
            qrButton.dataset.formQr = record.formId;
        }
        if (qrHint) qrHint.hidden = record.qr === "true";
        const edit = row.querySelector("[data-form-edit]");
        edit.dataset.formEdit = record.formId;
        edit.href = `record-detail.html?type=form&id=${encodeURIComponent(record.formId)}`;
        const remove = row.querySelector("[data-form-delete]");
        remove.dataset.formDelete = record.formId;
        remove.setAttribute("aria-label", `Xóa biểu mẫu ${record.name}`);
        return row;
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        currentId = "";
    }

    function open(id = "") {
        currentId = id;
        form.reset();
        const row = id ? recordFor(id) : null;
        const record = row ? recordData(row) : null;
        if (record) {
            form.elements.name.value = record.name || "";
            form.elements.project.value = record.project || "";
            form.elements.place.value = record.place || "";
            ["email", "need", "budget", "appointment", "qr"].forEach((key) => {
                form.elements[key].checked = record[key] === "true";
            });
            form.elements.status.value = record.status || "Bản nháp";
        } else {
            form.elements.status.value = "Bản nháp";
        }
        document.querySelector("#formEditorTitle").textContent = record
            ? `Chỉnh sửa ${record.name}`
            : "Tạo mẫu đăng ký";
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function openQr(id) {
        const row = recordFor(id);
        if (!row || row.dataset.qr !== "true") return;
        if (row.dataset.status !== "Đang nhận") {
            notify(
                "Biểu mẫu chưa ở trạng thái nhận đăng ký nên mã QR chưa thể sử dụng.",
            );
            return;
        }
        const record = recordData(row);
        const destination = new URL(
            "../../customer/index.html",
            window.location.href,
        );
        if (record.projectCode)
            destination.searchParams.set("project", record.projectCode);
        destination.searchParams.set("utm_source", "qr");
        destination.searchParams.set("form", id);
        const link = destination.href;
        const imageUrl = new URL("https://quickchart.io/qr");
        imageUrl.searchParams.set("size", "260");
        imageUrl.searchParams.set("format", "png");
        imageUrl.searchParams.set("text", link);
        document.querySelector("#formQrImage").src = imageUrl.href;
        document.querySelector("#formQrLink").value = link;
        document.querySelector("#formQrOpen").href = link;
        document.querySelector("#formQrProject").textContent =
            record.project || "";
        document.querySelector("#formQrName").textContent = record.name || "";
        document.querySelector("#formQrTitle").textContent =
            `Mã QR · ${record.name || "Biểu mẫu"}`;
        qrModal.hidden = false;
        document.body.classList.add("modal-open");
    }

    function closeQr() {
        if (!qrModal) return;
        qrModal.hidden = true;
        if (modal.hidden) document.body.classList.remove("modal-open");
    }

    function closeAll() {
        close();
        closeQr();
    }

    updateSummary();
    applyFilters();
    document
        .querySelector("[data-form-open]")
        ?.addEventListener("click", () => open());
    tbody.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-form-delete]");
        if (remove) {
            remove.closest("tr")?.remove();
            updateSummary();
            applyFilters();
            notify(
                "Đã xóa biểu mẫu khỏi bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
            );
            return;
        }
        const qr = event.target.closest("[data-form-qr]");
        if (qr) {
            openQr(qr.dataset.formQr);
            return;
        }
        const edit = event.target.closest("[data-form-edit]");
        if (edit) open(edit.dataset.formEdit);
    });
    document
        .querySelectorAll("[data-form-qr-close]")
        .forEach((button) => button.addEventListener("click", closeQr));
    qrModal?.addEventListener("click", (event) => {
        if (event.target === qrModal) closeQr();
    });
    document
        .querySelector("[data-form-qr-copy]")
        ?.addEventListener("click", async () => {
            const input = document.querySelector("#formQrLink");
            try {
                await navigator.clipboard.writeText(input.value);
            } catch {
                input.select();
                document.execCommand("copy");
            }
            notify("Đã sao chép đường dẫn biểu mẫu.");
        });
    document
        .querySelectorAll("[data-form-close]")
        .forEach((button) => button.addEventListener("click", close));
    search?.addEventListener("input", applyFilters);
    projectFilter?.addEventListener("change", applyFilters);
    statusFilter?.addEventListener("change", applyFilters);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAll();
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const selectedProject = form.elements.project.selectedOptions[0];
        const record = {
            formId: currentId || `demo-form-${Date.now()}`,
            name: form.elements.name.value.trim(),
            project: selectedProject?.textContent.trim() || "",
            projectCode: selectedProject?.value || "",
            place: form.elements.place.value,
            status: form.elements.status.value,
            email: String(form.elements.email.checked),
            need: String(form.elements.need.checked),
            budget: String(form.elements.budget.checked),
            appointment: String(form.elements.appointment.checked),
            qr: String(form.elements.qr.checked),
        };
        const existing = currentId ? recordFor(currentId) : null;
        const row = renderRecord(record, existing);
        if (!existing && row) tbody.append(row);
        updateSummary();
        applyFilters();
        close();
        notify(
            "Đã cập nhật biểu mẫu trong bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
})();

/* --- guide-management.js --- */
(() => {
    const list = document.querySelector("#guideList");
    const caption = document.querySelector("#guideListCaption");
    const form = document.querySelector("#guideForm");
    const empty = document.querySelector("#guideEditorEmpty");
    const editorTitle = document.querySelector("#guideEditorTitle");
    const imagePreview = document.querySelector("#guideImagePreview");
    const toast = document.querySelector("#toastMessage");
    if (!list || !form) return;
    const categoryNames = Object.fromEntries(
        [...form.elements.category.options].map((option) => [
            option.value,
            option.textContent.trim(),
        ]),
    );

    let guides = [];
    let activeId = null;
        const imageInput = form.elements.image;
    const imageFileInput = form.elements.imageFile;
    const imageFileName = document.querySelector("#guideImageFileName");
    const bodyInput = form.elements.bodyHtml;

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    function loadGuides() {
        return [...list.querySelectorAll(".guide-list-item-wrap")].map(
            (row) => {
                const button = row.querySelector("[data-guide-id]");
                return {
                    id: button.dataset.guideId,
                    category: row.dataset.guideCategory,
                    kicker: row.dataset.guideKicker,
                    title:
                        button
                            .querySelector(".guide-list-copy strong")
                            ?.textContent.trim() || "",
                    summary: row.dataset.guideSummary,
                    image: row.dataset.guideImage,
                    imageAlt: row.dataset.guideImageAlt,
                    bodyHtml:
                        row.querySelector("template[data-guide-body]")
                            ?.innerHTML || "",
                    published: !button
                        .querySelector(".guide-status")
                        ?.classList.contains("is-hidden"),
                };
            },
        );
    }

    function imageUrl(value) {
        const source = String(value || "").trim();
        if (!source) return "";
        if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(source))
            return source;
        try {
            const url = new URL(
                source,
                new URL("../../customer/articles.html", location.href),
            );
            return ["http:", "https:"].includes(url.protocol) ? url.href : "";
        } catch {
            return "";
        }
    }

    async function prepareImage(file) {
        if (!file?.type.startsWith("image/"))
            throw new Error("Vui lòng chọn tệp ảnh.");
        if (file.size > 12 * 1024 * 1024)
            throw new Error("Ảnh cần nhỏ hơn 12 MB.");
        if (!window.createImageBitmap)
            throw new Error(
                "Trình duyệt này chưa hỗ trợ chọn ảnh. Hãy dùng liên kết ảnh hiện có.",
            );
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (dataUrl.length > 1_800_000)
            throw new Error(
                "Ảnh sau khi tối ưu vẫn quá lớn. Hãy chọn ảnh nhẹ hơn.",
            );
        return dataUrl;
    }

    function setBody(value) {
        const editor = window.tinymce?.get("guideBody");
        if (editor) editor.setContent(value || "<p></p>");
        else bodyInput.value = value || "";
    }

    function openGuide(idOrGuide) {
        const guide =
            typeof idOrGuide === "object"
                ? idOrGuide
                : guides.find((item) => item.id === idOrGuide);
        if (!guide) return;
        activeId = guide.id;
        form.hidden = false;
        empty.hidden = true;
        editorTitle.textContent = guide.title || "Bài viết mới";
        form.elements.id.value = guide.id;
        form.elements.category.value = guide.category || "apartment";
        form.elements.kicker.value = guide.kicker || "CẨM NANG";
        form.elements.title.value = guide.title || "";
        form.elements.summary.value = guide.summary || "";
        imageInput.value = guide.image || "";
        imageFileInput.value = "";
        imageFileName.textContent = guide.image
            ? "Ảnh hiện tại sẽ được giữ nguyên nếu không chọn ảnh mới."
            : "Chưa chọn ảnh. Chọn ảnh từ thiết bị để làm ảnh bìa.";
        form.elements.imageAlt.value = guide.imageAlt || "";
        form.elements.published.checked = guide.published !== false;
        setBody(guide.bodyHtml || "");
        renderImagePreview();
        document.querySelector("#guideDelete").hidden =
            guide.id.startsWith("draft-");
        list.querySelectorAll("[data-guide-id]").forEach((item) =>
            item.classList.toggle(
                "is-active",
                item.dataset.guideId === guide.id,
            ),
        );
    }

    function renderImagePreview() {
        const src = imageUrl(imageInput.value);
        if (!src) {
            imagePreview.replaceChildren(
                Object.assign(document.createElement("i"), {
                    className: "fa-regular fa-image",
                }),
                Object.assign(document.createElement("span"), {
                    textContent: "Xem trước ảnh bìa",
                }),
            );
            return;
        }
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Xem trước ảnh bìa";
        img.addEventListener(
            "error",
            () => {
                imagePreview.replaceChildren(
                    Object.assign(document.createElement("i"), {
                        className: "fa-solid fa-triangle-exclamation",
                    }),
                    Object.assign(document.createElement("span"), {
                        textContent:
                            "Không tải được ảnh này. Kiểm tra lại liên kết.",
                    }),
                );
            },
            { once: true },
        );
        imagePreview.replaceChildren(img);
    }

    function newGuide() {
        activeId = `draft-${Date.now()}`;
        form.reset();
        form.hidden = false;
        empty.hidden = true;
        editorTitle.textContent = "Bài viết mới";
        form.elements.id.value = activeId;
        form.elements.published.checked = false;
        imageInput.value = "";
        imageFileInput.value = "";
        imageFileName.textContent =
            "Chưa chọn ảnh. Chọn ảnh từ thiết bị để làm ảnh bìa.";
        setBody("<p></p>");
        renderImagePreview();
        document.querySelector("#guideDelete").hidden = true;
        list.querySelectorAll("[data-guide-id]").forEach((item) =>
            item.classList.remove("is-active"),
        );
        form.elements.title.focus();
    }

    function initializeEditor() {
        if (!window.tinymce) return;
        window.tinymce
            .init({
                selector: "#guideBody",
                height: 420,
                menubar: false,
                plugins:
                    "advlist autolink lists link image charmap preview anchor searchreplace wordcount visualblocks code fullscreen media table directionality emoticons",
                toolbar:
                    "undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code",
                toolbar_mode: "sliding",
                relative_urls: false,
                convert_urls: false,
                image_caption: true,
                content_style:
                    "body { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #435d70; } h2,h3 { color: #173c56; }",
                setup(editor) {
                    editor.on("change keyup undo redo", () => editor.save());
                    editor.on("init", () => {
                        const guide = guides.find(
                            (item) => item.id === activeId,
                        );
                        if (guide)
                            editor.setContent(guide.bodyHtml || "<p></p>");
                    });
                },
            })
            .catch(() =>
                notify(
                    "Không tải được bộ soạn thảo. Bạn vẫn có thể nhập nội dung HTML vào ô bài viết.",
                ),
            );
    }

    function deleteGuide(id) {
        const guide = guides.find((item) => item.id === id);
        if (!guide) return;
        guides = guides.filter((item) => item.id !== guide.id);
        list.querySelector(`[data-guide-id="${CSS.escape(guide.id)}"]`)
            ?.closest(".guide-list-item-wrap")
            ?.remove();
        if (activeId === guide.id) {
            activeId = null;
            form.hidden = true;
            empty.hidden = false;
            editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
            setBody("");
        }
        notify(
            "Đã xóa bài viết khỏi bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    }

    list.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-guide-delete]");
        if (deleteButton) {
            deleteGuide(deleteButton.dataset.guideDelete);
            return;
        }
        const item = event.target.closest("[data-guide-id]");
        if (!item) return;
        openGuide(item.dataset.guideId);
    });
    document.querySelector("#guideCreate")?.addEventListener("click", newGuide);
    document.querySelector("#guideReset")?.addEventListener("click", () => {
        if (activeId?.startsWith("draft-")) {
            activeId = null;
            form.reset();
            form.hidden = true;
            empty.hidden = false;
            editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
            setBody("");
            return;
        }
        const guide = guides.find((item) => item.id === activeId);
        if (guide) openGuide(guide.id);
    });
    imageFileInput.addEventListener("change", async () => {
        const file = imageFileInput.files?.[0];
        if (!file) return;
        imageFileName.textContent = `Đang xử lý: ${file.name}`;
        try {
            imageInput.value = await prepareImage(file);
            imageFileName.textContent = `Đã chọn: ${file.name}`;
            renderImagePreview();
        } catch (error) {
            imageFileInput.value = "";
            imageFileName.textContent = "Chưa chọn ảnh mới.";
            notify(error.message || "Không thể đọc ảnh này.");
        }
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const bodyHtml =
            window.tinymce?.get("guideBody")?.getContent().trim() ||
            bodyInput.value.trim();
        const bodyText = new DOMParser()
            .parseFromString(bodyHtml, "text/html")
            .body.textContent.trim();
        if (!bodyText) return notify("Vui lòng nhập nội dung bài viết.");
        if (!imageUrl(imageInput.value))
            return notify("Vui lòng nhập liên kết ảnh hợp lệ.");
        const existing = guides.find((item) => item.id === activeId);
        const guide = {
            ...(existing || {}),
            id: existing?.id || `demo-guide-${Date.now()}`,
            category: form.elements.category.value,
            kicker: form.elements.kicker.value.trim(),
            title: form.elements.title.value.trim(),
            summary: form.elements.summary.value.trim(),
            image: imageInput.value,
            imageAlt: form.elements.imageAlt.value.trim(),
            bodyHtml,
            published: form.elements.published.checked,
        };
        if (existing)
            guides = guides.map((item) =>
                item.id === guide.id ? guide : item,
            );
        else guides.push(guide);
        let wrapper = list
            .querySelector(`[data-guide-id="${CSS.escape(guide.id)}"]`)
            ?.closest(".guide-list-item-wrap");
        if (!wrapper) {
            wrapper = list
                .querySelector(".guide-list-item-wrap")
                ?.cloneNode(true);
            if (wrapper) list.append(wrapper);
        }
        if (wrapper) {
            wrapper.dataset.guideCategory = guide.category;
            wrapper.dataset.guideKicker = guide.kicker;
            wrapper.dataset.guideSummary = guide.summary;
            wrapper.dataset.guideImage = guide.image;
            wrapper.dataset.guideImageAlt = guide.imageAlt;
            const item = wrapper.querySelector("[data-guide-id]");
            item.dataset.guideId = guide.id;
            item.setAttribute("aria-label", `Mở bài viết ${guide.title}`);
            item.querySelector("strong").textContent = guide.title;
            item.querySelector("small").textContent =
                categoryNames[guide.category] || guide.category;
            const image = item.querySelector("img");
            if (image) {
                image.src = guide.image;
                image.alt = guide.imageAlt;
            }
            const status = item.querySelector(".guide-status");
            if (status) {
                status.textContent = guide.published
                    ? "Đang hiển thị"
                    : "Bản nháp";
                status.classList.toggle("is-hidden", !guide.published);
            }
            const remove = wrapper.querySelector("[data-guide-delete]");
            if (remove) {
                remove.dataset.guideDelete = guide.id;
                remove.setAttribute(
                    "aria-label",
                    `Xóa bài viết ${guide.title}`,
                );
            }
            let bodyTemplate = wrapper.querySelector(
                "template[data-guide-body]",
            );
            if (!bodyTemplate) {
                bodyTemplate = document.createElement("template");
                bodyTemplate.dataset.guideBody = "";
                wrapper.append(bodyTemplate);
            }
            bodyTemplate.innerHTML = bodyHtml;
        }
        activeId = guide.id;
        editorTitle.textContent = guide.title;
        notify(
            "Đã cập nhật bài viết trên bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    document
        .querySelector("#guideDelete")
        ?.addEventListener("click", () => deleteGuide(activeId));
    document
        .querySelector("#globalSearch")
        ?.addEventListener("input", (event) => {
            const query = event.currentTarget.value
                .trim()
                .toLocaleLowerCase("vi");
            list.querySelectorAll("[data-guide-id]").forEach((item) => {
                item.hidden =
                    Boolean(query) &&
                    !item.textContent.toLocaleLowerCase("vi").includes(query);
            });
        });

    guides = loadGuides();
    if (guides[0]) openGuide(guides[0].id);
    initializeEditor();
})();

/* --- inventory-page.js --- */
(() => {
    const inventory = window.LandiformInventory;
    const tbody = document.querySelector("#inventoryTableBody");
    const unitModal = document.querySelector("#unitModal");
    const bulkModal = document.querySelector("#unitBulkModal");
    const unitForm = document.querySelector("#unitForm");
    const unitGroup = document.querySelector("#unitGroup");
    const unitAttributeFields = document.querySelector("#unitAttributeFields");
    const bulkForm = document.querySelector("#unitBulkForm");
    if (
        !inventory ||
        !tbody ||
        !unitModal ||
        !bulkModal ||
        !unitForm ||
        !bulkForm
    )
        return;

    const search = document.querySelector("#inventorySearch");
    const projectFilter = document.querySelector("#inventoryProjectFilter");
    const groupFilter = document.querySelector("#inventoryGroupFilter");
    const typeFilter = document.querySelector("#inventoryTypeFilter");
    const towerFilter = document.querySelector("#inventoryTowerFilter");
    const floorFilter = document.querySelector("#inventoryFloorFilter");
    const statusFilter = document.querySelector("#inventoryStatusFilter");
    const previous = document.querySelector("#inventoryPrevious");
    const next = document.querySelector("#inventoryNext");
    const toast = document.querySelector("#toastMessage");
    const deleteButton = document.querySelector("#unitDelete");
    const mapNavigation = document.querySelector("#inventoryMapNavigation");
    const mapSummary = document.querySelector("#inventoryMapSummary");
    const mapTowers = document.querySelector("#inventoryMapTowers");
    const mapFloors = document.querySelector("#inventoryMapFloors");
    const mapUnits = document.querySelector("#inventoryMapUnits");
    const listDetails = document.querySelector("#inventoryListDetails");
    const bulkButton = document.querySelector("[data-unit-bulk]");
    const detailModal = document.querySelector("#unitDetailModal");
    const detailEdit = document.querySelector("#unitDetailEdit");
    const detailBook = document.querySelector("#unitDetailBook");
    const pageSize = 15;
    const staticInventory = inventory.all();
    const projectGroups = staticInventory.reduce((map, unit) => {
        if (!unit.projectCode) return map;
        if (!map.has(unit.projectCode))
            map.set(unit.projectCode, {
                name: unit.project,
                address: unit.address || "",
                groups: new Set(),
            });
        if (unit.productGroup)
            map.get(unit.projectCode).groups.add(unit.productGroup);
        return map;
    }, new Map());
    const projects = Object.fromEntries(
        [...projectGroups].map(([code, project]) => [
            code,
            { ...project, groups: [...project.groups] },
        ]),
    );
    let units = staticInventory;
    let page = 1;
    let editingId = null;
    let viewingId = null;
    let selectedTower = "";
    let selectedFloor = null;

    function updateTypeOptions() {
        const selected = typeFilter.value;
        const catalog = window.LandiformCategories?.all() || [];
        const selectedGroup = groupFilter?.value || "";
        const scopedUnits = units.filter(
            (unit) =>
                !projectFilter.value ||
                unit.projectCode === projectFilter.value,
        );
        const usedTypes = new Set(
            scopedUnits.map((unit) => unit.type).filter(Boolean),
        );
        const types = [
            ...new Set([
                ...catalog
                    .filter(
                        (item) =>
                            String(item.level || 2) !== "1" &&
                            (!selectedGroup || item.group === selectedGroup),
                    )
                    .map((item) => item.name),
                ...[...usedTypes].filter(
                    (name) =>
                        !selectedGroup ||
                        (window.LandiformCategories?.groupForType(name) ||
                            "other") === selectedGroup,
                ),
            ]),
        ].sort((a, b) => a.localeCompare(b, "vi"));
        typeFilter.replaceChildren(new Option("Tất cả loại sản phẩm", ""));
        types.forEach((type) => typeFilter.add(new Option(type, type)));
        if (types.includes(selected)) typeFilter.value = selected;
        else typeFilter.value = "";
    }

    function isApartment(project) {
        return project?.groups?.includes("apartment") || false;
    }

    function productTypesFor(project) {
        return window.LandiformCategories?.forProject(project) || [];
    }

    const attributeTemplates = new Map(
        [
            ...document.querySelectorAll(
                "#unitAttributeTemplates [data-product-group]",
            ),
        ].map((template) => [template.dataset.productGroup, template]),
    );

    function groupLabel(group) {
        return (
            attributeTemplates.get(group)?.dataset.groupLabel ||
            "S\u1ea3n ph\u1ea9m"
        );
    }

    function updateUnitTypeOptions(group, preferredType = "") {
        const catalog = window.LandiformCategories?.all() || [];
        const types = catalog
            .filter(
                (item) =>
                    String(item.level || 2) !== "1" && item.group === group,
            )
            .map((item) => item.name);
        if (preferredType && !types.includes(preferredType))
            types.unshift(preferredType);
        unitForm.elements.type.replaceChildren(
            ...types.map((type) => new Option(type, type)),
        );
        unitForm.elements.type.value =
            preferredType && types.includes(preferredType)
                ? preferredType
                : types[0] || "";
    }

    function populateUnitGroupOptions(selected = "") {
        const catalog = window.LandiformCategories?.all() || [];
        const groups = [...attributeTemplates.keys()].filter((group) =>
            catalog.some(
                (item) =>
                    String(item.level || 2) !== "1" && item.group === group,
            ),
        );
        unitGroup.replaceChildren(
            ...groups.map((group) => new Option(groupLabel(group), group)),
        );
        if (groups.includes(selected)) unitGroup.value = selected;
        else unitGroup.value = groups[0] || "";
        unitGroup.disabled = !groups.length;
    }

    function renderUnitAttributes(group, values = {}) {
        if (!unitAttributeFields) return;
        const template = attributeTemplates.get(group);
        unitAttributeFields.replaceChildren();
        unitAttributeFields.hidden =
            !template || !template.content.children.length;
        if (!template || unitAttributeFields.hidden) return;
        const fragment = template.content.cloneNode(true);
        fragment.querySelectorAll('[name^="attribute_"]').forEach((input) => {
            const name = input.name.slice("attribute_".length);
            input.value = values[name] ?? "";
        });
        unitAttributeFields.append(fragment);
    }

    function updateBulkTypeOptions(
        preferredType = bulkForm.elements.type.value,
    ) {
        const project = projects[bulkForm.elements.projectCode.value];
        const types = productTypesFor(project).filter(
            (type) =>
                (window.LandiformCategories?.groupForType(type) || "other") ===
                "apartment",
        );
        bulkForm.elements.type.replaceChildren(
            ...types.map((type) => new Option(type, type)),
        );
        bulkForm.elements.type.value = types.includes(preferredType)
            ? preferredType
            : types[0] || "";
    }

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3400);
    }

    function addProjectOptions(select, apartmentOnly = false) {
        Object.entries(projects).forEach(([code, project]) => {
            if (apartmentOnly && !isApartment(project)) return;
            select.add(new Option(project.name, code));
        });
    }

    addProjectOptions(projectFilter);
    addProjectOptions(unitForm.elements.projectCode);
    addProjectOptions(bulkForm.elements.projectCode, true);
    const requestedProject = new URLSearchParams(location.search).get(
        "project",
    );
    projectFilter.value =
        requestedProject && projects[requestedProject] ? requestedProject : "";
    listDetails.open = !isApartment(projects[projectFilter.value]);

    function replaceOptions(select, placeholder, values) {
        const selected = select.value;
        select.replaceChildren(new Option(placeholder, ""));
        values.forEach((value) =>
            select.add(new Option(String(value), String(value))),
        );
        if ([...select.options].some((option) => option.value === selected))
            select.value = selected;
    }

    function updateLocationFilters() {
        const project = projectFilter.value;
        const towerNames = [
            ...new Set(
                units
                    .filter((unit) => !project || unit.projectCode === project)
                    .map((unit) => unit.tower),
            ),
        ].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
        replaceOptions(towerFilter, "Tất cả tòa / phân khu", towerNames);
        const floorNumbers = [
            ...new Set(
                units
                    .filter(
                        (unit) =>
                            (!project || unit.projectCode === project) &&
                            (!towerFilter.value ||
                                unit.tower === towerFilter.value) &&
                            unit.floor != null,
                    )
                    .map((unit) => unit.floor),
            ),
        ].sort((a, b) => a - b);
        replaceOptions(floorFilter, "Tất cả tầng", floorNumbers);
    }

    function tone(status) {
        return (
            {
                "Còn bán": "green",
                "Chờ duyệt": "amber",
                "Đang giữ chỗ": "reserved",
                "Đã bán": "neutral",
                "Chưa mở bán": "blue",
            }[status] || "neutral"
        );
    }

    function formatPrice(value) {
        const price = Number(value);
        return Number.isFinite(price)
            ? `${price.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`
            : "—";
    }

    function statusStyle(status) {
        if (status === "Còn bán") return "available";
        if (status === "Đã bán") return "sold";
        if (status === "Chưa mở bán") return "unreleased";
        return "pending";
    }

    function renderMap() {
        const project = projects[projectFilter.value];
        const projectSelected = Boolean(projectFilter.value);
        const projectUnits = units.filter(
            (unit) =>
                !projectSelected || unit.projectCode === projectFilter.value,
        );
        const apartment = isApartment(project);
        document.querySelector("#inventoryMapTitle").textContent =
            !projectSelected
                ? "Kho sản phẩm các dự án"
                : apartment
                  ? "Chọn tòa, tầng và căn hộ"
                  : "Sản phẩm của dự án";
        document.querySelector("#inventoryMapIntro").textContent =
            !projectSelected
                ? "Danh mục hỗ trợ căn hộ, nhà, biệt thự và lô đất. Chọn dự án để xem hoặc thêm đúng loại sản phẩm."
                : apartment
                  ? "Chọn tòa và tầng để xem từng căn còn bán, đang giữ chỗ hoặc đã bán."
                  : "Danh sách sản phẩm thuộc dự án đang chọn. Lọc, thêm hoặc chỉnh sửa từng sản phẩm bên dưới.";
        const singleGroup =
            project?.groups?.length === 1 ? project.groups[0] : "";
        const addLabel = !projectSelected
            ? " Thêm sản phẩm"
            : singleGroup
              ? ` Thêm ${groupLabel(singleGroup).toLocaleLowerCase("vi")}`
              : " Thêm sản phẩm";
        document.querySelector("[data-unit-add]").lastChild.textContent =
            addLabel;
        mapNavigation.hidden = !projectSelected || !apartment;
        bulkButton.hidden = !projectSelected || !apartment;
        mapSummary.replaceChildren();
        for (const [label, count, className] of [
            ["Tổng sản phẩm", projectUnits.length, "total"],
            [
                "Còn bán",
                projectUnits.filter((unit) => unit.status === "Còn bán").length,
                "available",
            ],
            [
                "Đang xử lý",
                projectUnits.filter((unit) =>
                    ["Chờ duyệt", "Đang giữ chỗ"].includes(unit.status),
                ).length,
                "pending",
            ],
            [
                "Đã bán",
                projectUnits.filter((unit) => unit.status === "Đã bán").length,
                "sold",
            ],
        ]) {
            const item = document.createElement("div");
            item.className = `inventory-map-stat ${className}`;
            const number = document.createElement("strong");
            number.textContent = count.toLocaleString("vi-VN");
            const caption = document.createElement("span");
            caption.textContent = label;
            item.append(number, caption);
            mapSummary.append(item);
        }
        if (!projectSelected || !apartment) return;

        const towers = [
            ...new Set(projectUnits.map((unit) => unit.tower)),
        ].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
        if (!towers.includes(selectedTower)) {
            selectedTower = towers.reduce(
                (best, tower) =>
                    projectUnits.filter((unit) => unit.tower === tower).length >
                    projectUnits.filter((unit) => unit.tower === best).length
                        ? tower
                        : best,
                towers[0] || "",
            );
            selectedFloor = null;
        }
        document.querySelector("#inventoryTowerCount").textContent =
            `${towers.length} tòa`;
        mapTowers.replaceChildren();
        for (const tower of towers) {
            const towerUnits = projectUnits.filter(
                (unit) => unit.tower === tower,
            );
            const button = document.createElement("button");
            button.type = "button";
            button.className = "inventory-tower-button";
            button.dataset.tower = tower;
            button.setAttribute(
                "aria-pressed",
                String(tower === selectedTower),
            );
            const title = document.createElement("strong");
            title.textContent = `Tòa ${tower}`;
            const count = document.createElement("span");
            count.textContent = `${towerUnits.length} căn · ${towerUnits.filter((unit) => unit.status === "Còn bán").length} còn bán`;
            button.append(title, count);
            mapTowers.append(button);
        }
        if (!towers.length) {
            const empty = document.createElement("p");
            empty.className = "inventory-map-empty";
            empty.textContent =
                "Dự án chưa có tòa nhà. Chọn “Thêm nhiều căn hộ” để lập danh sách căn đầu tiên.";
            mapTowers.append(empty);
        }

        const towerUnits = projectUnits.filter(
            (unit) => unit.tower === selectedTower,
        );
        const floors = [
            ...new Set(
                towerUnits
                    .filter((unit) => unit.floor != null)
                    .map((unit) => unit.floor),
            ),
        ].sort((a, b) => a - b);
        if (!floors.includes(selectedFloor)) {
            selectedFloor = floors.reduce(
                (best, floor) =>
                    towerUnits.filter((unit) => unit.floor === floor).length >
                    towerUnits.filter((unit) => unit.floor === best).length
                        ? floor
                        : best,
                floors[0] ?? null,
            );
        }
        document.querySelector("#inventorySelectedTower").textContent =
            selectedTower ? `Tòa ${selectedTower} · ${floors.length} tầng` : "";
        mapFloors.replaceChildren();
        for (const floor of floors) {
            const floorUnits = towerUnits.filter(
                (unit) => unit.floor === floor,
            );
            const button = document.createElement("button");
            button.type = "button";
            button.className = "inventory-floor-button";
            button.dataset.floor = String(floor);
            button.setAttribute(
                "aria-pressed",
                String(floor === selectedFloor),
            );
            const title = document.createElement("strong");
            title.textContent = `Tầng ${floor}`;
            const count = document.createElement("span");
            count.textContent = `${floorUnits.length} căn`;
            button.append(title, count);
            mapFloors.append(button);
        }
        const visible = towerUnits
            .filter((unit) => unit.floor === selectedFloor)
            .sort((a, b) =>
                String(a.number).localeCompare(String(b.number), "vi", {
                    numeric: true,
                }),
            );
        document.querySelector("#inventoryMapCount").textContent =
            selectedFloor == null
                ? ""
                : `Tòa ${selectedTower} · Tầng ${selectedFloor} · ${visible.length} căn`;
        mapUnits.replaceChildren();
        for (const unit of visible) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `inventory-unit-card ${statusStyle(unit.status)}`;
            button.dataset.unitView = unit.id;
            button.setAttribute(
                "aria-label",
                `${unit.code}, ${unit.type}, ${unit.status}`,
            );
            const number = document.createElement("strong");
            number.textContent = `Căn ${unit.number}`;
            const detail = document.createElement("span");
            detail.textContent = `${unit.type.replace("Căn hộ ", "")} · ${unit.area} m²`;
            const bottom = document.createElement("span");
            bottom.className = "inventory-unit-card-bottom";
            const price = document.createElement("b");
            price.textContent = formatPrice(unit.price);
            const status = document.createElement("small");
            status.textContent = unit.status;
            bottom.append(price, status);
            button.append(number, detail, bottom);
            mapUnits.append(button);
        }
        if (!visible.length) {
            const empty = document.createElement("p");
            empty.className = "inventory-map-empty";
            empty.textContent =
                "Tầng này chưa có căn hộ. Bạn có thể thêm từng căn hoặc nhập nhiều căn cùng lúc.";
            mapUnits.append(empty);
        }
    }

    function makeRow(unit) {
        const row = document.createElement("tr");
        const code = document.createElement("td");
        const strong = document.createElement("strong");
        strong.textContent = unit.code;
        code.append(strong);
        row.append(code);
        const projectCell = document.createElement("td");
        const projectLink = document.createElement("a");
        projectLink.className = "screen-link";
        projectLink.href = `project-detail.html?code=${encodeURIComponent(unit.projectCode)}`;
        projectLink.textContent =
            projects[unit.projectCode]?.name || unit.project || "Dự án";
        projectCell.append(projectLink);
        row.append(projectCell);
        for (const value of [
            unit.tower,
            unit.floor != null ? `Tầng ${unit.floor}` : "—",
            unit.type,
            unitSpecification(unit),
            `${unit.area} m²`,
            formatPrice(unit.price),
            unit.commissionPercent != null
                ? `${unit.commissionPercent}%`
                : "Chưa thiết lập",
        ]) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        }
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `screen-badge ${tone(unit.status)}`;
        badge.textContent = unit.status;
        statusCell.append(badge);
        row.append(statusCell);
        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "inventory-actions";
        if (unit.status === "Còn bán") {
            const book = document.createElement("button");
            book.className = "project-detail-button";
            book.type = "button";
            book.dataset.unitConsult = unit.id;
            book.textContent = "Lên lịch tư vấn";
            actions.append(book);
        }
        const action = document.createElement("a");
        action.className = "project-detail-button";
        action.href = `product-detail.html?id=${encodeURIComponent(unit.id)}`;
        action.innerHTML =
            'Chỉnh sửa <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        const remove = document.createElement("button");
        remove.className = "button button-danger screen-row-delete";
        remove.type = "button";
        remove.dataset.inventoryDelete = unit.id;
        remove.setAttribute("aria-label", `Xóa sản phẩm ${unit.code}`);
        remove.innerHTML =
            '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span>';
        actions.append(action, remove);
        actionCell.append(actions);
        row.append(actionCell);
        return row;
    }

    function unitSpecification(unit) {
        const group =
            window.LandiformCategories?.groupForType(unit.type) || "other";
        const attributes = unit.attributes || {};
        const facts = [];
        if (group === "apartment" || group === "house" || group === "other") {
            const bedroomCount =
                attributes.bedrooms ??
                Number(/(\d+)\s*phòng ngủ/i.exec(unit.type || "")?.[1] || 0);
            if (bedroomCount) facts.push(`${bedroomCount} PN`);
            if (attributes.bathrooms != null && attributes.bathrooms !== "")
                facts.push(`${attributes.bathrooms} PT`);
        }
        if (group === "house" && attributes.storeys)
            facts.unshift(`${attributes.storeys} tầng`);
        if (group === "land") {
            if (attributes.frontage) facts.push(`MT ${attributes.frontage} m`);
            if (attributes.depth) facts.push(`sâu ${attributes.depth} m`);
        }
        if (group === "commercial" && attributes.usage)
            facts.push(attributes.usage);
        return facts.join(" · ") || "—";
    }

    function render() {
        updateLocationFilters();
        updateTypeOptions();
        renderMap();
        if (tbody.dataset.staticDemo === "true") {
            const query = search.value.trim().toLocaleLowerCase("vi");
            const rows = [...tbody.rows];
            const visible = rows.filter((row) => {
                const text = row.textContent.toLocaleLowerCase("vi");
                const matchesProject =
                    !projectFilter.value ||
                    row.cells[1]?.textContent.trim() ===
                        projects[projectFilter.value]?.name;
                const matchesGroup =
                    !groupFilter?.value ||
                    (window.LandiformCategories?.groupForType(
                        row.cells[4]?.textContent.trim(),
                    ) || "other") === groupFilter.value;
                const matchesType =
                    !typeFilter.value ||
                    row.cells[4]?.textContent.trim() === typeFilter.value;
                const matchesTower =
                    !towerFilter.value ||
                    row.cells[2]?.textContent.trim() === towerFilter.value;
                const matchesFloor =
                    !floorFilter.value ||
                    row.cells[3]?.textContent.includes(floorFilter.value);
                const matchesStatus =
                    !statusFilter.value ||
                    row.cells[9]?.textContent.trim() === statusFilter.value;
                return (
                    (!query || text.includes(query)) &&
                    matchesProject &&
                    matchesGroup &&
                    matchesType &&
                    matchesTower &&
                    matchesFloor &&
                    matchesStatus
                );
            });
            rows.forEach((row) => {
                row.hidden = !visible.includes(row);
            });
            document.querySelector("#inventoryCount").textContent =
                `${visible.length} sản phẩm trong danh sách hiện tại`;
            document.querySelector("#inventoryPage").textContent =
                "Phiên hiện tại";
            previous.disabled = true;
            next.disabled = true;
            return;
        }
        const query = search.value.trim().toLocaleLowerCase("vi");
        const filtered = units.filter((unit) => {
            const searchable =
                `${unit.code} ${projects[unit.projectCode]?.name || unit.project} ${unit.address || ""} ${unit.tower} ${unit.type} ${unit.floor ?? ""}`.toLocaleLowerCase(
                    "vi",
                );
            return (
                (!query || searchable.includes(query)) &&
                (!projectFilter.value ||
                    unit.projectCode === projectFilter.value) &&
                (!groupFilter?.value ||
                    (window.LandiformCategories?.groupForType(unit.type) ||
                        "other") === groupFilter.value) &&
                (!typeFilter.value || unit.type === typeFilter.value) &&
                (!towerFilter.value || unit.tower === towerFilter.value) &&
                (!floorFilter.value ||
                    String(unit.floor) === floorFilter.value) &&
                (!statusFilter.value || unit.status === statusFilter.value)
            );
        });
        const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.min(page, pages);
        const from = (page - 1) * pageSize;
        const visible = filtered.slice(from, from + pageSize);
        tbody.replaceChildren(...visible.map(makeRow));
        if (!visible.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 11;
            cell.textContent = "Chưa có căn hoặc sản phẩm phù hợp với bộ lọc.";
            row.append(cell);
            tbody.append(row);
        }
        document.querySelector("#inventoryCount").textContent = filtered.length
            ? `Hiển thị ${from + 1}–${from + visible.length} / ${filtered.length} sản phẩm`
            : "0 sản phẩm";
        document.querySelector("#inventoryPage").textContent =
            `Trang ${page} / ${pages}`;
        previous.disabled = page <= 1;
        next.disabled = page >= pages;
    }

    function close(modal) {
        modal.hidden = true;
        if (unitModal.hidden && bulkModal.hidden && detailModal.hidden)
            document.body.classList.remove("modal-open");
        modal.querySelector("form")?.reset();
        unitForm.elements.number.setCustomValidity("");
        editingId = null;
    }

    function closeDetail() {
        detailModal.hidden = true;
        viewingId = null;
        if (unitModal.hidden && bulkModal.hidden)
            document.body.classList.remove("modal-open");
    }

    function openDetail(id) {
        const unit = units.find((item) => item.id === id);
        if (!unit) return;
        viewingId = id;
        document.querySelector("#unitDetailLocation").textContent =
            unit.floor == null
                ? unit.tower
                : `${projects[unit.projectCode]?.name || unit.project} · Tòa ${unit.tower} · Tầng ${unit.floor}`;
        document.querySelector("#unitDetailTitle").textContent =
            unit.floor == null ? unit.code : `Căn ${unit.number}`;
        document.querySelector("#unitDetailType").textContent = unit.type;
        document.querySelector("#unitDetailArea").textContent =
            `${unit.area} m²`;
        document.querySelector("#unitDetailPrice").textContent = formatPrice(
            unit.price,
        );
        document.querySelector("#unitDetailCommission").textContent =
            unit.commissionPercent != null
                ? `${unit.commissionPercent}%`
                : "Chưa thiết lập";
        document.querySelector("#unitDetailProject").textContent =
            projects[unit.projectCode]?.name || unit.project;
        document.querySelector("#unitDetailAddress").textContent =
            unit.address ||
            projects[unit.projectCode]?.address ||
            "Theo địa chỉ dự án";
        const attributes = unit.attributes || {};
        const attributeLabels = {
            bedrooms: "Phòng ngủ",
            bathrooms: "Phòng tắm",
            storeys: "Số tầng xây dựng",
            frontage: "Mặt tiền (m)",
            depth: "Chiều sâu (m)",
            landUse: "Mục đích sử dụng / pháp lý",
            usage: "Mục đích sử dụng",
        };
        const attributeList = document.querySelector("#unitDetailAttributes");
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(unit.type || "");
        if (attributes.bedrooms == null && bedroomMatch)
            attributes.bedrooms = Number(bedroomMatch[1]);
        const visibleAttributes = Object.entries(attributes).filter(
            ([key, value]) =>
                value !== "" && value != null && attributeLabels[key],
        );
        attributeList.replaceChildren(
            ...visibleAttributes.map(([key, value]) => {
                const item = document.createElement("div");
                const term = document.createElement("dt");
                term.textContent = attributeLabels[key];
                const description = document.createElement("dd");
                description.textContent = value;
                item.append(term, description);
                return item;
            }),
        );
        attributeList.hidden = !visibleAttributes.length;
        const badge = document.querySelector("#unitDetailStatus");
        badge.className = `screen-badge ${tone(unit.status)}`;
        badge.textContent = unit.status;
        detailBook.hidden = unit.status !== "Còn bán";
        detailModal.hidden = false;
        document.body.classList.add("modal-open");
        detailModal.querySelector("[data-unit-detail-close]")?.focus();
    }

    function scheduleConsultationFor(unit) {
        if (!unit) return;
        closeDetail();
        const params = new URLSearchParams({
            appointment: "1",
            project: unit.projectCode,
            product: unit.id,
            activity: "Gọi tư vấn",
        });
        location.href = `workflow.html?${params.toString()}#appointments`;
    }

    function updateUnitFormLabels() {
        const group = unitGroup.value || "apartment";
        const apartment = group === "apartment";
        const land = group === "land";
        const house = group === "house";
        unitForm.querySelector('[for="unitTower"]').textContent = apartment
            ? "Tòa nhà"
            : land
              ? "Phân khu / khu vực"
              : "Khu / dãy";
        unitForm.querySelector('[for="unitFloor"]').textContent = "Tầng";
        unitForm.querySelector('[for="unitNumber"]').textContent = apartment
            ? "Số căn hộ"
            : land
              ? "Mã lô đất"
              : house
                ? "Mã căn nhà"
                : "Mã sản phẩm";
        document.querySelector("#unitFloorField").hidden = !apartment;
        unitForm.elements.floor.required = apartment;
        unitForm.elements.floor.disabled = !apartment;
        unitForm.elements.tower.placeholder = apartment
            ? "Ví dụ: A2"
            : land
              ? "Ví dụ: Phân khu B"
              : "Ví dụ: Dãy LK-01";
        unitForm.elements.number.placeholder = apartment
            ? "Ví dụ: 08"
            : land
              ? "Ví dụ: N03-12"
              : house
                ? "Ví dụ: LK-05"
                : "Ví dụ: SP-01";
    }

    function updateUnitModalTitle() {
        const title = document.querySelector("#unitModalTitle");
        if (!title) return;
        if (editingId) {
            title.textContent = `Chỉnh sửa ${units.find((item) => item.id === editingId)?.code || "sản phẩm"}`;
            return;
        }
        title.textContent = `Thêm ${unitForm.elements.type.value || groupLabel(unitGroup.value) || "sản phẩm"}`;
    }

    function openUnit(id = null) {
        closeDetail();
        editingId = id;
        unitForm.reset();
        const unit = units.find((item) => item.id === id);
        const project = projects[unit?.projectCode || projectFilter.value];
        const group = unit
            ? unit.productGroup ||
              window.LandiformCategories?.groupForType(unit.type) ||
              "other"
            : "apartment";
        populateUnitGroupOptions(group);
        const apartment = group === "apartment";
        updateUnitTypeOptions(group, unit?.type || "");
        renderUnitAttributes(group, unit?.attributes || {});
        updateUnitModalTitle();
        deleteButton.hidden =
            !unit || !["Còn bán", "Chưa mở bán"].includes(unit.status);
        if (unit) {
            unitForm.elements.projectCode.value = unit.projectCode;
            for (const field of [
                "address",
                "tower",
                "floor",
                "number",
                "area",
                "price",
                "commissionPercent",
                "status",
            ]) {
                unitForm.elements[field].value = unit[field] ?? "";
            }
            unitForm.elements.type.value = unit.type;
        } else if (projectFilter.value) {
            unitForm.elements.projectCode.value = projectFilter.value;
            if (apartment) {
                unitForm.elements.tower.value = selectedTower;
                unitForm.elements.floor.value = selectedFloor ?? "";
            }
        }
        updateUnitFormLabels();
        unitModal.hidden = false;
        document.body.classList.add("modal-open");
        (unit
            ? unitForm.elements.number
            : apartment && selectedTower
              ? unitForm.elements.number
              : projectFilter.value
                ? unitForm.elements.tower
                : unitForm.elements.projectCode
        ).focus();
    }

    search.addEventListener("input", () => {
        page = 1;
        render();
    });
    projectFilter.addEventListener("change", () => {
        selectedTower = "";
        selectedFloor = null;
        groupFilter.value = "";
        typeFilter.value = "";
        towerFilter.value = "";
        floorFilter.value = "";
        statusFilter.value = "";
        search.value = "";
        listDetails.open = !isApartment(projects[projectFilter.value]);
        page = 1;
        render();
    });
    [typeFilter, towerFilter, floorFilter, statusFilter, groupFilter]
        .filter(Boolean)
        .forEach((select) =>
            select.addEventListener("change", () => {
                if (select === groupFilter) typeFilter.value = "";
                page = 1;
                render();
            }),
        );
    mapTowers.addEventListener("click", (event) => {
        const button = event.target.closest("[data-tower]");
        if (!button) return;
        selectedTower = button.dataset.tower;
        selectedFloor = null;
        renderMap();
    });
    mapFloors.addEventListener("click", (event) => {
        const button = event.target.closest("[data-floor]");
        if (!button) return;
        selectedFloor = Number(button.dataset.floor);
        renderMap();
    });
    mapUnits.addEventListener("click", (event) => {
        const button = event.target.closest("[data-unit-view]");
        if (button) openDetail(button.dataset.unitView);
    });
    function updateBulkPreview() {
        const from = Number(bulkForm.elements.fromFloor.value);
        const to = Number(bulkForm.elements.toFloor.value);
        const perFloor = Number(bulkForm.elements.perFloor.value);
        const count = (to - from + 1) * perFloor;
        const valid = from >= 1 && to >= from && perFloor >= 1 && count <= 500;
        document.querySelector("#bulkPreview").textContent = valid
            ? `Dự kiến tạo ${count.toLocaleString("vi-VN")} căn trong tòa này. Căn đã có sẽ được bỏ qua.`
            : "Chọn khoảng tầng hợp lệ và tối đa 500 căn mỗi lần.";
        bulkForm.querySelector('[type="submit"]').disabled = !valid;
    }
    bulkForm.addEventListener("input", updateBulkPreview);
    bulkForm.addEventListener("change", (event) => {
        if (event.target === bulkForm.elements.projectCode)
            updateBulkTypeOptions();
        updateBulkPreview();
    });
    previous.addEventListener("click", () => {
        if (page > 1) {
            page -= 1;
            render();
        }
    });
    next.addEventListener("click", () => {
        page += 1;
        render();
    });
    document
        .querySelector("[data-unit-add]")
        ?.addEventListener("click", () => openUnit());
    document
        .querySelector("[data-unit-bulk]")
        ?.addEventListener("click", () => {
            bulkForm.reset();
            if (
                [...bulkForm.elements.projectCode.options].some(
                    (option) => option.value === projectFilter.value,
                )
            ) {
                bulkForm.elements.projectCode.value = projectFilter.value;
            }
            if (selectedTower) bulkForm.elements.tower.value = selectedTower;
            if (selectedFloor != null) {
                bulkForm.elements.fromFloor.value = selectedFloor;
                bulkForm.elements.toFloor.value = selectedFloor;
            }
            updateBulkTypeOptions();
            updateBulkPreview();
            bulkModal.hidden = false;
            document.body.classList.add("modal-open");
            bulkForm.elements.tower.focus();
        });
    tbody.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-inventory-delete]");
        if (remove) {
            const unit = units.find(
                (item) => item.id === remove.dataset.inventoryDelete,
            );
            if (
                !unit ||
                !window.confirm(
                    `Xóa sản phẩm “${unit.code}” khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục dữ liệu ví dụ.`,
                )
            )
                return;
            const next = units.filter((item) => item.id !== unit.id);
            if (!inventory.replace(next))
                return notify("Không thể cập nhật danh sách sản phẩm.");
            units = next;
            if (tbody.dataset.staticDemo === "true")
                remove.closest("tr")?.remove();
            render();
            notify("Đã xóa sản phẩm khỏi danh sách hiện tại.");
            return;
        }
        const consultationButton = event.target.closest("[data-unit-consult]");
        if (consultationButton) {
            scheduleConsultationFor(
                units.find(
                    (item) =>
                        item.id === consultationButton.dataset.unitConsult,
                ),
            );
            return;
        }
        const button = event.target.closest("[data-unit-edit]");
        if (button) openUnit(button.dataset.unitEdit);
    });
    document
        .querySelectorAll("[data-unit-close]")
        .forEach((button) =>
            button.addEventListener("click", () => close(unitModal)),
        );
    document
        .querySelectorAll("[data-unit-bulk-close]")
        .forEach((button) =>
            button.addEventListener("click", () => close(bulkModal)),
        );
    document
        .querySelectorAll("[data-unit-detail-close]")
        .forEach((button) => button.addEventListener("click", closeDetail));
    detailEdit.addEventListener("click", () => {
        if (viewingId)
            location.href = `product-detail.html?id=${encodeURIComponent(viewingId)}`;
    });
    detailBook.addEventListener("click", () => {
        if (viewingId)
            scheduleConsultationFor(
                units.find((unit) => unit.id === viewingId),
            );
    });
    detailModal.addEventListener("click", (event) => {
        if (event.target === detailModal) closeDetail();
    });
    for (const modal of [unitModal, bulkModal]) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) close(modal);
        });
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (!unitModal.hidden) close(unitModal);
            if (!bulkModal.hidden) close(bulkModal);
            if (!detailModal.hidden) closeDetail();
        }
    });
    unitForm.elements.number.addEventListener("input", () =>
        unitForm.elements.number.setCustomValidity(""),
    );
    unitGroup.addEventListener("change", () => {
        updateUnitTypeOptions(unitGroup.value);
        renderUnitAttributes(unitGroup.value);
        updateUnitFormLabels();
        updateUnitModalTitle();
    });
    unitForm.elements.type.addEventListener("change", () => {
        updateUnitModalTitle();
    });
    unitForm.elements.projectCode.addEventListener("change", () => {
        updateUnitFormLabels();
    });
    unitForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(unitForm);
        const projectCode = String(values.get("projectCode"));
        const tower = String(values.get("tower")).trim();
        const type = String(values.get("type"));
        const floor = values.get("floor") ? Number(values.get("floor")) : null;
        const number = String(values.get("number")).trim();
        const code =
            floor != null
                ? `${tower} · ${String(floor).padStart(2, "0")}.${number.padStart(2, "0")}`
                : `${tower} · ${number}`;
        if (
            units.some(
                (unit) =>
                    unit.projectCode === projectCode &&
                    unit.code.toLocaleLowerCase("vi") ===
                        code.toLocaleLowerCase("vi") &&
                    unit.id !== editingId,
            )
        ) {
            unitForm.elements.number.setCustomValidity(
                "Mã căn này đã có trong dự án.",
            );
            unitForm.reportValidity();
            return;
        }
        const record = {
            id:
                editingId ||
                `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            projectCode,
            project: projects[projectCode]?.name || "Dự án",
            address: String(values.get("address") || "").trim(),
            tower,
            floor,
            number,
            code,
            type,
            productGroup:
                window.LandiformCategories?.groupForType(type) ||
                unitGroup.value,
            categoryId: window.LandiformCategories?.findByName(type)?.id || "",
            attributes: Object.fromEntries(
                [...values.entries()]
                    .filter(
                        ([key, value]) =>
                            key.startsWith("attribute_") &&
                            String(value).trim() !== "",
                    )
                    .map(([key, value]) => [
                        key.slice("attribute_".length),
                        value,
                    ]),
            ),
            area: Number(values.get("area")),
            price: Number(values.get("price")),
            commissionPercent: Number(values.get("commissionPercent")),
            status: String(values.get("status")),
        };
        const nextUnits = editingId
            ? units.map((unit) => (unit.id === editingId ? record : unit))
            : [...units, record];
        if (!inventory.replace(nextUnits))
            return notify("Không thể lưu sản phẩm trên trình duyệt này.");
        close(unitModal);
        notify(
            wasEditing
                ? "Đã cập nhật sản phẩm."
                : "Đã thêm sản phẩm vào danh mục.",
        );
    });

    deleteButton.addEventListener("click", () => {
        const unit = units.find((item) => item.id === editingId);
        if (
            !unit ||
            !window.confirm(`Xóa sản phẩm ${unit.code} khỏi danh mục?`)
        )
            return;
        if (!inventory.replace(units.filter((item) => item.id !== editingId)))
            return notify("Không thể xóa sản phẩm trên trình duyệt này.");
        close(unitModal);
        notify("Đã xóa sản phẩm khỏi danh mục.");
    });

    bulkForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(bulkForm);
        const projectCode = String(values.get("projectCode"));
        const tower = String(values.get("tower")).trim();
        const fromFloor = Number(values.get("fromFloor"));
        const toFloor = Number(values.get("toFloor"));
        const perFloor = Number(values.get("perFloor"));
        const quantity = (toFloor - fromFloor + 1) * perFloor;
        if (toFloor < fromFloor || quantity > 500) {
            notify("Chọn khoảng tầng hợp lệ và tối đa 500 căn mỗi lần.");
            return;
        }
        const existing = new Set(
            units
                .filter((unit) => unit.projectCode === projectCode)
                .map((unit) => unit.code.toLocaleLowerCase("vi")),
        );
        const generated = [];
        for (let floor = fromFloor; floor <= toFloor; floor += 1) {
            for (let number = 1; number <= perFloor; number += 1) {
                const unitNumber = String(number).padStart(2, "0");
                const code = `${tower} · ${String(floor).padStart(2, "0")}.${unitNumber}`;
                if (existing.has(code.toLocaleLowerCase("vi"))) continue;
                generated.push({
                    id: `unit-${Date.now()}-${floor}-${number}`,
                    projectCode,
                    project: projects[projectCode]?.name || "Dự án",
                    address: String(values.get("address") || "").trim(),
                    tower,
                    floor,
                    number: unitNumber,
                    code,
                    type: String(values.get("type")),
                    area: Number(values.get("area")),
                    price: Number(values.get("price")),
                    commissionPercent: Number(values.get("commissionPercent")),
                    status: "Còn bán",
                });
            }
        }
        if (!generated.length)
            return notify("Các căn trong khoảng này đã có trong danh mục.");
        if (!inventory.replace([...units, ...generated]))
            return notify("Không thể lưu danh sách căn trên trình duyệt này.");
        close(bulkModal);
        notify(`Đã thêm ${generated.length} căn vào dự án.`);
    });

    document.addEventListener("landiform:inventory-updated", () => {
        units = inventory.all();
        render();
    });
    render();
})();

/* --- leads.js --- */
(() => {
    const modal = document.querySelector("#leadModal");
    const form = document.querySelector("#leadForm");
    const tbody = document.querySelector("#leadTableBody");
    if (!modal || !form || !tbody) return;

    const search = document.querySelector('[data-filter="leads"]');
    const filters = [
        [
            document.querySelector("[data-lead-project-filter]"),
            (row, value) => row.dataset.project === value,
        ],
        [
            document.querySelector("[data-lead-source-filter]"),
            (row, value) => row.dataset.source === value,
        ],
        [
            document.querySelector("[data-lead-owner-filter]"),
            (row, value) => row.dataset.owner === value,
        ],
        [
            document.querySelector("[data-lead-status-filter]"),
            (row, value) => row.cells[3]?.textContent.trim() === value,
        ],
    ];

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        tbody.querySelectorAll("tr").forEach((row) => {
            const matchesSearch =
                !query ||
                row.textContent.toLocaleLowerCase("vi").includes(query);
            const matchesFilters = filters.every(([select, matches]) => {
                const value = select?.value || "";
                return !value || matches(row, value);
            });
            row.hidden = !(matchesSearch && matchesFilters);
        });
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    function openModal() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name?.focus();
    }

    search?.addEventListener("input", applyFilters);
    filters.forEach(([select]) =>
        select?.addEventListener("change", applyFilters),
    );
    document
        .querySelector("[data-clear-lead-filters]")
        ?.addEventListener("click", () => {
            if (search) search.value = "";
            filters.forEach(([select]) => {
                if (select) select.selectedIndex = 0;
            });
            applyFilters();
        });

    document
        .querySelector("[data-lead-open]")
        ?.addEventListener("click", openModal);
    document
        .querySelectorAll("[data-lead-close]")
        .forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeModal();
    });
    form.addEventListener("submit", (event) => event.preventDefault());

    if (new URLSearchParams(location.search).get("new") === "1") openModal();
})();

/* --- permissions.js --- */
(() => {
    const roleSelector = document.querySelector("#roleSelector");
    const roleRows = [
        ...document.querySelectorAll("#roleGroupsTableBody tr[data-role-key]"),
    ];
    const editor = document.querySelector("#permissionEditor");
    const list = document.querySelector("#roleGroupsPage");
    const dialog = document.querySelector("#roleCreateDialog");
    const createForm = document.querySelector("#roleCreateForm");
    const statusFilter = document.querySelector("#roleStatusFilter");
    const permissionInputs = [
        ...document.querySelectorAll("[data-permission]"),
    ];
    const groupToggles = [...document.querySelectorAll("[data-group-toggle]")];
    const selectAll = document.querySelector("[data-select-all]");
    const scopeSelect = document.querySelector("#roleScope");
    if (
        !roleSelector ||
        !editor ||
        !list ||
        !dialog ||
        !createForm ||
        !roleRows.length
    )
        return;

    const rowFor = (key) => roleRows.find((row) => row.dataset.roleKey === key);
    const rolePermissionIds = (row) =>
        (row?.dataset.rolePermissions || "").split(/\s+/).filter(Boolean);

    function syncChecks() {
        groupToggles.forEach((toggle) => {
            const inputs = permissionInputs.filter((input) =>
                input.dataset.permission.startsWith(
                    `${toggle.dataset.groupToggle}.`,
                ),
            );
            const checked = inputs.filter((input) => input.checked).length;
            toggle.checked = inputs.length > 0 && checked === inputs.length;
            toggle.indeterminate = checked > 0 && checked < inputs.length;
        });
        const checked = permissionInputs.filter(
            (input) => input.checked,
        ).length;
        selectAll.checked = checked === permissionInputs.length;
        selectAll.indeterminate =
            checked > 0 && checked < permissionInputs.length;
    }

    function showRole(key) {
        const row = rowFor(key);
        if (!row) return;
        roleSelector.value = key;
        const locked = row.dataset.roleLocked === "true";
        const allowed = new Set(rolePermissionIds(row));
        document.querySelector("#selectedRoleColumn").textContent =
            row.querySelector(".role-name-cell strong")?.textContent ||
            "Chức vụ";
        document.querySelector("#selectedRoleDescription").textContent =
            row.querySelector(".role-name-cell small")?.textContent || "";
        document.querySelector("#selectedRoleBadge").textContent =
            scopeSelect.selectedOptions[0]?.textContent || "Toàn doanh nghiệp";
        scopeSelect.value = row.dataset.roleScope || "company";
        scopeSelect.disabled = locked;
        permissionInputs.forEach((input) => {
            input.checked = allowed.has(input.dataset.permission);
            input.disabled = locked;
        });
        groupToggles.forEach((input) => {
            input.disabled = locked;
        });
        selectAll.disabled = locked;
        document.querySelector("[data-permission-save]").disabled = locked;
        document.querySelector("[data-permission-reset]").disabled = locked;
        syncChecks();
    }

    function showEditor(key) {
        showRole(key);
        list.hidden = true;
        editor.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function showList() {
        editor.hidden = true;
        list.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function filterRoles() {
        const state = statusFilter.value;
        roleRows.forEach((row) => {
            row.hidden = state !== "all" && row.dataset.roleStatus !== state;
        });
    }

    roleSelector.addEventListener("change", () => showRole(roleSelector.value));
    scopeSelect.addEventListener("change", () => {
        document.querySelector("#selectedRoleBadge").textContent =
            scopeSelect.selectedOptions[0]?.textContent || "";
    });
    permissionInputs.forEach((input) =>
        input.addEventListener("change", syncChecks),
    );
    groupToggles.forEach((toggle) =>
        toggle.addEventListener("change", () => {
            permissionInputs
                .filter((input) =>
                    input.dataset.permission.startsWith(
                        `${toggle.dataset.groupToggle}.`,
                    ),
                )
                .forEach((input) => {
                    input.checked = toggle.checked;
                });
            syncChecks();
        }),
    );
    selectAll?.addEventListener("change", () => {
        permissionInputs.forEach((input) => {
            input.checked = selectAll.checked;
        });
        syncChecks();
    });
    document
        .querySelector("[data-permission-reset]")
        ?.addEventListener("click", () => showRole(roleSelector.value));
    document
        .querySelector("[data-permission-save]")
        ?.addEventListener("click", () => {
            const row = rowFor(roleSelector.value);
            if (!row || row.dataset.roleLocked === "true") return;
            const selected = permissionInputs
                .filter((input) => input.checked)
                .map((input) => input.dataset.permission);
            row.dataset.rolePermissions = selected.join(" ");
            const count = row.querySelector(".role-rights-pill");
            if (count) count.textContent = `${selected.length} quyền`;
        });

    roleRows.forEach((row) =>
        row
            .querySelector("[data-grant-role]")
            ?.addEventListener("click", () => showEditor(row.dataset.roleKey)),
    );
    document
        .querySelectorAll("[data-open-matrix]")
        .forEach((button) =>
            button.addEventListener("click", () =>
                showEditor(roleSelector.value || "manager"),
            ),
        );
    document
        .querySelectorAll("[data-permission-back]")
        .forEach((button) => button.addEventListener("click", showList));
    statusFilter?.addEventListener("change", filterRoles);
    document
        .querySelectorAll("[data-role-create-open]")
        .forEach((button) =>
            button.addEventListener("click", () => dialog.showModal()),
        );
    document
        .querySelectorAll("[data-role-create-close]")
        .forEach((button) =>
            button.addEventListener("click", () => dialog.close()),
        );
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
    createForm.addEventListener("submit", (event) => event.preventDefault());

    const requestedRole = new URLSearchParams(location.search).get("role");
    roleSelector.value = rowFor(requestedRole) ? requestedRole : "manager";
    showRole(roleSelector.value);
    filterRoles();
    if (new URLSearchParams(location.search).get("new") === "1")
        dialog.showModal();
})();

/* --- product-detail.js --- */
(() => {
    const source = document.querySelector("#productRecordExamples");
    const form = document.querySelector("#productDetailForm");
    const notFound = document.querySelector("#productNotFound");
    const toast = document.querySelector("#toastMessage");
    if (!source || !form || !notFound) return;

    const records = [...source.querySelectorAll("[data-id]")].map((element) => {
        const record = { ...element.dataset };
        for (const [key, value] of Object.entries(record)) {
            if (value === "true") record[key] = true;
            else if (value === "false") record[key] = false;
        }
        return record;
    });
    const id = new URLSearchParams(location.search).get("id");
    const record = records.find((item) => item.id === id);
    if (!record) {
        form.hidden = true;
        notFound.hidden = false;
        return;
    }

    const groupLabels = {
        apartment: "Căn hộ",
        house: "Nhà ở",
        land: "Đất nền & lô đất",
    };
    const setValue = (name, value) => {
        const control = form.querySelector(`[name="${name}"]`);
        if (control && value != null) control.value = value;
    };
    Object.entries(record).forEach(([key, value]) => {
        if (
            ![
                "group",
                "bedrooms",
                "bathrooms",
                "storeys",
                "frontage",
                "depth",
                "legalUse",
            ].includes(key)
        )
            setValue(key, value);
    });
    setValue("address", record.address || "");
    setValue("group", groupLabels[record.group] || groupLabels.apartment);
    document.querySelectorAll("[data-product-group]").forEach((section) => {
        section.hidden = section.dataset.productGroup !== record.group;
    });
    const attributeValue = (name, value) => {
        const control = form.querySelector(
            `[data-product-group="${record.group}"] [name="${name}"]`,
        );
        if (control && value != null) control.value = value;
    };
    [
        "bedrooms",
        "bathrooms",
        "storeys",
        "frontage",
        "depth",
        "legalUse",
    ].forEach((name) => attributeValue(name, record[name]));

    document.querySelector("#productTitle").textContent = record.code;
    document.querySelector("#productSubtitle").textContent =
        `${record.project} · ${record.type}`;
    document.querySelector("#productTypeBadge").textContent =
        groupLabels[record.group] || "Sản phẩm";
    document.querySelector("#summaryCode").textContent = record.code;
    document.querySelector("#summaryProject").textContent = record.project;
    document.querySelector("#summaryGroup").textContent =
        groupLabels[record.group] || "—";
    document.querySelector("#summaryAddress").textContent =
        form.elements.address.value || "Theo địa chỉ dự án";
    document.querySelector("#summaryArea").textContent = record.area
        ? `${record.area} m²`
        : "—";
    document.querySelector("#summaryPrice").textContent = record.price
        ? `${record.price.replace(".", ",")} tỷ`
        : "—";
    document.querySelector("[data-floor-field]").hidden = !record.floor;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const values = new FormData(form);
        const group =
            {
                "Căn hộ": "apartment",
                "Nhà ở": "house",
                "Đất nền & lô đất": "land",
            }[String(values.get("group"))] || record.group;
        const updated = {
            ...record,
            project: String(values.get("project")),
            address: String(values.get("address")),
            group,
            type: String(values.get("type")),
            zone: String(values.get("zone")),
            floor: String(values.get("floor")),
            code: String(values.get("code")),
            area: String(values.get("area")),
            price: String(values.get("price")),
            commission: String(values.get("commission")),
            status: String(values.get("status")),
        };
        [
            "bedrooms",
            "bathrooms",
            "storeys",
            "frontage",
            "depth",
            "legalUse",
        ].forEach((key) => {
            updated[key] = String(values.get(key) || "");
        });
        const units = window.LandiformInventory?.all() || [];
        const match = units.find((unit) => unit.id === id);
        if (match) {
            const next = units.map((unit) =>
                unit.id === id
                    ? {
                          ...unit,
                          address: updated.address,
                          productGroup: group,
                          type: updated.type,
                          tower: updated.zone,
                          floor: Number(updated.floor) || null,
                          code: updated.code,
                          area: Number(updated.area) || 0,
                          price: Number(updated.price) || 0,
                          commissionPercent: Number(updated.commission) || 0,
                          status: updated.status,
                          attributes: Object.fromEntries(
                              [
                                  "bedrooms",
                                  "bathrooms",
                                  "storeys",
                                  "frontage",
                                  "depth",
                                  "legalUse",
                              ]
                                  .filter((key) => updated[key])
                                  .map((key) => [key, updated[key]]),
                          ),
                      }
                    : unit,
            );
            window.LandiformInventory?.replace(next);
        }
        Object.assign(record, updated);
        document.querySelector("#productTitle").textContent = updated.code;
        document.querySelector("#productSubtitle").textContent =
            `${updated.project} · ${updated.type}`;
        document.querySelector("#summaryCode").textContent = updated.code;
        document.querySelector("#summaryAddress").textContent =
            updated.address || "Theo địa chỉ dự án";
        document.querySelector("#summaryArea").textContent = updated.area
            ? `${updated.area} m²`
            : "—";
        document.querySelector("#summaryPrice").textContent = updated.price
            ? `${updated.price.replace(".", ",")} tỷ`
            : "—";
        if (toast) {
            toast.textContent =
                "Đã cập nhật trên bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
        }
    });
})();

/* --- projects.js --- */
(() => {
    const tableBody = document.querySelector("#projectTableBody");
    const detailPage = document.querySelector("#projectDetailPage");
    const createModal = document.querySelector("#projectCreateModal");
    const editModal = document.querySelector("#projectEditModal");
    const profiles = [...document.querySelectorAll("[data-project-detail]")];
    if (!tableBody && !detailPage) return;

    function filterProjects() {
        if (!tableBody) return;
        const query =
            document
                .querySelector('[data-filter="projects"]')
                ?.value.trim()
                .toLocaleLowerCase("vi") || "";
        const type = document.querySelector("#projectTypeFilter")?.value || "";
        const status =
            document.querySelector("#projectStatusFilter")?.value ||
            "Tất cả trạng thái";
        let visible = 0;
        tableBody.querySelectorAll("tr[data-project-code]").forEach((row) => {
            const matches =
                (!query ||
                    row.textContent.toLocaleLowerCase("vi").includes(query)) &&
                (!type || row.cells[1]?.textContent.split(" · ")[0] === type) &&
                (status === "Tất cả trạng thái" ||
                    row.cells[3]?.textContent.trim() === status);
            row.hidden = !matches;
            if (matches) visible += 1;
        });
        const empty = tableBody.querySelector("[data-project-empty]");
        if (empty) empty.hidden = visible > 0;
    }

    function setModal(modal, open) {
        if (!modal) return;
        modal.hidden = !open;
        document.body.classList.toggle("modal-open", open);
        if (open)
            modal.querySelector("input:not([type=hidden]), select")?.focus();
    }

    if (tableBody) {
        document
            .querySelector('[data-filter="projects"]')
            ?.addEventListener("input", filterProjects);
        document
            .querySelectorAll("#projectTypeFilter, #projectStatusFilter")
            .forEach((select) =>
                select.addEventListener("change", filterProjects),
            );
        document
            .querySelector("[data-project-create]")
            ?.addEventListener("click", () => setModal(createModal, true));
        tableBody.addEventListener("click", (event) => {
            if (event.target.closest("[data-project-row-delete]"))
                event.preventDefault();
        });
        filterProjects();
    }

    document
        .querySelectorAll("[data-project-modal-close]")
        .forEach((button) =>
            button.addEventListener("click", () =>
                setModal(button.closest(".modal-backdrop"), false),
            ),
        );
    [createModal, editModal].forEach((modal) =>
        modal?.addEventListener("click", (event) => {
            if (event.target === modal) setModal(modal, false);
        }),
    );
    document
        .querySelectorAll("#projectCreateForm, #projectEditForm")
        .forEach((form) =>
            form.addEventListener("submit", (event) => event.preventDefault()),
        );

    if (!detailPage) return;
    const code = new URLSearchParams(location.search).get("code") || "AP-026";
    const selected = profiles.find(
        (profile) => profile.dataset.projectDetail === code,
    );
    if (!selected) {
        detailPage.classList.add("is-not-found");
        const missing = document.querySelector("#projectNotFound");
        if (missing) missing.hidden = false;
        return;
    }
    profiles.forEach((profile) => {
        profile.hidden = profile !== selected;
    });
    const editButton = document.querySelector("[data-project-edit]");
    editButton?.addEventListener("click", () => {
        const form = document.querySelector("#projectEditForm");
        const facts = selected.querySelectorAll(".project-profile-facts dd");
        if (form) {
            form.elements.name.value =
                selected
                    .querySelector(".project-detail-page-title h2")
                    ?.textContent.trim() || "";
            form.elements.area.value = facts[1]?.textContent.trim() || "";
            form.elements.address.value = facts[2]?.textContent.trim() || "";
            form.elements.status.value =
                selected.querySelector(".screen-badge")?.textContent.trim() ||
                "Đang mở bán";
        }
        setModal(editModal, true);
    });
    document
        .querySelector("[data-project-delete]")
        ?.addEventListener("click", (event) => event.preventDefault());
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape")
            [createModal, editModal].forEach((modal) => {
                if (modal && !modal.hidden) setModal(modal, false);
            });
    });
})();

/* --- record-detail.js --- */
(() => {
    const source = document.querySelector("#recordExamples");
    const form = document.querySelector("#recordDetailForm");
    const notFound = document.querySelector("#recordNotFound");
    if (!source || !form || !notFound) return;
    const records = [...source.querySelectorAll("[data-type][data-id]")].map(
        (element) => {
            const record = { ...element.dataset };
            for (const [key, value] of Object.entries(record)) {
                if (value === "true") record[key] = true;
                else if (value === "false") record[key] = false;
            }
            return record;
        },
    );
    const params = new URLSearchParams(location.search);
    const kind = params.get("type");
    const id = params.get("id");
    let record = records.find((item) => item.type === kind && item.id === id);
    if (
        !record &&
        ["buyer", "appointment"].includes(kind) &&
        (params.has("name") || params.has("customer"))
    ) {
        record = Object.fromEntries(params.entries());
    }
    const schemaNode = [
        ...document.querySelectorAll("#recordSchemas [data-type]"),
    ].find((item) => item.dataset.type === kind);
    const schema = schemaNode
        ? {
              ...schemaNode.dataset,
              fields: [
                  ...schemaNode.querySelectorAll("[data-record-field]"),
              ].map((field) => ({
                  key: field.dataset.recordField,
                  label: field.dataset.label,
                  type: field.dataset.control,
                  readonly: field.dataset.readonly === "true",
                  options: [...field.querySelectorAll("option")].map(
                      (option) => option.value,
                  ),
              })),
              checks: [
                  ...schemaNode.querySelectorAll("[data-record-check]"),
              ].map((field) => ({
                  key: field.dataset.recordCheck,
                  label: field.dataset.label,
              })),
              facts: (schemaNode.dataset.facts || "")
                  .split(/\s+/)
                  .filter(Boolean),
          }
        : null;
    if (!record || !schema) {
        form.hidden = true;
        notFound.hidden = false;
        notFound.querySelector("#recordNotFoundLink").href =
            schema?.back || "../index.html";
        return;
    }
    const fields = document.querySelector("#recordFields");
    const checks = document.querySelector("#recordChecks");
    const makeField = ({ key: name, label, type, options, readonly }) => {
        const wrapper = document.createElement("label");
        wrapper.className = "field";
        const caption = document.createElement("span");
        caption.textContent = label;
        const control =
            type === "select"
                ? document.createElement("select")
                : document.createElement("input");
        control.name = name;
        if (type !== "select") control.type = type;
        if (readonly) control.readOnly = true;
        if (type === "select") {
            options.forEach((option) =>
                control.add(new Option(option, option)),
            );
            if (
                record[name] &&
                ![...control.options].some(
                    (option) => option.value === record[name],
                )
            ) {
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
        schema.checks.forEach(({ key: name, label }) => {
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
    const titleValue =
        record.name || record.code || record.customer || record.id;
    document.title = `${titleValue} | LANDIFORM`;
    document.querySelector("#recordEyebrow").textContent = schema.eyebrow;
    document.querySelector("#recordTitle").textContent = titleValue;
    document.querySelector("#recordSubtitle").textContent =
        `${schema.label} · ${record.project || record.parent || "LANDIFORM"}`;
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
        const definition = schema.fields.find((field) => field.key === key);
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
        if (!form.reportValidity()) return;
        const values = new FormData(form);
        const name =
            values.get("name") ||
            values.get("title") ||
            values.get("customer") ||
            values.get("code");
        if (name) {
            document.querySelector("#recordTitle").textContent = String(name);
            document.querySelector("#recordSummaryTitle").textContent =
                String(name);
        }
        const toast = document.querySelector("#toastMessage");
        if (toast) {
            toast.textContent =
                "Đã mô phỏng cập nhật hồ sơ. Tải lại trang để khôi phục dữ liệu mẫu.";
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
        }
    });
})();

/* --- searchable-customer-select.js --- */
(() => {
    const pickers = [
        ...document.querySelectorAll(".searchable-customer-picker"),
    ];
    if (!pickers.length) return;

    function bind(picker) {
        const input = picker.querySelector("[role='combobox']");
        const select = picker.querySelector("select");
        const list = picker.querySelector("[role='listbox']");
        if (!input || !select || !list) return;
        let hasQuery = false;

        function selectedLabel() {
            return select.value
                ? select.selectedOptions[0]?.textContent.trim() || ""
                : "";
        }

        function sync(open = false) {
            const selectedValue = select.value;
            const label = selectedLabel();
            const query =
                hasQuery && !(selectedValue && input.value === label)
                    ? input.value.trim().toLocaleLowerCase("vi")
                    : "";
            const options = [...select.options].filter(
                (option) =>
                    (option.value === "" && !query) ||
                    (Boolean(query) &&
                        `${option.textContent} ${option.dataset.phone || ""}`
                            .toLocaleLowerCase("vi")
                            .includes(query)),
            );

            list.replaceChildren(
                ...options.map((option) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "appointment-customer-option";
                    button.id = `${list.id}-option-${[...select.options].indexOf(option)}`;
                    button.setAttribute("role", "option");
                    button.setAttribute(
                        "aria-selected",
                        String(option.value === selectedValue),
                    );
                    button.dataset.optionValue = option.value;
                    button.dataset.optionIndex = String(
                        [...select.options].indexOf(option),
                    );
                    button.textContent = option.textContent.trim();
                    if (option.dataset.phone) {
                        const phone = document.createElement("small");
                        phone.textContent = option.dataset.phone;
                        button.append(phone);
                    }
                    return button;
                }),
            );
            if (!options.length) {
                const empty = document.createElement("div");
                empty.className = "appointment-customer-empty";
                empty.textContent = "Không tìm thấy khách hàng phù hợp.";
                list.append(empty);
            }
            list.hidden = !open;
            input.setAttribute("aria-expanded", String(open));
            if (!open) input.removeAttribute("aria-activedescendant");
        }

        function choose(option) {
            if (!option) return;
            select.selectedIndex = Number(option.dataset.optionIndex);
            input.value = selectedLabel();
            input.setCustomValidity("");
            select.dispatchEvent(new Event("change", { bubbles: true }));
            sync(false);
        }

        list.addEventListener("click", (event) => {
            const option = event.target.closest("[data-option-index]");
            if (option) choose(option);
        });
        input.addEventListener("focus", () => {
            hasQuery = false;
            input.select();
            sync(true);
        });
        input.addEventListener("input", () => {
            hasQuery = true;
            if (select.value && input.value !== selectedLabel())
                select.value = "";
            input.setCustomValidity("");
            sync(true);
        });
        input.addEventListener("keydown", (event) => {
            const options = [...list.querySelectorAll("[data-option-index]")];
            const active = options.findIndex(
                (option) => option.getAttribute("aria-selected") === "true",
            );
            if (event.key === "Escape") {
                sync(false);
                return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!options.length) return;
                const next =
                    event.key === "ArrowDown"
                        ? Math.min(
                              active < 0 ? 0 : active + 1,
                              options.length - 1,
                          )
                        : Math.max(
                              active < 0 ? options.length - 1 : active - 1,
                              0,
                          );
                options.forEach((option, index) =>
                    option.setAttribute(
                        "aria-selected",
                        String(index === next),
                    ),
                );
                input.setAttribute("aria-activedescendant", options[next].id);
                options[next].scrollIntoView({ block: "nearest" });
                return;
            }
            if (event.key === "Enter" && !list.hidden) {
                const option = options[active] || options[0];
                if (option) {
                    event.preventDefault();
                    choose(option);
                }
            }
        });
        select.addEventListener("change", () => {
            input.value = selectedLabel();
            sync(false);
        });
        select.form?.addEventListener("reset", () =>
            setTimeout(() => {
                input.value = selectedLabel();
                sync(false);
            }),
        );
        new MutationObserver(() => sync(!list.hidden)).observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
        });
        sync(false);
    }

    pickers.forEach(bind);
    document.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".searchable-customer-picker")) return;
        pickers.forEach((picker) => {
            const input = picker.querySelector("[role='combobox']");
            const list = picker.querySelector("[role='listbox']");
            if (input && list) {
                list.hidden = true;
                input.setAttribute("aria-expanded", "false");
                input.removeAttribute("aria-activedescendant");
            }
        });
    });
})();

/* --- settings.js --- */
(() => {
    const fields = [...document.querySelectorAll("[data-setting]")];
    const articleBodySource = document.querySelector(
        ".about-article-body-input",
    );
    const aboutFields = [
        ...document.querySelectorAll("[data-about-setting]"),
    ].filter((field) => field !== articleBodySource);
    const customerSiteFields = [
        ...document.querySelectorAll("[data-customer-site-setting]"),
    ];
    const saveButton = document.querySelector('[data-action="save-settings"]');
    const logoField = document.querySelector("#companyLogo");
    const aboutCoverFile = document.querySelector("#aboutCoverFile");
    const aboutCoverField = document.querySelector('[name="aboutCoverImage"]');
    const aboutCoverFileName = document.querySelector("#aboutCoverFileName");
    const aboutCoverPreview = document.querySelector("#aboutCoverPreview");
    const logoImage = document.querySelector("#companyLogoImage");
    const logoInitials = document.querySelector("#companyLogoInitials");
    const previewName = document.querySelector("#companyPreviewName");
    const removeLogoButton = document.querySelector("[data-logo-remove]");
    const toast = document.querySelector("#toastMessage");
    const branchEditorList = document.querySelector("#branchEditorList");
    const addBranchButton = document.querySelector("#addBranchButton");
    const branchTemplate = document.querySelector("#branchEditorTemplate");
    if (
        !fields.length ||
        !saveButton ||
        !logoField ||
        !logoImage ||
        !logoInitials
    )
        return;

    const systemLogo = "../../website/assets/logo.png";
    let logoData = "";
        let articleEditor;

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    function bodyToHtml(value) {
        const source = String(value || "");
        if (
            /<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|b|em|i|a|img|table|div)\b/i.test(
                source,
            )
        )
            return source;
        const wrapper = document.createElement("div");
        source
            .trim()
            .split(/\n\s*\n/)
            .filter(Boolean)
            .forEach((block) => {
                const lines = block
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);
                if (lines[0]?.startsWith("## ")) {
                    const heading = document.createElement("h3");
                    appendInlineMarkdown(
                        heading,
                        lines.join(" ").replace(/^##\s*/, ""),
                    );
                    wrapper.append(heading);
                } else if (lines.every((line) => line.startsWith("- "))) {
                    const list = document.createElement("ul");
                    lines.forEach((line) => {
                        const item = document.createElement("li");
                        appendInlineMarkdown(item, line.replace(/^-\s*/, ""));
                        list.append(item);
                    });
                    wrapper.append(list);
                } else if (lines[0]?.startsWith("> ")) {
                    const quote = document.createElement("blockquote");
                    appendInlineMarkdown(
                        quote,
                        lines
                            .map((line) => line.replace(/^>\s*/, ""))
                            .join(" "),
                    );
                    wrapper.append(quote);
                } else {
                    const paragraph = document.createElement("p");
                    appendInlineMarkdown(paragraph, lines.join(" "));
                    wrapper.append(paragraph);
                }
            });
        return wrapper.innerHTML || "<p></p>";
    }

    function initializeTinyMce() {
        if (!articleBodySource || !window.tinymce) return;
        window.tinymce
            .init({
                selector: "#aboutBody",
                height: 500,
                menubar: false,
                plugins:
                    "advlist autolink lists link image charmap preview anchor searchreplace wordcount visualblocks code fullscreen media table directionality emoticons",
                toolbar:
                    "undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code",
                toolbar_mode: "sliding",
                relative_urls: false,
                convert_urls: false,
                image_caption: true,
                content_style:
                    "body { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #435d70; } h2,h3 { color: #173c56; }",
                setup(editor) {
                    articleEditor = editor;
                    editor.on("change keyup undo redo", () => editor.save());
                },
            })
            .catch(() =>
                notify(
                    "Không tải được TinyMCE. Hãy kiểm tra kết nối mạng rồi tải lại trang.",
                ),
            );
    }

    function appendInlineMarkdown(parent, value) {
        String(value)
            .split(/(\*\*[^*]+\*\*)/g)
            .forEach((piece) => {
                if (piece.startsWith("**") && piece.endsWith("**")) {
                    const strong = document.createElement("strong");
                    strong.textContent = piece.slice(2, -2);
                    parent.append(strong);
                } else parent.append(document.createTextNode(piece));
            });
    }

    function initials(name) {
        return (
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(-2)
                .map((word) => word[0]?.toUpperCase() || "")
                .join("") || "DN"
        );
    }

    function updatePreview() {
        const displayName =
            document.querySelector('[name="displayName"]')?.value.trim() ||
            "Doanh nghiệp";
        if (previewName) previewName.textContent = displayName;
        logoInitials.textContent = initials(displayName);
        logoImage.hidden = false;
        logoInitials.hidden = true;
        logoImage.src = logoData || systemLogo;
    }

    logoImage.addEventListener("error", () => {
        logoImage.hidden = true;
        logoInitials.hidden = false;
    });

    function collectBranches() {
        const cards = [
            ...branchEditorList.querySelectorAll(".branch-editor-card"),
        ];
        const result = cards.map((card) => {
            const values = Object.fromEntries(
                [...card.querySelectorAll("[data-branch-field]")].map(
                    (input) => [input.dataset.branchField, input.value.trim()],
                ),
            );
            return {
                id: card.dataset.branchId,
                ...values,
                isDefault: Boolean(
                    card.querySelector('input[name="defaultBranchId"]')
                        ?.checked,
                ),
            };
        });
        return result;
    }

    initializeTinyMce();
    updatePreview();

    function renderAboutCoverPreview() {
        if (!aboutCoverPreview) return;
        const src = aboutCoverField?.value.trim();
        if (!src) {
            aboutCoverPreview.replaceChildren(
                Object.assign(document.createElement("i"), {
                    className: "fa-regular fa-image",
                    "aria-hidden": "true",
                }),
                Object.assign(document.createElement("span"), {
                    textContent: "Xem trước ảnh bìa",
                }),
            );
            return;
        }
        const image = document.createElement("img");
        image.src = src;
        image.alt =
            document.querySelector('[name="aboutCoverAlt"]')?.value.trim() ||
            "Ảnh bìa bài viết";
        image.addEventListener(
            "error",
            () => {
                aboutCoverPreview.replaceChildren(
                    Object.assign(document.createElement("i"), {
                        className: "fa-solid fa-triangle-exclamation",
                        "aria-hidden": "true",
                    }),
                    Object.assign(document.createElement("span"), {
                        textContent: "Không thể hiển thị ảnh đã chọn.",
                    }),
                );
            },
            { once: true },
        );
        aboutCoverPreview.replaceChildren(image);
    }

    renderAboutCoverPreview();
    aboutCoverFile?.addEventListener("change", () => {
        const file = aboutCoverFile.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            aboutCoverFile.value = "";
            notify("Vui lòng chọn tệp hình ảnh.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            aboutCoverFile.value = "";
            notify("Ảnh bìa cần có dung lượng nhỏ hơn 8 MB.");
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            aboutCoverField.value =
                typeof reader.result === "string" ? reader.result : "";
            aboutCoverFileName.textContent = `Đã chọn: ${file.name}`;
            renderAboutCoverPreview();
        });
        reader.addEventListener(
            "error",
            () => notify("Không thể đọc tệp ảnh này."),
            { once: true },
        );
        reader.readAsDataURL(file);
    });

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            field.setCustomValidity("");
            if (field.name === "displayName") updatePreview();
        });
    });
    aboutFields.forEach((field) =>
        field.addEventListener("input", () => field.setCustomValidity("")),
    );
    customerSiteFields.forEach((field) =>
        field.addEventListener("input", () => field.setCustomValidity("")),
    );
    addBranchButton?.addEventListener("click", () => {
        if (!branchEditorList || !branchTemplate) return;
        const id = `branch-${Date.now()}`;
        const fragment = branchTemplate.content.cloneNode(true);
        const card = fragment.querySelector(".branch-editor-card");
        card.dataset.branchId = id;
        const radio = card.querySelector('input[name="defaultBranchId"]');
        radio.value = id;
        radio.checked = !branchEditorList.querySelector(
            'input[name="defaultBranchId"]:checked',
        );
        const remove = card.querySelector("[data-remove-branch]");
        remove.dataset.removeBranch = id;
        card.querySelector('[data-branch-field="address"]').placeholder =
            "Số nhà, đường, phường/xã...";
        branchEditorList.append(fragment);
        branchEditorList
            .querySelectorAll(".branch-remove-button")
            .forEach((button) => {
                button.disabled = false;
            });
        branchEditorList.lastElementChild
            ?.querySelector('[data-branch-field="name"]')
            ?.focus();
    });
    branchEditorList?.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-branch]");
        if (
            !removeButton ||
            branchEditorList.querySelectorAll(".branch-editor-card").length <= 1
        )
            return;
        const wasDefault = removeButton
            .closest(".branch-editor-card")
            ?.querySelector('input[name="defaultBranchId"]')?.checked;
        removeButton.closest(".branch-editor-card")?.remove();
        const cards = [
            ...branchEditorList.querySelectorAll(".branch-editor-card"),
        ];
        branchEditorList
            .querySelectorAll(".branch-remove-button")
            .forEach((button) => {
                button.disabled = cards.length <= 1;
            });
        if (wasDefault)
            cards[0]?.querySelector('input[name="defaultBranchId"]')?.click();
    });
    branchEditorList?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="defaultBranchId"]')) {
            const card = event.target.closest(".branch-editor-card");
            const address = card?.querySelector(
                '[data-branch-field="address"]',
            );
            if (address) {
                address.required = !event.target.checked;
                address.placeholder = event.target.checked
                    ? "Để trống nếu dùng địa chỉ trụ sở chính"
                    : "Số nhà, đường, phường/xã...";
            }
        }
    });

    logoField.addEventListener("change", () => {
        const file = logoField.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            logoField.value = "";
            notify("Logo cần có dung lượng nhỏ hơn 1 MB.");
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            logoData = typeof reader.result === "string" ? reader.result : "";
            updatePreview();
        });
        reader.readAsDataURL(file);
    });

    removeLogoButton?.addEventListener("click", () => {
        logoData = "";
        logoField.value = "";
        updatePreview();
    });

    saveButton.addEventListener("click", () => {
        const invalidField = fields.find(
            (field) => !field.checkValidity() || !field.value.trim(),
        );
        if (invalidField) {
            invalidField.setCustomValidity(
                invalidField.value.trim()
                    ? invalidField.validationMessage
                    : "Vui lòng điền thông tin này.",
            );
            invalidField.reportValidity();
            invalidField.focus();
            return;
        }
        const invalidArticleField = aboutFields.find(
            (field) =>
                !field.checkValidity() ||
                (field.required && !field.value.trim()),
        );
        if (invalidArticleField) {
            invalidArticleField.setCustomValidity(
                invalidArticleField.validity.typeMismatch
                    ? "Vui lòng nhập một liên kết ảnh hợp lệ."
                    : "Vui lòng điền nội dung bài viết này.",
            );
            invalidArticleField.reportValidity();
            invalidArticleField.focus();
            return;
        }
        const articleBody = articleEditor
            ? articleEditor.getContent().trim()
            : articleBodySource?.value.trim() || "";
        if (!articleBody) {
            articleEditor?.setAttribute("aria-invalid", "true");
            articleEditor?.focus();
            notify("Vui lòng nhập nội dung bài viết.");
            return;
        }
        const invalidSiteField = customerSiteFields.find(
            (field) =>
                !field.checkValidity() ||
                (field.required && !field.value.trim()),
        );
        if (invalidSiteField) {
            invalidSiteField.setCustomValidity(
                "Vui lòng nhập nội dung trang chủ.",
            );
            invalidSiteField.reportValidity();
            invalidSiteField.focus();
            return;
        }
        const branchCard = [
            ...branchEditorList.querySelectorAll(".branch-editor-card"),
        ].find((card) =>
            [...card.querySelectorAll("[data-branch-field]")].some(
                (input) =>
                    !input.checkValidity() ||
                    (input.required && !input.value.trim()),
            ),
        );
        if (branchCard) {
            const invalidBranchField = [
                ...branchCard.querySelectorAll("[data-branch-field]"),
            ].find(
                (input) =>
                    !input.checkValidity() ||
                    (input.required && !input.value.trim()),
            );
            invalidBranchField?.reportValidity();
            invalidBranchField?.focus();
            return;
        }
        const taxCode = document.querySelector('[name="taxCode"]');
        if (taxCode && !/^\d{10}(\d{3})?$/.test(taxCode.value.trim())) {
            taxCode.setCustomValidity("Mã số thuế gồm 10 hoặc 13 chữ số.");
            taxCode.reportValidity();
            taxCode.focus();
            return;
        }
        const values = Object.fromEntries(
            fields.map((field) => [field.name, field.value.trim()]),
        );
        const article = {
            title: document.querySelector('[name="aboutTitle"]').value.trim(),
            intro: document.querySelector('[name="aboutIntro"]').value.trim(),
            coverImage: document
                .querySelector('[name="aboutCoverImage"]')
                .value.trim(),
            coverAlt: document
                .querySelector('[name="aboutCoverAlt"]')
                .value.trim(),
            caption: document
                .querySelector('[name="aboutCoverCaption"]')
                .value.trim(),
            body: articleBody,
            bodyHtml: articleBody,
        };
        const siteValues = {
            heroTitle: document
                .querySelector('[name="siteHeroTitle"]')
                .value.trim(),
            heroDescription: document
                .querySelector('[name="siteHeroDescription"]')
                .value.trim(),
        };
        const savedBranches = collectBranches();
        const defaultId = branchEditorList.querySelector(
            'input[name="defaultBranchId"]:checked',
        )?.value;
        savedBranches.forEach((branch) => {
            branch.isDefault = branch.id === defaultId;
            if (branch.isDefault)
                ["address", "phone", "email"].forEach((key) => {
                    if (branch[key] === values[key]) branch[key] = "";
                });
        });
        document.querySelectorAll("[data-brand-name]").forEach((node) => {
            node.textContent = values.displayName || node.textContent;
        });
        document.querySelectorAll("[data-brand-logo]").forEach((image) => {
            if (!logoData) return;
            image.src = logoData;
            image.hidden = false;
        });
        notify(
            "Đã cập nhật phần xem trước. Thay đổi chỉ tồn tại trong trang này và mất khi tải lại.",
        );
    });
})();

/* --- staff-detail.js --- */
(() => {
    const staffId = new URLSearchParams(location.search).get("id");
    const detail = document.querySelector("#staffDetailContent");
    const notFound = document.querySelector("#staffDetailNotFound");
    const profileForm = document.querySelector("#staffDetailForm");
    const passwordForm = document.querySelector("#staffPasswordForm");
    const roleSelect = document.querySelector("#staffDetailRole");
    const groupSelect = document.querySelector("#staffDetailGroupSelect");
    const toast = document.querySelector("#toastMessage");
    if (
        !detail ||
        !notFound ||
        !profileForm ||
        !passwordForm ||
        !roleSelect ||
        !groupSelect
    )
        return;

    const roles = Object.fromEntries(
        [...document.querySelectorAll("#staffRoleExamples [data-key]")].map(
            (element) => {
                const data = element.dataset;
                return [
                    data.key,
                    {
                        name: data.name,
                        group: data.group,
                        status: data.status,
                        locked: data.locked === "true",
                        permissions: data.permissions
                            ? data.permissions.split(/\s+/)
                            : [],
                    },
                ];
            },
        ),
    );
    let people = [];
    let person = null;

    function notify(message) {
        window.LandiformAdminUI.notify(toast, message, 3200);
    }

    function loadData() {
        people = [
            ...document.querySelectorAll("#staffRecordExamples [data-id]"),
        ].map((element) => ({
            ...element.dataset,
            loginAllowed: element.dataset.loginAllowed === "true",
        }));
        person = people.find((item) => item.id === staffId) || null;
    }

    function getScopes(record) {
        const raw = Array.isArray(record.scopes)
            ? record.scopes
            : Array.isArray(record.scope)
              ? record.scope
              : [record.scope || "Toàn doanh nghiệp"];
        const scopes = [
            ...new Set(
                raw
                    .flatMap((value) =>
                        String(value || "").split(/\s*[·,;]\s*/),
                    )
                    .filter(Boolean),
            ),
        ];
        return scopes.includes("Toàn doanh nghiệp")
            ? ["Toàn doanh nghiệp"]
            : scopes;
    }

    function scopePicker() {
        return document.querySelector("#staffDetailScopeOptions");
    }

    function syncScopePicker(checkedInput) {
        const picker = scopePicker();
        if (!picker || !checkedInput) return;
        const inputs = [
            ...picker.querySelectorAll('input[name="staffDetailScopeOptions"]'),
        ];
        const all = inputs.find((input) => input.value === "Toàn doanh nghiệp");
        const projects = inputs.filter((input) => input !== all);
        if (checkedInput === all) {
            projects.forEach((input) => {
                input.checked = all.checked;
            });
            return;
        }
        if (all)
            all.checked =
                projects.length > 0 && projects.every((input) => input.checked);
    }

    function setScopes(scopes) {
        const picker = scopePicker();
        if (!picker) return;
        const selected = scopes.length ? scopes : ["Toàn doanh nghiệp"];
        const allSelected = selected.includes("Toàn doanh nghiệp");
        [
            ...picker.querySelectorAll('input[name="staffDetailScopeOptions"]'),
        ].forEach((input) => {
            input.checked = allSelected || selected.includes(input.value);
        });
    }

    function selectedScopes() {
        return [
            ...(scopePicker()?.querySelectorAll(
                'input[name="staffDetailScopeOptions"]:checked',
            ) || []),
        ].map((input) => input.value);
    }

    function populateRoles(group, selected = "") {
        const list = Object.entries(roles)
            .filter(
                ([id, role]) =>
                    role.group === group &&
                    (role.status !== "inactive" || id === selected),
            )
            .sort((a, b) => a[1].name.localeCompare(b[1].name, "vi"));
        roleSelect.replaceChildren(
            new Option(list.length ? "Chọn chức vụ" : "Chưa có chức vụ", ""),
        );
        list.forEach(([id, role]) => roleSelect.add(new Option(role.name, id)));
        if (selected && list.some(([id]) => id === selected))
            roleSelect.value = selected;
    }

    const permissionLabels = {
        "projects.view": "Xem dự án",
        "projects.edit": "Sửa dự án",
        "products.view": "Xem sản phẩm",
        "products.edit": "Sửa sản phẩm",
        "customers.view": "Xem khách hàng",
        "customers.create": "Thêm khách hàng",
        "customers.edit": "Sửa khách hàng",
        "work.view": "Xem công việc & lịch hẹn",
        "work.edit": "Quản lý công việc & lịch hẹn",
        "transactions.view": "Xem giao dịch",
        "reports.view": "Xem báo cáo",
        "team.view": "Xem đội ngũ",
        "team.edit": "Quản lý đội ngũ",
        "settings.edit": "Sửa thiết lập",
    };

    function renderPermissionSummary(roleId) {
        const role = roles[roleId] || {};
        const list = document.querySelector("#staffDetailPermissionList");
        document.querySelector("#staffDetailPermissionRole").textContent =
            role.name || "Chức vụ chưa được chọn";
        document.querySelector("#staffDetailPermissionLink").href =
            `permissions.html?role=${encodeURIComponent(roleId || "")}`;
        list.replaceChildren();
        if (role.locked) {
            document.querySelector(
                "#staffDetailPermissionSummary",
            ).textContent = "Chức vụ quản trị có toàn quyền trong hệ thống.";
            const item = document.createElement("span");
            item.className = "staff-permission-chip is-full";
            item.textContent = "Toàn quyền quản trị";
            list.append(item);
            return;
        }
        const permissions = Array.isArray(role.permissions)
            ? role.permissions
            : [];
        document.querySelector("#staffDetailPermissionSummary").textContent =
            permissions.length
                ? `${permissions.length} quyền được cấp theo chức vụ này.`
                : "Chức vụ chưa được cấu hình quyền chi tiết.";
        permissions.slice(0, 8).forEach((permission) => {
            const chip = document.createElement("span");
            chip.className = "staff-permission-chip";
            chip.textContent = permissionLabels[permission] || permission;
            list.append(chip);
        });
        if (!permissions.length) {
            const item = document.createElement("span");
            item.className = "staff-permission-chip is-muted";
            item.textContent = "Chưa thiết lập quyền";
            list.append(item);
        }
    }

    function render() {
        if (!person || person.accountType === "customer") {
            detail.hidden = true;
            notFound.hidden = false;
            return;
        }
        detail.hidden = false;
        notFound.hidden = true;
        const roleId =
            person.roleId ||
            Object.keys(roles).find((id) => roles[id].name === person.role) ||
            "advisor";
        const group = roles[roleId]?.group || person.accountType || "employee";
        const teamHref = `team.html?type=${group}`;
        document.querySelector("#staffDetailBack").href = teamHref;
        document.querySelector("#staffDetailCancel").href = teamHref;
        const employeeNav = document.querySelector("#staffEmployeeNav");
        const managementNav = document.querySelector("#staffManagementNav");
        employeeNav.classList.toggle("is-active", group === "employee");
        managementNav.classList.toggle("is-active", group === "management");
        if (group === "employee")
            employeeNav.setAttribute("aria-current", "page");
        else employeeNav.removeAttribute("aria-current");
        if (group === "management")
            managementNav.setAttribute("aria-current", "page");
        else managementNav.removeAttribute("aria-current");
        const displayName = person.name || "Nhân viên";
        document.title = `${displayName} | LANDIFORM`;
        document.querySelector("#staffDetailName").textContent = displayName;
        document.querySelector("#staffDetailBreadcrumb").textContent =
            displayName;
        document.querySelector("#staffDetailSubtitle").textContent =
            `${person.email || "Chưa có email"} · ${person.phone || "Chưa có số điện thoại"}`;
        const status = document.querySelector("#staffDetailStatus");
        status.textContent = person.status || "Đang hoạt động";
        status.className = `screen-badge ${person.status === "Tạm ngưng" ? "neutral" : "green"}`;
        const scopes = getScopes(person);
        profileForm.elements.name.value = person.name || "";
        profileForm.elements.email.value = person.email || "";
        profileForm.elements.phone.value = person.phone || "";
        groupSelect.value = group;
        populateRoles(group, roleId);
        setScopes(scopes);
        profileForm.elements.status.value = person.status || "Đang hoạt động";
        profileForm.elements.loginAllowed.checked =
            person.loginAllowed !== false;
        renderPermissionSummary(roleId);
    }

    function hex(bytes) {
        return [...bytes]
            .map((value) => value.toString(16).padStart(2, "0"))
            .join("");
    }

    groupSelect.addEventListener("change", () => {
        populateRoles(groupSelect.value);
        renderPermissionSummary(roleSelect.value);
    });
    roleSelect.addEventListener("change", () =>
        renderPermissionSummary(roleSelect.value),
    );
    scopePicker()?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="staffDetailScopeOptions"]'))
            syncScopePicker(event.target);
    });
    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!profileForm.reportValidity()) return;
        const role = roles[roleSelect.value];
        if (
            !role ||
            role.group !== groupSelect.value ||
            role.status === "inactive"
        ) {
            notify("Chọn chức vụ đang hoạt động trong nhóm tài khoản.");
            return;
        }
        const scopes = selectedScopes();
        if (!scopes.length) {
            notify("Chọn ít nhất một phạm vi phụ trách.");
            return;
        }
        const nextEmail = profileForm.elements.email.value
            .trim()
            .toLocaleLowerCase("vi");
        if (
            people.some(
                (item) =>
                    item.id !== person.id &&
                    (item.email || "").toLocaleLowerCase("vi") === nextEmail,
            )
        ) {
            profileForm.elements.email.setCustomValidity(
                "Email n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c d\u00f9ng cho m\u1ed9t t\u00e0i kho\u1ea3n kh\u00e1c.",
            );
            profileForm.reportValidity();
            return;
        }
        Object.assign(person, {
            name: profileForm.elements.name.value.trim(),
            email: profileForm.elements.email.value.trim(),
            phone: profileForm.elements.phone.value.trim(),
            roleId: roleSelect.value,
            role: role.name,
            accountType: groupSelect.value,
            scope: scopes.join(" · "),
            status: profileForm.elements.status.value,
            loginAllowed: profileForm.elements.loginAllowed.checked,
        });
        render();
        notify(
            "Đã cập nhật hồ sơ trong bản xem thử. Tải lại trang để khôi phục dữ liệu mẫu.",
        );
    });
    profileForm.elements.email.addEventListener("input", () =>
        profileForm.elements.email.setCustomValidity(""),
    );

    passwordForm.elements.password.addEventListener("input", () =>
        passwordForm.elements.confirmPassword.setCustomValidity(""),
    );
    passwordForm.elements.confirmPassword.addEventListener("input", () =>
        passwordForm.elements.confirmPassword.setCustomValidity(""),
    );
    passwordForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!passwordForm.reportValidity()) return;
        if (
            passwordForm.elements.password.value !==
            passwordForm.elements.confirmPassword.value
        ) {
            passwordForm.elements.confirmPassword.setCustomValidity(
                "M\u1eadt kh\u1ea9u nh\u1eadp l\u1ea1i ch\u01b0a kh\u1edbp.",
            );
            passwordForm.reportValidity();
            return;
        }
        notify(
            "Đã mô phỏng cập nhật mật khẩu. Mật khẩu không được lưu trong bản xem thử.",
        );
    });

    loadData();
    render();
})();

/* --- team.js --- */
(() => {
    const tbody = document.querySelector("#staffTableBody");
    const modal = document.querySelector("#staffModal");
    const form = document.querySelector("#staffForm");
    const accountType = document.querySelector("#staffAccountType");
    const roleSelect = document.querySelector("#staffRole");
    if (!tbody || !modal || !form || !accountType || !roleSelect) return;

    const search = document.querySelector('[data-filter="team"]');
    const groupFilter = document.querySelector("[data-staff-type-filter]");
    const roleFilter = document.querySelector("[data-staff-role-filter]");
    const allScope = document.querySelector(
        '#staffScopeOptions input[value="Toàn doanh nghiệp"]',
    );

    function applyFilters() {
        const query = search?.value.trim().toLocaleLowerCase("vi") || "";
        const group = groupFilter?.value || "";
        const role = roleFilter?.value || "";
        tbody.querySelectorAll("tr[data-staff-id]").forEach((row) => {
            const textMatch =
                !query ||
                row.textContent.toLocaleLowerCase("vi").includes(query);
            const groupMatch = !group || row.dataset.accountType === group;
            const roleMatch = !role || row.dataset.roleId === role;
            row.hidden = !(textMatch && groupMatch && roleMatch);
        });
    }

    function updateRoleOptions() {
        const group = accountType.value;
        let visibleCount = 0;
        roleSelect
            .querySelectorAll("option[data-account-group]")
            .forEach((option) => {
                const visible = option.dataset.accountGroup === group;
                option.hidden = !visible;
                option.disabled = !visible;
                if (visible) visibleCount += 1;
            });
        const first = roleSelect.querySelector(
            "option:not([data-account-group])",
        );
        if (first)
            first.textContent = visibleCount
                ? "Chọn chức vụ"
                : "Chưa có chức vụ trong nhóm này";
        roleSelect.value = "";
        const hint = document.querySelector("#staffRoleHint");
        if (hint)
            hint.textContent = visibleCount
                ? "Chọn chức vụ để áp dụng quyền đã thiết lập."
                : "Nhóm này chưa có chức vụ. Có thể tạo chức vụ trong trang Chức vụ & quyền.";
    }

    function updateScopePicker(changed) {
        const scopeInputs = [
            ...document.querySelectorAll(
                '#staffScopeOptions input[name="scopeOptions"]',
            ),
        ];
        const projectScopes = scopeInputs.filter((input) => input !== allScope);
        if (changed === allScope && allScope?.checked)
            projectScopes.forEach((input) => {
                input.checked = true;
            });
        else if (changed !== allScope && changed) {
            if (projectScopes.some((input) => !input.checked)) {
                if (allScope) allScope.checked = false;
            } else if (allScope) allScope.checked = true;
        }
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        updateRoleOptions();
    }

    function open() {
        form.reset();
        accountType.value = "employee";
        updateRoleOptions();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name?.focus();
    }

    search?.addEventListener("input", applyFilters);
    groupFilter?.addEventListener("change", applyFilters);
    roleFilter?.addEventListener("change", applyFilters);
    accountType.addEventListener("change", updateRoleOptions);
    document
        .querySelector("#staffScopeOptions")
        ?.addEventListener("change", (event) => {
            if (event.target.matches('input[name="scopeOptions"]'))
                updateScopePicker(event.target);
        });
    tbody.addEventListener("click", (event) => {
        const button = event.target.closest("[data-staff-login-toggle]");
        if (!button) return;
        const allowed = button.getAttribute("aria-pressed") !== "true";
        button.classList.toggle("is-allowed", allowed);
        button.classList.toggle("is-blocked", !allowed);
        button.setAttribute("aria-pressed", String(allowed));
        button.innerHTML = allowed
            ? '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> Được phép'
            : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Đã khóa';
    });

    document
        .querySelector("[data-staff-open]")
        ?.addEventListener("click", open);
    document
        .querySelectorAll("[data-staff-close]")
        .forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });
    form.addEventListener("submit", (event) => event.preventDefault());

    const requestedType = new URLSearchParams(location.search).get("type");
    if (
        ["management", "employee", "customer"].includes(requestedType) &&
        groupFilter
    )
        groupFilter.value = requestedType;
    updateRoleOptions();
    applyFilters();
    if (new URLSearchParams(location.search).get("new") === "1") open();
})();

/* --- workflow.js --- */
(() => {
    const modal = document.querySelector("#taskModal");
    const form = document.querySelector("#taskForm");
    if (!modal || !form) return;

    function open() {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        const customerId = new URLSearchParams(location.search).get("customer");
        const option = [...form.elements.customer.options].find(
            (item) => item.value === customerId,
        );
        if (option) {
            form.elements.customer.value = customerId;
            form.elements.project.value = option.dataset.projectCode || "";
            form.elements.customer.dispatchEvent(
                new Event("change", { bubbles: true }),
            );
        }
        form.elements.title.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document.querySelector("[data-task-open]")?.addEventListener("click", open);
    document
        .querySelectorAll("[data-task-close]")
        .forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) close();
    });
    form.elements.customer.addEventListener("change", () => {
        const option = form.elements.customer.selectedOptions[0];
        if (option?.dataset.projectCode)
            form.elements.project.value = option.dataset.projectCode;
    });
    if (new URLSearchParams(location.search).get("new") === "1") {
        open();
        const url = new URL(location.href);
        url.searchParams.delete("new");
        history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
})();

/* --- reports.js: staff report page only --- */
if (document.querySelector("#reportStaffRows")) {
    (() => {
        const monthInput = document.querySelector("#reportMonth");
        const tableBody = document.querySelector("#reportProjectRows");
        if (
            !monthInput ||
            (!tableBody && !document.querySelector("#reportStaffRows"))
        )
            return;

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        monthInput.value = currentMonth;
        monthInput.max = currentMonth;
        monthInput.min = "2020-01";

        const exampleSource = document.querySelector("#reportExampleData");
        const readExampleRows = (type) =>
            [
                ...(exampleSource?.querySelectorAll(
                    `[data-report-example="${type}"]`,
                ) || []),
            ].map((element) => {
                const row = { ...element.dataset };
                delete row.reportExample;
                ["visits", "price", "commissionPercent"].forEach((key) => {
                    if (row[key] != null) row[key] = Number(row[key]);
                });
                return row;
            });
        const monthFactors = (exampleSource?.dataset.monthFactors || "")
            .split(",")
            .map(Number);
        const projects = readExampleRows("project");
        const demoLeads = readExampleRows("lead");
        const demoStaff = readExampleRows("staff");
        const demoBuyers = readExampleRows("buyer");
        const demoUnits = readExampleRows("unit");
        const format = (value) => Math.round(value).toLocaleString("vi-VN");
        const percent = (value, total) =>
            total ? `${Math.round((value / total) * 100)}%` : "0%";
        const formatMoney = (value) =>
            value >= 1
                ? `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
                : `${(value * 1000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} triệu`;

        function getMonthlyData(date) {
            const factor =
                monthFactors[date.getMonth()] *
                Math.pow(
                    0.88,
                    Math.max(0, now.getFullYear() - date.getFullYear()),
                );
            const leads = demoLeads.filter((lead) => {
                const received = dateFor(lead.received || lead.createdAt);
                return (
                    received &&
                    received.getFullYear() === date.getFullYear() &&
                    received.getMonth() === date.getMonth()
                );
            });
            const appointments =
                window.LandiformAppointments?.all?.().filter((appointment) => {
                    const start = dateFor(appointment.start);
                    return (
                        start &&
                        start.getFullYear() === date.getFullYear() &&
                        start.getMonth() === date.getMonth() &&
                        appointment.status !== "Đã hủy"
                    );
                }) || [];
            const rows = projects.map((project) => {
                const projectLeads = leads.filter(
                    (lead) =>
                        (lead.projectCode || lead.project) === project.code,
                );
                const projectAppointments = appointments.filter(
                    (appointment) =>
                        (appointment.projectCode || appointment.project) ===
                        project.code,
                );
                return {
                    ...project,
                    visits: Math.round(project.visits * factor),
                    leads: projectLeads.length,
                    qualified: projectLeads.filter((lead) =>
                        [
                            "Đang tư vấn",
                            "Đã hẹn tham quan",
                            "Đang đàm phán",
                            "Đã giao dịch",
                        ].includes(lead.status),
                    ).length,
                    appointments: projectAppointments.length,
                    deals: projectLeads.filter(
                        (lead) => lead.status === "Đã giao dịch",
                    ).length,
                };
            });
            const totals = rows.reduce(
                (sum, row) => ({
                    leads: sum.leads + row.leads,
                    qualified: sum.qualified + row.qualified,
                    appointments: sum.appointments + row.appointments,
                    deals: sum.deals + row.deals,
                }),
                { leads: 0, qualified: 0, appointments: 0, deals: 0 },
            );
            const buyers = demoBuyers;
            const bookingStatuses = {};
            const bookings = readExampleRows("booking").filter((booking) => {
                const created = dateFor(booking.createdAt || booking.created);
                const status = bookingStatuses[booking.code] || "Chờ duyệt";
                return (
                    created &&
                    created.getFullYear() === date.getFullYear() &&
                    created.getMonth() === date.getMonth() &&
                    !["Đã hủy", "Hoàn tất"].includes(status)
                );
            });
            const leadIds = new Set(leads.map((lead) => lead.id));
            const handoffs = buyers.filter(
                (buyer) =>
                    leadIds.has(buyer.leadId) && buyer.documents !== "Đủ hồ sơ",
            ).length;
            const tasks = {
                uncontacted: leads.filter(
                    (lead) => lead.status === "Chưa liên hệ",
                ).length,
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
            [
                row.visits,
                row.leads,
                row.qualified,
                row.appointments,
                row.deals,
            ].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = format(value);
                tr.append(cell);
            });
            return tr;
        }

        function dateFor(value) {
            const text = String(value || "");
            const localized = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (localized)
                return new Date(
                    Number(localized[3]),
                    Number(localized[2]) - 1,
                    Number(localized[1]),
                );
            const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
            return iso
                ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
                : null;
        }

        function renderStaff(date) {
            const rows = document.querySelector("#reportStaffRows");
            const empty = document.querySelector("#reportStaffEmpty");
            const chart = document.querySelector("#reportStaffRevenueChart");
            if (!rows || !empty || !chart) return;
            const storedStaff = demoStaff;
            const staff = storedStaff.filter(
                (person) =>
                    person?.name &&
                    person.accountType !== "customer" &&
                    person.status !== "Tạm ngưng",
            );
            const leads = demoLeads.filter((lead) => {
                const received = dateFor(lead.received || lead.createdAt);
                return (
                    received &&
                    received.getFullYear() === date.getFullYear() &&
                    received.getMonth() === date.getMonth()
                );
            });
            const appointments = (
                window.LandiformAppointments?.all?.() || []
            ).filter((appointment) => {
                const start = dateFor(appointment.start);
                return (
                    start &&
                    start.getFullYear() === date.getFullYear() &&
                    start.getMonth() === date.getMonth() &&
                    appointment.status !== "Đã hủy"
                );
            });
            const ownerLookup = new Map(
                staff.map((person) => [person.id, person]),
            );
            const byName = new Map(
                staff.map((person) => [
                    person.name.toLocaleLowerCase("vi"),
                    person,
                ]),
            );
            const totals = new Map(
                staff.map((person) => [
                    person.id,
                    {
                        leads: 0,
                        qualified: 0,
                        appointments: 0,
                        deals: 0,
                        revenue: 0,
                        commission: 0,
                    },
                ]),
            );

            function findOwner(id, name) {
                let person = id ? ownerLookup.get(id) : null;
                if (!person && name)
                    person = byName.get(String(name).toLocaleLowerCase("vi"));
                return person;
            }

            leads.forEach((lead) => {
                const person = findOwner(lead.ownerId, lead.owner);
                if (!person) return;
                const stats = totals.get(person.id);
                stats.leads += 1;
                if (
                    [
                        "Đang tư vấn",
                        "Đã hẹn tham quan",
                        "Đang đàm phán",
                        "Đã giao dịch",
                    ].includes(lead.status)
                )
                    stats.qualified += 1;
                if (lead.status === "Đã giao dịch") stats.deals += 1;
            });
            appointments.forEach((appointment) => {
                const person = findOwner(
                    appointment.assigneeId,
                    appointment.assignee,
                );
                if (person) totals.get(person.id).appointments += 1;
            });

            const leadById = new Map(leads.map((lead) => [lead.id, lead]));
            const units = demoUnits;
            const unitById = new Map(units.map((unit) => [unit.id, unit]));
            demoBuyers.forEach((buyer) => {
                const lead = leadById.get(buyer.leadId);
                if (!lead || lead.status !== "Đã giao dịch") return;
                const person = findOwner(lead.ownerId, lead.owner);
                if (!person) return;
                const unit = unitById.get(buyer.productId);
                const revenue = Number(
                    buyer.salePrice ?? buyer.amount ?? unit?.price ?? 0,
                );
                const commissionPercent = Number(
                    unit?.commissionPercent ?? buyer.commissionPercent ?? 2,
                );
                const stats = totals.get(person.id);
                if (!stats || !Number.isFinite(revenue)) return;
                stats.revenue += revenue;
                stats.commission +=
                    (revenue *
                        (Number.isFinite(commissionPercent)
                            ? commissionPercent
                            : 0)) /
                    100;
            });

            const activeRows = staff.map((person) => ({
                person,
                ...(totals.get(person.id) || {
                    leads: 0,
                    qualified: 0,
                    appointments: 0,
                    deals: 0,
                    revenue: 0,
                    commission: 0,
                }),
            }));
            const hasActivity = activeRows.some(
                (row) => row.leads || row.appointments || row.deals,
            );
            const total = activeRows.reduce(
                (sum, row) => ({
                    leads: sum.leads + row.leads,
                    qualified: sum.qualified + row.qualified,
                    appointments: sum.appointments + row.appointments,
                    deals: sum.deals + row.deals,
                    revenue: sum.revenue + row.revenue,
                    commission: sum.commission + row.commission,
                }),
                {
                    leads: 0,
                    qualified: 0,
                    appointments: 0,
                    deals: 0,
                    revenue: 0,
                    commission: 0,
                },
            );
            setText(
                "#reportStaffActive",
                format(
                    activeRows.filter(
                        (row) => row.leads || row.appointments || row.deals,
                    ).length,
                ),
            );
            setText("#reportStaffLeads", format(total.leads));
            setText("#reportStaffDeals", format(total.deals));
            setText("#reportStaffRevenue", formatMoney(total.revenue));
            setText(
                "#reportStaffCommission",
                `Hoa hồng dự kiến: ${formatMoney(total.commission)}`,
            );
            empty.hidden = hasActivity;
            activeRows.sort(
                (a, b) =>
                    b.deals - a.deals ||
                    b.leads - a.leads ||
                    b.appointments - a.appointments ||
                    a.person.name.localeCompare(b.person.name, "vi"),
            );
            rows.replaceChildren(
                ...(hasActivity ? activeRows : []).map(
                    ({
                        person,
                        leads: leadCount,
                        qualified,
                        appointments: appointmentCount,
                        deals,
                        revenue,
                        commission,
                    }) => {
                        const tr = document.createElement("tr");
                        const nameCell = document.createElement("td");
                        const entity = document.createElement("span");
                        entity.className = "screen-entity";
                        const avatar = document.createElement("span");
                        avatar.className = "report-staff-avatar";
                        avatar.textContent = String(person.name)
                            .trim()
                            .split(/\s+/)
                            .slice(-2)
                            .map((part) => part[0])
                            .join("")
                            .toLocaleUpperCase("vi");
                        const nameWrap = document.createElement("span");
                        const name = document.createElement("strong");
                        name.textContent = person.name;
                        nameWrap.append(name);
                        entity.append(avatar, nameWrap);
                        nameCell.append(entity);
                        tr.append(nameCell);
                        const values = [
                            person.role || "Nhân viên",
                            format(leadCount),
                            format(qualified),
                            format(appointmentCount),
                            format(deals),
                            formatMoney(revenue),
                            formatMoney(commission),
                            percent(deals, leadCount),
                        ];
                        values.forEach((value) => {
                            const cell = document.createElement("td");
                            cell.textContent = value;
                            tr.append(cell);
                        });
                        return tr;
                    },
                ),
            );
            const revenueRows = activeRows
                .filter((row) => row.revenue > 0)
                .sort((a, b) => b.revenue - a.revenue);
            chart.replaceChildren();
            if (!revenueRows.length) {
                const message = document.createElement("p");
                message.className = "report-staff-chart-empty";
                message.textContent =
                    "Chưa ghi nhận giao dịch trong kỳ báo cáo này.";
                chart.append(message);
                return;
            }
            const maxRevenue = Math.max(
                ...revenueRows.map((row) => row.revenue),
                1,
            );
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
                bar.style.width = `${Math.max(3, (row.revenue / maxRevenue) * 100)}%`;
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
            const leadRate = previous.totals.leads
                ? Math.round(
                      (Math.abs(leadDelta) / previous.totals.leads) * 100,
                  )
                : 0;
            const dealDelta = data.totals.deals - previous.totals.deals;
            const leadChange = previous.totals.leads
                ? `${leadDelta === 0 ? "Không đổi" : leadDelta > 0 ? "Tăng" : "Giảm"} ${leadRate}% so với tháng trước`
                : data.totals.leads
                  ? "Có hồ sơ mới · tháng trước chưa có dữ liệu"
                  : "Chưa có hồ sơ trong tháng này";
            const dealChange = previous.totals.deals
                ? `${dealDelta === 0 ? "Không đổi" : dealDelta > 0 ? "Tăng" : "Giảm"} ${format(Math.abs(dealDelta))} giao dịch so với tháng trước`
                : data.totals.deals
                  ? `${format(data.totals.deals)} giao dịch · tháng trước chưa có dữ liệu`
                  : "Chưa có giao dịch trong tháng này";
            setText("#reportLeadTotal", format(data.totals.leads));
            setText("#reportLeadChange", leadChange);
            setText("#reportQualifiedTotal", format(data.totals.qualified));
            setText(
                "#reportQualifiedRate",
                `${percent(data.totals.qualified, data.totals.leads)} tổng số khách`,
            );
            setText(
                "#reportAppointmentTotal",
                format(data.totals.appointments),
            );
            setText("#reportDealTotal", format(data.totals.deals));
            setText("#reportDealChange", dealChange);
            setText("#funnelLeadTotal", format(data.totals.leads));
            setText("#funnelQualifiedTotal", format(data.totals.qualified));
            setText(
                "#funnelAppointmentTotal",
                format(data.totals.appointments),
            );
            setText("#funnelDealTotal", format(data.totals.deals));
            const funnelValues = {
                leads: data.totals.leads,
                qualified: data.totals.qualified,
                appointments: data.totals.appointments,
                deals: data.totals.deals,
            };
            Object.entries(funnelValues).forEach(([key, value]) => {
                const bar = document.querySelector(
                    `[data-funnel-bar="${key}"]`,
                );
                if (bar)
                    bar.style.width = `${data.totals.leads ? (value / data.totals.leads) * 100 : 0}%`;
            });
            setText(
                "#reportUncontacted",
                `${format(data.tasks.uncontacted)} khách`,
            );
            setText(
                "#reportUpcoming",
                `${format(data.tasks.appointments)} lịch`,
            );
            setText("#reportHolds", `${format(data.tasks.holds)} yêu cầu`);
            setText("#reportHandoffs", `${format(data.tasks.handoffs)} hồ sơ`);
            const maxTask = Math.max(1, ...Object.values(data.tasks));
            document.querySelectorAll("[data-report-task]").forEach((row) => {
                const value = data.tasks[row.dataset.reportTask] || 0;
                const bar = row.querySelector(".screen-bar > i");
                if (bar) bar.style.width = `${(value / maxTask) * 100}%`;
            });
            tableBody?.replaceChildren(...data.rows.map(renderProject));
            renderStaff(selectedDate);
        }

        monthInput.addEventListener("change", render);
        render();
    })();
}
