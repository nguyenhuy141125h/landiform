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
    if (!form || !modal || !rows || !calendar || !calendarTitle || !appointmentStore) return;

    const dateInput = appointmentStore.dateInput;
    const projectNames = Object.fromEntries([...form.elements.project.options].filter((option) => option.value).map((option) => [option.value, option.textContent.trim()]));
    const customerRows = [...document.querySelectorAll('#appointmentPeopleExamples [data-person-kind="customer"]')];
    const customerProjects = Object.fromEntries(customerRows.map((row) => [row.dataset.id, row.dataset.projectCode]));
    const newCustomerOption = document.querySelector('#appointmentPeopleExamples [data-person-kind="new"]')?.dataset.id || "__new__";
    const customerOptions = [...document.querySelectorAll("#appointmentPeopleExamples [data-person-kind]")]
        .filter((row) => row.dataset.personKind !== "staff")
        .map((row) => ({ value: row.dataset.id, label: row.dataset.name, phone: row.dataset.phone || "" }));
    const staff = [...document.querySelectorAll('#appointmentPeopleExamples [data-person-kind="staff"]')]
        .map((row) => ({ id: row.dataset.id, name: row.dataset.name, role: row.dataset.role, scope: row.dataset.project, status: row.dataset.status }));
    const toast = document.querySelector("#toastMessage");
    const projectFilter = document.querySelector("#appointmentProjectFilter");
    const assigneeHint = document.querySelector("#appointmentAssigneeHint");
    const placeHint = document.querySelector("#appointmentPlaceHint");
    const deleteButton = document.querySelector("[data-appointment-delete]");
    const cancelAppointmentButton = document.querySelector("[data-appointment-cancel]");
    const productContext = document.querySelector("#appointmentProductContext");
    const productDisplay = document.querySelector("#appointmentProductDisplay");
    const newCustomerFields = document.querySelector("#appointmentNewCustomerFields");
    const newCustomerName = form.elements.newCustomerName;
    const newCustomerPhone = form.elements.newCustomerPhone;
    const customerSearch = document.querySelector("#appointmentCustomerSearch");
    const customerOptionsList = document.querySelector("#appointmentCustomerOptions");
    const viewButtons = document.querySelectorAll("[data-appointment-view]");
    const calendarModeButtons = document.querySelectorAll("[data-calendar-mode]");
    let editingId = null;
    let view = "upcoming";
    let calendarMode = "month";
    let calendarDate = new Date();
    let customerSearchHasQuery = false;
    let toastTimer;
    let appointments = appointmentStore.all();

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
    }

    function formatStart(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian";
        return new Intl.DateTimeFormat("vi-VN", {
            weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        }).format(date);
    }

    function setProductReference(productId = "") {
        const product = window.LandiformInventory?.all().find((item) => item.id === productId);
        form.elements.productId.value = product?.id || "";
        productContext.hidden = !product;
        productDisplay.value = product ? `${product.code} · ${product.type} · ${product.area} m²` : "";
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
        const currentLabel = customerOptions.find((option) => option.value === selected)?.label;
        const query = customerSearchHasQuery && !(selected && selected !== newCustomerOption && customerSearch.value === currentLabel)
            ? customerSearch.value.trim().toLocaleLowerCase("vi")
            : "";
        const visible = customerOptions.filter((option) => {
            if (!option.value) return false;
            if (option.value === newCustomerOption) return true;
            if (!query) return false;
            if (option.value === selected) return true;
            return `${option.label} ${option.phone}`.toLocaleLowerCase("vi").includes(query);
        });
        customerOptionsList.replaceChildren(...visible.map((option) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `appointment-customer-option${option.value === newCustomerOption ? " is-create" : ""}`;
            button.setAttribute("role", "option");
            button.setAttribute("aria-selected", String(option.value === selected));
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
        }));
        customerOptionsList.hidden = !open;
        customerSearch.setAttribute("aria-expanded", String(open));
    }

    function chooseCustomer(value) {
        const option = customerOptions.find((item) => item.value === value);
        if (!option) return;
        form.elements.customer.value = value;
        customerSearch.value = value === newCustomerOption ? "Tạo hồ sơ khách hàng mới" : option.label;
        customerSearch.setCustomValidity("");
        form.elements.customer.dispatchEvent(new Event("change", { bubbles: true }));
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
        const selectedOption = customerOptions.find((option) => option.value === selected);
        if (selected === newCustomerOption || (selected && customerSearch.value !== selectedOption?.label)) {
            form.elements.customer.value = "";
            setNewCustomerMode();
        }
        customerSearch.setCustomValidity("");
        syncCustomerOptions(true);
    });

    customerSearch.addEventListener("keydown", (event) => {
        const options = [...customerOptionsList.querySelectorAll("[data-customer-choice]")];
        const active = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
        if (event.key === "Escape") {
            syncCustomerOptions(false);
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!options.length) return;
            const next = event.key === "ArrowDown"
                ? Math.min(active < 0 ? 0 : active + 1, options.length - 1)
                : Math.max(active < 0 ? options.length - 1 : active - 1, 0);
            options.forEach((option, index) => option.setAttribute("aria-selected", String(index === next)));
            customerSearch.setAttribute("aria-activedescendant", options[next].id || (options[next].id = `appointment-customer-option-${next}`));
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
        if (!event.target.closest(".appointment-customer-picker")) syncCustomerOptions(false);
    });

    function statusTone(status) {
        return ({ "Chờ phân công": "amber", "Đã phân công": "blue", "Hoàn tất": "green", "Đã hủy": "neutral" })[status] || "neutral";
    }

    function appointmentDetailHref(appointment) {
        const params = new URLSearchParams({
            type: "appointment",
            id: appointment.id,
            customer: appointment.customerName || "",
            project: projectNames[appointment.project] || appointment.project || "",
            product: window.LandiformInventory?.all().find((item) => item.id === appointment.productId)?.code || "",
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
            const scopes = Array.isArray(person.scopes) ? person.scopes : (Array.isArray(person.scope) ? person.scope : [person.scope || "Toàn doanh nghiệp"]);
            return person.name && person.accountType !== "customer" && person.status !== "Tạm ngưng" && person.loginAllowed !== false &&
                (scopes.includes("Toàn doanh nghiệp") || Boolean(project && scopes.some((scope) => scope?.includes(project))));
        });
    }

    function fillAssignees(preserve = "") {
        const select = form.elements.assignee;
        select.replaceChildren(new Option("Chưa phân công", ""));
        const load = (name) => appointments.filter((item) =>
            item.id !== editingId && item.assignee === name && !["Hoàn tất", "Đã hủy"].includes(item.status) &&
            new Date(item.start).getTime() >= Date.now()
        ).length;
        const people = eligibleStaff(form.elements.project.value).sort((a, b) => load(a.name) - load(b.name));
        people.forEach((person) => select.add(new Option(`${person.name} · ${load(person.name)} lịch sắp tới`, person.name)));
        if (preserve && !people.some((person) => person.name === preserve)) {
            select.add(new Option(`${preserve} (đã phân công trước đây)`, preserve));
        }
        select.value = preserve || "";
        assigneeHint.textContent = form.elements.project.value
            ? people.length ? `${people.length} nhân viên phù hợp. Không thể phân công trùng giờ hẹn.` : "Chưa có nhân viên tư vấn cho dự án này. Tạo nhân viên trong mục Nhân sự."
            : "Chọn dự án để xem nhân viên phù hợp.";
    }

    function syncActivityDetails() {
        const type = form.elements.type.value;
        const project = projectNames[form.elements.project.value] || "dự án";
        const details = {
            "Tư vấn tại văn phòng": { required: true, placeholder: "Ví dụ: Văn phòng An Phát Land", hint: "Cần ghi nơi khách và nhân viên sẽ gặp." },
            "Dẫn khách xem nhà": { required: true, placeholder: `Ví dụ: Điểm đón tại ${project}`, hint: "Cần ghi địa chỉ hoặc điểm đón khách đi xem nhà." },
            "Tham quan nhà mẫu": { required: true, placeholder: `Ví dụ: Nhà mẫu ${project}`, hint: "Cần ghi địa điểm nhà mẫu để khách dễ tìm." },
            "Bàn giao nhà": { required: true, placeholder: "Ví dụ: Sảnh tòa và căn hộ bàn giao", hint: "Cần ghi địa điểm bàn giao cụ thể." },
            "Gọi tư vấn": { required: false, placeholder: "Ví dụ: Gọi vào số điện thoại khách", hint: "Có thể để trống hoặc ghi chú thời điểm/cách gọi." },
            "Họp trực tuyến": { required: true, placeholder: "Dán liên kết Google Meet, Zoom hoặc nền tảng họp", hint: "Cần thêm liên kết để người tham gia vào cuộc họp." },
        }[type] || { required: false, placeholder: "Nhập địa điểm hoặc cách liên hệ", hint: "Thêm địa điểm hoặc cách liên hệ nếu cần." };
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
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        return start;
    }

    function eventKind(type) {
        if (type.includes("Bàn giao")) return "handover";
        if (type.includes("xem nhà") || type.includes("Tham quan")) return "viewing";
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
            const range = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long" });
            calendarTitle.textContent = `${range.format(firstDay)} – ${range.format(lastDay)}${firstDay.getFullYear() === lastDay.getFullYear() ? `, ${lastDay.getFullYear()}` : ` ${firstDay.getFullYear()} – ${lastDay.getFullYear()}`}`;
        } else {
            const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
            firstDay = startOfWeek(monthStart);
            dayCount = Math.ceil((((monthStart.getDay() + 6) % 7) + new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate()) / 7) * 7;
            calendarTitle.textContent = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(calendarDate);
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
            day.setAttribute("aria-label", `Xem lịch ngày ${new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric" }).format(date)}`);
            if (calendarMode === "month" && date.getMonth() !== calendarDate.getMonth()) day.classList.add("is-outside");
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
                    if (localDateKey(new Date(item.start)) !== key || item.status === "Đã hủy") return false;
                    if (projectFilter.value && item.project !== projectFilter.value) return false;
                    if (staffFilter?.value && item.assignee !== staffFilter.value) return false;
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
                time.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(appointment.start));
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
        const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate());
        const dateKey = localDateKey(date);
        calendarTitle.textContent = new Intl.DateTimeFormat("vi-VN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
        }).format(date);

        const dayAppointments = appointments.filter((item) => {
            if (localDateKey(new Date(item.start)) !== dateKey || item.status === "Đã hủy") return false;
            if (projectFilter.value && item.project !== projectFilter.value) return false;
            if (staffFilter?.value && item.assignee !== staffFilter.value) return false;
            return true;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));

        let people = staffFilter?.value
            ? staff.filter((person) => person.name === staffFilter.value)
            : projectFilter.value
                ? eligibleStaff(projectFilter.value)
                : staff.filter((person) => person.name && person.accountType !== "customer" && person.status !== "Tạm ngưng" && person.loginAllowed !== false);
        const displayedNames = new Set(people.map((person) => person.name));
        if (!staffFilter?.value) {
            dayAppointments.forEach((item) => {
                if (item.assignee && !displayedNames.has(item.assignee)) {
                    people = [...people, { name: item.assignee }];
                    displayedNames.add(item.assignee);
                }
            });
        }

        const hasUnassigned = !staffFilter?.value && dayAppointments.some((item) => !item.assignee);
        const columns = [...people.map((person) => ({ name: person.name, unassigned: false }))];
        if (hasUnassigned) columns.push({ name: "Chưa phân công", unassigned: true });

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
            empty.className = "calendar-day-view-staff calendar-day-view-no-staff";
            empty.style.gridColumn = "2 / -1";
            empty.textContent = "Chưa có nhân viên phù hợp với bộ lọc.";
            header.append(empty);
        }
        view.append(header);

        const appointmentHours = dayAppointments.map((item) => new Date(item.start).getHours());
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
                slot.dataset.calendarAssignee = column.unassigned ? "" : column.name;
                slot.tabIndex = 0;
                slot.setAttribute("role", "button");
                slot.setAttribute("aria-label", `${dateKey}, ${pad(hour)}:00, ${column.name}: xếp lịch hẹn`);
                dayAppointments
                    .filter((item) => new Date(item.start).getHours() === hour && (column.unassigned ? !item.assignee : item.assignee === column.name))
                    .forEach((appointment) => {
                        slot.classList.add("has-appointment");
                        const event = document.createElement("button");
                        event.type = "button";
                        event.className = `calendar-event ${eventKind(appointment.type)}`;
                        event.dataset.calendarEvent = appointment.id;
                        event.title = `${appointment.customerName} · ${appointment.type}`;
                        const eventTime = document.createElement("span");
                        eventTime.className = "calendar-event-time";
                        eventTime.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(appointment.start));
                        const title = document.createElement("strong");
                        title.textContent = appointment.type;
                        const customer = document.createElement("small");
                        customer.textContent = appointment.customerName;
                        event.append(eventTime, title, customer);
                        const start = new Date(appointment.start);
                        const durationMinutes = Math.max(30, Number(appointment.duration) || 60);
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
        document.querySelector("#calendarDayTitle").textContent = new Intl.DateTimeFormat("vi-VN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
        }).format(date);
        const dayAppointments = appointments
            .filter((item) => {
                if (localDateKey(new Date(item.start)) !== dateKey || item.status === "Đã hủy") return false;
                if (projectFilter.value && item.project !== projectFilter.value) return false;
                if (staffFilter?.value && item.assignee !== staffFilter.value) return false;
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
            time.textContent = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(appointment.start));
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
        const upcoming = appointments.filter((item) =>
            !["Hoàn tất", "Đã hủy"].includes(item.status) && new Date(item.start).getTime() >= now
        );
        const unassigned = appointments.filter((item) => item.status === "Chờ phân công" && !item.assignee);
        document.querySelector("#appointmentUpcomingCount").textContent = String(upcoming.length);
        document.querySelector("#appointmentUnassignedCount").textContent = String(unassigned.length);
        viewButtons.forEach((button) => {
            const active = button.dataset.appointmentView === view;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
        const matching = appointments.filter((item) =>
            (view === "all" || (view === "unassigned" ? item.status === "Chờ phân công" && !item.assignee : upcoming.includes(item))) &&
            (!projectFilter.value || item.project === projectFilter.value) &&
            (!staffFilter?.value || item.assignee === staffFilter.value)
        ).sort((a, b) => new Date(a.start) - new Date(b.start));
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
            const linkedProduct = appointment.productId && window.LandiformInventory?.all().find((item) => item.id === appointment.productId);
            meta.textContent = `${projectNames[appointment.project] || "Dự án"}${appointment.place ? ` · ${appointment.place}` : ""}${linkedProduct ? ` · Sản phẩm ${linkedProduct.code}` : ""}`;
            contentCell.append(title, meta);
            row.append(contentCell);
            const assignee = createCell(appointment.assignee || "Chưa phân công");
            if (!appointment.assignee) assignee.className = "appointment-unassigned";
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
            action.textContent = appointment.assignee ? "Xem / sửa" : "Phân công";
            actionCell.append(action);
            row.append(actionCell);
            rows.append(row);
        }
        if (!matching.length) {
            const row = document.createElement("tr");
            const cell = createCell(view === "upcoming" ? "Không có lịch hẹn sắp tới trong mục này." : "Không có lịch hẹn phù hợp.");
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
        const requestedProductId = new URLSearchParams(location.search).get("product");
        deleteButton.hidden = !appointment;
        cancelAppointmentButton.hidden = !appointment || ["Hoàn tất", "Đã hủy"].includes(appointment.status);
        document.querySelector("#appointmentModalTitle").textContent = appointment
            ? "Xem và phân công lịch hẹn"
            : requestedProductId ? "Lên lịch gọi tư vấn" : "Tạo lịch hẹn khách hàng";
        if (appointment) {
            for (const field of ["customer", "project", "start", "type", "place", "status"]) {
                form.elements[field].value = appointment[field] || "";
            }
            customerSearch.value = customerOptions.find((option) => option.value === appointment.customer)?.label || "";
            setNewCustomerMode();
            setProductReference(appointment.productId || "");
            fillAssignees(appointment.assignee);
        } else {
            const customerId = new URLSearchParams(location.search).get("customer");
            const params = new URLSearchParams(location.search);
            if (customerId && customerProjects[customerId]) {
                form.elements.customer.value = customerId;
                customerSearch.value = customerOptions.find((option) => option.value === customerId)?.label || "";
                form.elements.project.value = customerProjects[customerId];
            }
            form.elements.start.value = startValue || dateInput(1, 9);
            const linkedProduct = setProductReference(requestedProductId || "");
            if (linkedProduct) form.elements.project.value = linkedProduct.projectCode;
            const requestedActivity = params.get("activity");
            if (requestedActivity && [...form.elements.type.options].some((option) => option.value === requestedActivity)) form.elements.type.value = requestedActivity;
            if (form.elements.type.value === "Gọi tư vấn" && !form.elements.place.value) form.elements.place.value = "Gọi điện cho khách";
            fillAssignees(assigneeValue);
            if (assigneeValue) form.elements.status.value = "Đã phân công";
        }
        syncActivityDetails();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        (appointment || form.elements.customer.value ? form.elements.assignee : customerSearch).focus();
    }

    document.querySelector("[data-appointment-open]")?.addEventListener("click", () => open());
    document.querySelectorAll("[data-appointment-close]").forEach((button) => button.addEventListener("click", close));
    cancelAppointmentButton?.addEventListener("click", () => {
        const appointment = appointments.find((item) => item.id === editingId);
        if (!appointment || ["Hoàn tất", "Đã hủy"].includes(appointment.status)) return;
        document.dispatchEvent(new CustomEvent("landiform:backend-action", { detail: { entity: "appointment", action: "cancel", id: editingId } }));
        close();
        notify("Thao tác hủy lịch đã sẵn sàng để kết nối backend.");
    });
    deleteButton?.addEventListener("click", () => {
        const appointment = appointments.find((item) => item.id === editingId);
        if (!appointment) return;
        document.dispatchEvent(new CustomEvent("landiform:backend-action", { detail: { entity: "appointment", action: "delete", id: editingId } }));
        close();
        notify("Thao tác xóa lịch đã sẵn sàng để kết nối backend.");
    });
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!modal.hidden) close();
        else if (calendarDayModal && !calendarDayModal.hidden) closeDayAgenda();
    });
    viewButtons.forEach((button) => button.addEventListener("click", () => { view = button.dataset.appointmentView; render(); }));
    calendarModeButtons.forEach((button) => button.addEventListener("click", () => {
        calendarMode = button.dataset.calendarMode;
        renderCalendar();
    }));
    document.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
        if (calendarMode === "day") calendarDate.setDate(calendarDate.getDate() - 1);
        else if (calendarMode === "week") calendarDate.setDate(calendarDate.getDate() - 7);
        else calendarDate.setMonth(calendarDate.getMonth() - 1, 1);
        renderCalendar();
    });
    document.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
        if (calendarMode === "day") calendarDate.setDate(calendarDate.getDate() + 1);
        else if (calendarMode === "week") calendarDate.setDate(calendarDate.getDate() + 7);
        else calendarDate.setMonth(calendarDate.getMonth() + 1, 1);
        renderCalendar();
    });
    document.querySelector("[data-calendar-today]")?.addEventListener("click", () => {
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
            open(null, slot.dataset.calendarSlot, slot.dataset.calendarAssignee);
            return;
        }
        const day = event.target.closest(".calendar-day");
        if (day) openDayAgenda(day.dataset.calendarDate);
    });
    calendar.addEventListener("keydown", (event) => {
        if (event.target.matches("[data-calendar-slot]") && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            open(null, event.target.dataset.calendarSlot, event.target.dataset.calendarAssignee);
            return;
        }
        if (event.target.matches(".calendar-day") && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            openDayAgenda(event.target.dataset.calendarDate);
        }
    });
    calendarDayModal?.addEventListener("click", (event) => {
        if (event.target === calendarDayModal || event.target.closest("[data-calendar-day-close]")) {
            closeDayAgenda();
            return;
        }
        const editButton = event.target.closest("[data-calendar-day-edit]");
        if (editButton) {
            const appointment = appointments.find((item) => item.id === editButton.dataset.calendarDayEdit);
            if (appointment) window.location.href = appointmentDetailHref(appointment);
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
        customerSearch.value = selected === newCustomerOption
            ? "Tạo hồ sơ khách hàng mới"
            : customerOptions.find((option) => option.value === selected)?.label || "";
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
        if (["Chờ phân công", "Đã phân công"].includes(form.elements.status.value)) {
            form.elements.status.value = form.elements.assignee.value ? "Đã phân công" : "Chờ phân công";
        }
    });
    form.elements.status.addEventListener("change", () => form.elements.assignee.setCustomValidity(""));
    form.elements.start.addEventListener("input", () => form.elements.start.setCustomValidity(""));
    newCustomerName.addEventListener("input", () => newCustomerName.setCustomValidity(""));
    newCustomerPhone.addEventListener("input", () => newCustomerPhone.setCustomValidity(""));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.elements.customer.value) {
            customerSearch.setCustomValidity("Chọn khách hàng hoặc tạo hồ sơ khách hàng mới.");
            customerSearch.reportValidity();
            return;
        }
        customerSearch.setCustomValidity("");
        const start = new Date(form.elements.start.value);
        const previous = appointments.find((item) => item.id === editingId);
        if (Number.isNaN(start.getTime()) || ((!previous || previous.start !== form.elements.start.value) && start <= new Date())) {
            form.elements.start.setCustomValidity("Chọn ngày và giờ hẹn trong tương lai.");
            form.reportValidity();
            return;
        }
        const assignee = form.elements.assignee.value;
        const linkedProduct = window.LandiformInventory?.all().find((item) => item.id === form.elements.productId.value);
        if (linkedProduct && linkedProduct.projectCode !== form.elements.project.value) {
            customerSearch.setCustomValidity("Khách hàng và sản phẩm phải thuộc cùng dự án để gắn đúng lịch tư vấn.");
            form.reportValidity();
            return;
        }
        customerSearch.setCustomValidity("");
        let status = form.elements.status.value;
        if (!["Hoàn tất", "Đã hủy"].includes(status)) status = assignee ? "Đã phân công" : "Chờ phân công";
        if (status === "Hoàn tất" && !assignee) {
            form.elements.assignee.setCustomValidity("Chọn nhân viên tư vấn trước khi hoàn tất lịch hẹn.");
            form.reportValidity();
            return;
        }
        const conflict = assignee && !["Hoàn tất", "Đã hủy"].includes(status) && appointments.some((item) =>
            item.id !== editingId && item.assignee === assignee && !["Đã hủy", "Hoàn tất"].includes(item.status) &&
            Math.abs(new Date(item.start).getTime() - start.getTime()) < 60 * 60 * 1000
        );
        if (conflict) {
            form.elements.start.setCustomValidity(`${assignee} đã có lịch hẹn gần thời gian này. Chọn giờ khác hoặc người tư vấn khác.`);
            form.reportValidity();
            return;
        }
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "appointment", id: editingId, values: new FormData(form) },
        }));
        close();
        notify("Thông tin lịch hẹn đã sẵn sàng để kết nối backend.");
    });
    if (new URLSearchParams(location.search).get("appointment") === "1") open();
    render();
})();

